'use client'

import { downloadFile, getAPIFiles, saveClientData, saveQuoteData, updateItemData, saveOrUpdateItemData } from '@/lib/supabase/apiService';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from './ui/button';
import QuoteSummary from './QuoteSummary';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogTitle } from './ui/dialog';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

const ReviewForm = ({ nextStep, prevStep, formData }: any) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [files, setFiles] = useState<{ excelUrl: string; pdfUrl: string } | null>(null);
  const [latestQuoteId, setLatestQuoteId] = useState<number | null>(null);
  const router = useRouter();

  const { client, items, remarks } = formData;

  const supabase = createClient();

  const fetchLatestQuoteId = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('cotizaciones')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching the latest quote ID:', error.message);
        return;
      }

      if (data && data.length > 0) {
        setLatestQuoteId(data[0].id);
      } else {
        console.warn('No data returned from Supabase.');
      }
    } catch (err) {
      console.error('An error occurred while fetching the latest quote ID:', err);
    }
  }, [supabase]);

  useEffect(() => {
    fetchLatestQuoteId();
  }, [fetchLatestQuoteId]);

  const handleSubmit = async () => {
    setIsLoading(true);

    const nextQuoteId = latestQuoteId !== null ? latestQuoteId + 1 : 1;

    const apiData = {
      quoteId: nextQuoteId,
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
      await saveOrUpdateItemData(items);
      // await updateItemData(items);

      setFiles(files);
      setShowSuccessDialog(true);

      // router.push('/quotes');
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (url: string) => {
    await downloadFile(url); // Ensure downloadFile is awaited
    router.push('/quotes'); // Redirect after the download
  };

  const handleClose = () => {
    setShowSuccessDialog(false);
    router.push('/quotes');
  };


  return (
    <div className="p-4 mx-auto bg-white shadow-md rounded-lg">
      <QuoteSummary
        quoteData={formData}
      />

      <div className="flex justify-between">
        <Button 
          type="button" 
          onClick={prevStep}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
        >
          Atras
        </Button>

        <Button
          type='button'
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            'Creando cotizacion...'
          ) : (
            'Crear cotizacion'
          )}
        </Button>
      </div>

      {files && (
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent
            className="sm:max-w-[425px]"
            onInteractOutside={(e) => {
              e.preventDefault();
            }}
            hideCloseButton
          >
            <DialogHeader>
              <DialogTitle className='text-center'>La cotizacion ha sido creada exitosamente!</DialogTitle>
              <DialogDescription className='text-center'>
                Descargue la cotizacion en su formato preferido.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center space-x-4 py-4">
              <Button
                onClick={() => handleDownload(files.excelUrl)}
                className="bg-green-600 text-white rounded-md hover:bg-green-700 transition flex gap-2"
              >
                <Image 
                  src="/icons/sheet.svg"
                  height={20}
                  width={20}
                  alt='pdflogo'
                  className='invert'
                />
                <p>
                  Descargar Excel  
                </p>
              </Button>
              <Button
                onClick={() => handleDownload(files.pdfUrl)}
                className="bg-red-600 text-white rounded-md hover:bg-red-700 transition flex gap-2"
              >
                <Image 
                  src="/icons/file.svg"
                  height={20}
                  width={20}
                  alt='pdflogo'
                  className='invert'
                />
                <p>
                  Descargar PDF
                </p>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ReviewForm;
