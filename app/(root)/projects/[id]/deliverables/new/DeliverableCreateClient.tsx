"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DeliverableItemsTable, { DeliverableRow } from "./DeliverableItemsTable";
import { updateProjectStatusToCompleted } from "@/lib/actions";
import { buildDeliverableAPIData, getDeliverableAPIFiles, saveDeliverableData } from '@/lib/supabase/apiService';
import { Loader2 } from "lucide-react";

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
  const [showFinalDialog, setShowFinalDialog] = useState(false);
  const [isFinalDeliverable, setIsFinalDeliverable] = useState(false);
  const [projectProgress, setProjectProgress] = useState(0);
  const [rows, setRows] = useState<DeliverableRow[]>(
    items.map((it) => ({
      itemId: it.itemId,
      descripcion: it.descripcion,
      unidad: it.unidad,
      contracted: it.contracted,
      executedSoFar: 0,
      remaining: it.contracted,
      qty: 0,
      extraQty: 0,
    }))
  );

  // Load executed so far to compute remaining and check progress
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
      
      // Calculate project progress
      let totalContracted = 0;
      let totalExecuted = 0;
      
      const updatedRows = items.map((it) => {
        const key = it.itemId != null ? `i:${it.itemId}` : `d:${it.descripcion.trim().toLowerCase()}`;
        const executedSoFar = sum.get(key) || 0;
        const remaining = Math.max(0, (it.contracted || 0) - executedSoFar);
        
        totalContracted += it.contracted;
        totalExecuted += executedSoFar;
        
        return {
          itemId: it.itemId,
          descripcion: it.descripcion,
          unidad: it.unidad,
          contracted: it.contracted,
          executedSoFar,
          remaining,
          qty: 0,
          extraQty: 0,
        };
      });
      
      setRows(updatedRows);
      
      // Calculate progress percentage
      const progress = totalContracted > 0 ? Math.round((totalExecuted / totalContracted) * 100) : 0;
      setProjectProgress(progress);
    })();
    return () => {
      mounted = false;
    };
  }, [project.id, supabase, items]);

  const hasAnyQty = rows.some((r) => r.qty > 0);
  const canSave = hasAnyQty && !saving;

  function onQtyChange(index: number, nextQty: number) {
    if (nextQty < 0) nextQty = 0;
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], qty: nextQty };
      return copy;
    });
  }

  async function onSave() {
    // Check if project is over 50% and show final deliverable dialog
    if (projectProgress > 50 && !isFinalDeliverable) {
      setShowFinalDialog(true);
      return;
    }

    await createDeliverable();
  }

  async function createDeliverable(isFinal: boolean = isFinalDeliverable) {
    try {
      setSaving(true);
      const projectId = /^\d+$/.test(project.id) ? Number(project.id) : project.id;
      console.log("Creating deliverable for project:", { projectId, projectIdType: typeof projectId, originalId: project.id });

      // Get the next deliverable number for this project
      const { data: existingDeliverables } = await supabase
        .from("deliverables")
        .select("deliverable_no")
        .eq("project_id", projectId)
        .order("deliverable_no", { ascending: false })
        .limit(1);
      
      const nextDeliverableNo = existingDeliverables && existingDeliverables.length > 0 
        ? Math.max(...existingDeliverables.map(d => Number(d.deliverable_no))) + 1 
        : 1;

      // Create deliverable header directly with is_final flag
      const { data: newDeliverable, error: e1 } = await supabase
        .from("deliverables")
        .insert({
          project_id: projectId,
          deliverable_no: nextDeliverableNo,
          is_final: isFinal,
        })
        .select("id")
        .single();
      
      if (e1) throw e1;
      const deliverableId = Number(newDeliverable.id);

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

      // If this is a final deliverable, update project status to completed using server action
      if (isFinal) {
        try {
          console.log("Using server action to update project status to completed for project ID:", projectId);
          await updateProjectStatusToCompleted(projectId);
          console.log("Server action completed successfully");
        } catch (error) {
          console.error("Server action failed:", error);
          // Don't throw here, the deliverable was created successfully
        }
      }

      console.log("Deliverable created successfully:", { deliverableId, isFinal: isFinal });

      // Generate documents for the deliverable
      try {
        console.log("Generating documents for deliverable:", deliverableId);
        const apiData = await buildDeliverableAPIData(deliverableId, projectId, supabase);
        const generatedFiles = await getDeliverableAPIFiles(apiData);
        
        // Update deliverable with file URLs
        await saveDeliverableData({
          id: deliverableId,
          excel_file: generatedFiles.excelUrl,
          pdf_file: generatedFiles.pdfUrl
        });
        
        console.log("Documents generated successfully for deliverable:", deliverableId);
      } catch (error) {
        console.error("Error generating documents for deliverable:", error);
        // Don't fail the entire operation if document generation fails
      }

      const deliverableType = isFinal ? "Acta de Entrega Final" : "Acta de Entrega";
      toast({ 
        title: `${deliverableType} creada`, 
        description: isFinal ? "Las cantidades fueron registradas. El proyecto ha sido marcado como completado." : "Las cantidades fueron registradas." 
      });
      
      // Force a hard refresh to ensure the updated status is shown
      if (isFinal) {
        window.location.href = `/projects/${project.id}`;
      } else {
        router.push(`/projects/${project.id}`);
        setTimeout(() => router.refresh(), 0);
      }
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
    <div className="mx-auto max-w-[1200px] space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Nueva Acta de Entrega</h1>
        <p className="text-sm text-muted-foreground">
          Proyecto: <span className="font-medium">{project.name}</span> · Cliente:{" "}
          <span className="font-medium">{project.clientName}</span> · Cotización {project.quoteNumero} rev{project.revision}
        </p>
        {projectProgress > 50 && (
          <div className="mt-2 text-sm text-amber-600">
            ⚠️ Proyecto al {projectProgress}% de ejecución. Considera si esta es la Acta de Entrega Final.
          </div>
        )}
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
        <Button onClick={onSave} disabled={!canSave || saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando…
            </>
          ) : isFinalDeliverable ? "Crear Acta de Entrega Final" : "Crear Acta de Entrega"}
        </Button>
      </div>

      {/* Final Deliverable Dialog */}
      <Dialog open={showFinalDialog} onOpenChange={setShowFinalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Es esta la Acta de Entrega Final?</DialogTitle>
            <DialogDescription>
              El proyecto está al {projectProgress}% de ejecución. Si marcas esta como Acta de Entrega Final, 
              no se podrán crear más actas de entrega para este proyecto.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowFinalDialog(false);
                setIsFinalDeliverable(false);
                createDeliverable(false);
              }}
            >
              No, es una entrega normal
            </Button>
            <Button 
              onClick={() => {
                setShowFinalDialog(false);
                setIsFinalDeliverable(true);
                createDeliverable(true);
              }}
            >
              Sí, es la entrega final
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
