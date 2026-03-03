import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { PAYMENT_PLANS } from "@/lib/payment-config";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";

// Stripe price IDs (you need to create these in Stripe Dashboard)
const STRIPE_PRICES: Record<string, Record<string, string>> = {
  pro: {
    month: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "price_pro_monthly",
    year: process.env.STRIPE_PRO_YEARLY_PRICE_ID || "price_pro_yearly",
  },
  enterprise: {
    month: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || "price_enterprise_monthly",
    year: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || "price_enterprise_yearly",
  },
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId, interval = "month" } = await req.json();
    
    const plan = PAYMENT_PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const priceId = STRIPE_PRICES[planId]?.[interval];

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: priceId
        ? [{ price: priceId, quantity: 1 }]
        : [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `Nova AI - ${plan.name} Plan`,
                  description: plan.features.join(", "),
                },
                unit_amount: plan.price * 100, // Stripe expects cents
                recurring: { interval },
              },
              quantity: 1,
            },
          ],
      mode: "subscription",
      success_url: `${baseUrl}?payment=success&provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}?payment=cancel&provider=stripe`,
      customer_email: user.email || undefined,
      metadata: {
        userId: session.user.id,
        planId,
        interval,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          planId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      checkoutUrl: checkoutSession.url,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (error) {
    console.error("Stripe payment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment failed" },
      { status: 500 }
    );
  }
}
