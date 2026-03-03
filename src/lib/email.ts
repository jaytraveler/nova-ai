import nodemailer from "nodemailer";

// Create transporter
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send verification code email
export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  try {
    const transporter = getTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || "Nova AI <noreply@nova-ai.com>",
      to: email,
      subject: "Verify Your Email - Nova AI",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8b5cf6; margin: 0;">Nova AI</h1>
            <p style="color: #666; margin-top: 5px;">Multi-AI Chat Platform</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-radius: 16px; padding: 30px; text-align: center;">
            <h2 style="color: #1f2937; margin-top: 0;">Verify Your Email</h2>
            <p style="color: #4b5563; margin-bottom: 25px;">Enter this verification code to complete your registration:</p>
            
            <div style="background: white; border-radius: 12px; padding: 20px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #8b5cf6;">${code}</span>
            </div>
            
            <p style="color: #6b7280; margin-top: 25px; font-size: 14px;">This code will expire in 10 minutes.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
            <p>If you didn't request this email, you can safely ignore it.</p>
            <p style="margin-top: 15px;">© 2024 Nova AI. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

// Generate 6-digit verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
