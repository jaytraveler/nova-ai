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

    // Find the verification code for sign-in
    const verificationRecord = await db.verificationCode.findFirst({
      where: {
        email,
        code,
        type: "signin_verification",
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

    // Get user
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Sign-in verified",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Sign-in complete error:", error);
    return NextResponse.json(
      { error: "Failed to complete sign-in" },
      { status: 500 }
    );
  }
}
