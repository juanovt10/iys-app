'use client'

import React from "react";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, Filter, MoreHorizontal, Plus, RefreshCw, Search, Settings2 } from "lucide-react";
import Link from "next/link";

// Types
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
  updatedAt: string; // ISO string
};

// Utilities
const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

const statusBadge = (status: ProjectStatus) => {
  const map: Record<ProjectStatus, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-emerald-500/15 text-emerald-600" },
    on_hold: { label: "On hold", className: "bg-amber-500/15 text-amber-600" },
    completed: { label: "Completed", className: "bg-blue-500/15 text-blue-600" },
    archived: { label: "Archived", className: "bg-slate-500/15 text-slate-600" },
  };
  const { label, className } = map[status];
  return <Badge className={`rounded-full px-2.5 py-1 text-xs ${className}`}>{label}</Badge>;
};

// Mock data (replace with API fetch)
const MOCK: ProjectRow[] = [
  {
    id: "p_001",
    name: "Airport Ring Road Signage",
    clientName: "Concesiones Bogotá",
    quoteId: "Q-100",
    activeRevision: 3,
    status: "active",
    deliverablesCount: 7,
    cutsCount: 2,
    deliveredPercent: 42,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "p_002",
    name: "Autopista Norte Markers",
    clientName: "IDU",
    quoteId: "Q-104",
    activeRevision: 1,
    status: "on_hold",
    deliverablesCount: 3,
    cutsCount: 1,
    deliveredPercent: 18,
    updatedAt: new Date(Date.now() - 1000*60*60*24*2).toISOString(),
  },
  {
    id: "p_003",
    name: "Carretera Medellín–Bogotá Wayfinding",
    clientName: "Invías",
    quoteId: "Q-099",
    activeRevision: 2,
    status: "active",
    deliverablesCount: 11,
    cutsCount: 4,
    deliveredPercent: 77,
    updatedAt: new Date(Date.now() - 1000*60*60*8).toISOString(),
  },
  {
    id: "p_004",
    name: "Parque Industrial La Dorada",
    clientName: "Constructora Andina",
    quoteId: "Q-097",
    activeRevision: 4,
    status: "completed",
    deliverablesCount: 16,
    cutsCount: 5,
    deliveredPercent: 100,
    updatedAt: new Date(Date.now() - 1000*60*60*24*30).toISOString(),
  },
];

// Debounce hook for search
function useDebounced<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// Main component
export default function ProjectsIndex({
  projects = MOCK,
  onCreateProject,
  onOpenProject,
  onArchiveProject,
}: {
  projects?: ProjectRow[];
  onCreateProject?: () => void;
  onOpenProject?: (projectId: string) => void;
  onArchiveProject?: (projectId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<ProjectStatus[]>(["active"]);
  const [sort, setSort] = useState<"updated_desc" | "name_asc" | "progress_desc">("updated_desc");
  const debounced = useDebounced(query);

  const filtered = useMemo(() => {
    let rows = [...projects];

    // Search
    if (debounced.trim()) {
      const q = debounced.trim().toLowerCase();
      rows = rows.filter((r) =>
        [r.name, r.clientName, r.quoteId].some((f) => f.toLowerCase().includes(q))
      );
    }

    // Status filters
    if (statusFilters.length) {
      rows = rows.filter((r) => statusFilters.includes(r.status));
    }

    // Sort
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
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Projects</h1>
          <p className="text-sm text-muted-foreground">Create and manage project execution linked to quotes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button className="gap-2" onClick={onCreateProject}>
            <Link
              href={'/projects/create'}
            >
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" /> Status <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(["active", "on_hold", "completed", "archived"] as ProjectStatus[]).map((st) => (
                    <DropdownMenuCheckboxItem
                      key={st}
                      checked={statusFilters.includes(st)}
                      onCheckedChange={(v) =>
                        setStatusFilters((prev) => (v ? [...prev, st] : prev.filter((p) => p !== st)))
                      }
                    >
                      {st.replace("_", " ")}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Tabs value={sort} onValueChange={(v) => setSort(v as any)} className="md:justify-end">
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
        <EmptyState onCreateProject={onCreateProject} />
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">All Projects</CardTitle>
          </CardHeader>
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
                          <div className="truncate font-medium leading-tight">{p.name}</div>
                          <div className="text-xs text-muted-foreground">ID: {p.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="truncate">{p.clientName}</TableCell>
                    <TableCell>
                      <div className="text-sm">{p.quoteId}</div>
                      <div className="text-xs text-muted-foreground">rev {p.activeRevision}</div>
                    </TableCell>
                    <TableCell className="align-middle">
                      <div className="flex items-center gap-2">
                        <Progress value={p.deliveredPercent} className="h-2 w-28" />
                        <span className="w-10 text-right text-sm tabular-nums">{p.deliveredPercent}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{p.deliverablesCount}</TableCell>
                    <TableCell>{p.cutsCount}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(p.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <RowActions
                        onOpen={() => onOpenProject?.(p.id)}
                        onArchive={() => onArchiveProject?.(p.id)}
                      />
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

function RowActions({ onOpen, onArchive }: { onOpen?: () => void; onArchive?: () => void }) {
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
        <DropdownMenuCheckboxItem checked onCheckedChange={() => onOpen?.()}>Open</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem onCheckedChange={() => onArchive?.()}>Archive</DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyState({ onCreateProject }: { onCreateProject?: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="rounded-2xl bg-muted p-4">
          <Plus className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">No projects yet</h3>
          <p className="text-sm text-muted-foreground">Create your first project by linking it to an approved quote.</p>
        </div>
        <Button className="gap-2" onClick={onCreateProject}>
          <Plus className="h-4 w-4" /> Create Project
        </Button>
      </CardContent>
    </Card>
  );
}
