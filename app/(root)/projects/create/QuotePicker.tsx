"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { ProjectQuote } from "@/types";

export default function QuotePicker({
  quotes, loading, query, sort, onQueryChange, onSortChange, selectedId, onSelect,
}: {
  quotes: ProjectQuote[]; loading: boolean;
  query: string; sort: "recent"|"client"|"items_desc";
  onQueryChange: (q: string) => void; onSortChange: (s: "recent"|"client"|"items_desc") => void;
  selectedId: string|number|null; onSelect: (id: string|number) => void;
}) {
  return (
    <div>
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente o cotizacion…"
                className="pl-8"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
              />
            </div>
            <Tabs value={sort} onValueChange={(v) => onSortChange(v as any)}>
              <TabsList>
                <TabsTrigger value="recent">Recientes</TabsTrigger>
                <TabsTrigger value="client">Cliente A–Z</TabsTrigger>
                <TabsTrigger value="items_desc">Items</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-base font-medium">Cotizaciones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[56vh]">
            <ul className="divide-y">
              {loading ? (
                <li className="flex items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando cotizaciones…
                </li>
              ) : quotes.length === 0 ? (
                <li className="py-16 text-center text-sm text-muted-foreground">No encontramos ninguna cotizacion.</li>
              ) : (
                quotes.map((q) => (
                  <li key={q.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(q.id)}
                      className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-muted/60 ${
                        selectedId === q.id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 pb-1">
                          <span className="font-medium">Cotizacion {q.numero}</span>
                          <Badge variant="secondary" className="rounded-full">rev {q.revision}</Badge>
                          <Badge className="rounded-full">{q.itemsCount} items</Badge>
                        </div>
                        <div className="truncate text-sm text-muted-foreground">{q.clientName}</div>
                      </div>
                      {selectedId === q.id ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
