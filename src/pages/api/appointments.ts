/**
 * POST /api/appointments
 * Recibe la solicitud de agendamiento, la valida de nuevo en el servidor
 * y registra la cita en la BD y en Google Calendar. No hay límite de citas
 * por horario, así que no se verifica disponibilidad.
 */
import type { APIRoute } from 'astro';
import { validateBooking } from '../../lib/validation';
import { attachCalendarEvent, createAppointment } from '../../server/appointments';
import { createCalendarEvent, isCalendarConfigured } from '../../server/calendar';

export const prerender = false;

const MAX_BODY_BYTES = 16_000;

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

export const POST: APIRoute = async ({ request }) => {
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return json({ ok: false, error: 'Solicitud demasiado grande.' }, 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Cuerpo de la solicitud inválido (se esperaba JSON).' }, 400);
  }

  // Validación servidor: nunca confiar en lo que envía el cliente.
  const { errors, value } = validateBooking(body);
  if (!value) {
    return json({ ok: false, errors }, 400);
  }

  let appointmentId: number;
  try {
    appointmentId = await createAppointment(value);
  } catch (error) {
    console.error('Error creando la cita:', error);
    return json({ ok: false, error: 'No se pudo registrar la cita. Inténtalo más tarde.' }, 500);
  }

  // Google Calendar: mejor esfuerzo. La cita ya quedó registrada en la BD.
  let calendarSynced = false;
  if (isCalendarConfigured()) {
    try {
      const eventId = await createCalendarEvent({
        fullName: value.fullName,
        phone: value.phone,
        device: value.device,
        brand: value.brand,
        problem: value.problem,
        commune: value.commune,
        address: value.address,
        start: new Date(value.scheduledAt),
      });
      await attachCalendarEvent(appointmentId, eventId);
      calendarSynced = true;
    } catch (error) {
      console.error(`Cita #${appointmentId} creada, pero falló Google Calendar:`, error);
    }
  }

  return json(
    { ok: true, appointmentId, scheduledAt: value.scheduledAt, calendarSynced },
    201,
  );
};
