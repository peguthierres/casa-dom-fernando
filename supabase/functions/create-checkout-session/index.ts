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