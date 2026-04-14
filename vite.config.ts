import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite config untuk Netlify (React + TailwindCSS)
// Checklist:
// - base: '/' (wajib untuk Netlify)
// - outputDir: 'dist' (default, pastikan tidak diubah)
// - hash file aktif (default)
// - sourcemap: false (opsional, default false)
// - manualChunks: opsional, untuk optimasi

export default defineConfig({
  base: '/', // PENTING untuk Netlify agar path asset benar
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: '/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/main.tsx', 'src/router/**', 'src/pages/**'],
    },
  },
  build: {
    outDir: 'dist', // default, pastikan tidak diubah
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          state: ['zustand'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
