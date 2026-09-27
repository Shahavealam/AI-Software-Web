"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, Typography, Tabs, Tab, Box, Paper, Alert } from "@mui/material";
import { useAgentStore } from "@/store/useAgentStore";

export default function ArtifactsView() {
  const result = useAgentStore((s) => s.result);
  const error = useAgentStore((s) => s.error);
  const [tab, setTab] = useState(0);
  const files = result ? Object.keys(result.artifacts ?? {}) : [];

  // A new run can yield fewer files than the previous tab index.
  useEffect(() => {
    setTab(0);
  }, [result]);

  const safeTab = files.length === 0 ? 0 : Math.min(tab, files.length - 1);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          Artifacts {result ? `· retries: ${result.retries_used ?? 0} · reports: ${result.exec_reports?.length ?? 0}` : ""}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}
        {!result ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Final result (files, exec reports) will appear here after the run completes.
          </Typography>
        ) : files.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Run finished with no artifacts. Check live output / pipeline above.
          </Typography>
        ) : (
          <Box sx={{ mt: 1 }}>
            <Tabs value={safeTab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
              {files.map((f) => (
                <Tab key={f} label={f} />
              ))}
            </Tabs>
            <Paper variant="outlined" sx={{ p: 2, mt: 1, maxHeight: 420, overflow: "auto" }}>
              <Typography variant="body2" component="pre" sx={{ whiteSpace: "pre-wrap", m: 0 }}>
                {String((result.artifacts as Record<string, string>)[files[safeTab]] ?? "")}
              </Typography>
            </Paper>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
