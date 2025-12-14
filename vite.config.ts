import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { vitePluginApi } from "./vite-plugin-api";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/valorant': {
        target: 'https://api.henrikdev.xyz',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/valorant/, '/valorant'),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Pega a API key do ambiente usando loadEnv
            const apiKey = env.VITE_HENRIKDEV_KEY;
            if (apiKey) {
              proxyReq.setHeader('Authorization', apiKey);
            }
            // Remove headers que podem causar problemas
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
          });
        },
      },
      '/api/misticpay': {
        target: 'https://api.misticpay.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/misticpay/, '/api'),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Adiciona headers da MisticPay
            const clientId = env.VITE_MISTICPAY_CLIENT_ID;
            const clientSecret = env.VITE_MISTICPAY_CLIENT_SECRET;
            if (clientId) {
              proxyReq.setHeader('ci', clientId);
            }
            if (clientSecret) {
              proxyReq.setHeader('cs', clientSecret);
            }
            proxyReq.setHeader('Content-Type', 'application/json');
            // Remove headers que podem causar problemas
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
          });
        },
      },
      '/api/visionwallet': {
        target: 'https://api.visionwallet.com.br',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/visionwallet/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Adiciona header da VisionWallet
            const apiKey = env.VITE_VISIONWALLET_API_KEY;
            if (apiKey) {
              proxyReq.setHeader('X-API-Key', apiKey);
            }
            proxyReq.setHeader('Content-Type', 'application/json');
            // Remove headers que podem causar problemas
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
          });
        },
      },
      // As rotas /api/auth, /api/data, /api/admin são tratadas pelo middleware do vite-plugin-api
      // Não precisam de proxy, pois são executadas diretamente pelo Vite
    },
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    mode === "development" && vitePluginApi()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
