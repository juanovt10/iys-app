import React, { useState, useEffect, ChangeEvent, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { createClient } from '@/lib/supabase/client';
import { Item } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from './ui/toast';
import SearchDropdown from './SearchDropdown';
import SelectedItemCard from './SelectedItemCard';
import { Dialog } from './ui/dialog';
import AddItemForm from './AddItemForm';
import SelectedItemsTable from './SelectedItemsTable';

const FormSchema = z.object({
  items: z.array(z.object({
    cantidad: z.number().min(1, "Quantity must be at least 1."),
    precio_unidad: z.number().min(1, "Price cannot be negative.")
  })).nonempty("You must add at least one item."),
});

const ItemsForm = ({ nextStep, prevStep, updateFormData, itemsData }: any) => {
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<Item[]>(itemsData || []);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = createClient();
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

  const fetchAllItems = useCallback(async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*');

    if (data) {
      setFilteredItems(data);
    } else {
      console.error('Error fetching items:', error);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAllItems();
  }, [fetchAllItems]);

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

  const onUpdateItem = (index: number, field: keyof Item, value: number) => {
    const updatedItems = selectedItems.map((item, idx) =>
      idx === index ? { ...item, [field]: value } : item
    );
  
    setSelectedItems(updatedItems);
    form.setValue('items', updatedItems);
  };


  const onRemoveItem = (index: number) => {
    const updatedItems = selectedItems.filter((_, idx) => idx !== index);
    setSelectedItems(updatedItems);
    form.setValue('items', updatedItems);
  };

  const onAddNewItem = (item: any) => {
    setSelectedItems((prevItems) => [...prevItems, item]);
    setShowAddItemDialog(false);
    form.setValue('items', [...selectedItems, item]);
  };


  const handleSubmitClick = async () => {
    if (selectedItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Ningun Item ha sido añadido",
        description: "Porfavor agregue items para continuar",
        action: <ToastAction altText="Dismiss">Cerrar</ToastAction>,
      });
      return;
    }

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
            title: `Item ${itemNumber} - Error en cantidad`,
            description: 'Cantidad no puede ser 0',
            action: <ToastAction altText="Try again">Cerrar</ToastAction>,
          });
        }

        if (precioError) {
          toast({
            variant: "destructive",
            title: `Item ${itemNumber} - Error en precio`,
            description: 'Precio no puede ser 0',
            action: <ToastAction altText="Try again">Cerrar</ToastAction>,
          });
        }
      });
      return;
    }

    form.handleSubmit(onSubmit)();
  };

  const onSubmit = (data: any) => {
    updateFormData({ items: selectedItems });
    nextStep();
  };

  return (
    <div className="relative flex flex-col h-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="flex-shrink-0 space-y-3">
            <FormItem className="flex flex-col">
              <FormLabel>Buscar Items</FormLabel>
              <SearchDropdown
                items={filteredItems}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onSelectItem={onSelectItem}
                placeholder="Agregar item existente"
                searchProperty="descripcion"
              />
              <FormMessage />
            </FormItem>
            <Button
              type="button"
              className="w-full"
              onClick={() => setShowAddItemDialog(true)}
            >
              Agregar nuevo item
            </Button>
          </div>

          <div className="flex-grow space-y-4 max-h-96 overflow-y-auto">
            <SelectedItemsTable
              selectedItems={selectedItems}
              onUpdateItem={onUpdateItem}
              onRemoveItem={onRemoveItem}
            />
            {/* {selectedItems.map((item, index) => (
              <SelectedItemCard
                key={index}
                item={item}
                index={index}
                selectedItemsCount={selectedItems.length}
                onUpdateItem={onUpdateItem}
                onRemoveItem={onRemoveItem}
              />
            ))} */}
          </div>

          <div className="flex-shrink-0 flex justify-between py-5 border-t">
            <Button
              type="button"
              onClick={prevStep}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
            >
              Atras
            </Button>
            <Button type="button" onClick={handleSubmitClick}>
              Continuar
            </Button>
          </div>
        </form>
      </Form>

      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <AddItemForm onAddItem={onAddNewItem} />
      </Dialog>
    </div>
  );
};

export default ItemsForm;
