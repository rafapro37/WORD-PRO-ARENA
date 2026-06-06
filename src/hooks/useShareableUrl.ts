/**
 * PRO WORLD ARENA — Links públicos compartilháveis
 * Gera URLs absolutas para torneios, federações e perfis.
 * Compatível com React Router v6.
 */

import { useCallback } from 'react';

const BASE = typeof window !== 'undefined' ? window.location.origin : '';

export interface ShareableUrls {
  /** URL pública da federação/liga */
  leagueUrl:      (slug: string | null | undefined, leagueId?: string) => string;
  /** URL do detalhe de um torneio */
  tournamentUrl:  (tournamentId: string) => string;
  /** URL do perfil público de jogador */
  playerUrl:      (userId: string) => string;
  /** Copia URL para área de transferência */
  copyToClipboard: (url: string) => Promise<boolean>;
}

export function useShareableUrl(): ShareableUrls {

  const leagueUrl = useCallback((slug: string | null | undefined, leagueId?: string): string => {
    const identifier = slug || leagueId || '';
    return identifier ? `${BASE}/federacao/${identifier}` : BASE;
  }, []);

  const tournamentUrl = useCallback((tournamentId: string): string => {
    return `${BASE}/torneio/${tournamentId}`;
  }, []);

  const playerUrl = useCallback((userId: string): string => {
    return `${BASE}/jogador?id=${userId}`;
  }, []);

  const copyToClipboard = useCallback(async (url: string): Promise<boolean> => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        return true;
      }
      // fallback para browsers sem suporte
      const el = document.createElement('textarea');
      el.value = url;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }, []);

  return { leagueUrl, tournamentUrl, playerUrl, copyToClipboard };
}
