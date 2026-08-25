/**
 * Verifica la integración con Google Calendar:
 *   1. Credenciales presentes y autenticación válida
 *   2. Acceso al calendario compartido
 *   3. Crea y elimina un evento de prueba
 *
 * Uso: npm run calendar:check
 * (lee las variables desde .env gracias a --env-file)
 */
import { google } from 'googleapis';

const { GOOGLE_CALENDAR_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY } = process.env;

if (!GOOGLE_CALENDAR_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
  console.error(
    '✗ Faltan variables. Completa GOOGLE_CALENDAR_ID, GOOGLE_CLIENT_EMAIL y GOOGLE_PRIVATE_KEY en .env',
  );
  process.exit(1);
}

const auth = new google.auth.JWT({
  email: GOOGLE_CLIENT_EMAIL,
  key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/calendar'],
});
const calendar = google.calendar({ version: 'v3', auth });

try {
  const cal = await calendar.calendars.get({ calendarId: GOOGLE_CALENDAR_ID });
  console.log(`✓ Calendario accesible: "${cal.data.summary}"`);
} catch (error) {
  console.error('✗ No se pudo acceder al calendario.');
  console.error('  ¿Compartiste el calendario con', GOOGLE_CLIENT_EMAIL, '?');
  console.error('  Detalle:', error.message);
  process.exit(1);
}

try {
  const start = new Date(Date.now() + 24 * 3_600_000);
  const end = new Date(start.getTime() + 2 * 3_600_000);
  const event = await calendar.events.insert({
    calendarId: GOOGLE_CALENDAR_ID,
    requestBody: {
      summary: 'Prueba de conexión — se elimina sola',
      start: { dateTime: start.toISOString(), timeZone: 'America/Santiago' },
      end: { dateTime: end.toISOString(), timeZone: 'America/Santiago' },
    },
  });
  console.log('✓ Evento de prueba creado:', event.data.id);

  await calendar.events.delete({ calendarId: GOOGLE_CALENDAR_ID, eventId: event.data.id });
  console.log('✓ Evento de prueba eliminado.');
  console.log('\n¡Integración con Google Calendar funcionando!');
} catch (error) {
  console.error('✗ El calendario es visible pero no se pudo crear el evento.');
  console.error('  Revisa que el permiso compartido sea "Hacer cambios en eventos".');
  console.error('  Detalle:', error.message);
  process.exit(1);
}
