import type { IconName } from './icons';

export interface Service {
  code: string;
  icon: IconName;
  title: string;
  description: string;
  brands: string;
}

export const services: Service[] = [
  {
    code: '01 / LAV',
    icon: 'washer',
    title: 'Lavadoras',
    description:
      'Fugas, ruidos, no centrifuga, no enciende, tarjetas electrónicas y sistemas de carga frontal y superior.',
    brands: 'LG · SAMSUNG · WHIRLPOOL · MABE',
  },
  {
    code: '02 / SEC',
    icon: 'dryer',
    title: 'Secadoras',
    description:
      'No calienta, ciclos incompletos, correas y resistencias, mantenimiento de ductos y sensores de humedad.',
    brands: 'LG · SAMSUNG · WHIRLPOOL · MABE',
  },
  {
    code: '03 / A/C',
    icon: 'ac',
    title: 'Aire acondicionado',
    description:
      'Instalación, recarga de gas, limpieza de filtros y evaporadora, mantenimiento preventivo tipo split e inverter.',
    brands: 'LG · MIDEA · YORK · CARRIER',
  },
  {
    code: '04 / REF',
    icon: 'fridge',
    title: 'Refrigeración',
    description:
      'Neveras que no enfrían, fugas de gas, termostatos, compresores y sellado de empaques.',
    brands: 'MABE · WHIRLPOOL · SAMSUNG · LG',
  },
  {
    code: '05 / CFR',
    icon: 'cold-room',
    title: 'Cámaras de frío',
    description:
      'Mantenimiento y reparación para restaurantes, tiendas y negocios — cuartos fríos, exhibidores y neveras industriales.',
    brands: 'EQUIPOS COMERCIALES · TODAS LAS MARCAS',
  },
  {
    code: '06 / MTO',
    icon: 'gear',
    title: 'Mantenimiento preventivo',
    description:
      'Planes periódicos para hogares y negocios: menos daños imprevistos, más vida útil de sus equipos.',
    brands: 'PLANES MENSUALES Y TRIMESTRALES',
  },
];
