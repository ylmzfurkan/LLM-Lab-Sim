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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/stores/project-store";
import { apiPost } from "@/lib/api-client";
import { isDemoMode } from "@/lib/demo-mode";
import { BackButton } from "@/components/shared/step-navigation";
import {
  FileJson,
  FileSpreadsheet,
  FileText,
  FileType,
  ArrowRight,
  Loader2,
  Database,
  BarChart3,
  Languages,
  Ruler,
  Info,
} from "lucide-react";

const FILE_TYPE_OPTIONS = [
  { value: "jsonl", icon: FileJson },
  { value: "csv", icon: FileSpreadsheet },
  { value: "text", icon: FileText },
  { value: "pdf", icon: FileType },
] as const;

interface DatasetResult {
  id: string;
  quality_score: number;
  duplicate_ratio: number;
  language_distribution: Record<string, number>;
  avg_text_length: number;
  estimated_rows: number;
}

export default function DatasetLabPage() {
  const t = useTranslations("dataset");
  const tCommon = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const updateScores = useProjectStore((s) => s.updateScores);
  const updateStep = useProjectStore((s) => s.updateStep);
  const setDatasetId = useProjectStore((s) => s.setDatasetId);

  const [fileType, setFileType] = useState("");
  const [fileSize, setFileSize] = useState(50);
  const [rowCount, setRowCount] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DatasetResult | null>(null);

  const fileSizeBytes = fileSize * 1024 * 1024;
  const isReady = fileType !== "";

  async function handleAnalyze() {
    if (!isReady) return;
    setLoading(true);

    try {
      const data = await apiPost<DatasetResult>(
        `/api/projects/${params.projectId}/dataset`,
        {
          file_name: `dataset.${fileType}`,
          file_type: fileType,
          file_size_bytes: fileSizeBytes,
          row_count: rowCount ? parseInt(rowCount) : null,
        }
      );
      setResult(data);
      if (data.id) setDatasetId(data.id);
      updateScores({ data_quality: data.quality_score });
      updateStep(3);
    } catch (err) {
      if (!isDemoMode()) {
        console.error(err);
        setLoading(false);
        return;
      }
      const mockResult: DatasetResult = {
        id: "demo",
        quality_score: 62.5,
        duplicate_ratio: 0.08,
        language_distribution: { en: 0.9, tr: 0.05, other: 0.05 },
        avg_text_length: 245.3,
        estimated_rows: fileSize * 1000,
      };
      setResult(mockResult);
      setDatasetId(mockResult.id);
      updateScores({ data_quality: mockResult.quality_score });
      updateStep(3);
    }

    setLoading(false);
  }

  function handleNext() {
    router.push(`/projects/${params.projectId}/cleaning`);
  }

  return (
    <TooltipProvider delayDuration={200}>
    <div className="max-w-4xl">
      <StepHeader title={t("title")} description={t("description")} stepNumber={2} />
      <ConceptCard stepKey="dataset" />

      <div className="space-y-8">
        {/* File Type Selection */}
        <section>
          <h3 className="text-lg font-semibold mb-1">{t("fileType")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t("fileTypeDescription")}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
            {FILE_TYPE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <Card
                  key={opt.value}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary/50 relative",
                    fileType === opt.value && "border-primary ring-1 ring-primary"
                  )}
                  onClick={() => setFileType(opt.value)}
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
                        {t(`fileTypeHints.${opt.value}`)}
                      </TooltipContent>
                    </Tooltip>
                    <Icon className="h-6 w-6" />
                    <span className="text-sm font-medium text-center">
                      {t(`fileTypes.${opt.value}`)}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* File Size */}
        <section>
          <h3 className="text-lg font-semibold mb-1">{t("fileSize")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t("fileSizeDescription")}</p>
          <div className="max-w-md space-y-3">
            <Slider
              value={[fileSize]}
              onValueChange={(v) => setFileSize(v[0])}
              min={1}
              max={500}
              step={1}
            />
            <div className="text-sm font-mono text-muted-foreground">
              {fileSize} MB ({(fileSizeBytes / 1024 / 1024).toFixed(0)} MB)
            </div>
          </div>
        </section>

        {/* Row Count */}
        <section>
          <h3 className="text-lg font-semibold mb-1">{t("rowCount")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t("rowCountDescription")}</p>
          <Input
            type="number"
            value={rowCount}
            onChange={(e) => setRowCount(e.target.value)}
            placeholder={t("rowCountPlaceholder")}
            className="max-w-xs"
          />
        </section>

        {/* Analyze Button */}
        {!result && (
          <div className="flex justify-end pt-4 border-t">
            <Button size="lg" disabled={!isReady || loading} onClick={handleAnalyze}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Database className="mr-2 h-4 w-4" />
              )}
              {t("analyze")}
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
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t("qualityScore")}</span>
                  </div>
                  <span className={cn(
                    "text-2xl font-bold font-mono",
                    result.quality_score >= 70 ? "text-green-500" :
                    result.quality_score >= 40 ? "text-yellow-500" : "text-red-500"
                  )}>
                    {result.quality_score.toFixed(1)}
                  </span>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t("duplicateRatio")}</span>
                  </div>
                  <span className="text-2xl font-bold font-mono">
                    {(result.duplicate_ratio * 100).toFixed(1)}%
                  </span>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t("avgTextLength")}</span>
                  </div>
                  <span className="text-2xl font-bold font-mono">
                    {result.avg_text_length.toFixed(0)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">{t("tokens")}</span>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t("estimatedRows")}</span>
                  </div>
                  <span className="text-2xl font-bold font-mono">
                    {result.estimated_rows.toLocaleString()}
                  </span>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Languages className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t("languageDistribution")}</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(result.language_distribution).map(([lang, ratio]) => (
                      <Badge key={lang} variant="secondary">
                        {lang.toUpperCase()}: {(ratio * 100).toFixed(0)}%
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Navigate to next */}
            <div className="flex justify-between pt-4 border-t mt-6">
              <BackButton currentStep={2} />
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
