import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',  // адрес твоего бекенда
        changeOrigin: true,
        // НЕ трогай rewrite, если твой API слушает пути с префиксом /api,
        // например: http://localhost:8000/api/v1/attributes
        // Если бекенд НЕ использует /api в путях, тогда раскомментируй следующую строку:
        // rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying request to:', req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);
          });
        }
      },
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying media request to:', req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('Media proxy error:', err);
          });
        }
      },
    },
  },
});
