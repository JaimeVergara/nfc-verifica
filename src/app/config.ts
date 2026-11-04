// Datos del proyecto Supabase (Project Settings → API).
// La clave "anon" es pública por diseño; la seguridad la dan las reglas RLS.
// NUNCA pongas aquí la clave "service_role".
export const config = {
  supabaseUrl: 'https://TU-PROYECTO.supabase.co',
  supabaseAnonKey: 'TU-CLAVE-ANON',

  // URL base que se graba en las etiquetas. Vacío = la URL donde está abierta la app.
  // Cuando tengas dominio propio, ponlo aquí, ej: 'https://verifica-xyz.cl/'
  urlEtiquetas: '',
};
