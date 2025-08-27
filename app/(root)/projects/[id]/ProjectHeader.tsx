"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Scissors } from "lucide-react";
import type { ProjectSummary } from "@/types";

export default function ProjectHeader({
  project,
}: {
  project: ProjectSummary;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {project.name}
        </h1>
        <div className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
          <span>
            Cliente: <span className="font-medium">{project.clientName}</span>
          </span>
          <span>·</span>
          <span>
            Cotizacion {project.quoteNumero}{" "}
            <span className="text-muted-foreground">rev{project.revisionShown}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge className="rounded-full">
          {project.status === "active" && "Activo"}
          {project.status === "on_hold" && "En Pausa"}
          {project.status === "completed" && "Completado"}
          {project.status === "archived" && "Archivado"}
          {/* Debug: Show actual status value */}
          {!["active", "on_hold", "completed", "archived"].includes(project.status) && project.status}
        </Badge>

        {project.hasFinalDeliverable ? (
          <Button variant="outline" className="gap-2" disabled>
            <FileText className="h-4 w-4" /> 
            Acta Final Creada
          </Button>
        ) : (
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/projects/${project.id}/deliverables/new`}>
              <FileText className="h-4 w-4" /> 
              Nueva Acta de Entrega
            </Link>
          </Button>
        )}

        <Button asChild className="gap-2">
          <Link href={`/projects/${project.id}/cuts/new`}>
            <Scissors className="h-4 w-4" /> Nuevo Corte
          </Link>
        </Button>
      </div>
    </div>
  );
}
