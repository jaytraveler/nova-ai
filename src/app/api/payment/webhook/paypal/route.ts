import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PayPal webhook handler
const PAYPAL_BASE_URL = process.env.PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

async function verifyPayPalWebhook(body: string, headers: Headers) {
  // In production, you should verify the webhook signature
  // For now, we'll trust the webhook calls
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    
    // Verify webhook (simplified - in production use proper verification)
    await verifyPayPalWebhook(rawBody, request.headers);

    const eventType = body.event_type;
    
    // Handle different PayPal events
    if (eventType === "CHECKOUT.ORDER.APPROVED") {
      // Order approved but not captured - capture it
      const orderId = body.resource?.id;
      
      if (orderId) {
        const auth = Buffer.from(
          `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
        ).toString("base64");
        
        // Get access token
        const tokenResponse = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${auth}`,
          },
          body: "grant_type=client_credentials",
        });
        
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        
        // Capture the payment
        await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }
    }
    
    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const customId = body.resource?.custom_id || body.resource?.supplementary_data?.related_ids?.order_id;
      const amount = body.resource?.amount?.value;
      const payerEmail = body.resource?.payer?.email_address;

      // Parse custom ID to get plan info
      // Format: NOVA-{PLAN}-{TIMESTAMP}-{RANDOM}
      const parts = (customId || "").split("-");
      const planId = parts[1]?.toLowerCase();

      if (planId && payerEmail) {
        // Update user subscription
        const user = await db.user.findUnique({
          where: { email: payerEmail },
          include: { subscription: true },
        });

        if (user) {
          const limits = {
            pro: { messages: 999999, voice: 100 },
            enterprise: { messages: 999999, voice: 999999 },
          };

          const limit = limits[planId as keyof typeof limits] || { messages: 10, voice: 5 };

          if (user.subscription) {
            await db.subscription.update({
              where: { userId: user.id },
              data: {
                plan: planId,
                messagesLimit: limit.messages,
                voiceMinutesLimit: limit.voice,
                messagesUsed: 0,
                voiceMinutesUsed: 0,
                isActive: true,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              },
            });
          } else {
            await db.subscription.create({
              data: {
                userId: user.id,
                plan: planId,
                messagesLimit: limit.messages,
                voiceMinutesLimit: limit.voice,
                isActive: true,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            });
          }

          console.log(`PayPal: Subscription updated for ${payerEmail} to ${planId}`);
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("PayPal webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook failed" },
      { status: 500 }
    );
  }
}
