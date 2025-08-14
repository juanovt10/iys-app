"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type LatestQuote = {
  id: number | string;
  numero: number;
  revision: number;
  clientName: string;
  itemsCount: number;
  createdAt?: string;
};

function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => { const id = setTimeout(() => setV(value), delay); return () => clearTimeout(id); }, [value, delay]);
  return v;
}

export function useLatestQuotes(initialQuery = "", initialSort: "recent"|"client"|"items_desc" = "recent") {
  const supabase = createClient();

  const [quotes, setQuotes] = useState<LatestQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<"recent"|"client"|"items_desc">(initialSort);

  const debounced = useDebounced(query, 250);

  const fetchLatestQuotes = useCallback(async (searchQuery = "") => {
    setLoading(true);

    // Ask for both items_count and items to be safe with your current view
    let q = supabase
      .from("latest_cotizaciones")
      .select("id, numero, revision, cliente, items, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    const trimmed = searchQuery.trim();
    if (trimmed) {
      const n = Number(trimmed);
      q = Number.isNaN(n) ? q.ilike("cliente", `%${trimmed}%`) : q.eq("numero", n);
    }

    const { data, error } = await q;
    setLoading(false);

    if (error) {
      console.error("fetchLatestQuotes error:", error.message);
      setQuotes([]);
      return;
    }

    const mapped: LatestQuote[] = (data ?? []).map((r: any) => {
      // prefer items_count; fallback to items array length if present
      let itemsCount =
        r.items_count != null ? Number(r.items_count) :
        Array.isArray(r.items) ? r.items.length :
        typeof r.items === "string" ? (() => { try { const arr = JSON.parse(r.items); return Array.isArray(arr) ? arr.length : 0; } catch { return 0; } })() :
        0;

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
  }, [supabase]);

  useEffect(() => { fetchLatestQuotes(debounced); }, [fetchLatestQuotes, debounced]);

  const sorted = useMemo(() => {
    const rows = [...quotes];
    rows.sort((a, b) => {
      if (sort === "client") return a.clientName.localeCompare(b.clientName);
      if (sort === "items_desc") return b.itemsCount - a.itemsCount;
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
    return rows;
  }, [quotes, sort]);

  return { quotes: sorted, loading, query, setQuery, sort, setSort };
}
