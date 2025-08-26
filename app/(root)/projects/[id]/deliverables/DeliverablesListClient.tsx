"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, ExternalLink, Search } from "lucide-react";

type Row = {
  id: number;
  no: number;
  date: string;
  createdBy: string | null;
  itemsCount: number;
  totalQty: number;
  preview: { descripcion: string; unidad: string | null; qty: number }[];
};

export default function DeliverablesListClient({
  projectId,
  rows,
}: {
  projectId: string;
  rows: Row[];
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"no_asc" | "date_desc">("no_asc");

  const fmtNum = (n: number) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(n || 0);

  const filtered = useMemo(() => {
    let r = [...rows];
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      r = r.filter((x) =>
        [
          String(x.no),
          new Date(x.date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          ...(x.preview?.map((p) => p.descripcion) ?? []),
        ]
          .join(" ")
          .toLowerCase()
          .includes(t)
      );
    }
    r.sort((a, b) =>
      sort === "no_asc"
        ? a.no - b.no
        : new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return r;
  }, [rows, q, sort]);

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar Acta de Entrega..."
                className="pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">No.</TableHead>
                  <TableHead className="w-40">Fecha</TableHead>
                  <TableHead className="w-28 text-center"># Items</TableHead>
                  <TableHead className="w-40 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-sm text-muted-foreground">
                      No deliverables yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((d) => (
                    <TableRow key={d.id} className="align-top">
                      <TableCell className="font-medium">#{d.no}</TableCell>
                      <TableCell>
                        {new Date(d.date).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {d.createdBy ? (
                          <div className="text-xs text-muted-foreground">by {d.createdBy}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-center">{d.itemsCount}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="outline" size="sm" className="gap-1">
                            <Link href={`/projects/${projectId}/deliverables/${d.id}`}>
                              <ExternalLink className="h-4 w-4" />
                              Ver
                            </Link>
                          </Button>
                          <Button size="sm" className="gap-1" disabled>
                            <Download className="h-4 w-4" />
                            Descargar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
