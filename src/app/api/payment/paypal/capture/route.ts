import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// PayPal API
const PAYPAL_BASE_URL = process.env.PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, planId } = body;

    if (!orderId || !planId) {
      return NextResponse.json({ error: "Missing orderId or planId" }, { status: 400 });
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Capture the PayPal order
    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (response.ok && data.status === "COMPLETED") {
      // Get user
      const user = await db.user.findUnique({
        where: { email: session.user.email },
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

        console.log(`PayPal: Subscription updated for ${session.user.email} to ${planId}`);
      }

      return NextResponse.json({
        success: true,
        message: "Payment captured and subscription updated",
      });
    }

    throw new Error(data.message || "Failed to capture payment");
  } catch (error) {
    console.error("PayPal capture error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Capture failed" },
      { status: 500 }
    );
  }
}
