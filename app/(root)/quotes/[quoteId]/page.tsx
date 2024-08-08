'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Client, Quote } from '@/types/index';
import supabase from '@/lib/supabase/client'; 
import QuoteSummary from '@/components/QuoteSummary';

const QuoteDetail = ({ searchParams }: { searchParams: any }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true); 

  const params = useParams();
  const id = params.quoteId;
  const quote = searchParams.quote ? JSON.parse(searchParams.quote) : null;


  useEffect(() => {
    const fetchQuoteClient = async () => {
      try {
        console.log('Fetching quote with id:', id);
        const { data, error } = await supabase
          .from('clientes') 
          .select('*')
          .eq('nombre_empresa', quote.cliente)
          .single();

        if (error) {
          console.error('Error fetching quote details:', error);
        } else {
          console.log('Quote data fetched:', data);
          setClient(data);
        }
      } catch (err) {
        console.error('An unexpected error occurred:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuoteClient();
  }, [id, quote]);

  if (loading) {
    return <p>Loading...</p>;
  }

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
   </div>
  );
};

export default QuoteDetail;
