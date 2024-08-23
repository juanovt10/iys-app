'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import QuoteForm from '@/components/QuoteForm';

const EditQuotePage = () => {
  const searchParams = useSearchParams();

  const clientData = searchParams.get('client') ? JSON.parse(searchParams.get('client') as string) : null;
  const quoteData = searchParams.get('quote') ? JSON.parse(searchParams.get('quote') as string) : null;
  useEffect(() => {
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
