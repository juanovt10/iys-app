import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import DeliverablesListClient from "./DeliverablesListClient";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DeliverablesPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabase();

  // bigint or uuid
  const isNumeric = /^\d+$/.test(params.id);
  const projectIdFilter: number | string = isNumeric
    ? Number(params.id)
    : params.id;

  // Project header (for title/subtitle)
  const { data: proj } = await supabase
    .from("v_projects_dashboard")
    .select("id,name,project_client,quote_numero,latest_revision")
    .eq("id", projectIdFilter)
    .maybeSingle();

  if (!proj) return notFound();

  // Deliverable headers
  const { data: headers } = await supabase
    .from("deliverables")
    .select("id, deliverable_no, created_at, created_by, excel_file, pdf_file")
    .eq("project_id", projectIdFilter)
    .order("deliverable_no", { ascending: true });

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

  const ids = (headers ?? []).map((h) => h.id);
  let lines: {
    deliverable_id: number;
    descripcion: string;
    unidad: string | null;
    qty: number;
  }[] = [];

  if (ids.length) {
    const { data: l } = await supabase
      .from("deliverable_lines")
      .select("deliverable_id, descripcion, unidad, qty")
      .in("deliverable_id", ids);
    lines = (l ?? []).map((x: any) => ({
      deliverable_id: Number(x.deliverable_id),
      descripcion: String(x.descripcion ?? ""),
      unidad: x.unidad ?? null,
      qty: Number(x.qty ?? 0),
    }));
  }

  // Strongly type a preview line:
  type PreviewLine = {
    descripcion: string;
    unidad: string | null;
    qty: number;
  };

  // Aggregate per deliverable (count, total, preview)
  const perId = new Map<
    number,
    { itemsCount: number; totalQty: number; preview: PreviewLine[] }
  >();

  for (const id of ids) {
    perId.set(Number(id), { itemsCount: 0, totalQty: 0, preview: [] });
  }

  // Group lines by deliverable id
  const grouped = new Map<number, PreviewLine[]>();

  for (const ln of lines) {
    const arr = grouped.get(ln.deliverable_id) ?? [];
    arr.push({ descripcion: ln.descripcion, unidad: ln.unidad, qty: ln.qty });
    grouped.set(ln.deliverable_id, arr);
  }

  // ✅ Use .forEach instead of `for...of` on Map
  grouped.forEach((arr: PreviewLine[], id: number) => {
    const itemsCount = arr.length;
    const totalQty = arr.reduce(
      (s: number, r: PreviewLine) => s + (Number.isFinite(r.qty) ? r.qty : 0),
      0
    );
    const preview = arr.slice(0, 2);
    perId.set(id, { itemsCount, totalQty, preview });
  });

  // Build rows for the client table
  const rows = (headers ?? []).map((h: any) => {
    const agg = perId.get(Number(h.id)) ?? {
      itemsCount: 0,
      totalQty: 0,
      preview: [] as PreviewLine[],
    };
    return {
      id: Number(h.id),
      no: Number(h.deliverable_no),
      date: h.created_at as string,
      createdBy: h.created_by as string | null,
      itemsCount: agg.itemsCount,
      totalQty: agg.totalQty,
      preview: agg.preview,
      excelFile: h.excel_file as string | null,
      pdfFile: h.pdf_file as string | null,
    };
  });

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Actas de Entrega
          </h1>
          <p className="text-sm text-muted-foreground">
            Proyecto: <span className="font-medium">{proj.name}</span> · Cliente:{" "}
            <span className="font-medium">{proj.project_client}</span> · Cotizacion{" "}
            {proj.quote_numero} rev{proj.latest_revision}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-1">
            <Link href={`/projects/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Link>
          </Button>
          {hasFinalDeliverable ? (
            <Button disabled>
              Acta Final Creada
            </Button>
          ) : (
            <Button asChild>
              <Link href={`/projects/${params.id}/deliverables/new`}>
                Nueva Acta de Entrega
              </Link>
            </Button>
          )}
        </div>
      </div>

      <DeliverablesListClient projectId={String(proj.id)} rows={rows} />
    </div>
  );
}
