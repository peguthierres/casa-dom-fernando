import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

let stripePromise: Promise<any> | null = null;
let cachedPublishableKey: string | null = null;

export const getStripe = async () => {
  if (!stripePromise) {
    try {
      // First, try to use cached key
      if (cachedPublishableKey) {
        console.log('Using cached Stripe key');
        stripePromise = loadStripe(cachedPublishableKey);
        return stripePromise;
      }

      // Try to fetch from database using public function
      try {
        const { data: config, error } = await supabase
          .rpc('get_public_stripe_config')
          .single();

        if (error) {
          console.error('Error fetching Stripe configuration:', error);
          throw new Error('Stripe não configurado. Entre em contato com o administrador.');
        }

        if (!config?.publishable_key) {
          throw new Error('Stripe não configurado. Entre em contato com o administrador.');
        }

        console.log('Loading Stripe with key:', config.publishable_key.substring(0, 12) + '...');
        cachedPublishableKey = config.publishable_key;
        stripePromise = loadStripe(config.publishable_key);
      } catch (dbError) {
        console.error('Database access error:', dbError);
        throw new Error('Sistema de pagamento temporariamente indisponível. Tente novamente em alguns minutos.');
      }
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      throw error;
    }
  }
  return stripePromise;
};

// Função para limpar cache quando configuração for atualizada
export const clearStripeCache = () => {
  stripePromise = null;
  cachedPublishableKey = null;
};

export interface CreatePaymentData {
  amount: number;
  donor_name: string;
  donor_email: string;
  donor_phone?: string;
  message?: string;
}

export const createCardPayment = async (data: CreatePaymentData) => {
  try {
    console.log('Iniciando criação de pagamento com cartão:', data);
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('Verificando variáveis de ambiente:');
    console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Definida' : 'NÃO DEFINIDA');
    console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Definida' : 'NÃO DEFINIDA');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Variáveis de ambiente do Supabase não encontradas');
      console.error('VITE_SUPABASE_URL:', supabaseUrl);
      console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Presente' : 'Ausente');
      throw new Error('Sistema temporariamente indisponível. As variáveis de ambiente do Supabase não estão configuradas. Entre em contato com o administrador.');
    }
    
    const apiUrl = `${supabaseUrl}/functions/v1/create-checkout-session`;
    console.log('Chamando API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        currency: 'BRL',
        payment_method: 'card'
      }),
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Erro da API:', error);
      throw new Error(error.error || `Erro ao criar sessão de pagamento (${response.status})`);
    }

    const result = await response.json();
    console.log('Resultado da API:', result);
    return result;
  } catch (error) {
    console.error('Error creating card payment:', error);
    throw new Error(error.message || 'Erro ao processar pagamento com cartão');
  }
};

export const redirectToCheckout = async (sessionId: string) => {
  try {
    console.log('Redirecionando para checkout com session ID:', sessionId);
    const stripe = await getStripe();
    
    if (!stripe) {
      throw new Error('Erro ao carregar Stripe. Verifique a configuração.');
    }

    const { error } = await stripe.redirectToCheckout({
      sessionId: sessionId,
    });

    if (error) {
      console.error('Erro no redirecionamento:', error);
      throw new Error(error.message || 'Erro ao redirecionar para o checkout');
    }
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
    throw new Error(error.message || 'Erro ao redirecionar para o checkout');
  }
};

export const createPixPayment = async (data: CreatePaymentData) => {
  try {
    console.log('Iniciando criação de pagamento PIX:', data);
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('Verificando variáveis de ambiente PIX:');
    console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Definida' : 'NÃO DEFINIDA');
    console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Definida' : 'NÃO DEFINIDA');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Variáveis de ambiente do Supabase não encontradas para PIX');
      throw new Error('Sistema temporariamente indisponível. As variáveis de ambiente do Supabase não estão configuradas. Entre em contato com o administrador.');
    }
    
    const apiUrl = `${supabaseUrl}/functions/v1/create-pix-payment`;
    console.log('Chamando API PIX:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('Response status (PIX):', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('Erro da API (PIX):', error);
      throw new Error(error.error || 'Erro ao criar pagamento PIX');
    }

    const result = await response.json();
    console.log('Resultado da API (PIX):', result);
    return result;
  } catch (error) {
    console.error('Error creating PIX payment:', error);
    throw new Error(error.message || 'Erro ao processar pagamento PIX');
  }
};