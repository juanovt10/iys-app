'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import supabase from '@/lib/supabase/client'
import { Quote } from '@/types/index'
import QuoteCard from '@/components/QuoteCard'
import { useDebounce } from '@/hooks/useDebounce'




const Quotes = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [search, setSearch] = useState<string>('');

  const debounceSearch = useDebounce(search, 500);


  const fetchLatestQuotes = async (searchQuery: string = ''): Promise<void> => {
    let query = supabase
      .from('cotizaciones')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (searchQuery) {
      console.log('Applying search filter:', searchQuery);
      query = query.or(`cliente.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

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
    fetchLatestQuotes(debounceSearch);
  }, [debounceSearch])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };


  return (
    <div className='flex flex-col gap-4 p-5 w-full'>
      <h1 className='text-2xl font-extrabold'>Cotizaciones</h1>
      <div className='flex flex-col gap-4'>
        <Button
          className='w-full bg-companyGradient border border-gray-200 rounded-md shadow'
        >
          <Link href={'/quotes/create'}>Crear Cotizacion</Link>
        </Button>

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