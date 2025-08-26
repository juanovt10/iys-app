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
      extraQty: number;
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
      console.log("Changing status from", project.status, "to", next, "for project", project.id);
      
      // Use the project ID as is (could be number or UUID)
      const projectId = project.id;
      console.log("Using project ID:", projectId, "Type:", typeof projectId);
      
      // First, let's test if we can read from the proyectos table
      const { data: testData, error: testError } = await supabase
        .from("proyectos")
        .select("id, status")
        .eq("id", projectId)
        .maybeSingle();
        
      if (testError) {
        console.error("Test read failed:", testError);
        throw new Error(`Cannot read from proyectos table: ${testError.message}`);
      }
      
      console.log("Current project data:", testData);
      
      const { error } = await supabase
        .from("proyectos")
        .update({ status: next })
        .eq("id", projectId);
        
      if (error) {
        console.error("Status update failed:", error);
        throw error;
      }
      
      console.log("Status updated successfully to:", next);
      router.refresh();
    } catch (error) {
      console.error("Failed to update project status:", error);
      // You could add a toast notification here
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-4 md:p-6">
      <ProjectHeader project={project} saving={saving} onChangeStatus={changeStatus} />

      {/* Final Deliverable Notice */}
      {project.hasFinalDeliverable && (
        <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            <span className="font-medium">Acta de Entrega Final creada</span>
            <span>• No se pueden crear más actas de entrega para este proyecto.</span>
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
