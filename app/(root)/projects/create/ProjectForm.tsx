"use client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuoteItemsPreview from "./QuoteItemsPreview";

type Quote = {
  id: string|number; numero: number; revision: number; clientName: string; itemsCount: number;
};

export default function ProjectForm({
  projectName, onNameChange, selectedQuote, canSubmit, creating, onCreate,
}: {
  projectName: string; onNameChange: (v: string) => void;
  selectedQuote: Quote | null; canSubmit: boolean; creating: boolean;
  onCreate: () => void;
}) {
  return (
    <div>
      <Card>
        <CardHeader><CardTitle>Detalles del Proyecto</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Nombre del Proyecto</Label>
            <Input id="projectName" placeholder="e.g. San Juan de Arama"
              value={projectName} onChange={(e) => onNameChange(e.target.value)} />
          </div>
          <Separator />
          <div className="space-y-1">
            {selectedQuote ? (
              <div className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-2 pb-1">
                  <span className="font-medium">Cotizacion {selectedQuote.numero}</span>
                  <Badge variant="secondary" className="rounded-full">rev {selectedQuote.revision}</Badge>
                  <Badge className="rounded-full">{selectedQuote.itemsCount} items</Badge>
                </div>
                <div className="text-sm text-muted-foreground pb-2">Cliente: {selectedQuote.clientName}</div>

                <QuoteItemsPreview quoteId={selectedQuote.id} />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No ha seleccionado una cotizacion.</div>
            )}
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button onClick={onCreate} disabled={!canSubmit || creating}>
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Crear Proyecto
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
