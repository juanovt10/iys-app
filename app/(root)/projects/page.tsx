// app/projects/page.tsx
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import ProjectsIndexClient from "./ProjectsIndexClient";
import type { ProjectRow, ProjectStatus } from "@/types";

export default async function ProjectsPage() {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("v_projects_dashboard")
    .select(
      "id,name,status,created_at,project_client,quote_numero,latest_revision,deliverables_count,cuts_count"
    )
    .order("created_at", { ascending: false });

  if (error) {
    // fail soft: empty list
    return <ProjectsIndexClient projects={[]} />;
  }

  const projects: ProjectRow[] = (data ?? []).map((r: any) => ({
    id: String(r.id),
    name: r.name,
    status: (r.status as ProjectStatus) ?? "active",
    clientName: r.project_client ?? "",
    quoteId: String(r.quote_numero),
    activeRevision: Number(r.latest_revision ?? 0),
    deliverablesCount: Number(r.deliverables_count ?? 0), // ✅ from view
    cutsCount: Number(r.cuts_count ?? 0),                 // ✅ from view
    deliveredPercent: 0, // keep your current calc or wire progress later
    updatedAt: r.created_at,
  }));

  return <ProjectsIndexClient projects={projects} />;
}
