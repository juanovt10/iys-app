export interface Quote {
  id?: number;
  numero?: number;
  items: Item[];
  created_at?: Date;
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
  revision: number;
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
  telefono: number;
  email: string;
  nombre_contacto: string;
  nombre_empresa: string;
  nit: number;
}

export type ProjectStatus = "active" | "on_hold" | "completed" | "archived";

export type ProjectRow = {
  id: string;
  name: string;
  clientName: string;
  quoteId: string;
  activeRevision: number;
  status: ProjectStatus;
  deliverablesCount: number; // placeholders for now
  cutsCount: number;         // placeholders for now
  deliveredPercent: number;  // placeholders for now
  updatedAt: string;         // ISO
};

export type ProjectQuote = {
  id: string | number;
  numero: number;
  revision: number;
  clientName: string;
  itemsCount: number;
};


export type ProjectStatus = "active" | "on_hold" | "completed" | "archived";

export type ProjectSummary = {
  id: string;
  name: string;
  status: ProjectStatus;
  clientName: string;
  quoteNumero: string;
  revisionShown: number;
  itemsCount: number;
  createdAt: string;
};

export type ProjectCounts = {
  deliverables: number;
  cuts: number;
  progressPct: number;
};

export type ActivityItem = {
  event_type: string;
  occurred_at: string;
  detail?: string;
};
