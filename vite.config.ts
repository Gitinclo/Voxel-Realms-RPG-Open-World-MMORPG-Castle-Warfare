import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    base: process.env.VITE_BASE_PATH || '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 750,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'vendor-three-core',
                test: /node_modules\/three\/build\/three\.core/,
                priority: 40,
              },
              {
                name: 'vendor-three',
                test: /node_modules\/three\//,
                priority: 35,
              },
              {
                name: 'vendor-physics',
                test: /node_modules\/(cannon-es|three-mesh-bvh|simplex-noise|@tweenjs|canvas-confetti)\//,
                priority: 30,
              },
              {
                name: 'vendor-firebase',
                test: /node_modules\/(firebase|@firebase)\//,
                priority: 25,
              },
              {
                name: 'vendor-d3',
                test: /node_modules\/(d3|internmap)/,
                priority: 20,
              },
              {
                name: 'vendor-motion',
                test: /node_modules\/(motion|framer-motion)/,
                priority: 20,
              },
              {
                name: 'vendor-icons',
                test: /node_modules\/lucide-react/,
                priority: 20,
              },
              {
                name: 'vendor-react',
                test: /node_modules\/(react|react-dom|scheduler)\//,
                priority: 20,
              },
            ],
          },
        },
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
