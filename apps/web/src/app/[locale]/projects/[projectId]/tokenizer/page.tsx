"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { StepHeader } from "@/components/shared/step-header";
import { ConceptCard } from "@/components/shared/concept-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/stores/project-store";
import { apiPut } from "@/lib/api-client";
import { isDemoMode } from "@/lib/demo-mode";
import { BackButton } from "@/components/shared/step-navigation";
import {
  Type,
  Globe,
  Code,
  ArrowRight,
  Loader2,
  Hash,
  DollarSign,
  Gauge,
  BarChart3,
  Info,
} from "lucide-react";

const TOKENIZER_OPTIONS = [
  { value: "general", icon: Type },
  { value: "turkish_optimized", icon: Globe },
  { value: "code", icon: Code },
] as const;

interface TokenizerResult {
  token_count: number;
  estimated_cost: number;
  context_utilization: number;
  avg_tokens_per_sample: number;
  tokenizer_name: string;
  efficiency_score: number;
}

export default function TokenizerLabPage() {
  const t = useTranslations("tokenizer");
  const tCommon = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const updateStep = useProjectStore((s) => s.updateStep);
  const datasetId = useProjectStore((s) => s.datasetId);
  const setStepSelection = useProjectStore((s) => s.setStepSelection);

  const [tokenizerType, setTokenizerTypeState] = useState(
    () =>
      (useProjectStore.getState().stepSelections.tokenizer?.tokenizerType as
        | string
        | undefined) ?? ""
  );
  const setTokenizerType = (v: string) => {
    setTokenizerTypeState(v);
    setStepSelection("tokenizer", { tokenizerType: v });
  };
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TokenizerResult | null>(null);

  async function handleApply() {
    if (!tokenizerType) return;
    setLoading(true);

    try {
      const data = await apiPut<TokenizerResult>(
        `/api/projects/${params.projectId}/dataset/${datasetId}/tokenizer`,
        { tokenizer_type: tokenizerType }
      );
      setResult(data);
      updateStep(5);
    } catch (err) {
      if (!isDemoMode()) {
        console.error(err);
        setLoading(false);
        return;
      }
      const mockResult: TokenizerResult = {
        token_count: 12500000,
        estimated_cost: 25.0,
        context_utilization: 0.45,
        avg_tokens_per_sample: 278,
        tokenizer_name: tokenizerType === "general" ? "BPE (GPT-style)" : tokenizerType === "turkish_optimized" ? "Turkish BPE" : "Code-aware BPE",
        efficiency_score: tokenizerType === "turkish_optimized" ? 85 : tokenizerType === "code" ? 75 : 70,
      };
      setResult(mockResult);
      updateStep(5);
    }

    setLoading(false);
  }

  function handleNext() {
    router.push(`/projects/${params.projectId}/architecture`);
  }

  return (
    <TooltipProvider delayDuration={200}>
    <div className="max-w-4xl">
      <StepHeader title={t("title")} description={t("description")} stepNumber={4} />
      <ConceptCard stepKey="tokenizer" />

      <div className="space-y-8">
        {/* Tokenizer Selection */}
        <section>
          <h3 className="text-lg font-semibold mb-1">{t("selectTokenizer")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t("selectTokenizerDescription")}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TOKENIZER_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <Card
                  key={opt.value}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary/50 relative",
                    tokenizerType === opt.value && "border-primary ring-1 ring-primary"
                  )}
                  onClick={() => { setTokenizerType(opt.value); setResult(null); }}
                >
                  <CardContent className="p-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="absolute top-2 right-2 text-muted-foreground/50 hover:text-muted-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[280px] text-xs">
                        {t(`typeHints.${opt.value}`)}
                      </TooltipContent>
                    </Tooltip>
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{t(`types.${opt.value}`)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t(`typeDescriptions.${opt.value}`)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Apply Button */}
        {!result && (
          <div className="flex justify-end pt-4 border-t">
            <Button size="lg" disabled={!tokenizerType || loading} onClick={handleApply}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Hash className="mr-2 h-4 w-4" />
              )}
              {tCommon("apply")}
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
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t("tokenCount")}</span>
                  </div>
                  <span className="text-2xl font-bold font-mono">
                    {(result.token_count / 1_000_000).toFixed(1)}M
                  </span>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t("estimatedCost")}</span>
                  </div>
                  <span className="text-2xl font-bold font-mono">
                    ${result.estimated_cost.toFixed(2)}
                  </span>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t("avgTokensPerSample")}</span>
                  </div>
                  <span className="text-2xl font-bold font-mono">
                    {result.avg_tokens_per_sample.toFixed(0)}
                  </span>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t("efficiencyScore")}</span>
                  </div>
                  <span className={cn(
                    "text-2xl font-bold font-mono",
                    result.efficiency_score >= 80 ? "text-green-500" : "text-yellow-500"
                  )}>
                    {result.efficiency_score.toFixed(0)}
                  </span>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t("contextUtilization")}</span>
                  </div>
                  <Progress value={result.context_utilization * 100} className="h-3 mb-1" />
                  <span className="text-xs text-muted-foreground">
                    {(result.context_utilization * 100).toFixed(1)}%
                  </span>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between pt-4 border-t mt-6">
              <BackButton currentStep={4} />
              <Button size="lg" onClick={handleNext}>
                <ArrowRight className="mr-2 h-4 w-4" />
                {tCommon("next")}
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}
