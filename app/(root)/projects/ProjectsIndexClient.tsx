"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, MoreHorizontal, Plus, RefreshCw, Search, Settings2 } from "lucide-react";

export type ProjectStatus = "active" | "on_hold" | "completed" | "archived";

export type ProjectRow = {
  id: string;
  name: string;
  clientName: string;
  quoteId: string;
  activeRevision: number;
  status: ProjectStatus;
  deliverablesCount: number;
  cutsCount: number;
  deliveredPercent: number; // 0-100
  updatedAt: string; // ISO
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

const statusBadge = (status: ProjectStatus) => {
  const map: Record<ProjectStatus, { label: string; className: string }> = {
    active: { label: "Active",    className: "bg-emerald-500/15 text-emerald-600" },
    on_hold:{ label: "On hold",   className: "bg-amber-500/15 text-amber-600" },
    completed:{label:"Completed", className: "bg-blue-500/15 text-blue-600" },
    archived:{ label:"Archived",  className: "bg-slate-500/15 text-slate-600" },
  };
  const { label, className } = map[status];
  return <Badge className={`rounded-full px-2.5 py-1 text-xs ${className}`}>{label}</Badge>;
};

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

  return (
    <div className="mx-auto max-w-[1200px] p-4 md:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Projects
          </h1>
          <p className="text-sm text-muted-foreground">
            Create and manage project execution linked to quotes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button asChild className="gap-2">
            <Link href="/projects/create">
              <Plus className="h-4 w-4" /> New Project
            </Link>
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card className="mb-4 md:mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative w-full md:max-w-sm">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search projects, clients, quotes…"
                  className="pl-8"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <StatusFilter value={statusFilters} onChange={setStatusFilters} />
            </div>

            <Tabs
              value={sort}
              onValueChange={(v) => setSort(v as any)}
              className="md:justify-end"
            >
              <TabsList>
                <TabsTrigger value="updated_desc" className="gap-1">
                  <Settings2 className="h-4 w-4" /> Recent
                </TabsTrigger>
                <TabsTrigger value="name_asc">A–Z</TabsTrigger>
                <TabsTrigger value="progress_desc">Progress</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {empty ? (
        <EmptyState />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[28%]">Project</TableHead>
                  <TableHead className="w-[18%]">Client</TableHead>
                  <TableHead className="w-[12%]">Quote / Rev</TableHead>
                  <TableHead className="w-[14%]">Progress</TableHead>
                  <TableHead className="w-[12%]"># Deliverables</TableHead>
                  <TableHead className="w-[10%]"># Cuts</TableHead>
                  <TableHead className="w-[10%]">Updated</TableHead>
                  <TableHead className="w-[6%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-2">
                        {statusBadge(p.status)}
                        <div className="min-w-0">
                          <Link
                            href={`/projects/${p.id}`}
                            className="truncate font-medium leading-tight hover:underline"
                          >
                            {p.name}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            ID: {p.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="truncate">{p.clientName}</TableCell>
                    <TableCell>
                      <div className="text-sm">{p.quoteId}</div>
                      <div className="text-xs text-muted-foreground">
                        rev {p.activeRevision}
                      </div>
                    </TableCell>
                    <TableCell className="align-middle">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={p.deliveredPercent}
                          className="h-2 w-28"
                        />
                        <span className="w-10 text-right text-sm tabular-nums">
                          {p.deliveredPercent}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{p.deliverablesCount}</TableCell>
                    <TableCell>{p.cutsCount}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(p.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <RowActions projectId={p.id} onArchive={() => onArchiveProject?.(p.id)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusFilter({
  value, onChange,
}: {
  value: ProjectStatus[];
  onChange: (v: ProjectStatus[]) => void;
}) {
  const all: ProjectStatus[] = ["active", "on_hold", "completed", "archived"];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          Status <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {all.map((st) => (
          <DropdownMenuCheckboxItem
            key={st}
            checked={value.includes(st)}
            onCheckedChange={(v) =>
              onChange(v ? [...value, st] : value.filter((p) => p !== st))
            }
          >
            {st.replace("_", " ")}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


function RowActions({ projectId, onArchive }: { projectId: string; onArchive?: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/projects/${projectId}`}>Open</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onArchive?.()}>Archive</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
