'use client'

import { getAPIFiles, saveClientData, saveQuoteData, updateItemData } from '@/lib/supabase/apiService';
import { calculateTotals, formatWithCommas } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';

const ReviewForm = ({ nextStep, prevStep, formData }: any) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { client, items, remarks } = formData;
  const { subtotal, aiu20, iva, total } = calculateTotals(items);

  const handleSubmit = async () => {
    console.log('trigger submit');
    setIsLoading(true);

    // build data to send to API
    const apiData = {
      clientInfo: client,
      items: items,
      remarks: remarks,
    };

    try {
      await saveClientData(client);

      const files = await getAPIFiles(apiData);

      const quoteData = {
        cliente: client.nombre_empresa,
        items: items,
        excel_file: files.excelUrl,
        pdf_file: files.pdfUrl,
        remarks: remarks,
      };

      await saveQuoteData(quoteData);
      await updateItemData(items);

      router.push('/quotes');
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="p-4 max-w-4xl mx-auto bg-white shadow-md rounded-lg">
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Client Information</h3>
        <div className="space-y-2">
          <p><strong>Company Name:</strong> {client.nombre_empresa}</p>
          <p><strong>Address:</strong> {client.direccion}</p>
          <p><strong>Phone:</strong> {client.telefono}</p>
          <p><strong>Email:</strong> {client.email}</p>
          <p><strong>Contact Name:</strong> {client.nombre_contacto}</p>
          <p><strong>NIT:</strong> {client.nit}</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Items</h3>
        {items.map((item: any, index: number) => (
          <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg shadow-sm">
            <p><strong>Description:</strong> {item.descripcion}</p>
            <p><strong>Quantity:</strong> {formatWithCommas(item.cantidad)}</p>
            <p><strong>Unit Price:</strong> ${formatWithCommas(item.precio_unidad)}</p>
          </div>
        ))}
      </div>
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Totales</h3>
        <div className="space-y-2">
          <p><strong>Subtotal:</strong> ${formatWithCommas(subtotal)}</p>
          <p><strong>AIU (20%):</strong> ${formatWithCommas(aiu20)}</p>
          <p><strong>IVA:</strong> ${formatWithCommas(iva)}</p>
          <p><strong>Total:</strong> ${formatWithCommas(total)}</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Remarks</h3>
        <div className="space-y-2">
          <p><strong>Validez:</strong> {remarks.validez}</p>
          <p><strong>Anticipo:</strong> {remarks.anticipo}</p>
          <p><strong>Pagos:</strong> {remarks.pagos}</p>
          <p><strong>Premarcado:</strong> {remarks.premarcado}</p>
          <p><strong>Tiempos:</strong> {remarks.tiempos}</p>
          <p><strong>Cambios:</strong> {remarks.cambios}</p>
          <p><strong>AIU:</strong> {remarks.AIU}</p>
        </div>
      </div>

      <div className="flex justify-between">
        <button 
          type="button" 
          onClick={prevStep}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
        >
          Back
        </button>

        <Button
          type='button'
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            'Creating quote...'
          ) : (
            'Create quote'
          )}
        </Button>
      </div>
    </div>
  );
};

export default ReviewForm;
