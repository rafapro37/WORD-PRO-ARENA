import { AppState, UserRole, PlanType, UserStatus, User, PlayerProfile, Tournament, Team, Match, Player, TournamentFormat, FinalFormat, SportType, ContractInvitation, TournamentRegistration, ClubPlayer, ExperienceType } from '../types';
import { supabase } from './supabase';
import { toast } from '../src/lib/toast';

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

    // Configurações globais do sistema (logo, banners, fundos...) — tabela própria.
    // Resiliente: se a tabela ainda não existir, apenas ignora (não quebra o resto).
    try {
      const { data: configRows } = await supabase.from('configuracoes').select('*');
      if (configRows && configRows.length > 0) {
        const globalCfg: any = configRows.find((c: any) => c.id === 'GLOBAL' || c.id === 'global');
        // a coluna no banco se chama "dados"; aceitamos "data" como alternativa
        const cfgData = globalCfg?.dados ?? globalCfg?.data;
        if (cfgData) results.settings = cfgData;
      }
    } catch (cfgErr) {
      console.warn('[Supabase] configuracoes indisponível:', cfgErr);
    }

  } catch (error) {
    console.error('[Supabase] Erro ao buscar dados:', error);
  }
  return results;
};

// ─── Sincronizar tabela para o Supabase ──────────────────────────────────────
// Colunas válidas por tabela — só esses campos são enviados ao Supabase
const TABLE_COLUMNS: Record<string, string[]> = {
  usuarios: ['id','name','username','email','password','role','plan','planStatus','status','organizadorId','ligaId','experiencePreference','organization','createdAt','emailVerified','whatsapp','verified','cardsBg','cardsBgZoom','cardsBgPosX','cardsBgPosY'],
  perfis: ['id','userId','nickname','photoUrl','teamName','teamLogoUrl','ligaId','clubData','position','overall','stats','createdAt'],
  campeonatos: ['id','name','format','sport','experienceType','status','createdAt','organizadorId','ligaId','freeEditMode','manualParticipants','primaryColor','knockoutBackground','leagueLogoUrl','tournamentType','groups','swissRounds','currentRound','phase','awards','socialLinks','maxTeams','groupCount','teamsPerGroup','bannerUrl','bannerSize','isPaid','entryFee','groupStageBackground','knockoutOpacity','classificacaoRules','classificados_por_grupo','knockoutAccentColor','knockoutTextColor','knockoutTrophyUrl','knockoutFont','knockoutCardColor','knockoutHeaderText','knockoutHeaderSize','knockoutHeaderAlign','knockoutLogoPos','knockoutLogoSize','knockoutTrophySize','knockoutShadow','knockoutTeamColor','knockoutTeamFont','knockoutTeamSize','knockoutPhaseColor','knockoutPhaseFont','knockoutPhaseSize','knockoutScoreColor','knockoutScoreFont','knockoutScoreSize'],
  times: ['id','name','organizadorId','tournamentId','ligaId','groupId','ownerId','managerId','roster','played','won','drawn','lost','goalsFor','goalsAgainst','points','logoUrl'],
  partidas: ['id','organizadorId','tournamentId','homeTeamId','awayTeamId','homeScore','awayScore','isFinished','stage','groupId','round','scheduledAt','createdAt','locked'],
  jogadores: ['id','organizadorId','tournamentId','teamId','name','position','goals','assists','yellowCards','redCards','photoUrl'],
  participantes: ['id','organizadorId','tournamentId','teamOwnerId','teamName','teamLogoUrl','status','timestamp','userId'],
  federacoes: ['id','organizadorId','name','slug','logoUrl','bannerUrl','entranceType','type','experienceType','primaryColor','createdAt'],
  noticias: ['id','organizadorId','title','content','imageUrl','createdAt'],
  anuncios: ['id','organizadorId','title','imageUrl','linkUrl','createdAt'],
  convites_liga: ['id','organizadorId','ligaId','senderId','receiverId','status','createdAt'],
};

// Remove campos que não existem na tabela e valores undefined
const sanitizeForTable = (table: string, row: any): any => {
  const cols = TABLE_COLUMNS[table];
  if (!cols) return row;
  const clean: any = {};
  for (const key of cols) {
    if (row[key] !== undefined) clean[key] = row[key];
  }
  return clean;
};

export const syncToSupabase = async (table: string, data: any[]) => {
  if (!data || data.length === 0) return;
  try {
    const sanitized = data.map(row => sanitizeForTable(table, row));
    const { error } = await supabase.from(table).upsert(sanitized, { onConflict: 'id' });
    if (error) {
      console.warn(`[Sync] Aviso em ${table}:`, error.message);
      // Se falhar em lote, tenta linha por linha para não perder tudo
      for (const row of sanitized) {
        const { error: rowError } = await supabase.from(table).upsert([row], { onConflict: 'id' });
        if (rowError) console.warn(`[Sync] Linha rejeitada em ${table} (id=${row.id}):`, rowError.message);
      }
    }
  } catch (error) {
    console.error(`[Sync] Falha em ${table}:`, error);
  }
};

// ─── Sincronizar configurações globais (logo, banners, fundos...) ────────────
export const syncSettingsToSupabase = async (settings: any, showResult = false) => {
  if (!settings) return { ok: false };
  try {
    const payload = JSON.stringify(settings);
    const sizeKB = Math.round(payload.length / 1024);
    const { error } = await supabase
      .from('configuracoes')
      .upsert({ id: 'GLOBAL', dados: settings, updatedat: Date.now() }, { onConflict: 'id' });
    if (error) {
      console.warn('[Sync] configuracoes:', error.message);
      if (showResult) toast.error(`Erro ao salvar (${sizeKB}KB): ${error.message}`, 8000);
      return { ok: false, error: error.message };
    }
    if (showResult) toast.success(`Configurações enviadas ao servidor (${sizeKB}KB)`, 4000);
    return { ok: true };
  } catch (error: any) {
    console.error('[Sync] Falha em configuracoes:', error);
    if (showResult) toast.error(`Falha ao salvar: ${error?.message || String(error)}`, 8000);
    return { ok: false, error: String(error) };
  }
};

export const generateId = () => Date.now().toString() + Math.floor(Math.random() * 10000).toString();

// ─── Deletar registro do Supabase ─────────────────────────────────────────────
export const deleteFromSupabase = async (table: string, id: string) => {
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) console.warn(`[Delete] Aviso em ${table}:`, error.message);
  } catch (error) {
    console.error(`[Delete] Falha em ${table}:`, error);
  }
};

// ─── Deletar vários registros por campo ───────────────────────────────────────
export const deleteWhereFromSupabase = async (table: string, field: string, value: string) => {
  try {
    const { error } = await supabase.from(table).delete().eq(field, value);
    if (error) console.warn(`[Delete] Aviso em ${table}:`, error.message);
  } catch (error) {
    console.error(`[Delete] Falha em ${table}:`, error);
  }
};

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
  // 1) Sessão SEMPRE primeiro e isolada — garante que um erro de quota no
  //    estado principal nunca deslogue o usuário no F5.
  try {
    if (state.currentUser) {
      localStorage.setItem('pro_world_arena_session_v1', JSON.stringify(state.currentUser));
    } else {
      localStorage.removeItem('pro_world_arena_session_v1');
    }
  } catch (e) {
    console.error('[Storage] Erro ao salvar sessão:', e);
  }

  // 2) Estado principal — isolado. Se estourar a quota (imagens base64 pesadas),
  //    a sessão acima já está garantida.
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('[Storage] Erro ao salvar estado (provável quota excedida):', e);
  }
};

// ─── Tombstones: IDs de campeonatos excluídos ─────────────────────────────────
// Lista pequena que SEMPRE persiste (mesmo com estado cheio) e impede que um
// campeonato excluído reapareça no F5 caso o delete remoto não tenha propagado.
const DELETED_KEY = 'pwa_deleted_tournaments_v1';

export const getDeletedTournamentIds = (): string[] => {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

export const addDeletedTournamentId = (id: string) => {
  try {
    const ids = getDeletedTournamentIds();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(DELETED_KEY, JSON.stringify(ids));
    }
  } catch (e) { console.error('[Storage] Erro ao registrar exclusão:', e); }
};

export const clearStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('pro_world_arena_session_v1');
};

export const generateTestScenario = (_adminId: string): Partial<AppState> => ({
  tournaments: [], teams: [], players: [], matches: [],
});
