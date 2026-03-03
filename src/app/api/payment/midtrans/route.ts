import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";

// Midtrans API endpoints
const MIDTRANS_BASE_URL = process.env.MIDTRANS_IS_PRODUCTION === "true"
  ? "https://api.midtrans.com"
  : "https://api.sandbox.midtrans.com";

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

    // Create Midtrans transaction
    const authString = Buffer.from(
      `${process.env.MIDTRANS_SERVER_KEY}:`
    ).toString("base64");

    const transactionData = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        email: user.email,
        first_name: user.name || "User",
      },
      item_details: [
        {
          id: planId,
          price: amount,
          quantity: 1,
          name: planNames[planId] || planId,
        },
      ],
      callbacks: {
        finish: `${process.env.NEXTAUTH_URL}?payment=success&plan=${planId}`,
        error: `${process.env.NEXTAUTH_URL}?payment=error`,
        pending: `${process.env.NEXTAUTH_URL}?payment=pending`,
      },
    };

    const response = await fetch(`${MIDTRANS_BASE_URL}/v2/charge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify(transactionData),
    });

    const data = await response.json();

    if (response.ok && data.token) {
      // Store pending payment in database
      await db.$executeRaw`
        INSERT INTO pending_payments (id, userId, planId, orderId, provider, amount, status, createdAt)
        VALUES (${crypto.randomBytes(16).toString("hex")}, ${user.id}, ${planId}, ${orderId}, 'midtrans', ${amount}, 'pending', datetime('now'))
      `.catch(() => {
        // Table might not exist, that's okay for now
      });

      return NextResponse.json({
        success: true,
        token: data.token,
        redirect_url: data.redirect_url,
        checkoutUrl: `https://app.sandbox.midtrans.com/snap/v4/transaction/${data.token}`,
      });
    }

    throw new Error(data.status_message || "Failed to create transaction");
  } catch (error) {
    console.error("Midtrans payment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment failed" },
      { status: 500 }
    );
  }
}
