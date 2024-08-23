'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from './ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form';
import { formatWithCommas, itemSchema } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormLabel, FormMessage } from './ui/form';
import CustomInput from './CustomInput';
import CustomTextarea from './CustomTextarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import CustomNumberInput from './CustomNumberInput';

const AddItemForm = ({ onAddItem }: { onAddItem: (item: any) => void }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const categories = ['Vertical', 'Horizontal', 'Dispositivos'];

  
  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      descripcion: '',
      unidad: '',
      precio_unidad: 1000,
      cantidad: 1,
      categoria: '',
    }
  });


  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    form.setValue('categoria', category);
  };
  

  const onSubmit = (data: any) => {
    onAddItem(data);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Agregar nuevo item</DialogTitle>
        <DialogDescription>
          Agregar nuevo item para cotizacion y base de datos.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <CustomTextarea 
            control={form.control}
            name="descripcion"
            label="Descripcion"
            placeholder="Ingresar description del item"
          />

          <div className='flex w-full justify-between'>
            <CustomInput
              control={form.control}
              name='unidad'
              label="Unidad"
              placeholder="m2, UN, ml, m"
            />

            <CustomNumberInput 
              control={form.control}
              name='precio_unidad'
              label="Precio por unidad"
              placeholder="Ingresar el precio por unidad del item"
            />
          </div>

          <div className='flex w-full justify-between gap-8'>
            <div className='w-full max-w-[280px]'>
              <CustomNumberInput 
                control={form.control}
                name='cantidad'
                label="Cantidad"
                placeholder="Ingresar catidad del item"
              />
            </div>

            <div className="flex flex-col gap-1.5 w-full max-w-[280px]">
              <FormLabel className="text-14 w-full max-w-[280px] font-medium text-gray-700">
                Categoría
              </FormLabel>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="text-16 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-500 w-full"
                    variant="outline"
                  >
                    {selectedCategory || 'Seleccionar categoría'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category}
                      onSelect={() => handleCategorySelect(category)}
                    >
                      {category}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <FormMessage className="text-red-500">
                {form.formState.errors.categoria?.message}
              </FormMessage>
            </div>
          </div>
          <Button className='w-full' type="submit">Agregar item</Button>
        </form>
      </Form>
    </DialogContent>
  )
}

export default AddItemForm