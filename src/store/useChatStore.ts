"use client";
import { create } from "zustand";
import type { ChatMessage, ChatSession } from "@/lib/types";
import { getSession, listMessages, listSessions } from "@/lib/api";

interface ChatStore {
  sessions: ChatSession[];
  sessionsLoading: boolean;
  sessionsError: string | null;
  currentId: string | null;
  messages: ChatMessage[];
  messagesLoading: boolean;
  messagesError: string | null;
  search: string;
  setSearch: (q: string) => void;
  refreshSessions: () => Promise<void>;
  upsertSession: (s: ChatSession) => void;
  removeSession: (id: string) => void;
  renameLocal: (id: string, title: string) => void;
  selectSession: (id: string | null) => Promise<void>;
  setMessages: (msgs: ChatMessage[]) => void;
  appendMessage: (m: ChatMessage) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: [],
  sessionsLoading: false,
  sessionsError: null,
  currentId: null,
  messages: [],
  messagesLoading: false,
  messagesError: null,
  search: "",
  setSearch: (search) => set({ search }),

  refreshSessions: async () => {
    set({ sessionsLoading: true, sessionsError: null });
    try {
      const sessions = await listSessions(50, 0);
      set((s) => {
        // Keep a just-created optimistic session if backend hasn't returned it yet.
        const known = new Map(sessions.map((x) => [x.id, x]));
        for (const local of s.sessions) {
          if (!known.has(local.id) && local.id.startsWith("tmp-")) known.set(local.id, local);
        }
        const merged = Array.from(known.values()).sort(
          (a, b) => (b.updated_at ?? b.created_at ?? 0) - (a.updated_at ?? a.created_at ?? 0)
        );
        return { sessions: merged, sessionsLoading: false };
      });
    } catch (e) {
      set({ sessionsLoading: false, sessionsError: e instanceof Error ? e.message : String(e) });
    }
  },

  upsertSession: (s) =>
    set((st) => {
      const idx = st.sessions.findIndex((x) => x.id === s.id);
      if (idx === -1) return { sessions: [s, ...st.sessions] };
      const next = [...st.sessions];
      next[idx] = { ...next[idx], ...s };
      return { sessions: next };
    }),

  removeSession: (id) =>
    set((st) => ({
      sessions: st.sessions.filter((x) => x.id !== id),
      currentId: st.currentId === id ? null : st.currentId,
      messages: st.currentId === id ? [] : st.messages,
    })),

  renameLocal: (id, title) =>
    set((st) => ({
      sessions: st.sessions.map((x) => (x.id === id ? { ...x, title } : x)),
    })),

  selectSession: async (id) => {
    // Set loading synchronously so the thread never flashes the empty
    // state between sessions (that flash is the visible "jump").
    const loading = Boolean(id && !id.startsWith("tmp-"));
    set({ currentId: id, messages: [], messagesError: null, messagesLoading: loading });
    if (!id || id.startsWith("tmp-")) return;
    try {
      // Prefer the combined endpoint; fall back to messages-only.
      try {
        const { messages } = await getSession(id);
        if (messages.length > 0) {
          set({ messages, messagesLoading: false });
          return;
        }
      } catch {
        /* fall through to messages-only */
      }
      const messages = await listMessages(id, 100);
      set({ messages, messagesLoading: false });
    } catch (e) {
      set({ messagesLoading: false, messagesError: e instanceof Error ? e.message : String(e) });
    }
  },

  setMessages: (messages) => set({ messages }),
  appendMessage: (m) => {
    const { currentId } = get();
    if (currentId && m.session_id && m.session_id !== currentId) return;
    set((st) => ({ messages: [...st.messages, m] }));
  },
}));
