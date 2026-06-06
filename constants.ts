import { MarketPlayer, AppTheme, PlanType, PlanConfig } from './types';

export const BASE_PLAYERS_X1: MarketPlayer[] = [
  { id: 'b1', organizadorId: 'system', name: 'Jogador Fictício 1', position: 'ATA', nacionalidade: 'Brasil', timeAtual: 'Livre no mercado', valorTransferencia: 50000, status: 'LIVRE', tournamentId: '', overall: 75, isFictitious: true },
  { id: 'b2', organizadorId: 'system', name: 'Jogador Fictício 2', position: 'ZAG', nacionalidade: 'Argentina', timeAtual: 'Livre no mercado', valorTransferencia: 40000, status: 'LIVRE', tournamentId: '', overall: 72, isFictitious: true },
  { id: 'b3', organizadorId: 'system', name: 'Jogador Fictício 3', position: 'MEI', nacionalidade: 'França', timeAtual: 'Livre no mercado', valorTransferencia: 60000, status: 'LIVRE', tournamentId: '', overall: 78, isFictitious: true },
];

export const THEME_CONFIGS: Record<AppTheme, { primary: string, bg: string, surface: string, surfaceHighlight: string, border: string, name: string, textMain: string, textMuted: string }> = {
  [AppTheme.THEME_CHAMPIONS]: { primary: '#3b82f6', bg: '#1e293b', surface: '#334155', surfaceHighlight: '#475569', border: '#475569', name: 'Champions', textMain: '#ffffff', textMuted: '#cbd5e1' },
  [AppTheme.THEME_EUROPA]: { primary: '#a855f7', bg: '#312e81', surface: '#4338ca', surfaceHighlight: '#6366f1', border: '#6366f1', name: 'Europa', textMain: '#ffffff', textMuted: '#e0e7ff' },
  [AppTheme.THEME_PREMIER]: { primary: '#e879f9', bg: '#1f2937', surface: '#374151', surfaceHighlight: '#4b5563', border: '#4b5563', name: 'Premier', textMain: '#ffffff', textMuted: '#d1d5db' },
  [AppTheme.THEME_LALIGA]: { primary: '#ef4444', bg: '#7f1d1d', surface: '#991b1b', surfaceHighlight: '#b91c1c', border: '#b91c1c', name: 'La Liga', textMain: '#ffffff', textMuted: '#fecaca' },
  [AppTheme.THEME_SERIE_A]: { primary: '#3b82f6', bg: '#065f46', surface: '#059669', surfaceHighlight: '#10b981', border: '#10b981', name: 'Serie A', textMain: '#ffffff', textMuted: '#d1fae5' },
  [AppTheme.THEME_BUNDESLIGA]: { primary: '#ef4444', bg: '#27272a', surface: '#3f3f46', surfaceHighlight: '#52525b', border: '#52525b', name: 'Bundesliga', textMain: '#ffffff', textMuted: '#d4d4d8' },
  [AppTheme.THEME_LIGUE_1]: { primary: '#3b82f6', bg: '#312e81', surface: '#4338ca', surfaceHighlight: '#6366f1', border: '#6366f1', name: 'Ligue 1', textMain: '#ffffff', textMuted: '#e0e7ff' },
  [AppTheme.THEME_PRIMEIRA_LIGA]: { primary: '#22c55e', bg: '#991b1b', surface: '#b91c1c', surfaceHighlight: '#ef4444', border: '#ef4444', name: 'Primeira Liga', textMain: '#ffffff', textMuted: '#fecaca' },
  [AppTheme.THEME_BRASILEIRAO]: { primary: '#eab308', bg: '#166534', surface: '#15803d', surfaceHighlight: '#16a34a', border: '#16a34a', name: 'Brasileirão', textMain: '#ffffff', textMuted: '#dcfce7' },
  [AppTheme.THEME_MUNDIAL]: { primary: '#60a5fa', bg: '#1e3a8a', surface: '#2563eb', surfaceHighlight: '#3b82f6', border: '#3b82f6', name: 'Mundial', textMain: '#ffffff', textMuted: '#dbeafe' },
  [AppTheme.THEME_LIBERTADORES]: { primary: '#ef4444', bg: '#7f1d1d', surface: '#991b1b', surfaceHighlight: '#b91c1c', border: '#b91c1c', name: 'Libertadores', textMain: '#ffffff', textMuted: '#fecaca' },
  [AppTheme.THEME_ASIA_CHAMPIONS]: { primary: '#60a5fa', bg: '#1e3a8a', surface: '#2563eb', surfaceHighlight: '#3b82f6', border: '#3b82f6', name: 'Asia Champions', textMain: '#ffffff', textMuted: '#dbeafe' },
  [AppTheme.THEME_COPA_DEL_REY]: { primary: '#ef4444', bg: '#7f1d1d', surface: '#991b1b', surfaceHighlight: '#b91c1c', border: '#b91c1c', name: 'Copa del Rey', textMain: '#ffffff', textMuted: '#fecaca' },
  [AppTheme.THEME_FA_CUP]: { primary: '#ef4444', bg: '#e5e7eb', surface: '#d1d5db', surfaceHighlight: '#9ca3af', border: '#9ca3af', name: 'FA Cup', textMain: '#000000', textMuted: '#4b5563' },
  [AppTheme.THEME_COPA_BRASIL]: { primary: '#22c55e', bg: '#1e40af', surface: '#1e3a8a', surfaceHighlight: '#1e3a8a', border: '#1e3a8a', name: 'Copa Brasil', textMain: '#ffffff', textMuted: '#dbeafe' },
};

export const THEME_BACKGROUNDS: Record<AppTheme, string> = {
  [AppTheme.THEME_CHAMPIONS]: 'bg-gradient-to-br from-blue-900 to-slate-900',
  [AppTheme.THEME_EUROPA]: 'bg-gradient-to-br from-purple-900 to-indigo-900',
  [AppTheme.THEME_PREMIER]: 'bg-gradient-to-br from-fuchsia-900 to-gray-900',
  [AppTheme.THEME_LALIGA]: 'bg-gradient-to-br from-red-900 to-red-950',
  [AppTheme.THEME_SERIE_A]: 'bg-gradient-to-br from-blue-900 to-emerald-900',
  [AppTheme.THEME_BUNDESLIGA]: 'bg-gradient-to-br from-red-900 to-zinc-900',
  [AppTheme.THEME_LIGUE_1]: 'bg-gradient-to-br from-blue-900 to-indigo-900',
  [AppTheme.THEME_PRIMEIRA_LIGA]: 'bg-gradient-to-br from-green-900 to-red-900',
  [AppTheme.THEME_BRASILEIRAO]: 'bg-gradient-to-br from-green-800 to-yellow-700',
  [AppTheme.THEME_MUNDIAL]: 'bg-gradient-to-br from-blue-800 to-blue-950',
  [AppTheme.THEME_LIBERTADORES]: 'bg-gradient-to-br from-red-800 to-red-950',
  [AppTheme.THEME_ASIA_CHAMPIONS]: 'bg-gradient-to-br from-blue-700 to-blue-900',
  [AppTheme.THEME_COPA_DEL_REY]: 'bg-gradient-to-br from-red-800 to-red-950',
  [AppTheme.THEME_FA_CUP]: 'bg-gradient-to-br from-white to-gray-200',
  [AppTheme.THEME_COPA_BRASIL]: 'bg-gradient-to-br from-green-700 to-blue-800',
};

export const POSITIONS = ['GL', 'GK', 'ZG', 'ZAG', 'ZGD', 'ZGC', 'ZGE', 'LD', 'LE', 'VOL', 'MCD', 'MCE', 'VLD', 'VLE', 'MC', 'MLG', 'MAT', 'MEI', 'MLD', 'MLE', 'MD', 'ME', 'PD', 'PE', 'PTD', 'PTE', 'ST', 'SA', 'CA', 'ATA', 'ATA-D', 'ATA-E'];
export const POSITIONS_ALL = ['GL', 'GK', 'ZG', 'ZAG', 'ZGD', 'ZGC', 'ZGE', 'LD', 'LE', 'VOL', 'MCD', 'MCE', 'VLD', 'VLE', 'MC', 'MLG', 'MAT', 'MEI', 'MLD', 'MLE', 'MD', 'ME', 'PD', 'PE', 'PTD', 'PTE', 'ST', 'SA', 'CA', 'ATA', 'ATA-D', 'ATA-E'];
export const POSITIONS_VIRTUAL = ['GL', 'GK', 'ZG', 'ZAG', 'ZGD', 'ZGC', 'ZGE', 'LD', 'LE', 'VOL', 'MCD', 'MCE', 'VLD', 'VLE', 'MC', 'MLG', 'MAT', 'MEI', 'MLD', 'MLE', 'MD', 'ME', 'PD', 'PE', 'PTD', 'PTE', 'ST', 'SA', 'CA', 'ATA', 'ATA-D', 'ATA-E'];
export const POSITIONS_REAL = ['GL', 'GK', 'ZG', 'ZAG', 'ZGD', 'ZGC', 'ZGE', 'LD', 'LE', 'VOL', 'MCD', 'MCE', 'VLD', 'VLE', 'MC', 'MLG', 'MAT', 'MEI', 'MLD', 'MLE', 'MD', 'ME', 'PD', 'PE', 'PTD', 'PTE', 'ST', 'SA', 'CA', 'ATA', 'ATA-D', 'ATA-E'];

// Credenciais admin lidas via variável de ambiente (nunca expor no código)
export const ADMIN_CREDENTIALS = {
  username: import.meta.env?.VITE_ADMIN_USER || 'admin',
  password: import.meta.env?.VITE_ADMIN_PASS || ''
};

export const PLAN_LIMITS: Record<PlanType, PlanConfig> = {
  [PlanType.FREE]: { type: PlanType.FREE, name: 'Free', price: '0', maxGroups: 1, maxTeams: 8, canExport: false, customization: false },
  [PlanType.BASIC]: { type: PlanType.BASIC, name: 'Basic', price: '30', maxGroups: 2, maxTeams: 16, canExport: false, customization: false },
  [PlanType.PRO]: { type: PlanType.PRO, name: 'Pro', price: '50', maxGroups: 4, maxTeams: 32, canExport: true, customization: true },
  [PlanType.ELITE]: { type: PlanType.ELITE, name: 'Elite', price: '100', maxGroups: 10, maxTeams: 128, canExport: true, customization: true },
};

export const AWARD_LABELS = {
  mvpId: 'MVP',
  bestStrikerId: 'Melhor Atacante',
  bestMidfielderId: 'Melhor Meia',
  bestDefenderId: 'Melhor Defensor',
  goldenGloveId: 'Luva de Ouro',
};

export const MARKET_KEY = "mercadoStatus";
