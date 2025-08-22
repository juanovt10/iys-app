import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CutHeader = {
  id: number | string;
  project_id: number | string;
  cut_no: number;
  status: string;
  total_amount: number | string | null;
  created_at: string;
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

  if (cutErr || !cut) return notFound();

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

  return (
    <div className="mx-auto max-w-[1000px] space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Corte #{cut.cut_no}
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
            {new Date(cut.created_at).toLocaleString()} · Status: {cut.status}
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
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="text-xl font-semibold">
            {money(cut.total_amount)}
          </div>
        </div>
      </div>
    </div>
  );
}
