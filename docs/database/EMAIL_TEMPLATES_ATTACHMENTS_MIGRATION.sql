-- ============================================================================
-- EMAIL TEMPLATES ATTACHMENTS MIGRATION
-- Adds attachments column for storing inline images, links, and file attachments
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add attachments column to email_templates
ALTER TABLE email_templates 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the column structure
COMMENT ON COLUMN email_templates.attachments IS 'JSON array of attachments. Structure:
[
  {
    "id": "att_1234567890",
    "type": "image" | "link" | "file",
    "name": "Product Image",
    "url": "https://example.com/image.jpg",
    "cid": "img_1234567890" -- for inline images
  }
]';

-- Create index for JSON queries on attachments
CREATE INDEX IF NOT EXISTS idx_email_templates_attachments 
ON email_templates USING gin(attachments);
