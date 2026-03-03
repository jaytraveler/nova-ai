import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Xendit webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Xendit sends callback verification token in header
    const callbackToken = request.headers.get("x-callback-token");
    
    // You should verify this token matches your Xendit callback verification token
    // For now, we'll process all callbacks

    const eventType = body.event;
    const invoiceId = body.id;
    const externalId = body.external_id;
    const status = body.status;
    const amount = body.paid_amount;
    const userEmail = body.payer_email;

    // Parse external ID to get plan info
    // Format: NOVA-{PLAN}-{TIMESTAMP}-{RANDOM}
    const parts = externalId?.split("-") || [];
    const planId = parts[1]?.toLowerCase();

    // Check if payment is successful
    const isSuccess = 
      eventType === "invoice.paid" || 
      status === "PAID" ||
      status === "SETTLED";

    if (isSuccess && planId && userEmail) {
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

        console.log(`Xendit: Subscription updated for ${userEmail} to ${planId}`);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Xendit webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook failed" },
      { status: 500 }
    );
  }
}
