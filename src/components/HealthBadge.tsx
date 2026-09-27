"use client";
import { useEffect, useState } from "react";
import { Chip, CircularProgress } from "@mui/material";
import SignalWifiStatusbar4BarIcon from "@mui/icons-material/SignalWifiStatusbar4Bar";
import SignalWifiOffIcon from "@mui/icons-material/SignalWifiOff";
import { getHealth } from "@/lib/api";

export default function HealthBadge() {
  const [label, setLabel] = useState("checking…");
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    getHealth()
      .then((h) => {
        setLabel(`${h.status} · llm:${h.llm}`);
        setOk(true);
      })
      .catch((e: Error) => {
        setLabel(`backend unreachable`);
        setOk(false);
      });
  }, []);

  if (ok === null) {
    return <Chip icon={<CircularProgress size={14} />} label={label} variant="outlined" />;
  }
  return (
    <Chip
      icon={ok ? <SignalWifiStatusbar4BarIcon /> : <SignalWifiOffIcon />}
      label={label}
      color={ok ? "success" : "error"}
      variant="outlined"
    />
  );
}
