// ClientInfoForm.tsx

import { useState } from 'react';

const ClientInfoForm = ({ nextStep, updateFormData }: any) => {
  const [client, setClient] = useState({
    nombre_empresa: '',
    direccion: '',
    telefono: '',
    email: '',
    nombre_contacto: '',
    nit: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClient({ ...client, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFormData({ client });
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Client Information</h2>
      <input
        type="text"
        name="nombre_empresa"
        placeholder="Company Name"
        value={client.nombre_empresa}
        onChange={handleChange}
      />
      <input
        type="text"
        name="direccion"
        placeholder="Address"
        value={client.direccion}
        onChange={handleChange}
      />
      <input
        type="text"
        name="telefono"
        placeholder="Phone"
        value={client.telefono}
        onChange={handleChange}
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={client.email}
        onChange={handleChange}
      />
      <input
        type="text"
        name="nombre_contacto"
        placeholder="Contact Name"
        value={client.nombre_contacto}
        onChange={handleChange}
      />
      <input
        type="text"
        name="nit"
        placeholder="NIT"
        value={client.nit}
        onChange={handleChange}
      />
      <button type="submit">Next</button>
    </form>
  );
};

export default ClientInfoForm;
