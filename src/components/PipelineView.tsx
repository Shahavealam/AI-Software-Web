"use client";
import { Card, CardContent, Typography, Stepper, Step, StepLabel, Chip, Box } from "@mui/material";
import { useAgentStore } from "@/store/useAgentStore";

const STAGES = ["architect", "developer", "qa", "writer"];

export default function PipelineView() {
  const steps = useAgentStore((s) => s.steps);
  const seen = new Map(steps.map((s) => [s.agent.toLowerCase(), s]));
  const activeStep = Math.max(
    0,
    STAGES.findIndex((s) => !seen.has(s)) === -1 ? STAGES.length - 1 : STAGES.findIndex((s) => !seen.has(s))
  );

  if (steps.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="overline" color="text.secondary">
            Pipeline
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Architect → Developer → QA → Writer status will appear here.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="overline" color="text.secondary">
          Pipeline
        </Typography>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STAGES.map((stage) => (
            <Step key={stage} completed={seen.has(stage)}>
              <StepLabel>{stage}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {steps.slice(-8).map((s, i) => (
            <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
              <Chip label={s.agent} size="small" color="primary" variant="outlined" />
              <Chip label={s.status} size="small" />
              <Typography variant="body2" color="text.secondary">
                {s.feedback}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
