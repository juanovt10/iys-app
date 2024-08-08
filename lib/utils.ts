import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Item } from "@/types"
import { z } from 'zod';

// method to add more classes 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};


export const calculateTotals = (items: Item[]) => {
  const subtotal = items.reduce((total, item) => total + item.precio_unidad * item.cantidad, 0);

  const aiu20 = subtotal * 0.2; // AIU at 20% of subtotal
  const iva = aiu20 * 0.0475;   // IVA at 19% of 25% of AIU (which is 0.19/4 = 0.0475)
  const total = subtotal + aiu20 + iva;

  return { subtotal, aiu20, iva, total };
};

export const formatWithCommas = (number: number): string => {
  const roundedNumber = Math.round(number); // Round the number to the nearest whole number
  return roundedNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};


export const clientInfoSchema = z.object({
  nombre_empresa: z.string().min(10, "Company name is required").max(100, "Company name is too long"),
  direccion: z.string().min(10, "Address is required").max(100, "Address is too long"),
  telefono: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  nombre_contacto: z.string().min(4, "Contact name is required").max(50, "Contact name is too long"),
  nit: z.string().min(5, "NIT is required"),
});

export const remarksSchema = z.object({
  validez: z.string().min(1),
  anticipo: z.string().min(1),
  pagos: z.string().min(1),
  premarcado: z.string().min(1),
  tiempos: z.string().min(1),
  cambios: z.string().min(1),
  AIU: z.string().min(1),
})

