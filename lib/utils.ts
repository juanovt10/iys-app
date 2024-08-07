import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Item } from "@/types"

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



