"use client";

import { motion } from "framer-motion";
import { User, Volume2, Loader2 } from "lucide-react";
import Image from "next/image";
import type { Message } from "@/lib/nova-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useNovaStore, AI_PERSONAS } from "@/lib/nova-store";

interface ChatMessageProps {
  message: Message;
  onSpeak?: (text: string, voice?: string) => Promise<void>;
  voiceEnabled?: boolean;
  isGroupChat?: boolean;
}

export function ChatMessage({ message, onSpeak, voiceEnabled, isGroupChat }: ChatMessageProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { selectedPersona } = useNovaStore();
  const isUser = message.role === "user";

  // Get persona info for this message
  const messagePersona = message.personaId 
    ? AI_PERSONAS.find((p) => p.id === message.personaId) 
    : selectedPersona;

  const handleSpeak = async () => {
    if (onSpeak && !isSpeaking && messagePersona) {
      setIsSpeaking(true);
      try {
        await onSpeak(message.content, messagePersona.voice);
      } finally {
        setIsSpeaking(false);
      }
    }
  };

  // Use the persona color for this specific message
  const personaColor = messagePersona?.color || "violet";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-3 p-4 rounded-2xl",
        isUser ? `bg-${personaColor}-500/10` : "bg-muted/50"
      )}
    >
      <div className="flex-shrink-0">
        {isUser ? (
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r", selectedPersona.gradient)}>
            <User className="w-4 h-4 text-white" />
          </div>
        ) : (
          <div className={cn("w-8 h-8 rounded-full overflow-hidden border-2", `border-${personaColor}-500/50`)}>
            <Image
              src={messagePersona?.avatar || "/ai-nova.png"}
              alt={messagePersona?.name || "AI"}
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("font-medium text-sm", `text-${personaColor}-500`)}>
            {isUser ? "You" : messagePersona?.name || "AI"}
          </span>
          {!isUser && voiceEnabled && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleSpeak}
              disabled={isSpeaking}
            >
              {isSpeaking ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Volume2 className="w-3 h-3" />
              )}
            </Button>
          )}
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="text-foreground/90 leading-relaxed">{children}</p>,
              code: ({ className, children, ...props }) => {
                const isInline = !className;
                return isInline ? (
                  <code className={cn("px-1.5 py-0.5 rounded text-sm", `bg-${personaColor}-500/20`)} {...props}>
                    {children}
                  </code>
                ) : (
                  <code className="block bg-muted p-3 rounded-lg text-sm overflow-x-auto" {...props}>
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => <div className="overflow-x-auto my-2">{children}</div>,
              ul: ({ children }) => <ul className="list-disc pl-4 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1">{children}</ol>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
}
