// app/projects/[id]/deliverables/new/DeliverableItemsTable.tsx
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NumericFormat } from "react-number-format";

export type DeliverableRow = {
  itemId: number | null;
  descripcion: string;
  unidad: string | null;
  contracted: number;
  executedSoFar: number;
  remaining: number;
  qty: number;
  extraQty: number; // New field for quantities exceeding contracted
  error?: string;
};

export default function DeliverableItemsTable({
  rows,
  onQtyChange,
}: {
  rows: DeliverableRow[];
  onQtyChange: (index: number, nextQty: number) => void;
}) {
  if (!rows.length) return null;

  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(n || 0);

  // Check if any row has existing extra quantities from previous deliverables
  const hasExtraQuantities = rows.some(r => {
    const existingExtra = Math.max(0, r.executedSoFar - r.contracted);
    return existingExtra > 0;
  });

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">#</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="w-24 text-center">Unidad</TableHead>
            <TableHead className="w-28 text-center">Contratado</TableHead>
            <TableHead className="w-28 text-center">
              Ejecutado<br/><span className="text-[10px] text-muted-foreground">hasta hoy</span>
            </TableHead>
            <TableHead className="w-28 text-center">Restante</TableHead>
            {hasExtraQuantities && (
              <TableHead className="w-40 text-center">Cantidades Mayores</TableHead>
            )}
            <TableHead className="w-40 text-center">Ejecutado (nuevo)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, index) => {
            const rowNo = rows.length - index;
            const overBy = Math.max(0, r.qty - r.remaining);
            const hasExtra = overBy > 0;
            const existingExtra = Math.max(0, r.executedSoFar - r.contracted);
            
            return (
              <TableRow key={`${r.itemId ?? "x"}-${index}`} className={hasExtra ? "bg-blue-50" : ""}>
                <TableCell className="text-center font-medium">{rowNo}</TableCell>
                <TableCell>
                  <div className="max-w-[800px] whitespace-pre-wrap">{r.descripcion}</div>
                </TableCell>
                <TableCell className="text-center">{r.unidad ?? ""}</TableCell>
                <TableCell className="text-center tabular-nums">{fmt(r.contracted)}</TableCell>
                <TableCell className="text-center tabular-nums">{fmt(r.executedSoFar)}</TableCell>
                <TableCell className="text-center tabular-nums">{fmt(r.remaining)}</TableCell>
                {hasExtraQuantities && (
                  <TableCell className="text-center tabular-nums">
                    {existingExtra > 0 ? fmt(existingExtra) : ""}
                  </TableCell>
                )}
                <TableCell>
                  <div className="relative">
                    <NumericFormat
                      id={`row-${index}-qty`}
                      thousandSeparator
                      allowNegative={false}
                      decimalScale={3}
                      value={r.qty}
                      className="w-full rounded border px-2 py-1 text-center tabular-nums"
                      onValueChange={(v) => onQtyChange(index, v.floatValue ?? 0)}
                    />
                    {hasExtra && (
                      <div className="mt-1 text-xs text-blue-600">
                        +{fmt(overBy)} {r.unidad ?? ""} extra
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
