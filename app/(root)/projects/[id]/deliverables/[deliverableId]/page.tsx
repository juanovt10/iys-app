// app/projects/[id]/deliverables/[deliverableId]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download } from "lucide-react";
import BackButton from "@/components/BackButton";
import DeliverableDetailClient from "./DeliverableDetailClient";

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
    .select("id, project_id, deliverable_no, created_at, created_by, excel_file, pdf_file")
    .eq("id", delivId)
    .maybeSingle();

  if (!header) return notFound();

  const { data: proj } = await supabase
    .from("v_projects_dashboard")
    .select("id, name, project_client, quote_numero, latest_revision")
    .eq("id", header.project_id)
    .maybeSingle();

  const { data: lines } = await supabase
    .from("deliverable_lines")
    .select("descripcion, unidad, qty")
    .eq("deliverable_id", header.id);

  return (
    <DeliverableDetailClient
      header={header}
      project={proj}
      lines={lines || []}
      projectId={params.id}
    />
  );
}
