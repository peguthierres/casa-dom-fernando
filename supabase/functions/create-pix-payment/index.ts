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