// app/projects/page.tsx (server)
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import ProjectsIndexClient from "./ProjectsIndexClient";
import type { ProjectRow, ProjectStatus } from "@/types";

export default async function ProjectsPage() {
  const supabase = createServerSupabase();

  const { data: rows } = await supabase
    .from("v_projects_dashboard")
    .select("id,name,status,created_at,quote_numero,latest_revision,project_client");

  const { data: counts } = await supabase
    .from("v_projects_counts")
    .select("project_id, deliverables_count");

  const byId = Object.fromEntries((counts ?? []).map((c: any) => [String(c.project_id), c]));

  const projects: ProjectRow[] = (rows ?? []).map((r: any) => ({
    id: String(r.id),
    name: r.name,
    status: (r.status as ProjectStatus) ?? "active",
    clientName: r.project_client ?? "",
    quoteId: String(r.quote_numero),
    activeRevision: Number(r.latest_revision ?? 0),
    deliverablesCount: byId[String(r.id)]?.deliverables_count ?? 0,
    cutsCount: 0,          // cuts later
    deliveredPercent: 0,   // progress later
    updatedAt: r.created_at,
  }));

  return <ProjectsIndexClient projects={projects} />;
}
