"use client";
import { createTheme } from "@mui/material/styles";

// ChatGPT-style dark shell: near-black sidebar (#171717), main (#212121),
// input bubbles (#2f2f2f), green activity accent.
export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#19c37d" },
    secondary: { main: "#19c37d" },
    background: { default: "#212121", paper: "#2f2f2f" },
    text: { primary: "#ececec", secondary: "#b4b4b4" },
    divider: "rgba(255,255,255,0.12)",
  },
  typography: {
    fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "#212121" },
        "*::-webkit-scrollbar": { width: 8, height: 8 },
        "*::-webkit-scrollbar-thumb": {
          backgroundColor: "rgba(255,255,255,0.16)",
          borderRadius: 8,
        },
        "*::-webkit-scrollbar-track": { backgroundColor: "transparent" },
      },
    },
    MuiListItemButton: {
      styleOverrides: { root: { "&.Mui-selected": { backgroundColor: "rgba(255,255,255,0.08)" } } },
    },
  },
});
