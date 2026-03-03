import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
        { status: 400 }
      );
    }

    // Find the verification code
    const verificationRecord = await db.verificationCode.findFirst({
      where: {
        email,
        code,
        type: "email_verification",
        used: false,
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
    });

    if (!verificationRecord) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    // Mark code as used
    await db.verificationCode.update({
      where: { id: verificationRecord.id },
      data: { used: true },
    });

    // Update user's emailVerified status if user exists
    const user = await db.user.findUnique({
      where: { email },
    });

    if (user) {
      await db.user.update({
        where: { email },
        data: { emailVerified: true },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}
