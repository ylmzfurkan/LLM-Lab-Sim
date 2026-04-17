"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useChartColors } from "@/hooks/use-chart-colors";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Brain,
  Cpu,
  Layers,
  Box,
  Calendar,
  Database,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Loader2,
  FlaskConical,
} from "lucide-react";

interface BenchmarkScore {
  name: string;
  description: string;
  score: number;
  max: number;
}

interface Weakness {
  area: string;
  score: number;
  suggestion: string;
}

interface ShareData {
  project: {
    name: string;
    description: string | null;
    model_purpose: string | null;
    target_domain: string | null;
    model_language: string | null;
    model_type: string | null;
  };
  report: {
    scores: { data_quality: number; training_stability: number; model_performance: number; cost_efficiency: number };
    benchmarks: Record<string, BenchmarkScore>;
    weaknesses: Weakness[];
    model_summary: {
      size: string;
      parameters: string;
      architecture: string;
      context_window: number;
      training_epochs: number;
      dataset_rows: number;
    };
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SharePage() {
  const t = useTranslations("share");
  const tReport = useTranslations("report");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const params = useParams();
  const chartColors = useChartColors();

  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchShare() {
      try {
        const res = await fetch(`${API_URL}/api/share/${params.token}?locale=${locale}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        setData(await res.json());
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    }
    fetchShare();
  }, [params.token, locale]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground">{t("notFound")}</p>
        <Link href="/projects">
          <Button>{t("tryItCta")}</Button>
        </Link>
      </div>
    );
  }

  const { project, report } = data;
  const benchmarkData = Object.values(report.benchmarks).map((b) => ({
    name: b.name,
    score: b.score,
    max: b.max,
    percentage: (b.score / b.max) * 100,
  }));
  const overallPerf = report.scores.model_performance;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-bold">{tCommon("appName")}</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/projects">
              <Button size="sm">
                {t("tryItCta")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <FlaskConical className="h-4 w-4" />
            {t("sharedBy")}
          </div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {project.model_purpose && <Badge variant="secondary">{project.model_purpose}</Badge>}
            {project.target_domain && <Badge variant="outline">{project.target_domain}</Badge>}
            {project.model_language && <Badge variant="outline">{project.model_language.toUpperCase()}</Badge>}
          </div>
        </div>

        {/* Model Summary */}
        <section>
          <h2 className="text-xl font-semibold mb-4">{tReport("modelSummary")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">{tReport("parameters")}</div>
                  <div className="text-lg font-bold font-mono">{report.model_summary.parameters}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">{tReport("architecture")}</div>
                  <div className="text-lg font-bold capitalize">{report.model_summary.architecture}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Box className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">{tReport("contextWindow")}</div>
                  <div className="text-lg font-bold font-mono">{(report.model_summary.context_window / 1024).toFixed(0)}K</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">{tReport("trainingEpochs")}</div>
                  <div className="text-lg font-bold font-mono">{report.model_summary.training_epochs}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Database className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">{tReport("datasetRows")}</div>
                  <div className="text-lg font-bold font-mono">{report.model_summary.dataset_rows.toLocaleString()}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/30">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">{tReport("overallPerformance")}</div>
                <div className={cn(
                  "text-2xl font-bold font-mono",
                  overallPerf >= 70 ? "text-green-500" : overallPerf >= 40 ? "text-yellow-500" : "text-red-500"
                )}>
                  {overallPerf.toFixed(1)}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Benchmarks Chart */}
        <section>
          <h2 className="text-xl font-semibold mb-4">{tReport("benchmarks")}</h2>
          <Card>
            <CardContent className="p-4 pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={benchmarkData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} className="text-xs" />
                  <YAxis type="category" dataKey="name" width={100} className="text-xs" />
                  <Tooltip
                    formatter={(value) => `${Number(value).toFixed(1)}%`}
                    contentStyle={{ background: chartColors.card, border: `1px solid ${chartColors.border}`, borderRadius: "8px" }}
                  />
                  <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                    {benchmarkData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.percentage >= 60 ? chartColors.chart1 : entry.percentage >= 40 ? chartColors.chart3 : chartColors.destructive}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {Object.values(report.benchmarks).map((bench) => (
              <Card key={bench.name}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">{bench.name}</span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {bench.score.toFixed(1)}/{bench.max}
                    </span>
                  </div>
                  <Progress value={(bench.score / bench.max) * 100} className="h-2" />
                  <p className="text-[10px] text-muted-foreground mt-1">{bench.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Weaknesses */}
        {report.weaknesses.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">{tReport("weaknesses")}</h2>
            <div className="space-y-3">
              {report.weaknesses.map((w, i) => (
                <Card key={i} className="border-yellow-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{w.area}</span>
                          <Badge variant="secondary" className="text-xs">{w.score.toFixed(1)}</Badge>
                        </div>
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground">{w.suggestion}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="rounded-xl border bg-muted/30 p-8 text-center space-y-4">
          <Brain className="h-10 w-10 text-primary mx-auto" />
          <h2 className="text-2xl font-bold">{t("tryItCta")}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">{t("tryItDescription")}</p>
          <Link href="/projects">
            <Button size="lg" className="text-base px-8">
              {t("tryItCta")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </section>
      </main>

      <footer className="border-t py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
          <Brain className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{tCommon("appName")} — {tCommon("appDescription")}</span>
        </div>
      </footer>
    </div>
  );
}
