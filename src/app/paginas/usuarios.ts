import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Barra } from '../barra';
import { Icono } from '../icono';
import { Rol, Supabase } from '../supabase';

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  ultimo_ingreso: string | null;
}

interface Edicion {
  id: string;
  nombre: string;
  rol: Rol;
  password: string;
}

@Component({
  selector: 'app-usuarios',
  imports: [FormsModule, Barra, Icono],
  template: `
    <app-barra titulo="Usuarios de la app" [subtitulo]="usuarios().length + ' con acceso'" />
    <main class="contenido">
      <div class="herramientas">
        <label class="buscador">
          <app-icono nombre="buscar" />
          <input
            type="search"
            placeholder="Buscar por nombre o correo"
            [ngModel]="filtro()"
            (ngModelChange)="filtro.set($event)"
          />
        </label>
        <button class="btn primario" (click)="formAbierto.set(!formAbierto())">
          <app-icono [nombre]="formAbierto() ? 'x' : 'mas'" /> {{ formAbierto() ? 'Cerrar' : 'Agregar' }}
        </button>
      </div>

      @if (formAbierto()) {
        <form class="tarjeta formulario" (ngSubmit)="crear()">
          <h2>Nuevo usuario</h2>
          <label class="campo">
            Nombre
            <input name="nombre" [(ngModel)]="nuevo.nombre" required />
          </label>
          <label class="campo">
            Correo
            <input name="email" type="email" [(ngModel)]="nuevo.email" autocomplete="off" required />
          </label>
          <label class="campo">
            Contraseña temporal
            <input name="password" type="text" [(ngModel)]="nuevo.password" autocomplete="new-password" required />
            <small>Mínimo 6 caracteres. Entrégasela a la persona para su primer ingreso.</small>
          </label>
          <label class="campo">
            Rol
            <select name="rol" [(ngModel)]="nuevo.rol">
              <option value="verificador">Verificador: solo verifica NFC y QR</option>
              <option value="admin">Administrador: además gestiona personas y usuarios</option>
            </select>
          </label>
          <div class="botones">
            <button type="button" class="btn" (click)="formAbierto.set(false)">Cancelar</button>
            <button class="btn primario" [disabled]="guardando() || !nuevo.email || nuevo.password.length < 6">
              {{ guardando() ? 'Creando…' : 'Crear usuario' }}
            </button>
          </div>
        </form>
      }

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
      @if (aviso()) {
        <p class="aviso-ok">{{ aviso() }}</p>
      }

      <ul class="lista">
        @for (u of filtrados(); track u.id) {
          <li class="tarjeta persona" [class.apagado]="!u.activo">
            <div class="persona-cabecera">
              <span class="avatar">{{ iniciales(u.nombre || u.email) }}</span>
              <div class="persona-datos">
                <strong>{{ u.nombre || 'Sin nombre' }}{{ u.id === miId() ? ' (tú)' : '' }}</strong>
                <span>{{ u.email }}</span>
              </div>
              <span class="insignia" [class.admin]="u.rol === 'admin'">{{ u.rol === 'admin' ? 'Admin' : 'Verificador' }}</span>
            </div>
            <p class="detalle-usuario">
              {{ u.activo ? 'Activo' : 'Desactivado' }} · Último ingreso: {{ fecha(u.ultimo_ingreso) }}
            </p>

            @if (editando(); as ed) {
              @if (ed.id === u.id) {
                <form class="edicion" (ngSubmit)="guardar()">
                  <label class="campo">
                    Nombre
                    <input name="nombre" [(ngModel)]="ed.nombre" />
                  </label>
                  <label class="campo">
                    Rol
                    <select name="rol" [(ngModel)]="ed.rol" [disabled]="u.id === miId()">
                      <option value="verificador">Verificador</option>
                      <option value="admin">Administrador</option>
                    </select>
                    @if (u.id === miId()) {
                      <small>No puedes quitarte el rol de administrador a ti mismo.</small>
                    }
                  </label>
                  <label class="campo">
                    Nueva contraseña (opcional)
                    <input name="password" type="text" [(ngModel)]="ed.password" autocomplete="new-password" />
                    <small>Déjala vacía para no cambiarla.</small>
                  </label>
                  <div class="botones">
                    <button type="button" class="btn" (click)="editando.set(null)">Cancelar</button>
                    <button class="btn primario" [disabled]="guardando()">{{ guardando() ? 'Guardando…' : 'Guardar' }}</button>
                  </div>
                </form>
              }
            }
            @if (editando()?.id !== u.id) {
              <div class="persona-acciones dos">
                <button class="btn chico" (click)="editar(u)"><app-icono nombre="editar" /> Editar</button>
                <button class="btn chico" [disabled]="u.id === miId()" (click)="cambiarActivo(u)">
                  <app-icono nombre="energia" /> {{ u.activo ? 'Desactivar' : 'Activar' }}
                </button>
              </div>
            }
          </li>
        } @empty {
          <li class="vacio">{{ cargando() ? 'Cargando…' : 'No hay usuarios que coincidan.' }}</li>
        }
      </ul>
    </main>
  `,
})
export class Usuarios implements OnInit {
  private supabase = inject(Supabase);

  readonly usuarios = signal<Usuario[]>([]);
  readonly filtro = signal('');
  readonly filtrados = computed(() => {
    const f = this.filtro().trim().toLowerCase();
    return f
      ? this.usuarios().filter((u) => u.nombre.toLowerCase().includes(f) || u.email.toLowerCase().includes(f))
      : this.usuarios();
  });
  readonly miId = computed(() => this.supabase.session()?.user.id);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly formAbierto = signal(false);
  readonly editando = signal<Edicion | null>(null);
  readonly error = signal('');
  readonly aviso = signal('');
  nuevo = { nombre: '', email: '', password: '', rol: 'verificador' as Rol };

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    try {
      const lista = await this.supabase.adminUsuarios<Usuario[]>({ accion: 'listar' });
      this.usuarios.set(lista.sort((a, b) => (a.nombre || a.email).localeCompare(b.nombre || b.email)));
    } catch (e) {
      this.error.set(`No se pudo cargar la lista: ${(e as Error).message}`);
    }
    this.cargando.set(false);
  }

  async crear() {
    await this.ejecutar({ accion: 'crear', ...this.nuevo }, `Usuario ${this.nuevo.email} creado`);
    if (!this.error()) {
      this.nuevo = { nombre: '', email: '', password: '', rol: 'verificador' };
      this.formAbierto.set(false);
    }
  }

  editar(u: Usuario) {
    this.editando.set({ id: u.id, nombre: u.nombre, rol: u.rol, password: '' });
  }

  async guardar() {
    const ed = this.editando()!;
    if (ed.password && ed.password.length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    const cambios: Record<string, unknown> = { accion: 'actualizar', id: ed.id, nombre: ed.nombre };
    if (ed.id !== this.miId()) cambios['rol'] = ed.rol;
    if (ed.password) cambios['password'] = ed.password;
    await this.ejecutar(cambios, 'Cambios guardados');
    if (!this.error()) this.editando.set(null);
  }

  async cambiarActivo(u: Usuario) {
    await this.ejecutar(
      { accion: 'actualizar', id: u.id, activo: !u.activo },
      u.activo ? `${u.email} ya no puede ingresar` : `${u.email} puede ingresar de nuevo`,
    );
  }

  private async ejecutar(cuerpo: Record<string, unknown>, mensajeOk: string) {
    this.guardando.set(true);
    this.error.set('');
    this.aviso.set('');
    try {
      await this.supabase.adminUsuarios(cuerpo);
      this.aviso.set(mensajeOk);
      await this.cargar();
    } catch (e) {
      this.error.set((e as Error).message);
    }
    this.guardando.set(false);
  }

  iniciales(texto: string) {
    return texto
      .split(/[\s@.]+/)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('');
  }

  fecha(iso: string | null) {
    return iso ? new Date(iso).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' }) : 'nunca';
  }
}
