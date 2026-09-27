"use client";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AddIcon from "@mui/icons-material/Add";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { useChatStore } from "@/store/useChatStore";
import { useAgentStore } from "@/store/useAgentStore";
import HealthBadge from "./HealthBadge";

export default function ChatHeader({
  onMenu,
  onNewChat,
  onOpenArtifacts,
}: {
  onMenu: () => void;
  onNewChat: () => void;
  onOpenArtifacts: () => void;
}) {
  const sessions = useChatStore((s) => s.sessions);
  const currentId = useChatStore((s) => s.currentId);
  const running = useAgentStore((s) => s.running);
  const title = sessions.find((s) => s.id === currentId)?.title ?? "New chat";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 1,
        borderBottom: "1px solid",
        borderColor: "divider",
        backgroundColor: "rgba(33,33,33,0.9)",
        backdropFilter: "blur(8px)",
        position: "sticky",
        top: 0,
        zIndex: 5,
      }}
    >
      <IconButton onClick={onMenu} aria-label="Open history" sx={{ display: { md: "none" } }}>
        <MenuIcon />
      </IconButton>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
          AI Software Engineer · Architect → Developer → QA → Writer{running ? " · running…" : ""}
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ display: { xs: "none", sm: "block" } }}>
        <HealthBadge />
      </Box>
      <Tooltip title="Generated files">
        <IconButton onClick={onOpenArtifacts} aria-label="Open artifacts">
          <FolderOpenIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="New chat">
        <IconButton onClick={onNewChat} aria-label="New chat">
          <AddIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
