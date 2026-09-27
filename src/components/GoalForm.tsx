"use client";
import { Box, TextField, Button, LinearProgress } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import { useAgentStore } from "@/store/useAgentStore";
import { streamRun } from "@/lib/api";

export default function GoalForm() {
  // Select slices so this form does NOT re-render on every streamed token.
  const goal = useAgentStore((s) => s.goal);
  const sessionId = useAgentStore((s) => s.sessionId);
  const running = useAgentStore((s) => s.running);
  const setGoal = useAgentStore((s) => s.setGoal);
  const setSessionId = useAgentStore((s) => s.setSessionId);
  const setRunning = useAgentStore((s) => s.setRunning);
  const setResult = useAgentStore((s) => s.setResult);
  const setError = useAgentStore((s) => s.setError);
  const reset = useAgentStore((s) => s.reset);
  const appendToken = useAgentStore((s) => s.appendToken);
  const pushStep = useAgentStore((s) => s.pushStep);

  async function run() {
    reset();
    setError(null);
    setRunning(true);
    // Backend streams word-level tokens (~1500+ per run). Appending each one
    // to the store triggers a re-render + full markdown re-parse per token.
    // Buffer and flush at most every 100ms instead.
    let pending = "";
    const flush = () => {
      if (pending) {
        const chunk = pending;
        pending = "";
        appendToken(chunk);
      }
    };
    const timer = setInterval(flush, 100);
    try {
      for await (const evt of streamRun(goal, sessionId)) {
        if (evt.type === "token" && "token" in evt) pending += String(evt.token ?? "");
        else if (evt.type === "state" && "agent" in evt)
          pushStep({ agent: String(evt.agent), status: String(evt.status), feedback: String(evt.feedback ?? "") });
        else if (evt.type === "result" && "state" in evt) {
          flush();
          setResult(evt.state as never);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      clearInterval(timer);
      flush();
      setRunning(false);
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        label="Engineering goal"
        placeholder="Build a FastAPI todo app with tests"
        multiline
        rows={3}
        fullWidth
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        disabled={running}
      />
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          label="session_id"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          disabled={running}
          sx={{ width: 220 }}
        />
        <Button
          variant="contained"
          startIcon={running ? <StopIcon /> : <PlayArrowIcon />}
          onClick={run}
          disabled={running || !goal.trim()}
        >
          {running ? "Running…" : "Run Agent"}
        </Button>
      </Box>
      {running && <LinearProgress />}
    </Box>
  );
}
