"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { StepHeader } from "@/components/shared/step-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/stores/project-store";
import { apiPost } from "@/lib/api-client";
import {
  Cpu,
  Server,
  Building2,
  ArrowRight,
  Loader2,
  Layers,
  Clock,
  DollarSign,
  Gauge,
  Zap,
  Network,
} from "lucide-react";

const SIZE_OPTIONS = [
  { value: "small", icon: Cpu },
  { value: "medium", icon: Server },
  { value: "large", icon: Building2 },
] as const;

const CONTEXT_OPTIONS = [2048, 4096, 8192, 16384, 32768] as const;

const ARCH_OPTIONS = [
  { value: "dense", icon: Layers },
  { value: "moe", icon: Network },
] as const;

interface ArchResult {
  parameter_count: number;
  num_layers: number;
  hidden_size: number;
  num_attention_heads: number;
  gpu_requirement: number;
  estimated_training_hours: number;
  estimated_training_cost: number;
  architecture_capability: number;
}

export default function ArchitectureBuilderPage() {
  const t = useTranslations("architecture");
  const tCommon = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const updateScores = useProjectStore((s) => s.updateScores);
  const updateStep = useProjectStore((s) => s.updateStep);

  const [modelSize, setModelSize] = useState("");
  const [contextWindow, setContextWindow] = useState(4096);
  const [archType, setArchType] = useState("dense");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ArchResult | null>(null);

  const isReady = modelSize !== "";

  async function handleApply() {
    if (!isReady) return;
    setLoading(true);

    try {
      const data = await apiPost<ArchResult>(
        `/api/projects/${params.projectId}/model-config/architecture`,
        {
          model_size: modelSize,
          context_window: contextWindow,
          architecture_type: archType,
        }
      );
      setResult(data);
      const maxCost = 100000;
      updateScores({ cost_efficiency: Math.max(0, Math.min(100, 100 - (data.estimated_training_cost / maxCost * 100))) });
      updateStep(6);
    } catch {
      const specs: Record<string, ArchResult> = {
        small: { parameter_count: 1e9, num_layers: 24, hidden_size: 2048, num_attention_heads: 16, gpu_requirement: 1, estimated_training_hours: 24, estimated_training_cost: 60, architecture_capability: 40 },
        medium: { parameter_count: 7e9, num_layers: 32, hidden_size: 4096, num_attention_heads: 32, gpu_requirement: 4, estimated_training_hours: 168, estimated_training_cost: 1680, architecture_capability: 70 },
        large: { parameter_count: 70e9, num_layers: 80, hidden_size: 8192, num_attention_heads: 64, gpu_requirement: 16, estimated_training_hours: 720, estimated_training_cost: 28800, architecture_capability: 95 },
      };
      const mock = specs[modelSize] || specs.medium;
      setResult(mock);
      const maxCost = 100000;
      updateScores({ cost_efficiency: Math.max(0, Math.min(100, 100 - (mock.estimated_training_cost / maxCost * 100))) });
      updateStep(6);
    }

    setLoading(false);
  }

  function handleNext() {
    router.push(`/projects/${params.projectId}/training-config`);
  }

  function formatParams(count: number) {
    if (count >= 1e9) return `${(count / 1e9).toFixed(0)}B`;
    if (count >= 1e6) return `${(count / 1e6).toFixed(0)}M`;
    return count.toLocaleString();
  }

  return (
    <div className="max-w-4xl">
      <StepHeader title={t("title")} description={t("description")} stepNumber={5} />

      <div className="space-y-8">
        {/* Model Size */}
        <section>
          <h3 className="text-lg font-semibold mb-1">{t("modelSize")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t("modelSizeDescription")}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SIZE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <Card
                  key={opt.value}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary/50",
                    modelSize === opt.value && "border-primary ring-1 ring-primary"
                  )}
                  onClick={() => { setModelSize(opt.value); setResult(null); }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{t(`sizes.${opt.value}`)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{t(`sizeDescriptions.${opt.value}`)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Context Window */}
        <section>
          <h3 className="text-lg font-semibold mb-1">{t("contextWindow")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t("contextWindowDescription")}</p>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 max-w-2xl">
            {CONTEXT_OPTIONS.map((ctx) => (
              <Card
                key={ctx}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  contextWindow === ctx && "border-primary ring-1 ring-primary"
                )}
                onClick={() => { setContextWindow(ctx); setResult(null); }}
              >
                <CardContent className="flex items-center justify-center p-3">
                  <span className="text-sm font-mono font-medium">
                    {ctx >= 1024 ? `${ctx / 1024}K` : ctx}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Architecture Type */}
        <section>
          <h3 className="text-lg font-semibold mb-1">{t("architectureType")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t("architectureTypeDescription")}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl">
            {ARCH_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <Card
                  key={opt.value}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary/50",
                    archType === opt.value && "border-primary ring-1 ring-primary"
                  )}
                  onClick={() => { setArchType(opt.value); setResult(null); }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{t(`types.${opt.value}`)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{t(`typeDescriptions.${opt.value}`)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Apply Button */}
        {!result && (
          <div className="flex justify-end pt-4 border-t">
            <Button size="lg" disabled={!isReady || loading} onClick={handleApply}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              {tCommon("apply")}
            </Button>
          </div>
        )}

        {/* Results */}
        {result && (
          <section>
            <h3 className="text-lg font-semibold mb-4">{t("results")}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <span className="text-xs text-muted-foreground">{t("parameters")}</span>
                  <div className="text-xl font-bold font-mono">{formatParams(result.parameter_count)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <span className="text-xs text-muted-foreground">{t("layers")}</span>
                  <div className="text-xl font-bold font-mono">{result.num_layers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <span className="text-xs text-muted-foreground">{t("hiddenSize")}</span>
                  <div className="text-xl font-bold font-mono">{result.hidden_size.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <span className="text-xs text-muted-foreground">{t("attentionHeads")}</span>
                  <div className="text-xl font-bold font-mono">{result.num_attention_heads}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1 mb-1">
                    <Cpu className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t("gpuRequirement")}</span>
                  </div>
                  <div className="text-xl font-bold font-mono">{result.gpu_requirement}x A100</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t("trainingHours")}</span>
                  </div>
                  <div className="text-xl font-bold font-mono">{result.estimated_training_hours.toFixed(0)}h</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1 mb-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t("trainingCost")}</span>
                  </div>
                  <div className="text-xl font-bold font-mono">${result.estimated_training_cost.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card className="border-primary/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1 mb-1">
                    <Gauge className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t("capability")}</span>
                  </div>
                  <div className={cn(
                    "text-xl font-bold font-mono",
                    result.architecture_capability >= 70 ? "text-green-500" :
                    result.architecture_capability >= 40 ? "text-yellow-500" : "text-red-500"
                  )}>
                    {result.architecture_capability.toFixed(0)}
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
