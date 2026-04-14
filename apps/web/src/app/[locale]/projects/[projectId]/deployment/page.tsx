"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { StepHeader } from "@/components/shared/step-header";
import { ConceptCard } from "@/components/shared/concept-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { apiPost } from "@/lib/api-client";
import { isDemoMode } from "@/lib/demo-mode";
import { BackButton } from "@/components/shared/step-navigation";
import {
  Loader2,
  Rocket,
  Copy,
  Check,
  CheckCircle2,
  DollarSign,
  Server,
  Clock,
  Cpu,
  Activity,
  PartyPopper,
  Info,
} from "lucide-react";

interface DeployResult {
  training_costs: {
    compute_cost: number;
    storage_cost: number;
    transfer_cost: number;
    total_cost: number;
    hourly_rate: number;
    gpu_type: string;
    gpu_count: number;
  };
  deployment_costs: {
    inference_cost_per_1k_tokens: number;
    daily_inference_cost: number;
    monthly_inference_cost: number;
    monthly_server_cost: number;
    total_monthly_cost: number;
    avg_latency_ms: number;
    requests_per_day: number;
  };
  api_endpoint: string;
  api_example: {
    method: string;
    url: string;
    body: Record<string, unknown>;
  };
}

export default function DeploymentSimulatorPage() {
  const t = useTranslations("deployment");
  const params = useParams();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeployResult | null>(null);
  const [deployed, setDeployed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deployStage, setDeployStage] = useState(0);

  const deploySteps = (t.raw("deploySteps") as string[]) ?? [];

  useEffect(() => {
    if (!deployed) {
      setDeployStage(0);
      return;
    }
    const interval = setInterval(() => {
      setDeployStage((s) => (s < deploySteps.length ? s + 1 : s));
    }, 650);
    return () => clearInterval(interval);
  }, [deployed, deploySteps.length]);

  async function handleDeploy() {
    setLoading(true);

    try {
      const data = await apiPost<DeployResult>(
        `/api/projects/${params.projectId}/simulate/deployment`
      );
      setResult(data);
    } catch (err) {
      if (!isDemoMode()) {
        console.error(err);
        setLoading(false);
        return;
      }
      setResult({
        training_costs: { compute_cost: 1680, storage_cost: 1.12, transfer_cost: 0.7, total_cost: 1681.82, hourly_rate: 10, gpu_type: "NVIDIA A100 80GB", gpu_count: 4 },
        deployment_costs: { inference_cost_per_1k_tokens: 0.002, daily_inference_cost: 1.0, monthly_inference_cost: 30, monthly_server_cost: 200, total_monthly_cost: 230, avg_latency_ms: 150, requests_per_day: 1000 },
        api_endpoint: "https://api.llm-lab.ai/v1/models/chatbot-medium/completions",
        api_example: { method: "POST", url: "https://api.llm-lab.ai/v1/models/chatbot-medium/completions", body: { prompt: "Hello, world!", max_tokens: 100, temperature: 0.7 } },
      });
    }

    setLoading(false);
  }

  function handleFinalDeploy() {
    setDeployed(true);
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const curlExample = result
    ? `curl -X POST "${result.api_endpoint}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(result.api_example.body, null, 2)}'`
    : "";

  return (
    <TooltipProvider delayDuration={200}>
    <div className="max-w-4xl">
      <StepHeader title={t("title")} description={t("description")} stepNumber={14} />
      <ConceptCard stepKey="deployment" />

      <div className="space-y-8">
        {/* Initial State */}
        {!result && !loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Button size="lg" onClick={handleDeploy}>
              <Rocket className="mr-2 h-5 w-5" />
              {t("simulateDeploy")}
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {result && !deployed && (
          <>
            {/* API Endpoint */}
            <section>
              <h3 className="text-lg font-semibold mb-3">{t("apiEndpoint")}</h3>
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <code className="text-sm font-mono break-all">{result.api_endpoint}</code>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(result.api_endpoint)}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </CardContent>
              </Card>
            </section>

            {/* API Example */}
            <section>
              <h3 className="text-lg font-semibold mb-3">{t("apiExample")}</h3>
              <Card>
                <CardContent className="p-4">
                  <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap overflow-x-auto">
                    {curlExample}
                  </pre>
                </CardContent>
              </Card>
            </section>

            {/* Training Costs */}
            <section>
              <h3 className="text-lg font-semibold mb-3">{t("trainingCosts")}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">{t("computeCost")}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="text-muted-foreground/50 hover:text-muted-foreground">
                            <Info className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[280px] text-xs">
                          {t("costHints.compute")}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-lg font-bold font-mono">${result.training_costs.compute_cost.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">{t("storageCost")}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="text-muted-foreground/50 hover:text-muted-foreground">
                            <Info className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[280px] text-xs">
                          {t("costHints.storage")}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-lg font-bold font-mono">${result.training_costs.storage_cost.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">{t("transferCost")}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="text-muted-foreground/50 hover:text-muted-foreground">
                            <Info className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[280px] text-xs">
                          {t("costHints.transfer")}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-lg font-bold font-mono">${result.training_costs.transfer_cost.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card className="border-primary/30">
                  <CardContent className="p-3">
                    <span className="text-xs text-muted-foreground">{t("totalTrainingCost")}</span>
                    <div className="text-lg font-bold font-mono">${result.training_costs.total_cost.toLocaleString()}</div>
                  </CardContent>
                </Card>
              </div>
              <div className="flex gap-3 mt-2">
                <Badge variant="secondary" className="text-xs">
                  <Cpu className="h-3 w-3 mr-1" />
                  {result.training_costs.gpu_type} x{result.training_costs.gpu_count}
                </Badge>
              </div>
            </section>

            {/* Deployment Costs */}
            <section>
              <h3 className="text-lg font-semibold mb-3">{t("deploymentCosts")}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">{t("inferenceCost")}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="text-muted-foreground/50 hover:text-muted-foreground">
                            <Info className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[280px] text-xs">
                          {t("costHints.inference")}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-lg font-bold font-mono">${result.deployment_costs.monthly_inference_cost.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">{t("serverCost")}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="text-muted-foreground/50 hover:text-muted-foreground">
                            <Info className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[280px] text-xs">
                          {t("costHints.server")}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-lg font-bold font-mono">${result.deployment_costs.monthly_server_cost}</div>
                  </CardContent>
                </Card>
                <Card className="border-primary/30">
                  <CardContent className="p-3">
                    <span className="text-xs text-muted-foreground">{t("totalMonthlyCost")}</span>
                    <div className="text-lg font-bold font-mono">${result.deployment_costs.total_monthly_cost.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{t("avgLatency")}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="text-muted-foreground/50 hover:text-muted-foreground">
                            <Info className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[280px] text-xs">
                          {t("costHints.latency")}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-lg font-bold font-mono">{result.deployment_costs.avg_latency_ms}ms</div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{result.deployment_costs.requests_per_day.toLocaleString()} {t("requestsPerDay")}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Deploy Button */}
            <div className="flex justify-between pt-4 border-t">
              <BackButton currentStep={14} />
              <Button size="lg" onClick={handleFinalDeploy}>
                <Rocket className="mr-2 h-4 w-4" />
                {t("simulateDeploy")}
              </Button>
            </div>
          </>
        )}

        {/* Deployed Suspense + Success */}
        {deployed && (
          <div className="flex flex-col items-center justify-center py-12 gap-6">
            <div className="w-full max-w-md space-y-2">
              {deploySteps.map((step, i) => {
                const done = deployStage > i;
                const active = deployStage === i;
                const pending = deployStage < i;
                return (
                  <div
                    key={step}
                    className={cn(
                      "flex items-center gap-3 rounded-md border px-3 py-2 text-sm transition-all",
                      done && "border-green-500/30 bg-green-500/5 text-foreground",
                      active && "border-primary/40 bg-primary/5 text-foreground",
                      pending && "border-border/40 text-muted-foreground/60"
                    )}
                  >
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : active ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
                    )}
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>

            {deployStage >= deploySteps.length && (
              <div className="flex flex-col items-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
                <div className="flex items-center justify-center h-20 w-20 rounded-full bg-green-500/10">
                  <PartyPopper className="h-10 w-10 text-green-500" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-green-500">{t("deploySuccess")}</h2>
                  <p className="text-muted-foreground max-w-md">{t("projectComplete")}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}
