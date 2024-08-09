'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Client, Quote } from '@/types/index';
import supabase from '@/lib/supabase/client'; 
import QuoteSummary from '@/components/QuoteSummary';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { downloadFile } from '@/lib/supabase/apiService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const QuoteDetail = ({ searchParams }: { searchParams: any }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true); 

  const router = useRouter();
  const params = useParams();
  const id = params.quoteId;
  const quote = searchParams.quote ? JSON.parse(searchParams.quote) : null;


  useEffect(() => {
    const fetchQuoteClient = async () => {
      try {
        const { data, error } = await supabase
          .from('clientes') 
          .select('*')
          .eq('nombre_empresa', quote.cliente)
          .single();

        if (error) {
          console.error('Error fetching quote details:', error);
        } else {
          console.log('Client data fetched:', data);
          // console.log('Quote data fetched:', quote)
          setClient(data);
        }
      } catch (err) {
        console.error('An unexpected error occurred:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuoteClient();
  }, [quote.cliente]);

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
    <div className="p-4 max-w-4xl mx-auto bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-extrabold mb-5">Detalle de Cotización #{id}</h1>
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
            Download Excel
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
            Download PDF
          </p>
        </Button>
      </div>
      <div>
        <Button
          className='bg-gray-700 w-full mt-5'
        >
          Edit Quote
        </Button>
        <Link
          href={`/quotes/create`}
          className='bg-gray-700 w-full mt-5'
        >
          Edit Quote
        </Link>
      </div>

    </div>
  );
};

export default QuoteDetail;
