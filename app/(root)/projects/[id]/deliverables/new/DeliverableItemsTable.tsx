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
            <TableHead className="w-40 text-center">Ejecutado (nuevo)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, index) => {
            const rowNo = rows.length - index;
            const overBy = r.qty - r.remaining;
            const isOver = overBy > 0;
            return (
              <TableRow key={`${r.itemId ?? "x"}-${index}`} className={isOver ? "bg-red-50" : ""}>
                <TableCell className="text-center font-medium">{rowNo}</TableCell>
                <TableCell>
                  <div className="max-w-[800px] whitespace-pre-wrap">{r.descripcion}</div>
                </TableCell>
                <TableCell className="text-center">{r.unidad ?? ""}</TableCell>
                <TableCell className="text-center tabular-nums">{fmt(r.contracted)}</TableCell>
                <TableCell className="text-center tabular-nums">{fmt(r.executedSoFar)}</TableCell>
                <TableCell className="text-center tabular-nums">{fmt(r.remaining)}</TableCell>
                <TableCell>
                  <div className="relative">
                    <NumericFormat
                      id={`row-${index}-qty`}
                      thousandSeparator
                      allowNegative={false}
                      decimalScale={3}
                      value={r.qty}
                      className={`w-full rounded border px-2 py-1 text-center tabular-nums ${
                        isOver ? "border-red-300" : ""
                      }`}
                      onValueChange={(v) => onQtyChange(index, v.floatValue ?? 0)}
                    />
                    {isOver && (
                      <div className="mt-1 text-xs text-red-600">
                        Excede por {fmt(overBy)} {r.unidad ?? ""}. Ajusta la cantidad.
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
