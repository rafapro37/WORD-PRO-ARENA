/**
 * PRO WORLD ARENA — Supabase Realtime (sincronização total)
 * Escuta TODAS as mudanças (criar/editar/excluir) nas tabelas principais
 * e recarrega os dados automaticamente em todos os dispositivos.
 */

import { useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { AppState } from '../../types';

export interface RealtimeNotification {
  id:        string;
  type:      'match_result' | 'registration' | 'invite' | 'market' | 'system';
  title:     string;
  body:      string;
  url?:      string;
  timestamp: number;
  read:      boolean;
}

interface UseRealtimeOptions {
  currentUser: AppState['currentUser'];
  onNotification: (n: RealtimeNotification) => void;
  organizadorId?: string | null;
  onDataChange?: () => void; // chamado quando qualquer dado muda em outro dispositivo
}

const makeId = () => `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// Tabelas que devem sincronizar em tempo real
const SYNC_TABLES = [
  'campeonatos', 'times', 'partidas', 'jogadores',
  'participantes', 'configuracoes', 'usuarios', 'perfis',
  'noticias', 'anuncios', 'federacoes',
];

export function useRealtime({ currentUser, onNotification, onDataChange }: UseRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const notifyRef = useRef(onNotification);
  const dataChangeRef = useRef(onDataChange);
  const debounceRef = useRef<any>(null);

  useEffect(() => { notifyRef.current = onNotification; }, [onNotification]);
  useEffect(() => { dataChangeRef.current = onDataChange; }, [onDataChange]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase.channel(`pwa-sync-${currentUser.id}`);

    // Recarrega dados com debounce (evita recarregar várias vezes seguidas)
    const triggerReload = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (dataChangeRef.current) dataChangeRef.current();
      }, 600);
    };

    // Escuta TODAS as mudanças (INSERT, UPDATE, DELETE) em cada tabela
    for (const table of SYNC_TABLES) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          // Notificação especial para resultado de partida
          if (table === 'partidas' && payload.eventType === 'UPDATE') {
            const match = payload.new as any;
            if (match?.isFinished) {
              notifyRef.current({
                id: makeId(), type: 'match_result', timestamp: Date.now(), read: false,
                title: '⚽ Resultado lançado',
                body: 'Um resultado foi atualizado.',
              });
            }
          }
          // Recarrega os dados em qualquer mudança
          triggerReload();
        }
      );
    }

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUser?.id]);
}
