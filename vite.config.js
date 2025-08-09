import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Custom Vite config to prevent bundling Node modules in the browser build.
 * We mark certain modules as external so Rollup doesn't try to resolve them.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: [
        'fs', 'path', 'os', 'stream', 'util', 'crypto',
        'express', 'cors', '@prisma/client', 'pdfkit', 'uuid', 'dayjs', 'dotenv'
      ],
      input: 'index.html'
    }
  }
});
