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