import React from 'react';
import { Quote } from '@/types/index';
import { formatWithCommas, calculateTotals } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

interface QuoteCardProps {
  quote: Quote;
}

const QuoteCard: React.FC<QuoteCardProps> = ({ quote }) => {
  const { subtotal, aiu20, iva, total } = calculateTotals(quote.items);

  return (
    <div key={quote.id} className="p-4 border border-gray-200 rounded shadow">
      <div className="flex justify-between">
        <div>
          <p className="text-lg font-semibold">Quote #{quote.id}</p>
          {quote.cliente.length > 0 && (
            <p className="text-sm text-gray-600">Client: {quote.cliente}</p>
          )}
          <p className="text-sm text-gray-600">Items: {quote.items.length}</p>
          <p className="text-sm text-gray-600">Total: ${formatWithCommas(total)}</p>
          <p className="text-sm text-gray-600">
            Fecha: {formatDate(new Date(quote.created_at).toISOString())}
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuoteCard;
