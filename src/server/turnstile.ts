/**
 * Verificación anti-bots con Cloudflare Turnstile.
 * El widget del formulario entrega un token que aquí se valida contra
 * Cloudflare antes de registrar la cita. Cada token vale 5 minutos y se
 * puede validar una sola vez.
 *
 * Sin TURNSTILE_SECRET_KEY no se acepta ninguna cita: un error de
 * configuración nunca debe dejar el formulario abierto a bots.
 */
import { env } from './env';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const VERIFY_TIMEOUT_MS = 10_000;
/** Largo máximo de un token según la documentación de Cloudflare. */
const MAX_TOKEN_LENGTH = 2048;

interface SiteverifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

/**
 * ¿El token prueba que la solicitud viene de una persona usando el formulario?
 * Devuelve false si Cloudflare lo rechaza (bot, token vencido o reutilizado).
 * Lanza si falta o es inválida la clave secreta, o si Cloudflare no responde.
 */
export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<boolean> {
  const secret = env('TURNSTILE_SECRET_KEY');
  if (!secret) throw new Error('Falta la variable de entorno TURNSTILE_SECRET_KEY');
  if (!token || token.length > MAX_TOKEN_LENGTH) return false;

  const response = await fetch(SITEVERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, response: token, remoteip: remoteIp }),
    signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
  });
  // Cloudflare responde JSON también en los errores HTTP (p. ej. 400 con clave secreta inválida).
  const result = (await response.json().catch(() => null)) as SiteverifyResponse | null;
  const codes = result?.['error-codes'] ?? [];
  // Un problema con la clave secreta es error nuestro, no del visitante.
  if (codes.some((code) => code.endsWith('-input-secret'))) {
    throw new Error(`Clave secreta de Turnstile rechazada: ${codes.join(', ')}`);
  }
  if (!response.ok || !result) {
    throw new Error(`Turnstile respondió HTTP ${response.status}: ${codes.join(', ') || 'sin detalle'}`);
  }
  if (!result.success) console.warn('Turnstile rechazó un token:', codes.join(', '));
  return result.success === true;
}
