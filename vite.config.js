import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: [
        'fs', 'path', 'os', 'stream', 'stream/web', 'util', 'crypto',
        'express', 'cors', '@prisma/client', 'pdfkit', 'uuid', 'dayjs', 'dotenv'
      ]
    },
    input: 'index.html'
  }
});
