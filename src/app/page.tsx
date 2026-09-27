"use client";
import { useState } from "react";
import { Box } from "@mui/material";
import Sidebar from "@/components/Sidebar";
import ChatHeader from "@/components/ChatHeader";
import ChatThread from "@/components/ChatThread";
import Composer from "@/components/Composer";
import ArtifactsPanel from "@/components/ArtifactsPanel";
import { useChatStore } from "@/store/useChatStore";
import { useAgentStore } from "@/store/useAgentStore";

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [artifactsOpen, setArtifactsOpen] = useState(false);
  const selectSession = useChatStore((s) => s.selectSession);
  const resetAgent = useAgentStore((s) => s.reset);
  const setGoal = useAgentStore((s) => s.setGoal);

  function handleNewChat() {
    resetAgent();
    setGoal("");
    void selectSession(null);
  }

  return (
    <Box sx={{ display: "flex", height: "100dvh", backgroundColor: "background.default" }}>
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onNewChat={handleNewChat}
      />
      <Box sx={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column", height: "100dvh" }}>
        <ChatHeader
          onMenu={() => setMobileOpen(true)}
          onNewChat={handleNewChat}
          onOpenArtifacts={() => setArtifactsOpen(true)}
        />
        <ChatThread onOpenArtifacts={() => setArtifactsOpen(true)} />
        <Composer />
      </Box>
      <ArtifactsPanel open={artifactsOpen} onClose={() => setArtifactsOpen(false)} />
    </Box>
  );
}
