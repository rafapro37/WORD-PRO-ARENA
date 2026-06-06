/**
 * PRO WORLD ARENA — Pix Webhook (Edge Function Supabase)
 *
 * Deploy: supabase functions deploy pix-webhook --no-verify-jwt
 *
 * Integra com: Mercado Pago, PagSeguro, Asaas, ou qualquer PSP brasileiro.
 * O PSP envia notificações quando o Pix é pago.
 *
 * Configure no painel Supabase:
 *   PIX_WEBHOOK_TOKEN = token_secreto_do_psp
 *
 * No PSP, configure a URL de notificação como:
 *   https://seu-projeto.supabase.co/functions/v1/pix-webhook
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req: Request) => {
  // Validar token de segurança do PSP
  const token = req.headers.get('x-webhook-token') ||
                new URL(req.url).searchParams.get('token');
  const expectedToken = Deno.env.get('PIX_WEBHOOK_TOKEN');

  if (expectedToken && token !== expectedToken) {
    return new Response('Não autorizado', { status: 401 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response('Payload inválido', { status: 400 });
  }

  // ── Formato genérico — adapte ao seu PSP ──────────────────────────────────
  // txid = ID da transação Pix (gerado pelo PWA no referenceId)
  // status = 'CONCLUIDA' | 'paid' | etc.
  const txid     = payload.pix?.[0]?.txid || payload.txid || payload.transaction_id;
  const status   = payload.pix?.[0]?.status || payload.status || '';
  const isPaid   = ['CONCLUIDA', 'paid', 'approved', 'RECEIVED'].includes(status.toUpperCase());

  if (!txid || !isPaid) {
    console.log('Pix não confirmado ou txid ausente:', { txid, status });
    return new Response('OK', { status: 200 });
  }

  // Extrair IDs do txid (formato: PWA{tournamentId}{teamOwnerId})
  // Adapte conforme o formato que você definiu no PaymentGateway
  const tournamentId = txid.replace(/^PWA/, '').slice(0, 10);

  if (!tournamentId) {
    console.log('TxID inválido:', txid);
    return new Response('OK', { status: 200 });
  }

  // Atualizar inscrição
  const { error } = await supabase
    .from('participantes')
    .update({
      status: 'APPROVED',
      payment_id: txid,
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .ilike('tournament_id', `${tournamentId}%`)
    .eq('status', 'PENDING');

  if (error) {
    console.error('Erro ao atualizar inscrição Pix:', error);
    return new Response('Erro interno', { status: 500 });
  }

  console.log(`✓ Pix confirmado: txid=${txid}`);
  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});
