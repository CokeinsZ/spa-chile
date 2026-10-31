/**
 * POST /api/appointments
 * Recibe la solicitud de agendamiento, la valida de nuevo en el servidor,
 * comprueba con Cloudflare Turnstile que viene de una persona usando el
 * formulario y registra la cita en la BD y en Google Calendar. No hay límite
 * de citas por horario, así que no se verifica disponibilidad.
 */
import type { APIRoute } from 'astro';
import { validateBooking } from '../../lib/validation';
import { attachCalendarEvent, createAppointment } from '../../server/appointments';
import { verifyTurnstileToken } from '../../server/turnstile';
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

  // Anti-bots. Va después de validar los datos para no gastar el token
  // (de un solo uso) en una solicitud que igual se iba a rechazar.
  const { turnstileToken } = body as { turnstileToken?: unknown };
  let verified: boolean;
  try {
    verified = await verifyTurnstileToken(
      typeof turnstileToken === 'string' ? turnstileToken : '',
      // IP real del visitante: el sitio pasa por el proxy de Cloudflare.
      request.headers.get('cf-connecting-ip') ?? undefined,
    );
  } catch (error) {
    console.error('No se pudo verificar Turnstile:', error);
    return json({ ok: false, error: 'No pudimos verificar la solicitud. Inténtalo más tarde.' }, 503);
  }
  if (!verified) {
    return json(
      { ok: false, error: 'No pudimos verificar que no eres un robot. Inténtalo de nuevo.' },
      403,
    );
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
