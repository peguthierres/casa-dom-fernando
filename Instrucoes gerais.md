# Instruções Gerais para Backup e Restauração

Este documento contém o backup completo do esquema do banco de dados (SQL) e o código-fonte das Edge Functions do seu projeto. Ele pode ser usado para recriar seu ambiente em outro local ou para fins de recuperação.

---

## 1. Backup do Esquema do Banco de Dados (SQL)

Este script SQL contém as instruções para criar as tabelas, índices, restrições, funções de gatilho, gatilhos e políticas de Row Level Security (RLS) do seu banco de dados.

```sql
-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to update 'updated_at' column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table: donations
CREATE TABLE public.donations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_name text NOT NULL,
    donor_email text NOT NULL,
    donor_phone text,
    amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'BRL'::text,
    payment_method text NOT NULL,
    stripe_payment_intent_id text,
    stripe_session_id text,
    status text DEFAULT 'pending'::text,
    message text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Constraints for donations
ALTER TABLE public.donations ADD CONSTRAINT donations_payment_method_check CHECK ((payment_method = ANY (ARRAY['card'::text, 'pix'::text])));
ALTER TABLE public.donations ADD CONSTRAINT donations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])));

-- Indexes for donations
CREATE UNIQUE INDEX donations_pkey ON public.donations USING btree (id);
CREATE INDEX idx_donations_created_at ON public.donations USING btree (created_at DESC);
CREATE INDEX idx_donations_status ON public.donations USING btree (status);

-- RLS for donations
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY donations_insert_public ON public.donations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY donations_select_admin ON public.donations FOR SELECT TO authenticated USING (true);
CREATE POLICY donations_update_admin ON public.donations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Trigger for donations
CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON public.donations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Table: donor_messages
CREATE TABLE public.donor_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_name text NOT NULL,
    message text NOT NULL,
    is_approved boolean DEFAULT false,
    is_featured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Indexes for donor_messages
CREATE UNIQUE INDEX donor_messages_pkey ON public.donor_messages USING btree (id);
CREATE INDEX idx_donor_messages_approved ON public.donor_messages USING btree (is_approved, created_at DESC);

-- RLS for donor_messages
ALTER TABLE public.donor_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY donor_messages_all_admin ON public.donor_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY donor_messages_insert_public ON public.donor_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY donor_messages_select_approved ON public.donor_messages FOR SELECT TO anon, authenticated USING ((is_approved = true));


-- Table: project_images
CREATE TABLE public.project_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    image_url text NOT NULL,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for project_images
CREATE UNIQUE INDEX project_images_pkey ON public.project_images USING btree (id);
CREATE INDEX idx_project_images_active ON public.project_images USING btree (is_active, display_order);

-- RLS for project_images
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY project_images_all_admin ON public.project_images FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY project_images_select_active ON public.project_images FOR SELECT TO anon, authenticated USING ((is_active = true));

-- Trigger for project_images
CREATE TRIGGER update_project_images_updated_at BEFORE UPDATE ON public.project_images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Table: stripe_config
CREATE TABLE public.stripe_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    publishable_key text,
    secret_key text,
    webhook_secret text,
    is_test_mode boolean DEFAULT true,
    pix_enabled boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for stripe_config
CREATE UNIQUE INDEX stripe_config_pkey ON public.stripe_config USING btree (id);

-- RLS for stripe_config
ALTER TABLE public.stripe_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY stripe_config_all_admin ON public.stripe_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger for stripe_config
CREATE TRIGGER update_stripe_config_updated_at BEFORE UPDATE ON public.stripe_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RPC Function to get public Stripe config
CREATE OR REPLACE FUNCTION get_public_stripe_config()
RETURNS TABLE(publishable_key text, pix_enabled boolean, is_test_mode boolean)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT sc.publishable_key, sc.pix_enabled, sc.is_test_mode
  FROM public.stripe_config sc
  LIMIT 1;
END;
$$;
```

---

## 2. Backup das Edge Functions (Código-fonte)

Para as Edge Functions, você precisará dos arquivos TypeScript que as definem. Você pode recriar a estrutura de pastas `supabase/functions/` e colocar os arquivos correspondentes dentro.

### `supabase/functions/create-checkout-session/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CheckoutRequest {
  amount: number
  currency: string
  donor_name: string
  donor_email: string
  donor_phone?: string
  message?: string
  payment_method: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Iniciando criação de sessão de checkout');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar configurações do Stripe
    const { data: stripeConfig, error: configError } = await supabase
      .from('stripe_config')
      .select('secret_key, publishable_key')
      .single()

    if (configError || !stripeConfig?.secret_key) {
      console.error('Erro ao buscar config do Stripe:', configError)
      return new Response(
        JSON.stringify({ 
          error: 'Stripe não configurado. Acesse /login → Configurações para configurar as chaves do Stripe.',
          code: 'STRIPE_NOT_CONFIGURED'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('Configuração do Stripe encontrada');
    
    const { amount, currency, donor_name, donor_email, donor_phone, message, payment_method }: CheckoutRequest = await req.json()

    console.log('Dados recebidos:', { amount, currency, donor_name, donor_email, payment_method });

    // URLs de sucesso e cancelamento
    const baseUrl = req.headers.get('origin') || 'https://casadomfernando-uov1.bolt.host'
    const successUrl = `${baseUrl}/obrigado?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/doacao`

    console.log('URLs configuradas:', { successUrl, cancelUrl });
    // Criar sessão de checkout no Stripe
    console.log('Criando sessão no Stripe...');
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeConfig.secret_key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price_data][currency]': currency.toLowerCase(),
        'line_items[0][price_data][product_data][name]': 'Doação - Casa de Acolhimento Dom Fernando Legal',
        'line_items[0][price_data][product_data][description]': `Doação de ${donor_name}`,
        'line_items[0][price_data][unit_amount]': (amount * 100).toString(),
        'line_items[0][quantity]': '1',
        'mode': 'payment',
        'success_url': successUrl,
        'cancel_url': cancelUrl,
        'customer_email': donor_email,
        'metadata[donor_name]': donor_name,
        'metadata[donor_email]': donor_email,
        'metadata[donor_phone]': donor_phone || '',
        'metadata[message]': message || '',
        'metadata[payment_method]': payment_method,
      }),
    })

    console.log('Resposta do Stripe status:', stripeResponse.status);

    if (!stripeResponse.ok) {
      const error = await stripeResponse.text()
      console.error('Erro do Stripe:', error);
      throw new Error(`Stripe error: ${error}`)
    }

    const session = await stripeResponse.json()
    console.log('Sessão criada com sucesso:', session.id);

    // Criar registro da doação
    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .insert([{
        donor_name,
        donor_email,
        donor_phone,
        amount,
        currency: currency.toUpperCase(),
        payment_method: 'card',
        stripe_session_id: session.id,
        status: 'pending',
        message,
      }])
      .select()
      .single()

    if (donationError) {
      console.error('Erro ao criar doação:', donationError);
      throw donationError
    }

    console.log('Doação criada com sucesso:', donation.id);
    return new Response(
      JSON.stringify({
        session_id: session.id,
        donation_id: donation.id,
        checkout_url: session.url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
/*
  # Add campaign settings table

  1. New Tables
    - `campaign_settings`
      - `id` (uuid, primary key)
      - `goal_amount` (numeric, meta da campanha)
      - `is_active` (boolean, se a campanha está ativa)
      - `title` (text, título da campanha)
      - `description` (text, descrição da campanha)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `campaign_settings` table
    - Add policy for authenticated users to manage settings
    - Add policy for public to read active settings

  3. Initial Data
    - Insert default campaign settings
*/

CREATE TABLE IF NOT EXISTS public.campaign_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_amount numeric(12,2) NOT NULL DEFAULT 500000.00,
    is_active boolean DEFAULT true,
    title text DEFAULT 'Casa de Acolhimento Dom Fernando Legal',
    description text DEFAULT 'Ajude-nos a construir a Casa de Acolhimento Dom Fernando Legal para os padres idosos da Diocese de São Miguel Paulista.',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "campaign_settings_all_admin" ON public.campaign_settings
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "campaign_settings_select_public" ON public.campaign_settings
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_campaign_settings_updated_at
    BEFORE UPDATE ON public.campaign_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO public.campaign_settings (goal_amount, title, description)
VALUES (
    500000.00,
    'Casa de Acolhimento Dom Fernando Legal',
    'Ajude-nos a construir a Casa de Acolhimento Dom Fernando Legal para os padres idosos da Diocese de São Miguel Paulista, oferecendo-lhes o cuidado e conforto que merecem após uma vida de dedicação.'
)
ON CONFLICT DO NOTHING;

-- RPC Function to get public campaign settings
CREATE OR REPLACE FUNCTION get_campaign_settings()
RETURNS TABLE(
    goal_amount numeric,
    title text,
    description text,
    total_donated numeric,
    percentage_completed numeric
)
LANGUAGE plpgsql
AS $$
DECLARE
    settings_record RECORD;
    donated_amount numeric;
BEGIN
    -- Get active campaign settings
    SELECT cs.goal_amount, cs.title, cs.description
    INTO settings_record
    FROM public.campaign_settings cs
    WHERE cs.is_active = true
    LIMIT 1;
    
    -- Calculate total donated amount
    SELECT COALESCE(SUM(d.amount), 0)
    INTO donated_amount
    FROM public.donations d
    WHERE d.status = 'completed';
    
    -- Return results
    RETURN QUERY
    SELECT 
        settings_record.goal_amount,
        settings_record.title,
        settings_record.description,
        donated_amount,
        CASE 
            WHEN settings_record.goal_amount > 0 THEN 
                ROUND((donated_amount / settings_record.goal_amount) * 100, 1)
            ELSE 0
        END as percentage_completed;
END;
$$;
```

### `supabase/functions/create-pix-payment/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface PixPaymentRequest {
  amount: number
  donor_name: string
  donor_email: string
  donor_phone?: string
  message?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Iniciando criação de pagamento PIX');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar configurações do Stripe
    const { data: stripeConfig, error: configError } = await supabase
      .from('stripe_config')
      .select('secret_key, pix_enabled')
      .single()

    if (configError || !stripeConfig?.secret_key || !stripeConfig?.pix_enabled) {
      console.error('Erro ao buscar config do Stripe para PIX:', configError)
      return new Response(
        JSON.stringify({ 
          error: 'PIX não configurado. Acesse /login → Configurações para configurar as chaves do Stripe.',
          code: 'PIX_NOT_CONFIGURED'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    if (!stripeConfig.pix_enabled) {
      console.log('PIX não habilitado na configuração')
      return new Response(
        JSON.stringify({ 
          error: 'PIX não está habilitado. Acesse /login → Configurações para habilitar PIX.',
          code: 'PIX_NOT_ENABLED'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('Configuração PIX encontrada e habilitada');
    
    const { amount, donor_name, donor_email, donor_phone, message }: PixPaymentRequest = await req.json()

    console.log('Dados recebidos para PIX:', { amount, donor_name, donor_email });

    // Criar Payment Intent para PIX no Stripe
    console.log('Criando Payment Intent PIX no Stripe...');
    const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeConfig.secret_key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: (amount * 100).toString(), // Converter para centavos
        currency: 'brl',
        'payment_method_types[]': 'pix',
        'metadata[donor_name]': donor_name,
        'metadata[donor_email]': donor_email,
        'metadata[donor_phone]': donor_phone || '',
        'metadata[message]': message || '',
      }),
    })

    console.log('Resposta do Stripe PIX status:', stripeResponse.status);

    if (!stripeResponse.ok) {
      const error = await stripeResponse.text()
      console.error('Erro do Stripe PIX:', error);
      throw new Error(`Stripe error: ${error}`)
    }

    const paymentIntent = await stripeResponse.json()
    console.log('Payment Intent PIX criado:', paymentIntent.id);

    // Criar registro da doação
    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .insert([{
        donor_name,
        donor_email,
        donor_phone,
        amount,
        currency: 'BRL',
        payment_method: 'pix',
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending',
        message,
      }])
      .select()
      .single()

    if (donationError) {
      console.error('Erro ao criar doação PIX:', donationError);
      throw donationError
    }

    console.log('Doação PIX criada com sucesso:', donation.id);

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        donation_id: donation.id,
        pix_qr_code: paymentIntent.next_action?.pix_display_qr_code?.data || null,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
```

### `supabase/functions/stripe-webhook/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== WEBHOOK STRIPE RECEBIDO ===');
    console.log('Method:', req.method);
    console.log('Headers:', Object.fromEntries(req.headers.entries()));
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar configurações do Stripe
    const { data: stripeConfig, error: configError } = await supabase
      .from('stripe_config')
      .select('webhook_secret, is_test_mode')
      .single()

    if (configError) {
      console.error('Erro ao buscar config do Stripe:', configError);
    }

    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    
    console.log('Signature presente:', !!signature);
    console.log('Body length:', body.length);

    // Parse do evento
    let event;
    try {
      event = JSON.parse(body);
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError);
      throw new Error('Invalid JSON payload');
    }

    console.log('=== EVENTO STRIPE ===');
    console.log('Tipo:', event.type);
    console.log('ID:', event.id);
    console.log('Livemode:', event.livemode);

    // Processar eventos do Stripe
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('=== PROCESSANDO CHECKOUT SESSION COMPLETED ===');
        const session = event.data.object;
        console.log('Session ID:', session.id);
        console.log('Payment Status:', session.payment_status);
        console.log('Amount Total:', session.amount_total);
        console.log('Customer Email:', session.customer_email);
        console.log('Metadata:', session.metadata);

        // Buscar doação pelo session_id
        const { data: existingDonation, error: findError } = await supabase
          .from('donations')
          .select('*')
          .eq('stripe_session_id', session.id)
          .single();

        if (findError) {
          console.error('Erro ao buscar doação:', findError);
          if (findError.code === 'PGRST116') {
            console.log('Doação não encontrada para session_id:', session.id);
          }
        } else {
          console.log('Doação encontrada:', existingDonation.id, 'Status atual:', existingDonation.status);
        }

        // Atualizar status da doação
        const { data: updatedDonation, error: updateError } = await supabase
          .from('donations')
          .update({ 
            status: session.payment_status === 'paid' ? 'completed' : 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_session_id', session.id)
          .select()
          .single();

        if (updateError) {
          console.error('Erro ao atualizar doação:', updateError);
        } else {
          console.log('Doação atualizada com sucesso:', updatedDonation.id, 'Novo status:', updatedDonation.status);
        }

        // Criar mensagem do doador se existir
        if (session.metadata?.message && session.metadata?.donor_name) {
          console.log('Criando mensagem do doador');
          const { error: messageError } = await supabase
            .from('donor_messages')
            .insert([{
              donor_name: session.metadata.donor_name,
              message: session.metadata.message,
              is_approved: false
            }]);

          if (messageError) {
            console.error('Erro ao criar mensagem:', messageError);
          } else {
            console.log('Mensagem do doador criada com sucesso');
          }
        }
        break;

      case 'payment_intent.succeeded':
        console.log('=== PROCESSANDO PAYMENT INTENT SUCCEEDED ===');
        const paymentIntent = event.data.object;
        console.log('Payment Intent ID:', paymentIntent.id);
        console.log('Amount:', paymentIntent.amount);
        console.log('Status:', paymentIntent.status);
        console.log('Metadata:', paymentIntent.metadata);

        // Buscar doação pelo payment_intent_id
        const { data: piDonation, error: piFindError } = await supabase
          .from('donations')
          .select('*')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single();

        if (piFindError) {
          console.error('Erro ao buscar doação por PI:', piFindError);
        } else {
          console.log('Doação encontrada por PI:', piDonation.id, 'Status atual:', piDonation.status);
        }

        // Atualizar status da doação
        const { data: piUpdatedDonation, error: piUpdateError } = await supabase
          .from('donations')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .select()
          .single();

        if (piUpdateError) {
          console.error('Erro ao atualizar doação por PI:', piUpdateError);
        } else {
          console.log('Doação atualizada por PI com sucesso:', piUpdatedDonation.id, 'Novo status:', piUpdatedDonation.status);
        }

        // Criar mensagem do doador se existir
        if (paymentIntent.metadata?.message && paymentIntent.metadata?.donor_name) {
          console.log('Criando mensagem do doador via PI');
          const { error: piMessageError } = await supabase
            .from('donor_messages')
            .insert([{
              donor_name: paymentIntent.metadata.donor_name,
              message: paymentIntent.metadata.message,
              is_approved: false
            }]);

          if (piMessageError) {
            console.error('Erro ao criar mensagem via PI:', piMessageError);
          } else {
            console.log('Mensagem do doador criada via PI com sucesso');
          }
        }
        break;

      case 'payment_intent.payment_failed':
        console.log('=== PROCESSANDO PAYMENT INTENT FAILED ===');
        const failedPayment = event.data.object;
        console.log('Failed Payment Intent ID:', failedPayment.id);
        console.log('Last Payment Error:', failedPayment.last_payment_error);

        const { error: failedUpdateError } = await supabase
          .from('donations')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', failedPayment.id);

        if (failedUpdateError) {
          console.error('Erro ao atualizar doação falha:', failedUpdateError);
        } else {
          console.log('Doação marcada como falha:', failedPayment.id);
        }
        break;

      default:
        console.log(`Evento não tratado: ${event.type}`);
        console.log('Dados do evento:', JSON.stringify(event.data, null, 2));
    }

    console.log('=== WEBHOOK PROCESSADO COM SUCESSO ===');
    return new Response(
      JSON.stringify({ 
        received: true, 
        event_type: event.type,
        event_id: event.id,
        processed_at: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('=== ERRO NO WEBHOOK ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
```

### `supabase/functions/create-payment-intent/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface PaymentRequest {
  amount: number
  currency: string
  donor_name: string
  donor_email: string
  donor_phone?: string
  message?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar configurações do Stripe
    const { data: stripeConfig, error: configError } = await supabase
      .from('stripe_config')
      .select('secret_key')
      .single()

    if (configError || !stripeConfig?.secret_key) {
      throw new Error('Stripe não configurado')
    }

    const { amount, currency, donor_name, donor_email, donor_phone, message }: PaymentRequest = await req.json()

    // Criar Payment Intent no Stripe
    const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeConfig.secret_key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: amount.toString(),
        currency: currency.toLowerCase(),
        'payment_method_types[]': 'card',
        'metadata[donor_name]': donor_name,
        'metadata[donor_email]': donor_email,
        'metadata[donor_phone]': donor_phone || '',
        'metadata[message]': message || '',
      }),
    })

    if (!stripeResponse.ok) {
      const error = await stripeResponse.text()
      throw new Error(`Stripe error: ${error}`)
    }

    const paymentIntent = await stripeResponse.json()

    // Criar registro da doação
    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .insert([{
        donor_name,
        donor_email,
        donor_phone,
        amount: amount / 100, // Converter de centavos
        currency: currency.toUpperCase(),
        payment_method: 'card',
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending',
        message,
      }])
      .select()
      .single()

    if (donationError) {
      throw donationError
    }

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        donation_id: donation.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
```

---

## 3. Como usar este backup:

1.  **Para o Esquema do Banco de Dados (SQL):**
    *   Crie um novo projeto Supabase (ou acesse um existente).
    *   Vá para a seção "SQL Editor" no seu painel do Supabase.
    *   Cole o conteúdo do script SQL fornecido acima e execute-o. Isso criará todas as tabelas, índices, restrições, funções e políticas RLS.

2.  **Para as Edge Functions:**
    *   Crie a estrutura de pastas `supabase/functions/` no seu projeto local.
    *   Para cada função (ex: `create-checkout-session`, `create-pix-payment`, `stripe-webhook`, `create-payment-intent`), crie uma subpasta com o nome da função e, dentro dela, um arquivo `index.ts`.
    *   Copie o código TypeScript correspondente para cada arquivo `index.ts`.
    *   Para implantar essas funções no Supabase, você precisará usar a Supabase CLI. Navegue até a raiz do seu projeto no terminal e execute:
        ```bash
        supabase functions deploy create-checkout-session
        supabase functions deploy create-pix-payment
        supabase functions deploy stripe-webhook
        supabase functions deploy create-payment-intent
        ```
        Certifique-se de que a Supabase CLI esteja configurada e autenticada com seu projeto.

Este processo garantirá que tanto a estrutura do seu banco de dados quanto a lógica das suas Edge Functions sejam replicadas no novo ambiente.