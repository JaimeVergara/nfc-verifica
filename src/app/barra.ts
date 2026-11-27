import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Icono } from './icono';
import { Supabase } from './supabase';

@Component({
  selector: 'app-barra',
  imports: [RouterLink, RouterLinkActive, Icono],
  host: { '(document:keydown.escape)': 'abierto.set(false)' },
  template: `
    <header class="barra">
      <button class="icono-btn" (click)="abierto.set(true)" aria-label="Abrir menú">
        <app-icono nombre="menu" />
      </button>
      <div class="barra-titulo">
        <strong>{{ titulo() }}</strong>
        @if (subtitulo()) {
          <span>{{ subtitulo() }}</span>
        }
      </div>
    </header>

    @if (abierto()) {
      <div class="menu-fondo" (click)="abierto.set(false)"></div>
      <nav class="menu-lateral" aria-label="Menú principal">
        <div class="menu-cabecera">
          <span class="logo"><app-icono nombre="escudo" /></span>
          <div class="menu-usuario">
            <strong>{{ nombre() }}</strong>
            <span>{{ supabase.session()?.user?.email }}</span>
          </div>
          <button class="icono-btn" (click)="abierto.set(false)" aria-label="Cerrar menú">
            <app-icono nombre="x" />
          </button>
        </div>
        <span class="insignia" [class.admin]="supabase.esAdmin()">
          {{ supabase.esAdmin() ? 'Administrador' : 'Verificador' }}
        </span>

        <div class="menu-enlaces">
          <a routerLink="/" routerLinkActive="activo" [routerLinkActiveOptions]="{ exact: true }" (click)="abierto.set(false)">
            <app-icono nombre="inicio" /> Inicio
          </a>
          <a routerLink="/escanear" routerLinkActive="activo" (click)="abierto.set(false)">
            <app-icono nombre="qr" /> Escanear QR
          </a>
          @if (supabase.esAdmin()) {
            <p class="menu-seccion">Administración</p>
            <a routerLink="/personas" routerLinkActive="activo" (click)="abierto.set(false)">
              <app-icono nombre="personas" /> Personas
            </a>
            <a routerLink="/usuarios" routerLinkActive="activo" (click)="abierto.set(false)">
              <app-icono nombre="llave" /> Usuarios de la app
            </a>
          }
        </div>

        <button class="menu-salir" (click)="salir()"><app-icono nombre="salir" /> Cerrar sesión</button>
      </nav>
    }
  `,
})
export class Barra {
  protected supabase = inject(Supabase);
  private router = inject(Router);

  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>();
  readonly abierto = signal(false);
  readonly nombre = computed(() => this.supabase.perfil()?.nombre || 'Mi cuenta');

  async salir() {
    await this.supabase.client.auth.signOut();
    this.router.navigateByUrl('/login');
  }
}
