import { Component, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Persona, Supabase } from '../supabase';

type Resultado = 'cargando' | 'registrado' | 'inactivo' | 'no-registrado' | 'error';

@Component({
  selector: 'app-verificar',
  imports: [RouterLink],
  template: `
    <main class="resultado" [class]="resultado()">
      @switch (resultado()) {
        @case ('cargando') {
          <p class="icono">…</p>
          <h1>Verificando</h1>
        }
        @case ('registrado') {
          <p class="icono">✅</p>
          <h1>Registrado</h1>
          @if (persona()?.foto_url) {
            <img [src]="persona()!.foto_url" alt="Foto" />
          }
          <p class="nombre">{{ persona()?.nombre }}</p>
          <p>{{ persona()?.rut }}</p>
        }
        @case ('inactivo') {
          <p class="icono">⛔</p>
          <h1>Inactivo</h1>
          <p class="nombre">{{ persona()?.nombre }}</p>
        }
        @case ('no-registrado') {
          <p class="icono">❌</p>
          <h1>No registrado</h1>
        }
        @case ('error') {
          <p class="icono">⚠️</p>
          <h1>Error de conexión</h1>
          <p>Revisa internet y vuelve a escanear.</p>
        }
      }
      <a routerLink="/">Volver</a>
    </main>
  `,
})
export class Verificar implements OnInit {
  private supabase = inject(Supabase);

  readonly codigo = input.required<string>();
  readonly resultado = signal<Resultado>('cargando');
  readonly persona = signal<Persona | null>(null);

  async ngOnInit() {
    const { data, error } = await this.supabase.client
      .from('personas')
      .select('*')
      .eq('codigo', this.codigo())
      .maybeSingle<Persona>();

    if (error) {
      this.resultado.set('error');
      return;
    }
    this.persona.set(data);
    this.resultado.set(!data ? 'no-registrado' : data.activo ? 'registrado' : 'inactivo');

    await this.supabase.client.from('lecturas').insert({
      codigo: this.codigo(),
      resultado: this.resultado(),
    });
  }
}
