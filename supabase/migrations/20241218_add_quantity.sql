-- Migration: Add quantity column to borrowing_transactions
-- Run this SQL in Supabase SQL Editor

ALTER TABLE borrowing_transactions
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

-- Add comment for documentation
COMMENT ON COLUMN borrowing_transactions.quantity IS 'Number of items borrowed in this transaction';
