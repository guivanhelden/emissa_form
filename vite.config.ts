import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

// Plugin para copiar o arquivo version.json para a pasta de saída
const copyVersionJson = () => {
  return {
    name: 'copy-version-json',
    closeBundle() {
      try {
        const versionJson = fs.readFileSync(resolve(__dirname, 'dist/version.json'), 'utf-8');
        fs.writeFileSync(resolve(__dirname, 'dist/assets/version.json'), versionJson);
        console.log('✅ Arquivo version.json copiado para /assets com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao copiar version.json:', error);
      }
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    copyVersionJson()
  ],
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
