/**
 * Reglas de agenda del negocio.
 * Módulo isomórfico: lo comparten el formulario (React) y los endpoints del
 * servidor, así las reglas de horario se definen una sola vez.
 *
 * Toda la lógica horaria se evalúa en la zona America/Santiago (con Intl),
 * independiente de la zona horaria del servidor o del navegador.
 */

export const BOOKING_TZ = 'America/Santiago';

export interface TimeSlot {
  label: string;
  /** Hora de inicio en reloj de Santiago. */
  startHour: number;
  /** Hora de término en reloj de Santiago. */
  endHour: number;
}

/**
 * Horarios agendables Lun–Vie. Sin límite de citas por horario: el cliente
 * elige la jornada y el equipo organiza las visitas dentro de ella.
 */
export const TIME_SLOTS: readonly TimeSlot[] = [
  { label: 'Mañana', startHour: 8, endHour: 12 },
  { label: 'Tarde', startHour: 12, endHour: 18 },
];
export const MIN_NOTICE_HOURS = 12;
export const MAX_BOOKING_DAYS = 30;

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const MONDAY = 1;
const FRIDAY = 5;

/** Días hábiles del negocio: lunes a viernes. */
export function isWorkingDay(weekday: number): boolean {
  return weekday >= MONDAY && weekday <= FRIDAY;
}

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** 0 = domingo … 6 = sábado */
  weekday: number;
}

const WEEKDAYS: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: BOOKING_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  weekday: 'short',
});

/** Componentes de reloj/calendario de un instante, en America/Santiago. */
export function getZonedParts(instant: Date): ZonedParts {
  const map: Record<string, string> = {};
  for (const part of partsFormatter.formatToParts(instant)) map[part.type] = part.value;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    weekday: WEEKDAYS[map.weekday],
  };
}

/** Offset (ms) entre America/Santiago y UTC en ese instante. */
function tzOffsetMs(instant: Date): number {
  const map: Record<string, string> = {};
  for (const part of partsFormatter.formatToParts(instant)) map[part.type] = part.value;
  const wallAsUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return wallAsUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** Convierte una hora de reloj de Santiago al instante UTC correspondiente. */
export function santiagoToUtc(year: number, month: number, day: number, hour: number, minute = 0): Date {
  let guess = Date.UTC(year, month - 1, day, hour, minute);
  // Itera el offset (cambia en transiciones de horario de verano) hasta converger.
  for (let i = 0; i < 3; i++) {
    const next = Date.UTC(year, month - 1, day, hour, minute) - tzOffsetMs(new Date(guess));
    if (next === guess) break;
    guess = next;
  }
  return new Date(guess);
}

/** Ventana de agendamiento: [ahora + MIN_NOTICE_HOURS, ahora + MAX_BOOKING_DAYS]. */
function bookingWindow(): { start: Date; end: Date } {
  const now = Date.now();
  return {
    start: new Date(now + MIN_NOTICE_HOURS * HOUR_MS),
    end: new Date(now + MAX_BOOKING_DAYS * DAY_MS),
  };
}

/** Horario que comienza a esa hora (reloj de Santiago), si existe. */
export function findSlotByStartHour(hour: number): TimeSlot | undefined {
  return TIME_SLOTS.find((slot) => slot.startHour === hour);
}

/** Fin del horario que comienza en `start`. Lanza si `start` no es inicio de un horario. */
export function slotEnd(start: Date): Date {
  const parts = getZonedParts(start);
  const slot = findSlotByStartHour(parts.hour);
  if (!slot || parts.minute !== 0) throw new Error(`${start.toISOString()} no es inicio de un horario`);
  return santiagoToUtc(parts.year, parts.month, parts.day, slot.endHour);
}

/** ¿Es un instante agendable? (inicio de horario, día hábil lun–vie, dentro de la ventana). */
export function isBookableSlot(instant: Date): boolean {
  if (Number.isNaN(instant.getTime())) return false;
  const { start, end } = bookingWindow();
  if (instant < start || instant > end) return false;
  const parts = getZonedParts(instant);
  return (
    isWorkingDay(parts.weekday) &&
    parts.minute === 0 &&
    findSlotByStartHour(parts.hour) !== undefined
  );
}

/** Día de la semana (0 = domingo) de una fecha de calendario, sin ambigüedad de zona horaria. */
export function weekdayOfCalendarDate(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}
