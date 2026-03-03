import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

// Midtrans webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    const signatureKey = crypto
      .createHash("sha512")
      .update(
        `${body.order_id}${body.status_code}${body.gross_amount}${serverKey}`
      )
      .digest("hex");

    if (signatureKey !== body.signature_key) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Check if transaction is successful
    const transactionStatus = body.transaction_status;
    const fraudStatus = body.fraud_status;
    const orderId = body.order_id;

    // Parse order ID to get plan info
    // Format: NOVA-{PLAN}-{TIMESTAMP}-{RANDOM}
    const parts = orderId.split("-");
    const planId = parts[1]?.toLowerCase();

    if (!planId) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    // Get user email from customer details
    const userEmail = body.customer_details?.email;

    if (!userEmail) {
      return NextResponse.json({ error: "No user email found" }, { status: 400 });
    }

    // Check if payment is successful
    const isSuccess = 
      (transactionStatus === "capture" || transactionStatus === "settlement") &&
      (!fraudStatus || fraudStatus === "accept");

    if (isSuccess) {
      // Update user subscription
      const user = await db.user.findUnique({
        where: { email: userEmail },
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

        console.log(`Subscription updated for ${userEmail} to ${planId}`);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Midtrans webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook failed" },
      { status: 500 }
    );
  }
}
