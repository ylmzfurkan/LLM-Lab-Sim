"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, X } from "lucide-react";

const STORAGE_KEY = "llmlab.tour.seen";
const STEP_KEYS = ["step1", "step2", "step3", "step4", "step5"] as const;

export function FirstVisitTour() {
  const t = useTranslations("tour");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY) !== "1") {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") finish();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function finish() {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
    setOpen(false);
  }

  function next() {
    if (step < STEP_KEYS.length - 1) setStep(step + 1);
    else finish();
  }

  if (!open) return null;

  const key = STEP_KEYS[step];
  const isLast = step === STEP_KEYS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-md relative shadow-xl">
        <button
          type="button"
          onClick={finish}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          aria-label="close"
        >
          <X className="h-4 w-4" />
        </button>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>{step + 1} / {STEP_KEYS.length}</span>
          </div>
          <h3 className="text-lg font-semibold">{t(`${key}Title`)}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{t(`${key}Body`)}</p>
          <div className="flex h-1 gap-1 pt-1">
            {STEP_KEYS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
          <div className="flex justify-between items-center pt-2">
            <Button variant="ghost" size="sm" onClick={finish}>
              {t("skip")}
            </Button>
            <Button size="sm" onClick={next}>
              {isLast ? t("finish") : t("next")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
