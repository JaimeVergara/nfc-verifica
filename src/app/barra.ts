import { Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Icono } from './icono';
import { Supabase } from './supabase';

@Component({
  selector: 'app-barra',
  imports: [RouterLink, Icono],
  template: `
    <header class="barra">
      @if (atras()) {
        <a class="icono-btn" [routerLink]="atras()" aria-label="Volver"><app-icono nombre="atras" /></a>
      } @else {
        <span class="logo"><app-icono nombre="escudo" /></span>
      }
      <div class="barra-titulo">
        <strong>{{ titulo() }}</strong>
        @if (subtitulo()) {
          <span>{{ subtitulo() }}</span>
        }
      </div>
      <button class="icono-btn" (click)="salir()" aria-label="Cerrar sesión" title="Cerrar sesión">
        <app-icono nombre="salir" />
      </button>
    </header>
  `,
})
export class Barra {
  private supabase = inject(Supabase);
  private router = inject(Router);

  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>();
  readonly atras = input<string>();

  async salir() {
    await this.supabase.client.auth.signOut();
    this.router.navigateByUrl('/login');
  }
}
