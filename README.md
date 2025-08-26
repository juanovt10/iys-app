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
- **Deliverables system** – track project execution
- **Cuts system** – manage project cuts/invoicing
- **Automatic status management** – projects auto-complete when final deliverable is created

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
    │   └── new/
    │       ├── page.tsx          # Create deliverable - Server Component
    │       ├── DeliverableCreateClient.tsx # Client wrapper
    │       └── DeliverableItemsTable.tsx # Items table with quantities
    └── cuts/
        ├── page.tsx              # Cuts list - Server Component
        ├── new/
        │   ├── page.tsx          # Create cut - Server Component
        │   └── CreateCutClient.tsx # Client wrapper
        └── [cutId]/
            └── page.tsx          # Individual cut detail

hooks/
└── useLatestQuotes.ts            # Client hook: fetch latest quotes + sorting

lib/
├── actions.ts                    # Server actions for database operations
└── supabase/
    ├── client.ts                 # createClient (Supabase browser client)
    └── server.ts                 # createClient (Supabase server client)

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
  - Redirects if final deliverable exists

#### Client Component: `DeliverablesListClient.tsx`
- **Purpose**: Deliverables list interface
- **Key Features**:
  - List of deliverables
  - Create button (disabled if final exists)
  - Preview of items in each deliverable

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

### Planned Features
1. **PDF Generation**: Project summaries and deliverables
2. **Email Notifications**: Status change alerts
3. **Advanced Filtering**: Date ranges, progress thresholds
4. **Bulk Operations**: Mass status updates
5. **Audit Trail**: Detailed activity logging

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

### Debug Commands

```sql
-- Check project status
SELECT id, name, status FROM proyectos WHERE id = YOUR_PROJECT_ID;

-- Check final deliverables
SELECT id, project_id, is_final FROM deliverables WHERE project_id = YOUR_PROJECT_ID;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'proyectos';
```

---

This comprehensive guide should help you understand the entire projects module and make future modifications with confidence. The modular structure and clear separation of concerns make it easy to add new features like PDF generation while maintaining the existing functionality.
