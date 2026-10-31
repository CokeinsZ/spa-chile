import { useEffect, useRef, useState } from 'react';

/** Parte de la API global `window.turnstile` que usa el widget. */
interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

// Cloudflare exige cargar el script desde esta URL exacta (sin proxy ni caché propia).
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise: Promise<TurnstileApi> | undefined;

/** Carga el script de Turnstile una sola vez por página. */
function loadTurnstile(): Promise<TurnstileApi> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile no se inicializó'));
    script.onerror = () => {
      // Permite reintentar si el widget se vuelve a montar.
      scriptPromise = undefined;
      script.remove();
      reject(new Error('No se pudo cargar Turnstile'));
    };
    document.head.append(script);
  });
  return scriptPromise;
}

interface TurnstileWidgetProps {
  siteKey: string;
  /**
   * Recibe el token cuando se resuelve la verificación, y '' cuando vence o falla.
   * Debe ser estable (p. ej. un setter de useState).
   */
  onTokenChange: (token: string) => void;
  error?: string;
}

/**
 * Widget de Cloudflare Turnstile (verificación anti-bots).
 * Cada token sirve una sola vez: para obtener uno nuevo, el padre vuelve a
 * montar el widget cambiándole la `key`.
 */
export function TurnstileWidget({ siteKey, onTokenChange, error }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let widgetId: string | undefined;
    let cancelled = false;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return;
        widgetId = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          language: 'es',
          theme: 'light',
          size: 'flexible',
          callback: (token: string) => onTokenChange(token),
          'expired-callback': () => onTokenChange(''),
          'error-callback': () => onTokenChange(''),
        });
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
      if (widgetId !== undefined) window.turnstile?.remove(widgetId);
    };
  }, [siteKey, onTokenChange]);

  const message = loadFailed
    ? 'No se pudo cargar la verificación de seguridad. Desactiva bloqueadores de anuncios o escríbenos por WhatsApp.'
    : error;

  return (
    <div className="flex flex-col gap-1.5">
      {/* Reserva el alto del widget (65 px) para que el formulario no salte al cargarlo. */}
      <div ref={containerRef} className="min-h-[65px]" />
      {message && (
        <p role="alert" className="text-xs font-medium text-brick">
          {message}
        </p>
      )}
    </div>
  );
}
