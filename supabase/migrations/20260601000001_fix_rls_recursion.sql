-- 1. Drop ALL existing policies on user_roles that might cause recursion
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins read scan logs" ON public.scan_logs;
DROP POLICY IF EXISTS "Admins full access to events" ON public.events;
DROP POLICY IF EXISTS "Admins full access to students" ON public.students;
DROP POLICY IF EXISTS "Admins can read events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
DROP POLICY IF EXISTS "Admins can view students" ON public.students;

-- 2. Create simple, non-recursive policies for user_roles
-- Users can read their OWN role. This does NOT query user_roles, so it cannot recurse.
CREATE POLICY "Users can read own role" ON public.user_roles 
  FOR SELECT USING (user_id = auth.uid());

-- NOTE: We are intentionally NOT creating a policy for admins to UPDATE user_roles from the client.
-- Role management should be done via the Supabase Dashboard (Service Role), which bypasses RLS.

-- 3. Create policies for the other tables. 
-- These can safely query user_roles because the user_roles policy above is non-recursive.
CREATE POLICY "Admins read scan logs" ON public.scan_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins full access to events" ON public.events 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins full access to students" ON public.students 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );
