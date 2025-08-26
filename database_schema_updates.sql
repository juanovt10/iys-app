-- Database Schema Updates for IYS App
-- Run these SQL commands in your Supabase SQL editor

-- 1. Add is_final column to deliverables table
ALTER TABLE deliverables 
ADD COLUMN IF NOT EXISTS is_final BOOLEAN DEFAULT FALSE;

-- 2. Add is_final column to cuts table
ALTER TABLE cuts 
ADD COLUMN IF NOT EXISTS is_final BOOLEAN DEFAULT FALSE;

-- 3. Create index for better performance on final deliverables lookup
CREATE INDEX IF NOT EXISTS idx_deliverables_is_final 
ON deliverables(project_id, is_final) 
WHERE is_final = true;

-- 4. Create index for better performance on final cuts lookup
CREATE INDEX IF NOT EXISTS idx_cuts_is_final 
ON cuts(project_id, is_final) 
WHERE is_final = true;

-- 5. Update the v_projects_dashboard view to include final deliverable information
-- (This assumes the view exists - you may need to recreate it)
-- Note: You'll need to update your existing view definition to include this logic

-- 6. Ensure RLS policies allow updates to the new columns
-- (These should already exist if you have RLS enabled)

-- 7. Grant necessary permissions
GRANT UPDATE ON deliverables TO authenticated;
GRANT UPDATE ON cuts TO authenticated;

-- 8. Optional: Add a constraint to ensure only one final deliverable per project
-- (Uncomment if you want this constraint)
-- ALTER TABLE deliverables 
-- ADD CONSTRAINT unique_final_deliverable_per_project 
-- UNIQUE (project_id, is_final) 
-- WHERE is_final = true;

-- 9. Optional: Add a constraint to ensure only one final cut per project
-- (Uncomment if you want this constraint)
-- ALTER TABLE cuts 
-- ADD CONSTRAINT unique_final_cut_per_project 
-- UNIQUE (project_id, is_final) 
-- WHERE is_final = true;

-- 10. Update existing project_activity table to include is_final in meta
-- (This is handled by the application code, but ensure the table can store this data)
-- The meta column should be JSONB to support the is_final flag

-- Verification queries:
-- Check if columns were added successfully
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'deliverables' AND column_name = 'is_final';

SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'cuts' AND column_name = 'is_final';

-- Check if indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('deliverables', 'cuts') 
AND indexname LIKE '%is_final%';
