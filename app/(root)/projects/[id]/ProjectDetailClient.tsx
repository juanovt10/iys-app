// app/projects/[id]/ProjectDetailClient.tsx
"use client";

import type { ProjectSummary, ProjectCounts, ActivityItem } from "@/types";
import ProjectHeader from "./ProjectHeader";
import StatGrid from "./StartGrid";
import ExecutionPanel from "./ExecutionCard";
import ActivityCard from "./ActivityCard";

export default function ProjectDetailClient({
  project,
  counts,
  activity,
  exec,
}: {
  project: ProjectSummary;
  counts: ProjectCounts;
  activity: ActivityItem[];
  exec: {
    deliverables: { id: number; no: number; date: string }[];
    rows: {
      key: string;
      descripcion: string;
      unidad: string | null;
      contracted: number;
      executedTotal: number;
      remaining: number;
      extraQty: number;
      perDeliverable: Record<number, number>;
    }[];
  };
}) {

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-4 md:p-6">
      <ProjectHeader project={project} />

      {/* Final Deliverable Notice */}
      {project.hasFinalDeliverable && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="font-medium">Acta de Entrega Final creada</span>
            <span>• El proyecto ha sido marcado como completado.</span>
          </div>
        </div>
      )}

      {/* Only Deliverables & Cuts now */}
      <StatGrid
        deliverables={counts.deliverables}
        cuts={counts.cuts}
        links={{ deliverables: `/projects/${project.id}/deliverables`, cuts: `/projects/${project.id}/cuts` }}
      />

      <ExecutionPanel progressPct={counts.progressPct} deliverables={exec.deliverables} rows={exec.rows} />

      <ActivityCard items={activity} />
    </div>
  );
}
