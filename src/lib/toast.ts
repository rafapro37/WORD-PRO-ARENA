/**
 * PRO WORLD ARENA — Toast global (singleton)
 * Substitui alert() em qualquer arquivo sem precisar de hook ou contexto.
 *
 * Uso: import { toast } from '../src/lib/toast';
 *      toast.success('Salvo!');
 *      toast.error('Erro ao salvar.');
 *      toast.warning('Atenção!');
 *      toast.info('Informação.');
 */

type ToastType = 'success' | 'error' | 'warning' | 'info';

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

const COLORS: Record<ToastType, { bg: string; border: string; text: string }> = {
  success: { bg: '#14532d', border: '#16a34a', text: '#bbf7d0' },
  error:   { bg: '#450a0a', border: '#dc2626', text: '#fca5a5' },
  warning: { bg: '#451a03', border: '#d97706', text: '#fcd34d' },
  info:    { bg: '#1e293b', border: '#475569', text: '#cbd5e1' },
};

function show(message: string, type: ToastType, duration = 4000) {
  // Garantir container
  let container = document.getElementById('pwa-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'pwa-toast-container';
    Object.assign(container.style, {
      position:       'fixed',
      bottom:         '1.5rem',
      left:           '50%',
      transform:      'translateX(-50%)',
      zIndex:         '9999',
      display:        'flex',
      flexDirection:  'column',
      gap:            '0.5rem',
      alignItems:     'center',
      pointerEvents:  'none',
    });
    document.body.appendChild(container);
  }

  const { bg, border, text } = COLORS[type];
  const el = document.createElement('div');
  Object.assign(el.style, {
    display:        'flex',
    alignItems:     'center',
    gap:            '0.75rem',
    padding:        '0.75rem 1.25rem',
    borderRadius:   '0.75rem',
    border:         `1px solid ${border}`,
    background:     bg,
    color:          text,
    fontSize:       '0.875rem',
    fontWeight:     '700',
    boxShadow:      '0 8px 32px rgba(0,0,0,0.4)',
    backdropFilter: 'blur(8px)',
    animation:      'slideUp 0.2s ease-out',
    maxWidth:       '380px',
    textAlign:      'center',
  });

  el.innerHTML = `<span style="font-size:1rem">${ICONS[type]}</span><span>${message}</span>`;
  container.appendChild(el);

  // Auto-remover
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s ease';
    setTimeout(() => el.remove(), 300);
  }, duration);
}

export const toast = {
  success: (msg: string, ms?: number) => show(msg, 'success', ms),
  error:   (msg: string, ms?: number) => show(msg, 'error',   ms),
  warning: (msg: string, ms?: number) => show(msg, 'warning', ms),
  info:    (msg: string, ms?: number) => show(msg, 'info',    ms),
};
