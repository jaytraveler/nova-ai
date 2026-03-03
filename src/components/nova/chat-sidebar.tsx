"use client";

import { useSession } from "next-auth/react";
import { useNovaStore, AI_PERSONAS } from "@/lib/nova-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Plus, Clock, User, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

export function ChatSidebar() {
  const { data: session } = useSession();
  const {
    chats,
    currentChat,
    setCurrentChat,
    clearMessages,
    sidebarOpen,
    setSidebarOpen,
    selectedPersona,
    chatMode,
    groupPersonas,
    setSelectedPersona,
    toggleGroupPersona,
  } = useNovaStore();

  const handleNewChat = () => {
    clearMessages();
    setSidebarOpen(false);
  };

  const handleSelectChat = (chat: typeof chats[0]) => {
    setCurrentChat(chat);
    setSidebarOpen(false);
  };

  // Get group personas
  const groupPersonaObjects = groupPersonas
    .map((id) => AI_PERSONAS.find((p) => p.id === id))
    .filter(Boolean);

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />

          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-background border-r border-border z-50 flex flex-col"
          >
            <div className="p-4 border-b border-border">
              {/* Current AI indicator */}
              <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted">
                {chatMode === "personal" ? (
                  <>
                    <div className={cn("w-8 h-8 rounded-full overflow-hidden border-2", `border-${selectedPersona.color}-500/50`)}>
                      <Image src={selectedPersona.avatar} alt={selectedPersona.name} width={32} height={32} className="object-cover" />
                    </div>
                    <div>
                      <p className={cn("text-sm font-medium", `text-${selectedPersona.color}-500`)}>{selectedPersona.name}</p>
                      <p className="text-xs text-muted-foreground">Personal</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex -space-x-1">
                      {groupPersonaObjects.slice(0, 3).map((p) => (
                        <div key={p?.id} className={cn("w-7 h-7 rounded-full overflow-hidden border-2 border-background")}>
                          <Image src={p?.avatar || ""} alt={p?.name || ""} width={28} height={28} className="object-cover" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-violet-500">Group</p>
                      <p className="text-xs text-muted-foreground">{groupPersonas.length} AIs</p>
                    </div>
                  </>
                )}
              </div>

              <Button
                onClick={handleNewChat}
                className={cn("w-full bg-gradient-to-r", chatMode === "group" ? "from-violet-500 to-purple-500" : selectedPersona.gradient)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>

            {!session ? (
              <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Sign in to save your chat history and access it across devices.
                </p>
              </div>
            ) : chats.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No chat history yet. Start a conversation!
                </p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {chats.map((chat) => (
                    <motion.button
                      key={chat.id}
                      onClick={() => handleSelectChat(chat)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                        currentChat?.id === chat.id
                          ? `bg-${chatMode === "group" ? "violet" : selectedPersona.color}-500/20`
                          : "hover:bg-muted"
                      )}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      {chatMode === "group" ? (
                        <Users className="w-4 h-4 mt-0.5 flex-shrink-0 text-violet-500" />
                      ) : (
                        <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{chat.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(chat.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </ScrollArea>
            )}

            <div className="p-4 border-t border-border">
              <p className="text-xs text-center text-muted-foreground">
                {session ? `${chats.length} conversations` : "Guest mode"}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
