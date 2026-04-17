"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useProjectStore } from "@/stores/project-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  CheckCircle2,
  Database,
  Sparkles,
  Cpu,
  Settings,
  Play,
  FlaskConical,
  Gamepad2,
  BarChart2,
  Wrench,
  Rocket,
  FileText,
} from "lucide-react";

const STEP_ICONS: Record<string, React.ElementType> = {
  wizard: Sparkles,
  dataset: Database,
  cleaning: Sparkles,
  tokenizer: FileText,
  architecture: Cpu,
  trainingConfig: Settings,
  training: Play,
  report: BarChart2,
  customization: Wrench,
  rag: FlaskConical,
  fineTune: Sparkles,
  playground: Gamepad2,
  evaluation: TrendingUp,
  deployment: Rocket,
};

function formatSelection(stepKey: string, values: Record<string, unknown>): string {
  switch (stepKey) {
    case "wizard":
      return [values.model_purpose, values.target_domain].filter(Boolean).join(" · ") as string;
    case "architecture":
      return values.modelSize ? `${values.modelSize} model` : "";
    case "trainingConfig":
      return [
        values.mode,
        values.epochs ? `${values.epochs} epochs` : null,
        values.optimizer,
      ].filter(Boolean).join(", ") as string;
    case "dataset":
      return values.source ? String(values.source) : "";
    default:
      return Object.values(values).filter(Boolean).slice(0, 2).join(", ") as string;
  }
}

export function DecisionSummary() {
  const t = useTranslations("decisionSummary");
  const [open, setOpen] = useState(false);
  const scores = useProjectStore((s) => s.scores);
  const stepSelections = useProjectStore((s) => s.stepSelections);

  const scoreEntries = Object.entries(scores) as [keyof typeof scores, number][];
  const nonZeroScores = scoreEntries.filter(([, v]) => v > 0);
  if (nonZeroScores.length === 0) return null;

  const best = nonZeroScores.reduce((a, b) => (b[1] > a[1] ? b : a));
  const worst = nonZeroScores.reduce((a, b) => (b[1] < a[1] ? b : a));

  const stepKeys = Object.keys(stepSelections);

  const scoreLabel: Record<string, string> = {
    data_quality: t("scoreLabels.data_quality"),
    training_stability: t("scoreLabels.training_stability"),
    model_performance: t("scoreLabels.model_performance"),
    cost_efficiency: t("scoreLabels.cost_efficiency"),
  };

  return (
    <section className="pb-6">
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-sm font-medium">{t("toggle")}</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {open && (
        <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Best & Worst */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-green-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-medium text-muted-foreground">{t("bestArea")}</span>
                </div>
                <div className="text-sm font-semibold">{scoreLabel[best[0]]}</div>
                <div className="text-2xl font-bold font-mono text-green-500 mt-1">{best[1].toFixed(0)}</div>
              </CardContent>
            </Card>
            <Card className="border-yellow-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs font-medium text-muted-foreground">{t("worstArea")}</span>
                </div>
                <div className="text-sm font-semibold">{scoreLabel[worst[0]]}</div>
                <div className="text-2xl font-bold font-mono text-yellow-500 mt-1">{worst[1].toFixed(0)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Improvement tip */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-start gap-3">
              <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                {t("improvementTip", { area: scoreLabel[worst[0]], score: worst[1].toFixed(0) })}
              </p>
            </CardContent>
          </Card>

          {/* Step timeline */}
          {stepKeys.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("timeline")}</h4>
              {stepKeys.map((key) => {
                const Icon = STEP_ICONS[key] ?? CheckCircle2;
                const selection = stepSelections[key];
                const summary = formatSelection(key, selection);
                return (
                  <div key={key} className="flex items-center gap-3 py-1.5 border-b border-border/40 last:border-0">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                      {summary && (
                        <span className="text-xs text-muted-foreground ml-2 truncate">{summary}</span>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      <CheckCircle2 className="h-2.5 w-2.5 mr-1 text-green-500" />
                      {t("done")}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
