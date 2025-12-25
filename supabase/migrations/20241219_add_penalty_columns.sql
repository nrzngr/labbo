-- Migration: Add penalty columns to borrowing_transactions
-- These columns are required by the Return & Penalty flow

ALTER TABLE borrowing_transactions
ADD COLUMN IF NOT EXISTS penalty_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS penalty_paid BOOLEAN DEFAULT FALSE;

-- Add comments
COMMENT ON COLUMN borrowing_transactions.penalty_amount IS 'Calculated penalty amount for overdue returns';
COMMENT ON COLUMN borrowing_transactions.penalty_paid IS 'Whether the penalty has been paid';
