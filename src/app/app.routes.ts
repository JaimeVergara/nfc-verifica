import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { Supabase } from './supabase';
import { Login } from './paginas/login';
import { Inicio } from './paginas/inicio';
import { Verificar } from './paginas/verificar';
import { Personas } from './paginas/personas';

// Sin sesión → login, recordando a dónde volver (ej: el código escaneado).
const conSesion: CanActivateFn = async (_ruta, estado) => {
  const router = inject(Router);
  if (await inject(Supabase).haySesion()) return true;
  return router.createUrlTree(['/login'], { queryParams: { volver: estado.url } });
};

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: '', component: Inicio, canActivate: [conSesion] },
  { path: 'v/:codigo', component: Verificar, canActivate: [conSesion] },
  { path: 'personas', component: Personas, canActivate: [conSesion] },
  { path: '**', redirectTo: '' },
];
