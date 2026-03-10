-- ============================================================
-- QR Dashboard v2 — Schema Migration
-- Run this in Supabase SQL Editor AFTER supabase-schema.sql
-- ============================================================

-- 1. QR Folders table
CREATE TABLE IF NOT EXISTS qr_folders (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name        text NOT NULL,
    color       text DEFAULT '#8B5CF6',
    parent_id   uuid REFERENCES qr_folders(id) ON DELETE CASCADE,
    position    integer DEFAULT 0,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now(),

    UNIQUE(user_id, name, parent_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_qr_folders_user_id ON qr_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_folders_parent_id ON qr_folders(parent_id);

-- Updated_at trigger (reuse existing function from profiles)
CREATE TRIGGER set_qr_folders_updated_at
    BEFORE UPDATE ON qr_folders
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- RLS
ALTER TABLE qr_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own folders"
    ON qr_folders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
    ON qr_folders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
    ON qr_folders FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
    ON qr_folders FOR DELETE
    USING (auth.uid() = user_id);

-- GRANTs
GRANT SELECT, INSERT, UPDATE, DELETE ON qr_folders TO authenticated;

-- 2. Add scan_count to qr_codes
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS scan_count integer DEFAULT 0;

-- 3. Add folder_id to qr_codes
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES qr_folders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_qr_codes_folder_id ON qr_codes(folder_id);
