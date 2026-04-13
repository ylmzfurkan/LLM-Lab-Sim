"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PROJECT_STEPS } from "@/types/project";

interface BackButtonProps {
  currentStep: number;
}

export function BackButton({ currentStep }: BackButtonProps) {
  const tCommon = useTranslations("common");
  const params = useParams();
  const router = useRouter();

  const prevStep = PROJECT_STEPS.find((s) => s.number === currentStep - 1);

  if (!prevStep) return <div />;

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={() => router.push(`/projects/${params.projectId}/${prevStep.path}`)}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      {tCommon("back")}
    </Button>
  );
}
