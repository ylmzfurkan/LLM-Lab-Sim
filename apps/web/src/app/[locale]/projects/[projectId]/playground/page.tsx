"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { StepHeader } from "@/components/shared/step-header";
import { ConceptCard } from "@/components/shared/concept-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/stores/project-store";
import { apiPost } from "@/lib/api-client";
import { isDemoMode } from "@/lib/demo-mode";
import { BackButton } from "@/components/shared/step-navigation";
import {
  ArrowRight,
  Loader2,
  Send,
  Gauge,
  Clock,
  Shield,
  MessageSquare,
} from "lucide-react";

interface PlaygroundResponse {
  model_variant: string;
  response_quality: number;
  latency_ms: number;
  confidence: number;
}

const SAMPLE_PROMPTS = [
  "Explain how neural networks learn from data.",
  "What are the benefits of transformer architecture?",
  "Compare supervised and unsupervised learning.",
  "How does attention mechanism work in LLMs?",
];

// Simulated responses for demo mode
const SIMULATED_RESPONSES: Record<string, string> = {
  base: "Neural networks learn through a process called backpropagation, where the network adjusts its weights based on the error between predicted and actual outputs. The learning rate controls how much the weights are adjusted in each iteration...",
  finetuned: "Neural networks learn from data through an iterative optimization process. During training, the network makes predictions on input data and compares them to expected outputs using a loss function. The gradients of this loss are then backpropagated through the network layers, updating weights via optimizers like Adam or SGD. Key factors include learning rate scheduling, batch normalization, and regularization techniques that prevent overfitting...",
  rag: "Based on the retrieved context from our knowledge base: Neural networks learn from data through supervised learning, where labeled examples guide weight updates via backpropagation. According to recent research (Smith et al., 2024), modern approaches also leverage self-supervised pre-training on large unlabeled datasets, followed by fine-tuning on task-specific data. The attention mechanism in transformers has been particularly effective...",
};

export default function PlaygroundPage() {
  const t = useTranslations("playground");
  const tCommon = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const updateStep = useProjectStore((s) => s.updateStep);

  const [prompt, setPrompt] = useState("");
  const [variant, setVariant] = useState("base");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<PlaygroundResponse | null>(null);
  const [responseText, setResponseText] = useState("");

  async function handleSend() {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse(null);
    setResponseText("");

    try {
      const data = await apiPost<PlaygroundResponse>(
        `/api/projects/${params.projectId}/playground`,
        { prompt, model_variant: variant }
      );
      setResponse(data);
      setResponseText(SIMULATED_RESPONSES[variant] || SIMULATED_RESPONSES.base);
      updateStep(13);
    } catch (err) {
      if (!isDemoMode()) {
        console.error(err);
        setLoading(false);
        return;
      }
      const qualityMap: Record<string, number> = { base: 42, finetuned: 70, rag: 63 };
      const latencyMap: Record<string, number> = { base: 120, finetuned: 150, rag: 250 };
      const quality = qualityMap[variant] || 50;
      setResponse({
        model_variant: variant,
        response_quality: quality,
        latency_ms: latencyMap[variant] || 150,
        confidence: Math.min(100, quality + 10),
      });
      setResponseText(SIMULATED_RESPONSES[variant] || SIMULATED_RESPONSES.base);
      updateStep(13);
    }

    setLoading(false);
  }

  function handleNext() {
    router.push(`/projects/${params.projectId}/evaluation`);
  }

  return (
    <div className="max-w-4xl">
      <StepHeader title={t("title")} description={t("description")} stepNumber={12} />
      <ConceptCard stepKey="playground" />

      <div className="space-y-6">
        {/* Model Variant Tabs */}
        <Tabs value={variant} onValueChange={(v) => { setVariant(v); setResponse(null); setResponseText(""); }}>
          <TabsList>
            <TabsTrigger value="base">{t("variants.base")}</TabsTrigger>
            <TabsTrigger value="finetuned">{t("variants.finetuned")}</TabsTrigger>
            <TabsTrigger value="rag">{t("variants.rag")}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Sample Prompts */}
        <div className="flex gap-2 flex-wrap">
          {SAMPLE_PROMPTS.map((sp) => (
            <Badge
              key={sp}
              variant="secondary"
              className="cursor-pointer hover:bg-accent"
              onClick={() => setPrompt(sp)}
            >
              {sp.slice(0, 40)}...
            </Badge>
          ))}
        </div>

        {/* Prompt Input */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t("promptPlaceholder")}
                className="flex-1 min-h-[80px] bg-transparent text-sm resize-none focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button size="sm" disabled={!prompt.trim() || loading} onClick={handleSend} className="self-end">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Response */}
        {responseText ? (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{t(`variants.${variant}`)}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{responseText}</p>

              {response && (
                <div className="flex gap-4 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-1">
                    <Gauge className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t("responseQuality")}:</span>
                    <span className={cn(
                      "text-xs font-mono font-semibold",
                      response.response_quality >= 70 ? "text-green-500" : response.response_quality >= 40 ? "text-yellow-500" : "text-red-500"
                    )}>
                      {response.response_quality.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t("latency")}:</span>
                    <span className="text-xs font-mono">{response.latency_ms}ms</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t("confidence")}:</span>
                    <span className="text-xs font-mono">{response.confidence.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : !loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            {t("noResponse")}
          </div>
        ) : null}

        {response && (
          <div className="flex justify-between pt-4 border-t">
            <BackButton currentStep={12} />
            <Button size="lg" onClick={handleNext}>
              <ArrowRight className="mr-2 h-4 w-4" />
              {tCommon("next")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
