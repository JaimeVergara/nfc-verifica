-- Fotos de personas. Ejecutar una vez en Supabase: SQL Editor → New query → Run.
-- Bucket PRIVADO: las fotos solo se ven con sesión iniciada (enlaces temporales).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 512000, array['image/jpeg']);

create policy "usuarios con sesión ven fotos" on storage.objects
  for select to authenticated using (bucket_id = 'fotos');
create policy "usuarios con sesión suben fotos" on storage.objects
  for insert to authenticated with check (bucket_id = 'fotos');
create policy "usuarios con sesión borran fotos" on storage.objects
  for delete to authenticated using (bucket_id = 'fotos');
