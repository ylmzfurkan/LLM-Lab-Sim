import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import {
  Brain,
  Database,
  Cpu,
  BarChart3,
  Target,
  Search,
  Rocket,
  ArrowRight,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const FEATURES = [
  { key: "feature1", icon: Database },
  { key: "feature2", icon: Cpu },
  { key: "feature3", icon: BarChart3 },
  { key: "feature4", icon: Target },
  { key: "feature5", icon: Search },
  { key: "feature6", icon: Rocket },
] as const;

const STEPS = ["step1", "step2", "step3", "step4", "step5", "step6"] as const;

export default function HomePage() {
  const t = useTranslations("landing");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">{tCommon("appName")}</span>
          </div>
          <div className="flex items-center gap-1">
            <LocaleSwitcher />
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">{tAuth("login")}</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">{tAuth("register")}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center py-24 px-4">
        <div className="max-w-3xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            {tCommon("appDescription")}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
            {t("hero")}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("heroDescription")}
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/register">
              <Button size="lg" className="text-base px-8">
                {t("getStarted")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="text-base px-8">
                {t("learnMore")}
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t("features")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.key} className="bg-card/50 hover:bg-card transition-colors">
                  <CardContent className="p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {t(`${feature.key}Title`)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(`${feature.key}Description`)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t("howItWorks")}
          </h2>
          <div className="space-y-4">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {i + 1}
                </div>
                <div className="flex-1 p-4 rounded-lg border bg-card/50">
                  <span className="text-sm">{t(step)}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">{t("cta")}</h2>
          <p className="text-lg text-muted-foreground">{t("ctaDescription")}</p>
          <Link href="/register">
            <Button size="lg" className="text-base px-8">
              {t("getStarted")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{tCommon("appName")}</span>
          </div>
          <p className="text-xs text-muted-foreground">{t("footer")}</p>
        </div>
      </footer>
    </div>
  );
}
