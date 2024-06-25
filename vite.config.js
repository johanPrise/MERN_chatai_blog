import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        // svgr options
      },
    }),

  ],
    worker: {
    format: 'es',
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
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
 