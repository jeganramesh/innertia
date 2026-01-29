import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  server: {
    port: 5173,
    host: true, // Allows external access
    cors: true,
    
    // Proxy configuration for API calls (helps with CORS)
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Your Django/Node.js backend
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    
    // Enable HMR overlay
    hmr: {
      overlay: true,
    },
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['axios', 'lodash-es'],
        },
      },
    },
  },
});