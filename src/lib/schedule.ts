/**
 * Reglas de agenda del negocio.
 * Módulo isomórfico: lo comparten el formulario (React) y los endpoints del
 * servidor, así las reglas de horario se definen una sola vez.
 *
 * Toda la lógica horaria se evalúa en la zona America/Santiago (con Intl),
 * independiente de la zona horaria del servidor o del navegador.
 */

export const BOOKING_TZ = 'America/Santiago';
/** Bloques de 2 h dentro de la jornada Lun–Vie 8:00–18:00. */
export const SLOT_HOURS = [8, 10, 12, 14, 16] as const;
export const SLOT_DURATION_HOURS = 2;
export const MIN_NOTICE_HOURS = 4;
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

/**
 * Ventana de agendamiento: [base + 4h, base + 30 días],
 * donde base = max(from, ahora). Sin `from`, equivale a "desde ahora".
 */
export function bookingWindow(from?: Date): { start: Date; end: Date } {
  const base = Math.max(from?.getTime() ?? 0, Date.now());
  return {
    start: new Date(base + MIN_NOTICE_HOURS * HOUR_MS),
    end: new Date(base + MAX_BOOKING_DAYS * DAY_MS),
  };
}

/** Todos los inicios de bloque candidatos dentro de la ventana (lun–vie, horas fijas). */
export function listCandidateSlots(start: Date, end: Date): Date[] {
  const slots: Date[] = [];
  const first = getZonedParts(start);
  const last = getZonedParts(end);
  const totalDays = Math.round(
    (Date.UTC(last.year, last.month - 1, last.day) - Date.UTC(first.year, first.month - 1, first.day)) / DAY_MS,
  );

  for (let i = 0; i <= totalDays; i++) {
    const dayDate = new Date(Date.UTC(first.year, first.month - 1, first.day + i));
    if (!isWorkingDay(dayDate.getUTCDay())) continue;
    const y = dayDate.getUTCFullYear();
    const m = dayDate.getUTCMonth() + 1;
    const d = dayDate.getUTCDate();
    for (const hour of SLOT_HOURS) {
      const instant = santiagoToUtc(y, m, d, hour);
      if (instant >= start && instant <= end) slots.push(instant);
    }
  }
  return slots.sort((a, b) => a.getTime() - b.getTime());
}

/** ¿Es un instante agendable? (alineado a bloque, día hábil lun–vie, dentro de la ventana). */
export function isBookableSlot(instant: Date): boolean {
  if (Number.isNaN(instant.getTime())) return false;
  const { start, end } = bookingWindow();
  if (instant < start || instant > end) return false;
  const parts = getZonedParts(instant);
  return (
    isWorkingDay(parts.weekday) &&
    parts.minute === 0 &&
    (SLOT_HOURS as readonly number[]).includes(parts.hour)
  );
}

/** Día de la semana (0 = domingo) de una fecha de calendario, sin ambigüedad de zona horaria. */
export function weekdayOfCalendarDate(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Parsea un parámetro `from=YYYY-MM-DD` como medianoche en Santiago. */
export function parseDateParam(raw: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = santiagoToUtc(year, month, day, 0);
  const parts = getZonedParts(date);
  if (parts.year !== year || parts.month !== month || parts.day !== day) return null;
  return date;
}
