"use client";

interface StepHeaderProps {
  title: string;
  description: string;
  stepNumber: number;
}

export function StepHeader({ title, description, stepNumber }: StepHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
          {stepNumber}
        </span>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      <p className="text-muted-foreground ml-11">{description}</p>
    </div>
  );
}
