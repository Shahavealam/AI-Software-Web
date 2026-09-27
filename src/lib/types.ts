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
