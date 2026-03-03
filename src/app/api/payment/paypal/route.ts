import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";

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
    const { planId, amount } = body;

    if (!planId || !amount) {
      return NextResponse.json({ error: "Missing planId or amount" }, { status: 400 });
    }

    // Get user
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const planNames: Record<string, string> = {
      pro: "Pro Plan",
      enterprise: "Enterprise Plan",
    };

    const orderId = `NOVA-${planId.toUpperCase()}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create PayPal order
    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: orderId,
          description: `Nova AI - ${planNames[planId] || planId}`,
          amount: {
            currency_code: "USD",
            value: amount.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: "Nova AI",
        return_url: `${process.env.NEXTAUTH_URL}?payment=success&plan=${planId}&provider=paypal`,
        cancel_url: `${process.env.NEXTAUTH_URL}?payment=cancelled`,
        user_action: "PAY_NOW",
      },
    };

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "PayPal-Request-Id": orderId,
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();

    if (response.ok && data.links) {
      // Find the approval URL
      const approveLink = data.links.find(
        (link: { rel: string; href: string }) => link.rel === "approve"
      );

      return NextResponse.json({
        success: true,
        orderId: data.id,
        approveUrl: approveLink?.href,
        customOrderId: orderId,
      });
    }

    throw new Error(data.message || "Failed to create PayPal order");
  } catch (error) {
    console.error("PayPal payment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment failed" },
      { status: 500 }
    );
  }
}
