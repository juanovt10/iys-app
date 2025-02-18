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

  const { client, items, remarks, numero, revision, created_at } = formData;

  const supabase = createClient();
  const fetchLatestQuoteId = useCallback(async (): Promise<void> => {
    try {
      const currentYear = new Date().getUTCFullYear(); // Get current year in UTC
  
      // Fetch all quotes from the current year
      const { data: allQuotes, error: fetchError } = await supabase
        .from('cotizaciones')
        .select('numero, created_at')
        .gte('created_at', `${currentYear}-01-01T00:00:00.000Z`) // Start of the year
        .lt('created_at', `${currentYear + 1}-01-01T00:00:00.000Z`); // Start of next year
  
      if (fetchError) {
        console.error('Error fetching quotes for the year:', fetchError.message);
        return;
      }
  
      console.log('All quotes from current year:', allQuotes); // Debugging log
  
      if (allQuotes && allQuotes.length > 0) {
        // Find the latest quote (with highest numero)
        const latestQuote = allQuotes.reduce((prev, current) =>
          prev.numero > current.numero ? prev : current
        );
  
        console.log('Latest quote object:', latestQuote); // Debugging log with full details
  
        // Increment the latest quote number
        setLatestQuoteId(latestQuote.numero + 1);
      } else {
        console.log('No quotes exist for this year, starting at 100');
        setLatestQuoteId(100);
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
  
    console.log("Form Data:", formData);
  
    const currentYear = new Date().getUTCFullYear();
    const quoteYear = created_at ? new Date(created_at).getUTCFullYear() : currentYear;
  
    console.log("Latest Quote ID:", latestQuoteId);
    console.log("Is Revision:", !!revision);
    console.log("Created Year:", quoteYear);
    console.log("Existing Numero:", numero);
  
    // Determine the correct `quoteId`
    let finalQuoteId;
    if (!revision) {
      finalQuoteId = latestQuoteId; // If no revision, use latestQuoteId
    } else {
      finalQuoteId = quoteYear === currentYear ? numero : latestQuoteId; // Keep same number if same year, else assign new
    }
  
    // Increment revision if it exists, else start at 1
    const finalRevision = revision ? revision + 1 : 1;
  
    console.log("Final Quote ID:", finalQuoteId);
    console.log("Final Revision:", finalRevision);
  
    if (!finalQuoteId) {
      console.error("🚨 Error: finalQuoteId is null, aborting submission.");
      setIsLoading(false);
      return;
    }
  
    const apiData = {
      quoteId: finalQuoteId,
      clientInfo: client,
      items: items,
      remarks: remarks,
    };
  
    try {
      console.log("Saving client data...");
      await saveClientData(client);
      console.log("Client data saved successfully.");
  
      const files = await getAPIFiles(apiData);
  
      console.log("Quote ID:", finalQuoteId);
  
      const quoteData = {
        numero: finalQuoteId,
        cliente: client.nombre_empresa,
        items: items,
        excel_file: files.excelUrl,
        pdf_file: files.pdfUrl,
        remarks: remarks,
        revision: finalRevision, // Ensure correct revision logic
      };
  
      console.log("Saving quote data...");
      await saveQuoteData(quoteData);
      console.log("Quote data saved successfully.");
      await saveOrUpdateItemData(items);
  
      setFiles(files);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error while saving quote data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  
  const handleDownload = async (url: string) => {
    await downloadFile(url);
    router.push('/quotes');
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