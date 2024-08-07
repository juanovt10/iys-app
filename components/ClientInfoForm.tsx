'use client'

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Client } from '@/types/index';
import CustomInput from '@/components/CustomInput';
import { Form } from '@/components/ui/form';
import { clientInfoSchema } from '@/lib/utils';
import { Button } from '@/components/ui/button';


interface ClientInfoFormProps {
  nextStep: () => void;
  updateFormData: (data: { client: Client }) => void;
}

const ClientInfoForm: React.FC<ClientInfoFormProps> = ({ nextStep, updateFormData }) => {
  const formSchema = clientInfoSchema;

  const methods = useForm<z.infer<typeof formSchema> & { id: string }>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: '',
      nombre_empresa: '',
      nombre_contacto: '',
      email: '',
      direccion: '',
      telefono: '',
      nit: '',
    },
  });

  const { handleSubmit, control } = methods;

  const onSubmit = (data: z.infer<typeof formSchema> & { id: string }) => {
    updateFormData({ client: data });
    nextStep();
  };

  return (
    <FormProvider {...methods}>
      <Form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <h2>Client Information</h2>

        <CustomInput control={control} name="nombre_empresa" label="Company Name" placeholder="Enter company name" />
        <CustomInput control={control} name="direccion" label="Address" placeholder="Enter address" />
        <CustomInput control={control} name="telefono" label="Phone" placeholder="Enter phone number" />
        <CustomInput control={control} name="email" label="Email" placeholder="Enter email" />
        <CustomInput control={control} name="nombre_contacto" label="Contact Name" placeholder="Enter contact name" />
        <CustomInput control={control} name="nit" label="NIT" placeholder="Enter NIT" />

        <Button type="submit">Next</Button>
      </Form>
    </FormProvider>
  );
};

export default ClientInfoForm;
