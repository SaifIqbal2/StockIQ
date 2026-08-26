-- =================================================================
-- StockIQ Schema Migration: Delisting & Corporate Action Hardening
-- Run this in Supabase SQL Editor to add status tracking columns.
-- =================================================================

-- Add status & delisted_date to companies table
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'DELISTED', 'SUSPENDED')),
  ADD COLUMN IF NOT EXISTS delisted_date DATE,
  ADD COLUMN IF NOT EXISTS delisting_reason TEXT;

-- Update index to support status filtering (fast gating)
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);

-- Add status to live_prices table (mirrors company status for denormalized gating)
ALTER TABLE public.live_prices
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'DELISTED', 'SUSPENDED'));

CREATE INDEX IF NOT EXISTS idx_live_prices_status ON public.live_prices(status);

-- ─── Mark known delisted / merged PSX securities ─────────────────────────

-- FFBL: Fauji Fertilizer Bin Qasim Ltd — amalgamated into FFCL (Fauji Fertilizer Company)
UPDATE public.companies
SET
  status           = 'DELISTED',
  delisted_date    = '2024-01-01',
  delisting_reason = 'Amalgamated into Fauji Fertilizer Company Limited (FFCL) effective 2024. Shareholders received FFCL shares via court-approved scheme of arrangement. No independent trading since amalgamation.'
WHERE ticker = 'FFBL';

UPDATE public.live_prices SET status = 'DELISTED' WHERE ticker = 'FFBL';

-- KEL: K-Electric Ltd — government privatisation process put trading on hold at various tranches
UPDATE public.companies
SET
  status           = 'SUSPENDED',
  delisted_date    = NULL,
  delisting_reason = 'Trading suspended pending completion of KE privatisation transaction. NEPRA approval and share transfer under review.'
WHERE ticker = 'KEL' AND EXISTS (SELECT 1 FROM public.companies WHERE ticker = 'KEL');

-- PTCLA: PTC Legacy/Class A shares — delisted after reorganisation
UPDATE public.companies
SET
  status           = 'DELISTED',
  delisted_date    = '2023-06-01',
  delisting_reason = 'PTCL class restructuring completed. Legacy Class A tranches removed from active PSX board.'
WHERE ticker IN ('PTCLA', 'PTCLB');

UPDATE public.live_prices SET status = 'DELISTED' WHERE ticker IN ('PTCLA', 'PTCLB', 'FFBL');
UPDATE public.live_prices SET status = 'SUSPENDED' WHERE ticker = 'KEL';

-- Ensure all remaining rows default to ACTIVE where status is not already set
UPDATE public.companies SET status = 'ACTIVE'
WHERE status IS NULL OR status NOT IN ('DELISTED', 'SUSPENDED');

UPDATE public.live_prices SET status = 'ACTIVE'
WHERE status IS NULL OR status NOT IN ('DELISTED', 'SUSPENDED');
