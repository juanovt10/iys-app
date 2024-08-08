'use client'

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import CustomInput from '@/components/CustomInput';
import { clientInfoSchema } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Form } from "@/components/ui/form"

const ClientInfoForm = ({ nextStep, updateFormData, clientData }: any) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof clientInfoSchema>>({
    resolver: zodResolver(clientInfoSchema),
    defaultValues: clientData,
  });

  const onSubmit = (data:z.infer<typeof clientInfoSchema>) => {
    setIsLoading(true);
    updateFormData({ client: data });
    nextStep();
    console.log(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <CustomInput 
          control={form.control}
          name="nombre_empresa"
          label="Nombre de la empresa"
          placeholder="Nombre de la empresa"
        />

        <CustomInput 
          control={form.control}
          name="nombre_contacto"
          label="Nombre del representante"
          placeholder="Nombre del representante"
        />

        <CustomInput 
          control={form.control}
          name="email"
          label="Email"
          placeholder="Email"
        />
        
        <div className='flex gap-4 w-full'>
          <CustomInput 
            control={form.control}
            name="nit"
            label="Nit"
            placeholder="Nit"
          />

          <CustomInput 
            control={form.control}
            name="telefono"
            label="Number de telefono"
            placeholder="Number de telefono"
          />
        </div>


        <CustomInput 
          control={form.control}
          name="direccion"
          label="Direccion"
          placeholder="Direccion"
        />

        <div className='flex justify-end'>
          <Button type="submit">Continuar</Button>
        </div>
      </form>
    </Form>
  )
};

export default ClientInfoForm;
