import React, { useState, useEffect } from 'react';
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

const FormSchema = z.object({
  search: z.string().min(3, "Please enter at least 3 characters to search."),
  quantity: z.number().min(1, "Quantity must be at least 1."),
  price: z.number().min(0, "Price cannot be negative."),
});

const ItemsForm = ({ nextStep, prevStep, updateFormData, itemsData }: any) => {
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<Item[]>(itemsData || []);

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      search: '',
      quantity: 1,
      price: 0,
    },
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
    form.reset({ search: '' });
    setSelectedItems([...selectedItems, { ...item, cantidad: item.cantidad || 1, precio_unidad: item.precio_unidad || 0 }]);
  };

  const onUpdateItem = (index: number, field: keyof Item, value: any) => {
    const updatedItems = selectedItems.map((item, idx) =>
      idx === index ? { ...item, [field]: field === 'cantidad' || field === 'precio_unidad' ? Number(value) : value } : item
    );
    setSelectedItems(updatedItems);
  };

  const onSubmit = () => {
    updateFormData({ items: selectedItems });
    nextStep();
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="search"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Buscar Items</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between border-red-500 bg-red-50 cursor-pointer",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? filteredItems.find((item) => item.descripcion === field.value)?.descripcion
                          : "Agregar item"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar items..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron items.</CommandEmpty>
                        <CommandGroup>
                          {filteredItems
                            .filter(item => item.descripcion.toLowerCase().includes(field.value.toLowerCase()))
                            .map((item) => (
                              <CommandItem
                                value={item.descripcion}
                                key={item.id}
                                onSelect={() => onSelectItem(item)}
                              >
                                <Check className={`mr-2 h-4 w-4 ${String(item.id) === field.value ? "opacity-100" : "opacity-0"}`} />
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
            )}
          />

          {selectedItems.map((item, index) => (
            <div key={index} className="item-input">
              <div>{item.descripcion}</div>
              <Input
                type="number"
                placeholder="Quantity"
                value={item.cantidad}
                onChange={(e) => onUpdateItem(index, 'cantidad', Number(e.target.value))}
              />
              <Input
                type="number"
                placeholder="Price"
                value={item.precio_unidad}
                onChange={(e) => onUpdateItem(index, 'precio_unidad', Number(e.target.value))}
              />
            </div>
          ))}

          <div className="flex justify-between">
            <Button type="button" onClick={prevStep}>Back</Button>
            <Button type="submit">Continue</Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ItemsForm;
