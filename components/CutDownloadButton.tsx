'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import Image from 'next/image';
import { downloadFile } from '@/lib/supabase/apiService';

interface CutDownloadButtonProps {
  excelFile?: string;
  pdfFile?: string;
  onGenerateDocuments?: () => Promise<void>;
  isGenerating?: boolean;
  className?: string;
}

export default function CutDownloadButton({
  excelFile,
  pdfFile,
  onGenerateDocuments,
  isGenerating = false,
  className = ""
}: CutDownloadButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  const hasFiles = excelFile && pdfFile;

  const handleDownload = async (url: string) => {
    await downloadFile(url);
  };

  const handleGenerateAndShow = async () => {
    if (onGenerateDocuments) {
      await onGenerateDocuments();
      setShowDialog(true);
    }
  };

  const handleClose = () => {
    setShowDialog(false);
  };

  return (
    <>
      {hasFiles ? (
        <Button
          onClick={() => setShowDialog(true)}
          size="sm"
          className={`gap-1 ${className}`}
        >
          <Download className="h-4 w-4" />
          Descargar
        </Button>
      ) : (
        <Button
          onClick={handleGenerateAndShow}
          disabled={isGenerating}
          size="sm"
          className={`gap-1 ${className}`}
        >
          <Download className="h-4 w-4" />
          {isGenerating ? 'Generando...' : 'Generar Documentos'}
        </Button>
      )}

      {/* Download Dialog */}
      {showDialog && hasFiles && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-center">
              ¡Documentos disponibles!
            </h3>
            <p className="text-sm text-gray-600 mb-6 text-center">
              Descargue los documentos en su formato preferido.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => handleDownload(excelFile!)}
                className="bg-green-600 text-white rounded-md hover:bg-green-700 transition flex gap-2 flex-1"
              >
                <Image
                  src="/icons/sheet.svg"
                  height={20}
                  width={20}
                  alt='excel-logo'
                  className='invert'
                />
                <p>Descargar Excel</p>
              </Button>
              <Button
                onClick={() => handleDownload(pdfFile!)}
                className="bg-red-600 text-white rounded-md hover:bg-red-700 transition flex gap-2 flex-1"
              >
                <Image
                  src="/icons/file.svg"
                  height={20}
                  width={20}
                  alt='pdf-logo'
                  className='invert'
                />
                <p>Descargar PDF</p>
              </Button>
            </div>
            <div className="mt-4">
              <Button
                onClick={handleClose}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
