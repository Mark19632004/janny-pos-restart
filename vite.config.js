/**
 * Custom Vite config to prevent bundling Node modules in the browser build.
 * We mark certain modules as external so Rollup doesn't try to resolve them.
 */
export default {
  build: {
    rollupOptions: {
      external: [
        'fs', 'path', 'os', 'stream', 'util', 'crypto',
        'express', 'cors', '@prisma/client', 'pdfkit', 'uuid', 'dayjs', 'dotenv'
      ]
    }
  }
};
