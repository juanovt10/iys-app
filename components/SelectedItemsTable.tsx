import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { NumericFormat } from "react-number-format";
import { Item } from "@/types";

interface SelectedItemsTableProps {
  selectedItems: Item[];
  onUpdateItem: (index: number, field: keyof Item, value: number) => void;
  onRemoveItem: (index: number) => void;
}

const SelectedItemsTable: React.FC<SelectedItemsTableProps> = ({
  selectedItems,
  onUpdateItem,
  onRemoveItem,
}) => {
  if (selectedItems.length === 0) return null;

  return (
    <div className="overflow-x-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">#</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="w-40 text-center">Cantidad</TableHead>
            <TableHead className="w-48 text-center">Precio/Unidad</TableHead>
            <TableHead className="w-20 text-center">Eliminar</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {selectedItems.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="text-center font-medium">
                {selectedItems.length - index}
              </TableCell>

              <TableCell>{item.descripcion}</TableCell>

              <TableCell>
                <div className="relative">
                  <NumericFormat
                    thousandSeparator
                    decimalScale={2}
                    fixedDecimalScale
                    allowNegative={false}
                    value={item.cantidad}
                    className="w-full text-center border rounded px-2 py-1 pr-10"
                    onValueChange={(values) =>
                      onUpdateItem(index, "cantidad", values.floatValue ?? 0)
                    }
                  />
                  <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                    {item.unidad}
                  </span>
                </div>
              </TableCell>

              <TableCell>
                <div className="relative">
                  <NumericFormat
                    thousandSeparator
                    decimalScale={2}
                    fixedDecimalScale
                    allowNegative={false}
                    value={item.precio_unidad}
                    className="w-full text-center border rounded px-2 py-1 pr-14"
                    onValueChange={(values) =>
                      onUpdateItem(index, "precio_unidad", values.floatValue ?? 0)
                    }
                  />
                  <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                    /{item.unidad}
                  </span>
                </div>
              </TableCell>

              <TableCell className="text-center">
                <Button
                  variant="destructive"
                  size="icon"
                  type="button"
                  onClick={() => onRemoveItem(index)}
                >
                  <Image
                    src="/icons/trash.svg"
                    width={20}
                    height={20}
                    alt="delete"
                    className="invert"
                  />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SelectedItemsTable;
