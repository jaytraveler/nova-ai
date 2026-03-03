import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/nova/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Multi-AI Platform - 7 Unique AI Companions",
  description: "Choose from 7 unique AI companions, each with their own personality and voice. Nova, Echo, Atlas, Orion, Luna, Spark, and Zen are ready to chat!",
  keywords: ["AI Assistant", "Voice AI", "Chat", "Artificial Intelligence", "Multiple AI", "Nova AI", "Echo AI"],
  authors: [{ name: "Multi-AI Platform Team" }],
  icons: {
    icon: "/ai-nova.png",
  },
  openGraph: {
    title: "Multi-AI Platform - 7 Unique AI Companions",
    description: "Experience 7 unique AI personalities, each with their own voice and character",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <SessionProvider>{children}</SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
