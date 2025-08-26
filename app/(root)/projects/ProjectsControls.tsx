"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, Search, Settings2 } from "lucide-react";

export type ProjectStatus = "active" | "on_hold" | "completed" | "archived";

interface ProjectsControlsProps {
  query: string;
  onQueryChange: (query: string) => void;
  statusFilters: ProjectStatus[];
  onStatusFiltersChange: (filters: ProjectStatus[]) => void;
  sort: "updated_desc" | "name_asc" | "progress_desc";
  onSortChange: (sort: "updated_desc" | "name_asc" | "progress_desc") => void;
}

export default function ProjectsControls({
  query,
  onQueryChange,
  statusFilters,
  onStatusFiltersChange,
  sort,
  onSortChange,
}: ProjectsControlsProps) {
  return (
    <Card className="mb-4 md:mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar proyectos, clientes, cotizaciones…"
                className="pl-8"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
              />
            </div>
            <StatusFilter 
              value={statusFilters} 
              onChange={onStatusFiltersChange} 
            />
          </div>

          <Tabs
            value={sort}
            onValueChange={(v) => onSortChange(v as any)}
            className="md:justify-end"
          >
            <TabsList>
              <TabsTrigger value="updated_desc" className="gap-1">
                <Settings2 className="h-4 w-4" /> Recientes
              </TabsTrigger>
              <TabsTrigger value="name_asc">A–Z</TabsTrigger>
              <TabsTrigger value="progress_desc">Progreso</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardContent>
    </Card>
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