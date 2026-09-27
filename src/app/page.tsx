"use client";
import { Box, Grid, Typography, Divider } from "@mui/material";
import GoalForm from "@/components/GoalForm";
import StreamView from "@/components/StreamView";
import PipelineView from "@/components/PipelineView";
import ArtifactsView from "@/components/ArtifactsView";

export default function HomePage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h4" gutterBottom>
          🤖 AI Software Engineer Agent
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Describe a goal in natural language. The backend (Architect → Developer → QA → Writer) streams
          tokens, state and the final result over SSE.
        </Typography>
      </Box>
      <Divider />
      <GoalForm />
      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <StreamView />
        </Grid>
        <Grid item xs={12} md={5}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <PipelineView />
            <ArtifactsView />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
