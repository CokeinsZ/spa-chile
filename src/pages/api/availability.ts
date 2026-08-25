/**
 * GET /api/availability?from=YYYY-MM-DD
 * Devuelve los bloques disponibles en la ventana [from + 4h, from + 30 días]
 * (por defecto from = ahora). La disponibilidad se calcula contra la BD,
 * que es la fuente de verdad.
 */
import type { APIRoute } from 'astro';
import {
  SLOT_DURATION_HOURS,
  bookingWindow,
  listCandidateSlots,
  parseDateParam,
} from '../../lib/schedule';
import { getTakenSlots } from '../../server/appointments';

export const prerender = false;

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

export const GET: APIRoute = async ({ url }) => {
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

  let taken: Set<number>;
  try {
    taken = await getTakenSlots(start, end);
  } catch (error) {
    console.error('Error consultando disponibilidad:', error);
    return json({ ok: false, error: 'No se pudo consultar la disponibilidad.' }, 500);
  }

  const available = listCandidateSlots(start, end)
    .filter((slot) => !taken.has(slot.getTime()))
    .map((slot) => slot.toISOString());

  return json({
    ok: true,
    from: start.toISOString(),
    to: end.toISOString(),
    slotDurationHours: SLOT_DURATION_HOURS,
    available,
  });
};
