/**
 * Lógica de persistencia de citas.
 * La BD es la fuente de verdad de la disponibilidad. Se aceptan hasta
 * MAX_APPOINTMENTS_PER_SLOT citas por bloque horario; el cupo se protege
 * ante solicitudes simultáneas con un bloqueo de advisory por bloque
 * (pg_advisory_xact_lock), de modo que el conteo + inserción es atómico.
 */
import { getPool } from './db';
import { MAX_APPOINTMENTS_PER_SLOT } from '../lib/schedule';
import type { BookingPayload } from '../lib/validation';

/** El bloque ya tiene el máximo de citas permitidas. */
export class SlotFullError extends Error {
  constructor() {
    super('El bloque horario ya está completo');
    this.name = 'SlotFullError';
  }
}

/** Citas por bloque dentro de [start, end] (instante en epoch ms → cantidad). */
export async function getSlotCounts(start: Date, end: Date): Promise<Map<number, number>> {
  const { rows } = await getPool().query<{ scheduled_date: Date; count: number }>(
    `SELECT scheduled_date, COUNT(*)::int AS count
     FROM services
     WHERE scheduled_date >= $1 AND scheduled_date <= $2
     GROUP BY scheduled_date`,
    [start.toISOString(), end.toISOString()],
  );
  return new Map(rows.map((row) => [new Date(row.scheduled_date).getTime(), row.count]));
}

/** ¿Quedan cupos en el bloque indicado? */
export function hasSlotCapacity(counts: Map<number, number>, slot: Date): boolean {
  return (counts.get(slot.getTime()) ?? 0) < MAX_APPOINTMENTS_PER_SLOT;
}

/**
 * Crea la cita en una transacción:
 *   1. Bloqueo de advisory por bloque horario (serializa solicitudes concurrentes)
 *   2. Verificación de cupo (máx. MAX_APPOINTMENTS_PER_SLOT)
 *   3. Upsert del cliente por teléfono + inserción del servicio
 * Devuelve el id del servicio creado. Lanza SlotFullError si no quedan cupos.
 */
export async function createAppointment(payload: BookingPayload): Promise<number> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    // Serializa las inserciones concurrentes del MISMO bloque horario.
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [
      payload.scheduledAt,
    ]);

    const countResult = await client.query<{ count: number }>(
      'SELECT COUNT(*)::int AS count FROM services WHERE scheduled_date = $1',
      [payload.scheduledAt],
    );
    if (countResult.rows[0].count >= MAX_APPOINTMENTS_PER_SLOT) {
      throw new SlotFullError();
    }

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
