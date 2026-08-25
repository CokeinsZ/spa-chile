/**
 * Integración con Google Calendar (cuenta de servicio).
 * La base de datos es la fuente de verdad; Calendar es una réplica para el
 * equipo. Si no está configurado o falla, el agendamiento igual queda
 * registrado en la BD y el error solo se registra en log.
 *
 * Requisito: compartir el calendario (con permiso de edición) con el email
 * de la cuenta de servicio GOOGLE_CLIENT_EMAIL.
 */
import { google, type calendar_v3 } from 'googleapis';
import { BOOKING_TZ, SLOT_DURATION_HOURS } from '../lib/schedule';

export interface CalendarEventDetails {
  fullName: string;
  phone: string;
  device: string;
  brand: string;
  problem: string;
  commune: string;
  address: string;
  start: Date;
}

// process.env: las credenciales se leen en runtime, no en el build.
export function isCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CALENDAR_ID &&
      process.env.GOOGLE_CLIENT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY,
  );
}

let client: calendar_v3.Calendar | undefined;

function getClient(): calendar_v3.Calendar {
  if (!client) {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      // La key llega por env con "\n" escapados.
      key: String(process.env.GOOGLE_PRIVATE_KEY).replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    client = google.calendar({ version: 'v3', auth });
  }
  return client;
}

/** Crea el evento y devuelve su id. Lanza si la API falla. */
export async function createCalendarEvent(details: CalendarEventDetails): Promise<string> {
  const end = new Date(details.start.getTime() + SLOT_DURATION_HOURS * 3_600_000);
  const response = await getClient().events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    requestBody: {
      summary: `Visita técnica — ${details.device} (${details.brand})`,
      location: `${details.address}, ${details.commune}`,
      description: [
        `Cliente: ${details.fullName}`,
        `Teléfono: +56 9 ${details.phone}`,
        `Falla reportada: ${details.problem}`,
      ].join('\n'),
      start: { dateTime: details.start.toISOString(), timeZone: BOOKING_TZ },
      end: { dateTime: end.toISOString(), timeZone: BOOKING_TZ },
    },
  });
  if (!response.data.id) throw new Error('Google Calendar no devolvió id de evento');
  return response.data.id;
}
