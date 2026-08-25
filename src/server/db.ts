/**
 * Conexión a PostgreSQL.
 * Pool singleton (proceso Node de larga duración en modo standalone).
 */
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { env } from './env';

let pool: pg.Pool | undefined;

/**
 * Construye la config del pool a partir de la DATABASE_URL.
 *
 * El parámetro `sslmode` se consume aquí (y se retira de la cadena) porque
 * pg v8.13+ lo interpreta con semántica estricta (verify-full), lo que rompe
 * contra Supabase: su pooler firma con una CA propia que no está en el
 * almacén de confianza del sistema.
 *
 * Con SSL activo hay dos niveles:
 * - Con DATABASE_CA_CERT (ruta al .crt descargado de Supabase): cifrado +
 *   verificación completa del servidor contra esa CA. Nivel recomendado.
 * - Sin DATABASE_CA_CERT: cifrado TLS sin verificar la cadena (equivalente al
 *   sslmode=require de libpq). Protege la confidencialidad, no contra MITM.
 */
function makePoolConfig(raw: string): pg.PoolConfig {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    // Cadena no-URL (formato keyword): se pasa tal cual, sin SSL.
    return { connectionString: raw };
  }

  const sslmode = url.searchParams.get('sslmode');
  url.searchParams.delete('sslmode');
  if (!sslmode || sslmode === 'disable') {
    return { connectionString: url.toString() };
  }

  const caPath = env('DATABASE_CA_CERT');
  if (caPath) {
    let ca: string;
    try {
      ca = readFileSync(caPath, 'utf8');
    } catch {
      throw new Error(`No se pudo leer el certificado CA indicado en DATABASE_CA_CERT: "${caPath}"`);
    }
    return {
      connectionString: url.toString(),
      ssl: { ca, rejectUnauthorized: true },
    };
  }

  console.warn(
    '[db] Conexión cifrada SIN verificar el certificado del servidor. ' +
      'Para verificación completa define DATABASE_CA_CERT con la CA de Supabase.',
  );
  return { connectionString: url.toString(), ssl: { rejectUnauthorized: false } };
}

export function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = env('DATABASE_URL');
    if (!connectionString) {
      throw new Error('Falta la variable de entorno DATABASE_URL');
    }
    pool = new pg.Pool(makePoolConfig(connectionString));
  }
  return pool;
}
