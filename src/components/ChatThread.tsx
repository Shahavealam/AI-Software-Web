"use client";
import { useLayoutEffect, useRef } from "react";
import { Avatar, Box, Button, Chip, Skeleton, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { useChatStore } from "@/store/useChatStore";
import { useAgentStore } from "@/store/useAgentStore";
import Markdown, { CopyButton, MarkdownBoundary } from "./Markdown";
import PipelineTimeline from "./PipelineTimeline";

function fmtTime(ts?: number): string {
  if (!ts) return "";
  const d = new Date(ts > 1e12 ? ts : ts * 1000);
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const SUGGESTIONS = [
  "Create a Python CLI calculator with tests",
  "Build a FastAPI todo app with tests",
  "Scaffold a React dashboard with charts",
];

export default function ChatThread({ onOpenArtifacts }: { onOpenArtifacts: () => void }) {
  const messages = useChatStore((s) => s.messages);
  const messagesLoading = useChatStore((s) => s.messagesLoading);
  const messagesError = useChatStore((s) => s.messagesError);
  const currentId = useChatStore((s) => s.currentId);

  const output = useAgentStore((s) => s.output);
  const running = useAgentStore((s) => s.running);
  const steps = useAgentStore((s) => s.steps);
  const result = useAgentStore((s) => s.result);
  const error = useAgentStore((s) => s.error);
  const setGoal = useAgentStore((s) => s.setGoal);

  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);

  // Follow the bottom instantly (no smooth animation): smooth
  // scrollIntoView on every session switch is what made the right
  // panel visibly "jump". Direct scrollTop on our own container
  // never scrolls any ancestor.
  useLayoutEffect(() => {
    stickRef.current = true;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [currentId]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages, output, running]);

  const fileCount = result ? Object.keys(result.artifacts ?? {}).length : 0;

  if (messagesLoading) {
    return (
      <Box sx={{ flexGrow: 1, overflowY: "auto", scrollbarGutter: "stable" }}>
        <Box sx={{ width: "100%", px: { xs: 2, md: 4 }, py: 3 }}>
          <Skeleton height={48} sx={{ borderRadius: 2 }} />
          <Skeleton height={120} sx={{ borderRadius: 2 }} />
          <Skeleton height={80} width="70%" sx={{ borderRadius: 2 }} />
        </Box>
      </Box>
    );
  }

  if (messages.length === 0 && !output && !running) {
    return (
      <Box
        sx={{
          maxWidth: 768,
          mx: "auto",
          width: "100%",
          px: 2,
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 2,
          py: 6,
        }}
      >
        <Avatar sx={{ width: 56, height: 56, backgroundColor: "rgba(255,255,255,0.08)" }}>
          <SmartToyIcon />
        </Avatar>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          What are we building today?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480 }}>
          Describe a goal below. The Architect → Developer → QA → Writer pipeline streams the
          result here, and the thread is saved under {currentId ? "this session" : "a new auto-titled session"}.
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center", mt: 1 }}>
          {SUGGESTIONS.map((s) => (
            <Chip
              key={s}
              label={s}
              variant="outlined"
              clickable
              onClick={() => setGoal(s)}
              sx={{ borderRadius: 3 }}
            />
          ))}
        </Box>
        {messagesError && (
          <Typography variant="caption" color="error">
            {messagesError}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box
      ref={scrollRef}
      onScroll={(e) => {
        const el = e.currentTarget;
        stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      }}
      sx={{ flexGrow: 1, overflowY: "auto", overflowX: "hidden", scrollbarGutter: "stable" }}
    >
      <Box sx={{ width: "100%", px: { xs: 2, md: 4 }, py: 3, display: "flex", flexDirection: "column", gap: 2.5, minHeight: "100%" }}>
        {messages.map((m) => {
          if (m.role === "user") {
            return (
              <Box key={m.id} sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                <Box
                  sx={{
                    maxWidth: "85%",
                    backgroundColor: "#2f2f2f",
                    borderRadius: 3,
                    px: 2,
                    py: 1.25,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                    {m.content}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, textAlign: "right" }}>
                    {fmtTime(m.created_at)}
                  </Typography>
                </Box>
                <Avatar sx={{ width: 28, height: 28, backgroundColor: "primary.main" }}>
                  <PersonIcon sx={{ fontSize: 16 }} />
                </Avatar>
              </Box>
            );
          }
          if (m.role === "system") {
            return (
              <Box key={m.id} sx={{ display: "flex", justifyContent: "center" }}>
                <Chip label={m.content} size="small" variant="outlined" sx={{ maxWidth: "100%" }} />
              </Box>
            );
          }
          return (
            <Box key={m.id} sx={{ display: "flex", gap: 1.25 }}>
              <Avatar sx={{ width: 28, height: 28, backgroundColor: "rgba(255,255,255,0.08)", mt: 0.25 }}>
                <SmartToyIcon sx={{ fontSize: 16 }} />
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                {(m.agent || m.kind) && (
                  <Box sx={{ display: "flex", gap: 0.5, mb: 0.5, flexWrap: "wrap" }}>
                    {m.agent && <Chip label={m.agent} size="small" variant="outlined" sx={{ height: 20, fontSize: "0.65rem" }} />}
                    {m.kind && <Chip label={m.kind} size="small" sx={{ height: 20, fontSize: "0.65rem" }} />}
                  </Box>
                )}
                <Box
                  sx={{
                    "& > *:first-of-type": { mt: "0 !important" },
                    "& > *:last-child": { mb: "0 !important" },
                  }}
                >
                  <MarkdownBoundary content={m.content}>
                    <Markdown content={m.content} />
                  </MarkdownBoundary>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                  <CopyButton text={m.content} />
                  <Typography variant="caption" color="text.disabled">
                    {fmtTime(m.created_at)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}

        {/* Live streaming assistant turn */}
        {(running || output) && (
          <Box sx={{ display: "flex", gap: 1.25 }}>
            <Avatar sx={{ width: 28, height: 28, backgroundColor: "rgba(255,255,255,0.08)", mt: 0.25 }}>
              <SmartToyIcon sx={{ fontSize: 16 }} />
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <PipelineTimeline steps={steps} running={running} />
              {output ? (
                <Box
                  sx={{
                    "& > *:first-of-type": { mt: "0 !important" },
                    "& > *:last-child": { mb: "0 !important" },
                  }}
                >
                  <MarkdownBoundary content={output}>
                    <Markdown content={output} />
                  </MarkdownBoundary>
                </Box>
              ) : (
                <Box>
                  <Skeleton />
                  <Skeleton width="60%" />
                </Box>
              )}
              {running && !output && (
                <Typography variant="caption" color="primary">
                  ● streaming
                </Typography>
              )}
              {fileCount > 0 && !running && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<FolderOpenIcon />}
                  onClick={onOpenArtifacts}
                  sx={{ mt: 1, borderRadius: 3, textTransform: "none" }}
                >
                  View {fileCount} generated file{fileCount === 1 ? "" : "s"}
                </Button>
              )}
            </Box>
          </Box>
        )}

        {(error || messagesError) && (
          <Typography variant="body2" color="error">
            {error ?? messagesError}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
