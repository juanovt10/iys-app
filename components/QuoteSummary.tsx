import { calculateTotals, formatWithCommas } from '@/lib/utils';
import React from 'react'

const QuoteSummary = ({ quoteData }: any) => {
  const { client, items, remarks } = quoteData;
  const { subtotal, aiu20, iva, total } = calculateTotals(items);
  
  return (
    <>
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Informacion del Cliente</h3>
        <div className="space-y-2">
          <p><strong>Nombre Empresa:</strong> {client.nombre_empresa}</p>
          <p><strong>Persona de contacto:</strong> {client.nombre_contacto}</p>
          <p><strong>Telefono:</strong> {client.telefono}</p>
          <p><strong>Email:</strong> {client.email}</p>
          <p><strong>NIT:</strong> {client.nit}</p>
          <p><strong>Direccion:</strong> {client.direccion}</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Items</h3>
        {items.map((item: any, index: number) => (
          <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg shadow-sm">
            <p><strong>Descripcion:</strong> {item.descripcion}</p>
            <p><strong>Cantidad:</strong> {formatWithCommas(item.cantidad)}</p>
            <p><strong>Precio por unidad:</strong> ${formatWithCommas(item.precio_unidad)}</p>
          </div>
        ))}
      </div>
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Totales</h3>
        <div className="space-y-2">
          <p><strong>Subtotal:</strong> ${formatWithCommas(subtotal)}</p>
          <p><strong>AIU (20%):</strong> ${formatWithCommas(aiu20)}</p>
          <p><strong>IVA:</strong> ${formatWithCommas(iva)}</p>
          <p><strong>Total:</strong> ${formatWithCommas(total)}</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Remarks</h3>
        <div className="space-y-2">
          <p><strong>Validez:</strong> {remarks.validez}</p>
          <p><strong>Anticipo:</strong> {remarks.anticipo}</p>
          <p><strong>Pagos:</strong> {remarks.pagos}</p>
          <p><strong>Premarcado:</strong> {remarks.premarcado}</p>
          <p><strong>Tiempos:</strong> {remarks.tiempos}</p>
          <p><strong>Cambios:</strong> {remarks.cambios}</p>
          <p><strong>AIU:</strong> {remarks.AIU}</p>
        </div>
      </div>
    </>
  )
}

export default QuoteSummary