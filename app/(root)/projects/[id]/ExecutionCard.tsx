// app/projects/[id]/_components/ExecutionPanel.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type DeliverableCol = { id: number; no: number; date: string };
type ExecRow = {
  key: string;
  descripcion: string;
  unidad: string | null;
  contracted: number;
  executedTotal: number;
  remaining: number;
  extraQty: number;
  perDeliverable: Record<number, number>;
};

export default function ExecutionPanel({
  progressPct,
  deliverables,
  rows,
}: {
  progressPct: number;
  deliverables: DeliverableCol[];
  rows: ExecRow[];
}) {
  const fmt = (n: number | undefined | null) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(n || 0);

  // Check if any row has extra quantities
  const hasExtraQuantities = rows.some(r => r.extraQty > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ejecución</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Overall progress */}
        <div className="flex items-center gap-3">
          <Progress value={progressPct} className="h-2 flex-1" />
          <span className="w-12 text-right text-sm tabular-nums">{progressPct}%</span>
        </div>

        {/* Items x Deliverables table */}
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[380px]">Descripción</TableHead>
                <TableHead className="w-20 text-center">Unidad</TableHead>
                <TableHead className="w-28 text-center">Contratado</TableHead>
                <TableHead className="w-28 text-center">Ejecutado</TableHead>
                <TableHead className="w-28 text-center">Restante</TableHead>
                {hasExtraQuantities && (
                  <TableHead className="w-28 text-center">Cantidades Mayores</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hasExtraQuantities ? 6 : 5} className="text-sm text-muted-foreground">
                    No items in scope.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.key} className={r.extraQty > 0 ? "bg-blue-50" : ""}>
                    <TableCell>{r.descripcion}</TableCell>
                    <TableCell className="text-center">{r.unidad ?? ""}</TableCell>
                    <TableCell className="text-center tabular-nums">{fmt(r.contracted)}</TableCell>
                    <TableCell className="text-center tabular-nums">{fmt(r.executedTotal)}</TableCell>
                    <TableCell className="text-center tabular-nums">{fmt(r.remaining)}</TableCell>
                    {hasExtraQuantities && (
                      <TableCell className="text-center tabular-nums">
                        {r.extraQty > 0 ? fmt(r.extraQty) : ""}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
