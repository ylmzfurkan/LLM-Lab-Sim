"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Brain, FolderOpen } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api-client";
import type { Project } from "@/types/project";

export default function ProjectsPage() {
  const t = useTranslations();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setLoading(true);
    try {
      const project = await apiPost<Project>("/api/projects", {
        name: newName,
        description: newDescription || null,
      });
      setDialogOpen(false);
      setNewName("");
      setNewDescription("");
      router.push(`/projects/${project.id}/wizard`);
    } catch {
      // API not connected yet - create a temp project for demo
      const tempId = crypto.randomUUID();
      router.push(`/projects/${tempId}/wizard`);
    } finally {
      setLoading(false);
    }
  }

  const statusColor: Record<string, string> = {
    draft: "secondary",
    in_progress: "default",
    completed: "outline",
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
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
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="My LLM Project"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="A chatbot for..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={loading || !newName.trim()}>
                    {t("common.create")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {projects.length === 0 ? (
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
                href={`/projects/${project.id}/wizard`}
              >
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        {project.name}
                      </CardTitle>
                      <Badge
                        variant={
                          statusColor[project.status] as
                            | "secondary"
                            | "default"
                            | "outline"
                        }
                      >
                        {t(`dashboard.projectStatus.${project.status}`)}
                      </Badge>
                    </div>
                    {project.description && (
                      <CardDescription>{project.description}</CardDescription>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Step {project.current_step} / 14
                    </p>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
