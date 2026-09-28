/*
# Add ML analysis columns to reports

1. Purpose
   Stores the richer ML analysis results (grid map, damage counts, severity score,
   deterioration risk, maintenance priority) so they persist with each report and
   can be displayed in admin review and analytics.

2. New Columns on `reports`
   - `pothole_count` (int, default 0)
   - `crack_count` (int, default 0)
   - `edge_damage_count` (int, default 0)
   - `severity_score` (real, default 0) — 0 to 5 scale
   - `grid_map` (jsonb, default '[]') — 3x3 spatial severity grid
   - `deterioration_risk` (real, default 0) — 0 to 1 probability
   - `maintenance_priority` (text, default 'normal', CHECK in low/normal/high/urgent)

3. Security
   No RLS policy changes — existing policies already cover the new columns since
   they are on the same table.

4. Notes
   All additions use IF NOT EXISTS via DO blocks to be safe to re-run.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'pothole_count') THEN
    ALTER TABLE public.reports ADD COLUMN pothole_count int NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'crack_count') THEN
    ALTER TABLE public.reports ADD COLUMN crack_count int NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'edge_damage_count') THEN
    ALTER TABLE public.reports ADD COLUMN edge_damage_count int NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'severity_score') THEN
    ALTER TABLE public.reports ADD COLUMN severity_score real NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'grid_map') THEN
    ALTER TABLE public.reports ADD COLUMN grid_map jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'deterioration_risk') THEN
    ALTER TABLE public.reports ADD COLUMN deterioration_risk real NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'maintenance_priority') THEN
    ALTER TABLE public.reports ADD COLUMN maintenance_priority text NOT NULL DEFAULT 'normal' CHECK (maintenance_priority IN ('low','normal','high','urgent'));
  END IF;
END $$;
