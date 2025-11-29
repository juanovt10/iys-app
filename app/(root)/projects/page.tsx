// app/projects/page.tsx
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getSessionAndRole } from "@/lib/supabase/server";
import ProjectsIndexClient from "./ProjectsIndexClient";
import type { ProjectRow, ProjectStatus } from "@/types";

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProjectsPage() {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("v_projects_dashboard")
    .select(
      "id,name,status,created_at,project_client,quote_numero,latest_revision,deliverables_count,cuts_count,latest_cotizacion_id"
    )
    .order("created_at", { ascending: false });

  if (error) {
    // fail soft: empty list
    return <ProjectsIndexClient projects={[]} />;
  }

  // Calculate progress percentage for each project with timeout protection
  const projects: ProjectRow[] = await Promise.all(
    (data ?? []).map(async (r: any) => {
      let progressPct = 0;
      
      // Only calculate progress if there are deliverables
      if (r.deliverables_count > 0 && r.latest_cotizacion_id) {
        try {
          // Add timeout protection for progress calculation
          const progressPromise = calculateProjectProgress(supabase, r);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Progress calculation timeout')), 5000)
          );
          
          progressPct = await Promise.race([progressPromise, timeoutPromise]) as number;
        } catch (error) {
          console.error(`Error calculating progress for project ${r.id}:`, error);
          progressPct = 0; // Fallback to 0 if calculation fails
        }
      }

      // Check if project has a final deliverable
      let hasFinalDeliverable = false;
      try {
        const { data: finalCheck } = await supabase
          .from("deliverables")
          .select("id")
          .eq("project_id", r.id)
          .eq("is_final", true)
          .maybeSingle();
        hasFinalDeliverable = !!finalCheck;
      } catch (error) {
        // Column might not exist, default to false
        hasFinalDeliverable = false;
      }

      return {
        id: String(r.id),
        name: r.name,
        status: (r.status as ProjectStatus) ?? "active",
        clientName: r.project_client ?? "",
        quoteId: String(r.quote_numero),
        quoteDbId: r.latest_cotizacion_id ? String(r.latest_cotizacion_id) : undefined,
        activeRevision: Number(r.latest_revision ?? 0),
        deliverablesCount: Number(r.deliverables_count ?? 0),
        cutsCount: Number(r.cuts_count ?? 0),
        deliveredPercent: progressPct,
        updatedAt: r.created_at,
        hasFinalDeliverable,
      };
    })
  );

  return <ProjectsIndexClient projects={projects} />;
}

async function calculateProjectProgress(supabase: any, project: any): Promise<number> {
  // Get the latest quote items (contracted scope)
  const { data: latestQuote } = await supabase
    .from("cotizaciones")
    .select("items")
    .eq("id", project.latest_cotizacion_id)
    .maybeSingle();

  const rawItems = latestQuote?.items;
  const items: any[] = Array.isArray(rawItems)
    ? rawItems
    : typeof rawItems === "string"
    ? safeJson<any[]>(rawItems, [])
    : [];

  // Get deliverables for this project
  const { data: deliverables } = await supabase
    .from("deliverables")
    .select("id")
    .eq("project_id", project.id);

  if (deliverables && deliverables.length > 0) {
    const deliverableIds = deliverables.map((d: any) => d.id);
    
    // Get execution data from deliverable lines
    const { data: lines } = await supabase
      .from("deliverable_lines")
      .select("item_id,descripcion,unidad,qty")
      .in("deliverable_id", deliverableIds);

    // Calculate progress
    let sumContracted = 0;
    let sumExecuted = 0;

    for (const item of items) {
      const contracted = Number(item?.cantidad ?? 0) || 0;
      sumContracted += contracted;

      // Find executed quantity for this item
      const executed = lines
        ?.filter((line: any) => line.item_id === item.id)
        ?.reduce((sum: number, line: any) => sum + Number(line.qty || 0), 0) || 0;

      sumExecuted += Math.min(executed, contracted);
    }

    return sumContracted > 0 ? Math.round((sumExecuted / sumContracted) * 100) : 0;
  }
  
  return 0;
}

function safeJson<T>(s: string, fallback: T): T {
  try { return JSON.parse(s) as T; } catch { return fallback; }
}
