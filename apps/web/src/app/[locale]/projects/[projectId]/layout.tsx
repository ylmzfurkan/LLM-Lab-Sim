import { AppHeader } from "@/components/layout/app-header";
import { StepSidebar } from "@/components/layout/step-sidebar";
import { ScoreBar } from "@/components/layout/score-bar";
import { ProjectLoader } from "@/components/layout/project-loader";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="flex flex-col h-screen">
      <ProjectLoader projectId={projectId} />
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <StepSidebar projectId={projectId} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
          <ScoreBar />
        </div>
      </div>
    </div>
  );
}
