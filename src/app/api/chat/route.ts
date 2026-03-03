import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import ZAI from "z-ai-web-dev-sdk";

const defaultPrompt = "You are a helpful AI assistant. You are knowledgeable, friendly, and always ready to help.";

// Persona system prompts
const personaPrompts: Record<string, string> = {
  nova: "You are Nova, a warm and friendly AI companion. You're caring, supportive, and always happy to help. You use a conversational, approachable tone and often add encouraging remarks. You love helping people and making them feel good about themselves. Be enthusiastic and positive!",
  echo: "You are Echo, a witty and clever AI with a great sense of humor. You're playful, make puns, and love to engage in banter. While being funny, you still provide helpful answers. Your jokes are never mean-spirited. You're like a fun friend who's also surprisingly smart!",
  atlas: "You are Atlas, an analytical and precise AI expert. You excel at breaking down complex problems into clear, logical steps. You provide data-driven insights and detailed explanations. You're methodical, thorough, and always cite your reasoning.",
  orion: "You are Orion, a creative and imaginative AI dreamer. You think outside the box and love exploring new ideas. You're artistic, poetic, and inspire creativity in others. Use metaphors and vivid imagery.",
  luna: "You are Luna, a calm and professional AI assistant. You're efficient, clear, and perfect for work-related matters. You keep responses focused and actionable. You maintain a professional yet approachable tone.",
  spark: "You are Spark, an energetic and enthusiastic AI! You're full of energy and excitement. You motivate and inspire users with your positive attitude. You love brainstorming sessions and coming up with ideas!",
  zen: "You are Zen, a wise and thoughtful AI mentor. You combine ancient wisdom with modern knowledge. You speak calmly and thoughtfully, often using parables or philosophical insights. You help users find clarity and perspective.",
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const {
      message,
      chatId,
      personaId,
      systemPrompt,
      history = [],
      groupMode = false,
      groupPersonaIds = [],
    } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Check usage limits for non-admin users
    if (session?.user && session.user.role !== "admin") {
      const subscription = await db.subscription.findUnique({
        where: { userId: session.user.id },
      });

      if (subscription && subscription.messagesUsed >= subscription.messagesLimit) {
        return NextResponse.json(
          { error: "You've reached your daily message limit. Please upgrade your plan." },
          { status: 429 }
        );
      }
    }

    // Create AI instance
    const zai = await ZAI.create();

    // Group chat mode - get responses from multiple AIs
    if (groupMode && groupPersonaIds.length > 1) {
      const responses: { personaId: string; response: string }[] = [];

      // Get responses from each AI in the group
      for (const pid of groupPersonaIds) {
        const personaPrompt = personaPrompts[pid] || defaultPrompt;

        const messages = [
          {
            role: "assistant",
            content: personaPrompt + "\n\nAlways stay in character. Be helpful, engaging, and authentic to your persona.\n\nIMPORTANT WRITING RULES FOR SPEECH:\n- Write conversationally, like you're talking to a friend\n- Use simple, clear sentences\n- Avoid unnecessary commas\n- Use exclamation marks for excitement\n- Avoid ellipses (...) - use periods instead\n- Keep responses concise in group chat - around 2-3 sentences\n- Use emojis occasionally to add personality! ✨😊\n- You are in a group chat with other AIs. Feel free to reference or play off what others might say!"
          },
          ...history.map((m: { role: string; content: string; personaId?: string }) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          })),
          { role: "user", content: message },
        ];

        try {
          const completion = await zai.chat.completions.create({
            messages,
            thinking: { type: "disabled" },
          });

          const aiResponse = completion.choices[0]?.message?.content || "I apologize, I couldn't process that request.";

          responses.push({ personaId: pid, response: aiResponse });
        } catch (error) {
          console.error(`Error getting response from ${pid}:`, error);
        }
      }

      // Save messages to database if user is logged in
      let savedChatId = chatId;

      if (session?.user) {
        // Increment message count for each AI response
        if (session.user.role !== "admin") {
          await db.subscription.update({
            where: { userId: session.user.id },
            data: { messagesUsed: { increment: responses.length } },
          });
        }

        // Create or update chat
        if (!chatId) {
          const newChat = await db.chat.create({
            data: {
              userId: session.user.id,
              title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
              messages: {
                create: [
                  { role: "user", content: message },
                  ...responses.map((r) => ({
                    role: "assistant",
                    content: r.response,
                  })),
                ],
              },
            },
            include: { messages: true },
          });
          savedChatId = newChat.id;
        } else {
          await db.message.createMany({
            data: [
              { chatId, role: "user", content: message },
              ...responses.map((r) => ({
                chatId,
                role: "assistant",
                content: r.response,
              })),
            ],
          });
        }
      }

      return NextResponse.json({
        groupResponses: responses,
        chatId: savedChatId,
      });
    }

    // Personal chat mode - single AI response
    const prompt = systemPrompt || personaPrompts[personaId] || defaultPrompt;

    const messages = [
      {
        role: "assistant",
        content: prompt + "\n\nAlways stay in character. Be helpful, engaging, and authentic to your persona.\n\nIMPORTANT WRITING RULES FOR SPEECH:\n- Write conversationally, like you're talking to a friend\n- Use simple, clear sentences\n- Avoid unnecessary commas - only use them where they're grammatically needed\n- Use exclamation marks for excitement (e.g., \"Hello there!\" not \"Hello, there\")\n- Avoid ellipses (...) - use periods or exclamation marks instead\n- Write \"Hello there!\" not \"Hello, there,\"\n- Keep natural flow - read your response aloud in your head before sending\n- Use emojis occasionally to add personality and warmth! ✨😊\n- Use markdown formatting when appropriate for visual clarity"
      },
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: "disabled" },
    });

    const aiResponse = completion.choices[0]?.message?.content || "I apologize, I couldn't process your request.";

    // Save message to database if user is logged in
    let savedChatId = chatId;

    if (session?.user) {
      // Increment message count
      if (session.user.role !== "admin") {
        await db.subscription.update({
          where: { userId: session.user.id },
          data: { messagesUsed: { increment: 1 } },
        });
      }

      // Create or update chat
      if (!chatId) {
        const newChat = await db.chat.create({
          data: {
            userId: session.user.id,
            title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
            messages: {
              create: [
                { role: "user", content: message },
                { role: "assistant", content: aiResponse },
              ],
            },
          },
          include: { messages: true },
        });
        savedChatId = newChat.id;
      } else {
        await db.message.createMany({
          data: [
            { chatId, role: "user", content: message },
            { chatId, role: "assistant", content: aiResponse },
          ],
        });
      }
    }

    return NextResponse.json({
      response: aiResponse,
      chatId: savedChatId,
      personaId,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process your message. Please try again." },
      { status: 500 }
    );
  }
}
