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
        manualChunks(id) {
          // Vendor chunks - split heavy node_modules
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react/')) {
              return 'react-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            // NOTE: recharts + d3 are NOT manually chunked because their circular
            // internal imports cause "Cannot access 'S' before initialization" at runtime.
            // Rollup handles their dependency order correctly when left to auto-chunk.
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'form-vendor';
            }
            if (id.includes('xlsx')) {
              return 'xlsx-vendor';
            }
            if (id.includes('dompurify') || id.includes('isomorphic-dompurify')) {
              return 'purify-vendor';
            }
            if (id.includes('react-router') || id.includes('@remix-run')) {
              return 'router-vendor';
            }
            if (id.includes('cmdk') || id.includes('react-day-picker') || id.includes('sonner') || id.includes('react-to-print')) {
              return 'ui-extras-vendor';
            }
          }

          // App code chunks - group smaller shared modules
          if (id.includes('/components/accounting/') || id.includes('/components/tally/')) {
            return 'accounting-components';
          }
          if (id.includes('/components/radiology/')) {
            return 'radiology-components';
          }
          if (id.includes('/components/operation-room/')) {
            return 'ot-components';
          }
          if (id.includes('/components/marketing/')) {
            return 'marketing-components';
          }
          if (id.includes('/components/ui/')) {
            return 'ui-components';
          }
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