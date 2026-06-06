import React, { useState, useMemo, useEffect, useRef } from 'react';
import { toast } from '../src/lib/toast';
import { motion, AnimatePresence } from 'motion/react';
import { User, PlayerProfile, Player, TrophyItem, UserRole, ClubPlayer, ClubData, Tournament, TournamentRegistration, Team, ContractInvitation, AppSettings, PlayerCustomization, Proposal, LeagueInvitation, League } from '../types';
import { Shield, Trophy, Award, Upload, Trash2, Plus, Calendar, Edit, Save, Check, Camera, Lock, Download, PenTool, X, Users, Briefcase, Target, ListPlus, Crown, RefreshCw, ChevronRight, ChevronLeft, Menu, LayoutDashboard, User as UserIcon, Star, BarChart, Clock, Filter, Info, Zap, Smartphone, Gamepad2, Globe, Brain, ArrowUp, ArrowDown, Image as ImageIcon, Palette, Eye, ChevronUp, ChevronDown, Send, Search } from '../components/Icons';
import { uploadFile } from '../services/supabase';
import { POSITIONS_ALL, POSITIONS_VIRTUAL, POSITIONS_REAL } from '../constants';
import { validatePasswordStrength } from '../services/authService';
import UltimateCard from '../components/UltimateCard';

interface PlayerDashboardProps {
  user: User;
  profile: PlayerProfile;
  settings: AppSettings;
  allProfiles: PlayerProfile[];
  playersData: Player[];
  onUpdateProfile: (updates: Partial<PlayerProfile>) => void;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onUpdatePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; msg: string }>;
  themeColor: string;
  invitations: ContractInvitation[];
  onRespondInvite: (inviteId: string, accept: boolean) => void;
  leagueInvitations: LeagueInvitation[];
  onRespondLeagueInvitation: (invitationId: string, status: 'aceito' | 'recusado') => void;
  allLeagues: League[];
  propostas: Proposal[];
  onResponderProposta: (id: string, acao: 'aceitar' | 'recusar') => void;
  teamData?: ClubData;
  allTournaments: Tournament[];
  allTeams: Team[];
  registrations: TournamentRegistration[];
  onRequestRegistration: (tournament: Tournament) => void;
  onKickPlayer?: (playerId: string) => void;
  onViewTournament?: (id: string) => void;
  onTransferirManual?: (manualPlayerId: string, fromTeamId: string | null, toTeamId: string) => void;
  showMarket?: boolean;
}

// DEFINIÇÃO DE FORMAÇÕES POR MODO
const TACTICAL_MODES: Record<string, Record<string, { id: string, name: string, positions: { id: string, label: string, x: number, y: number }[] }>> = {
    'EA_FC': {
        '4-4-2': { id: '4-4-2', name: '4-4-2 Clássico', positions: [{ id: 'GK', label: 'GK', x: 50, y: 90 }, { id: 'LB', label: 'VLE', x: 15, y: 70 }, { id: 'CB1', label: 'ZGD', x: 35, y: 74 }, { id: 'CB2', label: 'ZGE', x: 65, y: 74 }, { id: 'RB', label: 'VLD', x: 85, y: 70 }, { id: 'LM', label: 'ME', x: 15, y: 45 }, { id: 'CM1', label: 'MCD', x: 40, y: 50 }, { id: 'CM2', label: 'MCE', x: 60, y: 50 }, { id: 'RM', label: 'MD', x: 85, y: 45 }, { id: 'ST1', label: 'ST', x: 40, y: 22 }, { id: 'ST2', label: 'ST', x: 60, y: 22 }] },
        '4-3-3': { id: '4-3-3', name: '4-3-3 Ofensivo', positions: [{ id: 'GK', label: 'GK', x: 50, y: 90 }, { id: 'LB', label: 'VLE', x: 15, y: 70 }, { id: 'CB1', label: 'ZGD', x: 35, y: 74 }, { id: 'CB2', label: 'ZGE', x: 65, y: 74 }, { id: 'RB', label: 'VLD', x: 85, y: 70 }, { id: 'CDM', label: 'VOL', x: 50, y: 55 }, { id: 'CM1', label: 'MCD', x: 32, y: 42 }, { id: 'CM2', label: 'MCE', x: 68, y: 42 }, { id: 'LW', label: 'PE', x: 20, y: 24 }, { id: 'ST', label: 'ST', x: 50, y: 18 }, { id: 'RW', label: 'PD', x: 80, y: 24 }] },
        '3-5-2': { id: '3-5-2', name: '3-5-2 Equilibrado', positions: [{ id: 'GK', label: 'GK', x: 50, y: 90 }, { id: 'CB1', label: 'ZGD', x: 25, y: 74 }, { id: 'CB2', label: 'ZGC', x: 50, y: 76 }, { id: 'CB3', label: 'ZGE', x: 75, y: 74 }, { id: 'LM', label: 'ME', x: 12, y: 48 }, { id: 'CDM1', label: 'VOL', x: 38, y: 60 }, { id: 'CDM2', label: 'VOL', x: 62, y: 60 }, { id: 'RM', label: 'MD', x: 88, y: 48 }, { id: 'CAM', label: 'MEI', x: 50, y: 40 }, { id: 'ST1', label: 'ST', x: 40, y: 20 }, { id: 'ST2', label: 'ST', x: 60, y: 20 }] },
        '3-4-3': { id: '3-4-3', name: '3-4-3 Ofensivo', positions: [{ id: 'GK', label: 'GK', x: 50, y: 90 }, { id: 'CB1', label: 'ZGD', x: 25, y: 74 }, { id: 'CB2', label: 'ZGC', x: 50, y: 76 }, { id: 'CB3', label: 'ZGE', x: 75, y: 74 }, { id: 'LM', label: 'ME', x: 15, y: 45 }, { id: 'CM1', label: 'MCD', x: 40, y: 55 }, { id: 'CM2', label: 'MCE', x: 60, y: 55 }, { id: 'RM', label: 'MD', x: 85, y: 45 }, { id: 'LW', label: 'PE', x: 20, y: 25 }, { id: 'ST', label: 'ST', x: 50, y: 20 }, { id: 'RW', label: 'PD', x: 80, y: 25 }] },
        '5-3-2': { id: '5-3-2', name: '5-3-2 Defensivo', positions: [{ id: 'GK', label: 'GK', x: 50, y: 90 }, { id: 'LWB', label: 'VLE', x: 12, y: 62 }, { id: 'CB1', label: 'ZGD', x: 30, y: 74 }, { id: 'CB2', label: 'ZGC', x: 50, y: 76 }, { id: 'CB3', label: 'ZGE', x: 70, y: 74 }, { id: 'RWB', label: 'VLD', x: 88, y: 62 }, { id: 'CM1', label: 'MCD', x: 38, y: 48 }, { id: 'CM2', label: 'MCE', x: 62, y: 48 }, { id: 'CAM', label: 'MEI', x: 50, y: 34 }, { id: 'ST1', label: 'ST', x: 42, y: 18 }, { id: 'ST2', label: 'ST', x: 58, y: 18 }] },
        '4-2-3-1': { id: '4-2-3-1', name: '4-2-3-1 Aberto', positions: [{ id: 'GK', label: 'GK', x: 50, y: 90 }, { id: 'LB', label: 'VLE', x: 15, y: 70 }, { id: 'CB1', label: 'ZGD', x: 35, y: 74 }, { id: 'CB2', label: 'ZGE', x: 65, y: 74 }, { id: 'RB', label: 'VLD', x: 85, y: 70 }, { id: 'CDM1', label: 'VOL', x: 40, y: 58 }, { id: 'CDM2', label: 'VOL', x: 60, y: 58 }, { id: 'LM', label: 'ME', x: 15, y: 35 }, { id: 'CAM', label: 'MEI', x: 50, y: 38 }, { id: 'RM', label: 'MD', x: 85, y: 35 }, { id: 'ST', label: 'ST', x: 50, y: 20 }] }
    },
    'REAL': {
        '4-4-2': { id: '4-4-2', name: '4-4-2 Clássico', positions: [{ id: 'GK', label: 'GOL', x: 50, y: 90 }, { id: 'LB', label: 'LE', x: 15, y: 70 }, { id: 'CB1', label: 'ZAG', x: 35, y: 74 }, { id: 'CB2', label: 'ZAG', x: 65, y: 74 }, { id: 'RB', label: 'LD', x: 85, y: 70 }, { id: 'LM', label: 'ME', x: 15, y: 45 }, { id: 'CM1', label: 'MC', x: 40, y: 50 }, { id: 'CM2', label: 'MC', x: 60, y: 50 }, { id: 'RM', label: 'MD', x: 85, y: 45 }, { id: 'ST1', label: 'CA', x: 40, y: 22 }, { id: 'ST2', label: 'CA', x: 60, y: 22 }] },
        '4-3-3': { id: '4-3-3', name: '4-3-3 Padrão', positions: [{ id: 'GK', label: 'GOL', x: 50, y: 90 }, { id: 'LB', label: 'LE', x: 15, y: 70 }, { id: 'CB1', label: 'ZAG', x: 35, y: 74 }, { id: 'CB2', label: 'ZAG', x: 65, y: 74 }, { id: 'RB', label: 'LD', x: 85, y: 70 }, { id: 'CDM', label: 'VOL', x: 50, y: 55 }, { id: 'CM1', label: 'MC', x: 32, y: 42 }, { id: 'CM2', label: 'MC', x: 68, y: 42 }, { id: 'LW', label: 'PTE', x: 20, y: 24 }, { id: 'ST', label: 'CA', x: 50, y: 18 }, { id: 'RW', label: 'PTD', x: 80, y: 24 }] },
        '4-2-3-1': { id: '4-2-3-1', name: '4-2-3-1 Moderna', positions: [{ id: 'GK', label: 'GOL', x: 50, y: 90 }, { id: 'LB', label: 'LE', x: 15, y: 70 }, { id: 'CB1', label: 'ZAG', x: 35, y: 74 }, { id: 'CB2', label: 'ZAG', x: 65, y: 74 }, { id: 'RB', label: 'LD', x: 85, y: 70 }, { id: 'CDM1', label: 'VOL', x: 40, y: 58 }, { id: 'CDM2', label: 'VOL', x: 60, y: 58 }, { id: 'LM', label: 'MD', x: 15, y: 35 }, { id: 'CAM', label: 'MAT', x: 50, y: 38 }, { id: 'RM', label: 'ME', x: 85, y: 35 }, { id: 'ST', label: 'CA', x: 50, y: 20 }] },
        '3-5-2': { id: '3-5-2', name: '3-5-2 Equilibrada', positions: [{ id: 'GK', label: 'GOL', x: 50, y: 90 }, { id: 'CB1', label: 'ZAG', x: 25, y: 74 }, { id: 'CB2', label: 'ZAG', x: 50, y: 76 }, { id: 'CB3', label: 'ZAG', x: 75, y: 74 }, { id: 'LM', label: 'LE', x: 12, y: 48 }, { id: 'CDM1', label: 'VOL', x: 38, y: 60 }, { id: 'CDM2', label: 'VOL', x: 62, y: 60 }, { id: 'RM', label: 'LD', x: 88, y: 48 }, { id: 'CAM', label: 'MAT', x: 50, y: 40 }, { id: 'ST1', label: 'CA', x: 40, y: 20 }, { id: 'ST2', label: 'CA', x: 60, y: 20 }] }
    }
};

const FIELD_THEMES: Record<string, { name: string, gradient: string, stripeColor: string, lineColor: string }> = {
    'CLASSIC': { name: 'Grama Clássica', gradient: 'linear-gradient(to bottom, #11421e, #166534)', stripeColor: 'rgba(0,0,0,0.4)', lineColor: 'rgba(255,255,255,0.4)' },
    'NIGHT': { name: 'Estádio Noturno', gradient: 'linear-gradient(to bottom, #064e3b, #022c22)', stripeColor: 'rgba(0,0,0,0.5)', lineColor: 'rgba(110,231,183,0.3)' },
    'CHAMPIONS': { name: 'Champions Elite', gradient: 'linear-gradient(to bottom, #1e3a8a, #172554)', stripeColor: 'rgba(255,255,255,0.05)', lineColor: 'rgba(56,189,248,0.5)' },
    'WINTER': { name: 'Geada de Inverno', gradient: 'linear-gradient(to bottom, #334155, #1e293b)', stripeColor: 'rgba(255,255,255,0.1)', lineColor: 'rgba(255,255,255,0.6)' },
    'DESERT': { name: 'Arena do Deserto', gradient: 'linear-gradient(to bottom, #78350f, #451a03)', stripeColor: 'rgba(0,0,0,0.3)', lineColor: 'rgba(251,191,36,0.4)' },
    'NEON': { name: 'Pro Arena Neon', gradient: 'linear-gradient(to bottom, #000000, #0f172a)', stripeColor: 'rgba(124,58,237,0.1)', lineColor: 'rgba(124,58,237,0.5)' },
    'VOLCANO': { name: 'Cúpula de Magma', gradient: 'linear-gradient(to bottom, #450a0a, #000000)', stripeColor: 'rgba(239,68,68,0.15)', lineColor: 'rgba(248,113,113,0.6)' },
    'FUTSAL': { name: 'Piso de Taco Pro', gradient: 'linear-gradient(to bottom, #92400e, #451a03)', stripeColor: 'rgba(0,0,0,0.25)', lineColor: 'rgba(255,255,255,0.7)' },
    'URBAN': { name: 'Concreto Urbano', gradient: 'linear-gradient(to bottom, #334155, #0f172a)', stripeColor: 'rgba(255,255,255,0.05)', lineColor: 'rgba(251,191,36,0.6)' },
    'GALAXY': { name: 'Nebulosa Cósmica', gradient: 'linear-gradient(to bottom, #2e1065, #020617)', stripeColor: 'rgba(255,255,255,0.08)', lineColor: 'rgba(192,132,252,0.5)' },
    'RETRO': { name: 'Arcade 8-Bit', gradient: 'linear-gradient(to bottom, #065f46, #064e3b)', stripeColor: 'rgba(0,0,0,0.4)', lineColor: '#22c55e' },
    'AURORA': { name: 'Aurora Boreal', gradient: 'linear-gradient(to bottom, #134e4a, #020617)', stripeColor: 'rgba(45,212,191,0.1)', lineColor: 'rgba(45,212,191,0.5)' },
    'BRAZIL': { name: 'Brasil - Canarinho', gradient: 'linear-gradient(to bottom, #15803d, #eab308)', stripeColor: 'rgba(30,58,138,0.15)', lineColor: 'rgba(255,255,255,0.8)' },
    'FRANCE': { name: 'França - Les Bleus', gradient: 'linear-gradient(to bottom, #1e3a8a, #dc2626)', stripeColor: 'rgba(255,255,255,0.1)', lineColor: '#ffffff' },
    'NIGERIA': { name: 'Nigéria - Super Eagles', gradient: 'linear-gradient(to bottom, #065f46, #22c55e)', stripeColor: 'rgba(255,255,255,0.05)', lineColor: '#ffffff' },
    'JAPAN': { name: 'Japão - Samurai Blue', gradient: 'linear-gradient(to bottom, #1e40af, #0f172a)', stripeColor: 'rgba(255,255,255,0.05)', lineColor: 'rgba(255,255,255,0.9)' },
    'MEXICO': { name: 'México - Azteca', gradient: 'linear-gradient(to bottom, #166534, #991b1b)', stripeColor: 'rgba(255,255,255,0.05)', lineColor: '#ffffff' },
    'AUSTRALIA': { name: 'Austrália - Socceroos', gradient: 'linear-gradient(to bottom, #fbbf24, #166534)', stripeColor: 'rgba(0,0,0,0.1)', lineColor: '#ffffff' },
    'ARGENTINA': { name: 'Argentina - Albiceleste', gradient: 'linear-gradient(to bottom, #74acdf, #ffffff)', stripeColor: 'rgba(0,0,0,0.1)', lineColor: '#74acdf' },
    'PORTUGAL': { name: 'Portugal - Navegadores', gradient: 'linear-gradient(to bottom, #da291c, #006600)', stripeColor: 'rgba(255,255,255,0.1)', lineColor: '#ffffff' },
    'GERMANY': { name: 'Alemanha - Die Mannschaft', gradient: 'linear-gradient(to bottom, #ffffff, #000000)', stripeColor: 'rgba(255,255,0,0.2)', lineColor: '#000000' },
    'ITALY': { name: 'Itália - Azzurra', gradient: 'linear-gradient(to bottom, #004d99, #ffffff)', stripeColor: 'rgba(0,128,0,0.1)', lineColor: '#ffffff' },
    'SPAIN': { name: 'Espanha - La Roja', gradient: 'linear-gradient(to bottom, #aa151b, #f1bf00)', stripeColor: 'rgba(0,0,0,0.1)', lineColor: '#ffffff' },
    'ENGLAND': { name: 'Inglaterra - Three Lions', gradient: 'linear-gradient(to bottom, #ffffff, #002040)', stripeColor: 'rgba(206,17,38,0.1)', lineColor: '#002040' },
    'MESSI_10': { name: 'The Goat - Messi', gradient: 'linear-gradient(to bottom, #f7a8b8, #74acdf)', stripeColor: 'rgba(255,255,255,0.2)', lineColor: '#ffffff' },
    'CR7_SIUU': { name: 'The Beast - CR7', gradient: 'linear-gradient(to bottom, #111111, #da291c)', stripeColor: 'rgba(212,175,55,0.2)', lineColor: '#d4af37' },
    'NEYMAR_10': { name: 'The Star - Neymar Jr', gradient: 'linear-gradient(to bottom, #ffdf00, #002776)', stripeColor: 'rgba(0,156,59,0.2)', lineColor: '#ffffff' },
    'VINI_JR': { name: 'The Flash - Vini Jr', gradient: 'linear-gradient(to bottom, #ffffff, #3c3c95)', stripeColor: 'rgba(212,175,55,0.15)', lineColor: '#d4af37' },
    'MBAPPE_7': { name: 'The King - Mbappé', gradient: 'linear-gradient(to bottom, #002395, #ffffff)', stripeColor: 'rgba(237,41,57,0.15)', lineColor: '#ffffff' },
    'PEL_REI': { name: 'Rei Pelé - Eterno', gradient: 'linear-gradient(to bottom, #d4af37, #000000)', stripeColor: 'rgba(255,255,255,0.05)', lineColor: '#d4af37' }
};

// PlayerDashboard component
// TODO: Add position editing functionality
// Added position editing functionality
const PlayerEditField = ({ value, onSave, placeholder, className }: { value: string, onSave: (val: string) => void, placeholder?: string, className?: string }) => {
    const [localValue, setLocalValue] = useState(value);
    
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    return (
        <input 
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => onSave(localValue)}
            placeholder={placeholder}
            className={className}
        />
    );
};

const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ 
    user, profile, settings, onUpdateSettings, allProfiles, playersData, 
    onUpdateProfile, onUpdatePassword, themeColor, invitations = [], 
    onRespondInvite, leagueInvitations = [], onRespondLeagueInvitation, 
    allLeagues = [], propostas = [], onResponderProposta, teamData, 
    allTournaments = [], allTeams, registrations = [], 
    onRequestRegistration, onKickPlayer, onViewTournament, onTransferirManual,
    showMarket = true 
}) => {
  
  // Guard clause to prevent rendering with invalid/incomplete data which leads to black screen
  if (!user || !profile) {
      return <div className="flex items-center justify-center h-screen bg-brand-dark text-white font-black uppercase tracking-widest">Painel indisponível. Carregando dados...</div>;
  }

  const isTeamManager = user.role === UserRole.TEAM_MANAGER;
  const [activeTab, setActiveTab] = useState<'overview' | 'profile_edit' | 'roster' | 'tactics' | 'competitions' | 'explore' | 'admin' | 'gallery' | 'security'>('overview');
  
  const [transferringManualPlayer, setTransferringManualPlayer] = useState<ClubPlayer | null>(null);
  const [transferTargetTeamId, setTransferTargetTeamId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [customization, setCustomization] = useState<PlayerCustomization>(settings.playerCustomization || {
      bgColor: '#1A1A1A',
      textColor: '#FFFFFF',
      borderColor: '#FF6A00',
      borderRadius: '9999px',
      shape: 'circle',
      borderEnabled: true,
      borderWidth: 2,
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: 'normal',
      nameTagStyle: 'simple',
      layout: 'nameBelow'
  });
  const handleCustomizationChange = (updates: Partial<PlayerCustomization>) => {
      const newCustomization = { ...customization, ...updates };
      setCustomization(newCustomization);
      onUpdateSettings({ playerCustomization: newCustomization });
  };

  const fieldRef = useRef<HTMLDivElement>(null);
  const [activeSlotPositions, setActiveSlotPositions] = useState<{id: string, label: string, x: number, y: number}[]>([]);
  const [draggingSlotId, setDraggingSlotId] = useState<string | null>(null);

  // ESTADOS DE CONFIGURAÇÃO DE CAMPO
  const [fieldTheme, setFieldTheme] = useState('CLASSIC');
  const [positionMode, setPositionMode] = useState<'EA_FC' | 'REAL'>('EA_FC');
  const [dragSensitivity, setDragSensitivity] = useState(1.0); // Added to fix linter error

  // FORMAÇÕES DISPONÍVEIS COM BASE NO MODO
  const currentFormations = useMemo(() => TACTICAL_MODES[positionMode], [positionMode]);

  // ESTADO PARA OCULTAR CUSTOMIZAÇÃO
  const [showVisualSettings, setShowVisualSettings] = useState(true);

  // ESTADOS DE ESBALAÇÃO AUTOMÁTICA


  // Custom Tactical Visual States
  const [slotBorderColor, setSlotBorderColor] = useState(profile.clubData?.tactics?.visuals?.slotBorderColor || profile.clubData?.primaryColor || '#f97316'); 
  const [slotShadowColor, setSlotShadowColor] = useState(profile.clubData?.tactics?.visuals?.slotShadowColor || profile.clubData?.primaryColor || '#f97316'); 
  const [slotShape, setSlotShape] = useState<'CIRCLE' | 'SQUARE' | 'HEX'>(profile.clubData?.tactics?.visuals?.slotShape || 'CIRCLE');
  
  // ESCALAS E OPACIDADE INDEPENDENTES
  const [labelLogoSize, setLabelLogoSize] = useState(profile.clubData?.tactics?.visuals?.labelLogoSize || 40); 
  const [labelLogoOpacity, setLabelLogoOpacity] = useState(profile.clubData?.tactics?.visuals?.labelLogoOpacity || 100); 
  const [playerPhotoSize, setPlayerPhotoSize] = useState(profile.clubData?.tactics?.visuals?.playerPhotoSize || 80); 
  const [nameFontSize, setNameFontSize] = useState(profile.clubData?.tactics?.visuals?.nameFontSize || 12); 

  // ESTADOS DA MARCA D'ÁGUA (BACKGROUND)
  const [fieldWatermarkSize, setFieldWatermarkSize] = useState(profile.clubData?.tactics?.visuals?.fieldWatermarkSize || 300);
  const [fieldWatermarkOpacity, setFieldWatermarkOpacity] = useState(profile.clubData?.tactics?.visuals?.fieldWatermarkOpacity || 10); 

  // EFEITOS VISUAIS
  const [slotGlowIntensity, setSlotGlowIntensity] = useState(profile.clubData?.tactics?.visuals?.slotGlowIntensity || 15);
  const [slotGlowColor, setSlotGlowColor] = useState(profile.clubData?.tactics?.visuals?.slotGlowColor || profile.clubData?.primaryColor || '#f97316');
  const [slotPulseEnabled, setSlotPulseEnabled] = useState(profile.clubData?.tactics?.visuals?.slotPulseEnabled || false);
  const [slotInnerShadow, setSlotInnerShadow] = useState(profile.clubData?.tactics?.visuals?.slotInnerShadow !== undefined ? profile.clubData?.tactics?.visuals?.slotInnerShadow : true);
  const [slotBorderWidth, setSlotBorderWidth] = useState(profile.clubData?.tactics?.visuals?.slotBorderWidth || 3);

  // Custom Badge Colors
  const [posBgColor, setPosBgColor] = useState(profile.clubData?.tactics?.visuals?.posBgColor || profile.clubData?.primaryColor || '#f97316');
  const [posTextColor, setPosTextColor] = useState(profile.clubData?.tactics?.visuals?.posTextColor || '#ffffff');
  const [nickBgColor, setNickBgColor] = useState(profile.clubData?.tactics?.visuals?.nickBgColor || '#000000');
  const [nickTextColor, setNickTextColor] = useState(profile.clubData?.tactics?.visuals?.nickTextColor || '#ffffff');

  // Photo Adjustment States
  const [adjustingPhoto, setAdjustingPhoto] = useState<string | null>(null);
  const [adjZoom, setAdjZoom] = useState(1.5);
  const [adjX, setAdjX] = useState(0);
  const [adjY, setAdjY] = useState(0);
  const [adjBrightness, setAdjBrightness] = useState(100);
  const [adjContrast, setAdjContrast] = useState(100);
  const [adjSaturation, setAdjSaturation] = useState(100);

  const [targetType, setTargetType] = useState<'PLAYER' | 'MANUAL' | 'TEAM_LOGO'>('PLAYER');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPlayerPositionId, setEditingPlayerPositionId] = useState<string | null>(null);
  const [editPositionValue, setEditPositionValue] = useState('');

  const [editNickname, setEditNickname] = useState(profile.nickname || '');
  const [editPhotoUrl, setEditPhotoUrl] = useState(profile.photoUrl || '');
  const [editPositions, setEditPositions] = useState<string[]>(profile.positions || []);
  const [editPlatforms, setEditPlatforms] = useState<string[]>(profile.platforms || []);
  const [editMode, setEditMode] = useState(profile.mode || 'VIRTUAL');

  const [manualPlayerName, setManualPlayerName] = useState('');
  const [manualPlayerPhoto, setManualPlayerPhoto] = useState('');
  const [manualPlayerPositions, setManualPlayerPositions] = useState<string[]>([]);
  const [bulkPlayersText, setBulkPlayersText] = useState('');
  const [bulkPreviewPlayers, setBulkPreviewPlayers] = useState<{name: string, position: string}[]>([]);

  const [editTeamName, setEditTeamName] = useState(profile.teamName || '');
  const [editTeamLogo, setEditTeamLogo] = useState(profile.teamLogoUrl || '');

  const [tacticFormation, setTacticFormation] = useState(profile.clubData?.tactics?.formation || '4-3-3');
  const [lineup, setLineup] = useState<Record<string, string>>({
    GK: '',
    ZAG1: '',
    ZAG2: '',
    MEI1: '',
    MEI2: '',
    ATA1: '',
    ATA2: ''
  });
  const [selectedPositions, setSelectedPositions] = useState<Record<string, string>>({});
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Load lineup from localStorage on mount
  useEffect(() => {
    const savedLineup = localStorage.getItem("escalacao");
    if (savedLineup) {
      try {
        const parsed = JSON.parse(savedLineup);
        // Only merge if savedLineup is valid
        if (parsed && typeof parsed === 'object') {
            setLineup(prev => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.error("Failed to parse lineup from localStorage", e);
      }
    }
  }, []);

  // Save lineup to localStorage whenever it changes
  useEffect(() => {
    // Only save if lineup has data (prevents saving empty object initially)
    if (Object.keys(lineup).some(key => lineup[key] !== '')) {
        localStorage.setItem("escalacao", JSON.stringify(lineup));
    }
  }, [lineup]);

  // Save lineup to profile whenever it changes
  useEffect(() => {
    if (isTeamManager && profile.clubData && Object.keys(lineup).length > 0) {
      onUpdateProfile({
        clubData: {
          ...profile.clubData,
          tactics: {
            ...profile.clubData.tactics,
            lineup: lineup
          }
        }
      });
    }
  }, [lineup]);

  // Save formation to profile whenever it changes
  useEffect(() => {
    if (isTeamManager && profile.clubData && tacticFormation) {
      onUpdateProfile({
        clubData: {
          ...profile.clubData,
          tactics: {
            ...profile.clubData.tactics,
            formation: tacticFormation
          }
        }
      });
    }
  }, [tacticFormation]);

  // Auto-save visual settings
  useEffect(() => {
    if (isTeamManager && profile.clubData) {
      const visualSettings = {
        slotBorderColor, slotShadowColor, slotShape, labelLogoSize, labelLogoOpacity,
        playerPhotoSize, nameFontSize, fieldWatermarkSize, fieldWatermarkOpacity,
        slotGlowIntensity, slotGlowColor, slotPulseEnabled, slotInnerShadow,
        slotBorderWidth, posBgColor, posTextColor, nickBgColor, nickTextColor,
        fieldTheme
      };
      
      // Prevent infinite loop by checking if different
      const currentVisuals = profile.clubData.tactics?.visuals || {};
      const hasChanged = Object.keys(visualSettings).some(key => (visualSettings as any)[key] !== (currentVisuals as any)[key]);
      
      if (hasChanged) {
        onUpdateProfile({
          clubData: {
            ...profile.clubData,
            tactics: {
              ...profile.clubData.tactics,
              visuals: visualSettings
            }
          }
        });
      }
    }
  }, [
    slotBorderColor, slotShadowColor, slotShape, labelLogoSize, labelLogoOpacity,
    playerPhotoSize, nameFontSize, fieldWatermarkSize, fieldWatermarkOpacity,
    slotGlowIntensity, slotGlowColor, slotPulseEnabled, slotInnerShadow,
    slotBorderWidth, posBgColor, posTextColor, nickBgColor, nickTextColor,
    fieldTheme, isTeamManager, onUpdateProfile
  ]);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // ATUALIZA FORMAÇÃO QUANDO MUDA O MODO OU A TÁTICA ESPECÍFICA
  useEffect(() => {
    const formations = TACTICAL_MODES[positionMode];
    // Tenta encontrar a formação atual ou reseta para 4-3-3 do modo
    const formation = formations ? (formations[tacticFormation] || Object.values(formations)[0]) : null;
    if (formation && formation.positions) {
        setActiveSlotPositions(formation.positions);
    } else {
        // Fallback
        setActiveSlotPositions(TACTICAL_MODES['EA_FC']['4-4-2'].positions);
    }
  }, [tacticFormation, positionMode]);

  const [stats, setStats] = useState({ goals: 0, assists: 0, mvps: 0, matches: 0 });
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  useEffect(() => {
    setIsStatsLoading(true);
    const timer = setTimeout(() => {
      const myRecords = playersData.filter(p => p.linkedProfileId === user.id);
      setStats({
        goals: myRecords.reduce((sum, r) => sum + r.goals, 0),
        assists: myRecords.reduce((sum, r) => sum + r.assists, 0),
        mvps: myRecords.reduce((sum, r) => sum + r.mvps, 0),
        matches: myRecords.length
      });
      setIsStatsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [playersData, user.id]);

  // Comment: Explicitly typing roster as ClubPlayer[] to avoid 'unknown' issues later
  const roster: ClubPlayer[] = useMemo(() => (isTeamManager ? profile.clubData?.roster : teamData?.roster) || [], [isTeamManager, profile.clubData, teamData]);

  const [isRosterLoading, setIsRosterLoading] = useState(true);
  useEffect(() => {
    setIsRosterLoading(true);
    const timer = setTimeout(() => {
      setIsRosterLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [roster]);

  const handleUpdateProfileData = () => {
      onUpdateProfile({ nickname: editNickname, photoUrl: editPhotoUrl, positions: editPositions, platforms: editPlatforms, mode: editMode });
      toast.success("Perfil atualizado com sucesso!");
  };

  const processPhotoSelection = (e: React.ChangeEvent<HTMLInputElement>, target: 'PLAYER' | 'MANUAL' | 'TEAM_LOGO', playerId?: string) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setAdjustingPhoto(reader.result as string);
              setTargetType(target);
              setEditingPlayerId(playerId || null);
              setAdjZoom(target === 'TEAM_LOGO' ? 1.0 : 1.5);
              setAdjX(0);
              setAdjY(0);
              setAdjBrightness(100);
              setAdjContrast(100);
              setAdjSaturation(100);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleBakePhoto = async () => {
    if (!adjustingPhoto) return;
    const canvas = document.createElement('canvas');
    const size = 1024;
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        const img = new Image(); img.src = adjustingPhoto;
        await new Promise<void>((resolve) => {
            img.onload = () => resolve();
        });
        ctx.clearRect(0, 0, size, size);
        ctx.filter = `brightness(${adjBrightness}%) contrast(${adjContrast}%) saturate(${adjSaturation}%)`;
        const imgRatio = img.width / img.height;
        let renderWidth, renderHeight;
        if (imgRatio > 1) { renderHeight = size; renderWidth = size * imgRatio; } else { renderWidth = size; renderHeight = size / imgRatio; }
        const finalWidth = renderWidth * adjZoom; const finalHeight = renderHeight * adjZoom;
        const x = (size / 2) - (finalWidth / 2) + (adjX * (finalWidth / 100));
        const y = (size / 2) - (finalHeight / 2) + (adjY * (finalHeight / 100));
        ctx.drawImage(img, x, y, finalWidth, finalHeight);
        
        // Convert to blob for Supabase upload
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 1.0));
        if (!blob) return;

        let finalUrl = '';
        try {
            const fileName = `${targetType.toLowerCase()}_${Date.now()}.png`;
            finalUrl = await uploadFile('arena-assets', `profiles/${fileName}`, blob);
        } catch (err: any) {
            console.error("Upload to Supabase Storage failed:", err);
            toast.error(err.message || 'Erro no upload da foto.');
            return; // Stop if upload/validation fails
        }

        if (targetType === 'PLAYER') setEditPhotoUrl(finalUrl);
        else if (targetType === 'TEAM_LOGO') setEditTeamLogo(finalUrl);
        else if (targetType === 'MANUAL' && editingPlayerId) {
            const currentClubData = profile.clubData!;
            const updatedRoster = currentClubData.roster.map((p: ClubPlayer) => p.id === editingPlayerId ? { ...p, photoUrl: finalUrl } : p);
            onUpdateProfile({ clubData: { ...currentClubData, roster: updatedRoster } });
        } else { setManualPlayerPhoto(finalUrl); }
        setAdjustingPhoto(null); setEditingPlayerId(null);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => processPhotoSelection(e, 'PLAYER');
  const handleManualPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, pid?: string) => processPhotoSelection(e, 'MANUAL', pid);
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => processPhotoSelection(e, 'TEAM_LOGO');

  const handleUpdatePlayerQuick = (pid: string, updates: Partial<ClubPlayer>) => {
      if (!isTeamManager || !profile.clubData) return;
      // Comment: Explicitly typing 'p' as ClubPlayer to avoid property 'id' missing error
      const updatedRoster = profile.clubData.roster.map((p: ClubPlayer) => p.id === pid ? { ...p, ...updates } : p);
      onUpdateProfile({ clubData: { ...profile.clubData, roster: updatedRoster } });
  };

  const handleAddManualPlayer = () => {
    if (!manualPlayerName || !isTeamManager || manualPlayerPositions.length === 0) {
        if (manualPlayerPositions.length === 0) toast.info('Selecione ao menos uma posição!');
        return;
    }
    const newPlayer: ClubPlayer = { 
      id: Math.random().toString(36).substr(2, 9), 
      name: manualPlayerName, 
      position: manualPlayerPositions.join(','), 
      status: 'ACTIVE', 
      matches: 0, 
      goals: 0, 
      assists: 0, 
      averageRating: 6.0, 
      photoUrl: manualPlayerPhoto || undefined,
      tipo: 'manual'
    };
    const currentClubData = profile.clubData || { foundingYear: '2024', primaryColor: '#000000', secondaryColor: '#ffffff', roster: [], notices: [], history: [] };
    onUpdateProfile({ clubData: { ...currentClubData, roster: [...(currentClubData.roster || []), newPlayer] } });
    setManualPlayerName(''); setManualPlayerPhoto(''); setManualPlayerPositions([]);
  };

  const handleBulkAddPlayers = () => {
    if (!bulkPlayersText || !isTeamManager) return;
    const lines = bulkPlayersText.split('\n');
    const previewPlayers = lines.filter(line => line.trim()).map(line => {
      const parts = line.split('-');
      let name, position;
      
      if (parts.length > 1) {
        position = parts[0].trim();
        name = parts.slice(1).join('-').trim();
      } else {
        position = "SEM POS";
        name = parts[0].trim();
      }

      // Validate position against the allowed flat list
      const allowedPositions = ['GL', 'GK', 'ZG', 'ZGD', 'ZGC', 'ZGE', 'LD', 'LE', 'VOL', 'MCD', 'MCE', 'VLD', 'VLE', 'MC', 'MLG', 'MAT', 'MEI', 'MLD', 'MLE', 'MD', 'ME', 'PD', 'PE', 'PTD', 'PTE', 'ST', 'SA', 'CA', 'ATA-D', 'ATA-E'];
      if (!allowedPositions.includes(position)) {
          position = "SEM POS";
      }

      return { name, position };
    });
    setBulkPreviewPlayers(previewPlayers);
    setBulkPlayersText('');
  };

  const handleConfirmBulkAdd = () => {
    if (!isTeamManager || !profile.clubData) return;
    const newPlayers: ClubPlayer[] = bulkPreviewPlayers.filter(p => p.name.trim()).map(p => ({
        id: Math.random().toString(36).substr(2, 9),
        name: p.name,
        position: p.position,
        status: 'ACTIVE',
        matches: 0,
        goals: 0,
        assists: 0,
        averageRating: 6.0,
        tipo: 'manual'
    }));
    
    const currentClubData = profile.clubData || { foundingYear: '2024', primaryColor: '#000000', secondaryColor: '#ffffff', roster: [], notices: [], history: [] };
    onUpdateProfile({ clubData: { ...currentClubData, roster: [...(currentClubData.roster || []), ...newPlayers] } });
    setBulkPreviewPlayers([]);
  };

  const handleSavePosition = (pid: string) => {
      handleUpdatePlayerQuick(pid, { position: editPositionValue });
      setEditingPlayerPositionId(null);
  };

  const handleRemovePlayer = (pid: string) => {
    if (!isTeamManager || !profile.clubData) return;
    if (!window.confirm('Deseja remover este jogador do elenco oficial?')) return;
    onUpdateProfile({ clubData: { ...profile.clubData, roster: profile.clubData.roster.filter(p => p.id !== pid) } });
  };

  const handleSaveTeamInfo = () => {
    onUpdateProfile({ teamName: editTeamName, teamLogoUrl: editTeamLogo });
    toast.success('Informações do clube atualizadas com sucesso!');
  };

  const handleAutoEscalar = (p: ClubPlayer) => {
      const emptySlot = activeSlotPositions.find(slot => !lineup[slot.id]);
      
      if (emptySlot) {
          const newLineup = { ...lineup };
          // Remove se já estiver em outro lugar
          Object.keys(newLineup).forEach(key => { if (newLineup[key] === p.id) delete newLineup[key]; });
          newLineup[emptySlot.id] = p.id;
          setLineup(newLineup);
      } else {
          toast.error(`Não há slots vazios na formação atual!`);
      }
  };

  const handleFieldClick = (slotId: string) => {
    if (selectedPlayerId) {
      const newLineup = { ...lineup };
      Object.keys(newLineup).forEach(key => { if (newLineup[key] === selectedPlayerId) delete newLineup[key]; });
      newLineup[slotId] = selectedPlayerId;
      setLineup(newLineup);
      setSelectedPlayerId(null);
    } else if (lineup[slotId]) {
      const newLineup = { ...lineup }; delete newLineup[slotId]; setLineup(newLineup);
    }
  };

  const handleDragStart = (e: React.MouseEvent, id: string) => {
    if (!isTeamManager) return;
    e.stopPropagation();
    setDraggingSlotId(id);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingSlotId || !fieldRef.current) return;
      const rect = fieldRef.current.getBoundingClientRect();
      
      // Slot size in percentage
      const slotWidthPct = (240 / rect.width) * 100;
      const slotHeightPct = (240 / rect.height) * 100;

      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      // Clamp to 0-100, keeping element inside container
      const clampedX = Math.max(slotWidthPct / 2, Math.min(100 - slotWidthPct / 2, x));
      const clampedY = Math.max(slotHeightPct / 2, Math.min(100 - slotHeightPct / 2, y));

      setActiveSlotPositions(prev => prev.map(p => p.id === draggingSlotId ? { ...p, x: clampedX, y: clampedY } : p));
    };

    const handleMouseUp = () => {
      if (draggingSlotId) {
        // Save to profile
        if (isTeamManager && profile.clubData) {
            onUpdateProfile({
                clubData: {
                    ...profile.clubData,
                    tactics: {
                        ...profile.clubData.tactics,
                        positions: activeSlotPositions
                    }
                }
            });
        }
        setDraggingSlotId(null);
      }
    };

    if (draggingSlotId) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingSlotId, activeSlotPositions, isTeamManager, profile.clubData, onUpdateProfile]);

  const SIDEBAR_ITEMS = [
    { id: 'overview', icon: LayoutDashboard, label: 'Painel Central' },
    { id: 'profile_edit', icon: UserIcon, label: 'Editar Perfil' },
    { id: 'competitions', icon: Trophy, label: 'Meus Campeonatos' },
    { id: 'explore', icon: Globe, label: 'Explorar Competições' },
    { id: 'roster', icon: Users, label: isTeamManager ? 'Gerir Elenco' : 'Meu Elenco' },
    ...(isTeamManager ? [
      { id: 'tactics', icon: Brain, label: 'Plano de Jogo' },
      { id: 'admin', icon: Briefcase, label: 'Admin Clube' }
    ] : []),
    { id: 'gallery', icon: Crown, label: 'Galeria' },
    { id: 'security', icon: Lock, label: 'Segurança' }
  ];

  const shapeClass = customization.shape === 'circle' ? 'rounded-full' : customization.shape === 'square' ? 'rounded-none' : 'rounded-2xl';

  return (
    <div className="flex flex-col h-full bg-brand-dark overflow-hidden font-sans">
      
      {/* SELETOR DE POSIÇÃO AO ESCALAR */}

      {/* MODAL DE AJUSTE DE FOTO */}
      {adjustingPhoto && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-brand-surface border border-brand-border w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
                  <div className="flex-1 bg-black/40 p-8 flex flex-col items-center justify-center border-r border-brand-border relative">
                      <div className="absolute top-6 left-6 flex items-center gap-2">
                          <span className="bg-brand-primary text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg uppercase">
                              MODO HD: {targetType === 'TEAM_LOGO' ? 'ESCUDO' : 'ATLETA'}
                          </span>
                      </div>
                      <div className="relative w-80 h-80 flex items-center justify-center">
                          <div className={`w-72 h-72 overflow-hidden flex items-center justify-center z-10 relative bg-black/50 ${targetType === 'TEAM_LOGO' ? 'rounded-xl border-2 border-dashed border-white/20' : shapeClass}`}>
                              <div className="relative w-full h-full">
                                  <img 
                                    src={adjustingPhoto} 
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none transition-none"
                                    style={{ 
                                        width: '100%', height: '100%', objectFit: 'contain',
                                        transform: `translate(-50%, -50%) scale(${adjZoom}) translate(${adjX}%, ${adjY}%)`,
                                        filter: `brightness(${adjBrightness}%) contrast(${adjContrast}%) saturate(${adjSaturation}%)`
                                    }}
                                  />
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="w-full md:w-96 p-8 flex flex-col gap-6 bg-brand-surfaceHighlight overflow-y-auto max-h-[80vh] md:max-h-none custom-scrollbar">
                      <div className="flex justify-between items-center border-b border-brand-border pb-4">
                          <h3 className="font-black text-white uppercase italic text-sm">Melhorar Imagem</h3>
                          <button onClick={()=>setAdjustingPhoto(null)} className="text-brand-textMuted hover:text-white transition-colors"><X size={20}/></button>
                      </div>
                      <div className="space-y-6">
                          <div className="space-y-4">
                              <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest">Enquadramento</p>
                              <div className="space-y-2">
                                  <div className="flex justify-between items-center"><label className="text-[10px] font-black text-brand-textMuted uppercase">Zoom</label><span className="text-brand-primary font-black text-xs">{adjZoom.toFixed(1)}x</span></div>
                                  <input type="range" min="0.1" max="5" step="0.05" value={adjZoom} onChange={e=>setAdjZoom(parseFloat(e.target.value))} className="w-full h-1.5 bg-black rounded-lg appearance-none cursor-pointer accent-brand-primary"/>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-brand-textMuted uppercase">Eixo X</label>
                                      <input type="range" min="-100" max="100" step="1" value={adjX} onChange={e=>setAdjX(parseInt(e.target.value))} className="w-full h-1.5 bg-black rounded-lg appearance-none cursor-pointer accent-brand-primary"/>
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[10px] font-black text-brand-textMuted uppercase">Eixo Y</label>
                                      <input type="range" min="-100" max="100" step="1" value={adjY} onChange={e=>setAdjY(parseInt(e.target.value))} className="w-full h-1.5 bg-black rounded-lg appearance-none cursor-pointer accent-brand-primary"/>
                                  </div>
                              </div>
                          </div>
                      </div>
                      <div className="mt-auto pt-6 border-t border-brand-border">
                          <button onClick={handleBakePhoto} className="w-full bg-brand-primary hover:bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"><Check size={18}/> Confirmar & Salvar HD</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="bg-brand-surface border-b border-brand-border p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl z-20">
        <div className="w-24 h-24 rounded-2xl bg-black border-4 border-brand-primary overflow-hidden shadow-2xl relative shrink-0">
          {profile.teamLogoUrl ? <img src={profile.teamLogoUrl} className="w-full h-full object-cover" alt="Club" /> : <Shield size={40} className="text-slate-600 m-auto mt-4"/>}
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3">
             <h1 className="text-3xl font-black text-brand-text italic tracking-wide uppercase">{profile.teamName || (isTeamManager ? "Clube sem Nome" : profile.nickname)}</h1>
             {isTeamManager && <span className="bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded">PRESIDENTE</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`bg-brand-surface border-r border-brand-border transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-16'}`}>
          <div className="p-4 border-b border-brand-border flex justify-end">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-brand-textMuted hover:text-brand-text">{isSidebarOpen ? <ChevronLeft /> : <Menu />}</button>
          </div>
          <div className="flex-1 overflow-y-auto py-4 space-y-1">
            {SIDEBAR_ITEMS.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-4 px-4 py-3 transition-colors relative ${activeTab === item.id ? 'bg-brand-primary/10 text-brand-primary border-r-4 border-brand-primary' : 'text-brand-textMuted hover:bg-brand-surfaceHighlight'}`}>
                <item.icon size={20} />
                {isSidebarOpen && <span className="font-bold text-sm">{item.label}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-brand-dark p-6 custom-scrollbar">
          {activeTab === 'tactics' && isTeamManager && (
            <div className="space-y-6 animate-in fade-in h-auto pb-32">
               <div className="flex flex-col lg:flex-row gap-6">
                  
                  <div className="flex-1 space-y-6">
                      <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                              <span className="bg-brand-primary text-white text-[10px] font-black px-3 py-1 rounded-full shadow-[0_0_10px_rgba(var(--theme-primary),0.3)] uppercase">MODO TÁTICO ATIVO</span>
                              <h3 className="font-black text-brand-text uppercase text-sm italic">Quadro de Instruções</h3>
                          </div>
                          <div className="flex gap-2">
                              <select 
                                value={tacticFormation} 
                                onChange={e=>{setTacticFormation(e.target.value); setLineup({});}} 
                                className="bg-black border border-brand-border px-4 py-2.5 rounded-xl text-brand-primary text-xs font-black outline-none cursor-pointer uppercase"
                              >
                                  {Object.values(currentFormations as any).map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                              </select>
                              <button onClick={() => setLineup({})} className="bg-brand-surfaceHighlight border border-brand-border text-brand-text p-2.5 rounded-xl hover:text-red-500 transition-colors"><RefreshCw size={18}/></button>
                          </div>
                      </div>

                      <div 
                        ref={fieldRef}
                        className="relative flex justify-center items-center bg-black/80 rounded-3xl border border-brand-border p-0 overflow-visible h-[720px]" 
                      >
                          <div 
                            className="w-full h-full relative transition-all duration-700 ease-out z-0"
                          >
                              {/* CAMPO DINÂMICO */}
                              <div 
                                className="absolute inset-0 rounded-xl overflow-hidden border-4 z-[-1] pointer-events-none transition-all duration-500" 
                                style={{ 
                                    background: FIELD_THEMES[fieldTheme].gradient,
                                    borderColor: FIELD_THEMES[fieldTheme].lineColor
                                }}
                              >
                                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 60px, ${FIELD_THEMES[fieldTheme].stripeColor} 60px, ${FIELD_THEMES[fieldTheme].stripeColor} 120px)` }}></div>
                                  <div className="absolute inset-0 border-2" style={{ borderColor: FIELD_THEMES[fieldTheme].lineColor }}></div>
                                  
                                  <div className="absolute top-1/2 left-0 w-full h-[2px]" style={{ backgroundColor: FIELD_THEMES[fieldTheme].lineColor }}></div>
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 rounded-full flex items-center justify-center" style={{ borderColor: FIELD_THEMES[fieldTheme].lineColor }}>
                                      <div className="w-3 h-3 rounded-full shadow-[0_0_10px_white]" style={{ backgroundColor: FIELD_THEMES[fieldTheme].lineColor }}></div>
                                  </div>

                                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[18%] border-2 border-t-0" style={{ borderColor: FIELD_THEMES[fieldTheme].lineColor }}></div>
                                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[25%] h-[7%] border-2 border-t-0" style={{ borderColor: FIELD_THEMES[fieldTheme].lineColor }}></div>
                                  
                                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[18%] border-2 border-b-0" style={{ borderColor: FIELD_THEMES[fieldTheme].lineColor }}></div>
                                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[25%] h-[7%] border-2 border-b-0" style={{ borderColor: FIELD_THEMES[fieldTheme].lineColor }}></div>
                                  
                                  {profile.teamLogoUrl && (
                                      <div 
                                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none flex items-center justify-center transition-all duration-500"
                                          style={{ 
                                              width: `${fieldWatermarkSize}px`, 
                                              height: `${fieldWatermarkSize}px`,
                                              opacity: fieldWatermarkOpacity / 100
                                          }}
                                      >
                                          <img src={profile.teamLogoUrl} className="w-full h-full object-contain filter grayscale brightness-200" />
                                      </div>
                                  )}
                              </div>
                              
                              {activeSlotPositions.map(pos => {
                                  const playerId = lineup[pos.id];
                                  // Comment: Explicitly typing find callback to resolve 'unknown' error
                                  const p = (roster as ClubPlayer[]).find((r: ClubPlayer) => r.id === playerId);
                                  const isBeingDragged = draggingSlotId === pos.id;
                                  
                                  return (
                                    <div 
                                        key={pos.id} 
                                        onMouseDown={(e) => handleDragStart(e, pos.id)}
                                        onClick={(e) => { e.stopPropagation(); if (!draggingSlotId) handleFieldClick(pos.id); }}
                                        className={`absolute transition-all duration-100 select-none group cursor-pointer ${isBeingDragged ? 'scale-110 z-[5000]' : 'z-[1000]'} ${slotPulseEnabled && p ? 'animate-[pulse_2s_infinite]' : ''}`} 
                                        style={{ 
                                            left: `${pos.x}%`, 
                                            top: `${pos.y}%`,
                                            transform: `translate3d(-50%, -50%, ${isBeingDragged ? 250 : 40}px) rotateX(-35deg)`,
                                            width: '240px', 
                                            height: '240px'
                                        }}
                                    >
                                       {p ? (
                                         <div className="flex flex-col items-center justify-center w-full h-full relative overflow-visible">
                                            <div className="relative mb-4" style={{ width: `${playerPhotoSize}px`, height: `${playerPhotoSize}px` }}>
                                                <div 
                                                    className={`w-full h-full transition-all overflow-hidden flex flex-col items-center justify-center z-10 relative`} 
                                                    style={{ 
                                                        backgroundColor: customization.bgColor,
                                                        border: customization.borderEnabled ? `${customization.borderWidth}px solid ${customization.borderColor}` : 'none',
                                                        color: customization.textColor,
                                                        borderRadius: customization.borderRadius,
                                                        fontFamily: customization.fontFamily,
                                                        fontSize: `${customization.fontSize}px`,
                                                        fontWeight: customization.fontWeight
                                                    }}
                                                >
                                                    {customization.layout === 'nameAbove' && customization.nameTagStyle !== 'none' && (
                                                        <div className={`w-full px-1 truncate ${customization.nameTagStyle === 'box' ? 'w-full' : customization.nameTagStyle === 'badge' ? 'rounded-full px-2 text-[10px] w-fit' : ''}`} style={{ 
                                                            backgroundColor: customization.nameTagStyle === 'box' ? customization.borderColor : customization.nameTagStyle === 'badge' ? customization.borderColor : customization.nameTagStyle === 'simple' ? 'rgba(0,0,0,0.5)' : 'transparent', 
                                                            color: customization.textColor,
                                                            textAlign: 'center'
                                                        }}>
                                                            {p.name} - {p.position}
                                                        </div>
                                                    )}
                                                    {p.photoUrl ? <img src={p.photoUrl} className="w-full h-full object-cover pointer-events-none"/> : <UserIcon className="w-full h-full p-3" style={{ color: customization.textColor }} />}
                                                    {customization.layout === 'nameBelow' && customization.nameTagStyle !== 'none' && (
                                                        <div className={`w-full px-1 truncate ${customization.nameTagStyle === 'box' ? 'w-full' : customization.nameTagStyle === 'badge' ? 'rounded-full px-2 text-[10px] w-fit' : ''}`} style={{ 
                                                            backgroundColor: customization.nameTagStyle === 'box' ? customization.borderColor : customization.nameTagStyle === 'badge' ? customization.borderColor : customization.nameTagStyle === 'simple' ? 'rgba(0,0,0,0.5)' : 'transparent', 
                                                            color: customization.textColor,
                                                            textAlign: 'center'
                                                        }}>
                                                            {p.name} - {p.position}
                                                        </div>
                                                    )}
                                                </div>

                                                {profile.teamLogoUrl && (
                                                    <div 
                                                        className="absolute -top-2 -right-2 z-[60] flex items-center justify-center drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] overflow-visible transition-opacity duration-300" 
                                                        style={{ 
                                                            width: `${labelLogoSize}px`, 
                                                            height: `${labelLogoSize}px`,
                                                            opacity: labelLogoOpacity / 100
                                                        }}
                                                    >
                                                        <img src={profile.teamLogoUrl} className="w-full h-full object-contain pointer-events-none" style={{ maxWidth: 'none' }} />
                                                    </div>
                                                )}

                                                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-[40]">
                                                    <div className="flex items-center gap-2 rounded-full border border-white/10 h-10 px-1 shadow-2xl overflow-hidden min-w-[150px]" style={{ backgroundColor: nickBgColor }}>
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center uppercase text-[9px] font-black shrink-0 shadow-lg" style={{ backgroundColor: posBgColor, color: posTextColor }}>
                                                            {pos.label}
                                                        </div>
                                                        <div className="flex-1 text-center truncate uppercase font-black tracking-tight" style={{ color: nickTextColor, fontSize: `${nameFontSize}px` }}>
                                                            {p.name.split(' ')[0]}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                         </div>
                                       ) : (
                                         <div className="flex items-center justify-center w-full h-full">
                                            <div className={`border-2 border-dashed flex items-center justify-center transition-all bg-black/40 ${shapeClass}`} style={{ width: `${playerPhotoSize}px`, height: `${playerPhotoSize}px`, borderColor: selectedPlayerId ? customization.borderColor : 'rgba(255,255,255,0.2)' }}>
                                                <span className="text-xs font-black text-white/40">{pos.label}</span>
                                            </div>
                                         </div>
                                       )}
                                    </div>
                                  );
                              })}
                          </div>
                      </div>
                  </div>

                  <div className="w-full lg:w-72 space-y-6 shrink-0">
                      <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border shadow-2xl space-y-4 max-h-[700px] overflow-y-auto custom-scrollbar">
                          <div className="flex items-center justify-between border-b border-brand-border pb-2 mb-4">
                              <h3 className="font-black text-brand-text flex items-center gap-2 uppercase tracking-widest text-xs"><Palette size={16}/> Visual do Time</h3>
                              <button onClick={() => setShowVisualSettings(!showVisualSettings)} className="text-brand-textMuted hover:text-white transition-colors">
                                  {showVisualSettings ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                              </button>
                          </div>
                          
                          {showVisualSettings && (
                          <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
                              
                              <div className="p-3 bg-brand-primary/10 rounded-xl space-y-4 border border-brand-primary/30">
                                  <p className="text-[9px] font-black text-brand-primary uppercase mb-2">Customização Jogador</p>
                                  
                                  <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-brand-textMuted uppercase">Fundo</label>
                                          <input type="color" value={customization.bgColor} onChange={e => handleCustomizationChange({ bgColor: e.target.value })} className="w-full h-8 rounded cursor-pointer bg-transparent" />
                                      </div>
                                      <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-brand-textMuted uppercase">Texto</label>
                                          <input type="color" value={customization.textColor} onChange={e => handleCustomizationChange({ textColor: e.target.value })} className="w-full h-8 rounded cursor-pointer bg-transparent" />
                                      </div>
                                      <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-brand-textMuted uppercase">Borda</label>
                                          <input type="color" value={customization.borderColor} onChange={e => handleCustomizationChange({ borderColor: e.target.value })} className="w-full h-8 rounded cursor-pointer bg-transparent" />
                                      </div>
                                      <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-brand-textMuted uppercase">Formato</label>
                                          <select value={customization.shape} onChange={e => handleCustomizationChange({ shape: e.target.value as any })} className="w-full h-8 bg-black border border-white/10 rounded text-[10px] text-white">
                                              <option value="circle">Circular</option>
                                              <option value="square">Quadrado</option>
                                              <option value="rounded">Arredondado</option>
                                          </select>
                                      </div>
                                      <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-brand-textMuted uppercase">Fonte</label>
                                          <select value={customization.fontFamily} onChange={e => handleCustomizationChange({ fontFamily: e.target.value })} className="w-full h-8 bg-black border border-white/10 rounded text-[10px] text-white">
                                              <option value="Inter">Inter</option>
                                              <option value="monospace">Monospace</option>
                                              <option value="sans-serif">Sans Serif</option>
                                          </select>
                                      </div>
                                      <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-brand-textMuted uppercase">Tamanho Fonte</label>
                                          <input type="number" value={customization.fontSize} onChange={e => handleCustomizationChange({ fontSize: parseInt(e.target.value) })} className="w-full h-8 bg-black border border-white/10 rounded text-[10px] text-white p-1" />
                                      </div>
                                      <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-brand-textMuted uppercase">Peso</label>
                                          <select value={customization.fontWeight} onChange={e => handleCustomizationChange({ fontWeight: e.target.value as any })} className="w-full h-8 bg-black border border-white/10 rounded text-[10px] text-white">
                                              <option value="normal">Normal</option>
                                              <option value="bold">Negrito</option>
                                          </select>
                                      </div>
                                      <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-brand-textMuted uppercase">Estilo Nome</label>
                                          <select value={customization.nameTagStyle} onChange={e => handleCustomizationChange({ nameTagStyle: e.target.value as any })} className="w-full h-8 bg-black border border-white/10 rounded text-[10px] text-white">
                                              <option value="simple">Simples</option>
                                              <option value="none">Sem Barra</option>
                                              <option value="box">Caixa Completa</option>
                                              <option value="badge">Badge</option>
                                              <option value="minimal">Minimalista</option>
                                          </select>
                                      </div>
                                      <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-brand-textMuted uppercase">Layout</label>
                                          <select value={customization.layout} onChange={e => handleCustomizationChange({ layout: e.target.value as any })} className="w-full h-8 bg-black border border-white/10 rounded text-[10px] text-white">
                                              <option value="nameBelow">Nome Abaixo</option>
                                              <option value="nameAbove">Nome Acima</option>
                                              <option value="nameCenter">Nome Central</option>
                                          </select>
                                      </div>
                                      <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-brand-textMuted uppercase">Borda Ativa</label>
                                          <input type="checkbox" checked={customization.borderEnabled} onChange={e => handleCustomizationChange({ borderEnabled: e.target.checked })} className="w-full h-4" />
                                      </div>
                                      <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-brand-textMuted uppercase">Espessura Borda</label>
                                          <input type="number" value={customization.borderWidth} onChange={e => handleCustomizationChange({ borderWidth: parseInt(e.target.value) })} className="w-full h-8 bg-black border border-white/10 rounded text-[10px] text-white p-1" />
                                      </div>
                                  </div>
                              </div>

                              <div className="p-3 bg-brand-primary/10 rounded-xl space-y-4 border border-brand-primary/30">
                                  <p className="text-[9px] font-black text-brand-primary uppercase mb-2">Configurações de Arena</p>
                                  
                                  <div>
                                      <label className="text-[10px] font-black text-brand-textMuted uppercase mb-1 block">Estilo Tático (Posições)</label>
                                      <div className="flex gap-1 p-1 bg-black rounded-lg border border-white/5">
                                          <button 
                                            onClick={() => { setPositionMode('EA_FC'); setTacticFormation('4-3-3'); }} 
                                            className={`flex-1 py-1.5 rounded-md text-[9px] font-black uppercase transition-all ${positionMode === 'EA_FC' ? 'bg-brand-primary text-white shadow-lg' : 'text-brand-textMuted hover:text-white'}`}
                                          >
                                              EA FC 25
                                          </button>
                                          <button 
                                            onClick={() => { setPositionMode('REAL'); setTacticFormation('4-3-3'); }} 
                                            className={`flex-1 py-1.5 rounded-md text-[9px] font-black uppercase transition-all ${positionMode === 'REAL' ? 'bg-brand-primary text-white shadow-lg' : 'text-brand-textMuted hover:text-white'}`}
                                          >
                                              FUT. REAL
                                          </button>
                                      </div>
                                  </div>

                                  <div>
                                      <label className="text-[10px] font-black text-brand-textMuted uppercase mb-1 block">Tema do Campo</label>
                                      <select 
                                        value={fieldTheme} 
                                        onChange={e => setFieldTheme(e.target.value)} 
                                        className="w-full bg-black border border-white/10 rounded-lg p-2 text-brand-text font-bold text-[10px] outline-none cursor-pointer"
                                      >
                                          <optgroup label="Padrões">
                                              {Object.entries(FIELD_THEMES).slice(0, 12).map(([key, theme]) => (
                                                  <option key={key} value={key}>{theme.name}</option>
                                              ))}
                                          </optgroup>
                                          <optgroup label="Continental">
                                              {Object.entries(FIELD_THEMES).slice(12, 18).map(([key, theme]) => (
                                                  <option key={key} value={key}>{theme.name}</option>
                                              ))}
                                          </optgroup>
                                          <optgroup label="Seleções Elite">
                                              {Object.entries(FIELD_THEMES).slice(18, 24).map(([key, theme]) => (
                                                  <option key={key} value={key}>{theme.name}</option>
                                              ))}
                                          </optgroup>
                                          <optgroup label="Estrelas do Futebol">
                                              {Object.entries(FIELD_THEMES).slice(24).map(([key, theme]) => (
                                                  <option key={key} value={key}>{theme.name}</option>
                                              ))}
                                          </optgroup>
                                      </select>
                                  </div>
                              </div>

                              <div className="p-3 bg-black/20 rounded-xl space-y-4 border border-brand-primary/10">
                                  <p className="text-[9px] font-black text-brand-primary uppercase mb-2">Controles de Movimento</p>
                                  <div>
                                      <label className="text-[10px] font-black text-brand-textMuted uppercase mb-1 block flex justify-between">
                                          Sensibilidade do Arraste <span>{Math.round(dragSensitivity * 100)}%</span>
                                      </label>
                                      <input 
                                          type="range" min="0.1" max="2" step="0.1" 
                                          value={dragSensitivity} 
                                          onChange={e=>setDragSensitivity(parseFloat(e.target.value))} 
                                          className="w-full h-1.5 bg-black rounded-lg appearance-none cursor-pointer accent-brand-primary"
                                      />
                                  </div>
                              </div>

                              <div className="p-3 bg-black/20 rounded-xl space-y-4">
                                  <p className="text-[9px] font-black text-brand-primary uppercase mb-2">Escalas e Tamanhos</p>
                                  <div>
                                      <label className="text-[10px] font-black text-brand-textMuted uppercase mb-1 block">Foto Atleta</label>
                                      <input type="range" min="40" max="150" value={playerPhotoSize} onChange={e=>setPlayerPhotoSize(parseInt(e.target.value))} className="w-full h-1.5 bg-black rounded-lg appearance-none cursor-pointer accent-brand-primary"/>
                                  </div>
                                  
                                  <div className="space-y-2 py-2 border-t border-white/5">
                                      <label className="text-[10px] font-black text-brand-textMuted uppercase block">Escudo Time (Cards)</label>
                                      <div className="space-y-3">
                                          <div className="flex flex-col gap-1">
                                              <span className="text-[8px] text-brand-textMuted uppercase font-bold">Tamanho</span>
                                              <input type="range" min="16" max="150" value={labelLogoSize} onChange={e=>setLabelLogoSize(parseInt(e.target.value))} className="w-full h-1.5 bg-black rounded-lg appearance-none cursor-pointer accent-brand-primary"/>
                                          </div>
                                          <div className="flex flex-col gap-1">
                                              <span className="text-[8px] text-brand-textMuted uppercase font-bold">Opacidade (Translúcido)</span>
                                              <input type="range" min="0" max="100" value={labelLogoOpacity} onChange={e=>setLabelLogoOpacity(parseInt(e.target.value))} className="w-full h-1.5 bg-black rounded-lg appearance-none cursor-pointer accent-brand-primary"/>
                                          </div>
                                      </div>
                                  </div>

                                  <div>
                                      <label className="text-[10px] font-black text-brand-textMuted uppercase mb-1 block">Fonte Nome</label>
                                      <input type="range" min="8" max="24" value={nameFontSize} onChange={e=>setNameFontSize(parseInt(e.target.value))} className="w-full h-1.5 bg-black rounded-lg appearance-none cursor-pointer accent-brand-primary"/>
                                  </div>
                              </div>

                              <div className="p-3 bg-black/20 rounded-xl space-y-4 border border-white/10">
                                  <p className="text-[9px] font-black text-white uppercase mb-2 flex items-center gap-2"><ImageIcon size={10}/> Marca d'água (Campo)</p>
                                  <div>
                                      <label className="text-[10px] font-black text-brand-textMuted uppercase mb-1 block">Tamanho no Círculo</label>
                                      <input type="range" min="50" max="600" value={fieldWatermarkSize} onChange={e=>setFieldWatermarkSize(parseInt(e.target.value))} className="w-full h-1.5 bg-black rounded-lg appearance-none cursor-pointer accent-slate-400"/>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-brand-textMuted uppercase mb-1 block">Transparência Fundo</label>
                                      <input type="range" min="0" max="100" value={fieldWatermarkOpacity} onChange={e=>setFieldWatermarkOpacity(parseInt(e.target.value))} className="w-full h-1.5 bg-black rounded-lg appearance-none cursor-pointer accent-slate-400"/>
                                  </div>
                              </div>

                              <div className="p-3 bg-black/20 rounded-xl space-y-4 border border-brand-primary/20">
                                  <p className="text-[9px] font-black text-yellow-500 uppercase mb-2 flex items-center gap-2"><Zap size={10}/> Efeitos de Elite</p>
                                  
                                  <div>
                                      <label className="text-[10px] font-black text-brand-textMuted uppercase mb-1 block">Glow Neon (Brilho)</label>
                                      <input type="range" min="0" max="50" value={slotGlowIntensity} onChange={e=>setSlotGlowIntensity(parseInt(e.target.value))} className="w-full h-1.5 bg-black rounded-lg appearance-none cursor-pointer accent-yellow-500"/>
                                  </div>
                                  
                                  <div>
                                      <label className="text-[10px] font-black text-brand-textMuted uppercase mb-1 block">Cor do Brilho</label>
                                      <input type="color" value={slotGlowColor} onChange={e=>setSlotGlowColor(e.target.value)} className="w-full h-7 bg-transparent border-none cursor-pointer rounded"/>
                                  </div>

                                  <div className="flex items-center justify-between pt-1">
                                      <label className="text-[10px] font-black text-brand-textMuted uppercase">Efeito Pulso</label>
                                      {/* Comment: Fixed typo setPulseEnabled to setSlotPulseEnabled */}
                                      <button onClick={()=>setSlotPulseEnabled(!slotPulseEnabled)} className={`w-8 h-4 rounded-full transition-colors ${slotPulseEnabled ? 'bg-green-600' : 'bg-slate-700'} relative`}>
                                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${slotPulseEnabled ? 'right-0.5' : 'left-0.5'}`}></div>
                                      </button>
                                  </div>
                              </div>
                          </div>
                          )}
                      </div>

                      <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border shadow-2xl flex flex-col max-h-[300px]">
                          <h3 className="font-black text-brand-text mb-4 flex items-center gap-2 uppercase tracking-widest text-xs border-b border-brand-border pb-2"><Users size={16}/> Escalar Atletas</h3>
                          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                            {/* Comment: Explicitly typing map item 'p' as ClubPlayer to avoid 'unknown' type error */}
                            {(roster as ClubPlayer[]).map((p: ClubPlayer) => (
                              <button key={`rosterItem-${p.id}`} onClick={() => setSelectedPlayerId(p.id)} className={`w-full flex items-center gap-3 p-2 rounded-xl border transition-all ${selectedPlayerId === p.id ? 'bg-brand-primary/20 border-brand-primary text-brand-primary' : Object.values(lineup).includes(p.id) ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary' : 'bg-brand-surfaceHighlight border-brand-border text-brand-textMuted hover:border-brand-primary'}`}>
                                 <div className="w-9 h-9 rounded-full bg-black border border-white/10 overflow-hidden flex items-center justify-center relative shrink-0">
                                    {p.photoUrl ? <img src={p.photoUrl} className="w-full h-full object-cover"/> : <UserIcon size={16}/>}
                                 </div>
                                 <div className="flex-1 text-left min-w-0">
                                    <p className="font-black text-[11px] truncate uppercase">{p.name}</p>
                                    <p className="text-[8px] font-bold text-white/40 truncate uppercase">{p.position}</p>
                                 </div>
                                 {Object.values(lineup).includes(p.id) ? <RefreshCw size={12} className="opacity-50" /> : <ChevronRight size={14} className="opacity-30" />}
                              </button>
                            ))}
                          </div>
                      </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in">
                {/* Sessão de Propostas de Contrato / Liga */}
                {( (showMarket && propostas.filter(p => p.destinoId === user.id && p.status === 'pendente' && p.ligaId === profile.ligaId).length > 0) || leagueInvitations.length > 0) && (
                    <div className="space-y-6">
                        {/* Propostas de Mercado (Contratos) */}
                        {showMarket && propostas.filter(p => p.destinoId === user.id && p.status === 'pendente' && p.ligaId === profile.ligaId).length > 0 && (
                            <div className="bg-brand-surface p-6 rounded-2xl border-l-4 border-l-brand-primary border border-brand-border shadow-xl">
                                <h3 className="text-lg font-black text-brand-text mb-4 uppercase italic flex items-center gap-2">
                                    <Briefcase className="text-brand-primary" size={20}/> Propostas de Contrato
                                </h3>
                                <div className="space-y-3">
                                    {propostas
                                        .filter(p => p.destinoId === user.id && p.status === 'pendente' && p.ligaId === profile.ligaId)
                                        .map(p => {
                                            const jogador = allProfiles.find(prof => prof.userId === p.jogadorId);
                                            const manager = allProfiles.find(prof => prof.userId === p.origemId);
                                            
                                            console.log("Exibindo proposta para o jogador:", p);
                                            
                                            return (
                                            <div key={`proposal-${p.id}`} className="bg-brand-surfaceHighlight p-4 rounded-xl border border-white/5 flex items-center justify-between gap-4 transition-all hover:bg-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                                        <UserIcon size={20}/>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-sm">
                                                        {user.role === UserRole.PLAYER 
                                                            ? `Manager: ${manager?.nickname || 'Gerente'}` 
                                                            : `Jogador: ${jogador?.nickname || 'Atleta'}`}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-brand-textMuted uppercase tracking-wider">{jogador?.teamName ? `Time: ${jogador.teamName}` : 'Sem Clube'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 shrink-0">
                                                    <button onClick={() => onResponderProposta(p.id, 'aceitar')} className="bg-green-600 hover:bg-green-500 px-4 py-1.5 rounded-lg text-white text-xs font-black uppercase transition-all active:scale-95">Aceitar</button>
                                                    <button onClick={() => onResponderProposta(p.id, 'recusar')} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all border border-red-600/30">Recusar</button>
                                                </div>
                                            </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                        {/* Convites de Liga (Multi-Tenant Access) */}
                        {leagueInvitations.length > 0 && (
                            <div className="bg-brand-surface p-6 rounded-2xl border-l-4 border-l-amber-500 border border-brand-border shadow-xl">
                                <h3 className="text-lg font-black text-brand-text mb-4 uppercase italic flex items-center gap-2">
                                    <Trophy className="text-amber-500" size={20}/> Convites para Ligas
                                </h3>
                                <div className="space-y-3">
                                    {leagueInvitations.map(inv => {
                                        const league = allLeagues.find(l => l.id === inv.ligaId);
                                        return (
                                            <div key={`league-inv-${inv.id}`} className="bg-brand-surfaceHighlight p-4 rounded-xl border border-white/5 flex items-center justify-between gap-4 transition-all hover:bg-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                                                        <Shield size={20}/>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-sm">Convite para: {league?.name || 'Liga Desconhecida'}</p>
                                                        <p className="text-[10px] font-bold text-brand-textMuted uppercase tracking-wider">Acesso controlado por Organizador</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 shrink-0">
                                                    <button 
                                                        onClick={() => onRespondLeagueInvitation(inv.id, 'aceito')} 
                                                        className="bg-amber-500 hover:bg-amber-400 px-4 py-1.5 rounded-lg text-white text-xs font-black uppercase transition-all active:scale-95"
                                                    >
                                                        Aceitar
                                                    </button>
                                                    <button 
                                                        onClick={() => onRespondLeagueInvitation(inv.id, 'recusado')} 
                                                        className="bg-black/40 hover:bg-red-600 text-brand-textMuted hover:text-white px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all border border-white/10"
                                                    >
                                                        Ignorar
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 flex flex-col items-center gap-4">
                   <UltimateCard item={{ id: 'preview', title: profile.nickname, imageUrl: profile.photoUrl || '', type: 'MVP_AWARD', date: Date.now() }} playerImage={profile.photoUrl} playerPosition={profile.positions?.[0] || 'PRO'} />
                </div>
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-brand-surface p-6 rounded-xl border border-brand-border h-fit">
                    <h3 className="text-xl font-bold text-brand-text mb-6 flex items-center gap-2 border-b border-brand-border pb-2"><BarChart/> Resumo de Carreira</h3>
                    {isStatsLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center animate-pulse">
                            {[1,2,3,4].map(i => <div key={i} className="bg-black/20 p-4 rounded-xl border border-white/5 h-20"></div>)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5"><p className="text-[10px] text-brand-textMuted font-black uppercase">Jogos</p><p className="text-3xl font-black text-white">{stats.matches}</p></div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5"><p className="text-[10px] text-brand-textMuted font-black uppercase text-yellow-500">Gols</p><p className="text-3xl font-black text-brand-primary">{stats.goals}</p></div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5"><p className="text-[10px] text-brand-textMuted font-black uppercase text-blue-400">Assis</p><p className="text-3xl font-black text-blue-400">{stats.assists}</p></div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5"><p className="text-[10px] text-brand-textMuted font-black uppercase text-purple-500">MVPs</p><p className="text-3xl font-black text-purple-500">{stats.mvps}</p></div>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'competitions' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-brand-border pb-6">
                 <div>
                    <h2 className="text-3xl font-black italic uppercase text-white flex items-center gap-3">
                        <Trophy className="text-brand-primary" size={32} /> Meus Campeonatos
                    </h2>
                    <p className="text-[10px] font-black text-brand-textMuted uppercase mt-2 tracking-widest pl-11">Gerencie suas participações e próximos jogos</p>
                 </div>
                 <button onClick={() => setActiveTab('explore')} className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 hover:bg-brand-primary hover:text-white px-6 py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 group">
                    <ListPlus size={16} className="group-hover:scale-110 transition-transform" /> Explorar Competições
                 </button>
              </div>

              {/* Campeonatos Inscritos / Participando */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {allTournaments
                   .filter(t => {
                     // Lógica para filtrar campeonatos onde o jogador/time está inscrito
                     const isRegistered = registrations.some(r => r.tournamentId === t.id && (r.teamId === profile.teamId || r.userId === user.id));
                     return isRegistered;
                   })
                   .map(tournament => {
                     const registration = registrations.find(r => r.tournamentId === tournament.id && (r.teamId === profile.teamId || r.userId === user.id));
                     return (
                      <motion.div 
                        key={tournament.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-brand-surface border border-brand-border rounded-3xl overflow-hidden hover:border-brand-primary/50 transition-all group flex flex-col h-full"
                      >
                        <div className="h-32 bg-brand-surfaceHighlight relative overflow-hidden shrink-0">
                           {tournament.bannerUrl ? (
                             <img src={tournament.bannerUrl} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                           ) : (
                             <div className="w-full h-full bg-gradient-to-br from-brand-primary/10 to-brand-surface border-b border-white/5"></div>
                           )}
                           <div className="absolute top-4 right-4 bg-brand-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-xl z-10">
                              {registration?.status === 'APPROVED' ? 'Inscrito' : 'Pendente'}
                           </div>
                           <div className="absolute inset-0 bg-gradient-to-t from-brand-surface to-transparent"></div>
                           <div className="absolute bottom-4 left-6 flex items-center gap-3">
                              <div className="w-12 h-12 bg-black border border-brand-border rounded-xl flex items-center justify-center p-2 shadow-2xl">
                                <img src={tournament.trophyIconUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=trophy'} className="w-full h-full object-contain" />
                              </div>
                              <div>
                                 <h4 className="text-white font-black uppercase text-sm italic group-hover:text-brand-primary transition-colors">{tournament.name}</h4>
                                 <p className="text-[10px] font-bold text-brand-textMuted uppercase">{tournament.experienceType}</p>
                              </div>
                           </div>
                        </div>
                        <div className="p-6 flex-1 flex flex-col justify-between">
                           <div className="grid grid-cols-2 gap-4 mb-6">
                              <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                 <p className="text-[8px] font-black text-brand-textMuted uppercase mb-1">Status</p>
                                 <p className="text-[10px] font-black text-white uppercase">{tournament.status === 'ACTIVE' ? 'Em Andamento' : 'Inscrições Abertas'}</p>
                              </div>
                              <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                 <p className="text-[8px] font-black text-brand-textMuted uppercase mb-1">Rodada</p>
                                 <p className="text-[10px] font-black text-white uppercase">Finalizada</p>
                              </div>
                           </div>
                           <button 
                             onClick={() => onViewTournament?.(tournament.id)}
                             className="w-full bg-white/5 hover:bg-brand-primary text-white font-black py-3 rounded-xl text-xs uppercase transition-all flex items-center justify-center gap-2 border border-white/10 hover:border-brand-primary shadow-xl"
                           >
                             <Eye size={16} /> Acessar Competição
                           </button>
                        </div>
                      </motion.div>
                     );
                   })
                }

                {allTournaments.filter(t => registrations.some(r => r.tournamentId === t.id && (r.teamId === profile.teamId || r.userId === user.id))).length === 0 && (
                   <div className="col-span-full py-20 text-center bg-brand-surface border border-dashed border-brand-border rounded-[40px]">
                      <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-textMuted">
                         <Trophy size={48} className="opacity-20" />
                      </div>
                      <h3 className="text-xl font-black text-white uppercase italic mb-2">Sem Competições Ativas</h3>
                      <p className="text-brand-textMuted text-sm font-bold uppercase tracking-widest max-w-sm mx-auto">Você ainda não está participando de nenhum campeonato.</p>
                      <button onClick={() => setActiveTab('explore')} className="mt-8 bg-brand-primary text-white font-black px-10 py-4 rounded-2xl shadow-2xl hover:scale-105 transition-all uppercase tracking-widest text-xs flex items-center gap-2 mx-auto">
                        <Globe size={18} /> Explorar Agora
                      </button>
                   </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'explore' && (
            <div className="space-y-8 animate-in fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-brand-border pb-6">
                    <div>
                        <h2 className="text-3xl font-black italic uppercase text-white flex items-center gap-3">
                            <Globe className="text-brand-primary" size={32} /> Explorar Competições
                        </h2>
                        <p className="text-[10px] font-black text-brand-textMuted uppercase mt-2 tracking-widest pl-11">Federações, Ligas e Campeonatos Disponíveis</p>
                    </div>
                </div>

                {/* Filtros e Busca */}
                <div className="flex flex-wrap gap-4">
                   <div className="flex-1 min-w-[300px] relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-textMuted" size={20} />
                      <input 
                        type="text" 
                        placeholder="Pesquisar campeonatos, ligas ou federações..." 
                        className="w-full bg-brand-surface border border-brand-border rounded-2xl py-4 pl-12 pr-6 text-white font-bold outline-none focus:border-brand-primary transition-all shadow-xl"
                      />
                   </div>
                   <div className="flex gap-2">
                      <button className="bg-brand-surface border border-brand-border px-6 rounded-2xl text-xs font-black uppercase text-white flex items-center gap-2 hover:bg-white/5 transition-all">
                        <Filter size={16} /> Filtros
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {/* Destaques de Campeonatos Disponíveis */}
                   {allTournaments
                      .filter(t => !registrations.some(r => r.tournamentId === t.id && (r.teamId === profile.teamId || r.userId === user.id)))
                      .slice(0, 6)
                      .map(tournament => (
                         <motion.div 
                          key={`explore-tourn-${tournament.id}`} 
                          whileHover={{ y: -10 }}
                          className="bg-brand-surface border border-brand-border rounded-[2.5rem] overflow-hidden flex flex-col"
                         >
                            <div className="h-48 relative overflow-hidden group">
                               {tournament.bannerUrl ? (
                                  <img src={tournament.bannerUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                               ) : (
                                  <div className="w-full h-full bg-brand-surfaceHighlight"></div>
                               )}
                               <div className="absolute inset-0 bg-gradient-to-t from-brand-surface via-brand-surface/40 to-transparent"></div>
                               <div className="absolute bottom-6 left-6 flex items-center gap-4">
                                  <div className="w-16 h-16 bg-black border-2 border-brand-primary rounded-2xl p-2 shadow-2xl flex items-center justify-center">
                                     <img src={tournament.trophyIconUrl || 'https://api.dicebear.com/7.x/identicon/svg?seed=comp'} className="w-full h-full object-contain" />
                                  </div>
                                  <div>
                                     <h3 className="text-xl font-black italic text-white uppercase leading-none group-hover:text-brand-primary transition-colors">{tournament.name}</h3>
                                     <p className="text-[10px] font-black text-brand-primary mt-2 uppercase tracking-widest">{tournament.organizadorId === user.id ? 'Organizado por você' : 'Inscrições Abertas'}</p>
                                  </div>
                               </div>
                            </div>
                            <div className="p-8">
                               <div className="grid grid-cols-3 gap-4 mb-8">
                                  <div className="text-center">
                                     <p className="text-[8px] font-black text-brand-textMuted uppercase mb-1">Formato</p>
                                     <p className="text-xs font-black text-white uppercase">{tournament.experienceType}</p>
                                  </div>
                                  <div className="text-center border-x border-white/5">
                                     <p className="text-[8px] font-black text-brand-textMuted uppercase mb-1">Times</p>
                                     <p className="text-xs font-black text-white uppercase">16/32</p>
                                  </div>
                                  <div className="text-center">
                                     <p className="text-[8px] font-black text-brand-textMuted uppercase mb-1">Prêmio</p>
                                     <p className="text-xs font-black text-brand-primary uppercase">R$ 500</p>
                                  </div>
                               </div>
                               <button 
                                 onClick={() => onRequestRegistration(tournament)}
                                 className="w-full bg-brand-primary hover:bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                               >
                                 <Plus size={16} /> Solicitar Participação
                               </button>
                            </div>
                         </motion.div>
                      ))
                   }
                </div>
            </div>
          )}
          {activeTab === 'profile_edit' && (
              <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-300 pb-20">
                  <div className="bg-brand-surface p-8 rounded-2xl border border-brand-border shadow-2xl">
                      <h2 className="text-2xl font-black text-brand-text italic uppercase mb-8 flex items-center gap-3"><Edit className="text-brand-primary"/> Personalizar Atleta</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-6">
                              <div><label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Nickname Oficial</label><input value={editNickname} onChange={e=>setEditNickname(e.target.value)} className="w-full bg-black border border-brand-border rounded-xl p-3 text-white font-bold outline-none focus:border-brand-primary transition-all"/></div>
                              <div>
                                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Foto do Perfil (HD)</label>
                                  <div className="flex gap-3 items-center">
                                      <div className="w-16 h-16 rounded-xl bg-black border border-brand-border overflow-hidden shrink-0 flex items-center justify-center relative group">
                                          {editPhotoUrl ? <img src={editPhotoUrl} className="w-full h-full object-cover"/> : <Camera className="text-slate-700"/>}
                                          <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                              <Upload size={20}/>
                                              <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
                                          </label>
                                      </div>
                                      <input value={editPhotoUrl} onChange={e=>setEditPhotoUrl(e.target.value)} className="flex-1 bg-black border border-brand-border rounded-xl p-3 text-white text-[10px] outline-none" placeholder="Link da foto..."/>
                                  </div>
                              </div>
                          </div>
                      </div>
                      <div className="mt-10 pt-6 border-t border-white/5"><button onClick={handleUpdateProfileData} className="w-full bg-brand-primary hover:bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest"><Save size={20}/> Salvar Meu Perfil</button></div>
                  </div>
              </div>
          )}

          {activeTab === 'admin' && isTeamManager && (
            <div className="bg-brand-surface p-8 rounded-xl border border-brand-border max-w-2xl mx-auto animate-in fade-in">
              <h2 className="text-2xl font-black mb-8 flex items-center gap-2 italic uppercase"><Briefcase className="text-brand-primary"/> Gerenciar Clube</h2>
              <div className="space-y-6">
                <div><label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Nome Oficial do Time</label><input value={editTeamName} onChange={e=>setEditTeamName(e.target.value)} className="w-full bg-black border border-brand-border p-3 rounded-xl text-brand-text font-black text-lg outline-none focus:border-brand-primary"/></div>
                <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Logotipo do Clube (HD)</label>
                    <div className="flex gap-4 items-center">
                        <div className="w-20 h-20 bg-black rounded-xl border border-brand-border overflow-hidden flex items-center justify-center relative group shrink-0">
                            {editTeamLogo ? <img src={editTeamLogo} className="w-full h-full object-contain" /> : <Shield size={32} className="text-slate-700" />}
                            <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                <Upload size={20}/>
                                <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                            </label>
                        </div>
                        <input value={editTeamLogo} onChange={e=>setEditTeamLogo(e.target.value)} className="flex-1 bg-black border border-brand-border p-3 rounded-xl text-white text-xs outline-none focus:border-brand-primary" placeholder="Link direto do escudo..."/>
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Tamanho da Fonte Global</label>
                    <input 
                        type="range" 
                        min="10" 
                        max="24" 
                        value={settings.globalFontSize || 16} 
                        onChange={e => onUpdateSettings({ globalFontSize: parseInt(e.target.value) })} 
                        className="w-full accent-brand-primary"
                    />
                    <span className="text-white text-xs mt-2 block">{settings.globalFontSize || 16}px</span>
                </div>
                <button onClick={handleSaveTeamInfo} className="w-full bg-brand-primary text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest transform hover:scale-[1.01] transition-transform"><Save size={20}/> Salvar Dados do Clube</button>
              </div>
            </div>
          )}
          
          {activeTab === 'roster' && (
            <div className={`bg-brand-surface p-6 rounded-xl border border-brand-border animate-in fade-in ${!showVisualSettings ? 'lg:col-span-2' : ''}`}>
              <div className="mb-8 border-b border-brand-border pb-6">
                 <h2 className="text-2xl font-black text-brand-text italic uppercase flex items-center gap-2"><Users/> {isTeamManager ? 'Gestão de Elenco' : 'Companheiros de Equipe'}</h2>
                 {isTeamManager && (
                    <div className="space-y-6 mt-6">
                        <div className="bg-brand-surfaceHighlight p-6 rounded-2xl border border-brand-border space-y-4">
                            <h3 className="text-xs font-black text-brand-primary uppercase flex items-center gap-2"><Plus size={14}/> Adicionar Atleta Manual</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-brand-textMuted uppercase">Nome do Atleta</label>
                                    <input type="text" value={manualPlayerName} onChange={e => setManualPlayerName(e.target.value)} placeholder="Ex: Neymar Jr" className="w-full bg-black border border-brand-border rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-brand-primary" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-brand-textMuted uppercase">Posição (SIGLA)</label>
                                    <input type="text" value={manualPlayerPositions.join(',')} onChange={e => setManualPlayerPositions(e.target.value.split(',').map(s => s.trim()).filter(s => s))} placeholder="Ex: ST, CA" className="w-full bg-black border border-brand-border rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-brand-primary" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-brand-textMuted uppercase">URL da Foto</label>
                                    <div className="flex gap-2">
                                        <div className="w-10 h-10 rounded-lg bg-black border border-brand-border overflow-hidden shrink-0 flex items-center justify-center relative group">
                                            {manualPlayerPhoto ? <img src={manualPlayerPhoto} className="w-full h-full object-cover"/> : <Camera size={16} className="text-white/20"/>}
                                            <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                                <Upload size={14}/>
                                                <input type="file" hidden accept="image/*" onChange={handleManualPhotoUpload} />
                                            </label>
                                        </div>
                                        <input type="text" value={manualPlayerPhoto} onChange={e => setManualPlayerPhoto(e.target.value)} placeholder="Link..." className="flex-1 bg-black border border-brand-border rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-brand-primary" />
                                    </div>
                                </div>
                                <div className="flex items-end">
                                    <button onClick={handleAddManualPlayer} className="w-full bg-brand-primary text-white font-black py-2 rounded-xl text-xs uppercase shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                                        <Plus size={16}/> Adicionar
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-brand-surfaceHighlight p-6 rounded-2xl border border-brand-border flex flex-col gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-brand-textMuted uppercase ml-1 block">Processar Lista (POS - Nome)</label>
                            <textarea 
                                value={bulkPlayersText} 
                                onChange={e => setBulkPlayersText(e.target.value)} 
                                placeholder="ST - Jogador 1&#10;GK - Jogador 2" 
                                className="w-full bg-black border border-brand-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand-primary h-32"
                            />
                            <button onClick={handleBulkAddPlayers} className="w-full bg-brand-primary text-white font-black py-4 rounded-xl text-xs uppercase shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"><Plus size={16}/> Processar Lista</button>
                        </div>

                        {bulkPreviewPlayers.length > 0 && (
                            <div className="space-y-3 border-t border-brand-border pt-4">
                                <h3 className="text-xs font-black text-brand-primary uppercase">Pré-visualização</h3>
                                {bulkPreviewPlayers.map((p, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <input value={p.name} onChange={e => setBulkPreviewPlayers(prev => prev.map((item, i) => i === index ? {...item, name: e.target.value} : item))} className="flex-1 bg-black border border-brand-border rounded-xl px-4 py-2 text-sm text-white" />
                                        <input value={p.position} onChange={e => setBulkPreviewPlayers(prev => prev.map((item, i) => i === index ? {...item, position: e.target.value} : item))} className="w-24 bg-black border border-brand-border rounded-xl px-4 py-2 text-sm text-white" />
                                    </div>
                                ))}
                                <button onClick={handleConfirmBulkAdd} className="w-full bg-green-600 text-white font-black py-4 rounded-xl text-xs uppercase shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"><Check size={16}/> Confirmar Elenco</button>
                            </div>
                        )}
                    </div>
                </div>
              )}
            </div>
            {isRosterLoading ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-pulse">
                      {[1,2,3,4].map(i => <div key={i} className="bg-brand-surfaceHighlight border border-brand-border p-4 rounded-2xl h-24"></div>)}
                  </div>
              ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Comment: Ensured map item 'p' is typed as ClubPlayer to avoid property missing errors */}
                    {(roster as ClubPlayer[]).map((p: ClubPlayer, index: number) => (
                      <div key={`rosterView-${p.id}-${index}`} className="bg-brand-surfaceHighlight border border-brand-border p-4 rounded-2xl flex items-center gap-6 group">
                        <div className="relative group shrink-0">
                            <div className="w-20 h-20 rounded-2xl bg-black border border-brand-border overflow-hidden flex items-center justify-center relative shadow-2xl">
                                {p.photoUrl ? <img src={p.photoUrl} className="w-full h-full object-cover"/> : <UserIcon size={30} className="text-white/10"/>}
                            </div>
                            {isTeamManager && (
                                <label className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity rounded-2xl">
                                    <RefreshCw size={16} className="text-brand-primary"/>
                                    <input type="file" hidden accept="image/*" onChange={(e) => handleManualPhotoUpload(e, p.id)} />
                                </label>
                            )}
                        </div>
                        <div className="flex-1" onClick={() => handleAutoEscalar(p)}>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    {isTeamManager ? (
                                        <PlayerEditField 
                                            value={p.name} 
                                            onSave={(val) => handleUpdatePlayerQuick(p.id, { name: val })} 
                                            className="bg-transparent border-b border-transparent focus:border-brand-primary outline-none font-black text-brand-text uppercase italic text-xl w-64"
                                        />
                                    ) : (
                                        <p className="font-black text-brand-text uppercase italic text-xl">{p.name}</p>
                                    )}
                                    {p.tipo === 'sistema' ? (
                                        <span className="text-[8px] bg-brand-primary/20 text-brand-primary px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Sistema</span>
                                    ) : (
                                        <span className="text-[8px] bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Sem conta</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black text-brand-textMuted uppercase">Posições:</span>
                                    {isTeamManager ? (
                                        <PlayerEditField 
                                            value={p.position} 
                                            onSave={(val) => handleUpdatePlayerQuick(p.id, { position: val })} 
                                            className="bg-black border border-brand-border rounded-lg px-2 py-1 text-[10px] font-black text-white uppercase w-full outline-none focus:border-brand-primary placeholder-[#A0A0A0]"
                                            placeholder="Ex: ZG/VOL"
                                        />
                                    ) : (
                                        <span className="text-[10px] font-black text-brand-primary uppercase">[ {p.position} ]</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {isTeamManager && p.id !== user.id && (
                          <div className="flex gap-1">
                            {showMarket && p.tipo === 'manual' && (
                              <button 
                                onClick={() => {
                                  setTransferringManualPlayer(p);
                                  setTransferTargetTeamId('');
                                }} 
                                className="text-brand-primary/40 hover:text-brand-primary p-2"
                                title="Transferir para outro time"
                              >
                                <Send size={18}/>
                              </button>
                            )}
                            <button onClick={() => handleRemovePlayer(p.id)} className="text-red-500/40 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-brand-surface p-8 rounded-xl border border-brand-border max-xl mx-auto animate-in fade-in">
              <h2 className="text-2xl font-black mb-8 italic uppercase"><Lock className="text-brand-primary"/> Central de Segurança</h2>
              <div className="space-y-4">
                <input type="password" value={oldPass} onChange={e=>setOldPass(e.target.value)} placeholder="Senha Atual" className="w-full bg-black border border-brand-border p-3 rounded-xl text-white outline-none focus:border-brand-primary"/>
                <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Nova Senha" className="w-full bg-black border border-brand-border p-3 rounded-xl text-white outline-none focus:border-brand-primary"/>
                <input type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="Confirmar Nova Senha" className="w-full bg-black border border-brand-border p-3 rounded-xl text-white outline-none focus:border-brand-primary"/>
                <button onClick={async () => { if(newPass!==confirmPass) { toast.info('As senhas não coincidem'); return; } const res = await onUpdatePassword(oldPass, newPass); toast.info(res.msg); if(res.success) { setOldPass(''); setNewPass(''); setConfirmPass(''); } }} className="w-full bg-brand-primary text-white font-black py-4 rounded-xl shadow-lg uppercase tracking-widest mt-4 hover:bg-blue-600 transition-colors">Atualizar Senha de Acesso</button>
              </div>
            </div>
          )}

          {/* Modal de Transferência Manual */}
          {transferringManualPlayer && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-brand-surface w-full max-w-md rounded-2xl border border-brand-border p-8 animate-in zoom-in duration-200 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-white italic uppercase flex items-center gap-2"><Send className="text-brand-primary"/> Transferir Jogador</h3>
                  <button onClick={() => setTransferringManualPlayer(null)} className="text-brand-textMuted hover:text-white"><X size={24}/></button>
                </div>
                
                <div className="flex items-center gap-4 mb-8 bg-brand-surfaceHighlight p-4 rounded-xl border border-brand-border">
                   <div className="w-12 h-12 rounded-lg bg-black border border-brand-border overflow-hidden shrink-0 flex items-center justify-center">
                      {transferringManualPlayer.photoUrl ? <img src={transferringManualPlayer.photoUrl} className="w-full h-full object-cover"/> : <UserIcon size={20} className="opacity-20"/>}
                   </div>
                   <div className="min-w-0">
                     <p className="font-black text-white uppercase truncate">{transferringManualPlayer.name}</p>
                     <p className="text-[10px] font-bold text-brand-primary uppercase">{transferringManualPlayer.position}</p>
                   </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-brand-textMuted uppercase block tracking-widest pl-1">Selecionar Time de Destino</label>
                  <select 
                    value={transferTargetTeamId} 
                    onChange={e => setTransferTargetTeamId(e.target.value)} 
                    className="w-full bg-black border border-brand-border rounded-xl p-4 text-white font-bold outline-none focus:border-brand-primary appearance-none cursor-pointer"
                  >
                    <option value="">Selecione um time...</option>
                    {allTeams
                        .filter(t => t.id !== profile.teamId)
                        .map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>

                  <div className="pt-4 flex gap-3">
                    <button 
                      onClick={() => setTransferringManualPlayer(null)} 
                      className="flex-1 bg-brand-surfaceHighlight border border-brand-border text-white font-black py-4 rounded-xl uppercase text-xs hover:bg-brand-border transition-colors shadow-lg"
                    >
                      Cancelar
                    </button>
                    <button 
                      disabled={!transferTargetTeamId}
                      onClick={() => {
                        if (onTransferirManual && profile.teamId) {
                          onTransferirManual(transferringManualPlayer.id, profile.teamId, transferTargetTeamId);
                          setTransferringManualPlayer(null);
                        }
                      }} 
                      className={`flex-1 font-black py-4 rounded-xl uppercase text-xs shadow-lg transition-all ${!transferTargetTeamId ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50' : 'bg-brand-primary text-white hover:bg-blue-600'}`}
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerDashboard;