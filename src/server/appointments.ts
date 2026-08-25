/**
 * Lógica de persistencia de citas.
 * La BD es la fuente de verdad de la disponibilidad: la restricción
 * UNIQUE(services.scheduled_date) impide el doble agendamiento incluso ante
 * dos solicitudes simultáneas (la segunda falla con 23505 → HTTP 409).
 */
import { getPool } from './db';
import type { BookingPayload } from '../lib/validation';

/** Instantes ya agendados dentro de [start, end]. */
export async function getTakenSlots(start: Date, end: Date): Promise<Set<number>> {
  const { rows } = await getPool().query<{ scheduled_date: Date }>(
    'SELECT scheduled_date FROM services WHERE scheduled_date >= $1 AND scheduled_date <= $2',
    [start.toISOString(), end.toISOString()],
  );
  return new Set(rows.map((row) => new Date(row.scheduled_date).getTime()));
}

/**
 * Crea la cita en una transacción: upsert del cliente por teléfono +
 * inserción del servicio. Devuelve el id del servicio creado.
 * Lanza pg error 23505 si el horario ya está tomado.
 */
export async function createAppointment(payload: BookingPayload): Promise<number> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query<{ id: number }>(
      `INSERT INTO users (full_name, email, phone_number)
       VALUES ($1, $2, $3)
       ON CONFLICT (phone_number) DO UPDATE
         SET full_name = EXCLUDED.full_name,
             email = EXCLUDED.email,
             updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [payload.fullName, payload.email ?? null, payload.phone],
    );

    const serviceResult = await client.query<{ id: number }>(
      `INSERT INTO services
         (user_id, commune, full_address, broken_device, device_brand, user_problem_description, scheduled_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        userResult.rows[0].id,
        payload.commune,
        payload.address,
        payload.device,
        payload.brand,
        payload.problem,
        payload.scheduledAt,
      ],
    );

    await client.query('COMMIT');
    return serviceResult.rows[0].id;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/** Guarda el id del evento de Google Calendar asociado a la cita. */
export async function attachCalendarEvent(appointmentId: number, eventId: string): Promise<void> {
  await getPool().query(
    'UPDATE services SET google_event_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [eventId, appointmentId],
  );
}
