// @ts-check
import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // SSR: la home se prerenderiza estática (prerender=true en index.astro)
  // y los endpoints /api/* corren en el servidor Node.
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  env: {
    schema: {
      // Site key pública del widget de Cloudflare Turnstile. La usa el navegador
      // y la home es estática, así que se incrusta al compilar: debe existir en
      // el build (.env en local, build arg en Docker). Si falta, el build falla.
      // La secret key NO va aquí: se lee en runtime desde src/server/env.ts.
      TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', min: 1 }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
