import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      svgr()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          format: 'es'
        }
      }
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:4200',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        }
      }
    },
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
      __MONGO_URI__: JSON.stringify(env.VITE_MONGO_URI),
    },
  };
});