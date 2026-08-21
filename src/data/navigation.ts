export interface NavLink {
  href: string;
  label: string;
}

export const navLinks: NavLink[] = [
  { href: '#servicios', label: 'Servicios' },
  { href: '#proceso', label: 'Cómo trabajamos' },
  { href: '#garantia', label: 'Garantía' },
  { href: '#contacto', label: 'Contacto' },
];
