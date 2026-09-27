import type { AgentEvent, HealthResponse } from "./types";

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

export async function getHealth(base = apiBase()): Promise<HealthResponse> {
  const res = await fetch(`${base}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`health failed: ${res.status}`);
  return res.json() as Promise<HealthResponse>;
}

export async function* streamRun(
  goal: string,
  session_id = process.env.NEXT_PUBLIC_DEFAULT_SESSION ?? "demo",
  base = apiBase()
): AsyncGenerator<AgentEvent> {
  const res = await fetch(`${base}/v1/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({ goal, session_id }),
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
