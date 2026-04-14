"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { StepHeader } from "@/components/shared/step-header";
import { ConceptCard } from "@/components/shared/concept-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/stores/project-store";
import { apiPost } from "@/lib/api-client";
import { isDemoMode } from "@/lib/demo-mode";
import { BackButton } from "@/components/shared/step-navigation";
import {
  ArrowRight,
  Loader2,
  Search,
  Scissors,
  Box,
  FileSearch,
  Sparkles,
  CheckCircle2,
  ArrowDown,
  Info,
} from "lucide-react";

interface RAGResult {
  retrieval_accuracy: number;
  answer_quality: number;
  pipeline_steps: Array<{ step: string; detail: string }>;
}

const PIPELINE_ICONS = [Scissors, Box, FileSearch, Sparkles];

export default function RAGSimulatorPage() {
  const t = useTranslations("rag");
  const tCommon = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const updateStep = useProjectStore((s) => s.updateStep);

  const [chunkSize, setChunkSize] = useState(512);
  const [topK, setTopK] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RAGResult | null>(null);

  async function handleRun() {
    setLoading(true);

    try {
      const data = await apiPost<RAGResult>(
        `/api/projects/${params.projectId}/simulate/rag`,
        { chunk_size: chunkSize, top_k: topK }
      );
      setResult(data);
      updateStep(11);
    } catch (err) {
      if (!isDemoMode()) {
        console.error(err);
        setLoading(false);
        return;
      }
      setResult({
        retrieval_accuracy: 78.5,
        answer_quality: 72.3,
        pipeline_steps: [
          { step: "Chunking", detail: `Split into ${chunkSize}-token chunks` },
          { step: "Embedding", detail: "Generated vector embeddings" },
          { step: "Retrieval", detail: `Retrieved top-${topK} relevant chunks` },
          { step: "Generation", detail: "Generated answer with context" },
        ],
      });
      updateStep(11);
    }

    setLoading(false);
  }

  function handleNext() {
    router.push(`/projects/${params.projectId}/fine-tune`);
  }

  return (
    <TooltipProvider delayDuration={200}>
    <div className="max-w-4xl">
      <StepHeader title={t("title")} description={t("description")} stepNumber={10} />
      <ConceptCard stepKey="rag" />

      <div className="space-y-8">
        {/* Chunk Size */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold">{t("chunkSize")}</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground/50 hover:text-muted-foreground">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px] text-xs">
                {t("chunkHint")}
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t("chunkSizeDescription")}</p>
          <div className="max-w-md space-y-2">
            <Slider value={[chunkSize]} onValueChange={(v) => setChunkSize(v[0])} min={128} max={2048} step={64} />
            <span className="text-sm font-mono">{chunkSize} tokens</span>
          </div>
        </section>

        {/* Top-K */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold">{t("topK")}</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground/50 hover:text-muted-foreground">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px] text-xs">
                {t("topKHint")}
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t("topKDescription")}</p>
          <div className="max-w-md space-y-2">
            <Slider value={[topK]} onValueChange={(v) => setTopK(v[0])} min={1} max={10} step={1} />
            <span className="text-sm font-mono">{topK}</span>
          </div>
        </section>

        {/* Run Button */}
        {!result && (
          <div className="flex justify-end pt-4 border-t">
            <Button size="lg" disabled={loading} onClick={handleRun}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              {t("runSimulation")}
            </Button>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Pipeline Visualization */}
            <section>
              <h3 className="text-lg font-semibold mb-4">{t("pipeline")}</h3>
              <div className="flex flex-col items-center gap-2">
                {result.pipeline_steps.map((step, i) => {
                  const Icon = PIPELINE_ICONS[i] || CheckCircle2;
                  return (
                    <div key={i} className="w-full max-w-md">
                      <Card className="border-primary/20">
                        <CardContent className="flex items-center gap-3 p-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{t(`pipelineSteps.${step.step.toLowerCase()}`)}</div>
                            <div className="text-xs text-muted-foreground">{step.detail}</div>
                          </div>
                        </CardContent>
                      </Card>
                      {i < result.pipeline_steps.length - 1 && (
                        <div className="flex justify-center py-1">
                          <ArrowDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Metrics */}
            <section>
              <h3 className="text-lg font-semibold mb-4">{t("results")}</h3>
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <Card>
                  <CardContent className="p-4">
                    <span className="text-sm text-muted-foreground">{t("retrievalAccuracy")}</span>
                    <div className={cn(
                      "text-2xl font-bold font-mono",
                      result.retrieval_accuracy >= 70 ? "text-green-500" : "text-yellow-500"
                    )}>
                      {result.retrieval_accuracy.toFixed(1)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <span className="text-sm text-muted-foreground">{t("answerQuality")}</span>
                    <div className={cn(
                      "text-2xl font-bold font-mono",
                      result.answer_quality >= 70 ? "text-green-500" : "text-yellow-500"
                    )}>
                      {result.answer_quality.toFixed(1)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            <div className="flex justify-between pt-4 border-t">
              <BackButton currentStep={10} />
              <Button size="lg" onClick={handleNext}>
                <ArrowRight className="mr-2 h-4 w-4" />
                {tCommon("next")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}
