// app/projects/[id]/deliverables/[deliverableId]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download } from "lucide-react";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DeliverableDetailPage({
  params,
}: { params: { id: string; deliverableId: string } }) {
  const supabase = createServerSupabase();

  const isNumeric = /^\d+$/.test(params.deliverableId);
  const delivId = isNumeric ? Number(params.deliverableId) : params.deliverableId;

  const { data: header } = await supabase
    .from("deliverables")
    .select("id, project_id, deliverable_no, created_at, created_by")
    .eq("id", delivId)
    .maybeSingle();

  if (!header) return notFound();

  const { data: proj } = await supabase
    .from("v_projects_dashboard")
    .select("id, name, project_client")
    .eq("id", header.project_id)
    .maybeSingle();

  const { data: lines } = await supabase
    .from("deliverable_lines")
    .select("descripcion, unidad, qty")
    .eq("deliverable_id", header.id);

  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(n || 0);

  return (
    <div className="mx-auto max-w-[1000px] space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Acta de Entrega #{header.deliverable_no}
          </h1>
          <p className="text-sm text-muted-foreground">
            Proyecto: <span className="font-medium">{proj?.name}</span>{" "}
            {proj?.project_client ? <>· Cliente: <span className="font-medium">{proj.project_client}</span></> : null}
          </p>
          <div className="text-xs text-muted-foreground">
            {new Date(header.created_at).toLocaleString()}
            {header.created_by ? <> · by {header.created_by}</> : null}
          </div>
        </div>
        <div className="flex gap-2">
          <BackButton fallbackHref={`/projects/${params.id}`} />
          <Button disabled className="gap-1">
            <Download className="h-4 w-4" /> Descargar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-base">Items entregados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-24 text-center">Unidad</TableHead>
                  <TableHead className="w-28 text-center">Cantidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(lines ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-sm text-muted-foreground">
                      No lines.
                    </TableCell>
                  </TableRow>
                ) : (
                  (lines ?? []).map((ln: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell>{ln.descripcion}</TableCell>
                      <TableCell className="text-center">{ln.unidad ?? ""}</TableCell>
                      <TableCell className="text-center tabular-nums">{fmt(Number(ln.qty ?? 0))}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
