"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Brain,
  FolderOpen,
  Clock,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api-client";
import { isDemoMode } from "@/lib/demo-mode";
import { FirstVisitTour } from "@/components/tour/first-visit-tour";
import { PROJECT_STEPS } from "@/types/project";
import type { Project } from "@/types/project";

export default function ProjectsPage() {
  const t = useTranslations();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const data = await apiGet<Project[]>("/api/projects");
        setProjects(data);
      } catch (err) {
        if (!isDemoMode()) console.error(err);
      } finally {
        setFetching(false);
      }
    }
    fetchProjects();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setLoading(true);
    setCreateError(null);
    try {
      const project = await apiPost<Project>("/api/projects", {
        name: newName,
        description: newDescription || null,
      });
      setDialogOpen(false);
      setNewName("");
      setNewDescription("");
      router.push(`/projects/${project.id}/wizard`);
    } catch (err) {
      if (!isDemoMode()) {
        console.error(err);
        setCreateError(t("dashboard.createError"));
        setLoading(false);
        return;
      }
      const tempId = crypto.randomUUID();
      router.push(`/projects/${tempId}/wizard`);
    } finally {
      setLoading(false);
    }
  }

  function getStepPath(project: Project) {
    const step = PROJECT_STEPS.find(
      (s) => s.number === project.current_step
    );
    return step ? step.path : "wizard";
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "in_progress":
        return <Clock className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  }

  const statusVariant: Record<string, "secondary" | "default" | "outline"> = {
    draft: "secondary",
    in_progress: "default",
    completed: "outline",
  };

  const progressPercent = (step: number) =>
    Math.round((step / PROJECT_STEPS.length) * 100);

  return (
    <div className="flex flex-col min-h-screen">
      <FirstVisitTour />
      <AppHeader />
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
            {projects.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {projects.length} {projects.length === 1 ? "project" : "projects"}
              </p>
            )}
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("dashboard.newProject")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("dashboard.newProject")}</DialogTitle>
                <DialogDescription>
                  {t("common.appDescription")}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("dashboard.projectName")}</Label>
                  <Input
                    id="name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={t("dashboard.projectNamePlaceholder")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">
                    {t("dashboard.projectDescription")}
                  </Label>
                  <Input
                    id="description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder={t("dashboard.projectDescriptionPlaceholder")}
                  />
                </div>
                {createError && (
                  <p className="text-sm text-destructive">{createError}</p>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={loading || !newName.trim()}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("common.create")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {fetching ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Brain className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {t("dashboard.noProjects")}
            </h2>
            <p className="text-muted-foreground max-w-md mb-6">
              {t("dashboard.noProjectsDescription")}
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("dashboard.newProject")}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}/${getStepPath(project)}`}
              >
                <Card className="hover:border-primary/50 transition-all cursor-pointer h-full group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-primary" />
                        {project.name}
                      </CardTitle>
                      <Badge
                        variant={statusVariant[project.status] ?? "secondary"}
                        className="flex items-center gap-1"
                      >
                        {getStatusIcon(project.status)}
                        {t(`dashboard.projectStatus.${project.status}`)}
                      </Badge>
                    </div>
                    {project.description && (
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {/* Step progress */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-muted-foreground">
                          {t(`steps.${PROJECT_STEPS[Math.min(project.current_step - 1, PROJECT_STEPS.length - 1)].key}`)}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {project.current_step}/{PROJECT_STEPS.length}
                        </span>
                      </div>
                      <Progress
                        value={progressPercent(project.current_step)}
                        className="h-1.5"
                      />
                    </div>

                    {/* Wizard config badges */}
                    {(project.model_purpose || project.target_domain) && (
                      <div className="flex gap-1.5 flex-wrap">
                        {project.model_purpose && (
                          <Badge variant="secondary" className="text-xs">
                            {project.model_purpose}
                          </Badge>
                        )}
                        {project.target_domain && (
                          <Badge variant="secondary" className="text-xs">
                            {project.target_domain}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Continue button hint */}
                    <div className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>{t("dashboard.continueProject")}</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
