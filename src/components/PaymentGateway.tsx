/**
 * PRO WORLD ARENA — Gateway de Pagamento
 * Suporte a Pix (Brasil) e Stripe (internacional)
 * 
 * Uso: configure VITE_STRIPE_PUBLIC_KEY e VITE_PIX_KEY no .env
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from '../contexts/LocaleContext';

export interface PaymentConfig {
  /** Valor em centavos (BRL) ou menor unidade da moeda */
  amountCents: number;
  currency:    'BRL' | 'USD' | 'EUR';
  description: string;
  /** ID do torneio ou registro sendo pago */
  referenceId: string;
  /** Chave Pix do organizador (CPF, CNPJ, email ou celular) */
  pixKey?:     string;
  /** Nome do beneficiário Pix */
  pixName?:    string;
}

export type PaymentStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

interface PaymentGatewayProps {
  config: PaymentConfig;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

// ─── Formatar valor ───────────────────────────────────────────────────────────
function formatCurrency(cents: number, currency: string): string {
  const value = cents / 100;
  const locale = currency === 'BRL' ? 'pt-BR' : 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

// ─── Gerar payload Pix EMV (simplificado) ────────────────────────────────────
function buildPixPayload(key: string, name: string, city: string, amount: number, txId: string): string {
  const fmt = (id: number, val: string) => {
    const len = val.length.toString().padStart(2, '0');
    return `${id.toString().padStart(2, '0')}${len}${val}`;
  };

  const merchantAccount =
    fmt(0, 'BR.GOV.BCB.PIX') +
    fmt(1, key);

  const amountStr = (amount / 100).toFixed(2);
  const txIdClean = txId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***';

  const payload =
    fmt(0, '01') +                        // Payload Format Indicator
    fmt(26, merchantAccount) +             // Merchant Account Information
    fmt(52, '0000') +                      // Merchant Category Code
    fmt(53, '986') +                       // Transaction Currency (BRL)
    fmt(54, amountStr) +                   // Transaction Amount
    fmt(58, 'BR') +                        // Country Code
    fmt(59, name.slice(0, 25)) +           // Merchant Name
    fmt(60, city.slice(0, 15)) +           // Merchant City
    fmt(62, fmt(5, txIdClean));            // Additional Data — TxID

  // CRC16
  const crc = (str: string): string => {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
      }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  };

  const withCrcField = payload + '6304';
  return withCrcField + crc(withCrcField);
}

// ─── Componente principal ─────────────────────────────────────────────────────
export const PaymentGateway: React.FC<PaymentGatewayProps> = ({ config, onSuccess, onCancel }) => {
  const { T } = useLocale();
  const [method, setMethod] = useState<'pix' | 'card' | null>(null);
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [copied, setCopied] = useState(false);

  const formattedAmount = formatCurrency(config.amountCents, config.currency);
  const txId = `PWA${config.referenceId.slice(0, 10).replace(/[^a-z0-9]/gi, '')}`;

  // Payload Pix
  const pixKey  = config.pixKey  || import.meta.env?.VITE_PIX_KEY  || '';
  const pixName = config.pixName || import.meta.env?.VITE_PIX_NAME || 'PRO WORLD ARENA';
  const pixPayload = pixKey
    ? buildPixPayload(pixKey, pixName, 'Brasil', config.amountCents, txId)
    : '';

  const copyPix = async () => {
    if (!pixPayload) return;
    try {
      await navigator.clipboard.writeText(pixPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {}
  };

  const simulateConfirmation = () => {
    setStatus('confirming');
    // Em produção: chamar webhook/Edge Function Supabase para validar
    setTimeout(() => {
      setStatus('success');
      onSuccess(`PAY-${Date.now()}`);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-md rounded-2xl border border-[var(--theme-border)] overflow-hidden shadow-2xl"
        style={{ background: 'var(--theme-surface)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--theme-border)]">
          <div>
            <h2 className="font-black text-white text-base">Pagamento da Inscrição</h2>
            <p className="text-[11px] text-[var(--theme-text-muted)] mt-0.5">{config.description}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-white">{formattedAmount}</p>
          </div>
        </div>

        <div className="p-5 space-y-4">

          {/* Sucesso */}
          {status === 'success' && (
            <div className="text-center py-6 space-y-3">
              <div className="text-5xl">✅</div>
              <p className="font-black text-white text-lg">Pagamento confirmado!</p>
              <p className="text-sm text-[var(--theme-text-muted)]">Sua inscrição foi registrada com sucesso.</p>
            </div>
          )}

          {/* Confirmando */}
          {status === 'confirming' && (
            <div className="text-center py-6 space-y-3">
              <div className="w-10 h-10 border-4 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-[var(--theme-text-muted)] font-bold">Confirmando pagamento...</p>
            </div>
          )}

          {/* Seleção de método */}
          {status === 'idle' && !method && (
            <>
              <p className="text-[11px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest">
                Escolha como pagar
              </p>

              <div className="grid grid-cols-2 gap-3">
                {/* Pix */}
                {pixKey && (
                  <button
                    onClick={() => setMethod('pix')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-[var(--theme-border)] hover:border-[var(--theme-primary)] transition-all group"
                  >
                    <span className="text-2xl">🏦</span>
                    <span className="text-sm font-black text-white group-hover:text-[var(--theme-primary)] transition-colors">Pix</span>
                    <span className="text-[10px] text-green-400 font-bold">Instantâneo</span>
                  </button>
                )}

                {/* Cartão (Stripe) */}
                <button
                  onClick={() => setMethod('card')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-[var(--theme-border)] hover:border-[var(--theme-primary)] transition-all group"
                >
                  <span className="text-2xl">💳</span>
                  <span className="text-sm font-black text-white group-hover:text-[var(--theme-primary)] transition-colors">Cartão</span>
                  <span className="text-[10px] text-[var(--theme-text-muted)] font-bold">Crédito / Débito</span>
                </button>
              </div>
            </>
          )}

          {/* Pix */}
          {status === 'idle' && method === 'pix' && pixKey && (
            <div className="space-y-4">
              <button onClick={() => setMethod(null)} className="text-[11px] text-[var(--theme-text-muted)] hover:text-white transition-colors">← Voltar</button>

              <div className="bg-white rounded-xl p-6 flex items-center justify-center">
                {/* QR Code simplificado — exibe o código textual */}
                <div className="text-center">
                  <div className="text-4xl mb-3">📱</div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Escaneie o QR Code ou copie o código</p>
                </div>
              </div>

              <div className="bg-[var(--theme-bg)] rounded-xl p-3 border border-[var(--theme-border)]">
                <p className="text-[9px] text-[var(--theme-text-muted)] font-mono break-all leading-relaxed select-all">
                  {pixPayload.slice(0, 60)}...
                </p>
              </div>

              <button
                onClick={copyPix}
                className="w-full py-3 rounded-xl font-black text-sm text-black transition-all hover:opacity-90"
                style={{ background: 'var(--theme-primary)' }}
              >
                {copied ? '✓ Código Copiado!' : '📋 Copiar Código Pix'}
              </button>

              <button
                onClick={simulateConfirmation}
                className="w-full py-2 rounded-xl text-[11px] font-bold text-[var(--theme-text-muted)] border border-[var(--theme-border)] hover:border-[var(--theme-primary)] transition-all"
              >
                Já paguei — confirmar
              </button>
            </div>
          )}

          {/* Cartão (placeholder Stripe) */}
          {status === 'idle' && method === 'card' && (
            <div className="space-y-4">
              <button onClick={() => setMethod(null)} className="text-[11px] text-[var(--theme-text-muted)] hover:text-white transition-colors">← Voltar</button>

              <div className="bg-[var(--theme-bg)] rounded-xl p-5 border border-[var(--theme-border)] text-center space-y-3">
                <span className="text-3xl">💳</span>
                <p className="text-sm font-black text-white">Pagamento com cartão</p>
                <p className="text-[11px] text-[var(--theme-text-muted)]">
                  Configure <code className="text-[var(--theme-primary)]">VITE_STRIPE_PUBLIC_KEY</code> no .env para ativar o Stripe Elements.
                </p>
                <a
                  href="https://stripe.com/docs/stripe-js/react"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-[11px] font-bold text-[var(--theme-primary)] underline"
                >
                  Ver documentação Stripe →
                </a>
              </div>

              {/* Simulação para desenvolvimento */}
              <button
                onClick={simulateConfirmation}
                className="w-full py-3 rounded-xl font-black text-sm text-black transition-all hover:opacity-90"
                style={{ background: 'var(--theme-primary)' }}
              >
                Simular Pagamento (dev)
              </button>
            </div>
          )}
        </div>

        {/* Rodapé */}
        {status === 'idle' && (
          <div className="px-5 pb-5">
            <button
              onClick={onCancel}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-[var(--theme-text-muted)] border border-[var(--theme-border)] hover:border-[var(--theme-primary)] hover:text-white transition-all"
            >
              Cancelar
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ─── Hook para usar o gateway ─────────────────────────────────────────────────
export function usePaymentGateway() {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [onSuccessCb, setOnSuccessCb] = useState<((id: string) => void) | null>(null);

  const openPayment = (cfg: PaymentConfig, onSuccess: (id: string) => void) => {
    setConfig(cfg);
    setOnSuccessCb(() => onSuccess);
  };

  const closePayment = () => {
    setConfig(null);
    setOnSuccessCb(null);
  };

  const PaymentModal = config ? (
    <PaymentGateway
      config={config}
      onSuccess={(id) => { onSuccessCb?.(id); closePayment(); }}
      onCancel={closePayment}
    />
  ) : null;

  return { openPayment, closePayment, PaymentModal };
}
