import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    css: true,
    reporters: ['verbose'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      'e2e/**/*.spec.ts',  // Exclude Playwright E2E tests
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '.next/',
        'dist/',
        '.yoyo/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockServiceWorker.js',
        'e2e/**',
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})