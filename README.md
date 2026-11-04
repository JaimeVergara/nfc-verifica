# Verificación NFC

App Angular simple: cada persona tiene una etiqueta NFC con una URL (`…/#/v/CODIGO`).
Al acercar un iPhone (XS o superior) o Android, aparece un aviso; al tocarlo se abre la app
y muestra **✅ Registrado**, **⛔ Inactivo** o **❌ No registrado**.

## 1. Supabase (base de datos)
1. Crear un proyecto gratis en https://supabase.com (uno para **pruebas**).
2. **SQL Editor** → pegar `supabase/esquema.sql` → Run.
3. **Authentication → Users → Add user**: crear los usuarios verificadores (correo + contraseña).
4. **Authentication → Sign In / Providers**: desactivar "Allow new users to sign up" (solo tú creas usuarios).
5. **Project Settings → API**: copiar *Project URL* y la clave *anon* a `src/app/config.ts`.

Carga masiva: en **Table Editor → personas → Insert → Import CSV** (columnas `codigo,nombre,rut`).
Los códigos deben ser aleatorios (12+ caracteres), nunca el RUT.

## 2. Probar en el computador
```bash
npm install
npm start
```
Abrir http://localhost:4200

## 3. Publicar en GitHub Pages (pruebas)
1. Crear un repositorio en GitHub y subir este proyecto a la rama `main`.
2. En el repositorio: **Settings → Pages → Source: GitHub Actions**.
3. Cada `push` a `main` publica en `https://USUARIO.github.io/NOMBRE-REPO/`.

## 4. Grabar etiquetas
1. En la app: **Personas registradas** → agregar persona → **Copiar URL**.
2. En la app **NFC Tools** (iPhone/Android): *Escribir → Añadir registro → URL* → pegar → escribir en la etiqueta.
3. Recomendado: en NFC Tools, *Otros → Bloquear etiqueta* para que nadie la regrabe (es permanente).

> Usa datos inventados en pruebas. La URL grabada depende del dominio: si cambias de hosting,
> configura `urlEtiquetas` en `config.ts` con tu dominio definitivo antes de grabar las etiquetas reales.
