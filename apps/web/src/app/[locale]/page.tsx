import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { HeroBackground } from "@/components/landing/hero-background";
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
  GraduationCap,
  Briefcase,
  Code2,
  CheckCircle2,
  ExternalLink,
  FlaskConical,
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

const WHO_FOR = [
  { key: "who1", icon: GraduationCap },
  { key: "who2", icon: Briefcase },
  { key: "who3", icon: Code2 },
] as const;

const LEARN_ITEMS = ["learn1", "learn2", "learn3", "learn4", "learn5"] as const;

export default function HomePage() {
  const t = useTranslations("landing");
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
            <Link href="/projects">
              <Button size="sm">{t("getStarted")}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center py-24 px-4 overflow-hidden">
        <HeroBackground />
        <div className="relative z-10 max-w-3xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <FlaskConical className="h-4 w-4" />
            {t("simulationBadge")}
          </div>
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
            <Link href="/projects">
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

      {/* Who This Is For */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t("whoTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WHO_FOR.map((w) => {
              const Icon = w.icon;
              return (
                <Card key={w.key} className="bg-card/50">
                  <CardContent className="p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {t(`${w.key}Title`)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(`${w.key}Description`)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-muted/30">
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

      {/* What You'll Learn */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t("learnTitle")}
          </h2>
          <ul className="space-y-3">
            {LEARN_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-3 p-4 rounded-lg border bg-card/50">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">{t(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">{t("cta")}</h2>
          <p className="text-lg text-muted-foreground">{t("ctaDescription")}</p>
          <Link href="/projects">
            <Button size="lg" className="text-base px-8">
              {t("getStarted")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{tCommon("appName")}</span>
          </div>
          <p className="text-xs text-muted-foreground text-center md:text-left">{t("footerDisclaimer")}</p>
          <a
            href="https://github.com/ylmzfurkan/llm-lab"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("footerGithub")}
          </a>
        </div>
      </footer>
    </div>
  );
}
