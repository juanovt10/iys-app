// app/projects/[id]/cuts/new/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import CreateCutClient from "./CreateCutClient";
import { getSessionAndRole } from "@/lib/supabase/server";

export default async function NewCutPage({ params }: { params: { id: string } }) {
  const { role } = await getSessionAndRole();
  if (role === 'site_manager') return redirect(`/projects/${params.id}`);
  const supabase = createServerSupabase();

  const isNumeric = /^\d+$/.test(params.id);
  const projectIdFilter: number | string = isNumeric ? Number(params.id) : params.id;

  // (1) Basic project info (optional)
  const { data: proj } = await supabase
    .from("v_projects_dashboard")
    .select("id,name,project_client")
    .eq("id", projectIdFilter)
    .maybeSingle();
  if (!proj) return notFound();

  // Check if project has a final deliverable
  let hasFinalDeliverable = false;
  try {
    const { data: finalCheck } = await supabase
      .from("deliverables")
      .select("id")
      .eq("project_id", projectIdFilter)
      .eq("is_final", true)
      .maybeSingle();
    hasFinalDeliverable = !!finalCheck;
  } catch (error) {
    // Column might not exist, default to false
    hasFinalDeliverable = false;
  }


  // (2) All deliverables for this project
  const { data: headers } = await supabase
    .from("deliverables")
    .select("id, deliverable_no, created_at, is_final")
    .eq("project_id", projectIdFilter)
    .order("deliverable_no", { ascending: true });

  const allIds = (headers ?? []).map(h => h.id as number);
  let used = new Set<number>();

  // (3) Which of those are already linked to a cut?
  if (allIds.length) {
    const { data: links } = await supabase
      .from("cut_deliverables")
      .select("deliverable_id")
      .in("deliverable_id", allIds);
    used = new Set((links ?? []).map(x => Number(x.deliverable_id)));
  }

  // (4) Only pass the available ones to the client
  const available = (headers ?? [])
    .filter(h => !used.has(Number(h.id)))
    .map(h => ({
      id: Number(h.id),
      no: Number(h.deliverable_no),
      date: String(h.created_at),
      isFinal: Boolean(h.is_final), // Use the actual is_final value
    }));

  return (
    <div className="w-full space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Nuevo Corte</h1>
          <p className="text-sm text-muted-foreground">
            Proyecto: <span className="font-medium">{proj.name}</span> · Cliente:{" "}
            <span className="font-medium">{proj.project_client}</span>
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/projects/${params.id}`}>Atrás</Link>
        </Button>
      </div>

      <CreateCutClient
        projectId={String(proj.id)}
        deliverables={available}  // ← only unused deliverables here
      />
    </div>
  );
}
