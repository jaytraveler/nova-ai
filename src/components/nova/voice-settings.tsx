"use client";

import { useNovaStore, VoiceStyle } from "@/lib/nova-store";
import { cn } from "@/lib/utils";
import { Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";

const voices: { id: VoiceStyle; name: string; description: string }[] = [
  { id: "tongtong", name: "Tong Tong", description: "Warm & Friendly" },
  { id: "chuichui", name: "Chui Chui", description: "Lively & Cute" },
  { id: "xiaochen", name: "Xiao Chen", description: "Calm & Professional" },
  { id: "jam", name: "Jam", description: "British Gentleman" },
  { id: "kazi", name: "Kazi", description: "Clear & Standard" },
  { id: "douji", name: "Dou Ji", description: "Natural & Smooth" },
  { id: "luodo", name: "Luo Do", description: "Expressive" },
];

export function VoiceSettings() {
  const { voiceStyle, setVoiceStyle, voiceEnabled, setVoiceEnabled, autoSpeak, setAutoSpeak } = useNovaStore();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground">Voice Response</label>
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
            voiceEnabled ? "bg-violet-500 text-white" : "bg-muted text-muted-foreground"
          )}
        >
          {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          {voiceEnabled ? "On" : "Off"}
        </button>
      </div>

      {voiceEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Voice Style</label>
            <div className="grid grid-cols-2 gap-2">
              {voices.map((v) => (
                <motion.button
                  key={v.id}
                  onClick={() => setVoiceStyle(v.id)}
                  className={cn(
                    "flex flex-col items-start p-2 rounded-lg text-sm transition-all",
                    voiceStyle === v.id
                      ? "bg-violet-500/20 border border-violet-500/50"
                      : "bg-muted hover:bg-muted/80 border border-transparent"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="font-medium">{v.name}</span>
                  <span className="text-xs text-muted-foreground">{v.description}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground">Auto-speak responses</label>
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={cn(
                "relative w-10 h-6 rounded-full transition-colors",
                autoSpeak ? "bg-violet-500" : "bg-muted"
              )}
            >
              <motion.div
                className="absolute top-1 w-4 h-4 bg-white rounded-full"
                animate={{ left: autoSpeak ? 20 : 4 }}
              />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
