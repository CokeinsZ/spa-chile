/**
 * GET /api/availability?from=YYYY-MM-DD
 * Devuelve los horarios agendables (mañana/tarde, lun–vie) en la ventana
 * [from + 4h, from + 30 días] (por defecto from = ahora). Como no hay límite
 * de citas por horario, la disponibilidad depende solo de las reglas de agenda.
 */
import type { APIRoute } from 'astro';
import {
  bookingWindow,
  findSlotByStartHour,
  getZonedParts,
  listCandidateSlots,
  parseDateParam,
  slotEnd,
} from '../../lib/schedule';

export const prerender = false;

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

export const GET: APIRoute = ({ url }) => {
  const rawFrom = url.searchParams.get('from');

  let from: Date | undefined;
  if (rawFrom !== null) {
    const parsed = parseDateParam(rawFrom);
    if (!parsed) {
      return json(
        { ok: false, error: 'Parámetro "from" inválido. Usa el formato YYYY-MM-DD.' },
        400,
      );
    }
    from = parsed;
  }

  const { start, end } = bookingWindow(from);

  const available = listCandidateSlots(start, end).map((slot) => ({
    start: slot.toISOString(),
    end: slotEnd(slot).toISOString(),
    label: findSlotByStartHour(getZonedParts(slot).hour)!.label,
  }));

  return json({
    ok: true,
    from: start.toISOString(),
    to: end.toISOString(),
    available,
  });
};
