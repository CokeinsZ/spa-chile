/**
 * Conexión a PostgreSQL.
 * Pool singleton (proceso Node de larga duración en modo standalone).
 * Todas las consultas usan parámetros ($1, $2, …) — nunca interpolar strings.
 */
import pg from 'pg';

let pool: pg.Pool | undefined;

export function getPool(): pg.Pool {
  if (!pool) {
    // process.env: las credenciales se leen en runtime, no en el build.
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('Falta la variable de entorno DATABASE_URL');
    }
    pool = new pg.Pool({ connectionString });
  }
  return pool;
}
