import { Client, Item, Quote } from '@/types';
import supabase from './client';


// save the client data
export const saveClientData = async (data: Client): Promise<Client | null> => {
  try {
    let returnedData, error;

    if (data.id) {
      ({ data: returnedData, error } = await supabase
        .from('clientes')
        .update(data)
        .eq('id', data.id));
    } else {
      ({ data: returnedData, error } = await supabase
        .from('clientes')
        .insert([data]));
    }

    if (error) {
      throw error;
    }
    return returnedData ? returnedData[0] : null;
  } catch (error) {
    console.error(error);
    throw error;
  }
};


export const updateItemData = async (items: Item[]): Promise<void> => {
  try {
    for (const item of items) {
      const { id, precio_unidad } = item;
      const { data, error } = await supabase
        .from('items')
        .update({ precio_unidad })
        .eq('id', id);

      if (error) {
        throw error;
      }
    }
  } catch (error) {
    console.error('Failed to update items:', error);
  }
};


export const saveQuoteData = async (quoteData: Quote): Promise<Quote | null> => {
  try {
    let returnedData, error;

    if (quoteData.id) {
      ({ data: returnedData, error } = await supabase
        .from('cotizaciones')
        .update(quoteData)
        .eq('id', quoteData.id));
    } else {
      ({ data: returnedData, error } = await supabase
        .from('cotizaciones')
        .insert([quoteData]));
    }

    if (error) {
      throw error;
    }

    return returnedData ? returnedData[0] : null;
  } catch (error) {
    console.error('Failed to save quote data:', error);
    return null;
  }
};


interface APIData {
  [key: string]: any;
}

export const getAPIFiles = async (apiData: APIData): Promise<{ excelUrl: string; pdfUrl: string }> => {
  console.log('API method triggered');
  console.log('json data', apiData);
  console.log('JSON data to send', JSON.stringify(apiData));

  const response = await fetch(`${process.env.NEXT_PUBLIC_DEPLOYED_API_URL}/api/excel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(apiData),
  });

  console.log('API method triggered');

  if (!response.ok) {
    const errorText = await response.text();
    console.log('API response error:', errorText);
    throw new Error('Failed to send data to API');
  }

  const data = await response.json();

  console.log('DATA response', data);

  const getKeyFromUrl = (url: string): string => {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1);
  };

  const excelKey = getKeyFromUrl(data.excelUrl);
  const pdfKey = getKeyFromUrl(data.pdfUrl);

  console.log('Excel key', excelKey);
  console.log('pdf key', pdfKey);

  const excelUrl = `${process.env.NEXT_PUBLIC_S3_PROXY_API_URL}/download/${excelKey}`;
  const pdfUrl = `${process.env.NEXT_PUBLIC_S3_PROXY_API_URL}/download/${pdfKey}`;

  return { excelUrl, pdfUrl };
};
