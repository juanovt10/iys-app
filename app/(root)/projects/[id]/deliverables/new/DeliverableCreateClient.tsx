"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import DeliverableItemsTable, { DeliverableRow } from "./DeliverableItemsTable";

export default function DeliverableCreateClient({
  project,
  items,
}: {
  project: { id: string; name: string; clientName: string; quoteNumero: string; revision: number };
  items: { itemId: number | null; descripcion: string; unidad: string | null; maxQty: number }[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<DeliverableRow[]>(
    items.map((it) => ({ ...it, qty: 0 }))
  );
  const [saving, setSaving] = useState(false);

  function onQtyChange(index: number, nextQty: number) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, qty: nextQty } : r)));
  }

  const hasAnyQty = rows.some((r) => r.qty > 0);
  const hasInvalid = rows.some((r) => r.qty < 0);
  const canSave = hasAnyQty && !hasInvalid && !saving;

  async function onSave() {
    try {
      setSaving(true);

      const projectId = /^\d+$/.test(project.id)
        ? Number(project.id)
        : project.id;

      // 1) Create header (RPC sets created_by from auth.uid())
      const { data: newId, error: e1 } = await supabase.rpc(
        "create_deliverable",
        {
          p_project_id: projectId as any,
        }
      );
      if (e1) throw e1;
      const deliverableId = Number(newId);

      // 2) Insert lines (only those with qty > 0)
      const lines = rows
        .filter((r) => r.qty > 0)
        .map((r) => ({
          deliverable_id: deliverableId,
          item_id: r.itemId,
          descripcion: r.descripcion,
          unidad: r.unidad,
          qty: r.qty,
        }));

      if (lines.length) {
        const { error: e2 } = await supabase
          .from("deliverable_lines")
          .insert(lines);
        if (e2) throw e2;
      }

      // 3) Back to project detail (counts view will reflect header count;
      //    we’ll wire progress later)
      router.push(`/projects/${project.id}`);
      setTimeout(() => router.refresh(), 0);
    } catch (e: any) {
      console.error("Create deliverable failed:", e?.message || e);
    } finally {
      setSaving(false);
    }
  }


  return (
    <div className="mx-auto max-w-[1000px] space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">New Deliverable</h1>
        <p className="text-sm text-muted-foreground">
          Project: <span className="font-medium">{project.name}</span> · Client:{" "}
          <span className="font-medium">{project.clientName}</span> · Quote {project.quoteNumero} rev {project.revision}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cantidades Ejecutadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DeliverableItemsTable rows={rows} onQtyChange={onQtyChange} />
          {!hasAnyQty && (
            <div className="text-sm text-muted-foreground">
              Enter at least one executed quantity to save.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()} disabled={saving}>Cancel</Button>
        <Button onClick={onSave} disabled={!canSave}>
          {saving ? "Saving…" : "Save deliverable"}
        </Button>
      </div>
    </div>
  );
}
