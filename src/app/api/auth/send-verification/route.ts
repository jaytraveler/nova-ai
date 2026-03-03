import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendVerificationEmail, generateVerificationCode } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user already exists and is verified
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser?.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 });
    }

    // Generate verification code
    const code = generateVerificationCode();

    // Set expiration to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete any existing unused codes for this email
    await db.verificationCode.deleteMany({
      where: {
        email,
        type: "email_verification",
        used: false,
      },
    });

    // Save new verification code
    await db.verificationCode.create({
      data: {
        email,
        code,
        type: "email_verification",
        expiresAt,
      },
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(email, code);

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send verification email. Please check your email configuration." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email",
    });
  } catch (error) {
    console.error("Send verification error:", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}
