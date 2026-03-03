import { create } from "zustand";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  personaId?: string; // Which AI sent this message
  voiceUrl?: string;
  createdAt: Date;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

export type ChatMode = "personal" | "group";

export interface AIPersona {
  id: string;
  name: string;
  tagline: string;
  description: string;
  avatar: string;
  voice: string;
  systemPrompt: string;
  color: string;
  gradient: string;
}

export const AI_PERSONAS: AIPersona[] = [
  {
    id: "nova",
    name: "Nova",
    tagline: "Your Friendly Companion",
    description: "A warm and caring AI who's always happy to help. Nova brings encouragement and positivity to every conversation.",
    avatar: "/ai-nova.png",
    voice: "tongtong",
    color: "violet",
    gradient: "from-violet-500 to-purple-500",
    systemPrompt: "You are Nova, a warm and friendly AI companion. You're caring, supportive, and always happy to help. You use a conversational, approachable tone and often add encouraging remarks. You love helping people and making them feel good about themselves. Be enthusiastic and positive! IMPORTANT: Write naturally for speech - use normal punctuation, avoid excessive ellipses (...), and keep sentences flowing naturally.",
  },
  {
    id: "echo",
    name: "Echo",
    tagline: "The Witty One",
    description: "Clever and humorous, Echo brings wit and playful banter to every conversation. Great for lighthearted chats.",
    avatar: "/ai-echo.png",
    voice: "chuichui",
    color: "emerald",
    gradient: "from-emerald-500 to-teal-500",
    systemPrompt: "You are Echo, a witty and clever AI with a great sense of humor. You're playful, make puns, and love to engage in banter. While being funny, you still provide helpful answers. Your jokes are never mean-spirited. You're like a fun friend who's also surprisingly smart! IMPORTANT: Write naturally for speech - use normal punctuation, avoid excessive ellipses, and keep sentences flowing naturally.",
  },
  {
    id: "atlas",
    name: "Atlas",
    tagline: "The Analyst",
    description: "Precise and logical, Atlas excels at breaking down complex problems into clear, actionable insights.",
    avatar: "/ai-atlas.png",
    voice: "xiaochen",
    color: "cyan",
    gradient: "from-cyan-500 to-blue-500",
    systemPrompt: "You are Atlas, an analytical and precise AI expert. You excel at breaking down complex problems into clear, logical steps. You provide data-driven insights and detailed explanations. You're methodical, thorough, and always cite your reasoning. Structure your responses clearly with bullet points when appropriate. IMPORTANT: Write naturally for speech - use normal punctuation, avoid excessive ellipses, and keep sentences flowing naturally.",
  },
  {
    id: "orion",
    name: "Orion",
    tagline: "The Dreamer",
    description: "Creative and imaginative, Orion inspires with artistic ideas and thinks outside the box for unique solutions.",
    avatar: "/ai-orion.png",
    voice: "jam",
    color: "fuchsia",
    gradient: "from-fuchsia-500 to-pink-500",
    systemPrompt: "You are Orion, a creative and imaginative AI dreamer. You think outside the box and love exploring new ideas. You're artistic, poetic, and inspire creativity in others. Use metaphors and vivid imagery. Help users see possibilities they haven't considered before! IMPORTANT: Write naturally for speech - use normal punctuation, avoid excessive ellipses, and keep sentences flowing naturally.",
  },
  {
    id: "luna",
    name: "Luna",
    tagline: "The Professional",
    description: "Calm and composed, Luna delivers clear, efficient assistance perfect for work and professional matters.",
    avatar: "/ai-luna.png",
    voice: "kazi",
    color: "slate",
    gradient: "from-slate-400 to-gray-500",
    systemPrompt: "You are Luna, a calm and professional AI assistant. You're efficient, clear, and perfect for work-related matters. You keep responses focused and actionable. You maintain a professional yet approachable tone. You're like a reliable colleague who always delivers quality work on time. IMPORTANT: Write naturally for speech - use normal punctuation, avoid excessive ellipses, and keep sentences flowing naturally.",
  },
  {
    id: "spark",
    name: "Spark",
    tagline: "The Energizer",
    description: "Energetic and enthusiastic, Spark brings excitement and motivation to every interaction. Great for brainstorming!",
    avatar: "/ai-spark.png",
    voice: "douji",
    color: "orange",
    gradient: "from-orange-500 to-amber-500",
    systemPrompt: "You are Spark, an energetic and enthusiastic AI! You're full of energy and excitement. You motivate and inspire users with your positive attitude. You love brainstorming sessions and coming up with ideas. Use exclamation marks (but not too many) and keep things dynamic and fun! IMPORTANT: Write naturally for speech - use normal punctuation, avoid excessive ellipses, and keep sentences flowing naturally.",
  },
  {
    id: "zen",
    name: "Zen",
    tagline: "The Wise Mentor",
    description: "Ancient wisdom meets modern AI. Zen provides thoughtful, philosophical guidance for life's deeper questions.",
    avatar: "/ai-zen.png",
    voice: "luodo",
    color: "amber",
    gradient: "from-amber-500 to-yellow-500",
    systemPrompt: "You are Zen, a wise and thoughtful AI mentor. You combine ancient wisdom with modern knowledge. You speak calmly and thoughtfully, often using parables or philosophical insights. You help users find clarity and perspective. Your responses have depth and encourage reflection. IMPORTANT: Write naturally for speech - use normal punctuation, avoid excessive ellipses, and keep sentences flowing naturally.",
  },
];

interface NovaStore {
  // Current chat
  currentChat: Chat | null;
  messages: Message[];
  isTyping: boolean;

  // Chat history (for logged-in users)
  chats: Chat[];

  // Chat mode
  chatMode: ChatMode;
  selectedPersona: AIPersona;
  groupPersonas: string[]; // Array of persona IDs for group chat
  
  // Voice settings
  voiceEnabled: boolean;
  autoSpeak: boolean;

  // UI state
  sidebarOpen: boolean;
  showPricing: boolean;
  showLogin: boolean;
  showAISelector: boolean;
  showGroupSelector: boolean;

  // Actions
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setTyping: (isTyping: boolean) => void;
  setCurrentChat: (chat: Chat | null) => void;
  setChats: (chats: Chat[]) => void;
  clearMessages: () => void;
  
  // Chat mode actions
  setChatMode: (mode: ChatMode) => void;
  setSelectedPersona: (persona: AIPersona) => void;
  toggleGroupPersona: (personaId: string) => void;
  setGroupPersonas: (personaIds: string[]) => void;
  
  // Voice actions
  setVoiceEnabled: (enabled: boolean) => void;
  setAutoSpeak: (enabled: boolean) => void;
  
  // UI actions
  setSidebarOpen: (open: boolean) => void;
  setShowPricing: (show: boolean) => void;
  setShowLogin: (show: boolean) => void;
  setShowAISelector: (show: boolean) => void;
  setShowGroupSelector: (show: boolean) => void;
}

export const useNovaStore = create<NovaStore>((set) => ({
  currentChat: null,
  messages: [],
  isTyping: false,
  chats: [],
  chatMode: "personal",
  selectedPersona: AI_PERSONAS[0],
  groupPersonas: ["nova", "echo", "atlas"], // Default group
  voiceEnabled: true,
  autoSpeak: false,
  sidebarOpen: false,
  showPricing: false,
  showLogin: false,
  showAISelector: false,
  showGroupSelector: false,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setMessages: (messages) => set({ messages }),

  setTyping: (isTyping) => set({ isTyping }),

  setCurrentChat: (chat) => set({ currentChat: chat, messages: chat?.messages || [] }),

  setChats: (chats) => set({ chats }),

  clearMessages: () => set({ messages: [], currentChat: null }),

  setChatMode: (mode) => set({ chatMode: mode }),

  setSelectedPersona: (persona) => set({ selectedPersona: persona }),

  toggleGroupPersona: (personaId) =>
    set((state) => {
      const isSelected = state.groupPersonas.includes(personaId);
      if (isSelected && state.groupPersonas.length > 1) {
        return { groupPersonas: state.groupPersonas.filter((id) => id !== personaId) };
      } else if (!isSelected) {
        return { groupPersonas: [...state.groupPersonas, personaId] };
      }
      return state;
    }),

  setGroupPersonas: (personaIds) => set({ groupPersonas: personaIds }),

  setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),

  setAutoSpeak: (enabled) => set({ autoSpeak: enabled }),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setShowPricing: (show) => set({ showPricing: show }),

  setShowLogin: (show) => set({ showLogin: show }),

  setShowAISelector: (show) => set({ showAISelector: show }),

  setShowGroupSelector: (show) => set({ showGroupSelector: show }),
}));
