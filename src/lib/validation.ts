/**
 * Validación de la solicitud de agendamiento.
 * Módulo isomórfico: el formulario lo usa para validar antes de enviar y el
 * servidor lo vuelve a ejecutar sobre lo recibido (nunca confiar en el cliente).
 */
import { isBookableSlot } from './schedule';

export const DEVICE_OPTIONS = [
  'Nevera / Refrigerador',
  'Aire acondicionado',
  'Cámara de frío',
  'Lavadora',
  'Secadora',
  'Otro',
] as const;

export interface BookingPayload {
  fullName: string;
  /** Teléfono normalizado: solo los 8 dígitos (sin "+56 9"). */
  phone: string;
  email?: string;
  commune: string;
  address: string;
  device: string;
  brand: string;
  problem: string;
  /** ISO 8601 — inicio del bloque agendado. */
  scheduledAt: string;
}

export type BookingErrors = Partial<Record<keyof BookingPayload, string>>;

/**
 * Normaliza un celular chileno a sus 8 dígitos finales.
 * Acepta prefijos "+56 9", "56 9" o "9"; cualquier otro formato se rechaza.
 */
export function normalizeChileanPhone(raw: string): string | null {
  const clean = raw.replace(/[\s().-]/g, '');
  const match =
    /^\+569(\d{8})$/.exec(clean) ??
    /^569(\d{8})$/.exec(clean) ??
    /^9(\d{8})$/.exec(clean) ??
    /^(\d{8})$/.exec(clean);
  if (!match) return null;
  const digits = match[1];
  // 8 dígitos idénticos (11111111, 99999999…) no son números reales.
  if (/^(\d)\1{7}$/.test(digits)) return null;
  return digits;
}

const NAME_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)+$/;
const LETTER_RE = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/;
const COMMUNE_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9' .-]{2,60}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Valida y normaliza una solicitud de agendamiento.
 * Devuelve `value` solo si no hay errores.
 */
export function validateBooking(input: unknown): { errors: BookingErrors; value: BookingPayload | null } {
  const errors: BookingErrors = {};
  const data = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>;
  const str = (key: string): string => (typeof data[key] === 'string' ? (data[key] as string).trim() : '');

  const fullName = str('fullName');
  if (fullName.length < 5 || fullName.length > 80 || !NAME_RE.test(fullName)) {
    errors.fullName = 'Ingresa tu nombre y apellido (solo letras).';
  }

  const phone = normalizeChileanPhone(str('phone'));
  if (!phone) {
    errors.phone = 'Ingresa un celular chileno válido (ej: 12345678 o +56 9 12345678).';
  }

  const email = str('email');
  if (email && (email.length > 255 || !EMAIL_RE.test(email))) {
    errors.email = 'Ingresa un correo válido o deja el campo vacío.';
  }

  const commune = str('commune');
  if (!COMMUNE_RE.test(commune) || !LETTER_RE.test(commune)) {
    errors.commune = 'Ingresa una comuna válida.';
  }

  const address = str('address');
  if (address.length < 5 || address.length > 120 || !LETTER_RE.test(address) || !/\d/.test(address)) {
    errors.address = 'Ingresa la dirección con numeración (ej: Av. Providencia 1234, depto 501).';
  }

  const device = str('device');
  if (!(DEVICE_OPTIONS as readonly string[]).includes(device)) {
    errors.device = 'Selecciona el tipo de equipo.';
  }

  const brand = str('brand');
  if (brand.length < 2 || brand.length > 40) {
    errors.brand = 'Ingresa la marca del equipo (2–40 caracteres).';
  }

  const problem = str('problem');
  if (problem.length < 10 || problem.length > 500) {
    errors.problem = 'Describe la falla con un poco más de detalle (10–500 caracteres).';
  }

  const scheduledAt = str('scheduledAt');
  const instant = new Date(scheduledAt);
  if (!scheduledAt || Number.isNaN(instant.getTime()) || !isBookableSlot(instant)) {
    errors.scheduledAt =
      'Elige un horario válido: lunes a sábado, bloques de 2 h entre 8:00 y 18:00, con al menos 4 h de anticipación.';
  }

  if (Object.keys(errors).length > 0) return { errors, value: null };

  return {
    errors,
    value: {
      fullName,
      phone: phone!,
      email: email || undefined,
      commune,
      address,
      device,
      brand,
      problem,
      scheduledAt: instant.toISOString(),
    },
  };
}
