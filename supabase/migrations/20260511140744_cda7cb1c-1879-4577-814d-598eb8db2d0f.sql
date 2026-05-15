-- Pin search_path on all functions (already SET in body but linter wants explicit)
ALTER FUNCTION public.has_role(UUID, public.app_role) SET search_path = public;
ALTER FUNCTION public.is_staff(UUID) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.touch_updated_at() SET search_path = public;

-- Restrict EXECUTE on SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(UUID) TO authenticated;

-- Replace permissive notifications insert: only allow inserting for self,
-- or by staff inserting for any recipient
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
CREATE POLICY "Self or staff insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (recipient_id = auth.uid() OR public.is_staff(auth.uid()));