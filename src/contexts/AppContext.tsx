import React, {
  createContext, useContext, useState, useEffect,
  useMemo, useCallback, type Dispatch, type SetStateAction,
} from 'react';
import {
  AppState, User, UserRole, PlayerProfile, League,
  ExperienceType, AppSettings, Match, Player, Team,
} from '../../types';
import { loadState, saveState, generateId } from '../../services/dataService';
import { fetchAllFromSupabase } from '../../services/dataService';
import { clearSession } from '../../services/authService';
import { useSync, type SyncStatus } from '../hooks/useSync';
import { useRealtime, type RealtimeNotification } from '../hooks/useRealtime';
import { useNotifications } from '../components/NotificationCenter';

// ─── Tipos do contexto ────────────────────────────────────────────────────────

interface AppContextValue {
  // Estado bruto
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;

  // Navegação
  currentPage: string;
  setCurrentPage: (page: string) => void;
  navigateTo: (page: string, params?: { leagueId?: string; slug?: string }) => void;

  // Liga e experiência selecionadas
  selectedLeagueId: string | null;
  setSelectedLeagueId: (id: string | null) => void;
  globalExperience: ExperienceType | null;
  setGlobalExperience: (exp: ExperienceType | null) => void;
  landingView: string;
  setLandingView: (v: string) => void;
  loginMode: 'LOGIN' | 'REGISTER';
  setLoginMode: (m: 'LOGIN' | 'REGISTER') => void;
  isSidebarRetracted: boolean;
  setIsSidebarRetracted: (v: boolean) => void;
  selectedTournamentId: string | null;
  setSelectedTournamentId: (id: string | null) => void;
  publicMarketView: boolean;
  setPublicMarketView: (v: boolean) => void;

  // Estado de carregamento e sync
  isLoading: boolean;
  syncStatus: SyncStatus;

  // Notificações in-app
  notifications: RealtimeNotification[];
  unreadCount: number;
  addNotification: (n: RealtimeNotification) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearNotifications: () => void;

  // Dados filtrados (multi-tenant)
  currentOrganizerId: string | null;
  filteredLeagues: League[];
  filteredTournaments: AppState['tournaments'];
  filteredTeams: AppState['teams'];
  filteredPlayers: AppState['players'];
  filteredMatches: AppState['matches'];
  filteredNews: AppState['news'];
  filteredAds: AppState['ads'];
  filteredLogs: AppState['systemLogs'];
  filteredPropostas: AppState['propostas'];
  filteredHistory: AppState['historicoTransferencias'];
  filteredNegotiations: AppState['negotiations'];
  filteredLeagueInvitations: AppState['leagueInvitations'];
  showMarketFeatures: boolean;

  // Toast — substitui alert() em todo o sistema
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;

  // Ações principais
  handleLogin:    (user: User) => void;
  handleLogout:   () => void;
  handleRegister: (user: User, profile?: PlayerProfile) => void;
  handleUpdateSettings: (updates: Partial<AppSettings>) => void;
  logSystemAction: (module: string, description: string, isRequested?: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  // ── UI state ──────────────────────────────────────────────────────────────
  const [currentPage,          setCurrentPageRaw]   = useState('landing');
  const [isLoading,            setIsLoading]         = useState(true);
  const [globalExperience,     setGlobalExperience]  = useState<ExperienceType | null>(null);
  const [loginMode,            setLoginMode]         = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [selectedLeagueId,     setSelectedLeagueId]  = useState<string | null>(null);
  const [landingView,          setLandingView]       = useState('inicio');
  const [isSidebarRetracted,   setIsSidebarRetracted] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [publicMarketView,     setPublicMarketView]  = useState(false);

  // ── AppState ──────────────────────────────────────────────────────────────
  const [state, setState] = useState<AppState>({
    currentUser: null,
    users: [],
    playerProfiles: [],
    contractInvitations: [],
    tournaments: [],
    registrations: [],
    teams: [],
    matches: [],
    players: [],
    ads: [],
    news: [],
    planConfigs: {} as any,
    settings: {
      adminWhatsapp: '',
      socialLinks: [],
      defaultTournamentDurationDays: 30,
      loginLayout: {
        mode: 'STANDARD',
        brandingPos: { x: 0, y: 0 },
        formPos: { x: 0, y: 0 },
        plansPos: { x: 0, y: 0, scale: 100 },
        socialPos: { x: 50, y: 90, visible: true },
      },
      bracketStyle: 'CLASSIC',
      enableExternalCarousel: true,
      enableThemedBackground: true,
      playerCustomization: {
        bgColor: '#1A1A1A', textColor: '#FFFFFF', borderColor: '#FF6A00',
        borderRadius: '9999px', shape: 'circle', borderEnabled: true,
        borderWidth: 2, fontFamily: 'Inter', fontSize: 12,
        fontWeight: 'normal', nameTagStyle: 'simple', layout: 'nameBelow',
      },
      globalTheme: {
        corPrimaria: '#FF6A00', background: '#1A1C22',
        superficie: '#20242D', texto: '#F2F2F2',
      },
    },
    systemLogs: [],
    negotiations: [],
    marketSettings: [],
    marketPlayers: [],
    adminPlayerBank: [],
    gamePlans: [],
    propostas: [],
    historicoTransferencias: [],
    marketStatuses: {},
    leagues: [],
    leagueInvitations: [],
    leagueMembers: [],
    planUpgradeRequests: [],
  });

  // ── Carregar dados iniciais — Supabase é a fonte principal ───────────────
  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true);
      try {
        // Carregar sessão do localStorage (só para saber quem está logado)
        const local = loadState();
        const sessionUser = local.currentUser;
        const localSettings = local.settings;

        // Buscar TUDO do Supabase primeiro
        let loaded: AppState = { ...local };
        try {
          const remoteData = await fetchAllFromSupabase();
          if (remoteData && Object.keys(remoteData).length > 0) {
            loaded = {
              ...local,
              users:             remoteData.users             || local.users,
              tournaments:       remoteData.tournaments       || local.tournaments,
              teams:             remoteData.teams             || local.teams,
              matches:           remoteData.matches           || local.matches,
              players:           remoteData.players           || local.players,
              playerProfiles:    remoteData.playerProfiles    || local.playerProfiles,
              registrations:     remoteData.registrations     || local.registrations,
              leagues:           remoteData.leagues           || local.leagues,
              leagueInvitations: remoteData.leagueInvitations || local.leagueInvitations,
              news:              remoteData.news              || local.news,
              ads:               remoteData.ads               || local.ads,
            };
          }
        } catch (remoteErr) {
          console.warn('[AppContext] Supabase indisponível, usando dados locais:', remoteErr);
        }

        // Restaurar sessão e settings locais
        loaded.currentUser = sessionUser;
        loaded.settings = {
          ...loaded.settings,
          ...localSettings,
        };

        // Garantir tema padrão
        if (!loaded.settings.globalTheme) {
          loaded.settings.globalTheme = {
            corPrimaria: '#FF6A00', background: '#1A1C22',
            superficie: '#20242D', texto: '#F2F2F2',
          };
        }

        setState(loaded);
      } catch (err) {
        console.error('[AppContext] Erro no bootstrap:', err);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  // ── Sync automático ───────────────────────────────────────────────────────
  const { syncStatus } = useSync(state);

  // ── Toast global — substitui alert() ─────────────────────────────────────
  const [toastQueue, setToastQueue] = useState<Array<{
    id: string; message: string; type: 'success' | 'error' | 'warning' | 'info';
  }>>([]);

  const showToast = useCallback((
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'success'
  ) => {
    const id = `toast-${Date.now()}`;
    setToastQueue(q => [...q, { id, message, type }]);
    setTimeout(() => setToastQueue(q => q.filter(t => t.id !== id)), 4000);
  }, []);

  // ── Notificações in-app ───────────────────────────────────────────────────
  const {
    notifications, unreadCount,
    addNotification, markAllRead, markRead, clearAll: clearNotifications,
  } = useNotifications();

  // ── Realtime — escuta eventos do Supabase ─────────────────────────────────
  const realtimeOrgId = useMemo(() => {
    if (!state.currentUser) return null;
    if (state.currentUser.role === UserRole.ADMIN || state.currentUser.role === UserRole.ORGANIZER) {
      return state.currentUser.id;
    }
    return state.currentUser.organizadorId || null;
  }, [state.currentUser]);

  useRealtime({
    currentUser: state.currentUser,
    organizadorId: realtimeOrgId,
    onNotification: addNotification,
  });

  // ── Aplicar tema CSS em tempo real ───────────────────────────────────────
  useEffect(() => {
    const primary = state.settings.globalTheme?.corPrimaria || '#FF6A00';
    const root = document.documentElement;
    root.style.setProperty('--theme-primary',          primary);
    root.style.setProperty('--theme-bg',               state.settings.globalTheme?.background  || '#1A1C22');
    root.style.setProperty('--theme-surface',          state.settings.globalTheme?.superficie  || '#20242D');
    root.style.setProperty('--theme-text-main',        state.settings.globalTheme?.texto       || '#F2F2F2');
    root.style.setProperty('--theme-text-muted',       '#9CA3AF');
    root.style.setProperty('--theme-surface-highlight','#2A2E3A');
    root.style.setProperty('--theme-border',           '#32374A');
    root.style.setProperty('--primary',                primary);
    root.style.setProperty('--cor-primaria',           primary);
    root.style.setProperty('--bg-global',              state.settings.globalTheme?.background  || '#1A1C22');
    root.style.setProperty('--texto-global',           state.settings.globalTheme?.texto       || '#F2F2F2');
    root.style.setProperty('--global-font-size',       `${state.settings.globalFontSize || 16}px`);
  }, [state.settings.globalTheme, state.settings.globalFontSize]);

  // ── Navegação ─────────────────────────────────────────────────────────────
  const setCurrentPage = useCallback((page: string) => {
    setCurrentPageRaw(page);
  }, []);

  // navigateTo mantido para compatibilidade — React Router sincroniza via useNavigateSync
  const navigateTo = useCallback((page: string, params?: { leagueId?: string; slug?: string }) => {
    if (page === 'landing' && (params?.leagueId || params?.slug)) {
      const league = state.leagues.find(l =>
        l.id === params.leagueId || l.slug === params.slug,
      );
      if (league) setSelectedLeagueId(league.id);
    } else if (page === 'landing') {
      setSelectedLeagueId(null);
      setLandingView('inicio');
    }
    setCurrentPageRaw(page);
  }, [state.leagues]);

  // Proteção de rotas
  useEffect(() => {
    const canAccess = (page: string, user: User | null): boolean => {
      if (!user) return ['landing', 'login', 'federation-public'].includes(page);
      const { role } = user;
      if (role === UserRole.ADMIN) return true;
      if (page === 'admin-dashboard' || page === 'admin-personalizacao') return role === UserRole.ADMIN;
      if (page === 'create-tournament') return role === UserRole.ORGANIZER || role === UserRole.ADMIN;
      if (page === 'player-dashboard') return role === UserRole.PLAYER || role === UserRole.ADMIN;
      // Organizer, Manager e Player têm acesso às páginas comuns
      return true;
    };
    if (!canAccess(currentPage, state.currentUser)) {
      setCurrentPageRaw('landing');
    }
  }, [currentPage, state.currentUser]);

  // ── Log de sistema ────────────────────────────────────────────────────────
  const logSystemAction = useCallback((module: string, description: string, isRequested = true) => {
    const organizadorId = state.currentUser?.role === UserRole.ORGANIZER || state.currentUser?.role === UserRole.ADMIN
      ? state.currentUser.id
      : state.currentUser?.organizadorId;
    if (!organizadorId) return;
    setState(prev => {
      const logs = prev.systemLogs || [];
      const newLog = {
        id: generateId(),
        organizadorId,
        timestamp: Date.now(),
        module,
        description,
        isRequested,
        status: 'PENDING' as const,
      };
      return { ...prev, systemLogs: [...logs, newLog].slice(-100) };
    });
  }, [state.currentUser]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const handleLogin = useCallback((user: User) => {
    setState(prev => ({ ...prev, currentUser: user }));
    if (user.role === UserRole.ADMIN)             setCurrentPageRaw('admin-dashboard');
    else if (user.role === UserRole.PLAYER)       setCurrentPageRaw('player-profile');
    else if (user.role === UserRole.TEAM_MANAGER) setCurrentPageRaw('team-dashboard');
    else                                           setCurrentPageRaw('dashboard');
  }, []);

  const handleLogout = useCallback(() => {
    setState(prev => ({ ...prev, currentUser: null }));
    setCurrentPageRaw('login');
    clearSession();
  }, []);

  const handleRegister = useCallback((newUser: User, newProfile?: PlayerProfile) => {
    setState(prev => {
      const updatedProfiles = newProfile ? [...prev.playerProfiles, newProfile] : prev.playerProfiles;
      const newTeamsList    = [...prev.teams];

      if (newUser.role === UserRole.TEAM_MANAGER) {
        const hasTeam = prev.teams.some(t => t.ownerId === newUser.id || t.managerId === newUser.id);
        if (!hasTeam) {
          newTeamsList.push({
            id: `team-${newUser.id}-${Date.now()}`,
            name: `Time de ${newUser.name || newUser.username}`,
            organizadorId: newUser.organizadorId!,
            ownerId: newUser.id, managerId: newUser.id,
            tournamentId: 'GLOBAL', groupId: 'NONE',
            roster: [], played: 0, won: 0, drawn: 0, lost: 0,
            goalsFor: 0, goalsAgainst: 0, points: 0,
            ligaId: newProfile?.ligaId,
          });
        }
      }

      const updatedRegistrations = [...(prev.registrations || [])];
      if (newProfile?.ligaId) {
        prev.tournaments.forEach(t => {
          if (t.status === 'ACTIVE' && t.ligaId === newProfile.ligaId) {
            if (!updatedRegistrations.some(r => r.tournamentId === t.id && r.teamOwnerId === newUser.id)) {
              updatedRegistrations.push({
                id: generateId(), organizadorId: t.organizadorId,
                tournamentId: t.id, teamOwnerId: newUser.id,
                teamName: newProfile.teamName || newUser.name || newUser.username,
                teamLogoUrl: newProfile.teamLogoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${newUser.id}`,
                status: 'PENDING', timestamp: Date.now(), userId: newUser.id,
              });
            }
          }
        });
      }

      return { 
        ...prev, 
        currentUser: newUser,  // login automático após registro
        users: [...prev.users, newUser], 
        playerProfiles: updatedProfiles, 
        teams: newTeamsList, 
        registrations: updatedRegistrations 
      };
    });

    // Navegar para página correta após registro
    if (newUser.role === UserRole.ADMIN)             setCurrentPageRaw('admin-dashboard');
    else if (newUser.role === UserRole.ORGANIZER)    setCurrentPageRaw('dashboard');
    else if (newUser.role === UserRole.TEAM_MANAGER) setCurrentPageRaw('team-dashboard');
    else                                              setCurrentPageRaw('player-profile');

    logSystemAction('Autenticação', `Novo usuário: ${newUser.username} (${newUser.role})`);
  }, [logSystemAction]);

  const handleUpdateSettings = useCallback((updates: Partial<AppSettings>) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...updates } }));
  }, []);

  // ── Multi-tenant: dados filtrados ─────────────────────────────────────────
  const currentOrganizerId = useMemo(() => {
    if (!state.currentUser) {
      if (selectedLeagueId) {
        const league = state.leagues.find(l => l.id === selectedLeagueId);
        return league?.organizadorId || null;
      }
      return null;
    }
    if (state.currentUser.role === UserRole.ADMIN) return null;
    if (state.currentUser.role === UserRole.ORGANIZER) return state.currentUser.id;
    return state.currentUser.organizadorId;
  }, [state.currentUser, selectedLeagueId, state.leagues]);

  const showMarketFeatures = useMemo(() => {
    if (!state.currentUser || state.currentUser.role === UserRole.ADMIN) return true;
    const leagueId = selectedLeagueId || state.currentUser.ligaId;
    if (leagueId) {
      const league = state.leagues.find(l => l.id === leagueId);
      return league?.type === 'MARKET';
    }
    return true;
  }, [state.currentUser, selectedLeagueId, state.leagues]);

  const filteredLeagues = useMemo(() =>
    state.leagues.filter(l =>
      (!currentOrganizerId || l.organizadorId === currentOrganizerId) &&
      (!globalExperience  || l.experienceType === globalExperience),
    ), [state.leagues, currentOrganizerId, globalExperience]);

  const filteredLeagueInvitations = useMemo(() =>
    state.leagueInvitations.filter(i =>
      (!currentOrganizerId || i.organizadorId === currentOrganizerId) &&
      (!selectedLeagueId   || state.leagues.find(l => l.id === selectedLeagueId)?.organizadorId === i.organizadorId),
    ), [state.leagueInvitations, currentOrganizerId, selectedLeagueId, state.leagues]);

  const filteredTournaments = useMemo(() =>
    state.tournaments.filter(t => {
      const orgOk = !currentOrganizerId || t.organizadorId === currentOrganizerId || state.currentUser?.id === t.organizadorId;
      const ligaOk = selectedLeagueId ? t.ligaId === selectedLeagueId : true;
      const expOk  = !globalExperience || t.experienceType === globalExperience;
      return orgOk && ligaOk && expOk;
    }), [state.tournaments, currentOrganizerId, selectedLeagueId, state.currentUser, globalExperience]);

  const filteredTeams = useMemo(() =>
    state.teams.filter(t => {
      const orgOk  = !currentOrganizerId || t.organizadorId === currentOrganizerId || state.currentUser?.id === t.organizadorId;
      const ligaOk = selectedLeagueId ? t.ligaId === selectedLeagueId : true;
      return orgOk && ligaOk;
    }), [state.teams, currentOrganizerId, selectedLeagueId, state.currentUser]);

  const filteredPlayers = useMemo(() =>
    state.players.filter(p => {
      const team    = state.teams.find(t => t.id === p.teamId);
      const orgOk  = !currentOrganizerId || p.organizadorId === currentOrganizerId;
      const ligaOk = selectedLeagueId ? team?.ligaId === selectedLeagueId : true;
      return orgOk && ligaOk;
    }), [state.players, currentOrganizerId, selectedLeagueId, state.teams]);

  const filteredMatches = useMemo(() =>
    state.matches.filter(m => {
      const tourney = state.tournaments.find(t => t.id === m.tournamentId);
      const orgOk  = !currentOrganizerId || m.organizadorId === currentOrganizerId;
      const ligaOk = selectedLeagueId ? tourney?.ligaId === selectedLeagueId : !tourney?.ligaId;
      return orgOk && ligaOk;
    }), [state.matches, currentOrganizerId, selectedLeagueId, state.tournaments]);

  const filteredNews = useMemo(() =>
    state.news.filter(n =>
      (!currentOrganizerId || n.organizadorId === currentOrganizerId) &&
      (selectedLeagueId ? n.ligaId === selectedLeagueId : !n.ligaId),
    ), [state.news, currentOrganizerId, selectedLeagueId]);

  const filteredAds = useMemo(() =>
    state.ads.filter(a =>
      (!currentOrganizerId || a.organizadorId === currentOrganizerId) &&
      (selectedLeagueId ? a.ligaId === selectedLeagueId : !a.ligaId),
    ), [state.ads, currentOrganizerId, selectedLeagueId]);

  const filteredLogs = useMemo(() =>
    state.systemLogs.filter(l =>
      (!currentOrganizerId || l.organizadorId === currentOrganizerId),
    ), [state.systemLogs, currentOrganizerId]);

  const filteredPropostas = useMemo(() =>
    state.propostas.filter(p =>
      (!currentOrganizerId || p.organizadorId === currentOrganizerId) &&
      (selectedLeagueId ? p.ligaId === selectedLeagueId : !p.ligaId),
    ), [state.propostas, currentOrganizerId, selectedLeagueId]);

  const filteredHistory = useMemo(() =>
    state.historicoTransferencias.filter(h => h.organizadorId === currentOrganizerId),
    [state.historicoTransferencias, currentOrganizerId]);

  const filteredNegotiations = useMemo(() =>
    state.negotiations.filter(n => n.organizadorId === currentOrganizerId),
    [state.negotiations, currentOrganizerId]);

  // ── Valor do contexto ─────────────────────────────────────────────────────
  const value: AppContextValue = {
    state, setState,
    currentPage, setCurrentPage, navigateTo,
    selectedLeagueId, setSelectedLeagueId,
    globalExperience, setGlobalExperience,
    landingView, setLandingView,
    loginMode, setLoginMode,
    isSidebarRetracted, setIsSidebarRetracted,
    selectedTournamentId, setSelectedTournamentId,
    publicMarketView, setPublicMarketView,
    isLoading, syncStatus,
    notifications, unreadCount,
    addNotification, markAllRead, markRead, clearNotifications,
    currentOrganizerId,
    filteredLeagues, filteredLeagueInvitations,
    filteredTournaments, filteredTeams,
    filteredPlayers, filteredMatches,
    filteredNews, filteredAds,
    filteredLogs, filteredPropostas,
    filteredHistory, filteredNegotiations,
    showMarketFeatures,
    handleLogin, handleLogout, handleRegister,
    handleUpdateSettings, logSystemAction,
    showToast,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      {/* Toast stack global */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[700] flex flex-col gap-2 items-center pointer-events-none">
        {toastQueue.map(t => {
          const styles: Record<string, string> = {
            success: 'bg-green-900 border-green-600 text-green-200',
            error:   'bg-red-900   border-red-600   text-red-200',
            warning: 'bg-yellow-900 border-yellow-600 text-yellow-200',
            info:    'bg-slate-800 border-slate-600 text-slate-200',
          };
          const icons: Record<string, string> = {
            success: '✓', error: '✕', warning: '⚠', info: 'ℹ',
          };
          return (
            <div
              key={t.id}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl text-sm font-bold backdrop-blur-md ${styles[t.type]}`}
              style={{ animation: 'slideUp 0.2s ease-out' }}
            >
              <span className="text-base">{icons[t.type]}</span>
              {t.message}
            </div>
          );
        })}
      </div>
    </AppContext.Provider>
  );
};

// ─── Hook de acesso ───────────────────────────────────────────────────────────

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppProvider');
  return ctx;
};
