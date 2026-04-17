"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { StepHeader } from "@/components/shared/step-header";
import { ConceptCard } from "@/components/shared/concept-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { apiPost } from "@/lib/api-client";
import { isDemoMode } from "@/lib/demo-mode";
import { BackButton } from "@/components/shared/step-navigation";
import { DecisionSummary } from "@/components/simulation/decision-summary";
import {
  Loader2,
  Rocket,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Cpu,
  Activity,
  PartyPopper,
  Info,
  Share2,
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
  const tShare = useTranslations("share");
  const locale = useLocale();
  const params = useParams();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeployResult | null>(null);
  const [deployed, setDeployed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deployStage, setDeployStage] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareGenerating, setShareGenerating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [textCopied, setTextCopied] = useState(false);

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

  async function handleShare() {
    setShareOpen(true);
    if (shareToken) return;
    setShareGenerating(true);
    try {
      const data = await apiPost<{ token: string }>(`/api/projects/${params.projectId}/share`);
      setShareToken(data.token);
    } catch (err) {
      console.error(err);
    }
    setShareGenerating(false);
  }

  function getShareUrl(token: string) {
    return `${window.location.origin}/${locale}/share/${token}`;
  }

  async function copyShareLink() {
    if (!shareToken) return;
    await navigator.clipboard.writeText(getShareUrl(shareToken));
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function getPostText(token: string) {
    return `${tShare("linkedinText")}\n\n${getShareUrl(token)}`;
  }

  async function shareLinkedIn() {
    if (!shareToken) return;
    // Copy full post text to clipboard so user can paste in LinkedIn
    await navigator.clipboard.writeText(getPostText(shareToken));
    setTextCopied(true);
    setTimeout(() => setTextCopied(false), 4000);
    const params = new URLSearchParams({ url: getShareUrl(shareToken) });
    window.open(`https://www.linkedin.com/feed/?shareActive=true&${params.toString()}`, "_blank", "width=600,height=700");
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
            {/* Decision Summary */}
            <DecisionSummary />

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
                <Button size="lg" onClick={handleShare} className="mt-2">
                  <Share2 className="mr-2 h-5 w-5" />
                  {tShare("button")}
                </Button>
              </div>
            )}

            <Dialog open={shareOpen} onOpenChange={setShareOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{tShare("modalTitle")}</DialogTitle>
                  <DialogDescription>{tShare("modalDescription")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  {/* Suggested post text preview */}
                  {shareToken && (
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium">{tShare("postTextLabel")}</p>
                      <div className="relative rounded-md border bg-muted/40 p-3">
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed pr-8">
                          {getPostText(shareToken)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={async () => {
                            await navigator.clipboard.writeText(getPostText(shareToken));
                            setTextCopied(true);
                            setTimeout(() => setTextCopied(false), 2000);
                          }}
                        >
                          {textCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Unique link */}
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">{tShare("linkLabel")}</p>
                    {shareGenerating ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {tShare("generating")}
                      </div>
                    ) : shareToken ? (
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={getShareUrl(shareToken)}
                          className="font-mono text-xs"
                        />
                        <Button variant="outline" size="icon" onClick={copyShareLink}>
                          {linkCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  {shareToken && (
                    <div className="space-y-2">
                      <Button
                        className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white"
                        onClick={shareLinkedIn}
                      >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        {textCopied ? tShare("linkedinButtonCopied") : tShare("linkedinButton")}
                      </Button>
                      {textCopied && (
                        <p className="text-xs text-center text-muted-foreground animate-in fade-in">
                          {tShare("clipboardHint")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}
