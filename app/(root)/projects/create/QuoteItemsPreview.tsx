"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

type QuoteItem = {
  descripcion: string;
  unidad?: string | null;
  precio_unidad?: number | string | null;
  cantidad?: number | string | null;
  categoria?: string | null;
};

export default function QuoteItemsPreview({ quoteId }: { quoteId: string | number | null }) {
  const supabase = createClient();
  const [items, setItems] = useState<QuoteItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchItems() {
      if (!quoteId) { setItems(null); return; }
      setLoading(true);
      setErr(null);
      const { data, error } = await supabase
        .from("cotizaciones")                  // latest_cotizaciones id == cotizaciones.id
        .select("items")
        .eq("id", quoteId)
        .single();

      if (!isMounted) return;
      setLoading(false);

      if (error) {
        setErr(error.message);
        setItems(null);
        return;
      }

      const raw = (data as any)?.items;
      let arr: any[] = [];
      if (Array.isArray(raw)) arr = raw;
      else if (typeof raw === "string") {
        try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) arr = parsed; } catch {}
      }

      setItems(arr as QuoteItem[]);
    }
    fetchItems();
    return () => { isMounted = false; };
  }, [quoteId, supabase]);

  if (!quoteId) {
    return <div className="text-sm text-muted-foreground">Select a quote to preview its items.</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading items…
      </div>
    );
  }

  if (err) {
    return <div className="text-sm text-destructive">Could not load items: {err}</div>;
  }

  if (!items || items.length === 0) {
    return <div className="text-sm text-muted-foreground">No items found in this quote.</div>;
  }

  const safeNum = (v: any) => (v == null ? 0 : typeof v === "number" ? v : Number(v) || 0);

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-md border">
        {/* Simple table (no shadcn import needed) */}
        <div className="max-h-64 overflow-auto"> {/* ~256px scroll area */}
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/60 backdrop-blur">
              <tr className="text-left">
                <th className="px-3 py-2 w-10">#</th>
                <th className="px-3 py-2">Descripción</th>
                <th className="px-3 py-2 text-right">Unidad</th>
                <th className="px-3 py-2 text-right">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => {
                const qty = safeNum(it.cantidad);
                return (
                  <tr key={idx} className="border-t">
                    <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{it.descripcion}</div>
                    </td>
                    <td className="px-3 py-2">{it.unidad ?? "-"}</td>
                    <td className="px-3 py-2 text-right">{qty}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
