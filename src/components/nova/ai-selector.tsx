"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useNovaStore, AI_PERSONAS } from "@/lib/nova-store";
import { cn } from "@/lib/utils";
import { X, Sparkles, Users } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function AISelector() {
  const { showAISelector, setShowAISelector, selectedPersona, setSelectedPersona, setChatMode, setShowGroupSelector } = useNovaStore();

  const handleSelectAI = (persona: typeof AI_PERSONAS[0]) => {
    setSelectedPersona(persona);
    setChatMode("personal");
    setShowAISelector(false);
  };

  return (
    <AnimatePresence>
      {showAISelector && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setShowAISelector(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-3xl md:max-h-[80vh] bg-background border border-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-violet-500" />
                  Choose Your AI Companion
                </h2>
                <p className="text-muted-foreground mt-1">
                  Each AI has a unique personality and voice
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAISelector(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* AI Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {AI_PERSONAS.map((persona, index) => (
                  <motion.button
                    key={persona.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelectAI(persona)}
                    className={cn(
                      "relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left",
                      selectedPersona.id === persona.id
                        ? `border-${persona.color}-500 bg-${persona.color}-500/10`
                        : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
                    )}
                  >
                    {selectedPersona.id === persona.id && (
                      <motion.div
                        layoutId="selected-ai"
                        className={cn(
                          "absolute inset-0 rounded-xl border-2",
                          `border-${persona.color}-500`
                        )}
                      />
                    )}

                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 shadow-lg">
                        <Image
                          src={persona.avatar}
                          alt={persona.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className={cn("font-bold text-lg", `text-${persona.color}-500`)}>
                          {persona.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">{persona.tagline}</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {persona.description}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs bg-muted px-2 py-1 rounded-full">
                        Voice: {persona.voice}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Currently: <span className={cn("font-medium", `text-${selectedPersona.color}-500`)}>{selectedPersona.name}</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAISelector(false);
                      setShowGroupSelector(true);
                    }}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Group Chat
                  </Button>
                  <Button
                    onClick={() => setShowAISelector(false)}
                    className={cn("bg-gradient-to-r", selectedPersona.gradient)}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
