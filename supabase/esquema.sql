-- Ejecutar una vez en Supabase: SQL Editor → New query → pegar → Run.

create table personas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,       -- lo que va en la URL de la etiqueta
  nombre text not null,
  rut text,
  foto_url text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table lecturas (
  id bigint generated always as identity primary key,
  codigo text not null,
  resultado text not null,           -- registrado | inactivo | no-registrado
  usuario uuid default auth.uid(),
  fecha timestamptz not null default now()
);

-- Seguridad: sin sesión iniciada no se puede leer ni escribir nada.
alter table personas enable row level security;
alter table lecturas enable row level security;

create policy "usuarios con sesión leen personas" on personas
  for select to authenticated using (true);
create policy "usuarios con sesión agregan personas" on personas
  for insert to authenticated with check (true);
create policy "usuarios con sesión editan personas" on personas
  for update to authenticated using (true);

create policy "usuarios con sesión registran lecturas" on lecturas
  for insert to authenticated with check (true);
create policy "usuarios con sesión ven lecturas" on lecturas
  for select to authenticated using (true);
