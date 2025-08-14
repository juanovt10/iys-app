'use client'

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type LatestQuote = {
  id: string | number;
  numero: number;
  revision: number;
  clientId?: string | number;
  clientName: string;
  itemsCount: number;
  createdAt?: string;
};

export default function ProjectCreatePage() {
  const supabase = createClient();
  const [quotes, setQuotes] = useState<LatestQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | number | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "client" | "items_desc">("recent");
  const [creating, setCreating] = useState(false);

  const fetchLatestQuotes = useCallback(async (searchQuery: string = ""): Promise<void> => {
    setLoading(true);
    let q = supabase
      .from("latest_cotizaciones")
      .select("id, numero, revision, cliente, items, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    const trimmed = searchQuery.trim();
    if (trimmed) {
      const asNumber = Number(trimmed);
      if (!Number.isNaN(asNumber)) {
        q = q.eq("numero", asNumber);
      } else {
        q = q.ilike("cliente", `%${trimmed}%`);
      }
    }

    const { data, error } = await q;

    if (error) {
      console.error("Error fetching quotes:", error.message);
      setQuotes([]);
      setLoading(false);
      return;
    }

    const mapped: LatestQuote[] = (data ?? []).map((r: any) => {
      let itemsCount = 0;
      if (Array.isArray(r.items)) {
        itemsCount = r.items.length;
      } else if (typeof r.items === "string") {
        try {
          const arr = JSON.parse(r.items);
          if (Array.isArray(arr)) itemsCount = arr.length;
        } catch {}
      } else if (r.items_count != null) {
        itemsCount = Number(r.items_count) || 0;
      }

      return {
        id: r.id,
        numero: Number(r.numero),
        revision: Number(r.revision),
        clientName: r.cliente ?? r.client_name ?? "",
        itemsCount,
        createdAt: r.created_at,
      };
    });

    setQuotes(mapped);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const id = setTimeout(() => {
      fetchLatestQuotes(query);
    }, 250);
    return () => clearTimeout(id);
  }, [fetchLatestQuotes, query]);

  const filtered = useMemo(() => {
    const rows = [...quotes];
    rows.sort((a, b) => {
      switch (sort) {
        case "client":
          return a.clientName.localeCompare(b.clientName);
        case "items_desc":
          return b.itemsCount - a.itemsCount;
        default:
          return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      }
    });
    return rows;
  }, [quotes, sort]);

  const selected = filtered.find((q) => q.id === selectedQuoteId);
  const canSubmit = projectName.trim().length > 2 && selectedQuoteId !== null && !loading;

  const handleCreate = async () => {
    if (!selected || !projectName.trim()) return;
    try {
      setCreating(true);
      const { error } = await supabase.from('proyectos').insert({
        name: projectName.trim(),
        status: 'active',
        cotizacion_id: Number(selected.id),
      });
      if (error) throw error;
      window.location.href = '/projects';
    } catch (e: any) {
      console.error('Failed to create project:', e?.message || e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-[1200px] gap-4 p-4 md:grid-cols-[1fr_380px] md:p-6">
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Create Project</h1>
            <p className="text-sm text-muted-foreground">Choose the <b>latest revision</b> of a quote, then name your project.</p>
          </div>
        </div>

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-sm">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by client or quote number…"
                  className="pl-8"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); }}
                />
              </div>

              <Tabs value={sort} onValueChange={(v) => setSort(v as any)}>
                <TabsList>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                  <TabsTrigger value="client">Client A–Z</TabsTrigger>
                  <TabsTrigger value="items_desc">Items</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Latest quotes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[56vh]">
              <ul className="divide-y">
                {loading ? (
                  <li className="flex items-center justify-center py-16 text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading quotes…
                  </li>
                ) : filtered.length === 0 ? (
                  <li className="py-16 text-center text-sm text-muted-foreground">No quotes found.</li>
                ) : (
                  filtered.map((q) => (
                    <li key={q.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedQuoteId(q.id)}
                        className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-muted/60 ${
                          selectedQuoteId === q.id ? "bg-muted" : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Quote {q.numero}</span>
                            <Badge variant="secondary" className="rounded-full">rev {q.revision}</Badge>
                            <Badge className="rounded-full">{q.itemsCount} items</Badge>
                          </div>
                          <div className="truncate text-sm text-muted-foreground">{q.clientName}</div>
                        </div>
                        {selectedQuoteId === q.id ? (
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

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Project details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project name</Label>
              <Input
                id="projectName"
                placeholder="e.g. Autopista Norte Signalization"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>

            <Separator />

            <div className="space-y-1">
              <div className="text-sm font-medium">Selected quote</div>
              {selected ? (
                <div className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">Quote {selected.numero}</span>
                    <Badge variant="secondary" className="rounded-full">rev {selected.revision}</Badge>
                    <Badge className="rounded-full">{selected.itemsCount} items</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{selected.clientName}</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No quote selected yet.</div>
              )}
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <div className="text-xs text-muted-foreground">You can change the active quote revision later from the project page.</div>
            <Button onClick={handleCreate} disabled={!canSubmit || creating}>
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create project
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
