import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../icono';
import { Persona, Supabase } from '../supabase';

type Resultado = 'cargando' | 'registrado' | 'inactivo' | 'no-registrado' | 'error';

const TEXTOS: Record<Resultado, string> = {
  cargando: 'Verificando…',
  registrado: 'Registrado',
  inactivo: 'Inactivo',
  'no-registrado': 'No registrado',
  error: 'Error',
};
const ICONOS: Record<Resultado, string> = {
  cargando: 'reloj',
  registrado: 'check',
  inactivo: 'bloqueado',
  'no-registrado': 'x',
  error: 'alerta',
};

@Component({
  selector: 'app-verificar',
  imports: [RouterLink, Icono],
  template: `
    <main class="resultado" [class]="resultado()">
      <div class="resultado-contenido">
        <span class="sello"><app-icono [nombre]="icono()" /></span>
        <p class="resultado-etiqueta">{{ textos[resultado()] }}</p>
        @switch (resultado()) {
          @case ('registrado') {
            @if (foto()) {
              <img class="foto" [src]="foto()" alt="Foto de la persona" />
            }
            <h1>{{ persona()?.nombre }}</h1>
            <p class="detalle">{{ persona()?.rut }}</p>
          }
          @case ('inactivo') {
            @if (foto()) {
              <img class="foto" [src]="foto()" alt="Foto de la persona" />
            }
            <h1>{{ persona()?.nombre }}</h1>
            <p class="detalle">Esta persona está desactivada</p>
          }
          @case ('no-registrado') {
            <h1>No está en la lista</h1>
            <p class="detalle">La etiqueta o QR no corresponde a nadie registrado</p>
          }
          @case ('error') {
            <h1>Sin conexión</h1>
            <p class="detalle">Revisa internet y vuelve a escanear</p>
          }
        }
        @if (resultado() !== 'cargando') {
          <p class="hora">{{ hora }}</p>
        }
      </div>
      <div class="resultado-botones">
        <a class="btn claro" routerLink="/escanear"><app-icono nombre="qr" /> Escanear otro QR</a>
        <a class="btn transparente" routerLink="/"><app-icono nombre="inicio" /> Inicio</a>
      </div>
    </main>
  `,
})
export class Verificar implements OnInit {
  private supabase = inject(Supabase);

  readonly codigo = input.required<string>();
  readonly resultado = signal<Resultado>('cargando');
  readonly persona = signal<Persona | null>(null);
  readonly icono = computed(() => ICONOS[this.resultado()]);
  protected readonly textos = TEXTOS;
  protected readonly hora = new Date().toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
  readonly foto = signal('');

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
    if (data?.foto_url) {
      const urls = await this.supabase.urlsFotos([data]);
      this.foto.set(urls[data.foto_url] ?? '');
    }

    await this.supabase.client.from('lecturas').insert({
      codigo: this.codigo(),
      resultado: this.resultado(),
    });
  }
}
