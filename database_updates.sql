-- Add excel_file and pdf_file columns to deliverables table
ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS excel_file TEXT;
ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS pdf_file TEXT;

-- Add excel_file and pdf_file columns to cuts table (for future implementation)
ALTER TABLE cuts ADD COLUMN IF NOT EXISTS excel_file TEXT;
ALTER TABLE cuts ADD COLUMN IF NOT EXISTS pdf_file TEXT;
