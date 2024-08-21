import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormLabel } from '@/components/ui/form';
import { Item } from '@/types';
import { formatWithCommas } from '@/lib/utils';

interface SelectedItemCardProps {
  item: Item;
  index: number;
  selectedItemsCount: number;
  onUpdateItem: (index: number, field: keyof Item, value: string) => void;
  onRemoveItem: (index: number) => void;
}

const SelectedItemCard: React.FC<SelectedItemCardProps> = ({
  item,
  index,
  selectedItemsCount,
  onUpdateItem,
  onRemoveItem
}) => {
  return (
    <div className="flex flex-col space-y-4 border p-6 rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-4 md:space-y-0">
        <div className="flex-1 font-medium md:text-sm lg:text-lg text-gray-800">
          #{selectedItemsCount - index} - {item.descripcion}
        </div>
        <div className="flex flex-col items-end gap-5 sm:flex-row sm:space-x-6 sm:space-y-0 md:space-x-6 md:flex-row md:justify-between">
          <div className="flex flex-row items-center space-x-2">
            <FormLabel className="text-sm font-semibold text-gray-600">{item.unidad}</FormLabel>
            <Input
              id={`item-${index}-cantidad`}
              type="text"
              placeholder="Quantity"
              value={formatWithCommas(item.cantidad)}
              onChange={(e) => onUpdateItem(index, 'cantidad', e.target.value)}
              className="w-full md:w-24 text-center"
            />
          </div>
          <div className="flex flex-row items-center space-x-2">
            <FormLabel className="text-sm font-semibold text-gray-600">Precio/{item.unidad}</FormLabel>
            <Input
              id={`item-${index}-precio_unidad`}
              type="text"
              placeholder="Price"
              value={formatWithCommas(item.precio_unidad)}
              onChange={(e) => onUpdateItem(index, 'precio_unidad', e.target.value)}
              className="w-full md:w-auto text-center"
            />
          </div>
        </div>
      </div>
      <Button
        variant="destructive"
        type="button"
        onClick={() => onRemoveItem(index)}
        className="w-full md:w-auto mt-4 md:mt-0 md:ml-4"
      >
        Remove
      </Button>
    </div>
  );
};

export default SelectedItemCard;
