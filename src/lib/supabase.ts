import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_DATABASE_URL || '';
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase configuration missing. Please check environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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