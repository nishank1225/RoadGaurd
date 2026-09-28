/*
# Admin delete user (full data wipe)

1. Purpose
   Allow an administrator to permanently delete a user and ALL of their data:
   - reports (and by cascade, notifications + authority_complaints linked to those reports)
   - notifications addressed to the user
   - authority_complaints raised by the user
   - audit_logs authored by the user
   - uploaded report images in the `reports` storage bucket under `reports/<uid>/`
   - the auth.users account (cascades to profiles, sessions, etc.)

   Three foreign keys use ON DELETE NO ACTION (audit_logs.user_id,
   authority_complaints.raised_by, reports.verified_by), so we must clean those
   up explicitly before deleting the auth account.

2. Security
   - SECURITY DEFINER so the function runs with elevated privileges and can
     delete from auth.users and storage.objects (which the caller cannot do
     directly via RLS).
   - Checks `is_admin()` internally — non-admins get a clean error.
   - Prevents self-deletion and deletion of other admins (guardrails).
   - search_path is locked to `public, auth, storage` to prevent path injection.
   - EXECUTE granted to `authenticated` only.
*/

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, storage
AS $$
DECLARE
  target_role text;
  target_active boolean;
  report_ids uuid[];
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can delete users';
  END IF;
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;

  SELECT role, is_active INTO target_role, target_active
  FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  IF target_role = 'admin' THEN
    RAISE EXCEPTION 'Administrators cannot be deleted; demote the account first';
  END IF;

  -- Collect the user's report IDs (for storage cleanup + audit reference)
  SELECT array_agg(id) INTO report_ids FROM public.reports WHERE user_id = p_user_id;

  -- 1. Nullify NO-ACTION FK references in reports.verified_by
  UPDATE public.reports SET verified_by = NULL WHERE verified_by = p_user_id;

  -- 2. Delete authority_complaints raised by the user (NO ACTION FK on raised_by)
  DELETE FROM public.authority_complaints WHERE raised_by = p_user_id;

  -- 3. Delete audit_logs authored by the user (NO ACTION FK on user_id)
  DELETE FROM public.audit_logs WHERE user_id = p_user_id;

  -- 4. Delete notifications addressed to the user
  DELETE FROM public.notifications WHERE user_id = p_user_id;

  -- 5. Delete the user's reports (cascade removes report-linked notifications + complaints)
  DELETE FROM public.reports WHERE user_id = p_user_id;

  -- 6. Delete uploaded images from the storage bucket under reports/<uid>/
  DELETE FROM storage.objects
  WHERE bucket_id = 'reports' AND (storage.foldername(name))[1] = p_user_id::text;

  -- 7. Delete the auth account (cascade removes the profile row + auth.sessions etc.)
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
