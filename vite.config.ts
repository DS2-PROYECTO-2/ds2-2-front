/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
  },
  build: {
    outDir: 'dist',
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text', 'json', 'html', 'json-summary'],
      exclude: [
      'node_modules/**',
      'dist/**',
      '**/*.config.*',
      'vite.config.ts',
      'eslint.config.js',
      'src/vite-env.d.ts',
      'src/types/**',
      'src/main.tsx'
      ]
    }
  },
})
