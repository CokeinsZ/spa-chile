/** Marcas mostradas en el carrusel de la sección de servicios. */
export interface Brand {
  name: string;
  src: string;
}

export const brands: Brand[] = [
  { name: 'GE', src: '/ge.png' },
  { name: 'Kenmore', src: '/kenmore.png' },
  { name: 'LG', src: '/lg.png' },
  { name: 'Mabe', src: '/mabe.png' },
  { name: 'Maytag', src: '/maytag.png' },
  { name: 'Samsung', src: '/samsung.png' },
  { name: 'Sub-Zero', src: '/subzero.png' },
  { name: 'Whirlpool', src: '/whirlpool.png' },
];
