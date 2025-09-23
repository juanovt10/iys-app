import { notFound } from "next/navigation";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import CutDetailClient from "./CutDetailClient";
import { calculateTotals } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CutHeader = {
  id: number | string;
  project_id: number | string;
  cut_no: number;
  status: string;
  total_amount: number | string | null;
  created_at: string;
  is_final?: boolean;
  excel_file?: string | null;
  pdf_file?: string | null;
};

type CutLine = {
  descripcion: string;
  unidad: string | null;
  qty: number | string | null;
  unit_price: number | string | null;
  line_total: number | string | null;
};

export default async function CutDetailPage({
  params,
}: {
  params: { id: string; cutId: string };
}) {
  const supabase = createServerSupabase();

  // Accept bigint or uuid ids
  const cutId = /^\d+$/.test(params.cutId) ? Number(params.cutId) : params.cutId;

  // 1) Cut header
  const { data: cut, error: cutErr } = await supabase
    .from("cuts")
    .select("id, project_id, cut_no, status, total_amount, created_at, excel_file, pdf_file")
    .eq("id", cutId)
    .maybeSingle<CutHeader>();

  if (cutErr) {
    console.error("Error fetching cut:", cutErr);
    return notFound();
  }
  
  if (!cut) {
    console.error("Cut not found with ID:", cutId);
    return notFound();
  }

  // Check if is_final column exists by trying to fetch it separately
  let isFinal = false;
  try {
    const { data: finalCheck } = await supabase
      .from("cuts")
      .select("is_final")
      .eq("id", cutId)
      .maybeSingle();
    isFinal = finalCheck?.is_final || false;
  } catch (error) {
    console.log("is_final column doesn't exist, defaulting to false");
    isFinal = false;
  }

  // 2) Project (for header context)
  const { data: proj } = await supabase
    .from("v_projects_dashboard")
    .select("id, name, project_client, quote_numero, latest_revision")
    .eq("id", cut.project_id)
    .maybeSingle<{ id: number | string; name: string; project_client: string | null; quote_numero: number; latest_revision: number }>();

  // 3) Lines
  const { data: lines } = await supabase
    .from("cut_lines")
    .select("descripcion, unidad, qty, unit_price, line_total")
    .eq("cut_id", cut.id)
    .order("descripcion", { ascending: true }) as { data: CutLine[] | null };

  const money = (n: number | string | null | undefined) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n || 0));
  const num = (n: number | string | null | undefined) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(Number(n || 0));

  const linesArr = lines ?? [];
  const tableEmpty = linesArr.length === 0;

  // Calculate totals using the same logic as quotes
  const itemsForCalculation = linesArr.map(line => ({
    id: 0, // Placeholder ID
    descripcion: line.descripcion,
    unidad: line.unidad || '',
    precio_unidad: Number(line.unit_price || 0),
    cantidad: Number(line.qty || 0),
    categoria: '',
  }));

  const { subtotal, aiu20, iva, total } = calculateTotals(itemsForCalculation);

  return (
    <CutDetailClient
      cut={{ ...cut, is_final: isFinal }}
      project={proj}
      lines={linesArr}
      projectId={params.id}
    />
  );
}
