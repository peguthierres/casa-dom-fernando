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