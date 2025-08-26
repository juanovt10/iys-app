"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, FileText, Scissors } from "lucide-react";

export type ProjectStatus = "active" | "on_hold" | "completed" | "archived";

export type ProjectRow = {
  id: string;
  name: string;
  status: ProjectStatus;
  clientName: string;
  quoteId: string;
  activeRevision: number;
  deliverablesCount: number;
  cutsCount: number;
  deliveredPercent: number;
  updatedAt: string;
  hasFinalDeliverable: boolean;
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

const statusBadge = (status: ProjectStatus) => {
  const map: Record<ProjectStatus, { label: string; className: string }> = {
    active: { label: "Activo",    className: "bg-emerald-500/15 text-emerald-600" },
    on_hold:{ label: "En Pausa",   className: "bg-amber-500/15 text-amber-600" },
    completed:{label:"Completado", className: "bg-blue-500/15 text-blue-600" },
    archived:{ label:"Archivado",  className: "bg-slate-500/15 text-slate-600" },
  };
  const { label, className } = map[status];
  return <Badge className={`rounded-full px-2.5 py-1 text-xs ${className}`}>{label}</Badge>;
};

interface ProjectsTableProps {
  projects: ProjectRow[];
  onArchiveProject?: (projectId: string) => void;
}

export default function ProjectsTable({ 
  projects, 
  onArchiveProject 
}: ProjectsTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[28%]">Proyecto</TableHead>
              <TableHead className="w-[18%]">Cliente</TableHead>
              <TableHead className="w-[12%]">Cotizacion</TableHead>
              <TableHead className="w-[14%]">Progreso</TableHead>
              <TableHead className="w-[12%]"># Actas de Entrega</TableHead>
              <TableHead className="w-[10%]"># Cortes</TableHead>
              <TableHead className="w-[10%]">Actualizado</TableHead>
              <TableHead className="w-[6%] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <ProjectTableRow 
                key={project.id} 
                project={project}
                onArchive={() => onArchiveProject?.(project.id)}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ProjectTableRow({ 
  project, 
  onArchive 
}: { 
  project: ProjectRow;
  onArchive: () => void;
}) {
  return (
    <TableRow className="hover:bg-muted/40">
      <TableCell className="cursor-pointer hover:bg-muted/60 transition-colors">
        <Link href={`/projects/${project.id}`} className="block">
          <div className="flex min-w-0 items-center gap-2">
            {statusBadge(project.status)}
            <div className="min-w-0">
              <div className="truncate font-medium leading-tight">
                {project.name}
              </div>
              <div className="text-xs text-muted-foreground">
                ID: {project.id}
              </div>
            </div>
          </div>
        </Link>
      </TableCell>
      <TableCell className="truncate">{project.clientName}</TableCell>
      <TableCell>
        <div className="text-sm">{project.quoteId}</div>
        <div className="text-xs text-muted-foreground">
          rev{project.activeRevision}
        </div>
      </TableCell>
      <TableCell className="align-middle">
        <div className="flex items-center gap-2">
          <Progress
            value={project.deliveredPercent}
            className="h-2 w-28"
          />
          <span className="w-10 text-right text-sm tabular-nums">
            {project.deliveredPercent}%
          </span>
        </div>
      </TableCell>
      <TableCell>{project.deliverablesCount}</TableCell>
      <TableCell>{project.cutsCount}</TableCell>
      <TableCell className="whitespace-nowrap">
        {formatDate(project.updatedAt)}
      </TableCell>
      <TableCell className="text-right">
        <RowActions projectId={project.id} hasFinalDeliverable={project.hasFinalDeliverable} />
      </TableCell>
    </TableRow>
  );
}

function RowActions({ projectId, hasFinalDeliverable }: { projectId: string; hasFinalDeliverable: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild disabled={hasFinalDeliverable}>
          <Link href={`/projects/${projectId}/deliverables/new`} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Crear Acta de Entrega
            {hasFinalDeliverable && <span className="ml-auto text-xs text-muted-foreground">(Final creada)</span>}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/projects/${projectId}/cuts/new`} className="flex items-center gap-2">
            <Scissors className="h-4 w-4" />
            Crear Corte
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
