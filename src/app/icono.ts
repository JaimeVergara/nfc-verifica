import { Component, computed, input } from '@angular/core';

// Íconos de línea (estilo Lucide) dibujados en SVG, sin librerías externas.
const ICONOS: Record<string, string[]> = {
  escudo: [
    'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
    'M9 12l2 2 4-4',
  ],
  nfc: [
    'M6 8.32a7.43 7.43 0 0 1 0 7.36',
    'M9.46 6.21a11.76 11.76 0 0 1 0 11.58',
    'M12.91 4.1a15.91 15.91 0 0 1 .01 15.8',
    'M16.37 2a20.16 20.16 0 0 1 0 20',
  ],
  qr: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M3 14h7v7H3z', 'M14 14h3v3h-3z', 'M20 14v3', 'M14 20h3', 'M20 20h1'],
  personas: [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0',
    'M22 21v-2a4 4 0 0 0-3-3.87',
    'M16 3.13a4 4 0 0 1 0 7.75',
  ],
  salir: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  copiar: ['M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z', 'M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2'],
  check: ['M20 6 9 17l-5-5'],
  x: ['M18 6 6 18', 'M6 6l12 12'],
  alerta: ['M12 9v4', 'M12 17h.01', 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'],
  bloqueado: ['M12 12m-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0', 'M4.9 4.9l14.2 14.2'],
  camara: [
    'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z',
    'M12 13m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
  ],
  atras: ['M19 12H5', 'M12 19l-7-7 7-7'],
  flecha: ['M9 18l6-6-6-6'],
  mas: ['M12 5v14', 'M5 12h14'],
  buscar: ['M11 11m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0', 'M21 21l-4.3-4.3'],
  energia: ['M12 2v10', 'M18.4 6.6a9 9 0 1 1-12.77.04'],
  inicio: ['M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
  descargar: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
  reloj: ['M12 12m-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0', 'M12 6v6l4 2'],
};

@Component({
  selector: 'app-icono',
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      @for (d of trazos(); track $index) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
})
export class Icono {
  readonly nombre = input.required<string>();
  protected readonly trazos = computed(() => ICONOS[this.nombre()] ?? []);
}
