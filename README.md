## Supabase backend overview (RLS & roles)

This app relies on Supabase Auth and Row Level Security (RLS). The client must always assume the database is the source of truth and never bypass these rules.

### Auth & identity
- Auth provider: Supabase Auth.
- App profile: `public.profiles` has a 1:1 relationship with `auth.users` and stores the app role.
  - Columns: `id uuid` (equals `auth.uid()`), `role text` in `{ 'admin', 'site_manager' }`.
- JWT claims are available in Postgres via `auth.uid()` and `current_setting('request.jwt.claims', true)`.

### Helper functions (used by policies)
```sql
create or replace function is_admin() returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function is_site_manager() returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'site_manager'
  );
$$;
```

### RLS status
- RLS enabled on: `proyectos`, `deliverables`, `deliverable_lines`, `items`, `cuts`, `cut_lines`, `clientes`, `categorias` (plus read‑only views if applicable).
- Example: `alter table public.proyectos enable row level security;`

### Role capabilities (effective permissions)
| Role | proyectos | deliverables | deliverable_lines | items | cuts / cut_lines | clientes / categorias | deliverable_* views |
| --- | --- | --- | --- | --- | --- | --- | --- |
| admin | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD |
| site_manager | R | C,R | C,R | – | – | – | R (if applicable) |

“R” = SELECT; “C” = INSERT. Omitted actions are not permitted. This is intentional: `site_manager` must not write to `items`, `cuts`, etc.

### Policy patterns (representative SQL)

`proyectos`
```sql
-- Admin: full access
create policy proyectos_admin_all on public.proyectos
using (is_admin()) with check (is_admin());

-- Site manager: read-only
create policy proyectos_sm_read on public.proyectos
for select using (is_site_manager());
```

`deliverables`
```sql
-- Admin: full access
create policy deliverables_admin_all on public.deliverables
using (is_admin()) with check (is_admin());

-- Site manager: create + read
create policy deliverables_sm_read on public.deliverables
for select using (is_site_manager());

create policy deliverables_sm_insert on public.deliverables
for insert with check (is_site_manager());
```

`deliverable_lines`
```sql
-- Admin: full access
create policy deliverable_lines_admin_all on public.deliverable_lines
using (is_admin()) with check (is_admin());

-- Site manager: create + read
create policy deliverable_lines_sm_read on public.deliverable_lines
for select using (is_site_manager());

create policy deliverable_lines_sm_insert on public.deliverable_lines
for insert with check (is_site_manager());
```

`items` (locked down for non‑admins)
```sql
create policy items_admin_all on public.items
using (is_admin()) with check (is_admin());
-- No site_manager policy: any write attempt returns 42501
```

### Known errors and meanings
- `42501` (RLS): “new row violates row-level security policy” → user lacks a matching policy.
- `23503` (FK): invalid reference (e.g., missing project or deliverable).
- `23505` (unique): duplicate data.
- Others/network → show a generic fallback.

### Frontend contract (defensive design)
- Never trust a client-side role alone.
- Fetch user on the server (`supabase.auth.getUser()`), then fetch `profiles.role` server-side and pass minimal role flags to the client.
- UI can hide/disable actions, but RLS still enforces on the DB.
- Route protection: unauthenticated users are redirected in `middleware.ts`. For role‑specific pages, check on the server before rendering.

#### Guarded UI affordances
- `site_manager`
  - Show: Proyectos list (read-only), Create Deliverable, Add Line Item.
  - Hide/disable: edit/delete for deliverables & lines (if policies remain C+R only).
  - Hide: anything that writes to `items`, `cuts`, etc.
- `admin`
  - Full CRUD across resources.

#### Optimistic UI
- For `site_manager`, avoid optimistic updates outside `deliverables`/`deliverable_lines`.
- If a forbidden action is triggered, expect `42501` and show: “No tienes permisos para realizar esta acción.”

### Data fetching strategy (Next.js App Router)
- Prefer Server Components/Route Handlers for queries & mutations; pass data to clients as props.
- Client Components should call Server Actions/Handlers when tighter control is needed (RLS still protects regardless).

### Role exposure to the client
- Provide a minimal `useSessionRole()` that is fed from a server query of `profiles.role`.
- Do not store role in `localStorage`; rely on session/cookies.

# Operations Module – README

A comprehensive guide to the **Projects** module built on top of your quoting system. This documents the current UI, functionality, database setup, and how all components work together.

---

## Overview

**Existing** (before this module)
- Authentication
- **Quotes (`cotizaciones`)** with clients & items
- Quote **revisions** (e.g., 100 rev1 → 100 rev2)
- Excel/PDF generation from quotes

**Added now**
- **Projects dashboard** – list and manage projects
- **Create Project flow** – link projects to quotes
- **Deliverables system** – track project execution with PDF/Excel generation
- **Cuts system** – manage project cuts/invoicing with PDF/Excel generation
- **Automatic status management** – projects auto-complete when final deliverable is created
- **Document generation** – automatic PDF/Excel creation for deliverables and cuts
- **Consistent UI patterns** – loading states, icons, and button styling across all creation flows

---

## Tech Stack

- **Next.js App Router** – server-first pages, client islands for interactive pieces
- **Supabase** – Postgres + RLS (Row Level Security)
- **shadcn/ui + Tailwind** – UI components and layout
- **lucide-react** – icons
- **Server Actions** – for database operations with proper permissions

---

## Directory Structure

```
app/(root)/projects/
├── page.tsx                      # Projects dashboard (list) - Server Component
├── ProjectsIndexClient.tsx       # Client wrapper for dashboard
├── ProjectsHeader.tsx            # Header with create button
├── ProjectsControls.tsx          # Search, filters, sorting controls
├── ProjectsTable.tsx             # Main projects table component
├── create/
│   ├── page.tsx                  # Server component shell
│   ├── CreateProjectClient.tsx   # Client wrapper: state + insert
│   ├── QuotePicker.tsx           # Search + list of latest quotes
│   ├── ProjectForm.tsx           # Name input + selected quote + create
│   └── QuoteItemsPreview.tsx     # Preview items for selected quote
└── [id]/                         # Individual project pages
    ├── page.tsx                  # Project detail page - Server Component
    ├── ProjectDetailClient.tsx   # Client wrapper for project detail
    ├── ProjectHeader.tsx         # Project header with status badge
    ├── StartGrid.tsx             # Stats grid (deliverables/cuts counts)
    ├── ExecutionCard.tsx         # Execution progress panel
    ├── ActivityCard.tsx          # Recent activity feed
    ├── deliverables/
    │   ├── page.tsx              # Deliverables list - Server Component
    │   ├── DeliverablesListClient.tsx # Client wrapper for deliverables
    │   ├── [deliverableId]/
    │   │   ├── page.tsx          # Deliverable detail - Server Component
    │   │   └── DeliverableDetailClient.tsx # Client wrapper with download
    │   └── new/
    │       ├── page.tsx          # Create deliverable - Server Component
    │       ├── DeliverableCreateClient.tsx # Client wrapper
    │       └── DeliverableItemsTable.tsx # Items table with quantities
    └── cuts/
        ├── page.tsx              # Cuts list - Server Component
        ├── CutsListClient.tsx    # Client wrapper for cuts list
        ├── new/
        │   ├── page.tsx          # Create cut - Server Component
        │   └── CreateCutClient.tsx # Client wrapper
        └── [cutId]/
            ├── page.tsx          # Cut detail - Server Component
            └── CutDetailClient.tsx # Client wrapper with download

hooks/
└── useLatestQuotes.ts            # Client hook: fetch latest quotes + sorting

components/
├── DeliverableDownloadButton.tsx # Reusable download component for deliverables
├── CutDownloadButton.tsx         # Reusable download component for cuts
└── ui/                          # shadcn/ui components

lib/
├── actions.ts                    # Server actions for database operations
└── supabase/
    ├── client.ts                 # createClient (Supabase browser client)
    ├── server.ts                 # createClient (Supabase server client)
    └── apiService.ts             # Document generation API functions

types/
└── index.d.ts                    # TypeScript type definitions
```

---

## Database Schema

### Core Tables

#### `proyectos` (Projects)
```sql
- id: bigint (primary key)
- name: text (project name)
- status: text (active, on_hold, completed, archived)
- cotizacion_id: bigint (foreign key to cotizaciones)
- created_at: timestamp
- updated_at: timestamp
```

#### `deliverables` (Project Deliverables)
```sql
- id: bigint (primary key)
- project_id: bigint (foreign key to proyectos)
- deliverable_no: integer (sequential number)
- is_final: boolean (marks final deliverable)
- excel_file: text (S3 URL for generated Excel file)
- pdf_file: text (S3 URL for generated PDF file)
- created_at: timestamp
- created_by: uuid (user who created it)
```

#### `deliverable_lines` (Deliverable Items)
```sql
- id: bigint (primary key)
- deliverable_id: bigint (foreign key to deliverables)
- item_id: bigint (foreign key to quote items)
- descripcion: text (item description)
- unidad: text (unit)
- qty: numeric (quantity executed)
```

#### `cuts` (Project Cuts)
```sql
- id: bigint (primary key)
- project_id: bigint (foreign key to proyectos)
- cut_no: integer (sequential number)
- is_final: boolean (marks final cut)
- excel_file: text (S3 URL for generated Excel file)
- pdf_file: text (S3 URL for generated PDF file)
- created_at: timestamp
```

#### `cut_deliverables` (Cut-Deliverable Links)
```sql
- cut_id: bigint (foreign key to cuts)
- deliverable_id: bigint (foreign key to deliverables)
```

### Views

#### `v_projects_dashboard`
```sql
-- Aggregates project data with counts and latest information
-- Used by projects dashboard and project detail pages
```

### RLS Policies

```sql
-- proyectos table policies
CREATE POLICY "proyectos_select_authenticated" ON proyectos FOR SELECT USING (true);
CREATE POLICY "proyectos_insert_authenticated" ON proyectos FOR INSERT WITH CHECK (true);
CREATE POLICY "proyectos_update_authenticated" ON proyectos FOR UPDATE USING (true) WITH CHECK (true);

-- deliverables table policies
-- cuts table policies
-- (similar structure for other tables)
```

---

## Component Breakdown

### 1. Projects Dashboard (`/projects`)

#### Server Component: `page.tsx`
- **Purpose**: Fetches project data and renders dashboard
- **Key Features**:
  - Queries `v_projects_dashboard` view
  - Calculates progress percentages for each project
  - Checks for final deliverables
  - Handles dynamic rendering with `dynamic = "force-dynamic"`
- **Data Flow**: Database → Server Component → Client Components

#### Client Component: `ProjectsIndexClient.tsx`
- **Purpose**: Manages dashboard state and filtering
- **Key Features**:
  - Search functionality (debounced)
  - Status filtering (Active/Completed only)
  - Sorting (by date, name, progress)
  - Progress calculation status indicator
- **State Management**:
  - `query`: Search term
  - `statusFilters`: Array of selected statuses
  - `sort`: Current sort method

#### Component: `ProjectsTable.tsx`
- **Purpose**: Renders the main projects table
- **Key Features**:
  - Status badges (Spanish labels)
  - Progress bars
  - Action dropdown menu
  - Disabled states for final deliverables
- **Props**: `projects[]`, `onArchiveProject?`

#### Component: `ProjectsControls.tsx`
- **Purpose**: Search and filter controls
- **Key Features**:
  - Search input
  - Status filter dropdown (Active/Completed only)
  - Sort options
- **Props**: `query`, `onQueryChange`, `statusFilters`, `onStatusFiltersChange`, `sort`, `onSortChange`

### 2. Project Creation (`/projects/create`)

#### Server Component: `create/page.tsx`
- **Purpose**: Server component shell for create flow
- **Key Features**:
  - Handles URL search parameters
  - Passes initial state to client component

#### Client Component: `CreateProjectClient.tsx`
- **Purpose**: Main create project interface
- **Key Features**:
  - Two-column layout (quote picker + project form)
  - URL synchronization for search/sort
  - Project creation with database insert
  - Hard refresh after creation
- **State Management**:
  - `selectedQuoteId`: Selected quote
  - `projectName`: Project name input
  - `creating`: Loading state

#### Component: `QuotePicker.tsx`
- **Purpose**: Quote selection interface
- **Key Features**:
  - Search and filter quotes
  - Shows latest quotes only
  - Preview selected quote details
- **Props**: `quotes[]`, `loading`, `query`, `sort`, `selectedId`, `onSelect`

#### Component: `ProjectForm.tsx`
- **Purpose**: Project details form
- **Key Features**:
  - Project name input
  - Selected quote preview
  - Create button with validation
- **Props**: `projectName`, `onNameChange`, `selectedQuote`, `canSubmit`, `creating`, `onCreate`

### 3. Project Detail (`/projects/[id]`)

#### Server Component: `[id]/page.tsx`
- **Purpose**: Fetches individual project data
- **Key Features**:
  - Queries project details
  - Fetches quote items (contracted scope)
  - Calculates execution progress
  - Loads deliverables and cuts data
  - Checks for final deliverables
  - Fetches recent activity
- **Data Flow**: Multiple database queries → Aggregated data → Client components

#### Client Component: `ProjectDetailClient.tsx`
- **Purpose**: Project detail interface
- **Key Features**:
  - Project header with status
  - Stats grid
  - Execution panel
  - Activity feed
- **Props**: `project`, `counts`, `activity`, `exec`

#### Component: `ProjectHeader.tsx`
- **Purpose**: Project header with actions
- **Key Features**:
  - Project name and metadata
  - Status badge (read-only)
  - Create deliverable button (disabled if final exists)
  - Create cut button
- **Props**: `project`

#### Component: `StartGrid.tsx`
- **Purpose**: Statistics grid
- **Key Features**:
  - Deliverables count with link
  - Cuts count with link
  - Progress percentage
- **Props**: `deliverables`, `cuts`, `links`

#### Component: `ExecutionCard.tsx`
- **Purpose**: Project execution progress
- **Key Features**:
  - Overall progress bar
  - Items vs deliverables table
  - Extra quantities column (when applicable)
- **Props**: `progressPct`, `deliverables`, `rows`

### 4. Deliverables System

#### Server Component: `[id]/deliverables/page.tsx`
- **Purpose**: Deliverables list page
- **Key Features**:
  - Fetches all deliverables for project
  - Aggregates line items
  - Checks for final deliverables
  - Fetches file URLs for downloads
  - Redirects if final deliverable exists

#### Client Component: `DeliverablesListClient.tsx`
- **Purpose**: Deliverables list interface
- **Key Features**:
  - List of deliverables with download buttons
  - Create button (disabled if final exists)
  - Preview of items in each deliverable
  - On-demand document generation

#### Server Component: `[id]/deliverables/[deliverableId]/page.tsx`
- **Purpose**: Individual deliverable detail page
- **Key Features**:
  - Fetches deliverable details
  - Loads project and client information
  - Fetches file URLs for downloads

#### Client Component: `DeliverableDetailClient.tsx`
- **Purpose**: Deliverable detail interface
- **Key Features**:
  - Deliverable information display
  - Download button with generation capability
  - Items table with quantities
  - Automatic document generation on creation

#### Server Component: `[id]/deliverables/new/page.tsx`
- **Purpose**: Create deliverable page
- **Key Features**:
  - Fetches project and quote data
  - Redirects if final deliverable exists
  - Passes data to client component

#### Client Component: `DeliverableCreateClient.tsx`
- **Purpose**: Create deliverable interface
- **Key Features**:
  - Items table with quantity inputs
  - Progress calculation
  - Final deliverable dialog (if >50% progress)
  - Automatic project status update
- **State Management**:
  - `rows`: Items with quantities
  - `isFinalDeliverable`: Final deliverable flag
  - `showFinalDialog`: Dialog state
  - `saving`: Loading state

#### Component: `DeliverableItemsTable.tsx`
- **Purpose**: Items table for deliverable creation
- **Key Features**:
  - Shows contracted vs executed quantities
  - Blue feedback for extra quantities
  - "Cantidades Mayores" column (when applicable)
  - Input validation
- **Props**: `rows[]`, `onQtyChange`

### 5. Cuts System

#### Server Component: `[id]/cuts/page.tsx`
- **Purpose**: Cuts list page
- **Key Features**:
  - Fetches all cuts for project
  - Aggregates deliverables per cut
  - Fetches file URLs for downloads

#### Client Component: `CutsListClient.tsx`
- **Purpose**: Cuts list interface
- **Key Features**:
  - List of cuts with download buttons
  - Create button
  - On-demand document generation

#### Server Component: `[id]/cuts/[cutId]/page.tsx`
- **Purpose**: Individual cut detail page
- **Key Features**:
  - Fetches cut details
  - Loads project and client information
  - Fetches file URLs for downloads

#### Client Component: `CutDetailClient.tsx`
- **Purpose**: Cut detail interface
- **Key Features**:
  - Cut information display
  - Download button with generation capability
  - Items table with quantities and prices
  - Automatic document generation on creation

#### Server Component: `[id]/cuts/new/page.tsx`
- **Purpose**: Create cut page
- **Key Features**:
  - Fetches available deliverables
  - Filters out already-used deliverables
  - Redirects if final deliverable exists

#### Client Component: `CreateCutClient.tsx`
- **Purpose**: Create cut interface
- **Key Features**:
  - Deliverable selection
  - Final cut handling
  - Database insert with relationships
  - Automatic document generation
- **Props**: `projectId`, `deliverables[]`

---

## Key Behaviors

### 1. Project Status Management

#### Automatic Status Updates
- **Trigger**: Final deliverable creation
- **Action**: Project status changes from "active" to "completed"
- **Implementation**: Server action `updateProjectStatusToCompleted()`
- **Location**: `lib/actions.ts`

#### Status Display
- **Badges**: Spanish labels ("Activo", "Completado")
- **Filters**: Only "Activo" and "Completado" available
- **Default**: Shows both active and completed projects

### 2. Final Deliverable Behavior

#### Creation Flow
1. User creates deliverable
2. If project >50% progress → Show final deliverable dialog
3. If marked as final:
   - Set `is_final: true` in database
   - Update project status to "completed"
   - Show success message
   - Redirect to project page

#### Post-Creation Restrictions
- **Create buttons**: Disabled across all pages
- **Direct URL access**: Redirects back to project page
- **Visual indicators**: Green notification banner
- **Dropdown menus**: Show disabled state

### 3. Progress Calculation

#### Execution Progress
- **Formula**: `(executed / contracted) * 100`
- **Capping**: Cannot exceed 100% per item
- **Timeout**: 5-second timeout for calculation
- **Fallback**: 0% if calculation fails

#### Extra Quantities
- **Display**: Blue feedback below input fields
- **Column**: "Cantidades Mayores" appears when existing extras
- **Positioning**: Between "Restante" and input field

### 4. Data Flow Patterns

#### Server → Client Pattern
1. **Server Component**: Fetches data from database
2. **Props**: Passes data to client components
3. **Client Component**: Handles interactivity and state
4. **Server Actions**: Handle mutations with proper permissions

#### State Management
- **Local State**: Component-level state (forms, dialogs)
- **URL State**: Search parameters, filters
- **Server State**: Database as source of truth
- **Cache**: Next.js automatic caching with revalidation

---

## Document Generation System

### Overview
The projects module includes comprehensive PDF/Excel generation for deliverables and cuts, following the same pattern as the existing quote system. Documents are automatically generated when items are created and can be downloaded on-demand.

### Architecture

#### API Service (`lib/supabase/apiService.ts`)
- **`buildDeliverableAPIData()`** - Composes JSON data for deliverable documents
- **`getDeliverableAPIFiles()`** - Sends data to `/api/deliverables` endpoint
- **`saveDeliverableData()`** - Saves generated file URLs to database
- **`buildCutAPIData()`** - Composes JSON data for cut documents
- **`getCutAPIFiles()`** - Sends data to `/api/cuts` endpoint
- **`saveCutData()`** - Saves generated file URLs to database

#### JSON Data Structure

**Deliverables:**
```json
{
  "deliverableId": "1-113",
  "projectName": "Project Name",
  "clientInfo": { /* complete client data */ },
  "items": [
    {
      "id": 123,
      "descripcion": "Item description",
      "unidad": "unit",
      "cantidad": 5
    }
  ]
}
```

**Cuts:**
```json
{
  "cutId": "1-113",
  "projectName": "Project Name", 
  "clientInfo": { /* complete client data */ },
  "items": [
    {
      "id": 0,
      "descripcion": "Item description",
      "unidad": "unit",
      "cantidad": 5,
      "precio_unidad": 100.00
    }
  ]
}
```

### Document Generation Flow

#### 1. Automatic Generation (On Creation)
- **Deliverables**: Documents generated immediately after deliverable creation
- **Cuts**: Documents generated immediately after cut creation
- **Error Handling**: Creation succeeds even if document generation fails

#### 2. On-Demand Generation
- **Download Buttons**: Show "Generar Documentos" if files don't exist
- **Loading States**: Spinner and disabled state during generation
- **Success Feedback**: Button changes to "Descargar" after generation

#### 3. File Storage & Access
- **S3 Storage**: Files stored via external API
- **Proxy URLs**: Access via `NEXT_PUBLIC_S3_PROXY_API_URL`
- **Database Storage**: File URLs saved in `excel_file` and `pdf_file` columns

### UI Components

#### Download Components
- **`DeliverableDownloadButton.tsx`** - Reusable download component for deliverables
- **`CutDownloadButton.tsx`** - Reusable download component for cuts
- **Features**:
  - Smart button text ("Descargar" vs "Generar Documentos")
  - Modal dialog with Excel/PDF download options
  - Loading states and error handling
  - Consistent styling with `size="sm"`

#### Integration Points
- **Deliverable Detail Page** - Download button in header
- **Deliverables List** - Download button in each row
- **Cut Detail Page** - Download button in header  
- **Cuts List** - Download button in each row

### Environment Variables
```env
NEXT_PUBLIC_DEPLOYED_API_URL=https://your-api.com
NEXT_PUBLIC_S3_PROXY_API_URL=https://your-s3-proxy.com
```

### Database Updates Required
```sql
-- Add file columns to deliverables table
ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS excel_file TEXT;
ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS pdf_file TEXT;

-- Add file columns to cuts table  
ALTER TABLE cuts ADD COLUMN IF NOT EXISTS excel_file TEXT;
ALTER TABLE cuts ADD COLUMN IF NOT EXISTS pdf_file TEXT;
```

---

## API Integration Points

### Current API Structure
- **Database**: Direct Supabase queries
- **Server Actions**: `lib/actions.ts` for mutations
- **Client Hooks**: `hooks/useLatestQuotes.ts` for data fetching

### PDF Generation Integration

#### Where to Add PDF API Calls

1. **Project Detail Page** (`[id]/page.tsx`)
   - Add PDF generation for project summary
   - Include execution progress
   - Show download button in header

2. **Deliverables List** (`[id]/deliverables/page.tsx`)
   - Add PDF generation for individual deliverables
   - Include quantities and progress
   - Show download button per deliverable

3. **Cuts List** (`[id]/cuts/page.tsx`)
   - Add PDF generation for cuts
   - Include linked deliverables
   - Show download button per cut

#### Implementation Pattern

```typescript
// Server Action for PDF generation
export async function generateProjectPDF(projectId: string) {
  const supabase = createClient()
  
  // Fetch project data
  const { data: project } = await supabase
    .from("v_projects_dashboard")
    .select("*")
    .eq("id", projectId)
    .single()
  
  // Call PDF generation API
  const response = await fetch('/api/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project, type: 'project-summary' })
  })
  
  return response.blob()
}
```

#### Download Button Structure

```typescript
// In ProjectHeader.tsx or similar
<Button 
  onClick={async () => {
    const blob = await generateProjectPDF(project.id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `project-${project.id}.pdf`
    a.click()
  }}
>
  <Download className="h-4 w-4" /> Descargar PDF
</Button>
```

---

## UI/UX Improvements

### Consistent Loading States
All creation buttons now follow the same loading pattern established in the project creation flow:

#### Loading Button Pattern
```tsx
<Button onClick={onCreate} disabled={!canSubmit || creating}>
  {creating ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Creando…
    </>
  ) : "Button Text"}
</Button>
```

#### Applied To:
- **Crear Proyecto** (main projects dashboard)
- **Nueva Acta de Entrega** (project dashboard)
- **Nuevo Corte** (project dashboard)
- **Crear Acta de Entrega** (deliverables form)

### Consistent Iconography
All creation buttons now use consistent icons matching the main projects dashboard table actions:

#### Icon Usage:
- **Deliverables**: `FileText` icon (📄)
- **Cuts**: `Scissors` icon (✂️)

#### Applied To:
- **Project Dashboard** (`ProjectHeader.tsx`)
- **Deliverables Page** (`deliverables/page.tsx`)
- **Cuts Page** (`cuts/page.tsx`)
- **Main Projects Table** (already had correct icons)

### Button Height Consistency
Fixed height inconsistencies in table rows by standardizing button sizes:

#### Implementation:
- **Download Buttons**: Now use `size="sm"` to match "Ver" buttons
- **Consistent Spacing**: All action buttons in tables have uniform height
- **Better Alignment**: Improved visual hierarchy in list views

### Reusable Components
Created reusable download components for consistent behavior:

#### `DeliverableDownloadButton.tsx` & `CutDownloadButton.tsx`
- **Smart Button Text**: "Descargar" vs "Generar Documentos"
- **Modal Dialogs**: Excel/PDF download options
- **Loading States**: Spinner during generation
- **Error Handling**: Graceful failure handling
- **Consistent Styling**: `size="sm"` for table integration

---

## Error Handling

### Database Errors
- **Soft Failures**: Show empty states instead of crashing
- **Timeout Protection**: 5-second timeouts for complex queries
- **Fallback Values**: Default to safe values (0, empty arrays)

### User Feedback
- **Toast Notifications**: Success/error messages
- **Loading States**: Disabled buttons during operations
- **Validation**: Form validation with clear error messages

### Debugging
- **Console Logging**: Detailed logs for database operations
- **Error Boundaries**: Catch and display errors gracefully
- **Type Safety**: TypeScript for compile-time error detection

---

## Performance Considerations

### Database Optimization
- **Indexes**: On frequently queried columns
- **Views**: `v_projects_dashboard` for complex aggregations
- **Pagination**: For large datasets (future enhancement)

### Client Optimization
- **Debouncing**: Search inputs (250ms delay)
- **Memoization**: Expensive calculations with `useMemo`
- **Lazy Loading**: Components loaded on demand

### Caching Strategy
- **Next.js Cache**: Automatic caching with revalidation
- **Server Actions**: Proper cache invalidation
- **Dynamic Rendering**: Force fresh data when needed

---

## Future Enhancements

### Completed Features ✅
1. **PDF/Excel Generation**: Deliverables and cuts with automatic generation
2. **Consistent UI Patterns**: Loading states, icons, and button styling
3. **Reusable Components**: Download buttons with modal dialogs
4. **Document Management**: S3 storage and proxy access

### Planned Features
1. **Email Notifications**: Status change alerts
2. **Advanced Filtering**: Date ranges, progress thresholds
3. **Bulk Operations**: Mass status updates
4. **Audit Trail**: Detailed activity logging
5. **Project PDF Generation**: Project summaries and reports

### Technical Improvements
1. **Real-time Updates**: Supabase subscriptions
2. **Offline Support**: Service worker caching
3. **Mobile Optimization**: Responsive design improvements
4. **Accessibility**: ARIA labels and keyboard navigation

---

## Troubleshooting

### Common Issues

#### Status Not Updating
1. **Check RLS Policies**: Ensure UPDATE policy exists
2. **Verify Server Action**: Check console for error messages
3. **Database Permissions**: Confirm authenticated role has UPDATE access

#### Progress Not Calculating
1. **Check Timeout**: Look for timeout errors in console
2. **Verify Data**: Ensure quote items and deliverables exist
3. **Database Queries**: Check if views are returning expected data

#### Final Deliverable Issues
1. **Database Column**: Ensure `is_final` column exists
2. **RLS Policies**: Check INSERT/UPDATE permissions
3. **Redirect Logic**: Verify redirect conditions

#### Document Generation Issues
1. **API Endpoints**: Verify `NEXT_PUBLIC_DEPLOYED_API_URL` is correct
2. **S3 Proxy**: Check `NEXT_PUBLIC_S3_PROXY_API_URL` configuration
3. **Database Columns**: Ensure `excel_file` and `pdf_file` columns exist
4. **File URLs**: Check if generated URLs are accessible
5. **Console Logs**: Look for API data structure in browser console

### Debug Commands

```sql
-- Check project status
SELECT id, name, status FROM proyectos WHERE id = YOUR_PROJECT_ID;

-- Check final deliverables
SELECT id, project_id, is_final FROM deliverables WHERE project_id = YOUR_PROJECT_ID;

-- Check document files
SELECT id, excel_file, pdf_file FROM deliverables WHERE project_id = YOUR_PROJECT_ID;
SELECT id, excel_file, pdf_file FROM cuts WHERE project_id = YOUR_PROJECT_ID;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'proyectos';
```

---

This comprehensive guide should help you understand the entire projects module and make future modifications with confidence. The modular structure and clear separation of concerns make it easy to add new features like PDF generation while maintaining the existing functionality.
