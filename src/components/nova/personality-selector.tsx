"use client";

import { motion } from "framer-motion";
import { useNovaStore, PersonalityMode } from "@/lib/nova-store";
import { cn } from "@/lib/utils";
import { Smile, Briefcase, Palette, Brain, Laugh } from "lucide-react";

const personalities: { id: PersonalityMode; name: string; icon: React.ReactNode; description: string }[] = [
  {
    id: "friendly",
    name: "Friendly",
    icon: <Smile className="w-4 h-4" />,
    description: "Warm and caring",
  },
  {
    id: "professional",
    name: "Professional",
    icon: <Briefcase className="w-4 h-4" />,
    description: "Efficient and precise",
  },
  {
    id: "creative",
    name: "Creative",
    icon: <Palette className="w-4 h-4" />,
    description: "Imaginative and artistic",
  },
  {
    id: "analytical",
    name: "Analytical",
    icon: <Brain className="w-4 h-4" />,
    description: "Logical and methodical",
  },
  {
    id: "witty",
    name: "Witty",
    icon: <Laugh className="w-4 h-4" />,
    description: "Humorous and clever",
  },
];

export function PersonalitySelector() {
  const { personalityMode, setPersonalityMode } = useNovaStore();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">Personality Mode</label>
      <div className="flex flex-wrap gap-2">
        {personalities.map((p) => (
          <motion.button
            key={p.id}
            onClick={() => setPersonalityMode(p.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all",
              personalityMode === p.id
                ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30"
                : "bg-muted hover:bg-muted/80"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {p.icon}
            <span>{p.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
