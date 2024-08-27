import { Client, Item, Quote } from '@/types';
import { createClient } from '@/lib/supabase/client'
// import supabase from './client';

const supabase = createClient();

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

export const saveOrUpdateItemData = async (items: Item[]): Promise<Item[]> => {
  try {
    const savedItems: Item[] = [];

    for (const item of items) {
      let returnedData: Item[] | null = null;
      let error: any = null;

      if (item.id) {
        // Update existing item
        const { data, error: updateError } = await supabase
          .from('items')
          .update(item)
          .eq('id', item.id);

        returnedData = data as Item[] | null;  // Explicitly cast data
        error = updateError;
      } else {
        // Insert new item
        const { data, error: insertError } = await supabase
          .from('items')
          .insert([item]);

        returnedData = data as Item[] | null;  // Explicitly cast data
        error = insertError;
      }

      if (error) {
        throw error;
      }

      if (returnedData && returnedData.length > 0) {
        savedItems.push(...returnedData);  // Push all returned items
      }
    }

    return savedItems;
  } catch (error) {
    console.error('Failed to save or update items:', error);
    throw error;
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
  const response = await fetch(`${process.env.NEXT_PUBLIC_DEPLOYED_API_URL}/api/excel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(apiData),
  });


  if (!response.ok) {
    const errorText = await response.text();
    throw new Error('Failed to send data to API');
  }

  const data = await response.json();


  const getKeyFromUrl = (url: string): string => {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1);
  };

  const excelKey = getKeyFromUrl(data.excelUrl);
  const pdfKey = getKeyFromUrl(data.pdfUrl);

  const excelUrl = `${process.env.NEXT_PUBLIC_S3_PROXY_API_URL}/download/${excelKey}`;
  const pdfUrl = `${process.env.NEXT_PUBLIC_S3_PROXY_API_URL}/download/${pdfKey}`;

  return { excelUrl, pdfUrl };
};

export const downloadFile = async (url: string) => {
  try {
    // Fetch the file
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    // Create a blob from the response
    const blob = await response.blob();
    const urlParts = url.split('/');
    const fileNameWithExtension = urlParts.pop();
    const fileName = fileNameWithExtension || 'downloaded-file';

    // Create a link element
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;

    // Append the link to the document and trigger the download
    document.body.appendChild(link);
    link.click();

    // Clean up and remove the link
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(link.href);

    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};
