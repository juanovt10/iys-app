export interface Quote {
  id: number;
  items: Item[];
  created_at: Date;
  cliente: string;
  excel_file: string;
  pdf_file: string;
  remarks: Array<{
    validez: string;
    anticipo: string;
    pagos: string;
    premarcado: string;
    tiempos: string;
    cambios: string;
    AIU: string;
  }>
}

export interface Item {
  id: number;
  unidad: string;
  descripcion: string;
  precio_unidad: number;
  codigo: string;
  tamano: string;
  color: string;
  forma: string;
  imagen: string;
  categoria: string;
  cantidad: number;
}

export interface Client {
  id: string;
  direccion: string;
  telefono: string;
  email: string;
  nombre_contacto: string;
  nombre_empresa: string;
  nit: string;
}