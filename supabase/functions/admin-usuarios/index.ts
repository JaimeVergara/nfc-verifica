// Función de Supabase (Edge Function) para administrar los usuarios de la app.
// Corre en el servidor de Supabase con la clave service_role, que NUNCA llega al navegador.
// Solo responde a usuarios con rol "admin" y activos.
// Publicar: panel de Supabase → Edge Functions → Deploy a new function → Via Editor
//           nombre: admin-usuarios → pegar este archivo → Deploy.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const responder = (cuerpo: unknown, estado = 200) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: { ...cors, 'Content-Type': 'application/json' } });

const rolValido = (rol: unknown) => (rol === 'admin' ? 'admin' : 'verificador');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  // ¿Quién llama? Debe ser un administrador activo.
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  const { data: sesion } = await admin.auth.getUser(token);
  const yo = sesion.user;
  if (!yo) return responder({ error: 'Sesión no válida' }, 401);
  const { data: miPerfil } = await admin.from('perfiles').select('rol, activo').eq('id', yo.id).maybeSingle();
  if (miPerfil?.rol !== 'admin' || !miPerfil.activo) return responder({ error: 'Solo administradores' }, 403);

  const { accion, ...d } = await req.json();

  if (accion === 'listar') {
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (error) return responder({ error: error.message }, 400);
    const { data: perfiles } = await admin.from('perfiles').select('id, nombre, rol, activo');
    const porId = new Map((perfiles ?? []).map((p) => [p.id, p]));
    return responder(
      data.users.map((u) => ({
        id: u.id,
        email: u.email,
        ultimo_ingreso: u.last_sign_in_at ?? null,
        nombre: porId.get(u.id)?.nombre ?? '',
        rol: porId.get(u.id)?.rol ?? 'verificador',
        activo: porId.get(u.id)?.activo ?? false,
      })),
    );
  }

  if (accion === 'crear') {
    if (!d.email || !d.password || String(d.password).length < 6) {
      return responder({ error: 'Correo y contraseña (mínimo 6 caracteres) son obligatorios' }, 400);
    }
    const { data, error } = await admin.auth.admin.createUser({
      email: String(d.email).trim(),
      password: String(d.password),
      email_confirm: true,
    });
    if (error) return responder({ error: error.message }, 400);
    const { error: errorPerfil } = await admin
      .from('perfiles')
      .insert({ id: data.user.id, nombre: String(d.nombre ?? '').trim(), rol: rolValido(d.rol) });
    if (errorPerfil) return responder({ error: errorPerfil.message }, 400);
    return responder({ ok: true });
  }

  if (accion === 'actualizar') {
    if (!d.id) return responder({ error: 'Falta el usuario' }, 400);
    if (d.id === yo.id && (d.rol === 'verificador' || d.activo === false)) {
      return responder({ error: 'No puedes quitarte el acceso de administrador a ti mismo' }, 400);
    }

    const cambiosAuth: Record<string, unknown> = {};
    if (d.password) {
      if (String(d.password).length < 6) return responder({ error: 'La contraseña debe tener al menos 6 caracteres' }, 400);
      cambiosAuth.password = String(d.password);
    }
    // Un usuario desactivado queda bloqueado para iniciar sesión.
    if (d.activo !== undefined) cambiosAuth.ban_duration = d.activo ? 'none' : '876000h';
    if (Object.keys(cambiosAuth).length) {
      const { error } = await admin.auth.admin.updateUserById(d.id, cambiosAuth);
      if (error) return responder({ error: error.message }, 400);
    }

    const cambiosPerfil: Record<string, unknown> = { id: d.id };
    if (d.nombre !== undefined) cambiosPerfil.nombre = String(d.nombre).trim();
    if (d.rol !== undefined) cambiosPerfil.rol = rolValido(d.rol);
    if (d.activo !== undefined) cambiosPerfil.activo = !!d.activo;
    const { error } = await admin.from('perfiles').upsert(cambiosPerfil);
    if (error) return responder({ error: error.message }, 400);
    return responder({ ok: true });
  }

  return responder({ error: 'Acción desconocida' }, 400);
});
