import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Icono } from '../icono';
import { Supabase } from '../supabase';

@Component({
  selector: 'app-login',
  imports: [FormsModule, Icono],
  template: `
    <main class="login">
      <div class="tarjeta login-caja">
        <span class="logo grande"><app-icono nombre="escudo" /></span>
        <h1>Verifica</h1>
        <p class="tenue">Ingresa para verificar personas con NFC o QR</p>
        <form (ngSubmit)="ingresar()">
          <label class="campo">
            Correo
            <input type="email" name="correo" [(ngModel)]="correo" autocomplete="username" required />
          </label>
          <label class="campo">
            Contraseña
            <input type="password" name="clave" [(ngModel)]="clave" autocomplete="current-password" required />
          </label>
          @if (error()) {
            <p class="error">{{ error() }}</p>
          }
          <button class="btn primario bloque" [disabled]="cargando()">{{ cargando() ? 'Ingresando…' : 'Ingresar' }}</button>
        </form>
      </div>
    </main>
  `,
})
export class Login {
  private supabase = inject(Supabase);
  private router = inject(Router);

  readonly volver = input<string>('/');
  correo = '';
  clave = '';
  readonly cargando = signal(false);
  readonly error = signal('');

  async ingresar() {
    this.cargando.set(true);
    this.error.set('');
    const { error } = await this.supabase.client.auth.signInWithPassword({
      email: this.correo,
      password: this.clave,
    });
    this.cargando.set(false);
    if (error) {
      this.error.set('Correo o contraseña incorrectos');
      return;
    }
    this.router.navigateByUrl(this.volver() || '/');
  }
}
