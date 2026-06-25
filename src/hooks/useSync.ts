import { useEffect, useRef } from 'react';
import { AppState, UserRole } from '../../types';
import { saveState, syncToSupabase, syncSettingsToSupabase } from '../../services/dataService';

export type SyncStatus = 'IDLE' | 'SYNCING' | 'ERROR';

export function useSync(state: AppState) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncRef = useRef<string>('');

  useEffect(() => {
    if (!state.currentUser) return;

    // Salvar local imediatamente (não dispara re-render)
    saveState(state);

    // Criar uma assinatura dos dados sincronizáveis para evitar sync repetido
    const signature = JSON.stringify({
      u: state.users.length,
      t: state.tournaments.map(t => t.id + (t as any).updatedAt).join(),
      tm: state.teams.length,
      m: state.matches.length,
      l: state.leagues.length,
      cu: state.currentUser.id,
    });

    if (signature === lastSyncRef.current) return; // nada mudou, não sincroniza

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      lastSyncRef.current = signature;
      try {
        const user = state.currentUser!;
        const isAdmin = user.role === UserRole.ADMIN;
        const isOrganizer = user.role === UserRole.ORGANIZER || isAdmin;
        const userId = user.id;

        if (isAdmin) {
          await syncToSupabase('usuarios', state.users);
        } else {
          await syncToSupabase('usuarios', [user]);
        }

        const myProfile = state.playerProfiles.filter(p => p.userId === userId);
        if (myProfile.length > 0) await syncToSupabase('perfis', myProfile);

        if (isAdmin) {
          // Admin é dono do sistema: sincroniza tudo (preservando o organizadorId de cada item)
          if (state.tournaments.length   > 0) await syncToSupabase('campeonatos',   state.tournaments);
          if (state.teams.length         > 0) await syncToSupabase('times',         state.teams);
          if (state.matches.length       > 0) await syncToSupabase('partidas',      state.matches);
          if (state.players.length       > 0) await syncToSupabase('jogadores',     state.players);
          if (state.registrations.length > 0) await syncToSupabase('participantes', state.registrations);
          if (state.leagues.length       > 0) await syncToSupabase('federacoes',    state.leagues);
          if (state.news.length          > 0) await syncToSupabase('noticias',      state.news);
          if (state.ads.length           > 0) await syncToSupabase('anuncios',      state.ads);
          // Configurações globais do sistema (logo, banners do carrossel, fundos...)
          await syncSettingsToSupabase(state.settings);
        } else if (isOrganizer) {
          const myTournaments   = state.tournaments.filter(t => t.organizadorId === userId);
          const myTournamentIds = new Set(myTournaments.map(t => t.id));
          // Pertence a mim se o organizadorId bate OU está vinculado a um torneio meu.
          // Carimba o organizadorId nos itens sem o campo, pra aparecerem em outro dispositivo.
          const mine  = (x: any) => x.organizadorId === userId || (x.tournamentId && myTournamentIds.has(x.tournamentId));
          const stamp = (arr: any[]) => arr.filter(mine).map(x => x.organizadorId ? x : { ...x, organizadorId: userId });

          const myTeams         = stamp(state.teams);
          const myMatches       = stamp(state.matches);
          const myPlayers       = stamp(state.players);
          const myRegistrations = stamp(state.registrations);
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
      } catch (error) {
        console.error('[useSync] Erro:', error);
      }
    }, 2000);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [state]);

  return { syncStatus: 'IDLE' as SyncStatus };
}
