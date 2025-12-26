import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['jspdf']
  },
  build: {
    target: 'es2015',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs'],
          'chart-vendor': ['recharts'],
          'pdf-vendor': ['jspdf', 'html2canvas'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
      onwarn(warning, warn) {
        // Suppress warnings for better build
        if (warning.code === 'UNRESOLVED_IMPORT' ||
            warning.code === 'MISSING_EXPORT') {
          return;
        }
        warn(warning);
      }
    }
  }
}));