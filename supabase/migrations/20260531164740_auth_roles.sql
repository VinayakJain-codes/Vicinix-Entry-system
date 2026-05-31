create type public.user_role as enum ('super_admin', 'admin', 'guard');

create table public.user_roles (
  id uuid references auth.users on delete cascade primary key,
  role public.user_role default 'guard'::public.user_role not null
);

alter table public.user_roles enable row level security;

create policy "Super admins can manage roles" on public.user_roles for all using (
  (select role from public.user_roles where id = auth.uid()) = 'super_admin'
);

create policy "Users can read own role" on public.user_roles for select using (
  id = auth.uid()
);
