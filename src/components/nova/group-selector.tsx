"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useNovaStore, AI_PERSONAS } from "@/lib/nova-store";
import { cn } from "@/lib/utils";
import { X, Users, Check } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function GroupSelector() {
  const {
    showGroupSelector,
    setShowGroupSelector,
    groupPersonas,
    toggleGroupPersona,
    setChatMode,
    selectedPersona,
    setSelectedPersona,
  } = useNovaStore();

  const handleSelectAI = (personaId: string) => {
    if (groupPersonas.includes(personaId)) {
      // If only one selected, switch to personal mode
      if (groupPersonas.length === 1) {
        const persona = AI_PERSONAS.find((p) => p.id === personaId);
        if (persona) {
          setChatMode("personal");
          setSelectedPersona(persona);
          setShowGroupSelector(false);
        }
      } else {
        toggleGroupPersona(personaId);
      }
    } else {
      toggleGroupPersona(personaId);
    }
  };

  const handleStartGroup = () => {
    if (groupPersonas.length >= 2) {
      setChatMode("group");
      setShowGroupSelector(false);
    }
  };

  const handleSwitchToPersonal = (personaId: string) => {
    const persona = AI_PERSONAS.find((p) => p.id === personaId);
    if (persona) {
      setChatMode("personal");
      setSelectedPersona(persona);
      setShowGroupSelector(false);
    }
  };

  return (
    <AnimatePresence>
      {showGroupSelector && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setShowGroupSelector(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[80vh] bg-background border border-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-violet-500" />
                  Group Chat
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Select 2 or more AIs to chat together
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowGroupSelector(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* AI Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AI_PERSONAS.map((persona, index) => {
                  const isSelected = groupPersonas.includes(persona.id);
                  return (
                    <motion.button
                      key={persona.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelectAI(persona.id)}
                      className={cn(
                        "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all text-center",
                        isSelected
                          ? `border-${persona.color}-500 bg-${persona.color}-500/10`
                          : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
                      )}
                    >
                      {isSelected && (
                        <div className={cn("absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-r", persona.gradient)}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}

                      <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 shadow-lg mb-2">
                        <Image
                          src={persona.avatar}
                          alt={persona.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      
                      <h3 className={cn("font-semibold text-sm", `text-${persona.color}-500`)}>
                        {persona.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {persona.tagline}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/30">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {groupPersonas.length} AI{groupPersonas.length !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex -space-x-2">
                    {groupPersonas.slice(0, 4).map((id) => {
                      const p = AI_PERSONAS.find((a) => a.id === id);
                      return p ? (
                        <div key={id} className={cn("w-6 h-6 rounded-full overflow-hidden border-2 border-background")}>
                          <Image src={p.avatar} alt={p.name} width={24} height={24} className="object-cover" />
                        </div>
                      ) : null;
                    })}
                    {groupPersonas.length > 4 && (
                      <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                        +{groupPersonas.length - 4}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const first = AI_PERSONAS.find((p) => p.id === groupPersonas[0]);
                      if (first) handleSwitchToPersonal(first.id);
                    }}
                  >
                    Personal Chat
                  </Button>
                  <Button
                    onClick={handleStartGroup}
                    disabled={groupPersonas.length < 2}
                    className="bg-gradient-to-r from-violet-500 to-purple-500"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Start Group ({groupPersonas.length})
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
