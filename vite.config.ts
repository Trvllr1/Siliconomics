import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-clerk': ['@clerk/clerk-react'],
            'vendor-query': ['@tanstack/react-query'],
            'vendor-charts': ['recharts'],
            'vendor-icons': ['lucide-react'],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {      // Local API (server.ts express on :3000) handles /api/* in dev.
      // Either run `npm run dev:server` (full app on :3000) or run it alongside `npm run dev` so this proxy has a target.
      // Disabled when vite runs embedded inside server.ts (VITE_EMBEDDED) to avoid self-proxying.
      proxy:
        process.env.VITE_EMBEDDED === 'true'
          ? undefined
          : {
              '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
              },
            },      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
