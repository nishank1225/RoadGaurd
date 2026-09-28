/*
# Fix admin_delete_user — remove direct storage.objects deletion

1. Problem
   The admin_delete_user function attempted `DELETE FROM storage.objects` to
   clean up uploaded report images. Supabase now blocks direct deletes from
   storage tables with error 42501: "Direct deletion from storage tables is
   not allowed. Use the Storage API instead." This caused every user deletion
   to fail.

2. Fix
   Remove the storage.objects deletion step from the function. Storage cleanup
   is now handled client-side via the Supabase Storage API before calling the
   RPC (the admin lists files under reports/<uid>/ and removes them).

3. What still happens in the function (unchanged)
   - Nullifies reports.verified_by FK references
   - Deletes authority_complaints raised by the user
   - Deletes audit_logs authored by the user
   - Deletes notifications addressed to the user
   - Deletes the user's reports (cascades to report-linked notifications + complaints)
   - Deletes the auth.users account (cascades to profiles row + auth sessions)

4. Security
   - Still SECURITY DEFINER, still checks is_admin() internally
   - Still prevents self-deletion and deletion of other admins
   - search_path still locked to public, auth, storage
   - EXECUTE still granted to authenticated only
*/

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
  target_role text;
  target_active boolean;
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

  -- 1. Nullify NO-ACTION FK references in reports.verified_by
  UPDATE public.reports SET verified_by = NULL WHERE verified_by = p_user_id;

  -- 2. Delete authority_complaints raised by the user (SET NULL FK on raised_by)
  DELETE FROM public.authority_complaints WHERE raised_by = p_user_id;

  -- 3. Delete audit_logs authored by the user (SET NULL FK on user_id)
  DELETE FROM public.audit_logs WHERE user_id = p_user_id;

  -- 4. Delete notifications addressed to the user (CASCADE FK)
  DELETE FROM public.notifications WHERE user_id = p_user_id;

  -- 5. Delete the user's reports (cascade removes report-linked notifications + complaints)
  DELETE FROM public.reports WHERE user_id = p_user_id;

  -- 6. Delete the auth account (cascade removes the profile row + auth.sessions etc.)
  --    Storage image cleanup is handled client-side via the Storage API.
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
