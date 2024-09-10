'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Client, Quote } from '@/types/index';
import { createClient } from '@/lib/supabase/client';
import QuoteSummary from '@/components/QuoteSummary';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { downloadFile } from '@/lib/supabase/apiService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


const QuoteDetail = ({ searchParams }: { searchParams: any }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true); 

  const supabase = createClient();

  const router = useRouter();
  const params = useParams();
  const id = params.quoteId;
  const quote = searchParams.quote ? JSON.parse(searchParams.quote) : null;


  const fetchQuoteClient = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('nombre_empresa', quote.cliente)
        .single();

      if (error) {
        console.error('Error fetching quote details:', error);
      } else {
        setClient(data);
      }
    } catch (err) {
      console.error('An unexpected error occurred:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, quote.cliente]);

  useEffect(() => {
    fetchQuoteClient();
  }, [fetchQuoteClient]);

  if (loading) {
    return <p>Loading...</p>;
  }
  
  const handleDownload = async (url: string) => {
    await downloadFile(url); // Ensure downloadFile is awaited
    router.push('/quotes'); // Redirect after the download
  };
  
  

  const quoteData = {
    client: client,
    items: quote.items,
    remarks: quote.remarks
  }
  
  return (
    <div className="p-4 mx-auto bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-extrabold mb-5">Detalle de Cotización #{quote.numero} - Rev{quote.revision}</h1>
      <QuoteSummary
        quoteData={quoteData}
      />
      <div className="flex justify-between gap-5">
        <Button
          onClick={() => handleDownload(quote.excel_file)}
          className="bg-green-600 text-white rounded-md w-full hover:bg-green-700 transition flex gap-2"
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
          onClick={() => handleDownload(quote.pdf_file)}
          className="bg-red-600 text-white rounded-md hover:bg-red-700 w-full transition flex gap-2"
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
      <div>
        <Link
          href={{
            pathname: `/quotes/edit/${id}`,
            query: {
              client: JSON.stringify(client),
              quote: JSON.stringify(quote),
            },
          }}
          passHref
        >
          <Button className='bg-gray-700 hover:bg-gray-900 w-full mt-5'>
            Editar Cotización
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default QuoteDetail;
