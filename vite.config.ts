import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    hmr: {
      timeout: 30000
    },
    watch: {
      usePolling: true
    },
    proxy: {
      '/api-shiftgroup': {
        target: 'https://api.shiftgroup.com.br',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-shiftgroup/, '')
      }
    }
  },
});
