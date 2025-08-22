// app/projects/[id]/cuts/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CutsPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const pid = /^\d+$/.test(params.id) ? Number(params.id) : params.id;

  const { data: proj } = await supabase
    .from("v_projects_dashboard")
    .select("id,name,project_client,quote_numero,latest_revision")
    .eq("id", pid)
    .maybeSingle();
  if (!proj) return notFound();

  const { data: cuts } = await supabase
    .from("cuts")
    .select("id, cut_no, status, total_amount, created_at")
    .eq("project_id", pid)
    .order("cut_no", { ascending: true });

  // deliverables per cut (for the list)
  const ids = (cuts ?? []).map((c) => c.id);
  let deliverablesCount = new Map<number, number>();
  if (ids.length) {
    const { data: d } = await supabase
      .from("deliverables")
      .select("id, cut_id")
      .in("cut_id", ids);
    const map = new Map<number, number>();
    for (const row of d ?? []) {
      const k = Number(row.cut_id);
      map.set(k, (map.get(k) || 0) + 1);
    }
    deliverablesCount = map;
  }

  const money = (n: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n || 0);

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Cortes</h1>
          <p className="text-sm text-muted-foreground">
            Project: <span className="font-medium">{proj.name}</span> · Cliente:{" "}
            <span className="font-medium">{proj.project_client}</span> · Cotizacion {proj.quote_numero} rev{proj.latest_revision}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-1">
              <Link href={`/projects/${params.id}`}>
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </Link>
            </Button>
          <Button asChild>
            <Link href={`/projects/${params.id}/cuts/new`}>Nuevo corte</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">No.</TableHead>
                  <TableHead className="w-36">Fecha</TableHead>
                  <TableHead className="w-28 text-center"># Actas de Entrega</TableHead>
                  <TableHead className="w-28 text-center">Status</TableHead>
                  <TableHead className="w-36 text-right">Total</TableHead>
                  <TableHead className="w-28 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(cuts ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-sm text-muted-foreground">
                      No hay cortes todavia.
                    </TableCell>
                  </TableRow>
                ) : (
                  (cuts ?? []).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">#{c.cut_no}</TableCell>
                      <TableCell>{new Date(c.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        {deliverablesCount.get(Number(c.id)) || 0}
                      </TableCell>
                      <TableCell className="text-center">{c.status}</TableCell>
                      <TableCell className="text-right">{money(Number(c.total_amount || 0))}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/projects/${params.id}/cuts/${c.id}`}>Ver</Link>
                        </Button>
                      </TableCell>
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
