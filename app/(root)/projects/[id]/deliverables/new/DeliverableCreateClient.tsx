"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import DeliverableItemsTable, { DeliverableRow } from "./DeliverableItemsTable";

type ItemInput = {
  itemId: number | null;
  descripcion: string;
  unidad: string | null;
  contracted: number;
};

export default function DeliverableCreateClient({
  project,
  items,
}: {
  project: { id: string; name: string; clientName: string; quoteNumero: string; revision: number };
  items: ItemInput[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<DeliverableRow[]>(
    items.map((it) => ({
      itemId: it.itemId,
      descripcion: it.descripcion,
      unidad: it.unidad,
      contracted: it.contracted,
      executedSoFar: 0,
      remaining: it.contracted,
      qty: 0,
    }))
  );

  // Load executed so far to compute remaining
  useEffect(() => {
    let mounted = true;
    (async () => {
      const projId = /^\d+$/.test(project.id) ? Number(project.id) : project.id;

      const { data: dheads, error: e1 } = await supabase
        .from("deliverables")
        .select("id")
        .eq("project_id", projId);
      if (e1 || !mounted) return;
      if (!dheads?.length) return;

      const ids = dheads.map((d) => d.id);
      const { data: lines } = await supabase
        .from("deliverable_lines")
        .select("deliverable_id,item_id,descripcion,unidad,qty")
        .in("deliverable_id", ids);

      const sum = new Map<string, number>();
      const keyOf = (l: any) =>
        l.item_id != null ? `i:${l.item_id}` : `d:${String(l.descripcion || "").trim().toLowerCase()}`;

      for (const l of lines ?? []) {
        const k = keyOf(l);
        sum.set(k, (sum.get(k) || 0) + Number(l.qty || 0));
      }

      if (!mounted) return;
      setRows((prev) =>
        prev.map((r) => {
          const key = r.itemId != null ? `i:${r.itemId}` : `d:${r.descripcion.trim().toLowerCase()}`;
          const executedSoFar = sum.get(key) || 0;
          const remaining = Math.max(0, (r.contracted || 0) - executedSoFar);
          return { ...r, executedSoFar, remaining, qty: r.qty };
        })
      );
    })();
    return () => {
      mounted = false;
    };
  }, [project.id, supabase]);

  const hasAnyQty = rows.some((r) => r.qty > 0);
  const canSave = hasAnyQty && !saving; // ✅ allow save even with overages; we validate on click

  function onQtyChange(index: number, nextQty: number) {
    if (nextQty < 0) nextQty = 0;
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], qty: nextQty };
      return copy;
    });
  }

  async function onSave() {
    // Validate on click (better UX: button stays enabled)
    const over = rows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.qty > r.remaining);

    if (over.length) {
      const first = over[0];
      const overCount = over.length;
      const list = over.slice(0, 3).map(({ r }) => `• ${r.descripcion}`).join("\n");
      toast({
        variant: "destructive",
        title: "Cantidades exceden lo contratado",
        description:
          (overCount > 1
            ? `Hay ${overCount} ítems con exceso:\n${list}${overCount > 3 ? "\n…" : ""}`
            : `“${first.r.descripcion}” excede el restante (${new Intl.NumberFormat().format(
                first.r.remaining
              )} ${first.r.unidad ?? ""}).`) + " Ajusta las cantidades y vuelve a guardar.",
      });
      // Focus & scroll to first invalid input
      requestAnimationFrame(() => {
        document.getElementById(`row-${first.i}-qty`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        (document.getElementById(`row-${first.i}-qty`) as HTMLInputElement | null)?.focus();
      });
      return;
    }

    try {
      setSaving(true);
      const projectId = /^\d+$/.test(project.id) ? Number(project.id) : project.id;

      // Create header
      const { data: newId, error: e1 } = await supabase.rpc("create_deliverable", {
        p_project_id: projectId as any,
      });
      if (e1) throw e1;
      const deliverableId = Number(newId);

      // Insert lines
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
        const { error: e2 } = await supabase.from("deliverable_lines").insert(lines);
        if (e2) throw e2;
      }

      toast({ title: "Entregable creado", description: "Las cantidades fueron registradas." });
      router.push(`/projects/${project.id}`);
      setTimeout(() => router.refresh(), 0);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error al crear entregable",
        description: e?.message || "Intenta de nuevo.",
      });
      console.error("Create deliverable failed:", e?.message || e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1000px] space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Nueva Acta de Entrega</h1>
        <p className="text-sm text-muted-foreground">
          Proyecto: <span className="font-medium">{project.name}</span> · Cliente:{" "}
          <span className="font-medium">{project.clientName}</span> · Cotización {project.quoteNumero} rev{project.revision}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cantidades Ejecutadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DeliverableItemsTable rows={rows} onQtyChange={onQtyChange} />
          {!hasAnyQty && (
            <div className="text-sm text-muted-foreground">Ingresa al menos una cantidad para guardar.</div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={onSave} disabled={!canSave}>
          {saving ? "Guardando…" : "Guardar entregable"}
        </Button>
      </div>
    </div>
  );
}
