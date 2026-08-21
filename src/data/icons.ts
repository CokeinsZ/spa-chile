/**
 * Registro central de iconos SVG.
 * Fuente única consumida por `atoms/Icon.astro` y por los
 * componentes React (`react/Icon.tsx`), para no duplicar paths.
 */
export interface IconDef {
  /** Contenido interno del <svg> (paths, rects, circles…). */
  body: string;
  viewBox?: string;
  /** true → fill="currentColor"; false → stroke="currentColor". */
  fill?: boolean;
  strokeWidth?: number;
}

export const icons = {
  washer: {
    body: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="14" r="5"/><circle cx="12" cy="14" r="2"/><circle cx="7" cy="6.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="10" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>',
    strokeWidth: 1.6,
  },
  dryer: {
    body: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 14c0-1.5 1-2 2-2s1.5 1 2.5 1 1.5-1 2.5-1"/><circle cx="12" cy="15.5" r="4.2"/>',
    strokeWidth: 1.6,
  },
  ac: {
    body: '<rect x="3" y="6" width="18" height="8" rx="1.5"/><path d="M6 17l1-3M11 17l1-3M16 17l1-3"/>',
    strokeWidth: 1.6,
  },
  fridge: {
    body: '<rect x="5" y="2" width="14" height="20" rx="1.5"/><path d="M5 11h14"/><path d="M8 5v3M8 14v3"/>',
    strokeWidth: 1.6,
  },
  'cold-room': {
    body: '<path d="M4 9h16v10H4z"/><path d="M4 9l4-5h8l4 5"/><path d="M12 13v3M10 14.5h4"/>',
    strokeWidth: 1.6,
  },
  gear: {
    body: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 004.6 15a1.7 1.7 0 00-1.55-1H3a2 2 0 110-4h.09A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 009 4.6a1.7 1.7 0 001-1.55V3a2 2 0 114 0v.09a1.7 1.7 0 001 1.55 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06A1.7 1.7 0 0019.4 9a1.7 1.7 0 001.55 1H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.55 1z"/>',
    strokeWidth: 1.6,
  },
  'check-circle': {
    body: '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>',
    strokeWidth: 2,
  },
  badge: {
    body: '<path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/>',
    strokeWidth: 2,
  },
  clock: {
    body: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    strokeWidth: 2,
  },
  menu: {
    body: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    strokeWidth: 2,
  },
  close: {
    body: '<path d="M6 6l12 12M18 6L6 18"/>',
    strokeWidth: 2,
  },
  whatsapp: {
    body: '<path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.87.5 3.63 1.44 5.15L2 22l5.09-1.53a9.87 9.87 0 004.95 1.33h.01c5.46 0 9.9-4.45 9.9-9.9C21.95 6.45 17.5 2 12.04 2zm5.78 14.13c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.13.11-1.82-.11-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.8-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.27-.29.58-.36.78-.36h.56c.18 0 .42-.07.66.5.24.58.82 2 .89 2.14.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.75 1.24 1.61 2.01 1.11.99 2.04 1.3 2.33 1.45.29.15.46.13.63-.08.17-.2.72-.84.91-1.13.19-.29.38-.24.63-.14.26.1 1.65.78 1.93.92.29.15.48.22.55.34.07.13.07.72-.17 1.4z"/>',
    fill: true,
  },
} as const satisfies Record<string, IconDef>;

export type IconName = keyof typeof icons;
