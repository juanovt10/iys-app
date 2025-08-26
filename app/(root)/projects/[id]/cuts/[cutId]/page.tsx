import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download } from "lucide-react";
import { calculateTotals, formatWithCommas } from "@/lib/utils";

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
    .select("id, project_id, cut_no, status, total_amount, created_at")
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
    .select("id, name, project_client")
    .eq("id", cut.project_id)
    .maybeSingle<{ id: number | string; name: string; project_client: string | null }>();

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
    codigo: '',
    tamano: '',
    color: '',
    forma: '',
    imagen: ''
  }));

  const { subtotal, aiu20, iva, total } = calculateTotals(itemsForCalculation);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {isFinal ? "Corte Final" : `Corte #${cut.cut_no}`}
          </h1>
          <div className="text-sm text-muted-foreground">
            <span>
              Proyecto: <span className="font-medium">{proj?.name ?? "—"}</span>
            </span>
            {proj?.project_client ? (
              <> · Cliente: <span className="font-medium">{proj.project_client}</span></>
            ) : null}
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(cut.created_at).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })} · Status: {cut.status}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-1">
            <Link href={`/projects/${params.id}/cuts`}>
              <ArrowLeft className="h-4 w-4" /> Atras
            </Link>
          </Button>
          <Button disabled className="gap-1">
            <Download className="h-4 w-4" /> Descargar
          </Button>
        </div>
      </div>

      {/* Lines */}
      <Card>
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-20 text-center">Unidad</TableHead>
                  <TableHead className="w-28 text-center">Cantidad</TableHead>
                  <TableHead className="w-32 text-right">Precio/U</TableHead>
                  <TableHead className="w-36 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableEmpty ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm text-muted-foreground">
                      No lines.
                    </TableCell>
                  </TableRow>
                ) : (
                  linesArr.map((ln, i) => (
                    <TableRow key={i}>
                      <TableCell>{ln.descripcion}</TableCell>
                      <TableCell className="text-center">{ln.unidad ?? ""}</TableCell>
                      <TableCell className="text-center tabular-nums">{num(ln.qty)}</TableCell>
                      <TableCell className="text-right tabular-nums">{money(ln.unit_price)}</TableCell>
                      <TableCell className="text-right tabular-nums">{money(ln.line_total)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="text-right space-y-2">
          <div className="text-sm text-muted-foreground">Subtotal</div>
          <div className="text-lg">${formatWithCommas(subtotal)}</div>
          
          <div className="text-sm text-muted-foreground">AIU (20%)</div>
          <div className="text-lg">${formatWithCommas(aiu20)}</div>
          
          <div className="text-sm text-muted-foreground">IVA</div>
          <div className="text-lg">${formatWithCommas(iva)}</div>
          
          <div className="text-sm text-muted-foreground font-medium">Total</div>
          <div className="text-xl font-semibold">
            ${formatWithCommas(total)}
          </div>
        </div>
      </div>
    </div>
  );
}
