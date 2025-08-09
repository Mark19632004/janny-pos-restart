import { defineConfig } from 'vite';

export default defineConfig({
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
