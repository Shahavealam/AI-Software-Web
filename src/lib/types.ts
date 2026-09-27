export type AgentEvent =
  | { type: "token"; token: string }
  | { type: "state"; agent: string; status: string; feedback: string }
  | { type: "result"; state: AgentState }
  | { type: string; [key: string]: unknown };

export interface AgentState {
  artifacts: Record<string, string>;
  exec_reports: unknown[];
  retries_used?: number;
  error?: string | null;
  [key: string]: unknown;
}

export interface HealthResponse {
  status: string;
  llm: "online" | "offline";
}

export type ChatRole = "user" | "assistant" | "system";

export interface ChatSession {
  id: string;
  title: string;
  created_at?: number;
  updated_at?: number;
  message_count?: number;
  last_preview?: string;
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: ChatRole;
  content: string;
  agent?: string | null;
  kind?: string | null;
  created_at?: number;
  extra?: Record<string, unknown>;
}
