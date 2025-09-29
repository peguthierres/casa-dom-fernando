import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    'import.meta.env.SUPABASE_DATABASE_URL': JSON.stringify(process.env.SUPABASE_DATABASE_URL || ''),
    'import.meta.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY || ''),
    'import.meta.env.SUPABASE_SERVICE_ROLE_KEY': JSON.stringify(process.env.SUPABASE_SERVICE_ROLE_KEY || ''),
    'import.meta.env.SUPABASE_JWT_SECRET': JSON.stringify(process.env.SUPABASE_JWT_SECRET || ''),
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          stripe: ['@stripe/stripe-js'],
        },
      },
    },
  },
});
