// ItemsForm.tsx

import { useState } from 'react';

const ItemsForm = ({ nextStep, prevStep, updateFormData }: any) => {
  const [items, setItems] = useState([{ descripcion: '', cantidad: 1, precio_unidad: 0 }]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newItems = items.map((item, i) => (i === index ? { ...item, [name]: value } : item));
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { descripcion: '', cantidad: 1, precio_unidad: 0 }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFormData({ items });
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Items</h2>
      {items.map((item, index) => (
        <div key={index}>
          <input
            type="text"
            name="descripcion"
            placeholder="Description"
            value={item.descripcion}
            onChange={(e) => handleChange(index, e)}
          />
          <input
            type="number"
            name="cantidad"
            placeholder="Quantity"
            value={item.cantidad}
            onChange={(e) => handleChange(index, e)}
          />
          <input
            type="number"
            name="precio_unidad"
            placeholder="Unit Price"
            value={item.precio_unidad}
            onChange={(e) => handleChange(index, e)}
          />
        </div>
      ))}
      <button type="button" onClick={addItem}>Add Item</button>
      <button type="button" onClick={prevStep}>Back</button>
      <button type="submit">Next</button>
    </form>
  );
};

export default ItemsForm;
