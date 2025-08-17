// app/projects/[id]/deliverables/new/page.tsx
import { notFound } from "next/navigation";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import DeliverableCreateClient from "./DeliverableCreateClient";

export default async function NewDeliverablePage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const pid = Number(params.id); // if UUID, keep as string

  // project + latest quote ids
  const { data: proj, error } = await supabase
    .from("v_projects_dashboard")
    .select(
      "id,name,project_client,quote_numero,latest_revision,latest_cotizacion_id"
    )
    .eq("id", pid)
    .maybeSingle();

  if (error || !proj) return notFound();

  // items from the latest quote
  const { data: quote } = await supabase
    .from("cotizaciones")
    .select("items")
    .eq("id", proj.latest_cotizacion_id)
    .maybeSingle();

  const raw = quote?.items;
  const items = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
    ? (() => { try { return JSON.parse(raw); } catch { return []; } })()
    : [];

  // Normalize to the shape we need in the form
  const scopeItems = (items ?? []).map((it: any) => ({
    itemId: it?.id ?? null,
    descripcion: String(it?.descripcion ?? ""),
    unidad: it?.unidad ?? null,
    maxQty: Number(it?.cantidad ?? 0) || 0, // contracted qty
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
      items={scopeItems}
    />
  );
}
