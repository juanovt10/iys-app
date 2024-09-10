import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormLabel } from '@/components/ui/form';
import { Item } from '@/types';
import { formatWithCommas, formatWithCommasAndDecimals } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import Image from 'next/image';
import { NumericFormat } from 'react-number-format';

interface SelectedItemCardProps {
  item: Item;
  index: number;
  selectedItemsCount: number;
  onUpdateItem: (index: number, field: keyof Item, value: number) => void;
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
    <div className="flex flex-col border p-6 rounded-lg shadow-md space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex-1 font-medium text-sm lg:text-lg text-gray-800">
          #{selectedItemsCount - index} - {item.descripcion}
        </div>
        <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              type="button"
              onClick={() => onRemoveItem(index)}
              className="p-2"
            >
              <Image 
                src='/icons/trash.svg'
                width={20}
                height={20}
                alt='deleteLogo'
                className='invert'
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Borrar item</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      </div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-4 md:space-y-0 md:space-x-6">
        <div className="flex flex-col md:w-1/2">
          <FormLabel className="text-sm font-semibold text-gray-600 md:text-left md:mb-1">
            {item.unidad}
          </FormLabel>
          <div className="flex items-center space-x-2">
            <NumericFormat
              id={`item-${index}-cantidad`}
              thousandSeparator
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              value={item.cantidad}
              className="w-full text-center p-2 border rounded"
              onValueChange={(values) => onUpdateItem(index, 'cantidad', values.floatValue ?? 0)}
            />
          </div>
        </div>
        <div className="flex flex-col md:w-1/2">
          <FormLabel className="text-sm font-semibold text-gray-600 md:text-left md:mb-1">
            Precio/{item.unidad}
          </FormLabel>
          <div className="flex items-center space-x-2">
            <NumericFormat
              id={`item-${index}-precio_unidad`}
              thousandSeparator
              fixedDecimalScale
              allowNegative={false}
              value={item.precio_unidad}
              className="w-full text-center p-2 border rounded"
              onValueChange={(values) => onUpdateItem(index, 'precio_unidad', values.floatValue ?? 0)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectedItemCard;
