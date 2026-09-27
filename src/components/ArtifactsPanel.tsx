"use client";
import { useEffect, useState } from "react";
import { Box, Drawer, IconButton, Paper, Tab, Tabs, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useAgentStore } from "@/store/useAgentStore";
import { CopyButton } from "./Markdown";

export default function ArtifactsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const result = useAgentStore((s) => s.result);
  const [tab, setTab] = useState(0);
  const files = result ? Object.keys(result.artifacts ?? {}) : [];

  useEffect(() => {
    setTab(0);
  }, [result]);

  const safeTab = files.length === 0 ? 0 : Math.min(tab, files.length - 1);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ "& .MuiDrawer-paper": { width: { xs: "100%", sm: 480 }, backgroundColor: "#171717" } }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
            Artifacts
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {result
              ? `retries: ${result.retries_used ?? 0} · reports: ${result.exec_reports?.length ?? 0}`
              : "Final files appear here after a run"}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Close artifacts">
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ p: 2 }}>
        {!result ? (
          <Typography variant="body2" color="text.secondary">
            Run the agent from the composer below — generated files, exec reports and retries will show up here.
          </Typography>
        ) : files.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Run finished with no artifacts. Check the chat thread for the summary.
          </Typography>
        ) : (
          <>
            <Tabs value={safeTab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
              {files.map((f) => (
                <Tab key={f} label={f} sx={{ textTransform: "none" }} />
              ))}
            </Tabs>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
              <CopyButton text={String((result.artifacts as Record<string, string>)[files[safeTab]] ?? "")} />
            </Box>
            <Paper variant="outlined" sx={{ p: 2, mt: 1, maxHeight: "calc(100dvh - 260px)", overflow: "auto", backgroundColor: "#0d1117" }}>
              <Typography variant="body2" component="pre" sx={{ whiteSpace: "pre-wrap", m: 0, fontSize: "0.8rem" }}>
                {String((result.artifacts as Record<string, string>)[files[safeTab]] ?? "")}
              </Typography>
            </Paper>
          </>
        )}
      </Box>
    </Drawer>
  );
}
