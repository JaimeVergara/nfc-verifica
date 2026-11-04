import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Supabase } from '../supabase';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <main class="caja">
      <h1>Ingresar</h1>
      <form (ngSubmit)="ingresar()">
        <input type="email" name="correo" [(ngModel)]="correo" placeholder="Correo" autocomplete="username" required />
        <input type="password" name="clave" [(ngModel)]="clave" placeholder="Contraseña" autocomplete="current-password" required />
        <button [disabled]="cargando()">{{ cargando() ? 'Ingresando…' : 'Ingresar' }}</button>
      </form>
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
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
