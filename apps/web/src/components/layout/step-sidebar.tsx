"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/stores/project-store";
import { PROJECT_STEPS } from "@/types/project";
import { Check, Lock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StepSidebarProps {
  projectId: string;
}

export function StepSidebar({ projectId }: StepSidebarProps) {
  const t = useTranslations("steps");
  const pathname = usePathname();
  const project = useProjectStore((s) => s.project);
  const currentStep = project?.current_step ?? 1;

  return (
    <aside className="w-64 border-r bg-sidebar text-sidebar-foreground shrink-0">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60 mb-3 px-2">
            {t("sidebarTitle")}
          </h2>
          {PROJECT_STEPS.map((step) => {
            const isActive = pathname.includes(`/${step.path}`);
            const isCompleted = step.number < currentStep;
            const isAccessible = step.number <= currentStep;
            const href = `/projects/${projectId}/${step.path}`;

            return (
              <Link
                key={step.key}
                href={isAccessible ? href : "#"}
                className={cn(
                  "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : isAccessible
                      ? "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                      : "text-sidebar-foreground/40 cursor-not-allowed"
                )}
                onClick={(e) => {
                  if (!isAccessible) e.preventDefault();
                }}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : isCompleted
                        ? "bg-green-500/20 text-green-500"
                        : "bg-sidebar-accent text-sidebar-foreground/60"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3" />
                  ) : !isAccessible ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    step.number
                  )}
                </span>
                <span className="truncate">{t(step.key)}</span>
              </Link>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}
