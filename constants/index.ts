export const sidebarLinks = [
  {
    imgURL: "/icons/home.svg",
    route: "/",
    label: "Inicio",
  },
  {
    imgURL: "/icons/quotes.svg",
    route: "/quotes",
    label: "Cotizaciones",
  },
  {
    imgURL: "/icons/design.svg",
    route: "/designs",
    label: "Diseños",
  },
  {
    imgURL: "/icons/inventory.svg",
    route: "/inventory",
    label: "Inventario",
  },
  {
    imgURL: "/icons/settings.svg",
    route: "/settings",
    label: "Ajustes",
  },
];

export const mockQuoteData = [
  {
    id: 1,
    client: 'Client A',
    items: [
      { description: 'Item 1', quantity: 2, price: 50 },
      { description: 'Item 2', quantity: 1, price: 100 },
    ],
    total: 200,
    updated_at: '2024-08-07T12:34:56',
    created_at: '2024-08-05T09:21:34',
  },
  {
    id: 2,
    client: 'Client B',
    items: [
      { description: 'Item 1', quantity: 1, price: 75 },
      { description: 'Item 2', quantity: 3, price: 150 },
    ],
    total: 525,
    updated_at: '2024-08-07T11:00:00',
    created_at: '2024-08-06T10:15:00',
  },
];