// app/projects/[id]/ProjectDetailClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ProjectSummary, ProjectCounts, ProjectStatus, ActivityItem } from "@/types";
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
      perDeliverable: Record<number, number>;
    }[];
  };
}) {
  const supabase = createClient();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function changeStatus(next: ProjectStatus) {
    try {
      setSaving(true);
      const { error } = await supabase.from("proyectos").update({ status: next }).eq("id", project.id);
      if (error) throw error;
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 p-4 md:p-6">
      <ProjectHeader project={project} saving={saving} onChangeStatus={changeStatus} />

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
