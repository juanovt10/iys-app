// app/projects/[id]/cuts/new/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CreateCutClient from "./CreateCutClient";


export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CutNewPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const pid = /^\d+$/.test(params.id) ? Number(params.id) : params.id;

  const { data: proj } = await supabase
    .from("v_projects_dashboard")
    .select("id,name,project_client,quote_numero,latest_revision")
    .eq("id", pid)
    .maybeSingle();
  if (!proj) return notFound();

  // deliverables available (not yet in a cut)
  const { data: deliverables } = await supabase
    .from("deliverables")
    .select("id, deliverable_no, created_at")
    .eq("project_id", pid)
    .is("cut_id", null)
    .order("deliverable_no", { ascending: true });

  return (
    <div className="mx-auto max-w-[900px] space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Nuevo Corte</h1>
          <p className="text-sm text-muted-foreground">
            Proyecto: <span className="font-medium">{proj.name}</span> · Cliente:{" "}
            <span className="font-medium">{proj.project_client}</span>
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seleccione las Actas de Entrega a incluir en el corte</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateCutClient
            projectId={String(proj.id)}
            deliverables={(deliverables ?? []).map((d: any) => ({
              id: Number(d.id),
              no: Number(d.deliverable_no),
              date: d.created_at as string,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
