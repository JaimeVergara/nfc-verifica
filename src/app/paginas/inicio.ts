import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Barra } from '../barra';
import { Icono } from '../icono';
import { Supabase } from '../supabase';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, Barra, Icono],
  template: `
    <app-barra titulo="Verifica" [subtitulo]="supabase.session()?.user?.email" />
    <main class="contenido">
      <section class="saludo">
        <h1>Hola</h1>
        <p class="tenue">¿Cómo quieres verificar a la persona?</p>
      </section>

      <div class="stats">
        <div class="tarjeta stat">
          <span>Personas registradas</span>
          <strong>{{ totalPersonas() ?? '–' }}</strong>
        </div>
        <div class="tarjeta stat">
          <span>Lecturas de hoy</span>
          <strong>{{ lecturasHoy() ?? '–' }}</strong>
        </div>
      </div>

      <h2 class="seccion">Verificar</h2>
      <div class="acciones-grandes">
        <div class="tarjeta accion">
          <span class="burbuja"><app-icono nombre="nfc" /></span>
          <strong>Etiqueta NFC</strong>
          <p>Acerca el teléfono a la etiqueta y toca el aviso que aparece.</p>
        </div>
        <a class="tarjeta accion clicable" routerLink="/escanear">
          <span class="burbuja"><app-icono nombre="qr" /></span>
          <strong>Escanear QR</strong>
          <p>Usa la cámara para leer el código de la persona.</p>
        </a>
      </div>

      <h2 class="seccion">Administrar</h2>
      <a class="tarjeta fila clicable" routerLink="/personas">
        <span class="burbuja"><app-icono nombre="personas" /></span>
        <div>
          <strong>Personas</strong>
          <p>Agregar, fotos, códigos QR y URLs de etiquetas</p>
        </div>
        <app-icono class="tenue" nombre="flecha" />
      </a>
    </main>
  `,
})
export class Inicio implements OnInit {
  protected supabase = inject(Supabase);

  readonly totalPersonas = signal<number | null>(null);
  readonly lecturasHoy = signal<number | null>(null);

  async ngOnInit() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const [personas, lecturas] = await Promise.all([
      this.supabase.client.from('personas').select('*', { count: 'exact', head: true }),
      this.supabase.client.from('lecturas').select('*', { count: 'exact', head: true }).gte('fecha', hoy.toISOString()),
    ]);
    this.totalPersonas.set(personas.count);
    this.lecturasHoy.set(lecturas.count);
  }
}
