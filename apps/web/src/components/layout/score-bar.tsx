"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useProjectStore } from "@/stores/project-store";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function DeltaBadge({ delta }: { delta: number | undefined }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (delta === undefined || delta === 0) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(t);
  }, [delta]);

  if (!visible || delta === undefined || delta === 0) return null;

  const isPositive = delta > 0;
  return (
    <span
      className={cn(
        "text-[10px] font-mono font-bold px-1 py-0.5 rounded animate-in fade-in slide-in-from-bottom-1 duration-300",
        isPositive ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"
      )}
    >
      {isPositive ? "+" : ""}{delta.toFixed(0)}
    </span>
  );
}

function ScoreIndicator({
  label,
  value,
  delta,
  description,
}: {
  label: string;
  value: number;
  delta?: number;
  description: string;
}) {
  const color =
    value >= 70
      ? "text-green-500"
      : value >= 40
        ? "text-yellow-500"
        : value > 0
          ? "text-red-500"
          : "text-muted-foreground";

  const barColor =
    value >= 70
      ? "bg-green-500"
      : value >= 40
        ? "bg-yellow-500"
        : value > 0
          ? "bg-red-500"
          : "bg-muted";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col gap-1 min-w-[100px]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {label}
              </span>
              <span className={cn("text-sm font-mono font-semibold tabular-nums", color)}>
                {value > 0 ? value.toFixed(0) : "--"}
              </span>
              <DeltaBadge delta={delta} />
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", barColor)}
                style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{description}: <span className="font-mono font-semibold">{value > 0 ? value.toFixed(1) : "--"}</span>/100</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ScoreBar() {
  const t = useTranslations("scores");
  const scores = useProjectStore((s) => s.scores);
  const scoreDeltas = useProjectStore((s) => s.scoreDeltas);

  return (
    <div className="flex items-center gap-6 px-4 py-2.5 border-t bg-background/95 backdrop-blur">
      <ScoreIndicator
        label={t("dataQuality")}
        value={scores.data_quality}
        delta={scoreDeltas.data_quality}
        description={t("dataQuality")}
      />
      <ScoreIndicator
        label={t("trainingStability")}
        value={scores.training_stability}
        delta={scoreDeltas.training_stability}
        description={t("trainingStability")}
      />
      <ScoreIndicator
        label={t("modelPerformance")}
        value={scores.model_performance}
        delta={scoreDeltas.model_performance}
        description={t("modelPerformance")}
      />
      <ScoreIndicator
        label={t("costEfficiency")}
        value={scores.cost_efficiency}
        delta={scoreDeltas.cost_efficiency}
        description={t("costEfficiency")}
      />
    </div>
  );
}
