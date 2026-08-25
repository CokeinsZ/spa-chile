/**
 * Lectura de variables de entorno compatible con ambos modos de ejecución:
 * - `astro dev`: Astro carga .env y lo expone en `import.meta.env`.
 * - Servidor compilado (standalone): las variables llegan por `process.env`
 *   (exportadas en la shell o vía `node --env-file=.env`, ver `npm start`).
 *
 * Se prioriza process.env para que producción nunca dependa de valores
 * congelados en tiempo de build.
 */
type EnvName =
  | 'DATABASE_URL'
  | 'DATABASE_CA_CERT'
  | 'GOOGLE_CALENDAR_ID'
  | 'GOOGLE_CLIENT_EMAIL'
  | 'GOOGLE_PRIVATE_KEY';

export function env(name: EnvName): string | undefined {
  return process.env[name] ?? import.meta.env[name];
}
