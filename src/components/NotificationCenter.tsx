import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RealtimeNotification } from '../hooks/useRealtime';
import { useLocale } from '../contexts/LocaleContext';
import { usePWA } from '../hooks/usePWA';

// ─── Ícone por tipo ───────────────────────────────────────────────────────────
const TYPE_ICON: Record<RealtimeNotification['type'], string> = {
  match_result: '⚽',
  registration: '📋',
  invite:       '🏆',
  market:       '💼',
  system:       '🔔',
};

const TYPE_COLOR: Record<RealtimeNotification['type'], string> = {
  match_result: '#10B981',
  registration: '#3B82F6',
  invite:       '#F59E0B',
  market:       '#8B5CF6',
  system:       '#6B7280',
};

// ─── Tempo relativo ───────────────────────────────────────────────────────────
function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d atrás`;
  if (h > 0) return `${h}h atrás`;
  if (m > 0) return `${m}min atrás`;
  return 'agora';
}

// ─── Hook de gerenciamento de notificações ────────────────────────────────────
const STORAGE_KEY = 'pwa_notifications_v1';
const MAX_STORED  = 50;

export function useNotifications() {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const addNotification = useCallback((n: RealtimeNotification) => {
    setNotifications(prev => {
      const updated = [n, ...prev].slice(0, MAX_STORED);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, addNotification, markAllRead, markRead, clearAll };
}

// ─── Componente NotificationCenter ───────────────────────────────────────────

interface NotificationCenterProps {
  notifications: RealtimeNotification[];
  unreadCount:   number;
  onMarkAllRead: () => void;
  onMarkRead:    (id: string) => void;
  onClearAll:    () => void;
  onNavigate:    (url: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications, unreadCount, onMarkAllRead, onMarkRead, onClearAll, onNavigate,
}) => {
  const { T } = useLocale();
  const { isInstallable, promptInstall, pushPermission, requestPush, isOnline } = usePWA();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotifClick = (n: RealtimeNotification) => {
    onMarkRead(n.id);
    if (n.url) onNavigate(n.url);
    setOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>

      {/* ── Botão sino ── */}
      <button
        onClick={() => { setOpen(o => !o); if (!open && unreadCount > 0) onMarkAllRead(); }}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-[var(--theme-surface-highlight)]"
        aria-label="Notificações"
      >
        <span className="text-lg">🔔</span>
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-black"
              style={{ background: 'var(--theme-primary)' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* ── Painel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 w-80 rounded-2xl border border-[var(--theme-border)] shadow-2xl overflow-hidden z-[400]"
            style={{ background: 'var(--theme-surface)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--theme-border)]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-[var(--theme-text-main)]">Notificações</span>
                {!isOnline && (
                  <span className="text-[10px] bg-red-900 text-red-300 px-2 py-0.5 rounded-full font-bold">Offline</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={onClearAll}
                    className="text-[10px] font-bold text-[var(--theme-text-muted)] hover:text-red-400 transition-colors uppercase tracking-wider"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Lista */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-3xl mb-2 opacity-30">🔕</p>
                  <p className="text-xs text-[var(--theme-text-muted)] font-bold uppercase tracking-wider">
                    Nenhuma notificação
                  </p>
                </div>
              ) : (
                notifications.map((n, i) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleNotifClick(n)}
                    className={`flex gap-3 px-4 py-3 border-b border-[var(--theme-border)] cursor-pointer transition-colors hover:bg-[var(--theme-bg)] last:border-0 ${
                      !n.read ? 'bg-[var(--theme-primary)]/5' : ''
                    }`}
                  >
                    {/* Ícone */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: TYPE_COLOR[n.type] + '20' }}
                    >
                      {TYPE_ICON[n.type]}
                    </div>

                    {/* Texto */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-black truncate ${n.read ? 'text-[var(--theme-text-muted)]' : 'text-[var(--theme-text-main)]'}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-[var(--theme-text-muted)] truncate mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-[var(--theme-text-muted)] opacity-60 mt-1">{timeAgo(n.timestamp)}</p>
                    </div>

                    {/* Indicador não lido */}
                    {!n.read && (
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                        style={{ background: 'var(--theme-primary)' }}
                      />
                    )}
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer — PWA e Push */}
            <div className="px-4 py-3 border-t border-[var(--theme-border)] space-y-2">
              {/* Instalar app */}
              {isInstallable && (
                <button
                  onClick={promptInstall}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider text-black transition-all hover:opacity-90"
                  style={{ background: 'var(--theme-primary)' }}
                >
                  <span>📲</span> Instalar PRO WORLD ARENA
                </button>
              )}

              {/* Ativar notificações push */}
              {pushPermission === 'default' && (
                <button
                  onClick={requestPush}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider border border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-white hover:border-[var(--theme-primary)] transition-all"
                >
                  <span>🔔</span> Ativar notificações push
                </button>
              )}
              {pushPermission === 'granted' && (
                <p className="text-center text-[10px] font-bold text-green-400 uppercase tracking-wider">
                  ✓ Notificações push ativas
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
