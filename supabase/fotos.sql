-- Fotos de personas.
-- 1) Crear el bucket desde el panel (Supabase no permite crearlo por SQL):
--    Storage → New bucket → Name: fotos · Public bucket: NO (privado)
--    Restrict file size: 500 KB · Allowed MIME types: image/jpeg
-- 2) Luego ejecutar esto en SQL Editor → New query → Run.
--    Las fotos solo se ven con sesión iniciada (enlaces temporales).

create policy "usuarios con sesión ven fotos" on storage.objects
  for select to authenticated using (bucket_id = 'fotos');
create policy "usuarios con sesión suben fotos" on storage.objects
  for insert to authenticated with check (bucket_id = 'fotos');
create policy "usuarios con sesión borran fotos" on storage.objects
  for delete to authenticated using (bucket_id = 'fotos');
