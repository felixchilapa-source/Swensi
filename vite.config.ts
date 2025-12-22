
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      // Removed externalization of '@google/genai' to let Vite bundle it
      output: {
        // Removed globals configuration for '@google/genai'
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
