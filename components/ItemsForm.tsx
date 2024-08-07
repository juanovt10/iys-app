// ItemsForm.tsx

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import supabase from '@/lib/supabase/client';
import { Item } from '@/types';

// const supabase = createClient('your-supabase-url', 'your-supabase-anon-key');

const ItemsForm = ({ nextStep, prevStep, updateFormData, itemsData }: any) => {
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<Item[]>(itemsData || []);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      search: '',
      quantity: 1,
      price: 0,
    },
  });

  useEffect(() => {
    if (itemsData) {
      setSelectedItems(itemsData);
    }
  }, [itemsData]);

  const fetchItems = async (searchTerm: string) => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .or(`descripcion.ilike.%${searchTerm}%,codigo.ilike.%${searchTerm}%,color.ilike.%${searchTerm}%,tamano.ilike.%${searchTerm}%,categoria.ilike.%${searchTerm}%`)

    if (data) {
      setFilteredItems(data);
    } else {
      console.error('Error fetching items:', error);
    }
  };

  const onSearch = (value: string) => {
    if (value.length >= 3) { // Fetch only if the search term has 3 or more characters
      fetchItems(value);
    } else {
      setFilteredItems([]);
    }
  };

  const onSelectItem = (item: Item) => {
    reset({ search: ''});
    setFilteredItems([]);
    setSelectedItems([...selectedItems, { ...item, cantidad: item.cantidad }]);
  };

  const onUpdateItem = (index: number, field: keyof Item, value: any) => {
    const updatedItems = selectedItems.map((item, idx) =>
      idx === index ? { ...item, [field]: value } : item
    );
    setSelectedItems(updatedItems);
  };

  const onSubmit = () => {
    updateFormData({ items: selectedItems });
    nextStep();
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <Controller
            name="search"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Search items"
                onChange={(e) => {
                  field.onChange(e);
                  onSearch(e.target.value);
                }}
              />
            )}
          />

          {filteredItems.length > 0 && (
            <ul className="dropdown">
              {filteredItems.map(item => (
                <li key={item.id} onClick={() => onSelectItem(item)}>
                  {item.descripcion}
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedItems.map((item, index) => (
          <div key={index} className="item-input">
            <div>{item.descripcion}</div>
            <Input
              type="number"
              placeholder="Quantity"
              value={item.cantidad}
              onChange={(e) => onUpdateItem(index, 'cantidad', e.target.value)}
            />
            <Input
              type="number"
              placeholder="Price"
              value={item.precio_unidad}
              onChange={(e) => onUpdateItem(index, 'precio_unidad', e.target.value)}
            />
          </div>
        ))}

        <div className="flex justify-between">
          <Button type="button" onClick={prevStep}>Back</Button>
          <Button type="submit">Next</Button>
        </div>
      </form>
    </div>
  );
};



//   const [items, setItems] = useState([{ descripcion: '', cantidad: 1, precio_unidad: 0 }]);

//   const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     const newItems = items.map((item, i) => (i === index ? { ...item, [name]: value } : item));
//     setItems(newItems);
//   };

//   const addItem = () => {
//     setItems([...items, { descripcion: '', cantidad: 1, precio_unidad: 0 }]);
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     updateFormData({ items });
//     nextStep();
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <h2>Items</h2>
//       {items.map((item, index) => (
//         <div key={index}>
//           <input
//             type="text"
//             name="descripcion"
//             placeholder="Description"
//             value={item.descripcion}
//             onChange={(e) => handleChange(index, e)}
//           />
//           <input
//             type="number"
//             name="cantidad"
//             placeholder="Quantity"
//             value={item.cantidad}
//             onChange={(e) => handleChange(index, e)}
//           />
//           <input
//             type="number"
//             name="precio_unidad"
//             placeholder="Unit Price"
//             value={item.precio_unidad}
//             onChange={(e) => handleChange(index, e)}
//           />
//         </div>
//       ))}
//       <button type="button" onClick={addItem}>Add Item</button>
//       <button type="button" onClick={prevStep}>Back</button>
//       <button type="submit">Next</button>
//     </form>
//   );
// };

export default ItemsForm;
