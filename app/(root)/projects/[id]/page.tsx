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

type ActivityItem = {
  event_type: string;
  occurred_at: string;
  actor?: string | null;
  label: string;
  href?: string;
};

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase();

  const isNumeric = /^\d+$/.test(params.id);
  const projectIdFilter: number | string = isNumeric ? Number(params.id) : params.id;

  // Pull counts directly here too
  const { data: proj, error: projError } = await supabase
    .from("v_projects_dashboard")
    .select("id,name,status,created_at,quote_numero,project_revision,latest_revision,latest_cotizacion_id,project_client,deliverables_count,cuts_count")
    .eq("id", projectIdFilter)
    .maybeSingle();
  
  if (projError) {
    console.error("Error fetching project:", projError);
  }
  
  if (!proj) return notFound();
  
  console.log("Project data from v_projects_dashboard:", proj);
  
  // Also check the actual proyectos table to see if status was updated
  const { data: actualProj, error: actualProjError } = await supabase
    .from("proyectos")
    .select("id, name, status")
    .eq("id", projectIdFilter)
    .maybeSingle();
  
  if (actualProjError) {
    console.error("Error fetching from proyectos table:", actualProjError);
  } else {
    console.log("Project data from proyectos table:", actualProj);
  }

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
    extraQty: number;
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
      const extraQty = Math.max(0, (r.executedTotal || 0) - (r.contracted || 0));
      return { 
        key: it.key, 
        descripcion: r.descripcion, 
        unidad: r.unidad, 
        contracted: r.contracted, 
        executedTotal: r.executedTotal, 
        remaining, 
        extraQty,
        perDeliverable: r.perDeliverable 
      };
    });
  } else {
    execRows = scope.map((it) => ({
      key: it.key,
      descripcion: it.descripcion,
      unidad: it.unidad,
      contracted: it.contracted,
      executedTotal: 0,
      remaining: it.contracted,
      extraQty: 0,
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

  // 2) Recent activity (last 20)
  const { data: acts } = await supabase
    .from("project_activity")
    .select("event_type, occurred_at, actor_id, meta")
    .eq("project_id", projectIdFilter)
    .order("occurred_at", { ascending: false })
    .limit(20);

  const activity: ActivityItem[] = (acts ?? []).map((a: any) => {
    const et = String(a.event_type);
    const meta = (a.meta ?? {}) as any;

    if (et === "deliverable_created") {
      const isFinal = meta.is_final || false;
      return {
        event_type: et,
        occurred_at: a.occurred_at,
        actor: a.actor_id ?? null,
        label: `Acta de entrega ${isFinal ? "Final" : `#${meta.deliverable_no ?? ""}`} creada`,
        href: meta.deliverable_id ? `/projects/${proj.id}/deliverables/${meta.deliverable_id}` : undefined,
      };
    }
    if (et === "cut_created") {
      const isFinal = meta.is_final || false;
      return {
        event_type: et,
        occurred_at: a.occurred_at,
        actor: a.actor_id ?? null,
        label: `Corte ${isFinal ? "Final" : `#${meta.cut_no ?? ""}`} creado`,
        href: meta.cut_id ? `/projects/${proj.id}/cuts/${meta.cut_id}` : undefined,
      };
    }
    if (et === "quote_updated") {
      return {
        event_type: et,
        occurred_at: a.occurred_at,
        actor: a.actor_id ?? null,
        label: "Cotización actualizada (fuente de verdad)",
        href: meta.to_cotizacion_id ? `/quotes/${meta.to_cotizacion_id}` : undefined,
      };
    }
    return { event_type: et, occurred_at: a.occurred_at, actor: a.actor_id ?? null, label: et.replace(/_/g, " ") };
  });

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

  const deliverablesCount = Number(proj.deliverables_count ?? deliverablesMeta.length);
  const cutsCount = Number(proj.cuts_count ?? 0);
  
  // Use status from actual proyectos table if available, otherwise fall back to view
  const status = (actualProj?.status as any) ?? (proj.status as any) ?? "active";
  
  // Debug: Log the status being used
  console.log("Project status from database:", { 
    viewStatus: proj.status, 
    actualStatus: actualProj?.status, 
    finalStatus: status 
  });

  return (
    <ProjectDetailClient
      project={{
        id: String(proj.id),
        name: proj.name,
        status,
        clientName: proj.project_client,
        quoteNumero: String(proj.quote_numero),
        revisionShown: Number(proj.latest_revision ?? proj.project_revision ?? 0),
        itemsCount: scope.length,
        createdAt: proj.created_at,
        hasFinalDeliverable,
      }}
      counts={{ deliverables: deliverablesCount, cuts: cutsCount, progressPct }}
      activity={activity}
      exec={{ deliverables: deliverablesMeta, rows: execRows }}
    />
  );
}

function safeJson<T>(s: string, fallback: T): T {
  try { return JSON.parse(s) as T; } catch { return fallback; }
}
