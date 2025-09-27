import { createClient } from '@supabase/supabase-js';

// Função para obter variáveis de ambiente com fallbacks
const getEnvVar = (name: string): string => {
  // Tentar diferentes formas de acessar as variáveis
  const value = import.meta.env[name] || 
                (typeof window !== 'undefined' && (window as any)[name]) ||
                (typeof process !== 'undefined' && process.env && process.env[name]);
  
  return value || '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERRO CRÍTICO: Variáveis de ambiente do Supabase não encontradas!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl || 'NÃO DEFINIDA');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey || 'NÃO DEFINIDA');
  console.error('Verifique se as variáveis estão configuradas no ambiente de produção.');
  
  // Log adicional para debug no Netlify
  console.error('Todas as variáveis disponíveis:', Object.keys(import.meta.env));
  console.error('Modo:', import.meta.env.MODE);
  console.error('Prod:', import.meta.env.PROD);
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

// Types
export interface Donation {
  id: string;
  donor_name: string;
  donor_email: string;
  donor_phone?: string;
  amount: number;
  currency: string;
  payment_method: 'card' | 'pix';
  stripe_payment_intent_id?: string;
  stripe_session_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  message?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectImage {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StripeConfig {
  id: string;
  publishable_key?: string;
  secret_key?: string;
  webhook_secret?: string;
  is_test_mode: boolean;
  pix_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DonorMessage {
  id: string;
  donor_name: string;
  message: string;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
}

export interface CampaignSettings {
  id: string;
  goal_amount: number;
  is_active: boolean;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignStats {
  goal_amount: number;
  title: string;
  description: string;
  total_donated: number;
  percentage_completed: number;
}