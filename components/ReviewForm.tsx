'use client'

import { downloadFile, getAPIFiles, saveClientData, saveQuoteData, updateItemData } from '@/lib/supabase/apiService';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import QuoteSummary from './QuoteSummary';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogTitle } from './ui/dialog';

const ReviewForm = ({ nextStep, prevStep, formData }: any) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [files, setFiles] = useState<{ excelUrl: string; pdfUrl: string } | null>(null);
  const router = useRouter();

  const { client, items, remarks } = formData;


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
    <div className="p-4 max-w-4xl mx-auto bg-white shadow-md rounded-lg">
      <QuoteSummary 
        quoteData={formData}
      />

      <div className="flex justify-between">
        <Button 
          type="button" 
          onClick={prevStep}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
        >
          Back
        </Button>

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
              <DialogTitle>CRACK DE MIERDA!</DialogTitle>
              <DialogDescription>
                La cotizacion ha sido creada exitosamente!
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center space-x-4 py-4">
              <Button
                onClick={() => handleDownload(files.excelUrl)}
                className="bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Download Excel
              </Button>
              <Button
                onClick={() => handleDownload(files.pdfUrl)}
                className="bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Download PDF
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={handleClose} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ReviewForm;
