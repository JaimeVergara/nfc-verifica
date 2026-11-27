import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { Supabase } from './supabase';
import { Login } from './paginas/login';
import { Inicio } from './paginas/inicio';
import { Verificar } from './paginas/verificar';
import { Personas } from './paginas/personas';
import { Usuarios } from './paginas/usuarios';

// Sin sesión → login, recordando a dónde volver (ej: el código escaneado).
// Con sesión pero sin perfil activo → se cierra la sesión y se avisa en el login.
const conSesion: CanActivateFn = async (_ruta, estado) => {
  const router = inject(Router);
  const supabase = inject(Supabase);
  if (await supabase.haySesion()) return true;
  if (supabase.session()) {
    await supabase.client.auth.signOut();
    return router.createUrlTree(['/login'], { queryParams: { sinAcceso: 1 } });
  }
  return router.createUrlTree(['/login'], { queryParams: { volver: estado.url } });
};

// Páginas de administración: solo usuarios con rol "admin".
const soloAdmin: CanActivateFn = async () => {
  const router = inject(Router);
  const supabase = inject(Supabase);
  return (await supabase.haySesion()) && supabase.esAdmin() ? true : router.createUrlTree(['/']);
};

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: '', component: Inicio, canActivate: [conSesion] },
  { path: 'v/:codigo', component: Verificar, canActivate: [conSesion] },
  {
    path: 'escanear',
    loadComponent: () => import('./paginas/escanear').then((m) => m.Escanear),
    canActivate: [conSesion],
  },
  { path: 'personas', component: Personas, canActivate: [conSesion, soloAdmin] },
  { path: 'usuarios', component: Usuarios, canActivate: [conSesion, soloAdmin] },
  { path: '**', redirectTo: '' },
];
