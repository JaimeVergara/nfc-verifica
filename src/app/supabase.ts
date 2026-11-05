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

  // foto_url guarda la ruta dentro del bucket privado "fotos" (o una URL externa antigua).
  async urlsFotos(personas: Persona[]): Promise<Record<string, string>> {
    const rutas = personas.map((p) => p.foto_url).filter((f): f is string => !!f && !f.startsWith('http'));
    const urls: Record<string, string> = {};
    for (const p of personas) if (p.foto_url?.startsWith('http')) urls[p.foto_url] = p.foto_url;
    if (rutas.length) {
      const { data } = await this.client.storage.from('fotos').createSignedUrls(rutas, 3600);
      for (const f of data ?? []) if (f.path && f.signedUrl) urls[f.path] = f.signedUrl;
    }
    return urls;
  }

  // Sube la foto ya reducida con un nombre nuevo (evita caché) y borra la anterior.
  async subirFoto(persona: Pick<Persona, 'id' | 'foto_url'>, archivo: File): Promise<string | null> {
    const ruta = `${persona.id}-${Date.now()}.jpg`;
    const { error } = await this.client.storage
      .from('fotos')
      .upload(ruta, await reducirFoto(archivo), { contentType: 'image/jpeg' });
    if (error) return error.message;

    const { error: errorUpdate } = await this.client.from('personas').update({ foto_url: ruta }).eq('id', persona.id);
    if (errorUpdate) return errorUpdate.message;

    if (persona.foto_url && !persona.foto_url.startsWith('http')) {
      await this.client.storage.from('fotos').remove([persona.foto_url]);
    }
    return null;
  }
}

// Recorta al centro y reduce a 400×400 JPEG (~30-50 KB) para no salir del plan gratis.
export async function reducirFoto(archivo: File, lado = 400): Promise<Blob> {
  const url = URL.createObjectURL(archivo);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const corte = Math.min(img.naturalWidth, img.naturalHeight);
    const lienzo = document.createElement('canvas');
    lienzo.width = lienzo.height = lado;
    lienzo
      .getContext('2d')!
      .drawImage(img, (img.naturalWidth - corte) / 2, (img.naturalHeight - corte) / 2, corte, corte, 0, 0, lado, lado);
    return await new Promise<Blob>((ok, falla) =>
      lienzo.toBlob((b) => (b ? ok(b) : falla(new Error('No se pudo procesar la foto'))), 'image/jpeg', 0.8),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Código aleatorio de 12 caracteres, sin letras confusas (0/O, 1/l/I).
export function generarCodigo(): string {
  const letras = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => letras[b % letras.length]).join('');
}
