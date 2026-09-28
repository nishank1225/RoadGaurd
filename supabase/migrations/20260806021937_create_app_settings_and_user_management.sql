/*
# App settings + admin user management

## What this migration does

1. Creates a single-row `app_settings` table to hold configurable limits:
   - `daily_report_limit` (int, default 10): max reports a user can submit per calendar day.

2. Seeds one row with id=1 containing the default settings.

3. Adds a SECURITY DEFINER function `get_app_settings()` that returns the settings row
   so any authenticated user can read the current limits (e.g. to show "X reports left today").

4. Adds a SECURITY DEFINER function `admin_create_user(email, full_name, password)` so an
   admin can create a new auth.users account from the admin console — self-registration is
   disabled, so this is the only way new users join. The caller must be an admin (verified
   via the `is_admin()` helper). It also sets `full_name` in user metadata so the
   `handle_new_user` trigger picks it up.

5. Adds a SECURITY DEFINER function `update_daily_report_limit(new_limit)` so an admin can
   update the daily report limit. Validates the value is between 1 and 1000.

## Security
- `app_settings` has RLS enabled. SELECT is open to all authenticated users (they need to
  read the limit). INSERT/UPDATE/DELETE are admin-only via `is_admin()`.
- The two SECURITY DEFINER functions execute with elevated privileges but check `is_admin()`
  internally before mutating anything, so non-admins get a clean error.
- EXECUTE on both functions is granted to `authenticated`.
- `get_app_settings()` is granted to both `anon` and `authenticated` (read-only).
*/

-- ---------- app_settings ----------
CREATE TABLE IF NOT EXISTS public.app_settings (
  id int PRIMARY KEY DEFAULT 1,
  daily_report_limit int NOT NULL DEFAULT 10,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT settings_singleton CHECK (id = 1)
);

INSERT INTO public.app_settings (id, daily_report_limit)
VALUES (1, 10)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select_authenticated" ON public.app_settings;
CREATE POLICY "settings_select_authenticated"
ON public.app_settings FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "settings_update_admin" ON public.app_settings;
CREATE POLICY "settings_update_admin"
ON public.app_settings FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "settings_insert_admin" ON public.app_settings;
CREATE POLICY "settings_insert_admin"
ON public.app_settings FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

-- ---------- get_app_settings() ----------
CREATE OR REPLACE FUNCTION public.get_app_settings()
RETURNS public.app_settings
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT * FROM public.app_settings WHERE id = 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_app_settings() TO anon, authenticated;

-- ---------- admin_create_user() ----------
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email text,
  p_full_name text,
  p_password text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can create new accounts';
  END IF;
  IF p_email IS NULL OR btrim(p_email) = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters';
  END IF;

  -- Use Supabase auth admin API via the internal function
  -- auth.users insert creates the account; the handle_new_user trigger creates the profile
  INSERT INTO auth.users (
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    lower(btrim(p_email)),
    crypt(p_password, gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('full_name', p_full_name),
    now(),
    now(),
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  RETURN new_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_user(text, text, text) TO authenticated;

-- ---------- update_daily_report_limit() ----------
CREATE OR REPLACE FUNCTION public.update_daily_report_limit(new_limit int)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can change limits';
  END IF;
  IF new_limit IS NULL OR new_limit < 1 OR new_limit > 1000 THEN
    RAISE EXCEPTION 'Limit must be between 1 and 1000';
  END IF;
  UPDATE public.app_settings SET daily_report_limit = new_limit, updated_at = now() WHERE id = 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_daily_report_limit(int) TO authenticated;
