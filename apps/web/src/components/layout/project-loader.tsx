"use client";

import { useEffect, useRef } from "react";
import { useProjectStore } from "@/stores/project-store";
import { apiGet } from "@/lib/api-client";
import type { Project } from "@/types/project";

export function ProjectLoader({ projectId }: { projectId: string }) {
  const setProject = useProjectStore((s) => s.setProject);
  const currentProject = useProjectStore((s) => s.project);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip if already loaded for this project
    if (fetchedRef.current === projectId) return;
    if (currentProject?.id === projectId) return;

    fetchedRef.current = projectId;

    apiGet<Project>(`/api/projects/${projectId}`)
      .then((data) => setProject(data))
      .catch(() => {
        // In demo mode or on error, set a minimal project so sidebar unlocks
        setProject({ id: projectId, name: "", status: "in_progress", current_step: 1 } as Project);
      });
  }, [projectId, setProject, currentProject]);

  return null;
}
