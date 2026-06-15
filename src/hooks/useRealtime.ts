/**
 * PRO WORLD ARENA — Supabase Realtime (simplificado e estável)
 * Escuta mudanças e dispara notificações in-app.
 * Conecta UMA vez por usuário — sem reconexões que causam piscar.
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
}

const makeId = () => `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function useRealtime({ currentUser, onNotification }: UseRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const notifyRef = useRef(onNotification);

  // Mantém a referência da função de notificação atualizada sem reconectar
  useEffect(() => { notifyRef.current = onNotification; }, [onNotification]);

  useEffect(() => {
    if (!currentUser?.id) return;

    // Conecta uma vez só por usuário
    const channel = supabase.channel(`pwa-${currentUser.id}`);

    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'partidas' },
      (payload) => {
        const match = payload.new as any;
        if (!match?.isFinished) return;
        notifyRef.current({
          id: makeId(), type: 'match_result', timestamp: Date.now(), read: false,
          title: '⚽ Resultado lançado',
          body: 'Um resultado foi atualizado.',
        });
      }
    );

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUser?.id]); // só reconecta se o usuário mudar
}
