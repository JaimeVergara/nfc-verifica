-- Personas inventadas para probar (solo en el proyecto de PRUEBAS).
-- Ejecutar después de esquema.sql.

insert into personas (codigo, nombre, rut, activo) values
  ('prueba7k3m9xq2', 'Ana Prueba Soto', '11.111.111-1', true),
  ('prueba4h8w2zn6', 'Pedro Ejemplo Rojas', '22.222.222-2', true),
  ('prueba9r5t3vb8', 'Carla Inactiva Díaz', '33.333.333-3', false);

-- Para probar sin etiqueta, abre en el navegador (con sesión iniciada):
--   …/#/v/prueba7k3m9xq2   → ✅ Registrado
--   …/#/v/prueba9r5t3vb8   → ⛔ Inactivo
--   …/#/v/noexiste123      → ❌ No registrado
