"use client";
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import React from 'react'
import { useSessionRole } from '@/components/themes.provider';

const ProjectsHeader = () => {
  const { role } = useSessionRole();
  return (
    <div className="mb-5 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Proyectos
        </h1>
        <p className="text-sm text-muted-foreground">
          Crear y gestiona la execucion de proyectos
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-4 w-4" /> Refrescar
        </Button>
        {role !== 'site_manager' && (
          <Button asChild className="gap-2">
            <Link href="/projects/create">
              <Plus className="h-4 w-4" /> Crear Proyecto
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export default ProjectsHeader