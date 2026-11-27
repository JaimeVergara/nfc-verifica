-- Usuarios con roles (administrador / verificador).
-- Ejecutar una vez en Supabase: SQL Editor → New query → Run.
-- ANTES de ejecutar, cambia TU-CORREO (al final) por el correo con que entras a la app.

-- Perfil de cada usuario de la app (complementa auth.users)
create table perfiles (
  id uuid primary key references auth.users on delete cascade,
  nombre text not null default '',
  rol text not null default 'verificador' check (rol in ('admin', 'verificador')),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);
alter table perfiles enable row level security;

-- Funciones de apoyo para las reglas de seguridad
create or replace function es_activo() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and activo);
$$;

create or replace function es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and activo and rol = 'admin');
$$;

-- Cada usuario ve su propio perfil; los administradores ven todos.
-- Crear y editar perfiles solo lo hace la función "admin-usuarios".
create policy "ver perfiles" on perfiles
  for select to authenticated using (id = auth.uid() or es_admin());

-- Personas: los usuarios activos las consultan; solo administradores las agregan o editan
drop policy if exists "usuarios con sesión leen personas" on personas;
drop policy if exists "usuarios con sesión agregan personas" on personas;
drop policy if exists "usuarios con sesión editan personas" on personas;
create policy "activos leen personas" on personas for select to authenticated using (es_activo());
create policy "admin agrega personas" on personas for insert to authenticated with check (es_admin());
create policy "admin edita personas" on personas for update to authenticated using (es_admin());

-- Lecturas: solo usuarios activos
drop policy if exists "usuarios con sesión registran lecturas" on lecturas;
drop policy if exists "usuarios con sesión ven lecturas" on lecturas;
create policy "activos registran lecturas" on lecturas for insert to authenticated with check (es_activo());
create policy "activos ven lecturas" on lecturas for select to authenticated using (es_activo());

-- Fotos: los activos las ven; solo administradores suben o borran
drop policy if exists "usuarios con sesión ven fotos" on storage.objects;
drop policy if exists "usuarios con sesión suben fotos" on storage.objects;
drop policy if exists "usuarios con sesión borran fotos" on storage.objects;
create policy "activos ven fotos" on storage.objects
  for select to authenticated using (bucket_id = 'fotos' and es_activo());
create policy "admin sube fotos" on storage.objects
  for insert to authenticated with check (bucket_id = 'fotos' and es_admin());
create policy "admin borra fotos" on storage.objects
  for delete to authenticated using (bucket_id = 'fotos' and es_admin());

-- Usuarios que ya existen: quedan como verificadores...
insert into perfiles (id, nombre)
select id, coalesce(split_part(email, '@', 1), '') from auth.users
on conflict (id) do nothing;

-- ...y tú quedas como administrador (cambia TU-CORREO)
update perfiles set rol = 'admin'
where id = (select id from auth.users where email = 'TU-CORREO');
