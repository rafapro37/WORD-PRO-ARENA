/**
 * PRO WORLD ARENA — Componentes Reutilizáveis
 * Extraídos do App.tsx para eliminar duplicações
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SyncStatus } from '../hooks/useSync';

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  /** Cor de destaque opcional (padrão: var(--theme-primary)) */
  color?: string;
  trend?: { value: number; label: string };
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label, value, icon, color, trend, onClick, className = '',
}) => (
  <motion.div
    whileHover={onClick ? { scale: 1.02, y: -2 } : undefined}
    onClick={onClick}
    className={`bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-2xl p-5 flex items-center gap-4 transition-all ${onClick ? 'cursor-pointer hover:border-[var(--theme-primary)]/50' : ''} ${className}`}
  >
    {icon && (
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: (color || 'var(--theme-primary)') + '20' }}
      >
        <span style={{ color: color || 'var(--theme-primary)' }}>{icon}</span>
      </div>
    )}
    <div className="min-w-0">
      <p className="text-[11px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] truncate">{label}</p>
      <p className="text-2xl font-black text-[var(--theme-text-main)] leading-tight">{value}</p>
      {trend && (
        <p className={`text-[11px] font-bold mt-0.5 ${trend.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)} {trend.label}
        </p>
      )}
    </div>
  </motion.div>
);

// ─── SyncBadge ────────────────────────────────────────────────────────────────

interface SyncBadgeProps {
  status: SyncStatus;
  className?: string;
}

const SYNC_CONFIG = {
  IDLE:    { label: 'Sincronizado',    dot: 'bg-green-400',  text: 'text-green-400'  },
  SYNCING: { label: 'Sincronizando...', dot: 'bg-yellow-400 animate-pulse', text: 'text-yellow-400' },
  ERROR:   { label: 'Erro no sync',    dot: 'bg-red-400',    text: 'text-red-400'    },
} as const;

export const SyncBadge: React.FC<SyncBadgeProps> = ({ status, className = '' }) => {
  const cfg = SYNC_CONFIG[status];
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.text}`}>{cfg.label}</span>
    </div>
  );
};

// ─── PlayerAvatar ─────────────────────────────────────────────────────────────

interface PlayerAvatarProps {
  name: string;
  photoUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Cor de borda (padrão: theme-primary) */
  borderColor?: string;
  className?: string;
}

const SIZE_MAP = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  name, photoUrl, size = 'md', borderColor, className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const initial = (name || '?').charAt(0).toUpperCase();
  const sizeClass = SIZE_MAP[size];

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-black flex-shrink-0 overflow-hidden border-2 ${className}`}
      style={{
        borderColor: borderColor || 'var(--theme-primary)',
        background: photoUrl && !imgError ? 'transparent' : 'var(--theme-primary)20',
        color: 'var(--theme-primary)',
      }}
    >
      {photoUrl && !imgError ? (
        <img
          src={photoUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
};

// ─── ConfirmDialog ────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, title, description, confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar', danger = false, onConfirm, onCancel,
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        >
          <h3 className="text-lg font-black text-[var(--theme-text-main)] mb-2">{title}</h3>
          {description && (
            <p className="text-sm text-[var(--theme-text-muted)] mb-6">{description}</p>
          )}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-sm font-bold text-[var(--theme-text-muted)] hover:text-[var(--theme-text-main)] border border-[var(--theme-border)] hover:border-[var(--theme-primary)]/40 transition-all"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                danger
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'text-black'
              }`}
              style={!danger ? { background: 'var(--theme-primary)' } : undefined}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '🏆', title, description, action, className = '',
}) => (
  <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
    <div className="text-5xl mb-4 opacity-40">{icon}</div>
    <h3 className="text-lg font-black text-[var(--theme-text-main)] mb-2">{title}</h3>
    {description && (
      <p className="text-sm text-[var(--theme-text-muted)] max-w-xs mb-6">{description}</p>
    )}
    {action && (
      <button
        onClick={action.onClick}
        className="px-5 py-2.5 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90"
        style={{ background: 'var(--theme-primary)' }}
      >
        {action.label}
      </button>
    )}
  </div>
);

// ─── LoadingSpinner ────────────────────────────────────────────────────────────

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md', label, fullScreen = false,
}) => {
  const spinnerSize = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-14 h-14' }[size];
  const borderSize  = { sm: 'border-2', md: 'border-3', lg: 'border-4' }[size];

  const content = (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`${spinnerSize} ${borderSize} rounded-full animate-spin`}
        style={{ borderColor: 'var(--theme-primary)40', borderTopColor: 'var(--theme-primary)' }}
      />
      {label && (
        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--theme-text-muted)]">{label}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[var(--theme-bg)]">
        {content}
      </div>
    );
  }

  return content;
};

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
}

const TOAST_STYLE: Record<ToastType, string> = {
  success: 'bg-green-900  border-green-500  text-green-200',
  error:   'bg-red-900    border-red-500    text-red-200',
  warning: 'bg-yellow-900 border-yellow-500 text-yellow-200',
  info:    'bg-blue-900   border-blue-500   text-blue-200',
};

const TOAST_ICON: Record<ToastType, string> = {
  success: '✓', error: '✕', warning: '⚠', info: 'ℹ',
};

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.95 }}
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${TOAST_STYLE[type]}`}
      >
        <span className="font-bold text-lg">{TOAST_ICON[type]}</span>
        <span className="text-sm font-bold">{message}</span>
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── useToast hook ────────────────────────────────────────────────────────────

export function useToast(durationMs = 3000) {
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '', type: 'success', visible: false,
  });

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), durationMs);
  };

  return { toast, showToast, ToastComponent: () => <Toast {...toast} /> };
}

// ─── PlanBadge ────────────────────────────────────────────────────────────────

interface PlanBadgeProps {
  plan: string;
  size?: 'sm' | 'md';
  className?: string;
}

const PLAN_COLOR: Record<string, string> = {
  FREE:  'bg-slate-700  text-slate-300',
  BASIC: 'bg-blue-900   text-blue-300',
  PRO:   'bg-purple-900 text-purple-300',
  ELITE: 'bg-yellow-900 text-yellow-300',
};

const PLAN_LABEL: Record<string, string> = {
  FREE: 'Grátis', BASIC: 'Básico', PRO: 'Pro', ELITE: 'Elite',
};

export const PlanBadge: React.FC<PlanBadgeProps> = ({ plan, size = 'sm', className = '' }) => (
  <span
    className={`inline-flex items-center rounded-full font-black uppercase tracking-wider ${
      size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
    } ${PLAN_COLOR[plan] || PLAN_COLOR.FREE} ${className}`}
  >
    {PLAN_LABEL[plan] || plan}
  </span>
);

// ─── RoleBadge ───────────────────────────────────────────────────────────────

interface RoleBadgeProps {
  role: string;
  className?: string;
}

const ROLE_COLOR: Record<string, string> = {
  ADMIN:        'bg-red-900    text-red-300',
  ORGANIZER:    'bg-orange-900 text-orange-300',
  PLAYER:       'bg-green-900  text-green-300',
  TEAM_MANAGER: 'bg-blue-900   text-blue-300',
  MODERATOR:    'bg-purple-900 text-purple-300',
  GUEST:        'bg-slate-700  text-slate-300',
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin', ORGANIZER: 'Organizador',
  PLAYER: 'Jogador', TEAM_MANAGER: 'Gerente',
  MODERATOR: 'Moderador', GUEST: 'Visitante',
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className = '' }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${ROLE_COLOR[role] || ROLE_COLOR.GUEST} ${className}`}
  >
    {ROLE_LABEL[role] || role}
  </span>
);
