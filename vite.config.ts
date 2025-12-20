import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000, // Adjusted to silence large chunk warnings
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'd3'],
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  }
});