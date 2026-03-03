import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendVerificationEmail, generateVerificationCode } from "@/lib/email";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate verification code
    const code = generateVerificationCode();

    // Set expiration to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete any existing unused sign-in codes for this email
    await db.verificationCode.deleteMany({
      where: {
        email,
        type: "signin_verification",
        used: false,
      },
    });

    // Save verification code for sign-in
    await db.verificationCode.create({
      data: {
        email,
        code,
        type: "signin_verification",
        expiresAt,
      },
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(email, code);

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email",
    });
  } catch (error) {
    console.error("Sign-in verification error:", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}
