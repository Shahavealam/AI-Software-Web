"use client";
import { create } from "zustand";
import type { AgentState } from "@/lib/types";

export interface PipelineStep {
  agent: string;
  status: string;
  feedback: string;
}

interface AgentStore {
  goal: string;
  sessionId: string;
  output: string;
  running: boolean;
  steps: PipelineStep[];
  result: AgentState | null;
  error: string | null;
  setGoal: (goal: string) => void;
  setSessionId: (id: string) => void;
  appendToken: (token: string) => void;
  pushStep: (step: PipelineStep) => void;
  setRunning: (running: boolean) => void;
  setResult: (result: AgentState | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  goal: "Create a Python CLI calculator with tests",
  sessionId: process.env.NEXT_PUBLIC_DEFAULT_SESSION ?? "demo",
  output: "",
  running: false,
  steps: [],
  result: null,
  error: null,
  setGoal: (goal) => set({ goal }),
  setSessionId: (sessionId) => set({ sessionId }),
  appendToken: (token) => set((s) => ({ output: s.output + token })),
  pushStep: (step) => set((s) => ({ steps: [...s.steps, step] })),
  setRunning: (running) => set({ running }),
  setResult: (result) => set({ result }),
  setError: (error) => set({ error }),
  reset: () => set({ output: "", steps: [], result: null, error: null }),
}));
