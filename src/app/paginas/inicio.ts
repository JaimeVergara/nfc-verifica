import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Supabase } from '../supabase';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  template: `
    <main class="caja">
      <h1>Verificación NFC</h1>
      <p>Acerca el teléfono a una etiqueta y toca el aviso que aparece para ver el resultado.</p>
      <p class="tenue">Sesión: {{ supabase.session()?.user?.email }}</p>
      <a class="boton" routerLink="/personas">Personas registradas</a>
      <button class="secundario" (click)="salir()">Cerrar sesión</button>
    </main>
  `,
})
export class Inicio {
  protected supabase = inject(Supabase);
  private router = inject(Router);

  async salir() {
    await this.supabase.client.auth.signOut();
    this.router.navigateByUrl('/login');
  }
}
