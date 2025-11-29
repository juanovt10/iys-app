import React from 'react';
import { Quote } from '@/types/index';
import { formatWithCommas, calculateTotals } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';


interface QuoteCardProps {
  quote: Quote;
}

const QuoteCard = ({ quote }: QuoteCardProps) => {
  const { total } = calculateTotals(quote.items);

  return (
    <div key={quote.id} className="p-4 border border-gray-200 rounded shadow hover:shadow-lg hover:border-red-600">
      <Link href={`/quotes/${quote.id}`}>
        <div className="block  transition-shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-lg font-semibold">Cotizacion #{quote.numero} - Rev{quote.revision}</p>
              {quote.cliente.length > 0 && (
                <p className="text-sm text-gray-600">Cliente: {quote.cliente}</p>
              )}
              <p className="text-sm text-gray-600">Items: {quote.items.length}</p>
              <p className="text-sm text-gray-600">Total: ${formatWithCommas(total)}</p>
              <p className="text-sm text-gray-600">
                Fecha: {quote.created_at ? formatDate(new Date(quote.created_at).toISOString()) : 'Fecha no disponible'}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default QuoteCard;
