/*
# Authority Complaints — raise formal complaints to BBMP

1. Purpose
   Lets an admin raise a formal road-damage complaint to the Bengaluru local road
   service authority (BBMP) directly from a verified report. The complaint is
   pre-filled with the user-supplied location (lat/long + location_text), damage
   details, and the report image. The admin can edit the message before lodging.

2. New Table: `authority_complaints`
   - `id` (uuid PK)
   - `report_id` (uuid FK -> reports, nullable, cascade delete)
   - `raised_by` (uuid FK -> profiles, the admin who raised it)
   - `authority_name` (text, default 'BBMP — Bruhat Bengaluru Mahanagara Palike')
   - `authority_email` (text, default 'comm@bbmp.gov.in')
   - `authority_phone` (text, default '080-22660000')
   - `authority_helpline` (text, default '1533')
   - `subject` (text)
   - `message` (text — the full complaint body)
   - `latitude` (double precision, copied from the report)
   - `longitude` (double precision, copied from the report)
   - `location_text` (text, copied from the report)
   - `status` (text: 'draft' | 'lodged' | 'acknowledged' | 'resolved' | 'rejected')
   - `reference_number` (text, nullable — filled if an authority returns one)
   - `lodged_at` (timestamptz, nullable)
   - `created_at` / `updated_at` (timestamptz)

3. Security (RLS)
   - ENABLE RLS.
   - SELECT: admin-only (admins see all complaints).
   - INSERT: admin-only (WITH CHECK is_admin()).
   - UPDATE: admin-only (USING + WITH CHECK is_admin()).
   - DELETE: admin-only.
   - 4 separate per-verb policies, TO authenticated.

4. Indexes
   - `authority_complaints_report_id_idx` on report_id
   - `authority_complaints_created_at_idx` on created_at DESC
*/

CREATE TABLE IF NOT EXISTS public.authority_complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  raised_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE SET NULL,
  authority_name text NOT NULL DEFAULT 'BBMP — Bruhat Bengaluru Mahanagara Palike',
  authority_email text NOT NULL DEFAULT 'comm@bbmp.gov.in',
  authority_phone text NOT NULL DEFAULT '080-22660000',
  authority_helpline text NOT NULL DEFAULT '1533',
  subject text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  latitude double precision DEFAULT null,
  longitude double precision DEFAULT null,
  location_text text DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','lodged','acknowledged','resolved','rejected')),
  reference_number text DEFAULT '',
  lodged_at timestamptz DEFAULT null,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS authority_complaints_report_id_idx ON public.authority_complaints(report_id);
CREATE INDEX IF NOT EXISTS authority_complaints_created_at_idx ON public.authority_complaints(created_at DESC);

ALTER TABLE public.authority_complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "complaints_select_admin" ON public.authority_complaints;
CREATE POLICY "complaints_select_admin"
ON public.authority_complaints FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "complaints_insert_admin" ON public.authority_complaints;
CREATE POLICY "complaints_insert_admin"
ON public.authority_complaints FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "complaints_update_admin" ON public.authority_complaints;
CREATE POLICY "complaints_update_admin"
ON public.authority_complaints FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "complaints_delete_admin" ON public.authority_complaints;
CREATE POLICY "complaints_delete_admin"
ON public.authority_complaints FOR DELETE
TO authenticated
USING (public.is_admin());

-- updated_at trigger
DROP TRIGGER IF EXISTS authority_complaints_touch ON public.authority_complaints;
CREATE TRIGGER authority_complaints_touch
BEFORE UPDATE ON public.authority_complaints
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
