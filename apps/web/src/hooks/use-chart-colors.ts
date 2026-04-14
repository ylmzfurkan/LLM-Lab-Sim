"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const FALLBACK = {
  primary: "#a78bfa",
  destructive: "#ef4444",
  chart1: "#a78bfa",
  chart2: "#34d399",
  chart3: "#fbbf24",
  mutedForeground: "#9ca3af",
  card: "#1f2937",
  border: "#374151",
};

export function useChartColors() {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState(FALLBACK);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const s = getComputedStyle(document.documentElement);
    const read = (v: string, fallback: string) => {
      const raw = s.getPropertyValue(v).trim();
      return raw || fallback;
    };
    setColors({
      primary: read("--primary", FALLBACK.primary),
      destructive: read("--destructive", FALLBACK.destructive),
      chart1: read("--chart-1", FALLBACK.chart1),
      chart2: read("--chart-2", FALLBACK.chart2),
      chart3: read("--chart-3", FALLBACK.chart3),
      mutedForeground: read("--muted-foreground", FALLBACK.mutedForeground),
      card: read("--card", FALLBACK.card),
      border: read("--border", FALLBACK.border),
    });
  }, [resolvedTheme]);

  return colors;
}
