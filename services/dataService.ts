import { AppState, UserRole, PlanType, UserStatus, User, PlayerProfile, Tournament, Team, Match, Player, TournamentFormat, FinalFormat, SportType, ContractInvitation, TournamentRegistration, ClubPlayer, ExperienceType } from '../types';
import { supabase } from './supabase';

const STORAGE_KEY = 'pro_world_arena_db_v1';

// ─── Buscar dados do Supabase — apenas núcleo MVP ────────────────────────────
export const fetchAllFromSupabase = async (): Promise<Partial<AppState>> => {
  const results: Partial<AppState> = {};
  try {
    const [
      { data: users },
      { data: profiles },
      { data: tournaments },
      { data: teams },
      { data: matches },
      { data: players },
      { data: news },
      { data: ads },
      { data: registrations },
      { data: leagues },
      { data: leagueInvitations },
    ] = await Promise.all([
      supabase.from('usuarios').select('*'),
      supabase.from('perfis').select('*'),
      supabase.from('campeonatos').select('*'),
      supabase.from('times').select('*'),
      supabase.from('partidas').select('*'),
      supabase.from('jogadores').select('*'),
      supabase.from('noticias').select('*'),
      supabase.from('anuncios').select('*'),
      supabase.from('participantes').select('*'),
      supabase.from('federacoes').select('*'),
      supabase.from('convites_liga').select('*'),
    ]);

    if (users)             results.users             = users;
    if (profiles)          results.playerProfiles    = profiles;
    if (tournaments)       results.tournaments       = tournaments;
    if (teams)             results.teams             = teams;
    if (matches)           results.matches           = matches;
    if (players)           results.players           = players;
    if (news)              results.news              = news;
    if (ads)               results.ads               = ads;
    if (registrations)     results.registrations     = registrations;
    if (leagues)           results.leagues           = leagues;
    if (leagueInvitations) results.leagueInvitations = leagueInvitations;

  } catch (error) {
    console.error('[Supabase] Erro ao buscar dados:', error);
  }
  return results;
};

// ─── Sincronizar tabela para o Supabase ──────────────────────────────────────
export const syncToSupabase = async (table: string, data: any[]) => {
  if (!data || data.length === 0) return;
  try {
    const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' });
    if (error) console.warn(`[Sync] Aviso em ${table}:`, error.message);
  } catch (error) {
    console.error(`[Sync] Falha em ${table}:`, error);
  }
};

export const generateId = () => Date.now().toString() + Math.floor(Math.random() * 10000).toString();

// ─── Estado inicial ───────────────────────────────────────────────────────────
const INITIAL_STATE: AppState = {
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
  propostas: [],
  planConfigs: {
    [PlanType.FREE]:  { type: PlanType.FREE,  name: 'Grátis', price: 'R$ 0,00',   maxGroups: 1,   maxTeams: 4,   canExport: false, customization: false },
    [PlanType.BASIC]: { type: PlanType.BASIC, name: 'Básico', price: 'R$ 19,90',  maxGroups: 4,   maxTeams: 16,  canExport: false, customization: false },
    [PlanType.PRO]:   { type: PlanType.PRO,   name: 'Pro',    price: 'R$ 39,90',  maxGroups: 12,  maxTeams: 48,  canExport: true,  customization: false },
    [PlanType.ELITE]: { type: PlanType.ELITE, name: 'Elite',  price: 'R$ 79,90',  maxGroups: 999, maxTeams: 999, canExport: true,  customization: true  },
  },
  settings: {
    adminWhatsapp: '',
    socialLinks: [],
    defaultTournamentDurationDays: 30,
    globalTheme: { corPrimaria: '#FF6A00', background: '#1A1C22', superficie: '#20242D', texto: '#F2F2F2' },
    loginLayout: {
      mode: 'STANDARD',
      brandingPos: { x: 5, y: 80 },
      formPos: { x: 85, y: 50 },
      plansPos: { x: 25, y: 50, scale: 100 },
      socialPos: { x: 50, y: 90, visible: true }
    },
    brandingTextPrimary: 'PRO WORLD',
    brandingTextSecondary: 'ARENA',
    bracketStyle: 'CLASSIC',
    enableExternalCarousel: true,
    enableThemedBackground: true,
    playerCustomization: {
      bgColor: '#1A1A1A', textColor: '#FFFFFF', borderColor: '#FF6A00',
      borderRadius: '9999px', shape: 'circle', borderEnabled: true,
      borderWidth: 2, fontFamily: 'Inter', fontSize: 12,
      fontWeight: 'normal', nameTagStyle: 'simple', layout: 'nameBelow'
    },
    globalImages: { homeBg: '', loginBg: '', logo: '' }
  },
  systemLogs: [],
  negotiations: [],
  marketSettings: [],
  marketPlayers: [],
  adminPlayerBank: [],
  gamePlans: [],
  historicoTransferencias: [],
  marketStatuses: {},
  leagues: [],
  leagueInvitations: [],
  leagueMembers: [],
  planUpgradeRequests: [],
};

// ─── Carregar do localStorage ─────────────────────────────────────────────────
export const loadState = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const session = localStorage.getItem('pro_world_arena_session_v1');
    let parsed: any = {};
    if (stored) parsed = JSON.parse(stored);
    if (session) {
      try { parsed.currentUser = JSON.parse(session); } catch {}
    }
    return {
      ...INITIAL_STATE,
      ...parsed,
      settings: {
        ...INITIAL_STATE.settings,
        ...(parsed.settings || {}),
        globalTheme: parsed.settings?.globalTheme || INITIAL_STATE.settings.globalTheme,
      },
      planConfigs: { ...INITIAL_STATE.planConfigs, ...(parsed.planConfigs || {}) },
    };
  } catch {
    return INITIAL_STATE;
  }
};

// ─── Salvar no localStorage ───────────────────────────────────────────────────
export const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (state.currentUser) {
      localStorage.setItem('pro_world_arena_session_v1', JSON.stringify(state.currentUser));
    } else {
      localStorage.removeItem('pro_world_arena_session_v1');
    }
  } catch (e) {
    console.error('[Storage] Erro ao salvar:', e);
  }
};

export const clearStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('pro_world_arena_session_v1');
};

export const generateTestScenario = (_adminId: string): Partial<AppState> => ({
  tournaments: [], teams: [], players: [], matches: [],
});
