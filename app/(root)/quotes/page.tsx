'use client'

import { useEffect, useState } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { mockQuoteData } from '@/constants'
import { formatDate } from '@/lib/utils'
import supabase from '@/lib/supabase/client'
import { Quote } from '@/types/index'
import { calculateTotals, formatWithCommas } from '@/lib/utils'



const Quotes = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);


  const fetchLatestQuotes = async (): Promise<void> => {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching quotes:', error.message);
      return;
    }

    if (data) {
      console.log('Fetched data:', data);
      setQuotes(data as Quote[]);
    } else {
      console.warn('No data returned from Supabase.');
    }
  };

  useEffect(() => {
    fetchLatestQuotes();
    
  }, [])

  console.log(quotes)

  return (
    <div className='flex flex-col gap-4 p-5 w-full'>
      {/* here is the title + breadcrumb layout inside layoyut? */}
      <h1 className='text-2xl font-extrabold'>Cotizaciones</h1>
      <div className='flex flex-col gap-4'>
        <Button className='w-full bg-companyGradient border border-gray-200 rounded-md shadow'>
          Crear Cotizacion
        </Button>

        <Input
          type="text"
          placeholder="Buscar cotización"
          className='border border-gray-200 rounded-md shadow'
        />

        <div className="space-y-4 pb-10">
          {quotes.map((quote) => (
            <div key={quote.id} className="p-4 border border-gray-200 rounded shadow">
              <div className="flex justify-between">
                <div>
                  <p className="text-lg font-semibold">Quote #{quote.id}</p> 
                  <p className="text-sm text-gray-600">Client: {quote.cliente}</p>
                  <p className="text-sm text-gray-600">Items: {quote.items.length}</p>
                  <p className="text-sm text-gray-600">Total: ${formatWithCommas(calculateTotals(quote.items).total)}</p>
                  <p className="text-sm text-gray-600">
                    Date: {formatDate(new Date(quote.created_at).toISOString())}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Quotes