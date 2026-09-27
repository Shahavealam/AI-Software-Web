"use client";
import ThemeRegistry from "@/components/ThemeRegistry";
import { AppBar, Toolbar, Typography, Container, Box } from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import HealthBadge from "@/components/HealthBadge";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <AppBar position="static">
            <Toolbar sx={{ gap: 1 }}>
              <SmartToyIcon />
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                AI Software Engineer Agent
              </Typography>
              <HealthBadge />
            </Toolbar>
          </AppBar>
          <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>{children}</Box>
          </Container>
        </ThemeRegistry>
      </body>
    </html>
  );
}
