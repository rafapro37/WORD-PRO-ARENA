/**
 * PRO WORLD ARENA — Supabase Realtime
 * Escuta mudanças nas tabelas partidas, participantes e negociacoes
 * e dispara notificações in-app (e push se autorizado).
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { AppState, UserRole } from '../../types';

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
  /** ID do organizador para filtrar eventos relevantes */
  organizadorId?: string | null;
}

const makeId = () => `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function useRealtime({ currentUser, onNotification, organizadorId }: UseRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  const notify = useCallback((n: Omit<RealtimeNotification, 'id' | 'timestamp' | 'read'>) => {
    const notification: RealtimeNotification = {
      ...n,
      id:        makeId(),
      timestamp: Date.now(),
      read:      false,
    };
    onNotification(notification);

    // Push notification nativa (se autorizado)
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(n.title, {
        body: n.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        tag: n.type,
        data: { url: n.url || '/' },
      });
    }
  }, [onNotification]);

  useEffect(() => {
    if (!currentUser) return;

    // Limpar canal anterior
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const isOrganizer =
      currentUser.role === ('ORGANIZER' as any) ||
      currentUser.role === ('ADMIN' as any);

    const channel = supabase.channel(`pwa-realtime-${currentUser.id}`);

    // ── Partidas finalizadas ──────────────────────────────────────────────────
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'partidas',
        filter: organizadorId
          ? `organizador_id=eq.${organizadorId}`
          : undefined,
      },
      (payload) => {
        const match = payload.new as any;
        if (!match?.is_finished) return;

        const scoreA = match.score_a ?? match.home_score ?? '?';
        const scoreB = match.score_b ?? match.away_score ?? '?';
        const teamA  = match.team_a_name || 'Time A';
        const teamB  = match.team_b_name || 'Time B';

        notify({
          type:  'match_result',
          title: '⚽ Resultado lançado',
          body:  `${teamA} ${scoreA} × ${scoreB} ${teamB}`,
          url:   match.tournament_id ? `/torneio/${match.tournament_id}` : '/dashboard',
        });
      }
    );

    // ── Inscrições (para organizadores) ──────────────────────────────────────
    if (isOrganizer) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'participantes',
          filter: organizadorId
            ? `organizador_id=eq.${organizadorId}`
            : undefined,
        },
        (payload) => {
          const reg = payload.new as any;
          notify({
            type:  'registration',
            title: '📋 Nova inscrição recebida',
            body:  `${reg.team_name || 'Um time'} solicitou inscrição`,
            url:   reg.tournament_id ? `/torneio/${reg.tournament_id}` : '/dashboard',
          });
        }
      );
    }

    // ── Convites de liga (para jogadores) ────────────────────────────────────
    if (!isOrganizer) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'convites_liga',
          filter: `jogador_id=eq.${currentUser.id}`,
        },
        (payload) => {
          const invite = payload.new as any;
          notify({
            type:  'invite',
            title: '🏆 Convite recebido',
            body:  `Você foi convidado para uma liga`,
            url:   '/convites',
          });
        }
      );
    }

    // ── Propostas de mercado ──────────────────────────────────────────────────
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'propostas',
        filter: `jogador_id=eq.${currentUser.id}`,
      },
      (payload) => {
        const prop = payload.new as any;
        notify({
          type:  'market',
          title: '💼 Proposta recebida',
          body:  `Você recebeu uma proposta de transferência`,
          url:   '/mercado',
        });
      }
    );

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Conectado ao canal:', channel.topic);
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUser?.id, organizadorId, notify]);
}
