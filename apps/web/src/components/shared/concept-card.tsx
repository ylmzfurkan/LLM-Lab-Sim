"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConceptCardProps {
  stepKey: string;
}

export function ConceptCard({ stepKey }: ConceptCardProps) {
  const t = useTranslations("concepts");
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{t("title")}</span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 text-sm leading-relaxed text-muted-foreground">
          {t(`${stepKey}.body`)}
        </div>
      )}
    </div>
  );
}
