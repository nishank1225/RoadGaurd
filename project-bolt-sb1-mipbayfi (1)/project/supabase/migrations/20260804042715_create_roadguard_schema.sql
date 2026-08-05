/*
# RoadGuard — Core Schema (profiles, reports, notifications, audit_logs)

1. Purpose
   RoadGuard is a road-damage detection & monitoring platform. Users capture/upload
   road images, a client-side analyzer produces damage predictions (type, severity,
   confidence, bounding boxes, road-health score), and the result is stored as a
   report. Admins review, verify/reject, assign priority, and add remarks. Every
   status change is realtime-synced to dashboards and maps, and triggers
   notifications to the relevant user.

2. New Tables
   - `profiles`: extends auth.users with role, display name, avatar, active flag.
     role ∈ {user, admin}.
   - `reports`: road damage reports. Owned by a user (user_id). Holds ML prediction
     results, GPS, status lifecycle, admin verification, and an optimistic-lock
     version column.
   - `notifications`: per-user in-app notifications tied to report lifecycle events.
   - `audit_logs`: immutable trail of security-relevant actions.

3. Columns of note
   - reports.status lifecycle; reports.severity; reports.damage_type;
     reports.version int (optimistic concurrency); reports.verified_by -> profiles.

4. Helper Functions
   - `public.is_admin()` — SECURITY DEFINER, reads caller profile role.
   - `public.handle_new_user()` — trigger on auth.users INSERT -> profiles row.

5. Security (RLS)
   - profiles, reports, notifications, audit_logs all ENABLE RLS with per-verb policies.
   - Owner columns default to auth.uid() so client inserts omitting user_id succeed.

6. Notes: idempotent (IF NOT EXISTS, DROP POLICY IF EXISTS). No destructive ops.
*/

-- ---------- profiles (created first so is_admin can reference it) ----------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  avatar_url text DEFAULT '',
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- helper: is_admin (after profiles exists) ----------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ---------- reports ----------
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url text NOT NULL DEFAULT '',
  damage_type text NOT NULL DEFAULT 'pothole' CHECK (damage_type IN ('pothole','crack','surface_wear','road_depression','broken_edge','water_damage')),
  severity text NOT NULL DEFAULT 'low' CHECK (severity IN ('low','medium','high','critical')),
  confidence real NOT NULL DEFAULT 0,
  road_health_score int NOT NULL DEFAULT 100,
  prediction_time_ms int NOT NULL DEFAULT 0,
  bounding_boxes jsonb NOT NULL DEFAULT '[]'::jsonb,
  latitude double precision DEFAULT null,
  longitude double precision DEFAULT null,
  location_text text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('submitted','pending','under_review','approved','rejected','maintenance_assigned','in_progress','completed','closed')),
  admin_remarks text DEFAULT '',
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at timestamptz DEFAULT null,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reports_user_id_idx ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON public.reports(created_at DESC);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select" ON public.reports;
CREATE POLICY "reports_select"
ON public.reports FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR status IN ('approved','maintenance_assigned','in_progress','completed','closed')
  OR public.is_admin()
);

DROP POLICY IF EXISTS "reports_insert" ON public.reports;
CREATE POLICY "reports_insert"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reports_update" ON public.reports;
CREATE POLICY "reports_update"
ON public.reports FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (
  (auth.uid() = user_id AND status IN ('submitted','pending','under_review'))
  OR public.is_admin()
);

DROP POLICY IF EXISTS "reports_delete" ON public.reports;
CREATE POLICY "reports_delete"
ON public.reports FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- ---------- notifications ----------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own"
ON public.notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ---------- audit_logs ----------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text DEFAULT '',
  entity_id text DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip text DEFAULT '',
  device text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.is_admin());

-- ---------- trigger: create profile on signup ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at auto-maintainer
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_touch ON public.profiles;
CREATE TRIGGER profiles_touch
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
