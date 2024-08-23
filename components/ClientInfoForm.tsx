'use client'

import React, { useCallback, useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import CustomInput from '@/components/CustomInput';
import { clientInfoSchema } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Form } from "@/components/ui/form";
import { createClient } from '@/lib/supabase/client';
import SearchDropdown from './SearchDropdown';

const ClientInfoForm = ({ nextStep, updateFormData, clientData, registerValidation }: any) => {
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = createClient();

  const fetchClients = useCallback(async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*');

    if (data) {
      setClients(data);
    } else {
      console.error('Error fetching clients:', error);
    }
  }, [supabase]);

  useEffect(() => {
    fetchClients(); // Run fetchClients when the component mounts
  }, [fetchClients]); 


  const onSelectClient = (client: any) => {
    form.setValue('nombre_empresa', client.nombre_empresa);
    form.setValue('nombre_contacto', client.nombre_contacto);
    form.setValue('email', client.email);
    form.setValue('nit', client.nit);
    form.setValue('telefono', client.telefono);
    form.setValue('direccion', client.direccion);
    setSearchTerm(client.nombre_empresa);
  };

  const form = useForm<z.infer<typeof clientInfoSchema>>({
    resolver: zodResolver(clientInfoSchema),
    defaultValues: clientData,
  });

  const onSubmit = (data:z.infer<typeof clientInfoSchema>) => {
    updateFormData({ client: data });
    nextStep();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-5">
        <SearchDropdown
          items={clients}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSelectItem={onSelectClient}
          placeholder="Buscar cliente"
          searchProperty="nombre_empresa"
        />
      </div>
  
      <div className="flex-grow overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <div className="flex-grow space-y-8 overflow-y-auto px-1 pb-1">
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
  
              <div className="flex gap-4 w-full">
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
            </div>
  
            <div className="flex-shrink-0 flex justify-between pt-5 border-t mt-5">
              <div />
              <Button type="submit" variant="default">
                Continuar
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ClientInfoForm;
