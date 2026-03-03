"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

import { useNovaStore, AI_PERSONAS } from "@/lib/nova-store";
import { NovaAvatar } from "@/components/nova/nova-avatar";
import { ChatMessage } from "@/components/nova/chat-message";
import { ChatInput } from "@/components/nova/chat-input";
import { LoginDialog } from "@/components/nova/login-dialog";
import { PricingDialog } from "@/components/nova/pricing-dialog";
import { AISelector } from "@/components/nova/ai-selector";
import { GroupSelector } from "@/components/nova/group-selector";
import { PaymentReturnHandler } from "@/components/nova/payment-return-handler";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
  Settings,
  History,
  User,
  CreditCard,
  Crown,
  Sparkles,
  Users,
  Volume2,
  VolumeX,
  MessageSquare,
  Plus,
  X,
  UserCircle,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function NovaAI() {
  const { data: session } = useSession();
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const {
    messages,
    isTyping,
    chats,
    currentChat,
    chatMode,
    selectedPersona,
    groupPersonas,
    voiceEnabled,
    autoSpeak,
    sidebarOpen,
    setSidebarOpen,
    showLogin,
    setShowLogin,
    showPricing,
    setShowPricing,
    showAISelector,
    setShowAISelector,
    showGroupSelector,
    setShowGroupSelector,
    addMessage,
    setMessages,
    setTyping,
    setChats,
    setCurrentChat,
    clearMessages,
    setChatMode,
    setSelectedPersona,
    toggleGroupPersona,
    setVoiceEnabled,
    setAutoSpeak,
  } = useNovaStore();

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch chat history when user logs in
  useEffect(() => {
    if (session?.user) {
      fetch("/api/chats")
        .then((res) => res.json())
        .then((data) => {
          if (data.chats) {
            setChats(
              data.chats.map((chat: { id: string; title: string; messages: { id: string; role: string; content: string; createdAt: string }[]; createdAt: string }) => ({
                id: chat.id,
                title: chat.title,
                messages: chat.messages.map((m) => ({
                  id: m.id,
                  role: m.role as "user" | "assistant",
                  content: m.content,
                  createdAt: new Date(m.createdAt),
                })),
                createdAt: new Date(chat.createdAt),
              }))
            );
          }
        })
        .catch(console.error);
    }
  }, [session, setChats]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle sending messages
  const handleSendMessage = useCallback(
    async (content: string) => {
      const userMessage = {
        id: uuidv4(),
        role: "user" as const,
        content,
        createdAt: new Date(),
      };

      addMessage(userMessage);
      setTyping(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            chatMode === "group"
              ? {
                  message: content,
                  chatId: currentChat?.id,
                  groupMode: true,
                  groupPersonaIds: groupPersonas,
                  history: messages.map((m) => ({
                    role: m.role,
                    content: m.content,
                  })),
                }
              : {
                  message: content,
                  chatId: currentChat?.id,
                  personaId: selectedPersona.id,
                  systemPrompt: selectedPersona.systemPrompt,
                  history: messages.map((m) => ({
                    role: m.role,
                    content: m.content,
                  })),
                }
          ),
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        // Handle group responses
        if (data.groupResponses) {
          data.groupResponses.forEach((gr: { personaId: string; response: string }) => {
            addMessage({
              id: uuidv4(),
              role: "assistant",
              content: gr.response,
              personaId: gr.personaId,
              createdAt: new Date(),
            });
          });

          if (!currentChat?.id && data.chatId) {
            setCurrentChat({
              id: data.chatId,
              title: content.slice(0, 50),
              messages,
              createdAt: new Date(),
            });
          }
        } else {
          // Single response
          const assistantMessage = {
            id: uuidv4(),
            role: "assistant" as const,
            content: data.response,
            personaId: selectedPersona.id,
            createdAt: new Date(),
          };

          addMessage(assistantMessage);

          if (!currentChat?.id && data.chatId) {
            setCurrentChat({
              id: data.chatId,
              title: content.slice(0, 50),
              messages: [...messages, userMessage, assistantMessage],
              createdAt: new Date(),
            });
          }

          if (autoSpeak && voiceEnabled) {
            await speakText(data.response, selectedPersona.voice);
          }
        }
      } catch (error) {
        console.error("Chat error:", error);
        addMessage({
          id: uuidv4(),
          role: "assistant",
          content: "I apologize, but I encountered an error. Please try again.",
          createdAt: new Date(),
        });
      } finally {
        setTyping(false);
      }
    },
    [
      addMessage,
      setTyping,
      currentChat,
      chatMode,
      selectedPersona,
      groupPersonas,
      messages,
      setCurrentChat,
      autoSpeak,
      voiceEnabled,
    ]
  );

  // Handle text-to-speech
  const speakText = useCallback(
    async (text: string, voice?: string) => {
      if (!voiceEnabled) return;

      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }

        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            voice: voice || selectedPersona.voice,
            speed: 0.95,
          }),
        });

        if (!response.ok) {
          throw new Error("TTS failed");
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };

        await audio.play();
      } catch (error) {
        console.error("TTS error:", error);
      }
    },
    [voiceEnabled, selectedPersona.voice]
  );

  const handleNewChat = () => {
    clearMessages();
    if (isMobile) setSidebarOpen(false);
  };

  const showWelcome = messages.length === 0;

  // Get group personas for display
  const groupPersonaObjects = groupPersonas
    .map((id) => AI_PERSONAS.find((p) => p.id === id))
    .filter(Boolean);

  // Mobile Header Component
  const MobileHeader = () => (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/95 backdrop-blur-lg">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="h-9 w-9"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Show selected AI(s) */}
          {chatMode === "personal" ? (
            <button
              onClick={() => setShowAISelector(true)}
              className="flex items-center gap-2"
            >
              <div className={cn("w-8 h-8 rounded-full overflow-hidden border-2", `border-${selectedPersona.color}-500/50`)}>
                <Image
                  src={selectedPersona.avatar}
                  alt={selectedPersona.name}
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </div>
              <span className={cn("font-semibold text-sm", `text-${selectedPersona.color}-500`)}>
                {selectedPersona.name}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setShowGroupSelector(true)}
              className="flex items-center gap-2"
            >
              <div className="flex -space-x-1">
                {groupPersonaObjects.slice(0, 3).map((p) => (
                  <div key={p?.id} className={cn("w-7 h-7 rounded-full overflow-hidden border-2 border-background")}>
                    <Image src={p?.avatar || ""} alt={p?.name || ""} width={28} height={28} className="object-cover" />
                  </div>
                ))}
              </div>
              <span className="font-semibold text-sm text-violet-500">
                Group ({groupPersonas.length})
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowGroupSelector(true)}
            className="h-9 w-9"
            title="Group chat"
          >
            {chatMode === "group" ? (
              <Users className="w-5 h-5 text-violet-500" />
            ) : (
              <UserCircle className="w-5 h-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className="h-9 w-9"
          >
            {voiceEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5 text-muted-foreground" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPricing(true)}
            className="h-9 w-9"
          >
            <CreditCard className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowLogin(true)}
            className="h-9 w-9"
          >
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );

  // Desktop Header Component
  const DesktopHeader = () => (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <History className="w-5 h-5" />
          </Button>

          {/* Show selected AI(s) */}
          {chatMode === "personal" ? (
            <button
              onClick={() => setShowAISelector(true)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className={cn("w-10 h-10 rounded-full overflow-hidden border-2", `border-${selectedPersona.color}-500/50`)}>
                <Image
                  src={selectedPersona.avatar}
                  alt={selectedPersona.name}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className={cn("text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent", selectedPersona.gradient)}>
                  {selectedPersona.name}
                </h1>
                <p className="text-xs text-muted-foreground">{selectedPersona.tagline}</p>
              </div>
            </button>
          ) : (
            <button
              onClick={() => setShowGroupSelector(true)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="flex -space-x-2">
                {groupPersonaObjects.slice(0, 4).map((p) => (
                  <div key={p?.id} className={cn("w-10 h-10 rounded-full overflow-hidden border-2 border-background shadow-md")}>
                    <Image src={p?.avatar || ""} alt={p?.name || ""} width={40} height={40} className="object-cover" />
                  </div>
                ))}
                {groupPersonas.length > 4 && (
                  <div className="w-10 h-10 rounded-full bg-violet-500 border-2 border-background flex items-center justify-center text-white text-sm font-medium shadow-md">
                    +{groupPersonas.length - 4}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-violet-500">
                  Group Chat
                </h1>
                <p className="text-xs text-muted-foreground">
                  {groupPersonas.length} AIs active
                </p>
              </div>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {session?.user && (
            <span className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span className="capitalize">{session.user.plan || "Free"}</span>
            </span>
          )}

          {/* Mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowGroupSelector(true)}
            title="Switch mode"
          >
            {chatMode === "group" ? (
              <Users className="w-5 h-5 text-violet-500" />
            ) : (
              <UserCircle className="w-5 h-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            title={voiceEnabled ? "Disable voice" : "Enable voice"}
          >
            {voiceEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5 text-muted-foreground" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPricing(true)}
          >
            <CreditCard className="w-5 h-5" />
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Sparkles className={cn("w-5 h-5", `text-${selectedPersona.color}-500`)} />
                  Settings
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Chat Mode */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Chat Mode</label>
                  <div className="flex gap-2">
                    <Button
                      variant={chatMode === "personal" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setChatMode("personal");
                        setShowAISelector(true);
                      }}
                      className={chatMode === "personal" ? "bg-violet-500" : ""}
                    >
                      <UserCircle className="w-4 h-4 mr-2" />
                      Personal
                    </Button>
                    <Button
                      variant={chatMode === "group" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowGroupSelector(true)}
                      className={chatMode === "group" ? "bg-violet-500" : ""}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Group
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-muted-foreground">Auto-speak responses</label>
                  <button
                    onClick={() => setAutoSpeak(!autoSpeak)}
                    className={cn(
                      "relative w-10 h-6 rounded-full transition-colors",
                      autoSpeak ? `bg-violet-500` : "bg-muted"
                    )}
                  >
                    <motion.div
                      className="absolute top-1 w-4 h-4 bg-white rounded-full"
                      animate={{ left: autoSpeak ? 20 : 4 }}
                    />
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowLogin(true)}
          >
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );

  // Mobile Sidebar
  const MobileSidebar = () => (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setSidebarOpen(false)}
          />

          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background border-r border-border z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                {chatMode === "personal" ? (
                  <>
                    <div className={cn("w-10 h-10 rounded-full overflow-hidden border-2", `border-${selectedPersona.color}-500/50`)}>
                      <Image src={selectedPersona.avatar} alt={selectedPersona.name} width={40} height={40} className="object-cover" />
                    </div>
                    <div>
                      <p className={cn("font-semibold", `text-${selectedPersona.color}-500`)}>{selectedPersona.name}</p>
                      <p className="text-xs text-muted-foreground">Personal</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex -space-x-1">
                      {groupPersonaObjects.slice(0, 3).map((p) => (
                        <div key={p?.id} className={cn("w-8 h-8 rounded-full overflow-hidden border-2 border-background")}>
                          <Image src={p?.avatar || ""} alt={p?.name || ""} width={32} height={32} className="object-cover" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="font-semibold text-violet-500">Group</p>
                      <p className="text-xs text-muted-foreground">{groupPersonas.length} AIs</p>
                    </div>
                  </>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4">
              <Button onClick={handleNewChat} className="w-full bg-gradient-to-r from-violet-500 to-purple-500">
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>

            <ScrollArea className="flex-1 px-2">
              {session?.user ? (
                chats.length > 0 ? (
                  <div className="space-y-1">
                    {chats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => {
                          setCurrentChat(chat);
                          setSidebarOpen(false);
                        }}
                        className="w-full text-left p-3 rounded-lg text-sm hover:bg-muted transition-colors"
                      >
                        <p className="truncate">{chat.title}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                    <MessageSquare className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">No chat history yet</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                  <User className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">Sign in to save history</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => { setSidebarOpen(false); setShowLogin(true); }}>
                    Sign In
                  </Button>
                </div>
              )}
            </ScrollArea>

            {/* AI Quick Switch */}
            <div className="p-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">
                {chatMode === "personal" ? "Switch AI" : "Group Members"}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {AI_PERSONAS.map((ai) => (
                  <button
                    key={ai.id}
                    onClick={() => {
                      if (chatMode === "personal") {
                        setSelectedPersona(ai);
                      } else {
                        toggleGroupPersona(ai.id);
                      }
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      "flex-shrink-0 w-12 h-12 rounded-full overflow-hidden border-2 transition-all",
                      (chatMode === "personal" && selectedPersona.id === ai.id) ||
                      (chatMode === "group" && groupPersonas.includes(ai.id))
                        ? `border-${ai.color}-500 ring-2 ring-${ai.color}-500/30`
                        : "border-transparent opacity-70 hover:opacity-100"
                    )}
                  >
                    <Image src={ai.avatar} alt={ai.name} width={48} height={48} className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <aside className="hidden md:flex flex-col w-64 border-r border-border/50 bg-muted/30">
      <div className="p-4">
        <Button onClick={handleNewChat} className={cn("w-full bg-gradient-to-r", chatMode === "group" ? "from-violet-500 to-purple-500" : selectedPersona.gradient)}>
          <Sparkles className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        {session?.user ? (
          chats.length > 0 ? (
            <div className="space-y-1">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setCurrentChat(chat)}
                  className="w-full text-left p-3 rounded-lg text-sm hover:bg-muted transition-colors"
                >
                  <p className="truncate">{chat.title}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center p-4">
              <History className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">No chat history yet</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-center p-4">
            <User className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">Sign in to save history</p>
          </div>
        )}
      </ScrollArea>
    </aside>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-violet-950/20">
      {isMobile ? <MobileHeader /> : <DesktopHeader />}

      <main className="flex-1 flex">
        {isMobile ? <MobileSidebar /> : <DesktopSidebar />}

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="max-w-3xl mx-auto space-y-4">
              {showWelcome ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center min-h-[60vh] gap-6"
                >
                  {/* Show avatar(s) */}
                  {chatMode === "personal" ? (
                    <NovaAvatar />
                  ) : (
                    <div className="text-center">
                      <div className="flex justify-center gap-3 mb-4">
                        {groupPersonaObjects.map((p) => (
                          <div key={p?.id} className={cn("w-16 h-16 rounded-full overflow-hidden border-3 shadow-lg", `border-${p?.color}-500/50`)}>
                            <Image src={p?.avatar || ""} alt={p?.name || ""} width={64} height={64} className="object-cover" />
                          </div>
                        ))}
                      </div>
                      <h2 className="text-2xl font-bold text-violet-500">Group Chat</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {groupPersonaObjects.map((p) => p?.name).join(", ")}
                      </p>
                    </div>
                  )}

                  {/* Mobile AI Quick Switch */}
                  {isMobile && (
                    <div className="flex gap-3 overflow-x-auto pb-2 max-w-full">
                      {AI_PERSONAS.map((ai) => (
                        <button
                          key={ai.id}
                          onClick={() => {
                            if (chatMode === "personal") {
                              setSelectedPersona(ai);
                            } else {
                              toggleGroupPersona(ai.id);
                            }
                          }}
                          className={cn(
                            "flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                            (chatMode === "personal" && selectedPersona.id === ai.id) ||
                            (chatMode === "group" && groupPersonas.includes(ai.id))
                              ? `bg-${ai.color}-500/20`
                              : "hover:bg-muted"
                          )}
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-full overflow-hidden border-2",
                            (chatMode === "personal" && selectedPersona.id === ai.id) ||
                            (chatMode === "group" && groupPersonas.includes(ai.id))
                              ? `border-${ai.color}-500`
                              : "border-transparent"
                          )}>
                            <Image src={ai.avatar} alt={ai.name} width={48} height={48} className="object-cover" />
                          </div>
                          <span className={cn(
                            "text-xs",
                            (chatMode === "personal" && selectedPersona.id === ai.id) ||
                            (chatMode === "group" && groupPersonas.includes(ai.id))
                              ? `text-${ai.color}-500 font-medium`
                              : "text-muted-foreground"
                          )}>
                            {ai.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <ChatInput
                    onSend={handleSendMessage}
                    disabled={isTyping}
                    placeholder={
                      chatMode === "group"
                        ? `Chat with ${groupPersonas.length} AIs...`
                        : `Chat with ${selectedPersona.name}...`
                    }
                  />
                </motion.div>
              ) : (
                <>
                  <AnimatePresence mode="popLayout">
                    {messages.map((message) => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        onSpeak={speakText}
                        voiceEnabled={voiceEnabled}
                        isGroupChat={chatMode === "group"}
                      />
                    ))}
                  </AnimatePresence>

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-4 rounded-2xl bg-muted/50"
                    >
                      {chatMode === "group" ? (
                        <>
                          <div className="flex -space-x-1">
                            {groupPersonaObjects.slice(0, 3).map((p) => (
                              <div key={p?.id} className={cn("w-7 h-7 rounded-full overflow-hidden border-2 border-background")}>
                                <Image src={p?.avatar || ""} alt={p?.name || ""} width={28} height={28} className="object-cover" />
                              </div>
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {groupPersonaObjects.length} AIs are thinking
                          </span>
                        </>
                      ) : (
                        <>
                          <div className={cn("w-8 h-8 rounded-full overflow-hidden border-2", `border-${selectedPersona.color}-500/50`)}>
                            <Image src={selectedPersona.avatar} alt={selectedPersona.name} width={32} height={32} className="object-cover" />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {selectedPersona.name} is thinking
                          </span>
                        </>
                      )}
                      <span className="flex gap-1">
                        {[0, 0.2, 0.4].map((delay, i) => (
                          <motion.span
                            key={i}
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1, repeat: Infinity, delay }}
                            className="w-1.5 h-1.5 bg-violet-500 rounded-full"
                          />
                        ))}
                      </span>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>

          {!showWelcome && (
            <div className="sticky bottom-0 p-3 md:p-4 bg-gradient-to-t from-background via-background to-transparent">
              <div className="max-w-3xl mx-auto">
                <ChatInput onSend={handleSendMessage} disabled={isTyping} />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer - Desktop only */}
      {!isMobile && (
        <footer className="border-t border-border/50 bg-background/80 backdrop-blur-lg py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
            <p>© 2024 Multi-AI Platform. All rights reserved.</p>
            <p className="flex items-center gap-1">
              {chatMode === "group" ? (
                <>
                  <Users className="w-3 h-3 text-violet-500" />
                  Group chat with {groupPersonas.length} AIs
                </>
              ) : (
                <>
                  <Sparkles className={cn("w-3 h-3", `text-${selectedPersona.color}-500`)} />
                  Chatting with {selectedPersona.name}
                </>
              )}
            </p>
          </div>
        </footer>
      )}

      {/* Modals */}
      <LoginDialog />
      <PricingDialog />
      <AISelector />
      <GroupSelector />
      <PaymentReturnHandler />
    </div>
  );
}
