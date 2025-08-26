"use client";
import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useLatestQuotes } from "@/hooks/useLatestQuotes";
import { createClient } from "@/lib/supabase/client";
import QuotePicker from "./QuotePicker";
import ProjectForm from "./ProjectForm";

export default function CreateProjectClient({
  initialQuery = "",
  initialSort = "recent",
}: {
  initialQuery?: string;
  initialSort?: "recent" | "client" | "items_desc";
}) {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { quotes, loading, query, setQuery, sort, setSort } =
    useLatestQuotes(initialQuery);
  const [selectedQuoteId, setSelectedQuoteId] = useState<
    number | string | null
  >(null);
  const [projectName, setProjectName] = useState("");
  const [creating, setCreating] = useState(false);

  // keep URL in sync (nice for shareable searches)
  function updateURL(q: string, s: string) {
    const sp = new URLSearchParams(searchParams.toString());
    q ? sp.set("q", q) : sp.delete("q");
    s ? sp.set("sort", s) : sp.delete("sort");
    router.replace(`${pathname}?${sp.toString()}`);
  }

  const canSubmit =
    projectName.trim().length > 2 && selectedQuoteId !== null && !loading;

  async function handleCreate() {
    const selected = quotes.find((q) => q.id === selectedQuoteId);
    if (!selected || !projectName.trim()) return;
    try {
      setCreating(true);
      const { error } = await supabase.from("proyectos").insert({
        name: projectName.trim(),
        status: "active",
        cotizacion_id: Number(selected.id),
      });
      if (error) throw error;
      
      // Add a small delay to ensure the database transaction is committed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force a hard refresh to ensure we get the latest data
      window.location.href = "/projects";
    } catch (e: any) {
      console.error("Create project failed:", e?.message || e);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1300px] p-4 md:p-6">
      {/* Page header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Crear Proyecto
        </h1>
        <p className="text-sm text-muted-foreground">
          Seleccione la cotizacion en la que se basará este proyecto y proporcionele un nombre.
        </p>
      </div>

      {/* Two-column layout */}
      <div
        className="
        grid gap-4
        md:grid-cols-[360px_1fr]
        lg:grid-cols-[420px_1fr]
        xl:grid-cols-[480px_1fr]
      "
      >
        <QuotePicker
          quotes={quotes}
          loading={loading}
          query={query}
          sort={sort}
          onQueryChange={(q) => {
            setQuery(q);
            updateURL(q, sort);
          }}
          onSortChange={(s) => {
            setSort(s);
            updateURL(query, s);
          }}
          selectedId={selectedQuoteId}
          onSelect={setSelectedQuoteId}
        />
        <ProjectForm
          projectName={projectName}
          onNameChange={setProjectName}
          selectedQuote={quotes.find((q) => q.id === selectedQuoteId) || null}
          canSubmit={canSubmit}
          creating={creating}
          onCreate={handleCreate}
        />
      </div>
    </div>
  );
}
