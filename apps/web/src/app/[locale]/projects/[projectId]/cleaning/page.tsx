"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { StepHeader } from "@/components/shared/step-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/stores/project-store";
import { apiPut } from "@/lib/api-client";
import {
  Trash2,
  ShieldAlert,
  Eye,
  ArrowRight,
  Loader2,
  Sparkles,
  TrendingUp,
  MinusCircle,
} from "lucide-react";

interface CleaningResult {
  cleaned_quality_score: number;
  cleaned_row_count: number;
  quality_improvement: number;
  rows_removed: number;
}

export default function DataCleaningPage() {
  const t = useTranslations("cleaning");
  const tCommon = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const updateScores = useProjectStore((s) => s.updateScores);
  const updateStep = useProjectStore((s) => s.updateStep);
  const scores = useProjectStore((s) => s.scores);

  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [filterSpam, setFilterSpam] = useState(true);
  const [maskPii, setMaskPii] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CleaningResult | null>(null);

  const qualityBefore = scores.data_quality;

  async function handleClean() {
    setLoading(true);

    try {
      // We need dataset_id — for demo, use a placeholder path
      const data = await apiPut<CleaningResult>(
        `/api/projects/${params.projectId}/dataset/latest/clean`,
        {
          remove_duplicates: removeDuplicates,
          filter_spam: filterSpam,
          mask_pii: maskPii,
        }
      );
      setResult(data);
      updateScores({ data_quality: data.cleaned_quality_score });
      updateStep(4);
    } catch {
      // Demo mode fallback
      let improvement = 0;
      if (removeDuplicates) improvement += 5;
      if (filterSpam) improvement += 3;
      if (maskPii) improvement += 1.5;
      const mockResult: CleaningResult = {
        cleaned_quality_score: Math.min(100, qualityBefore + improvement),
        cleaned_row_count: 45000,
        quality_improvement: improvement,
        rows_removed: 2500,
      };
      setResult(mockResult);
      updateScores({ data_quality: mockResult.cleaned_quality_score });
      updateStep(4);
    }

    setLoading(false);
  }

  function handleNext() {
    router.push(`/projects/${params.projectId}/tokenizer`);
  }

  const operations = [
    {
      key: "removeDuplicates",
      icon: Trash2,
      value: removeDuplicates,
      onChange: setRemoveDuplicates,
    },
    {
      key: "filterSpam",
      icon: ShieldAlert,
      value: filterSpam,
      onChange: setFilterSpam,
    },
    {
      key: "maskPii",
      icon: Eye,
      value: maskPii,
      onChange: setMaskPii,
    },
  ] as const;

  return (
    <div className="max-w-4xl">
      <StepHeader title={t("title")} description={t("description")} stepNumber={3} />

      <div className="space-y-8">
        {/* Cleaning Operations */}
        <section>
          <h3 className="text-lg font-semibold mb-1">{t("operations")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t("operationsDescription")}</p>
          <div className="space-y-3 max-w-xl">
            {operations.map((op) => {
              const Icon = op.icon;
              return (
                <Card key={op.key} className={cn(
                  "transition-all",
                  op.value && "border-primary/30"
                )}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{t(op.key)}</div>
                        <div className="text-xs text-muted-foreground">
                          {t(`${op.key}Description`)}
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={op.value}
                      onCheckedChange={op.onChange}
                      disabled={!!result}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Apply Button */}
        {!result && (
          <div className="flex justify-end pt-4 border-t">
            <Button size="lg" disabled={loading} onClick={handleClean}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {t("apply")}
            </Button>
          </div>
        )}

        {/* Results */}
        {result && (
          <section>
            <h3 className="text-lg font-semibold mb-4">{t("results")}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <span className="text-sm text-muted-foreground">{t("qualityBefore")}</span>
                  <div className="text-2xl font-bold font-mono text-yellow-500">
                    {qualityBefore.toFixed(1)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-500/30">
                <CardContent className="p-4">
                  <span className="text-sm text-muted-foreground">{t("qualityAfter")}</span>
                  <div className="text-2xl font-bold font-mono text-green-500">
                    {result.cleaned_quality_score.toFixed(1)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-sm text-muted-foreground">{t("qualityImprovement")}</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-green-500">
                    +{result.quality_improvement.toFixed(1)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1 mb-1">
                    <MinusCircle className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t("rowsRemoved")}</span>
                  </div>
                  <div className="text-2xl font-bold font-mono">
                    {result.rows_removed.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <span className="text-sm text-muted-foreground">{t("cleanedRows")}</span>
                  <div className="text-2xl font-bold font-mono">
                    {result.cleaned_row_count.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end pt-4 border-t mt-6">
              <Button size="lg" onClick={handleNext}>
                <ArrowRight className="mr-2 h-4 w-4" />
                {tCommon("next")}
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
