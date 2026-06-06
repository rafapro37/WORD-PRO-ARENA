
export enum UserRole {
  ADMIN = 'ADMIN',
  ORGANIZER = 'ORGANIZER',
  PLAYER = 'PLAYER',
  TEAM_MANAGER = 'TEAM_MANAGER',
  MODERATOR = 'MODERATOR',
  GUEST = 'GUEST'
}

export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum LeagueMemberStatus {
  PENDING = 'PENDING', // pendente
  APPROVED = 'APPROVED', // aprovado
  REJECTED = 'REJECTED', // recusado
  WAITING_PAYMENT = 'WAITING_PAYMENT', // aguardando pagamento
  PAID = 'PAID' // pago
}

export interface LeagueMember {
  id: string;
  ligaId: string;
  userId: string;
  role: string; // Use string for flexibility or narrow to a specific union
  status: LeagueMemberStatus;
  joinedAt: number;
}

export enum PlanType {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ELITE = 'ELITE'
}

export enum PlanStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  EXPIRED = 'EXPIRED'
}

export enum SportType {
  VIRTUAL = 'VIRTUAL',
  FIELD = 'FIELD',
  FUTSAL = 'FUTSAL'
}

export enum TournamentFormat {
  GROUPS = 'GROUPS',
  LEAGUE = 'LEAGUE',
  PONTOS_CORRIDOS = 'PONTOS_CORRIDOS',
  PONTOS_CORRIDOS_PLAYOFF = 'PONTOS_CORRIDOS_PLAYOFF',
  KNOCKOUT = 'KNOCKOUT',
  SWISS = 'SWISS',
  MD3 = 'MD3'
}

export enum FinalFormat {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE'
}

/** @deprecated — Temas de ligas reais removidos. Use globalTheme em AppSettings. */
export enum AppTheme {
  THEME_CHAMPIONS = 'THEME_CHAMPIONS',
  THEME_EUROPA = 'THEME_EUROPA',
  THEME_PREMIER = 'THEME_PREMIER',
  THEME_LALIGA = 'THEME_LALIGA',
  THEME_SERIE_A = 'THEME_SERIE_A',
  THEME_BUNDESLIGA = 'THEME_BUNDESLIGA',
  THEME_LIGUE_1 = 'THEME_LIGUE_1',
  THEME_PRIMEIRA_LIGA = 'THEME_PRIMEIRA_LIGA',
  THEME_BRASILEIRAO = 'THEME_BRASILEIRAO',
  THEME_MUNDIAL = 'THEME_MUNDIAL',
  THEME_LIBERTADORES = 'THEME_LIBERTADORES',
  THEME_ASIA_CHAMPIONS = 'THEME_ASIA_CHAMPIONS',
  THEME_COPA_DEL_REY = 'THEME_COPA_DEL_REY',
  THEME_FA_CUP = 'THEME_FA_CUP',
  THEME_COPA_BRASIL = 'THEME_COPA_BRASIL'
}

// --- NOVOS TIPOS MERCADO DA BOLA ---
export enum MarketStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export enum ExperienceType {
  X1 = 'X1',
  PRO_CLUBS = 'PRO_CLUBS'
}

export interface League {
  id: string;
  name: string;
  slug?: string;
  organizadorId: string; // Organizer ID
  mercadoStatus: MarketStatus;
  entranceType: 'aberta' | 'convite';
  type: 'SIMPLE' | 'MARKET'; // SIMPLE = No market features, MARKET = Full market features
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  description?: string;
  experienceType?: ExperienceType; // X1 or PRO_CLUBS
  mainTeamId?: string; // For Pro Clubs federation/league
}

export interface LeagueInvitation {
  id: string;
  ligaId: string;
  organizadorId: string;
  jogadorId?: string; // ID do usuário Jogador
  email?: string; // Email do convidado (caso não tenha conta ainda ou queira buscar por email)
  status: 'pendente' | 'aceito' | 'recusado';
  timestamp: number;
}

export enum NegotiationType {
  PURCHASE = 'PURCHASE',
  LOAN = 'LOAN',
  CLAUSE = 'CLAUSE'
}

export enum NegotiationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  FINISHED = 'FINISHED'
}

export interface PlayerCard {
  id: string;
  name: string;
  position: string;
  photoUrl?: string;
  nacionalidade: string;
  liga?: string;
  overall: number;
  isFictitious: boolean;
}

export interface GamePlan {
  tournamentId: string;
  teamId: string;
  formation: string;
  starters: { playerId: string, position: string }[];
  bench: string[];
  roles: {
    captain?: string;
    freeKick?: string;
    penalty?: string;
    corner?: string;
  };
}

export interface MarketPlayer {
  id: string;
  organizadorId: string;
  ligaId?: string; // ID da liga vinculada
  name: string;
  position: string;
  photoUrl?: string;
  nacionalidade: string;
  ligaReal?: string;
  overall: number;
  valorTransferencia: number;
  valorEmprestimo?: number;
  clausulaMulta?: number;
  status: 'DISPONIVEL' | 'NEGOCIANDO' | 'EMPRESTADO' | 'LIVRE';
  tournamentId: string;
  isFictitious: boolean;
  timeAtual: string; // "Livre no mercado" se livre
}

export interface Negotiation {
  id: string;
  organizadorId: string;
  tournamentId: string;
  senderManagerId: string;
  recipientManagerId: string;
  playerId: string;
  valorProposta: number;
  tipo: NegotiationType;
  status: NegotiationStatus;
  timestamp: number;
  duracaoEmprestimo?: number;
}

export interface MarketSettings {
  tournamentId: string;
  status: MarketStatus;
  dataInicioMercado?: number;
  dataFimMercado?: number;
  dataInicioContratacoes?: number;
  dataFimContratacoes?: number;
  dataInicioEmprestimos?: number;
  dataFimEmprestimos?: number;
  diaMulta?: number;
}
export interface Proposal {
  id: string; // Changed to string for consistency
  organizadorId: string;
  jogadorId: string;
  origemId: string; // ID do usuário que enviou (Manager)
  destinoId: string; // ID do usuário que recebe (Manager ou Jogador)
  valor: number;
  status: 'pendente' | 'aceita' | 'recusada';
  ligaId?: string; // ID da liga onde a proposta foi feita
}
// --- FIM NOVOS TIPOS ---

export interface User {
  id: string;
  organizadorId?: string; // Tenant association for non-organizers
  ligaId?: string; // ID da liga à qual o usuário pertence
  name: string;
  username: string;
  email?: string;
  emailVerified?: boolean; // Tracking verification
  password?: string;
  role: UserRole;
  status?: UserStatus;
  plan?: PlanType;
  planStatus?: PlanStatus;
  planExpiresAt?: number;
  whatsapp?: string;
  organization?: {
    nome: string;
    logo: string;
    corPrimaria: string;
  };
  verified?: boolean;
  experiencePreference?: ExperienceType;
  createdAt?: string;
}

export interface SocialLink {
  id: string;
  platform: 'INSTAGRAM' | 'FACEBOOK' | 'TWITTER' | 'YOUTUBE' | 'DISCORD' | 'WEBSITE' | 'WHATSAPP' | 'TIKTOK' | 'TWITCH' | 'KICK' | 'CUSTOM';
  name?: string; // Custom name for the social network
  url: string;
  customIconUrl?: string; // URL or Base64 of the logo
  label?: string;
  position?: { x: number, y: number }; // x,y percentages for free positioning
}

export interface PlanUpgradeRequest {
  id: string;
  userId: string;
  requestedPlan: PlanType;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  timestamp: number;
}

export interface AuthSession {
  token: string;
  userId: string;
  expiresAt: number;
}

export interface LoginLayoutConfig {
    mode: 'STANDARD' | 'CUSTOM';
    brandingPos: { x: number, y: number };
    formPos: { x: number, y: number };
    plansPos: { x: number, y: number, scale?: number };
    socialPos: { x: number, y: number, visible: boolean }; // Container position for project socials
}

export interface PlayerCustomization {
    bgColor: string;
    textColor: string;
    borderColor: string;
    borderRadius: string;
    shape: 'circle' | 'square' | 'rounded';
    borderEnabled: boolean;
    borderWidth: number;
    fontFamily: string;
    fontSize: number;
    fontWeight: 'normal' | 'bold';
    nameTagStyle: 'simple' | 'none' | 'box' | 'badge' | 'minimal';
    layout: 'nameBelow' | 'nameAbove' | 'nameCenter';
}

export interface AppSettings {
    adminWhatsapp: string;
    supportButtonText?: string;
    loginLogoUrl?: string;
    loginBannerLogoUrl?: string;
    loginBackgroundUrl?: string;
    loginBackgroundSize?: 'cover' | 'contain' | '100% 100%';
    socialLinks: SocialLink[];
    defaultTournamentDurationDays: number;
    /** @deprecated — usar globalTheme */
    theme?: AppTheme;
    loginLayout: LoginLayoutConfig;
    brandingTextPrimary?: string;
    brandingTextSecondary?: string;
    brandingSlogan?: string;
    bracketStyle?: 'CHAMPIONS' | 'CLASSIC';
    enableExternalCarousel: boolean;
    /** @deprecated — tema fixo PRO WORLD, use globalTheme */
    enableThemedBackground?: boolean;
    playerCustomization: PlayerCustomization;
    globalFontSize?: number;
    /** Tema de cores ativo da plataforma */
    globalTheme?: {
        corPrimaria: string;
        /** @deprecated — use background */
        corSecundaria?: string;
        background: string;
        superficie?: string;
        texto: string;
    };
    globalImages?: {
        homeBg: string;
        loginBg: string;
        logo: string;
        favicon?: string;
    };
}

export interface PlanConfig {
  type: PlanType;
  name: string;
  price: string;
  maxGroups: number;
  maxTeams: number;
  canExport: boolean;
  customization: boolean;
}

export interface Advertisement {
  id: string;
  organizadorId: string;
  ligaId?: string; // ID da liga vinculada
  title: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
}

export interface NewsItem {
    id: string;
    organizadorId: string;
    ligaId?: string; // ID da liga vinculada
    title: string;
    content: string;
    type: 'INFO' | 'PROMO' | 'ALERT';
    date: number;
    imageUrl?: string;
}

export interface TrophyItem {
    id: string;
    title: string;
    imageUrl: string;
    type: 'TROPHY' | 'MEDAL' | 'BANNER' | 'AWARD' | 'GOLDEN_GLOVE' | 'PITBULL' | 'ORCHESTRATOR' | 'TOP_SCORER' | 'MVP_AWARD';
    date: number;
}

export interface TransferHistory {
  id: string; // Changed from number to string
  organizadorId: string;
  jogadorId: string;
  timeOrigemId: string | null;
  timeDestinoId: string;
  valor: number;
  data: string;
}

export interface TeamTactics {
    formation: string;
    style?: string;
    lineup?: Record<string, string>;
    positions?: { id: string, label: string, x: number, y: number }[];
    visuals?: {
        slotBorderColor?: string;
        slotShadowColor?: string;
        slotShape?: 'CIRCLE' | 'SQUARE' | 'HEX';
        labelLogoSize?: number;
        labelLogoOpacity?: number;
        playerPhotoSize?: number;
        nameFontSize?: number;
        fieldWatermarkSize?: number;
        fieldWatermarkOpacity?: number;
        [key: string]: any;
    };
}

export interface ClubPlayer {
    id: string;
    name: string;
    position: string;
    photoUrl?: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'INJURED';
    matches: number;
    goals: number;
    assists: number;
    averageRating: number;
    isCaptain?: boolean;
    isViceCaptain?: boolean;
    // NEW FIELDS FOR ROSTER MANAGEMENT
    kitNumber?: number;
    isStar?: boolean; // Star Player
    badges?: string[]; // Custom tags like "Paredão", "Artilheiro"
    tipo: 'sistema' | 'manual';
    userId?: string;
}

export interface Notice {
    id: string;
    text: string;
    date: number;
}

export interface HistoryItem {
    id: string;
    organizadorId: string;
    event: string;
    date: number;
}

export interface ClubData {
    foundingYear: string;
    primaryColor: string;
    secondaryColor: string;
    roster: ClubPlayer[];
    notices: Notice[];
    history: HistoryItem[];
    tactics?: TeamTactics;
}

export interface PlayerProfile {
  userId: string;
  nickname: string;
  platforms: string[];
  positions: string[];
  mode: 'VIRTUAL' | 'REAL' | 'BOTH';
  teamName?: string;
  teamLogoUrl?: string;
  teamId?: string;
  trophies: TrophyItem[];
  clubData?: ClubData;
  photoUrl?: string;
  ligaId?: string; // ID da liga à qual o jogador pertence
}

export interface ContractInvitation {
    id: string;
    organizadorId: string;
    senderUserId: string;
    senderTeamName: string;
    senderTeamLogo: string;
    recipientUserId: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    timestamp: number;
}

export interface TournamentRegistration {
    id: string;
    organizadorId: string;
    tournamentId: string;
    teamOwnerId: string;
    teamName: string;
    teamLogoUrl?: string;
    teamId?: string;
    userId?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    timestamp: number;
    roster?: ClubPlayer[];
}

export interface Group {
    id: string;
    name: string;
}

export interface TournamentAwards {
    mvpId?: string;
    bestStrikerId?: string;
    bestMidfielderId?: string;
    bestDefenderId?: string;
    goldenGloveId?: string;
    bestAssistantId?: string;
    revelationId?: string;
}

export interface QualificationRule {
  id: string;
  startPosition: number;
  endPosition: number;
  destinationTournamentId: string;
  description: string;
}

export interface Tournament {
  id: string;
  organizadorId: string;
  name: string;
  sport: SportType;
  format: TournamentFormat;
  experienceType: ExperienceType;
  tournamentType?: 'X1' | 'X11';
  /** @deprecated — usar primaryColor */
  theme?: AppTheme;
  /** Cor de destaque deste campeonato (sobrescreve a cor global) */
  primaryColor?: string;
  swissRounds?: number;
  currentRound?: number;
  bannerUrl?: string;
  bannerSize?: 'cover' | 'contain' | '100% 100%';

  // Phase Specific Visuals
  groupStageBackground?: string;
  knockoutBackground?: string;
  knockoutOpacity?: number;
  trophyIconUrl?: string;

  status: 'DRAFT' | 'ACTIVE' | 'FINISHED';
  isOfficial?: boolean;
  groups: Group[];
  awards?: TournamentAwards;
  playoffQualifiedCount?: number;
  createdAt?: number;
  expiresAt?: number;
  isPaid?: boolean;
  
  // Marketing / Social
  socialLinks?: SocialLink[];

  // Advanced Rules (Legacy)
  doubleRoundRobin?: boolean;
  hasBestThird?: boolean;
  finalFormat?: FinalFormat;

  // NOVOS CAMPOS DE CONFIGURAÇÃO (CONFIG_CAMPEONATO)
  classificados_por_grupo?: number;
  melhor_terceiro?: boolean; // Sobrescreve/complementa hasBestThird
  fase_grupo?: 'Ida' | 'Ida e Volta';
  eye_mata?: 'Somente ida' | 'Ida e volta';
  end_type?: 'Jogo único' | 'Ida e Volta';
  gol_fora?: boolean;

  // REGISTRATION & PAYMENT
  entryFee?: string; // Value like "50.00" or empty/0 for Free
  paymentInfo?: string; // PIX Key or Instructions
  ligaId?: string; // ID da liga vinculada
  qualificationRules?: QualificationRule[];

  // ADVANCED MANUAL CONFIGURATION
  manualPhases?: TournamentPhase[];
  pointsPerWin?: number;
  pointsPerDraw?: number;
  pointsPerLoss?: number;
  hasExtraTime?: boolean;
  hasPenalties?: boolean;
  awayGoalRule?: boolean;
  tieBreakCriteria?: string[];
  rulesText?: string;
  advancedMode?: boolean;
}

export interface TournamentPhase {
  id: string;
  name: string;
  type: 'GROUPS' | 'KNOCKOUT' | 'SWISS';
  isDoubleLeg?: boolean;
  qualifiersCount?: number;
  groupCount?: number;
  teamsPerGroup?: number;
}

export interface Team {
    id: string;
    organizadorId: string;
    name: string;
    logoUrl?: string;
    tournamentId: string;
    groupId: string;
    ownerId?: string;
    managerId?: string; // Add managerId alias
    roster?: ClubPlayer[]; // Added roster field
    ligaId?: string; // ID da liga vinculada
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
}

export interface MatchEvent {
    type: 'GOAL' | 'ASSIST' | 'MVP' | 'RATING' | 'PARTICIPATION';
    playerId: string;
    value?: number;
    timestamp?: number;
}

export interface Match {
    id: string;
    organizadorId: string;
    tournamentId: string;
    ligaId?: string; // ID da liga vinculada
    groupId: string;
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number | null;
    awayScore: number | null;
    round: number;
    isFinished: boolean;
    events: MatchEvent[];
    mvpPlayerId?: string;
    screenshotUrl?: string;
    isGoldenGoal?: boolean;
    isDecidedByPenalties?: boolean;
    homePenaltyScore?: number | null;
    awayPenaltyScore?: number | null;
    stage?: string;
}

export interface Player {
    id: string;
    organizadorId: string;
    name: string;
    position: string; 
    teamId: string;
    goals: number;
    assists: number;
    mvps: number;
    playedMatches: number;
    totalRating: number;
    rating?: number; // This will be the average
    photoUrl?: string;
    linkedProfileId?: string;
    ligaId?: string;
}

export interface ChangeLogEntry {
    id: string;
    organizadorId: string;
    timestamp: number;
    module: string; // 'Partidas', 'Times', 'Sistema', etc.
    description: string;
    isRequested: boolean; // True = Ação do usuário, False = Automático/Sistema
    status: 'PENDING' | 'ACCEPTED' | 'REVERT_NEEDED';
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  playerProfiles: PlayerProfile[];
  contractInvitations: ContractInvitation[];
  tournaments: Tournament[];
  registrations: TournamentRegistration[];
  teams: Team[];
  matches: Match[];
  players: Player[];
  ads: Advertisement[];
  news: NewsItem[];
  planConfigs: Record<PlanType, PlanConfig>;
  settings: AppSettings;
  systemLogs: ChangeLogEntry[]; // New Log Array
  negotiations: Negotiation[];
  marketSettings: MarketSettings[];
  marketPlayers: MarketPlayer[];
  adminPlayerBank: MarketPlayer[];
  gamePlans: GamePlan[];
  propostas: Proposal[];
  historicoTransferencias: TransferHistory[];
  marketStatuses: Record<string, 'aberto' | 'fechado'>;
  leagues: League[];
  leagueInvitations: LeagueInvitation[];
  leagueMembers: LeagueMember[];
  planUpgradeRequests: PlanUpgradeRequest[];
}
