// components/ReviewForm.tsx

import React from 'react';

const ReviewForm = ({ nextStep, prevStep, formData }: any) => {
  const { client, items, remarks } = formData;

  return (
    <div>
      <h2>Review Your Quote</h2>

      <div className="review-section">
        <h3>Client Information</h3>
        <p><strong>Company Name:</strong> {client.nombre_empresa}</p>
        <p><strong>Address:</strong> {client.direccion}</p>
        <p><strong>Phone:</strong> {client.telefono}</p>
        <p><strong>Email:</strong> {client.email}</p>
        <p><strong>Contact Name:</strong> {client.nombre_contacto}</p>
        <p><strong>NIT:</strong> {client.nit}</p>
      </div>

      <div className="review-section">
        <h3>Items</h3>
        {items.map((item: any, index: number) => (
          <div key={index}>
            <p><strong>Description:</strong> {item.descripcion}</p>
            <p><strong>Quantity:</strong> {item.cantidad}</p>
            <p><strong>Unit Price:</strong> {item.precio_unidad}</p>
          </div>
        ))}
      </div>

      <div className="review-section">
        <h3>Remarks</h3>
        <p><strong>Validez:</strong> {remarks.validez}</p>
        <p><strong>Anticipo:</strong> {remarks.anticipo}</p>
        <p><strong>Pagos:</strong> {remarks.pagos}</p>
        <p><strong>Premarcado:</strong> {remarks.premarcado}</p>
        <p><strong>Tiempos:</strong> {remarks.tiempos}</p>
        <p><strong>Cambios:</strong> {remarks.cambios}</p>
        <p><strong>AIU:</strong> {remarks.AIU}</p>
      </div>

      <button type="button" onClick={prevStep}>Back</button>
      <button type="button" onClick={nextStep}>Submit</button>
    </div>
  );
};

export default ReviewForm;
