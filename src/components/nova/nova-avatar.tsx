"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useNovaStore } from "@/lib/nova-store";

export function NovaAvatar() {
  const { selectedPersona, isTyping } = useNovaStore();

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="relative"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
      >
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${selectedPersona.gradient} opacity-50 blur-xl`}
          animate={{
            scale: isTyping ? [1, 1.2, 1] : 1,
            opacity: isTyping ? [0.5, 0.8, 0.5] : 0.5,
          }}
          transition={{
            duration: 1.5,
            repeat: isTyping ? Infinity : 0,
          }}
        />
        <motion.div
          className={`relative w-28 h-28 rounded-full overflow-hidden border-4 shadow-2xl`}
          style={{
            borderColor: `var(--${selectedPersona.color}-500, rgb(139, 92, 246))`,
            boxShadow: isTyping
              ? `0 0 30px rgba(var(--${selectedPersona.color}-500-rgb, 139, 92, 246), 0.5)`
              : `0 0 20px rgba(var(--${selectedPersona.color}-500-rgb, 139, 92, 246), 0.3)`,
          }}
          animate={{
            boxShadow: isTyping
              ? [
                  `0 0 20px rgba(139, 92, 246, 0.5)`,
                  `0 0 40px rgba(139, 92, 246, 0.8)`,
                  `0 0 20px rgba(139, 92, 246, 0.5)`,
                ]
              : `0 0 20px rgba(139, 92, 246, 0.3)`,
          }}
          transition={{
            duration: 1.5,
            repeat: isTyping ? Infinity : 0,
          }}
        >
          <Image
            src={selectedPersona.avatar}
            alt={selectedPersona.name}
            fill
            className="object-cover"
            priority
          />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <h1 className={`text-2xl font-bold bg-gradient-to-r ${selectedPersona.gradient} bg-clip-text text-transparent`}>
          {selectedPersona.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{selectedPersona.tagline}</p>
        <p className="text-sm text-muted-foreground/80 mt-2 max-w-md">
          {selectedPersona.description}
        </p>
      </motion.div>
    </div>
  );
}
