'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { createClient } from '@/lib/supabase/client'
import { Quote } from '@/types/index'
import QuoteCard from '@/components/QuoteCard'
import { useDebounce } from '@/hooks/useDebounce'

const Quotes = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [search, setSearch] = useState<string>('');

  const supabase = createClient();

  const debounceSearch = useDebounce(search, 500);

  const fetchLatestQuotes = useCallback(async (searchQuery: string = ''): Promise<void> => {
    let query = supabase
      .from('latest_cotizaciones')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
  
    if (searchQuery) {
      query = query.ilike('numero', `%${searchQuery}%`);
    }
  
    const { data, error } = await query;
  
    if (error) {
      console.error('Error fetching quotes:', error.message);
      return;
    }
  
    if (data) {
      setQuotes(data as Quote[]);
    } else {
      console.warn('No data returned from Supabase.');
    }
  }, [supabase]);
  
  

  useEffect(() => {
    fetchLatestQuotes(debounceSearch);
  }, [debounceSearch, fetchLatestQuotes]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };


  return (
    <div className='flex flex-col gap-4 p-5 w-full'>
      <h1 className='text-2xl font-extrabold'>Cotizaciones</h1>
      <div className='flex flex-col gap-4'>
        <Link href={'/quotes/create'} passHref>
          <Button
            className='w-full bg-companyGradient border border-gray-200 rounded-md shadow'
          >
            Crear Cotizacion
          </Button>
        </Link>

        <Input
          type="text"
          placeholder="Buscar cotización por nombre del cliente"
          value={search}
          onChange={handleSearchChange}
          className='border border-gray-200 rounded-md shadow'
        />

        <div className="space-y-4 pb-10">
          {quotes.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Quotes
