// app/projects/[id]/cuts/new/CreateCutClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ExternalLink, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { buildCutAPIData, getCutAPIFiles, saveCutData } from '@/lib/supabase/apiService';

export default function CreateCutClient({
  projectId,
  deliverables,
}: {
  projectId: string;
  deliverables: { id: number; no: number; date: string; isFinal: boolean }[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  const [selected, setSelected] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = (id: number) => {
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  // Check if any selected deliverable is final
  const hasFinalDeliverable = selected.some(id => 
    deliverables.find(d => d.id === id)?.isFinal
  );

  async function onCreate() {
    if (selected.length === 0) {
      toast({ variant: "destructive", title: "Selecciona al menos un acta de entrega" });
      return;
    }
    try {
      setSaving(true);
      const projId = /^\d+$/.test(projectId) ? Number(projectId) : projectId;
      const { data, error } = await supabase.rpc("create_cut", {
        p_project_id: projId as any,
        p_deliverable_ids: selected as any,
      });
      if (error) throw error;
      
      // Update the cut to mark it as final if needed
      if (hasFinalDeliverable) {
        try {
          const { error: updateError } = await supabase
            .from("cuts")
            .update({ is_final: true })
            .eq("id", data);
          if (updateError) {
            console.error("Failed to mark cut as final:", updateError);
            // Don't throw here, the cut was created successfully
          }
        } catch (error) {
          console.error("Error updating final flag:", error);
          // Continue anyway - the cut was created successfully
        }
      }

      // Generate documents for the cut
      try {
        console.log("Generating documents for cut:", data);
        const apiData = await buildCutAPIData(data, projectId, supabase);
        const generatedFiles = await getCutAPIFiles(apiData);
        
        // Update cut with file URLs
        await saveCutData({
          id: data,
          excel_file: generatedFiles.excelUrl,
          pdf_file: generatedFiles.pdfUrl
        });
        
        console.log("Documents generated successfully for cut:", data);
      } catch (error) {
        console.error("Error generating documents for cut:", error);
        // Don't fail the entire operation if document generation fails
      }

      const cutType = hasFinalDeliverable ? "Corte Final" : "Corte";
      toast({ title: `${cutType} creado` });
      router.push(`/projects/${projectId}/cuts/${data}`);
      setTimeout(() => router.refresh(), 0);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "No se pudo crear el corte",
        description: e?.message || "",
      });
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {deliverables.length === 0 ? (
          <li className="text-sm text-muted-foreground">
            No hay Actas de Entrega disponibles.
          </li>
        ) : (
          deliverables.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-3 rounded-md border p-3"
            >
              {/* Left: Acta de Entrega # and date */}
              <div className="min-w-0">
                <div className="font-medium">
                  {d.isFinal ? "Acta de Entrega Final" : "Acta de Entrega"} #{d.no}
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(d.date).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              {/* Right: View link + selection */}
              <div className="flex items-center gap-3">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="gap-1"
                >
                  <Link
                    href={`/projects/${projectId}/deliverables/${d.id}`}
                    prefetch={false}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver
                  </Link>
                </Button>

                <button
                  type="button"
                  onClick={() => toggle(d.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    selected.includes(d.id) 
                      ? "bg-muted text-foreground" 
                      : "hover:bg-muted/60 text-muted-foreground"
                  }`}
                >
                  {selected.includes(d.id) ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                  <span className="text-sm font-medium">
                    {selected.includes(d.id) ? "Seleccionado" : "Seleccionar"}
                  </span>
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={onCreate} disabled={saving || selected.length === 0}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando…
            </>
          ) : hasFinalDeliverable ? "Crear Corte Final" : "Crear corte"}
        </Button>
      </div>
    </div>
  );
}
