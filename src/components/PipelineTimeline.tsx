"use client";
import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PsychologyIcon from "@mui/icons-material/Psychology";
import type { PipelineStep } from "@/store/useAgentStore";

const STAGES = ["architect", "developer", "qa", "writer"];

export default function PipelineTimeline({
  steps,
  running,
}: {
  steps: PipelineStep[];
  running: boolean;
}) {
  const [open, setOpen] = useState(true);
  if (steps.length === 0) return null;
  const seen = new Map(steps.map((s) => [s.agent.toLowerCase(), s]));
  const doneCount = STAGES.filter((s) => seen.has(s)).length;
  const last = steps[steps.length - 1];

  return (
    <Accordion
      expanded={open}
      onChange={(_, v) => setOpen(v)}
      disableGutters
      elevation={0}
      sx={{
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        "&:before": { display: "none" },
        mb: 1,
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />} sx={{ minHeight: 40 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <PsychologyIcon sx={{ fontSize: 16, color: running ? "primary.main" : "text.secondary" }} />
          <Typography variant="caption" color="text.secondary" noWrap>
            {running ? `Working… ${last.agent} (${last.status})` : `Pipeline complete · ${doneCount}/${STAGES.length} stages`}
          </Typography>
          {running && (
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: "primary.main",
                animation: "pulse 1.2s ease-in-out infinite",
                "@keyframes pulse": { "50%": { opacity: 0.3 } },
              }}
            />
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 1 }}>
          {STAGES.map((stage) => (
            <Chip
              key={stage}
              label={stage}
              size="small"
              color={seen.has(stage) ? "primary" : "default"}
              variant={seen.has(stage) ? "filled" : "outlined"}
              sx={{ fontSize: "0.65rem", height: 22 }}
            />
          ))}
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          {steps.slice(-8).map((s, i, arr) => (
            <Box key={`${s.agent}-${i}`} sx={{ display: "flex", gap: 1.25 }}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    mt: 0.6,
                    backgroundColor: i === arr.length - 1 && running ? "primary.main" : "text.disabled",
                  }}
                />
                {i < arr.length - 1 && <Box sx={{ width: 1.5, flexGrow: 1, backgroundColor: "divider", my: 0.25, minHeight: 10 }} />}
              </Box>
              <Box sx={{ pb: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {s.agent} <Typography component="span" variant="caption" color="text.secondary">· {s.status}</Typography>
                </Typography>
                {s.feedback && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.5 }}>
                    {s.feedback}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
