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
import { cn, formatWithCommas } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from './ui/toast';
import SearchDropdown from './SearchDropdown';
import SelectedItemCard from './SelectedItemCard';

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
    const newItems = [{ ...item, cantidad: item.cantidad || 1, precio_unidad: item.precio_unidad || 0 }, ...selectedItems];
    setSelectedItems(newItems);
    form.setValue('items', newItems);
  };

  const onUpdateItem = (index: number, field: keyof Item, value: string) => {
    // Filter out any non-numeric characters, except for commas (which are used in formatting)
    const sanitizedValue = value.replace(/[^0-9,]/g, '');
  
    // Convert to a number, removing commas
    const numberValue = Number(sanitizedValue.replace(/,/g, ''));
  
    // If the input is invalid, do not update the item
    if (isNaN(numberValue)) return;
  
    const updatedItems = selectedItems.map((item, idx) =>
      idx === index ? { ...item, [field]: numberValue } : item
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
            <SearchDropdown
              items={filteredItems}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onSelectItem={onSelectItem}
              placeholder="Agregar item"
              searchProperty='descripcion'
            />
            <FormMessage />
          </FormItem>

          <div className="space-y-4 max-h-80 overflow-y-auto">
            {selectedItems.map((item, index) => (
              <SelectedItemCard
                key={index}
                item={item}
                index={index}
                selectedItemsCount={selectedItems.length}
                onUpdateItem={onUpdateItem}
                onRemoveItem={onRemoveItem}
              />
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
