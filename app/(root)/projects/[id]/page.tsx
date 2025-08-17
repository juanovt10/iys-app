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

export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabase();

  // Handle bigint vs uuid ids
  const isNumeric = /^\d+$/.test(params.id);
  const projectIdFilter: number | string = isNumeric ? Number(params.id) : params.id;

  // 1) Project summary (from your view)
  const { data: proj, error: projErr } = await supabase
    .from("v_projects_dashboard")
    .select(
      "id,name,status,created_at,quote_numero,project_revision,latest_revision,latest_cotizacion_id,project_client"
    )
    .eq("id", projectIdFilter)
    .maybeSingle();

  if (projErr || !proj) return notFound();

  // 2) Load latest-quote items = contracted scope
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

  // Normalize scope with a stable key
  const scope = (items ?? []).map((it) => {
    const descripcion = String(it?.descripcion ?? "").trim();
    const unidad = (it?.unidad ?? null) as string | null;
    const contracted = Number(it?.cantidad ?? 0) || 0;
    const key =
      it?.id != null ? `i:${it.id}` : `d:${descripcion.toLowerCase()}`;
    return { key, descripcion, unidad, contracted };
  });

  // 3) Deliverable headers (for table columns & count)
  const { data: dheads, error: dErr } = await supabase
    .from("deliverables")
    .select("id, deliverable_no, created_at")
    .eq("project_id", projectIdFilter)
    .order("deliverable_no", { ascending: true });

  if (dErr) {
    // Not fatal; continue with empty.
  }

  const deliverablesMeta =
    (dheads ?? []).map((d: any) => ({
      id: d.id as number,
      no: Number(d.deliverable_no),
      date: d.created_at as string,
    })) ?? [];

  const deliverablesCount = deliverablesMeta.length;

  // 4) Lines for those deliverables → aggregate executed per item & per deliverable
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
  let executedByKey = new Map<string, number>();

  if (deliverablesMeta.length) {
    const ids = deliverablesMeta.map((d) => d.id);
    const { data: lines } = await supabase
      .from("deliverable_lines")
      .select("deliverable_id,item_id,descripcion,unidad,qty")
      .in("deliverable_id", ids);

    // Quick lookup for scope meta
    const scopeMap = new Map<
      string,
      { descripcion: string; unidad: string | null; contracted: number }
    >();
    for (const it of scope) {
      scopeMap.set(it.key, {
        descripcion: it.descripcion,
        unidad: it.unidad,
        contracted: it.contracted,
      });
    }

    // Aggregate
    const rowMap = new Map<
      string,
      {
        descripcion: string;
        unidad: string | null;
        contracted: number;
        executedTotal: number;
        perDeliverable: Record<number, number>;
      }
    >();

    const keyOf = (l: any) =>
      l.item_id != null
        ? `i:${l.item_id}`
        : `d:${String(l.descripcion || "").trim().toLowerCase()}`;

    for (const l of lines ?? []) {
      const key = keyOf(l);
      const base = scopeMap.get(key) || {
        descripcion: String(l.descripcion || ""),
        unidad: (l.unidad ?? null) as string | null,
        contracted: 0,
      };

      if (!rowMap.has(key)) {
        rowMap.set(key, {
          descripcion: base.descripcion,
          unidad: base.unidad,
          contracted: base.contracted,
          executedTotal: 0,
          perDeliverable: {},
        });
      }
      const row = rowMap.get(key)!;
      const add = Number(l.qty || 0);
      row.executedTotal += add;
      row.perDeliverable[l.deliverable_id] =
        (row.perDeliverable[l.deliverable_id] || 0) + add;

      executedByKey.set(key, (executedByKey.get(key) || 0) + add);
    }

    // Finalize rows in the same order as latest quote items
    execRows = scope.map((it) => {
      const r = rowMap.get(it.key) || {
        descripcion: it.descripcion,
        unidad: it.unidad,
        contracted: it.contracted,
        executedTotal: 0,
        perDeliverable: {} as Record<number, number>,
      };
      const remaining = Math.max(0, (r.contracted || 0) - (r.executedTotal || 0));
      return {
        key: it.key,
        descripcion: r.descripcion,
        unidad: r.unidad,
        contracted: r.contracted,
        executedTotal: r.executedTotal,
        remaining,
        perDeliverable: r.perDeliverable,
      };
    });
  } else {
    // No deliverables yet → zeroed table using scope order
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

  // 5) Overall progress% (cap each item at contracted)
  let sumC = 0;
  let sumE = 0;
  for (const r of execRows) {
    sumC += r.contracted;
    sumE += Math.min(r.executedTotal, r.contracted);
  }
  const progressPct = sumC > 0 ? Math.round((sumE / sumC) * 100) : 0;

  // 6) Render client UI
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
      counts={{ deliverables: deliverablesCount, cuts: 0, progressPct }}
      activity={[]}
      exec={{
        deliverables: deliverablesMeta,
        rows: execRows,
      }}
    />
  );
}

function safeJson<T>(s: string, fallback: T): T {
  try {
    const parsed = JSON.parse(s);
    return parsed as T;
  } catch {
    return fallback;
  }
}
