"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { StepHeader } from "@/components/shared/step-header";
import { ConceptCard } from "@/components/shared/concept-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/stores/project-store";
import { apiPost } from "@/lib/api-client";
import { isDemoMode } from "@/lib/demo-mode";
import { useChartColors } from "@/hooks/use-chart-colors";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BackButton } from "@/components/shared/step-navigation";
import {
  Play,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle2,
  Star,
} from "lucide-react";

interface TrainingResult {
  id: string;
  scores: {
    data_quality: number;
    training_stability: number;
    model_performance: number;
    cost_efficiency: number;
  };
  loss_curve: Array<{ step: number; epoch: number; train_loss: number; val_loss: number }>;
  gpu_usage: Array<{ step: number; epoch: number; gpu_utilization: number; memory_usage: number }>;
  training_logs: Array<{ level: string; message: string }>;
  checkpoints: Array<{ epoch: number; loss: number; is_best: boolean }>;
  warnings: Array<{ message: string; severity: string }>;
}

export default function TrainingSimulatorPage() {
  const t = useTranslations("training");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const updateScores = useProjectStore((s) => s.updateScores);
  const updateStep = useProjectStore((s) => s.updateStep);
  const chartColors = useChartColors();

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<TrainingResult | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  async function handleStart() {
    setLoading(true);
    setProgress(0);

    // Simulate progress animation
    progressRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      const data = await apiPost<TrainingResult>(
        `/api/projects/${params.projectId}/simulate/training`,
        { locale }
      );
      setResult(data);
      updateScores(data.scores);
      updateStep(8);
    } catch (err) {
      if (!isDemoMode()) {
        console.error(err);
        if (progressRef.current) clearInterval(progressRef.current);
        setLoading(false);
        return;
      }
      const mockLoss = Array.from({ length: 30 }, (_, i) => ({
        step: i * 10,
        epoch: +(i / 10).toFixed(2),
        train_loss: +(3.5 * Math.exp(-0.08 * i) + 0.4 + Math.random() * 0.1).toFixed(4),
        val_loss: +(3.5 * Math.exp(-0.07 * i) + 0.5 + Math.random() * 0.1).toFixed(4),
      }));
      const mockGpu = Array.from({ length: 15 }, (_, i) => ({
        step: i * 20,
        epoch: +(i / 5).toFixed(2),
        gpu_utilization: +(0.78 + Math.random() * 0.08).toFixed(3),
        memory_usage: +(0.62 + Math.random() * 0.05).toFixed(3),
      }));
      const mockResult: TrainingResult = {
        id: "demo",
        scores: { data_quality: 65, training_stability: 72, model_performance: 58, cost_efficiency: 70 },
        loss_curve: mockLoss,
        gpu_usage: mockGpu,
        training_logs: [
          { level: "info", message: "Starting training: 3 epochs, lr=0.0001" },
          { level: "info", message: "Epoch 1/3 - loss: 1.8234, val_loss: 1.9456" },
          { level: "info", message: "Checkpoint saved: epoch_1_loss_1.8234" },
          { level: "info", message: "Epoch 2/3 - loss: 0.9123, val_loss: 1.0234" },
          { level: "info", message: "Checkpoint saved: epoch_2_loss_0.9123" },
          { level: "info", message: "Epoch 3/3 - loss: 0.5432, val_loss: 0.6543" },
          { level: "info", message: "Checkpoint saved: epoch_3_loss_0.5432" },
          { level: "info", message: "Training completed. Final loss: 0.5432" },
        ],
        checkpoints: [
          { epoch: 1, loss: 1.8234, is_best: false },
          { epoch: 2, loss: 0.9123, is_best: false },
          { epoch: 3, loss: 0.5432, is_best: true },
        ],
        warnings: [
          { message: t("demoGoodConfig"), severity: "info" },
        ],
      };
      setResult(mockResult);
      updateScores(mockResult.scores);
      updateStep(8);
    }

    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(100);
    setLoading(false);
  }

  function handleNext() {
    router.push(`/projects/${params.projectId}/report`);
  }

  function logIcon(level: string) {
    if (level === "warning") return <AlertTriangle className="h-3 w-3 text-yellow-500 shrink-0 mt-0.5" />;
    if (level === "error") return <AlertCircle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />;
    return <Info className="h-3 w-3 text-blue-500 shrink-0 mt-0.5" />;
  }

  function severityColor(severity: string) {
    if (severity === "high") return "border-red-500/30 bg-red-500/5";
    if (severity === "medium") return "border-yellow-500/30 bg-yellow-500/5";
    if (severity === "low") return "border-blue-500/30 bg-blue-500/5";
    return "border-green-500/30 bg-green-500/5";
  }

  return (
    <TooltipProvider delayDuration={200}>
    <div className="max-w-4xl">
      <StepHeader title={t("title")} description={t("description")} stepNumber={7} />
      <ConceptCard stepKey="training" />

      <div className="space-y-8">
        {/* Start Training */}
        {!result && !loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Button size="lg" onClick={handleStart}>
              <Play className="mr-2 h-5 w-5" />
              {t("startTraining")}
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t("trainingInProgress")}</p>
            <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Success Banner */}
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="flex items-center gap-3 p-4">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-500">{t("trainingComplete")}</span>
              </CardContent>
            </Card>

            <Tabs defaultValue="loss" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <UITooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="loss">{t("lossCurve")}</TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[280px] text-xs">
                    {t("metricHints.lossCurve")}
                  </TooltipContent>
                </UITooltip>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="gpu">{t("gpuUsage")}</TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[280px] text-xs">
                    {t("metricHints.gpuUsage")}
                  </TooltipContent>
                </UITooltip>
                <TabsTrigger value="logs">{t("trainingLogs")}</TabsTrigger>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="checkpoints">{t("checkpoints")}</TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[280px] text-xs">
                    {t("metricHints.checkpoints")}
                  </TooltipContent>
                </UITooltip>
              </TabsList>

              {/* Loss Curve */}
              <TabsContent value="loss">
                <Card>
                  <CardContent className="p-4 pt-6">
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={result.loss_curve} margin={{ top: 16, right: 24, bottom: 32, left: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} />
                        <XAxis dataKey="epoch" label={{ value: t("epoch"), position: "insideBottom", offset: -12, fill: chartColors.mutedForeground, fontSize: 12 }} tick={{ fill: chartColors.mutedForeground, fontSize: 12 }} />
                        <YAxis label={{ value: t("loss"), angle: -90, position: "insideLeft", offset: 8, fill: chartColors.mutedForeground, fontSize: 12 }} tick={{ fill: chartColors.mutedForeground, fontSize: 12 }} tickFormatter={(v) => Number(v).toFixed(2)} />
                        <Tooltip contentStyle={{ background: chartColors.card, border: `1px solid ${chartColors.border}`, borderRadius: "8px", color: chartColors.mutedForeground }} labelStyle={{ color: chartColors.mutedForeground }} />
                        <Legend wrapperStyle={{ paddingTop: 12 }} />
                        <Line type="monotone" dataKey="train_loss" name={t("trainLoss")} stroke={chartColors.primary} strokeWidth={2.5} dot={false} />
                        <Line type="monotone" dataKey="val_loss" name={t("valLoss")} stroke={chartColors.destructive} strokeWidth={2.5} dot={false} strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* GPU Usage */}
              <TabsContent value="gpu">
                <Card>
                  <CardContent className="p-4 pt-6">
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={result.gpu_usage} margin={{ top: 16, right: 24, bottom: 32, left: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} />
                        <XAxis dataKey="epoch" label={{ value: t("epoch"), position: "insideBottom", offset: -12, fill: chartColors.mutedForeground, fontSize: 12 }} tick={{ fill: chartColors.mutedForeground, fontSize: 12 }} />
                        <YAxis domain={[0, 1]} tickFormatter={(v) => `${(Number(v) * 100).toFixed(0)}%`} tick={{ fill: chartColors.mutedForeground, fontSize: 12 }} />
                        <Tooltip formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`} contentStyle={{ background: chartColors.card, border: `1px solid ${chartColors.border}`, borderRadius: "8px", color: chartColors.mutedForeground }} labelStyle={{ color: chartColors.mutedForeground }} />
                        <Legend wrapperStyle={{ paddingTop: 12 }} />
                        <Area type="monotone" dataKey="gpu_utilization" name={t("gpuUtilization")} stroke={chartColors.primary} strokeWidth={2} fill={chartColors.primary} fillOpacity={0.25} />
                        <Area type="monotone" dataKey="memory_usage" name={t("memoryUsage")} stroke={chartColors.chart2} strokeWidth={2} fill={chartColors.chart2} fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Training Logs */}
              <TabsContent value="logs">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-80">
                      <div className="p-4 font-mono text-xs space-y-1">
                        {result.training_logs.map((log, i) => (
                          <div key={i} className="flex items-start gap-2">
                            {logIcon(log.level)}
                            <span className={cn(
                              log.level === "warning" && "text-yellow-500",
                              log.level === "error" && "text-red-500",
                              log.level === "info" && "text-muted-foreground",
                            )}>
                              {log.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Checkpoints */}
              <TabsContent value="checkpoints">
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {result.checkpoints.map((cp) => (
                        <div
                          key={cp.epoch}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            cp.is_best && "border-yellow-500/30 bg-yellow-500/5"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {cp.is_best && <Star className="h-4 w-4 text-yellow-500" />}
                            <span className="text-sm font-medium">
                              {t("epoch")} {cp.epoch}
                            </span>
                            {cp.is_best && (
                              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/10">
                                {t("bestCheckpoint")}
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm font-mono text-muted-foreground">
                            {t("loss")}: {cp.loss.toFixed(4)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-3">{t("warnings")}</h3>
                <div className="space-y-2">
                  {result.warnings.map((w, i) => (
                    <div key={i} className={cn("p-3 rounded-lg border text-sm", severityColor(w.severity))}>
                      {w.message}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="flex justify-between pt-4 border-t">
              <BackButton currentStep={7} />
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
