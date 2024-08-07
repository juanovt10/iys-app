// RemarksForm.tsx

import { useState } from 'react';

const RemarksForm = ({ nextStep, prevStep, updateFormData }: any) => {
  const [remarks, setRemarks] = useState({
    validez: '',
    anticipo: '',
    pagos: '',
    premarcado: '',
    tiempos: '',
    cambios: '',
    AIU: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRemarks({ ...remarks, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFormData({ remarks });
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Remarks</h2>
      <input
        type="text"
        name="validez"
        placeholder="Validez"
        value={remarks.validez}
        onChange={handleChange}
      />
      <input
        type="text"
        name="anticipo"
        placeholder="Anticipo"
        value={remarks.anticipo}
        onChange={handleChange}
      />
      <input
        type="text"
        name="pagos"
        placeholder="Pagos"
        value={remarks.pagos}
        onChange={handleChange}
      />
      <input
        type="text"
        name="premarcado"
        placeholder="Premarcado"
        value={remarks.premarcado}
        onChange={handleChange}
      />
      <input
        type="text"
        name="tiempos"
        placeholder="Tiempos"
        value={remarks.tiempos}
        onChange={handleChange}
      />
      <input
        type="text"
        name="cambios"
        placeholder="Cambios"
        value={remarks.cambios}
        onChange={handleChange}
      />
      <input
        type="text"
        name="AIU"
        placeholder="AIU"
        value={remarks.AIU}
        onChange={handleChange}
      />
      <button type="button" onClick={prevStep}>Back</button>
      <button type="submit">Next</button>
    </form>
  );
};

export default RemarksForm;
