# Operations Module – README

A quick guide to the new **Projects** flow built on top of your quoting system. This documents the current UI + basic functionality, the minimal DB setup in Supabase, and how to run it locally.

---

## Overview

**Existing** (before this module)
- Authentication
- **Quotes (`cotizaciones`)** with clients & items
- Quote **revisions** (e.g., 100 rev1 → 100 rev2)
- Excel/PDF generation from quotes

**Added now**
- **Projects dashboard** – list projects
- **Create Project flow**
  - Pick from **latest** quotes only (one row per `numero`)
  - Name the project
  - Insert into `proyectos`
  - Preview quote items before creating (read-only)
- Refactor-friendly structure (page = server component; small client components for interactivity)

> For v1 we keep creation **manual and simple**: one row into `proyectos` linked to `cotizaciones.id`. Later we’ll add `project_items`, deliverables, cuts/invoicing, and change-order handling.

---

## Tech stack (relevant bits)

- **Next.js App Router** – server-first pages, client islands for interactive pieces
- **Supabase** – Postgres + RLS
- **shadcn/ui + Tailwind** – UI components and layout
- **lucide-react** – icons

---

## Directory structure (new/changed)

```
app/
  projects/
    page.tsx                      # Projects dashboard (list)
    create/
      page.tsx                    # Server component shell
      CreateProjectClient.tsx     # Client wrapper: state + insert
      QuotePicker.tsx             # Client: search + list of latest quotes
      ProjectForm.tsx             # Client: name input + selected quote + create
      QuoteItemsPreview.tsx       # Client: fetch & preview items for selected quote
hooks/
  useLatestQuotes.ts              # Client hook: fetch latest quotes (debounced) + sorting
lib/
  supabase/
    client.ts                     # createClient (Supabase browser client)
```

---

## Database objects

### 1) View: `latest_cotizaciones` (only latest revision per `numero`)

Ensures you never base a project on an old revision by mistake.

```sql
-- Optional but recommended index for speed
create index if not exists idx_cotizaciones_numero_rev
  on public.cotizaciones (numero, revision desc);

-- Keep original columns and APPEND items_count (so CREATE OR REPLACE works safely)
create or replace view public.latest_cotizaciones as
with ranked as (
  select
    c.id,
    c.numero,
    c.revision,
    c.cliente,
    c.items,         -- json or jsonb
    c.created_at,
    row_number() over (
      partition by c.numero
      order by c.revision desc, c.created_at desc
    ) as rn
  from public.cotizaciones c
)
select
  id,
  numero,
  revision,
  cliente,
  items,            -- kept for preview fallback
  created_at,
  case
    when items is null then 0
    when json_typeof(items) = 'array' then json_array_length(items)             -- if items is JSON
    -- when jsonb_typeof(items) = 'array' then jsonb_array_length(items::jsonb) -- if items is JSONB
    else 0
  end as items_count
from ranked
where rn = 1;
```

> **RLS reminder:** Views use the **underlying table’s** policies. Ensure your users can `SELECT` from `public.cotizaciones`.

### 2) Table: `proyectos` (minimal v1)

```sql
create table if not exists public.proyectos (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  status         text not null default 'active',   -- active | on_hold | completed | archived
  created_at     timestamptz not null default now(),
  cotizacion_id  bigint not null references public.cotizaciones(id) on delete restrict
);

create index if not exists idx_proyectos_created_at on public.proyectos(created_at desc);
create index if not exists idx_proyectos_status on public.proyectos(status);
create index if not exists idx_proyectos_cotizacion on public.proyectos(cotizacion_id);
```

### 3) Row-Level Security (RLS) policies

```sql
-- cotizaciones (for reading quotes and the latest_cotizaciones view)
alter table public.cotizaciones enable row level security;

create policy if not exists "cotizaciones_select_authenticated"
on public.cotizaciones
for select to authenticated
using (true);

-- proyectos (for creating & reading projects)
alter table public.proyectos enable row level security;

create policy if not exists "proyectos_insert_authenticated"
on public.proyectos
for insert to authenticated
with check (true);

create policy if not exists "proyectos_select_authenticated"
on public.proyectos
for select to authenticated
using (true);

grant usage on schema public to authenticated;
grant select on public.latest_cotizaciones to authenticated;
grant select, insert on public.proyectos to authenticated;
```

> Later, harden with `created_by uuid default auth.uid()` and owner-only policies.

---

## UI & data flow

### Create Project (UX)

1. **Header** – “Create project” + brief instruction.
2. **QuotePicker** (left column, fixed width)
   - Search by client name or exact `numero`
   - Only the **latest revision** shows (via `latest_cotizaciones`)
   - Renders `Quote {numero} · rev {n} · {itemsCount} items` + client
3. **ProjectForm** (right column, flexible)
   - Name input
   - Selected quote summary
   - **QuoteItemsPreview**: scrollable table with description, UOM, qty, unit price, total per line
   - Create button → inserts into `proyectos`

### Layout (Tailwind)

```jsx
<div className="mx-auto max-w-[1300px] p-4 md:p-6">
  <div className="mb-4 md:mb-6">
    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Create project</h1>
    <p className="text-sm text-muted-foreground">
      Please select the quote to base this project on and provide a name.
    </p>
  </div>

  <div className="grid gap-4 md:grid-cols-[360px_1fr] lg:grid-cols-[420px_1fr] xl:grid-cols-[480px_1fr]">
    {/* <QuotePicker /> (left) */}
    {/* <ProjectForm /> (right) */}
  </div>
</div>
```

---

## Hook: `useLatestQuotes`

- Debounced fetch (250ms) from **`latest_cotizaciones`**
- Selects small set of columns: `id, numero, revision, cliente, items_count, created_at`
- Maps to `LatestQuote` and sorts client-side

```ts
export function useLatestQuotes(initialQuery = "", initialSort: "recent"|"client"|"items_desc" = "recent") {
  const supabase = createClient();
  const [quotes, setQuotes] = useState<LatestQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<"recent"|"client"|"items_desc">(initialSort);
  const debounced = useDebounced(query, 250);

  const fetchLatestQuotes = useCallback(async (searchQuery = "") => {
    setLoading(true);
    let q = supabase
      .from("latest_cotizaciones")
      .select("id, numero, revision, cliente, items_count, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    const trimmed = searchQuery.trim();
    if (trimmed) {
      const n = Number(trimmed);
      q = Number.isNaN(n) ? q.ilike("cliente", `%${trimmed}%`) : q.eq("numero", n);
    }

    const { data, error } = await q;
    setLoading(false);
    if (error) { console.error(error.message); setQuotes([]); return; }

    setQuotes((data ?? []).map((r: any) => ({
      id: r.id,
      numero: Number(r.numero),
      revision: Number(r.revision),
      clientName: r.cliente,
      itemsCount: Number(r.items_count ?? 0),
      createdAt: r.created_at,
    })));
  }, [supabase]);

  useEffect(() => { fetchLatestQuotes(debounced); }, [fetchLatestQuotes, debounced]);

  const sorted = useMemo(() => {
    const rows = [...quotes];
    rows.sort((a, b) => {
      if (sort === "client") return a.clientName.localeCompare(b.clientName);
      if (sort === "items_desc") return b.itemsCount - a.itemsCount;
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
    return rows;
  }, [quotes, sort]);

  return { quotes: sorted, loading, query, setQuery, sort, setSort };
}
```

---

## Running locally

1. **Environment** (Next.js)

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

2. **Install & dev**

```bash
pnpm i
pnpm dev
# or: npm i && npm run dev
# or: yarn && yarn dev
```

3. **Open**: http://localhost:3000/projects/create

> Ensure you’re **authenticated** so RLS allows reading `cotizaciones` and inserting into `proyectos`.

---

## Common pitfalls

- **Multiple revisions showing** → You’re querying `cotizaciones`. Use `latest_cotizaciones`.
- **Search by number fails** → `numero` is numeric; use `eq('numero', n)` for numeric input.
- **No rows appear** → Missing `SELECT` policy on `cotizaciones` (view inherits from base table).
- **Insert blocked** → Missing `INSERT` policy on `proyectos`.
- **JSON vs JSONB** → If `items` is `json`, use `json_array_length`; for `jsonb`, use `jsonb_array_length(items::jsonb)`.
- **Infinite render loops** → Avoid prop→state mirrors. Use props directly, or memoize derived values.

---

## Roadmap (next steps)

- **Refactor**: break down presentational pieces (Row, ItemRow, Header) and extract shared UI.
- **Project items snapshot**: new `project_items` table filled from quote `items` on creation (or via RPC).
- **Deliverables & cuts**: schema + UI to track execution and invoicing.
- **RBAC/RLS**: restrict site managers to deliverables (no prices), PM/Finance approvals.
- **PDF/Excel hooks**: generate on cut approval/invoice.

---

## Appendix – Types

```ts
export type LatestQuote = {
  id: number | string;
  numero: number;
  revision: number;
  clientName: string;
  itemsCount: number;
  createdAt?: string;
};
```
