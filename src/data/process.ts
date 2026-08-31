export interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

export const processSteps: ProcessStep[] = [
  {
    number: '01',
    title: 'Diagnóstico',
    description:
      'Un técnico revisa el equipo en su casa o negocio e identifica la falla real, no solo el síntoma.',
  },
  {
    number: '02',
    title: 'Cotización',
    description:
      'Le explicamos qué encontramos y cuánto cuesta arreglarlo, antes de tocar una sola pieza.',
  },
  {
    number: '03',
    title: 'Reparación',
    description:
      'Trabajamos con repuestos adecuados y probamos el equipo en funcionamiento real antes de irnos.',
  },
  {
    number: '04',
    title: 'Garantía',
    description:
      'Entregamos facturación y poliza de garantía electrónica.',
  },
];
