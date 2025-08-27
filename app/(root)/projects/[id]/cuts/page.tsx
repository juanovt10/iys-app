// app/projects/[id]/cuts/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Scissors } from "lucide-react";
import CutsListClient from "./CutsListClient";

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
    .select("id, cut_no, status, total_amount, created_at, excel_file, pdf_file")
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

  // Build rows for the client table
  const rows = (cuts ?? []).map((c: any) => ({
    id: Number(c.id),
    no: Number(c.cut_no),
    status: c.status,
    totalAmount: c.total_amount,
    date: c.created_at,
    deliverablesCount: deliverablesCount.get(Number(c.id)) || 0,
    excelFile: c.excel_file,
    pdfFile: c.pdf_file,
  }));

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-4 md:p-6">
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
          <Button asChild className="gap-2">
            <Link href={`/projects/${params.id}/cuts/new`}>
              <Scissors className="h-4 w-4" />
              Nuevo corte
            </Link>
          </Button>
        </div>
      </div>

      <CutsListClient
        projectId={String(proj.id)}
        rows={rows}
      />
    </div>
  );
}
