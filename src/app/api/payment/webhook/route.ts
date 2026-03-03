import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import Stripe from "stripe";

// Handle webhooks from different payment providers
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    const provider = req.nextUrl.searchParams.get("provider") || "stripe";

    if (provider === "stripe" && signature) {
      return handleStripeWebhook(body, signature);
    }

    // Midtrans/Xendit webhook
    const data = JSON.parse(body);
    return handleIndonesianWebhook(data, provider);
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

async function handleStripeWebhook(body: string, signature: string) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2024-11-20.acacia",
  });

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;

    if (userId && planId) {
      const plan = planId === "enterprise" ? "enterprise" : "pro";
      
      await db.subscription.upsert({
        where: { userId },
        update: {
          plan,
          isActive: true,
          messagesLimit: plan === "enterprise" ? 999999 : 999999,
          voiceMinutesLimit: plan === "enterprise" ? 999999 : 100,
        },
        create: {
          userId,
          plan,
          isActive: true,
          messagesLimit: plan === "enterprise" ? 999999 : 999999,
          voiceMinutesLimit: plan === "enterprise" ? 999999 : 100,
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}

async function handleIndonesianWebhook(data: Record<string, unknown>, provider: string) {
  // Midtrans webhook format
  if (provider === "midtrans") {
    const orderId = data.order_id as string;
    const transactionStatus = data.transaction_status as string;
    const fraudStatus = data.fraud_status as string;

    if (
      (transactionStatus === "capture" || transactionStatus === "settlement") &&
      (fraudStatus === "accept" || !fraudStatus)
    ) {
      // Extract user ID from order ID (format: NOVA-{timestamp}-{userId})
      const parts = orderId.split("-");
      if (parts.length >= 3) {
        const userIdPart = parts[parts.length - 1];
        
        // Find user by partial ID match
        const users = await db.user.findMany();
        const user = users.find((u) => u.id.startsWith(userIdPart));

        if (user) {
          // Determine plan from amount
          const grossAmount = Number(data.gross_amount);
          const plan = grossAmount >= 1000000 ? "enterprise" : "pro";

          await db.subscription.upsert({
            where: { userId: user.id },
            update: {
              plan,
              isActive: true,
              messagesLimit: 999999,
              voiceMinutesLimit: plan === "enterprise" ? 999999 : 100,
            },
            create: {
              userId: user.id,
              plan,
              isActive: true,
              messagesLimit: 999999,
              voiceMinutesLimit: plan === "enterprise" ? 999999 : 100,
            },
          });
        }
      }
    }
  }

  // Xendit webhook format
  if (provider === "xendit") {
    const status = data.status as string;
    const externalId = data.external_id as string;

    if (status === "PAID" || status === "SETTLED") {
      const parts = externalId.split("-");
      if (parts.length >= 3) {
        const userIdPart = parts[parts.length - 1];
        
        const users = await db.user.findMany();
        const user = users.find((u) => u.id.startsWith(userIdPart));

        if (user) {
          const amount = Number(data.amount);
          const plan = amount >= 1000000 ? "enterprise" : "pro";

          await db.subscription.upsert({
            where: { userId: user.id },
            update: {
              plan,
              isActive: true,
              messagesLimit: 999999,
              voiceMinutesLimit: plan === "enterprise" ? 999999 : 100,
            },
            create: {
              userId: user.id,
              plan,
              isActive: true,
              messagesLimit: 999999,
              voiceMinutesLimit: plan === "enterprise" ? 999999 : 100,
            },
          });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ status: "Webhook endpoint active" });
}
