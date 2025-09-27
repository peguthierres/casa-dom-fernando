import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    // Mapear variáveis do plugin Supabase do Netlify para os nomes esperados pelo código
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
      process.env.SUPABASE_DATABASE_URL || 
      process.env.VITE_SUPABASE_URL || 
      ''
    ),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
      process.env.SUPABASE_ANON_KEY || 
      process.env.VITE_SUPABASE_ANON_KEY || 
      ''
    ),
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
