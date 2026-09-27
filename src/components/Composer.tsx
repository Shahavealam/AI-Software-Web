"use client";
import { useRef, useState } from "react";
import { Box, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import StopIcon from "@mui/icons-material/Stop";
import { useAgentStore } from "@/store/useAgentStore";
import { useChatStore } from "@/store/useChatStore";
import { streamRun } from "@/lib/api";

export default function Composer() {
  const goal = useAgentStore((s) => s.goal);
  const setGoal = useAgentStore((s) => s.setGoal);
  const running = useAgentStore((s) => s.running);
  const setRunning = useAgentStore((s) => s.setRunning);
  const setResult = useAgentStore((s) => s.setResult);
  const setError = useAgentStore((s) => s.setError);
  const reset = useAgentStore((s) => s.reset);
  const appendToken = useAgentStore((s) => s.appendToken);
  const pushStep = useAgentStore((s) => s.pushStep);

  const currentId = useChatStore((s) => s.currentId);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const refreshSessions = useChatStore((s) => s.refreshSessions);
  const selectSession = useChatStore((s) => s.selectSession);

  const abortRef = useRef<AbortController | null>(null);
  const [focused, setFocused] = useState(false);

  function stop() {
    abortRef.current?.abort();
  }

  async function send() {
    const text = goal.trim();
    if (!text || running) return;
    reset();
    setError(null);
    setRunning(true);

    const sessionId = currentId && !currentId.startsWith("tmp-") ? currentId : undefined;
    // Optimistic user bubble so the thread feels instant.
    appendMessage({
      id: `local-${Date.now()}`,
      session_id: currentId ?? "",
      role: "user",
      content: text,
      created_at: Date.now() / 1000,
    });
    setGoal("");

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let pending = "";
    let seenSessionId: string | undefined;
    const flush = () => {
      if (pending) {
        const chunk = pending;
        pending = "";
        appendToken(chunk);
      }
    };
    const timer = setInterval(flush, 100);
    const pickSessionId = (evt: Record<string, unknown>): string | undefined => {
      for (const k of ["session_id", "sessionId", "id"]) {
        const v = evt[k];
        if (typeof v === "string" && v && !v.startsWith("tmp-")) return v;
      }
      const nested = evt.state as Record<string, unknown> | undefined;
      if (nested) {
        for (const k of ["session_id", "sessionId"]) {
          const v = nested[k];
          if (typeof v === "string" && v) return v;
        }
      }
      return undefined;
    };
    try {
      for await (const evt of streamRun(text, sessionId, undefined, ctrl.signal)) {
        const found = pickSessionId(evt as Record<string, unknown>);
        if (found) seenSessionId = found;
        if (evt.type === "token" && "token" in evt) pending += String(evt.token ?? "");
        else if (evt.type === "state" && "agent" in evt)
          pushStep({ agent: String(evt.agent), status: String(evt.status), feedback: String(evt.feedback ?? "") });
        else if (evt.type === "result" && "state" in evt) {
          flush();
          setResult(evt.state as never);
        }
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setError("Stopped by user.");
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      clearInterval(timer);
      flush();
      setRunning(false);
      abortRef.current = null;
      try {
        await refreshSessions();
        const target = seenSessionId ?? sessionId;
        if (target) await selectSession(target);
      } catch {
        /* history refresh is best-effort; live output stays visible */
      }
    }
  }

  const canSend = goal.trim().length > 0 && !running;

  return (
    <Box sx={{ px: { xs: 1.5, md: 3 }, pt: 1.5 }}>
      <Box sx={{ maxWidth: "780px", mx: "auto", width: "100%", px: 1, pb: 2.5 }}>
        <Box
          sx={{
            backgroundColor: "#2f2f2f",
            borderRadius: 5,
            border: "1px solid",
            borderColor: focused ? "rgba(255,255,255,0.28)" : "divider",
            px: 2.5,
            pt: 1.75,
            pb: 1.25,
            boxShadow: focused ? "0 4px 24px rgba(0,0,0,0.45)" : "0 2px 12px rgba(0,0,0,0.35)",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={6}
            placeholder="Ask anything — describe the software you want built…"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            variant="standard"
            InputProps={{ disableUnderline: true }}
            inputProps={{ "aria-label": "Engineering goal", style: { fontSize: "0.95rem", lineHeight: 1.6 } }}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, pt: 1, pb: 0.25 }}>
            <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
              Enter to send · Shift+Enter for new line
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            {running ? (
              <Tooltip title="Stop">
                <IconButton
                  onClick={stop}
                  aria-label="Stop generating"
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: "#fff",
                    color: "#000",
                    "&:hover": { backgroundColor: "#e5e5e5" },
                  }}
                >
                  <StopIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Send">
                <span>
                  <IconButton
                    onClick={() => void send()}
                    disabled={!canSend}
                    aria-label="Send"
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: canSend ? "#fff" : "rgba(255,255,255,0.12)",
                      color: canSend ? "#000" : "rgba(255,255,255,0.35)",
                      "&:hover": { backgroundColor: canSend ? "#e0e0e0" : "rgba(255,255,255,0.12)" },
                      "&.Mui-disabled": { backgroundColor: "rgba(255,255,255,0.12)" },
                    }}
                  >
                    <ArrowUpwardIcon />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", textAlign: "center", mt: 1.25 }}
        >
          Runs persist to /v1/sessions — pick any thread on the left to continue it.
        </Typography>
      </Box>
    </Box>
  );
}
