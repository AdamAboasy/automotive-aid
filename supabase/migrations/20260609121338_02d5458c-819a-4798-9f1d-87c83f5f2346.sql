DROP POLICY IF EXISTS "Authed view employees" ON public.employees;

CREATE POLICY "Admin/HR view employees"
ON public.employees FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));