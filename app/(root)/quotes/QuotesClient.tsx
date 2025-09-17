'use client'

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Quote } from "@/types/index";
import QuoteCard from "@/components/QuoteCard";
import { useDebounce } from "@/hooks/useDebounce";

export default function QuotesClient() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [search, setSearch] = useState<string>("");

  const supabase = createClient();
  const debounceSearch = useDebounce(search, 500);

  const fetchLatestQuotes = useCallback(
    async (searchQuery: string = ""): Promise<void> => {
      let q = supabase
        .from("latest_cotizaciones")
        .select("id, numero, revision, cliente, items, created_at, remarks")
        .order("created_at", { ascending: false })
        .limit(20);

      const trimmed = searchQuery.trim();

      if (trimmed) {
        const num = Number(trimmed);
        if (Number.isFinite(num)) {
          q = q.or(`numero.eq.${num},cliente.ilike.%${trimmed}%`);
        } else {
          q = q.ilike("cliente", `%${trimmed}%`);
        }
      }

      const { data, error } = await q;

      if (error) {
        console.error("Error fetching quotes:", error.message);
        setQuotes([]);
        return;
      }

      setQuotes((data ?? []) as Quote[]);
    },
    [supabase]
  );

  useEffect(() => {
    fetchLatestQuotes(debounceSearch);
  }, [debounceSearch, fetchLatestQuotes]);

  return (
    <div className="flex flex-col gap-4 p-5 w-full">
      <h1 className="text-2xl font-extrabold">Cotizaciones</h1>
      <div className="flex flex-col gap-4">
        <Link href={"/quotes/create"} passHref>
          <Button className="w-full bg-companyGradient border border-gray-200 rounded-md shadow">
            Crear Cotizacion
          </Button>
        </Link>

        <Input
          type="text"
          placeholder="Buscar por cliente o número de cotización"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-md shadow"
        />

        <div className="space-y-4 pb-10">
          {quotes.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))}
        </div>
      </div>
    </div>
  );
}
