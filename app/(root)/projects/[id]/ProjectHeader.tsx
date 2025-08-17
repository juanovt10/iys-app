"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilePlus2, Receipt } from "lucide-react";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import type { ProjectStatus, ProjectSummary } from "@/types";

export default function ProjectHeader({
  project,
  saving,
  onChangeStatus,
}: {
  project: ProjectSummary;
  saving?: boolean;
  onChangeStatus: (next: ProjectStatus) => void;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {project.name}
        </h1>
        <div className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
          <span>
            Client: <span className="font-medium">{project.clientName}</span>
          </span>
          <span>·</span>
          <span>
            Quote {project.quoteNumero}{" "}
            <span className="text-muted-foreground">rev {project.revisionShown}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge className="rounded-full">{project.status.replace("_", " ")}</Badge>

        <Select
          value={project.status}
          onValueChange={(v) => onChangeStatus(v as ProjectStatus)}
          disabled={!!saving}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">active</SelectItem>
            <SelectItem value="on_hold">on hold</SelectItem>
            <SelectItem value="completed">completed</SelectItem>
            <SelectItem value="archived">archived</SelectItem>
          </SelectContent>
        </Select>

        <Button asChild variant="outline" className="gap-2">
          <Link href={`/projects/${project.id}/deliverables/new`}>
            <FilePlus2 className="h-4 w-4" /> New Deliverable
          </Link>
        </Button>

        <Button asChild className="gap-2">
          <Link href={`/projects/${project.id}/cuts/new`}>
            <Receipt className="h-4 w-4" /> New Cut
          </Link>
        </Button>
      </div>
    </div>
  );
}
