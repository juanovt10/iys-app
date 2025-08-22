// app/projects/[id]/cuts/new/CreateCutClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ExternalLink } from "lucide-react";

export default function CreateCutClient({
  projectId,
  deliverables,
}: {
  projectId: string;
  deliverables: { id: number; no: number; date: string }[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  const [selected, setSelected] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

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
      toast({ title: "Corte creado" });
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
              {/* Left: D# and date */}
              <div className="min-w-0">
                <div className="font-medium">D{d.no}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(d.date).toLocaleString()}
                </div>
              </div>

              {/* Right: View link + checkbox */}
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

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`deliv-${d.id}`}
                    checked={selected.includes(d.id)}
                    onCheckedChange={() => toggle(d.id)}
                    aria-label={`Agregar D${d.no} al corte`}
                  />
                  <label
                    htmlFor={`deliv-${d.id}`}
                    className="text-sm cursor-pointer select-none"
                  >
                    Agregar
                  </label>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={onCreate} disabled={saving || deliverables.length === 0}>
          {saving ? "Creando…" : "Crear corte"}
        </Button>
      </div>
    </div>
  );
}
