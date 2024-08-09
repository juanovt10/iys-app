'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import QuoteForm from '@/components/QuoteForm';
import supabase from '@/lib/supabase/client';
import { CloudCog } from 'lucide-react';

const EditQuotePage = () => {
  const searchParams = useSearchParams();

  const clientData = searchParams.get('client') ? JSON.parse(searchParams.get('client') as string) : null;
  const quoteData = searchParams.get('quote') ? JSON.parse(searchParams.get('quote') as string) : null;
  useEffect(() => {
    console.log('CLIENT DATA', clientData);
    console.log('Quote data', quoteData);
  }, [clientData, quoteData]);

  return (
    <div>
      <QuoteForm
        client={clientData}
        quote={quoteData}
      />
    </div>
  );
};

export default EditQuotePage;
