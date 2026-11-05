import { Component, computed, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Barra } from '../barra';
import { Icono } from '../icono';
import { generarCodigo, Persona, Supabase } from '../supabase';

@Component({
  selector: 'app-personas',
  imports: [FormsModule, Barra, Icono],
  template: `
    <app-barra titulo="Personas" [subtitulo]="personas().length + ' registradas'" atras="/" />
    <main class="contenido">
      <div class="herramientas">
        <label class="buscador">
          <app-icono nombre="buscar" />
          <input
            type="search"
            placeholder="Buscar por nombre o RUT"
            [ngModel]="filtro()"
            (ngModelChange)="filtro.set($event)"
          />
        </label>
        <button class="btn primario" (click)="formAbierto.set(!formAbierto())">
          <app-icono [nombre]="formAbierto() ? 'x' : 'mas'" /> {{ formAbierto() ? 'Cerrar' : 'Agregar' }}
        </button>
      </div>

      @if (formAbierto()) {
        <form class="tarjeta formulario" (ngSubmit)="agregar()">
          <h2>Nueva persona</h2>
          <label class="campo">
            Nombre completo
            <input name="nombre" [(ngModel)]="nombre" required />
          </label>
          <label class="campo">
            RUT
            <input name="rut" [(ngModel)]="rut" placeholder="12.345.678-9" />
          </label>
          <label class="selector-foto">
            <span class="burbuja"><app-icono nombre="camara" /></span>
            <span>{{ fotoNueva()?.name ?? 'Agregar foto (opcional)' }}</span>
            <input #foto type="file" accept="image/*" hidden (change)="fotoNueva.set(foto.files?.[0] ?? null)" />
          </label>
          <div class="botones">
            <button type="button" class="btn" (click)="formAbierto.set(false)">Cancelar</button>
            <button class="btn primario" [disabled]="!nombre.trim() || guardando()">
              {{ guardando() ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </form>
      }
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      <ul class="lista">
        @for (p of filtradas(); track p.id) {
          <li class="tarjeta persona" [class.apagado]="!p.activo">
            <div class="persona-cabecera">
              @if (p.foto_url && fotos()[p.foto_url]) {
                <img class="avatar" [src]="fotos()[p.foto_url]" alt="" />
              } @else {
                <span class="avatar">{{ iniciales(p.nombre) }}</span>
              }
              <div class="persona-datos">
                <strong>{{ p.nombre }}</strong>
                <span>{{ p.rut || 'Sin RUT' }}</span>
              </div>
              <span class="insignia" [class.ok]="p.activo">{{ p.activo ? 'Activo' : 'Inactivo' }}</span>
            </div>
            <div class="persona-acciones">
              <button class="btn chico" (click)="copiar(p)">
                <app-icono [nombre]="copiado() === p.id ? 'check' : 'copiar'" />
                {{ copiado() === p.id ? 'Copiada' : 'URL' }}
              </button>
              <button class="btn chico" (click)="verQr(p)"><app-icono nombre="qr" /> QR</button>
              <label class="btn chico">
                <app-icono nombre="camara" /> {{ subiendo() === p.id ? 'Subiendo…' : 'Foto' }}
                <input #cambio type="file" accept="image/*" hidden (change)="cambiarFoto(p, cambio)" />
              </label>
              <button class="btn chico" (click)="cambiarActivo(p)">
                <app-icono nombre="energia" /> {{ p.activo ? 'Desactivar' : 'Activar' }}
              </button>
            </div>
            @if (qr()?.id === p.id) {
              <div class="qr">
                <img [src]="qr()!.imagen" alt="Código QR" />
                <a class="btn chico" [href]="qr()!.imagen" [download]="'qr-' + p.nombre + '.png'">
                  <app-icono nombre="descargar" /> Descargar QR
                </a>
              </div>
            }
          </li>
        } @empty {
          <li class="vacio">{{ filtro() ? 'Nadie coincide con la búsqueda.' : 'Aún no hay personas. Toca "Agregar".' }}</li>
        }
      </ul>
    </main>
  `,
})
export class Personas implements OnInit {
  protected supabase = inject(Supabase);
  private inputFoto = viewChild<ElementRef<HTMLInputElement>>('foto');

  readonly personas = signal<Persona[]>([]);
  readonly fotos = signal<Record<string, string>>({});
  readonly filtro = signal('');
  readonly filtradas = computed(() => {
    const f = this.filtro().trim().toLowerCase();
    return f
      ? this.personas().filter((p) => p.nombre.toLowerCase().includes(f) || p.rut?.toLowerCase().includes(f))
      : this.personas();
  });
  readonly formAbierto = signal(false);
  readonly error = signal('');
  readonly copiado = signal('');
  readonly guardando = signal(false);
  readonly subiendo = signal('');
  readonly qr = signal<{ id: string; imagen: string } | null>(null);
  readonly fotoNueva = signal<File | null>(null);
  nombre = '';
  rut = '';

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    const { data, error } = await this.supabase.client.from('personas').select('*').order('nombre');
    if (error) this.error.set(error.message);
    this.personas.set(data ?? []);
    this.fotos.set(await this.supabase.urlsFotos(data ?? []));
  }

  iniciales(nombre: string) {
    return nombre
      .split(/\s+/)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('');
  }

  async agregar() {
    this.guardando.set(true);
    const { data, error } = await this.supabase.client
      .from('personas')
      .insert({ codigo: generarCodigo(), nombre: this.nombre.trim(), rut: this.rut.trim() || null })
      .select('id, foto_url')
      .single();
    let mensaje = error?.message ?? '';
    const foto = this.fotoNueva();
    if (data && foto) {
      const errorFoto = await this.supabase.subirFoto(data, foto);
      if (errorFoto) mensaje = `Persona guardada, pero la foto falló: ${errorFoto}`;
    }
    this.guardando.set(false);
    this.error.set(mensaje);
    if (!error) {
      this.nombre = this.rut = '';
      this.fotoNueva.set(null);
      if (this.inputFoto()) this.inputFoto()!.nativeElement.value = '';
      this.formAbierto.set(false);
    }
    this.cargar();
  }

  async cambiarFoto(p: Persona, input: HTMLInputElement) {
    const archivo = input.files?.[0];
    if (!archivo) return;
    this.subiendo.set(p.id);
    const error = await this.supabase.subirFoto(p, archivo);
    this.subiendo.set('');
    input.value = '';
    this.error.set(error ? `No se pudo subir la foto: ${error}` : '');
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
