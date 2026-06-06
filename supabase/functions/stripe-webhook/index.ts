/**
 * PRO WORLD ARENA — Stripe Webhook (Edge Function Supabase)
 *
 * Deploy: supabase functions deploy stripe-webhook --no-verify-jwt
 *
 * Configure no painel Supabase:
 *   STRIPE_SECRET_KEY = sk_live_...
 *   STRIPE_WEBHOOK_SECRET = whsec_...
 *
 * No Stripe Dashboard, adicionar o endpoint:
 *   https://seu-projeto.supabase.co/functions/v1/stripe-webhook
 *   Eventos: payment_intent.succeeded, checkout.session.completed
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    return new Response('Configuração incompleta', { status: 400 });
  }

  let event: Stripe.Event;
  const body = await req.text();

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature inválida:', err);
    return new Response('Assinatura inválida', { status: 400 });
  }

  // ── Processar eventos ──────────────────────────────────────────────────────
  switch (event.type) {

    case 'checkout.session.completed':
    case 'payment_intent.succeeded': {
      const obj = event.data.object as any;
      const metadata = obj.metadata || {};
      const referenceId = metadata.reference_id || metadata.tournamentId;
      const teamOwnerId = metadata.team_owner_id;

      if (!referenceId || !teamOwnerId) {
        console.log('Metadata incompleto — ignorando:', metadata);
        break;
      }

      // Atualizar inscrição para APPROVED após pagamento
      const { error } = await supabase
        .from('participantes')
        .update({
          status: 'APPROVED',
          payment_id: obj.id,
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('tournament_id', referenceId)
        .eq('team_owner_id', teamOwnerId);

      if (error) {
        console.error('Erro ao atualizar inscrição:', error);
        return new Response('Erro interno', { status: 500 });
      }

      console.log(`✓ Inscrição aprovada: torneio=${referenceId}, jogador=${teamOwnerId}`);
      break;
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent;
      const metadata = pi.metadata || {};
      console.log('Pagamento falhou:', metadata);
      // Opcional: notificar jogador via Supabase Realtime
      break;
    }

    default:
      console.log(`Evento não tratado: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});
