"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import ProjectsHeader from "./ProjectsHeader";
import ProjectsControls, { ProjectStatus } from "./ProjectsControls";
import ProjectsTable, { ProjectRow } from "./ProjectsTable";

// tiny debounce
function useDebounced<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const id = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(id); }, [value, delay]);
  return debounced;
}

export default function ProjectsIndexClient({
  projects,
  onOpenProject,
  onArchiveProject,
}: {
  projects: ProjectRow[];
  onOpenProject?: (projectId: string) => void;
  onArchiveProject?: (projectId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<ProjectStatus[]>(["active"]);
  const [sort, setSort] = useState<"updated_desc" | "name_asc" | "progress_desc">("updated_desc");
  const debounced = useDebounced(query);

  const filtered = useMemo(() => {
    let rows = [...projects];

    if (debounced.trim()) {
      const q = debounced.trim().toLowerCase();
      rows = rows.filter((r) =>
        [r.name, r.clientName, r.quoteId].some((f) => f.toLowerCase().includes(q))
      );
    }

    if (statusFilters.length) {
      rows = rows.filter((r) => statusFilters.includes(r.status));
    }

    rows.sort((a, b) => {
      switch (sort) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "progress_desc":
          return b.deliveredPercent - a.deliveredPercent;
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return rows;
  }, [projects, debounced, statusFilters, sort]);

  const empty = filtered.length === 0;
  const hasProgressData = projects.some(p => p.deliveredPercent > 0);

  return (
    <div className="mx-auto max-w-[1200px] p-4 md:p-6">
      <ProjectsHeader />
      
      <ProjectsControls
        query={query}
        onQueryChange={setQuery}
        statusFilters={statusFilters}
        onStatusFiltersChange={setStatusFilters}
        sort={sort}
        onSortChange={setSort}
      />

      {/* Progress calculation status */}
      {projects.length > 0 && !hasProgressData && (
        <div className="mb-4 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
            Calculando progreso de proyectos... Los porcentajes se mostrarán en breve.
          </div>
        </div>
      )}

      {empty ? (
        <EmptyState />
      ) : (
        <ProjectsTable 
          projects={filtered}
          onArchiveProject={onArchiveProject}
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="rounded-2xl bg-muted p-4">
          <Plus className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">No projects yet</h3>
          <p className="text-sm text-muted-foreground">
            Create your first project by linking it to an approved quote.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/projects/create">
            <Plus className="h-4 w-4" /> Create Project
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
