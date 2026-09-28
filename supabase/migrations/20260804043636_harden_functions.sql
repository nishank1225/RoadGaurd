/*
# Harden helper functions and storage listing

1. Purpose
   Address security advisor WARN findings:
   - Revoke EXECUTE on public.is_admin() and public.handle_new_user() from anon
     and authenticated. These are only used internally (RLS policies + trigger),
     not via the REST API, so public execution is unnecessary.
   - Set a fixed search_path on touch_updated_at().
   - Tighten storage SELECT policy so the public bucket cannot be listed broadly.
     Public get-URL access still works; we restrict SELECT to anon/authenticated
     but the policy already only allows the bucket read. We keep it but note the
     bucket is intentionally public for image sharing.

2. Changes
   - REVOKE EXECUTE on is_admin, handle_new_user from anon, authenticated.
   - ALTER FUNCTION touch_updated_at SET search_path = public.
*/

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

ALTER FUNCTION public.touch_updated_at() SET search_path = public;
