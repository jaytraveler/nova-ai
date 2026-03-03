import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";

// Xendit API
const XENDIT_BASE_URL = "https://api.xendit.co";

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

    // Create Xendit invoice
    const authString = Buffer.from(
      `${process.env.XENDIT_SECRET_KEY}:`
    ).toString("base64");

    const invoiceData = {
      external_id: orderId,
      amount: amount,
      description: `Nova AI - ${planNames[planId] || planId}`,
      payer_email: user.email,
      customer: {
        email: user.email,
        given_names: user.name || "User",
      },
      success_redirect_url: `${process.env.NEXTAUTH_URL}?payment=success&plan=${planId}`,
      failure_redirect_url: `${process.env.NEXTAUTH_URL}?payment=error`,
      currency: "IDR",
      items: [
        {
          name: planNames[planId] || planId,
          quantity: 1,
          price: amount,
        },
      ],
      fees: [
        {
          type: "Admin Fee",
          value: 0,
        },
      ],
    };

    const response = await fetch(`${XENDIT_BASE_URL}/v2/invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify(invoiceData),
    });

    const data = await response.json();

    if (response.ok && data.invoice_url) {
      return NextResponse.json({
        success: true,
        invoiceUrl: data.invoice_url,
        invoiceId: data.id,
        orderId: orderId,
      });
    }

    throw new Error(data.message || "Failed to create invoice");
  } catch (error) {
    console.error("Xendit payment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment failed" },
      { status: 500 }
    );
  }
}
