import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, UserRole } from '../../types';
import { saveState, syncToSupabase } from '../../services/dataService';

export type SyncStatus = 'IDLE' | 'SYNCING' | 'ERROR';

export function useSync(state: AppState) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('IDLE');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSync = useCallback(async () => {
    if (!state.currentUser) return;

    setSyncStatus('SYNCING');
    try {
      saveState(state);

      const user = state.currentUser;
      const isOrganizer = user.role === UserRole.ORGANIZER || user.role === UserRole.ADMIN;
      const userId = user.id;

      // Sempre sincronizar o próprio usuário
      await syncToSupabase('usuarios', [user]);

      // Perfil
      const myProfile = state.playerProfiles.filter(p => p.userId === userId);
      if (myProfile.length > 0) await syncToSupabase('perfis', myProfile);

      if (isOrganizer) {
        const myTournaments   = state.tournaments.filter(t => t.organizadorId === userId);
        const myTeams         = state.teams.filter(t => t.organizadorId === userId);
        const myMatches       = state.matches.filter(m => m.organizadorId === userId);
        const myPlayers       = state.players.filter(p => p.organizadorId === userId);
        const myRegistrations = state.registrations.filter(r => r.organizadorId === userId);
        const myLeagues       = state.leagues.filter(l => l.organizadorId === userId);
        const myNews          = state.news.filter(n => n.organizadorId === userId);
        const myAds           = state.ads.filter(a => a.organizadorId === userId);

        if (myTournaments.length   > 0) await syncToSupabase('campeonatos',   myTournaments);
        if (myTeams.length         > 0) await syncToSupabase('times',         myTeams);
        if (myMatches.length       > 0) await syncToSupabase('partidas',      myMatches);
        if (myPlayers.length       > 0) await syncToSupabase('jogadores',     myPlayers);
        if (myRegistrations.length > 0) await syncToSupabase('participantes', myRegistrations);
        if (myLeagues.length       > 0) await syncToSupabase('federacoes',    myLeagues);
        if (myNews.length          > 0) await syncToSupabase('noticias',      myNews);
        if (myAds.length           > 0) await syncToSupabase('anuncios',      myAds);
      }

      if (user.role === UserRole.TEAM_MANAGER) {
        const myTeam = state.teams.filter(t => t.ownerId === userId || t.managerId === userId);
        if (myTeam.length > 0) await syncToSupabase('times', myTeam);
      }

      setSyncStatus('IDLE');
    } catch (error) {
      console.error('[useSync] Erro:', error);
      setSyncStatus('ERROR');
    }
  }, [state]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(runSync, 2000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [state, runSync]);

  return { syncStatus };
}
