import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/',                                  // servido en la raíz (alvarodiga07-sudo.github.io)
  build: { outDir: 'docs', emptyOutDir: true },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/ai-proxy': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ai-proxy/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Use key from request header (Settings page) or from .env (shared default)
            const apiKey = req.headers['x-client-api-key'] || process.env.VITE_ANTHROPIC_KEY;
            if (apiKey) proxyReq.setHeader('x-api-key', apiKey);
            proxyReq.setHeader('anthropic-version', '2023-06-01');
            proxyReq.removeHeader('x-client-api-key');
          });
        },
      },
    },
  },
})
