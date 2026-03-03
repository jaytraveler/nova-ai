import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import ZAI from "z-ai-web-dev-sdk";

// Preprocess text for more natural TTS with proper pauses
function preprocessTextForTTS(text: string): string {
  let processed = text;

  // Remove markdown formatting (keep the text content)
  processed = processed.replace(/\*\*\*(.*?)\*\*\*/g, "$1");
  processed = processed.replace(/\*\*(.*?)\*\*/g, "$1");
  processed = processed.replace(/\*(.*?)\*/g, "$1");
  processed = processed.replace(/__(.*?)__/g, "$1");
  processed = processed.replace(/_(.*?)_/g, "$1");
  processed = processed.replace(/~~(.*?)~~/g, "$1");
  
  // Remove inline code backticks but keep content
  processed = processed.replace(/`([^`]+)`/g, "$1");

  // Remove code blocks entirely (hard to read aloud)
  processed = processed.replace(/```[\s\S]*?```/g, "");
  processed = processed.replace(/```[\s\S]*$/g, "");

  // Remove links but keep text
  processed = processed.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove headers markers
  processed = processed.replace(/^#{1,6}\s+/gm, "");

  // Remove list markers but keep the text
  processed = processed.replace(/^[\s]*[-*+]\s+/gm, "");
  processed = processed.replace(/^[\s]*\d+\.\s+/gm, "");

  // Remove blockquotes
  processed = processed.replace(/^>\s+/gm, "");

  // Remove horizontal rules
  processed = processed.replace(/^[-*_]{3,}$/gm, "");

  // Remove emojis for TTS (they can cause issues)
  processed = processed.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "");

  // Add explicit pauses after sentence-ending punctuation
  // Use comma as a natural pause marker after ! and ?
  processed = processed.replace(/!/g, ". ");  // Exclamation -> period + space for pause
  processed = processed.replace(/\?/g, ". "); // Question -> period + space for pause
  processed = processed.replace(/\.\s*\./g, "."); // Fix double periods
  
  // Ensure proper spacing after punctuation
  processed = processed.replace(/\.([A-Za-z])/g, ". $1");
  processed = processed.replace(/,([A-Za-z])/g, ", $1");

  // Clean up extra whitespace
  processed = processed.replace(/\s+/g, " ").trim();

  // Handle abbreviations for better pronunciation
  const abbreviations: Record<string, string> = {
    "e.g.": "for example",
    "i.e.": "that is",
    "etc.": "etcetera",
    "vs.": "versus",
    "approx.": "approximately",
    "Dr.": "Doctor",
    "Mr.": "Mister",
    "Mrs.": "Misses",
    "Ms.": "Miss",
    "Prof.": "Professor",
  };

  for (const [abbr, replacement] of Object.entries(abbreviations)) {
    const regex = new RegExp(`\\b${abbr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    processed = processed.replace(regex, replacement);
  }

  return processed.trim();
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { text, voice = "tongtong", speed = 0.95 } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Preprocess text for natural speech
    const processedText = preprocessTextForTTS(text);

    if (!processedText || processedText.length === 0) {
      return NextResponse.json({ error: "No speakable content" }, { status: 400 });
    }

    // Limit text length for TTS (1024 char limit)
    const textToSpeak = processedText.slice(0, 900);

    // Check voice limits for non-admin users
    if (session?.user && session.user.role !== "admin") {
      const subscription = await db.subscription.findUnique({
        where: { userId: session.user.id },
      });

      if (subscription && subscription.voiceMinutesUsed >= subscription.voiceMinutesLimit) {
        return NextResponse.json(
          { error: "You've reached your voice minutes limit. Please upgrade your plan." },
          { status: 429 }
        );
      }

      // Increment voice usage
      const estimatedMinutes = Math.ceil(textToSpeak.length / 500);
      await db.subscription.update({
        where: { userId: session.user.id },
        data: { voiceMinutesUsed: { increment: estimatedMinutes } },
      });
    }

    // Create TTS with slightly slower speed for clearer pronunciation
    const zai = await ZAI.create();

    const response = await zai.audio.tts.create({
      input: textToSpeak,
      voice: voice as "tongtong" | "chuichui" | "xiaochen" | "jam" | "kazi" | "douji" | "luodo",
      speed: Math.max(0.5, Math.min(2.0, speed)),
      response_format: "wav",
      stream: false,
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("TTS API error:", error);
    return NextResponse.json(
      { error: "Failed to generate speech. Please try again." },
      { status: 500 }
    );
  }
}
