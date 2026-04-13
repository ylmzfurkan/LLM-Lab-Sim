"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { StepHeader } from "@/components/shared/step-header";
import { ConceptCard } from "@/components/shared/concept-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/stores/project-store";
import { apiPut } from "@/lib/api-client";
import { isDemoMode } from "@/lib/demo-mode";
import {
  MessageSquare,
  Code,
  Languages,
  FileText,
  Zap,
  Stethoscope,
  Scale,
  TrendingUp,
  Cpu,
  GraduationCap,
  Globe,
  ArrowRight,
  Loader2,
  Info,
} from "lucide-react";

const PURPOSE_OPTIONS = [
  { value: "chatbot", icon: MessageSquare },
  { value: "code_assistant", icon: Code },
  { value: "translation", icon: Languages },
  { value: "summarization", icon: FileText },
  { value: "general", icon: Zap },
] as const;

const DOMAIN_OPTIONS = [
  { value: "general", icon: Globe },
  { value: "medical", icon: Stethoscope },
  { value: "legal", icon: Scale },
  { value: "finance", icon: TrendingUp },
  { value: "tech", icon: Cpu },
  { value: "education", icon: GraduationCap },
] as const;

const LANGUAGE_OPTIONS = [
  { value: "en" },
  { value: "tr" },
  { value: "multilingual" },
] as const;

const TYPE_OPTIONS = [
  { value: "chat" },
  { value: "code" },
  { value: "instruct" },
  { value: "base" },
] as const;

export default function WizardPage() {
  const t = useTranslations("wizard");
  const tCommon = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const updateScores = useProjectStore((s) => s.updateScores);
  const updateStep = useProjectStore((s) => s.updateStep);

  const [purpose, setPurpose] = useState("");
  const [domain, setDomain] = useState("");
  const [language, setLanguage] = useState("");
  const [modelType, setModelType] = useState("");
  const [loading, setLoading] = useState(false);

  const isComplete = purpose && domain && language && modelType;

  async function handleNext() {
    if (!isComplete) return;
    setLoading(true);

    try {
      const result = await apiPut(`/api/projects/${params.projectId}/wizard`, {
        model_purpose: purpose,
        target_domain: domain,
        model_language: language,
        model_type: modelType,
      });

      if (result && typeof result === "object" && "wizard_result" in result) {
        const wr = (result as Record<string, unknown>).wizard_result as Record<string, number>;
        updateScores({
          data_quality: wr.base_data_quality,
          cost_efficiency: wr.base_cost_efficiency,
        });
      }
      updateStep(2);
    } catch (err) {
      if (!isDemoMode()) {
        console.error(err);
        setLoading(false);
        return;
      }
      updateStep(2);
    }

    router.push(`/projects/${params.projectId}/dataset`);
    setLoading(false);
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="max-w-4xl">
        <StepHeader title={t("title")} description={t("description")} stepNumber={1} />
        <ConceptCard stepKey="wizard" />

        <div className="space-y-8">
          {/* Model Purpose */}
          <section>
            <h3 className="text-lg font-semibold mb-1">{t("modelPurpose")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("modelPurposeDescription")}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {PURPOSE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <Card
                    key={opt.value}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50 relative",
                      purpose === opt.value && "border-primary ring-1 ring-primary"
                    )}
                    onClick={() => setPurpose(opt.value)}
                  >
                    <CardContent className="flex flex-col items-center gap-2 p-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="absolute top-2 right-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[250px] text-xs">
                          {t(`purposeHints.${opt.value}`)}
                        </TooltipContent>
                      </Tooltip>
                      <Icon className="h-6 w-6" />
                      <span className="text-sm font-medium text-center">
                        {t(`purposes.${opt.value}`)}
                      </span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Target Domain */}
          <section>
            <h3 className="text-lg font-semibold mb-1">{t("targetDomain")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("targetDomainDescription")}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {DOMAIN_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <Card
                    key={opt.value}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50 relative",
                      domain === opt.value && "border-primary ring-1 ring-primary"
                    )}
                    onClick={() => setDomain(opt.value)}
                  >
                    <CardContent className="flex flex-col items-center gap-2 p-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="absolute top-2 right-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[250px] text-xs">
                          {t(`domainHints.${opt.value}`)}
                        </TooltipContent>
                      </Tooltip>
                      <Icon className="h-6 w-6" />
                      <span className="text-sm font-medium text-center">
                        {t(`domains.${opt.value}`)}
                      </span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Model Language */}
          <section>
            <h3 className="text-lg font-semibold mb-1">{t("modelLanguage")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("modelLanguageDescription")}
            </p>
            <div className="grid grid-cols-3 gap-3 max-w-md">
              {LANGUAGE_OPTIONS.map((opt) => (
                <Card
                  key={opt.value}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary/50 relative",
                    language === opt.value && "border-primary ring-1 ring-primary"
                  )}
                  onClick={() => setLanguage(opt.value)}
                >
                  <CardContent className="flex items-center justify-center p-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="absolute top-2 right-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[250px] text-xs">
                        {t(`languageHints.${opt.value}`)}
                      </TooltipContent>
                    </Tooltip>
                    <span className="text-sm font-medium">
                      {t(`languages.${opt.value}`)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Model Type */}
          <section>
            <h3 className="text-lg font-semibold mb-1">{t("modelType")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("modelTypeDescription")}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
              {TYPE_OPTIONS.map((opt) => (
                <Card
                  key={opt.value}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary/50 relative",
                    modelType === opt.value && "border-primary ring-1 ring-primary"
                  )}
                  onClick={() => setModelType(opt.value)}
                >
                  <CardContent className="flex items-center justify-center p-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="absolute top-2 right-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[250px] text-xs">
                        {t(`typeHints.${opt.value}`)}
                      </TooltipContent>
                    </Tooltip>
                    <span className="text-sm font-medium">
                      {t(`types.${opt.value}`)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Navigation */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              size="lg"
              disabled={!isComplete || loading}
              onClick={handleNext}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              {tCommon("next")}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
