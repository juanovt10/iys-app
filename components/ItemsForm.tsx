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

  const onUpdateItem = (index: number, field: keyof Item, value: string) => {
    const numberValue = Number(value.replace(/,/g, '')); // Remove commas for parsing
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
          
          {/* <SearchDropdown
            items={filteredItems}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSelectItem={onSelectItem}
            placeholder="Agregar item"
            selectedValue={selectedValue}
          /> */}
          
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
             <div key={index} className="flex flex-col space-y-4 border p-6 rounded-lg shadow-md">
             <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-4 md:space-y-0">
               <div className="flex-1 font-medium md:text-sm lg:text-lg text-gray-800">
                 #{selectedItems.length - index} - {item.descripcion}
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
           
            

              
              



              // <div key={index} className="flex flex-col space-y-4 border p-6 rounded-lg shadow-md">
              //   <div className="flex justify-between items-start sm:flex-col">
              //     <div className="flex-1 font-medium text-gray-800">
              //       #{selectedItems.length - index} - {item.descripcion}
              //     </div>
              //     <div className="flex items-start space-x-6 sm:space-x-0 sm:space-y-6 sm:flex-col">
              //       <div className="flex flex-col items-center space-y-2">
              //         <FormLabel className="text-sm font-semibold text-gray-600">{item.unidad}</FormLabel>
              //         <Input
              //           id={`item-${index}-cantidad`}
              //           type="text"
              //           placeholder="Quantity"
              //           value={formatWithCommas(item.cantidad)}
              //           onChange={(e) => onUpdateItem(index, 'cantidad', e.target.value)}
              //           className="w-24 text-center"
              //         />
              //       </div>
              //       <div className="flex flex-col items-center space-y-2">
              //         <FormLabel className="text-sm font-semibold text-gray-600">Precio/{item.unidad}</FormLabel>
              //         <Input
              //           id={`item-${index}-precio_unidad`}
              //           type="text"
              //           placeholder="Price"
              //           value={formatWithCommas(item.precio_unidad)}
              //           onChange={(e) => onUpdateItem(index, 'precio_unidad', e.target.value)}
              //           className="w-full text-center"
              //         />
              //       </div>
              //     </div>
              //   </div>
              //   <Button
              //     variant="destructive"
              //     type="button"
              //     onClick={() => onRemoveItem(index)}
              //     className="ml-4"
              //   >
              //     Remove
              //   </Button>
              // </div>
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
