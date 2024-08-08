import React, { useState, useEffect, ChangeEvent } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod';
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import supabase from '@/lib/supabase/client';
import { Item } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from './ui/toast';
import { ServerInsertedHTMLContext } from 'next/navigation';

const FormSchema = z.object({
  items: z.array(z.object({
    cantidad: z.number().min(1, "Quantity must be at least 1."),
    precio_unidad: z.number().min(1, "Price cannot be negative.")
  })).nonempty("You must add at least one item."),
});

const ItemsForm = ({ nextStep, prevStep, updateFormData, itemsData }: any) => {
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<Item[]>(itemsData || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: { items: itemsData || [] },
  });

  useEffect(() => {
    if (itemsData) {
      setSelectedItems(itemsData);
    }
  }, [itemsData]);

  useEffect(() => {
    const fetchAllItems = async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*');

      if (data) {
        setFilteredItems(data);
      } else {
        console.error('Error fetching items:', error);
      }
    };

    fetchAllItems();
  }, []);

  const onSelectItem = (item: Item) => {
    const isDuplicate = selectedItems.some(selectedItem => selectedItem.id === item.id);

    if (isDuplicate) {
      toast({
        variant: "destructive",
        title: "Item duplicado",
        description: "Este item ya ha sido agregado.",
        action: <ToastAction altText="Dismiss">Cerrar</ToastAction>,
      });
      return;
    }

    setSearchTerm('');
    setIsPopoverOpen(false);
    const newItems = [{ ...item, cantidad: item.cantidad || 1, precio_unidad: item.precio_unidad || 0 }, ...selectedItems];
    setSelectedItems(newItems);
    form.setValue('items', newItems);
  };

  const onUpdateItem = (index: number, field: keyof Item, value: any) => {
    const updatedItems = selectedItems.map((item, idx) =>
      idx === index ? { ...item, [field]: Number(value) } : item
    );
    setSelectedItems(updatedItems);
    form.setValue('items', updatedItems);
  };

  const onRemoveItem = (index: number) => {
    const updatedItems = selectedItems.filter((_, idx) => idx !== index);
    setSelectedItems(updatedItems);
    form.setValue('items', updatedItems);
  };

  const handleSubmitClick = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      selectedItems.forEach((item, index) => {
        const itemErrors = (form.formState.errors.items as any)?.[index] ?? {};
        const cantidadError = itemErrors.cantidad?.message;
        const precioError = itemErrors.precio_unidad?.message;
        const itemNumber = selectedItems.length - index;

        if (cantidadError) {
          toast({
            variant: "destructive",
            title: `Item ${itemNumber} - Quantity Error`,
            description: String(cantidadError),
            action: <ToastAction altText="Try again">Try again</ToastAction>,
          });
        }

        if (precioError) {
          toast({
            variant: "destructive",
            title: `Item ${itemNumber} - Price Error`,
            description: String(precioError),
            action: <ToastAction altText="Try again">Try again</ToastAction>,
          });
        }
      });
      return;
    }

    // If no validation errors, submit the form
    form.handleSubmit(onSubmit)();
  };

  const onSubmit = (data: any) => {
    updateFormData({ items: selectedItems });
    nextStep();
  };

  return (
    <div className="relative">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormItem className="flex flex-col">
            <FormLabel>Buscar Items</FormLabel>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between border-red-500 bg-red-50 cursor-pointer",
                      !searchTerm && "text-muted-foreground"
                    )}
                  >
                    {searchTerm
                      ? filteredItems.find((item) => item.descripcion === searchTerm)?.descripcion
                      : "Agregar item"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder="Buscar items..." 
                  />
                  <CommandList>
                    <CommandEmpty>No se encontraron items.</CommandEmpty>
                    <CommandGroup>
                      {filteredItems
                        .filter(item => item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((item) => (
                          <CommandItem
                            value={item.descripcion}
                            key={item.id}
                            onSelect={() => onSelectItem(item)}
                          >
                            <Check className={`mr-2 h-4 w-4 ${String(item.id) === searchTerm ? "opacity-100" : "opacity-0"}`} />
                            {item.descripcion}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>

          <div className="space-y-4 max-h-80 overflow-y-auto">
            {selectedItems.map((item, index) => (
              <div
              key={index}
              className="flex flex-col space-y-4 border p-6 rounded-md bg-white shadow-md"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 font-medium text-gray-800">
                  #{selectedItems.length - index} - {item.descripcion}
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex flex-col items-end space-y-2">
                    <label htmlFor={`quantity-${index}`} className="text-gray-600 text-sm">
                      Cantidad ({item.unidad})
                    </label>
                    <input
                      id={`quantity-${index}`}
                      type="number"
                      placeholder="Quantity"
                      value={item.cantidad}
                      onChange={(e) => onUpdateItem(index, 'cantidad', e.target.value)}
                      className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-24"
                    />
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <label htmlFor={`price-${index}`} className="text-gray-600 text-sm">
                      Precio/{item.unidad}
                    </label>
                    <input
                      id={`price-${index}`}
                      type="number"
                      placeholder="Price"
                      value={item.precio_unidad}
                      onChange={(e) => onUpdateItem(index, 'precio_unidad', e.target.value)}
                      className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-24"
                    />
                  </div>
                </div>
              </div>
                <Button variant="destructive" type='button' onClick={() => onRemoveItem(index)}>Remove</Button>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" onClick={prevStep}>Back</Button>
            <Button type="button" onClick={handleSubmitClick}>Continue</Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ItemsForm;
