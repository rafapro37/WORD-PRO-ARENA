/**
 * PRO WORLD ARENA — Reset Password Edge Function
 * Deploy: supabase functions deploy reset-password --no-verify-jwt
 *
 * Variáveis necessárias no Supabase:
 * RESEND_API_KEY = re_boHQvdHi_PxaUYab8d5BUd3EJ6uiKwe8s
 * SITE_URL = https://pro-word-arena.vercel.app
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://pro-word-arena.vercel.app';

// Gerar token aleatório
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req: Request) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') return new Response('ok', { headers });

  try {
    const { email, action, token, newPassword } = await req.json();

    // ── SOLICITAR REDEFINIÇÃO ─────────────────────────────────────────────────
    if (action === 'request') {
      if (!email) return new Response(JSON.stringify({ error: 'Email obrigatório' }), { status: 400, headers });

      // Buscar usuário pelo email
      const { data: users, error } = await supabase
        .from('usuarios')
        .select('id, name, email, username')
        .eq('email', email)
        .limit(1);

      if (error || !users || users.length === 0) {
        // Retorna sucesso mesmo se email não encontrado (segurança)
        return new Response(JSON.stringify({ success: true }), { headers });
      }

      const user = users[0];
      const resetToken = generateToken();
      const expiresAt = Date.now() + 3600000; // 1 hora

      // Salvar token na tabela de reset
      await supabase.from('password_resets').upsert({
        user_id: user.id,
        token: resetToken,
        expires_at: expiresAt,
        used: false,
      });

      // Enviar email via Resend
      const resetUrl = `${SITE_URL}?reset_token=${resetToken}`;

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'PRO WORLD ARENA <onboarding@resend.dev>',
          to: email,
          subject: 'Redefinição de senha — PRO WORLD ARENA',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1A1C22; color: #F2F2F2; padding: 40px; border-radius: 12px;">
              <h1 style="color: #FF6A00; font-size: 24px; margin-bottom: 8px;">PRO WORLD ARENA</h1>
              <p style="color: #9CA3AF; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 32px;">Redefinição de Senha</p>
              
              <p>Olá, <strong>${user.name || user.username}</strong>!</p>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
              <p>Clique no botão abaixo para criar uma nova senha:</p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" 
                   style="background: #FF6A00; color: #000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                  Redefinir Senha
                </a>
              </div>
              
              <p style="color: #6B7280; font-size: 12px;">Este link expira em 1 hora.</p>
              <p style="color: #6B7280; font-size: 12px;">Se você não solicitou a redefinição, ignore este email.</p>
              
              <hr style="border-color: #374151; margin: 32px 0;" />
              <p style="color: #6B7280; font-size: 11px;">PRO WORLD ARENA — Gerenciador de Campeonatos</p>
            </div>
          `,
        }),
      });

      if (!emailResponse.ok) {
        console.error('Erro ao enviar email:', await emailResponse.text());
      }

      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // ── VALIDAR TOKEN ─────────────────────────────────────────────────────────
    if (action === 'validate') {
      if (!token) return new Response(JSON.stringify({ valid: false }), { headers });

      const { data, error } = await supabase
        .from('password_resets')
        .select('user_id, expires_at, used')
        .eq('token', token)
        .single();

      if (error || !data || data.used || data.expires_at < Date.now()) {
        return new Response(JSON.stringify({ valid: false }), { headers });
      }

      return new Response(JSON.stringify({ valid: true, userId: data.user_id }), { headers });
    }

    // ── REDEFINIR SENHA ───────────────────────────────────────────────────────
    if (action === 'reset') {
      if (!token || !newPassword) {
        return new Response(JSON.stringify({ error: 'Token e senha obrigatórios' }), { status: 400, headers });
      }

      const { data: resetData, error: resetError } = await supabase
        .from('password_resets')
        .select('user_id, expires_at, used')
        .eq('token', token)
        .single();

      if (resetError || !resetData || resetData.used || resetData.expires_at < Date.now()) {
        return new Response(JSON.stringify({ error: 'Token inválido ou expirado' }), { status: 400, headers });
      }

      // Hash da nova senha (SHA-256)
      const encoder = new TextEncoder();
      const data = encoder.encode(newPassword);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Atualizar senha
      await supabase
        .from('usuarios')
        .update({ password: hashedPassword })
        .eq('id', resetData.user_id);

      // Marcar token como usado
      await supabase
        .from('password_resets')
        .update({ used: true })
        .eq('token', token);

      return new Response(JSON.stringify({ success: true }), { headers });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), { status: 400, headers });

  } catch (error) {
    console.error('Erro:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500, headers });
  }
});
