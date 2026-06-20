import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  // Ensure public folder and PWA assets exist
  const __dirname = path.resolve();
  const publicDir = path.resolve(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const srcIcon = path.resolve(__dirname, 'src/assets/images/scene_writer_pwa_icon_1781912499999.jpg');
  if (fs.existsSync(srcIcon)) {
    // Only copy jpg files to public and do not overwrite the generated valid pngs
    fs.copyFileSync(srcIcon, path.resolve(publicDir, 'icon-192.jpg'));
    fs.copyFileSync(srcIcon, path.resolve(publicDir, 'icon-512.jpg'));
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'inline',
        manifestFilename: 'manifest.json',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,woff,woff2}'],
          navigateFallback: 'index.html',
          cleanupOutdatedCaches: true
        },
        manifest: {
          name: 'Scene Writer',
          short_name: 'Scene Writer',
          description: 'A professional, lightweight mobile screenplay writing application optimized for English and Arabic scriptwriters.',
          theme_color: '#111111',
          background_color: '#111111',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
