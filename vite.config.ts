import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Custom service worker (src/sw.ts) instead of the fully-generated default — needed
      // for real `push`/`notificationclick` event handling (see item 2 of the brief: real
      // Web Push subscribe/unsubscribe, not just an installable shell). Workbox's
      // precaching/routing is still used inside sw.ts, just hand-wired instead of
      // auto-generated.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        // The app's own JS/CSS is chunked fairly large (see manualChunks below) — precache
        // only the app-shell entry points and static assets, not every hashed chunk, to
        // keep the generated precache manifest small; runtime navigations still work
        // online as normal (only the true-offline fallback route in sw.ts depends on this).
        globPatterns: ['**/*.{html,css,ico,svg,png}'],
      },
      registerType: 'autoUpdate',
      // vite-plugin-pwa disables the SW in dev by default — enabled here so the
      // "installable + SW registers" verification works against `npm run dev` too, not
      // only a production build.
      devOptions: { enabled: true, type: 'module' },
      includeAssets: ['favicon.svg', 'robots.txt', 'offline.html'],
      manifest: {
        name: 'ElderSphere',
        short_name: 'ElderSphere',
        description: 'Compassionate elderly-care coordination — bookings, medical records and emergency alerts.',
        theme_color: '#2F6F5E',
        background_color: '#F7F3EC',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  // sockjs-client (used by the WebSocket/chat layer) references the Node.js `global`
  // global at module load time, which the browser doesn't have — without this the whole
  // app fails to mount with "global is not defined". Standard Vite fix: alias it to
  // `globalThis`, which is available in every modern browser.
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        // Split third-party vendor code out of the main entry chunk (previously ~594kB —
        // the sole remaining >500kB warning once the per-role route chunks were split,
        // see routes/*Routes.tsx). These libraries change far less often than app code,
        // so pulling them into their own chunks also means a normal app-code deploy
        // doesn't invalidate the (larger, better-cached) vendor chunks for returning users.
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-mui": [
            "@mui/material",
            "@mui/icons-material",
            "@emotion/react",
            "@emotion/styled",
          ],
          // Split out separately from vendor-mui — @mui/x-date-pickers alone pushed that
          // chunk from ~408kB to ~619kB, re-triggering the >500kB build warning.
          "vendor-datepickers": ["@mui/x-date-pickers"],
          "vendor-motion": ["framer-motion"],
          "vendor-forms": ["formik", "yup"],
          "vendor-data": ["axios", "dayjs"],
          "vendor-realtime": ["@stomp/stompjs", "sockjs-client"],
        },
      },
    },
  },
});
