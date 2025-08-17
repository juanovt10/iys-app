// app/projects/[id]/page.tsx
import { notFound } from "next/navigation";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import ProjectDetailClient from "./ProjectDetailClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ItemRow = {
  id?: number | null;
  descripcion?: string;
  unidad?: string | null;
  cantidad?: number;
};

export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabase();
  const projectId = Number(params.id); // if UUID in DB, keep as string
  const isNumeric = /^\d+$/.test(params.id);
  const projectIdFilter = isNumeric ? Number(params.id) : params.id;

  // 1) Project header via your view
  const { data: proj, error } = await supabase
    .from("v_projects_dashboard")
    .select(
      "id,name,status,created_at,quote_numero,project_revision,latest_revision,latest_cotizacion_id,project_client"
    )
    .eq("id", projectId)
    .maybeSingle();

  if (error || !proj) return notFound();

  // 2) Latest quote items (contracted scope)
  // fetch latest quote items (contracted)
  const { data: quote } = await supabase
    .from("cotizaciones")
    .select("items")
    .eq("id", proj.latest_cotizacion_id)
    .maybeSingle();

  const items = Array.isArray(quote?.items)
    ? quote!.items
    : typeof quote?.items === "string"
    ? JSON.parse(quote!.items)
    : [];

  const scope = items.map((it: any) => ({
    key:
      it?.id != null
        ? `i:${it.id}`
        : `d:${String(it.descripcion).trim().toLowerCase()}`,
    contracted: Number(it?.cantidad ?? 0) || 0,
  }));

  // gather all deliverables for this project
  const { data: dheads } = await supabase
    .from("deliverables")
    .select("id")
    .eq("project_id", projectIdFilter);

  const deliverablesCount = dheads?.length ?? 0;

  let executed = new Map<string, number>();
  if (dheads?.length) {
    const ids = dheads.map((d) => d.id);
    const { data: lines } = await supabase
      .from("deliverable_lines")
      .select("item_id, descripcion, qty")
      .in("deliverable_id", ids);

    for (const ln of lines ?? []) {
      const key =
        ln.item_id != null
          ? `i:${ln.item_id}`
          : `d:${String(ln.descripcion || "")
              .trim()
              .toLowerCase()}`;
      executed.set(key, (executed.get(key) || 0) + Number(ln.qty || 0));
    }
  }

  let contractedSum = 0;
  let effectiveSum = 0;
  for (const it of scope) {
    const c = it.contracted;
    const e = executed.get(it.key) || 0;
    contractedSum += c;
    effectiveSum += Math.min(e, c);
  }
  const progressPct =
    contractedSum > 0 ? Math.round((effectiveSum / contractedSum) * 100) : 0;

  // 6) Render client UI
  return (
    <ProjectDetailClient
      project={{
        id: String(proj.id),
        name: proj.name,
        status: proj.status,
        clientName: proj.project_client,
        quoteNumero: String(proj.quote_numero),
        revisionShown: Number(
          proj.latest_revision ?? proj.project_revision ?? 0
        ),
        itemsCount: scope.length,
        createdAt: proj.created_at,
      }}
      counts={{ deliverables: deliverablesCount ?? 0, cuts: 0, progressPct }}
      // If you want to bring back the per-item breakdown later, pass it here.
      activity={[]}
    />
  );
}
