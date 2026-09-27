import type { AgentEvent, ChatMessage, ChatSession, HealthResponse } from "./types";

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

export async function getHealth(base = apiBase()): Promise<HealthResponse> {
  const res = await fetch(`${base}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`health failed: ${res.status}`);
  return res.json() as Promise<HealthResponse>;
}

function normSession(raw: Record<string, unknown>): ChatSession {
  const id = String(raw.id ?? raw._id ?? raw.session_id ?? "");
  return {
    id,
    title: String(raw.title ?? "Untitled"),
    created_at: typeof raw.created_at === "number" ? raw.created_at : undefined,
    updated_at: typeof raw.updated_at === "number" ? raw.updated_at : undefined,
    message_count: typeof raw.message_count === "number" ? raw.message_count : undefined,
    last_preview: typeof raw.last_preview === "string" ? raw.last_preview : undefined,
    metadata: (raw.metadata as Record<string, unknown>) ?? {},
  };
}

function normMessage(raw: Record<string, unknown>): ChatMessage {
  return {
    id: String(raw.id ?? raw._id ?? `${raw.session_id}-${raw.created_at}-${Math.random()}`),
    session_id: String(raw.session_id ?? ""),
    role: (raw.role as ChatMessage["role"]) ?? "user",
    content: String(raw.content ?? ""),
    agent: typeof raw.agent === "string" ? raw.agent : null,
    kind: typeof raw.kind === "string" ? raw.kind : null,
    created_at: typeof raw.created_at === "number" ? raw.created_at : undefined,
    extra: (raw.extra as Record<string, unknown>) ?? {},
  };
}

export async function listSessions(limit = 50, offset = 0, base = apiBase()): Promise<ChatSession[]> {
  const res = await fetch(`${base}/v1/sessions?limit=${limit}&offset=${offset}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`list sessions failed: ${res.status}`);
  const data = await res.json();
  const arr = Array.isArray(data) ? data : (data.sessions ?? data.items ?? []);
  return (arr as Record<string, unknown>[]).map(normSession).filter((s) => s.id);
}

export async function createSession(title?: string, base = apiBase()): Promise<ChatSession> {
  const res = await fetch(`${base}/v1/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(title ? { title } : {}),
  });
  if (!res.ok) throw new Error(`create session failed: ${res.status}`);
  return normSession((await res.json()) as Record<string, unknown>);
}

export async function getSession(id: string, base = apiBase()): Promise<{ session: ChatSession; messages: ChatMessage[] }> {
  const res = await fetch(`${base}/v1/sessions/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`get session failed: ${res.status}`);
  const data = (await res.json()) as Record<string, unknown>;
  // Backend may return {session, messages} or {id,title,...,messages:[...]} or just session.
  const sessionRaw = (data.session as Record<string, unknown>) ?? data;
  const msgsRaw = (data.messages as Record<string, unknown>[]) ?? [];
  return { session: normSession(sessionRaw), messages: msgsRaw.map(normMessage) };
}

export async function renameSession(id: string, title: string, base = apiBase()): Promise<ChatSession> {
  const res = await fetch(`${base}/v1/sessions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`rename failed: ${res.status}`);
  const data = (await res.json()) as Record<string, unknown>;
  return normSession(((data.session as Record<string, unknown>) ?? data) as Record<string, unknown>);
}

export async function listMessages(sessionId: string, limit = 100, base = apiBase()): Promise<ChatMessage[]> {
  const res = await fetch(
    `${base}/v1/sessions/${encodeURIComponent(sessionId)}/messages?limit=${limit}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`list messages failed: ${res.status}`);
  const data = await res.json();
  const arr = Array.isArray(data) ? data : (data.messages ?? data.items ?? []);
  return (arr as Record<string, unknown>[]).map(normMessage);
}

export async function deleteSession(id: string, base = apiBase()): Promise<void> {
  const res = await fetch(`${base}/v1/sessions/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`delete failed: ${res.status}`);
}

export async function* streamRun(
  goal: string,
  session_id?: string,
  base = apiBase(),
  signal?: AbortSignal
): AsyncGenerator<AgentEvent> {
  const res = await fetch(`${base}/v1/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(session_id ? { goal, session_id } : { goal }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`run failed: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    // SSE frames: "event: <kind>\ndata: <json>\n\n"
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const mEvent = frame.match(/^event:\s*(.+)$/m);
      const mData = frame.match(/^data:\s*([\s\S]+)$/m);
      if (mData) {
        try {
          const data = JSON.parse(mData[1]);
          yield { type: mEvent?.[1]?.trim() ?? data.type, ...data } as AgentEvent;
        } catch {
          /* keep-alive / partial frame */
        }
      }
    }
  }
}
