import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Important for Electron to find assets in built version
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
