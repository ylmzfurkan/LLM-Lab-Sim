"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { StepHeader } from "@/components/shared/step-header";
import { ConceptCard } from "@/components/shared/concept-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/stores/project-store";
import { apiPost } from "@/lib/api-client";
import { isDemoMode } from "@/lib/demo-mode";
import { BackButton } from "@/components/shared/step-navigation";
import {
  Search,
  Wrench,
  Layers,
  MessageSquare,
  ArrowRight,
  Loader2,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

const METHODS = [
  { value: "rag", icon: Search, boost: 8 },
  { value: "finetune", icon: Wrench, boost: 15 },
  { value: "lora", icon: Layers, boost: 12 },
  { value: "instruction_tuning", icon: MessageSquare, boost: 10 },
] as const;

export default function CustomizationStudioPage() {
  const t = useTranslations("customization");
  const tCommon = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const updateScores = useProjectStore((s) => s.updateScores);
  const updateStep = useProjectStore((s) => s.updateStep);
  const scores = useProjectStore((s) => s.scores);

  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [boost, setBoost] = useState(0);

  async function handleApply() {
    if (!selected) return;
    setLoading(true);

    try {
      const data = await apiPost<{ scores: { model_performance: number }; performance_boost: number }>(
        `/api/projects/${params.projectId}/simulate/customization`,
        { customization_type: selected }
      );
      setBoost(data.performance_boost);
      updateScores({ model_performance: data.scores.model_performance });
      updateStep(10);
    } catch (err) {
      if (!isDemoMode()) {
        console.error(err);
        setLoading(false);
        return;
      }
      const method = METHODS.find((m) => m.value === selected);
      const mockBoost = method?.boost || 10;
      setBoost(mockBoost);
      updateScores({ model_performance: Math.min(100, scores.model_performance + mockBoost) });
      updateStep(10);
    }

    setApplied(true);
    setLoading(false);
  }

  function handleNext() {
    if (selected === "rag") {
      router.push(`/projects/${params.projectId}/rag`);
    } else {
      router.push(`/projects/${params.projectId}/fine-tune`);
    }
  }

  return (
    <div className="max-w-4xl">
      <StepHeader title={t("title")} description={t("description")} stepNumber={9} />
      <ConceptCard stepKey="customization" />

      <div className="space-y-8">
        {/* Current Performance */}
        <Card className="border-primary/20">
          <CardContent className="p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("currentPerformance")}</span>
            <span className="text-2xl font-bold font-mono">{scores.model_performance.toFixed(1)}</span>
          </CardContent>
        </Card>

        {/* Method Selection */}
        <section>
          <h3 className="text-lg font-semibold mb-1">{t("selectMethod")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t("selectMethodDescription")}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <Card
                  key={method.value}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary/50",
                    selected === method.value && "border-primary ring-1 ring-primary",
                    applied && "pointer-events-none"
                  )}
                  onClick={() => { if (!applied) setSelected(method.value); }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{t(`methods.${method.value}`)}</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/10">
                        {t(`boostValues.${method.value}`)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t(`methodDescriptions.${method.value}`)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Applied Result */}
        {applied && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-500">{t("applied")}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  {t("performanceBoost")}: <span className="font-bold text-green-500">+{boost}</span>
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Apply / Next */}
        <div className="flex justify-between pt-4 border-t">
          <BackButton currentStep={9} />
          {!applied ? (
            <Button size="lg" disabled={!selected || loading} onClick={handleApply}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="mr-2 h-4 w-4" />
              )}
              {tCommon("apply")}
            </Button>
          ) : (
            <Button size="lg" onClick={handleNext}>
              <ArrowRight className="mr-2 h-4 w-4" />
              {tCommon("next")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
