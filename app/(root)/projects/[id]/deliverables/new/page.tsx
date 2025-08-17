// app/projects/[id]/deliverables/new/page.tsx
import { notFound } from "next/navigation";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import DeliverableCreateClient from "./DeliverableCreateClient";

type QuoteItem = {
  id?: number | null;
  descripcion?: string;
  unidad?: string | null;
  cantidad?: number | string | null;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DeliverableNewPage({
  params,
}: { params: { id: string } }) {
  const supabase = createServerSupabase();

  // Accept bigint or uuid project ids
  const isNumeric = /^\d+$/.test(params.id);
  const projectIdFilter: number | string = isNumeric ? Number(params.id) : params.id;

  // 1) Get project header (with latest_cotizacion_id and client/name/meta)
  const { data: proj, error: projErr } = await supabase
    .from("v_projects_dashboard")
    .select(
      "id,name,status,project_client,quote_numero,latest_revision,latest_cotizacion_id"
    )
    .eq("id", projectIdFilter)
    .maybeSingle();

  if (projErr || !proj) return notFound();

  // 2) Load latest quote items (contracted scope)
  const { data: q } = await supabase
    .from("cotizaciones")
    .select("items")
    .eq("id", proj.latest_cotizacion_id)
    .maybeSingle();

  const raw = q?.items;
  const arr: QuoteItem[] = Array.isArray(raw)
    ? raw as QuoteItem[]
    : typeof raw === "string"
      ? safeJson<QuoteItem[]>(raw, [])
      : [];

  // 3) Map to input expected by DeliverableCreateClient
  const items = arr.map((it) => ({
    itemId: it?.id ?? null,
    descripcion: String(it?.descripcion ?? ""),
    unidad: (it?.unidad ?? null) as string | null,
    contracted: Number(it?.cantidad ?? 0) || 0, // <-- THIS is "Contratado"
  }));

  return (
    <DeliverableCreateClient
      project={{
        id: String(proj.id),
        name: proj.name,
        clientName: proj.project_client,
        quoteNumero: String(proj.quote_numero),
        revision: Number(proj.latest_revision ?? 0),
      }}
      items={items}
    />
  );
}

function safeJson<T>(s: string, fallback: T): T {
  try { return JSON.parse(s) as T; } catch { return fallback; }
}
