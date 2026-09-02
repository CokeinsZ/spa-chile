/** Datos de contacto e identidad del negocio. */
export const site = {
  name: 'Servicio Americano SPA',
  tagline: 'Servicio Técnico Especializado',
  description:
    'Reparación de lavadoras, secadoras, aire acondicionado, refrigeración y cámaras de frío — en todas sus marcas. Diagnóstico honesto, repuestos originales y garantía por escrito.',
  phone: '+56959986627',
  phoneDisplay: '+56 9 5998 6627',
  email: 'contacto@servicioamericanospa.cl',
  address: 'Alonso de Córdova 5870, Las Condes — Santiago',
  hours: 'Lun – Vie · 8:00 a.m. – 6:00 p.m.',
  hoursShort: 'Lun – Vie',
} as const;

/** Construye un enlace de WhatsApp con mensaje prellenado. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${site.phone.replace('+', '')}?text=${encodeURIComponent(message)}`;
}

export const whatsappDefaultLink = whatsappLink('Hola, necesito servicio técnico');
