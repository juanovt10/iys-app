// app/projects/[id]/deliverables/new/DeliverableItemsTable.tsx
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NumericFormat } from "react-number-format";

export type DeliverableRow = {
  itemId: number | null;
  descripcion: string;
  unidad: string | null;
  maxQty: number;   // contracted qty
  qty: number;      // executed qty (editable)
};

export default function DeliverableItemsTable({
  rows,
  onQtyChange,
}: {
  rows: DeliverableRow[];
  onQtyChange: (index: number, nextQty: number) => void;
}) {
  if (!rows.length) return null;

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">#</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="w-48 text-center">Ejecutado</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((r, index) => {
            const rowNo = rows.length - index; // like your quote table
            const invalid = r.qty < 0; // (later you can check > remaining)
            return (
              <TableRow key={`${r.itemId ?? "x"}-${index}`} className={invalid ? "bg-red-50" : ""}>
                <TableCell className="text-center font-medium">{rowNo}</TableCell>
                <TableCell>
                  <div className="max-w-[800px] whitespace-pre-wrap">{r.descripcion}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Contratado: {new Intl.NumberFormat().format(r.maxQty)}
                    {r.unidad ? ` ${r.unidad}` : ""}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="relative">
                    <NumericFormat
                      thousandSeparator
                      allowNegative={false}
                      decimalScale={3}
                      value={r.qty}
                      className={`w-full rounded border px-2 py-1 pr-10 text-center ${invalid ? "border-red-300" : ""}`}
                      onValueChange={(v) => onQtyChange(index, v.floatValue ?? 0)}
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {r.unidad ?? ""}
                    </span>
                  </div>
                  {invalid && (
                    <div className="mt-1 text-xs text-red-600">Cantidad inválida.</div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
