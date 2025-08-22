// app/projects/[id]/page.tsx
import { notFound } from "next/navigation";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import ProjectDetailClient from "./ProjectDetailClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type QuoteItem = {
  id?: number | null;
  descripcion?: string;
  unidad?: string | null;
  cantidad?: number;
};

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase();

  const isNumeric = /^\d+$/.test(params.id);
  const projectIdFilter: number | string = isNumeric ? Number(params.id) : params.id;

  // Pull counts directly here too
  const { data: proj, error: projErr } = await supabase
    .from("v_projects_dashboard")
    .select(
      "id,name,status,created_at,quote_numero,project_revision,latest_revision,latest_cotizacion_id,project_client,deliverables_count,cuts_count"
    )
    .eq("id", projectIdFilter)
    .maybeSingle();

  if (projErr || !proj) return notFound();

  // Latest quote items (contracted scope)
  const { data: latestQuote } = await supabase
    .from("cotizaciones")
    .select("items")
    .eq("id", proj.latest_cotizacion_id)
    .maybeSingle();

  const rawItems = latestQuote?.items;
  const items: QuoteItem[] = Array.isArray(rawItems)
    ? (rawItems as any[])
    : typeof rawItems === "string"
    ? safeJson<QuoteItem[]>(rawItems, [])
    : [];

  const scope = (items ?? []).map((it) => {
    const descripcion = String(it?.descripcion ?? "").trim();
    const unidad = (it?.unidad ?? null) as string | null;
    const contracted = Number(it?.cantidad ?? 0) || 0;
    const key = it?.id != null ? `i:${it.id}` : `d:${descripcion.toLowerCase()}`;
    return { key, descripcion, unidad, contracted };
  });

  // Deliverables meta (still used for the execution table columns)
  const { data: dheads } = await supabase
    .from("deliverables")
    .select("id, deliverable_no, created_at")
    .eq("project_id", projectIdFilter)
    .order("deliverable_no", { ascending: true });

  const deliverablesMeta =
    (dheads ?? []).map((d: any) => ({
      id: d.id as number,
      no: Number(d.deliverable_no),
      date: d.created_at as string,
    })) ?? [];

  // Lines aggregation (same as you had)
  type ExecRow = {
    key: string;
    descripcion: string;
    unidad: string | null;
    contracted: number;
    executedTotal: number;
    remaining: number;
    perDeliverable: Record<number, number>;
  };

  let execRows: ExecRow[] = [];

  if (deliverablesMeta.length) {
    const ids = deliverablesMeta.map((d) => d.id);
    const { data: lines } = await supabase
      .from("deliverable_lines")
      .select("deliverable_id,item_id,descripcion,unidad,qty")
      .in("deliverable_id", ids);

    const scopeMap = new Map<string, { descripcion: string; unidad: string | null; contracted: number }>();
    for (const it of scope) {
      scopeMap.set(it.key, { descripcion: it.descripcion, unidad: it.unidad, contracted: it.contracted });
    }

    const rowMap = new Map<
      string,
      { descripcion: string; unidad: string | null; contracted: number; executedTotal: number; perDeliverable: Record<number, number> }
    >();

    const keyOf = (l: any) =>
      l.item_id != null ? `i:${l.item_id}` : `d:${String(l.descripcion || "").trim().toLowerCase()}`;

    for (const l of lines ?? []) {
      const key = keyOf(l);
      const base = scopeMap.get(key) || {
        descripcion: String(l.descripcion || ""),
        unidad: (l.unidad ?? null) as string | null,
        contracted: 0,
      };

      if (!rowMap.has(key)) {
        rowMap.set(key, { descripcion: base.descripcion, unidad: base.unidad, contracted: base.contracted, executedTotal: 0, perDeliverable: {} });
      }
      const row = rowMap.get(key)!;
      const add = Number(l.qty || 0);
      row.executedTotal += add;
      row.perDeliverable[l.deliverable_id] = (row.perDeliverable[l.deliverable_id] || 0) + add;
    }

    execRows = scope.map((it) => {
      const r = rowMap.get(it.key) || {
        descripcion: it.descripcion,
        unidad: it.unidad,
        contracted: it.contracted,
        executedTotal: 0,
        perDeliverable: {} as Record<number, number>,
      };
      const remaining = Math.max(0, (r.contracted || 0) - (r.executedTotal || 0));
      return { key: it.key, descripcion: r.descripcion, unidad: r.unidad, contracted: r.contracted, executedTotal: r.executedTotal, remaining, perDeliverable: r.perDeliverable };
    });
  } else {
    execRows = scope.map((it) => ({
      key: it.key,
      descripcion: it.descripcion,
      unidad: it.unidad,
      contracted: it.contracted,
      executedTotal: 0,
      remaining: it.contracted,
      perDeliverable: {},
    }));
  }

  // Overall progress (cap per item)
  let sumC = 0;
  let sumE = 0;
  for (const r of execRows) {
    sumC += r.contracted;
    sumE += Math.min(r.executedTotal, r.contracted);
  }
  const progressPct = sumC > 0 ? Math.round((sumE / sumC) * 100) : 0;

  return (
    <ProjectDetailClient
      project={{
        id: String(proj.id),
        name: proj.name,
        status: proj.status,
        clientName: proj.project_client,
        quoteNumero: String(proj.quote_numero),
        revisionShown: Number(proj.latest_revision ?? proj.project_revision ?? 0),
        itemsCount: scope.length,
        createdAt: proj.created_at,
      }}
      counts={{
        deliverables: Number(proj.deliverables_count ?? deliverablesMeta.length), // ✅ from view, fallback local
        cuts: Number(proj.cuts_count ?? 0),                                        // ✅ from view
        progressPct,
      }}
      activity={[]}
      exec={{
        deliverables: deliverablesMeta,
        rows: execRows,
      }}
    />
  );
}

function safeJson<T>(s: string, fallback: T): T {
  try { return JSON.parse(s) as T; } catch { return fallback; }
}
