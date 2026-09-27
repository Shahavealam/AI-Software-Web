"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { useChatStore } from "@/store/useChatStore";
import { createSession, deleteSession, renameSession } from "@/lib/api";

const WIDTH = 280;

function timeLabel(ts?: number): string {
  if (!ts) return "";
  const d = new Date(ts * 1000 > 1e12 ? ts : ts * 1000);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function Sidebar({
  mobileOpen,
  onClose,
  onNewChat,
}: {
  mobileOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
}) {
  const sessions = useChatStore((s) => s.sessions);
  const currentId = useChatStore((s) => s.currentId);
  const search = useChatStore((s) => s.search);
  const setSearch = useChatStore((s) => s.setSearch);
  const refreshSessions = useChatStore((s) => s.refreshSessions);
  const upsertSession = useChatStore((s) => s.upsertSession);
  const removeSession = useChatStore((s) => s.removeSession);
  const renameLocal = useChatStore((s) => s.renameLocal);
  const selectSession = useChatStore((s) => s.selectSession);
  const sessionsLoading = useChatStore((s) => s.sessionsLoading);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    void refreshSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.last_preview ?? "").toLowerCase().includes(q)
    );
  }, [sessions, search]);

  async function handleNew() {
    try {
      const s = await createSession("New chat");
      upsertSession(s);
      await selectSession(s.id);
    } catch {
      // Offline fallback: ephemeral local session until first run persists it.
      const tmp = {
        id: `tmp-${Date.now()}`,
        title: "New chat",
        created_at: Date.now() / 1000,
        updated_at: Date.now() / 1000,
      };
      upsertSession(tmp);
      await selectSession(tmp.id);
    }
    onNewChat();
    onClose();
  }

  async function commitRename(id: string) {
    const title = editingTitle.trim();
    setEditingId(null);
    if (!title) return;
    renameLocal(id, title);
    if (id.startsWith("tmp-")) return;
    try {
      const updated = await renameSession(id, title);
      upsertSession(updated);
    } catch {
      /* keep optimistic title */
    }
  }

  async function handleDelete(id: string) {
    setMenuAnchor(null);
    removeSession(id);
    if (currentId === id) onNewChat();
    if (id.startsWith("tmp-")) return;
    try {
      await deleteSession(id);
      void refreshSessions();
    } catch {
      /* already removed locally */
    }
  }

  const body = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar sx={{ gap: 1, px: 2 }}>
        <SmartToyIcon color="primary" />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }} noWrap>
          AI Engineer
        </Typography>
        <Tooltip title="Refresh history">
          <IconButton size="small" onClick={() => void refreshSessions()} aria-label="Refresh history">
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Toolbar>
      <Box sx={{ px: 1.5, pb: 1 }}>
        <ListItemButton
          onClick={() => void handleNew()}
          sx={{
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.06)" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="New chat" primaryTypographyProps={{ variant: "body2", fontWeight: 600 }} />
        </ListItemButton>
        <TextField
          size="small"
          fullWidth
          placeholder="Search chats"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mt: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <Box sx={{ flexGrow: 1, overflowY: "auto", px: 1, pb: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
          {sessionsLoading ? "Loading…" : filtered.length === 0 ? "No conversations" : `Chats · ${filtered.length}`}
        </Typography>
        <List dense disablePadding>
          {filtered.map((s) => {
            const active = s.id === currentId;
            const isEditing = editingId === s.id;
            return (
              <ListItemButton
                key={s.id}
                selected={active}
                onClick={() => {
                  if (isEditing) return;
                  void selectSession(s.id);
                  onClose();
                }}
                sx={{
                  borderRadius: 2,
                  mb: 0.25,
                  "&.Mui-selected": { backgroundColor: "rgba(255,255,255,0.08)" },
                  "&:hover .row-actions": { opacity: 1 },
                }}
              >
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />
                </ListItemIcon>
                {isEditing ? (
                  <TextField
                    autoFocus
                    size="small"
                    fullWidth
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => void commitRename(s.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void commitRename(s.id);
                      if (e.key === "Escape") setEditingId(null);
                      e.stopPropagation();
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <ListItemText
                    primary={s.title || "Untitled"}
                    secondary={s.last_preview || timeLabel(s.updated_at ?? s.created_at)}
                    primaryTypographyProps={{ variant: "body2", noWrap: true }}
                    secondaryTypographyProps={{ variant: "caption", noWrap: true }}
                    sx={{ minWidth: 0 }}
                  />
                )}
                {!isEditing && (
                  <Box
                    className="row-actions"
                    sx={{ opacity: active ? 1 : 0, transition: "opacity 0.15s", ml: 0.5 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconButton
                      size="small"
                      aria-label="Chat actions"
                      onClick={(e) => {
                        setMenuAnchor(e.currentTarget);
                        setMenuId(s.id);
                      }}
                    >
                      <MoreHorizIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </ListItemButton>
            );
          })}
        </List>
      </Box>
      <Box sx={{ p: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
        <Typography variant="caption" color="text.secondary" noWrap>
          History: GET /v1/sessions · auto-titled threads
        </Typography>
      </Box>
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem
          onClick={() => {
            const s = sessions.find((x) => x.id === menuId);
            setMenuAnchor(null);
            if (s && menuId) {
              setEditingId(menuId);
              setEditingTitle(s.title);
            }
          }}
        >
          <DriveFileRenameOutlineIcon fontSize="small" style={{ marginRight: 8 }} /> Rename
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuId) void handleDelete(menuId);
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteOutlineIcon fontSize="small" style={{ marginRight: 8 }} /> Delete
        </MenuItem>
      </Menu>
    </Box>
  );

  return (
    <>
      {/* Desktop */}
      <Box
        sx={{
          width: WIDTH,
          flexShrink: 0,
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          borderRight: "1px solid",
          borderColor: "divider",
          backgroundColor: "#171717",
          height: "100dvh",
          position: "sticky",
          top: 0,
        }}
      >
        {body}
      </Box>
      {/* Mobile */}
      <Drawer
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { md: "none" }, "& .MuiDrawer-paper": { width: WIDTH, backgroundColor: "#171717" } }}
      >
        {body}
      </Drawer>
    </>
  );
}
