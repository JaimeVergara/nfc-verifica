import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { generarCodigo, Persona, Supabase } from '../supabase';

@Component({
  selector: 'app-personas',
  imports: [FormsModule, RouterLink],
  template: `
    <main class="caja ancha">
      <a routerLink="/">← Inicio</a>
      <h1>Personas</h1>

      <form (ngSubmit)="agregar()">
        <input name="nombre" [(ngModel)]="nombre" placeholder="Nombre completo" required />
        <input name="rut" [(ngModel)]="rut" placeholder="RUT" />
        <input name="foto" [(ngModel)]="fotoUrl" placeholder="URL de foto (opcional)" />
        <button [disabled]="!nombre.trim()">Agregar</button>
      </form>
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      <ul class="lista">
        @for (p of personas(); track p.id) {
          <li [class.apagado]="!p.activo">
            <div>
              <strong>{{ p.nombre }}</strong> <span class="tenue">{{ p.rut }}</span>
              <code>{{ supabase.urlEtiqueta(p.codigo) }}</code>
            </div>
            <div class="acciones">
              <button (click)="copiar(p)">{{ copiado() === p.id ? 'Copiado' : 'Copiar URL' }}</button>
              <button (click)="verQr(p)">QR</button>
              <button class="secundario" (click)="cambiarActivo(p)">{{ p.activo ? 'Desactivar' : 'Activar' }}</button>
            </div>
            @if (qr()?.id === p.id) {
              <div class="qr">
                <img [src]="qr()!.imagen" alt="Código QR" />
                <a [href]="qr()!.imagen" [download]="'qr-' + p.nombre + '.png'">Descargar QR</a>
              </div>
            }
          </li>
        } @empty {
          <li class="tenue">Aún no hay personas.</li>
        }
      </ul>
    </main>
  `,
})
export class Personas implements OnInit {
  protected supabase = inject(Supabase);

  readonly personas = signal<Persona[]>([]);
  readonly error = signal('');
  readonly copiado = signal('');
  readonly qr = signal<{ id: string; imagen: string } | null>(null);
  nombre = '';
  rut = '';
  fotoUrl = '';

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    const { data, error } = await this.supabase.client.from('personas').select('*').order('nombre');
    if (error) this.error.set(error.message);
    this.personas.set(data ?? []);
  }

  async agregar() {
    const { error } = await this.supabase.client.from('personas').insert({
      codigo: generarCodigo(),
      nombre: this.nombre.trim(),
      rut: this.rut.trim() || null,
      foto_url: this.fotoUrl.trim() || null,
    });
    if (error) {
      this.error.set(error.message);
      return;
    }
    this.nombre = this.rut = this.fotoUrl = '';
    this.error.set('');
    this.cargar();
  }

  async cambiarActivo(p: Persona) {
    await this.supabase.client.from('personas').update({ activo: !p.activo }).eq('id', p.id);
    this.cargar();
  }

  // El QR lleva la misma URL que la etiqueta NFC: la cámara del teléfono lo abre igual.
  async verQr(p: Persona) {
    if (this.qr()?.id === p.id) {
      this.qr.set(null);
      return;
    }
    const QRCode = await import('qrcode');
    const imagen = await QRCode.toDataURL(this.supabase.urlEtiqueta(p.codigo), { width: 320, margin: 2 });
    this.qr.set({ id: p.id, imagen });
  }

  async copiar(p: Persona) {
    await navigator.clipboard.writeText(this.supabase.urlEtiqueta(p.codigo));
    this.copiado.set(p.id);
  }
}
