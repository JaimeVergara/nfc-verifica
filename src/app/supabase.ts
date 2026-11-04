import { Injectable, signal } from '@angular/core';
import { createClient, Session } from '@supabase/supabase-js';
import { config } from './config';

export interface Persona {
  id: string;
  codigo: string;
  nombre: string;
  rut: string | null;
  foto_url: string | null;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class Supabase {
  readonly client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { detectSessionInUrl: false },
  });
  readonly session = signal<Session | null>(null);

  constructor() {
    this.client.auth.onAuthStateChange((_evento, sesion) => this.session.set(sesion));
  }

  async haySesion(): Promise<boolean> {
    const { data } = await this.client.auth.getSession();
    this.session.set(data.session);
    return !!data.session;
  }

  urlEtiqueta(codigo: string): string {
    const base = config.urlEtiquetas || location.origin + location.pathname;
    return `${base}#/v/${codigo}`;
  }
}

// Código aleatorio de 12 caracteres, sin letras confusas (0/O, 1/l/I).
export function generarCodigo(): string {
  const letras = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => letras[b % letras.length]).join('');
}
