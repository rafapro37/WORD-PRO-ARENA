import React, { useState, useEffect, useMemo } from 'react';
import { toast } from '../src/lib/toast';
import { User, UserRole, UserStatus, PlanType, Advertisement, SocialLink, PlayerProfile, LoginLayoutConfig, NewsItem, Tournament, PlanConfig, League, ExperienceType, Team } from '../types';
import { ADMIN_CREDENTIALS, POSITIONS, PLAN_LIMITS } from '../constants';
import { generateId } from '../services/dataService';
import { hashPassword } from '../services/authService';
import { useLocale } from '../src/contexts/LocaleContext';
import LanguageSelector from '../components/LanguageSelector';
import { Shield, Trophy, Eye, Lock, Briefcase, Users, Upload, Camera, Check, LogIn, ChevronLeft, ChevronRight, Star, X, Info, FileText, Smartphone, MessageSquare, EyeOff, RefreshCw, Zap, Crown, Trash2, UserPlus, Play, Instagram, Facebook, Twitter, Youtube, Gamepad2, LinkIcon, Globe, Tag, Twitch, Music } from '../components/Icons';
import PlansModal from '../components/PlansModal'; 

interface LoginProps {
  onLogin: (user: User) => void;
  onRegister: (user: User, playerProfile?: PlayerProfile) => void;
  onResetPassword?: (username: string, newPass: string) => Promise<boolean>; 
  onBackToHome?: () => void;
  adminWhatsapp: string;
  supportButtonText?: string;
  systemName?: string;
  customLogoUrl?: string;
  customBackgroundUrl?: string;
  customBackgroundSize?: 'cover' | 'contain' | '100% 100%';
  bannerLogoUrl?: string; 
  ads: Advertisement[];
  news: NewsItem[]; 
  socialLinks?: SocialLink[];
  loginLayout?: LoginLayoutConfig;
  enableExternalCarousel?: boolean; 
  enableThemedBackground?: boolean; 
  tournaments?: Tournament[];
  leagues?: League[];
  teams: Team[];
  playerProfiles: PlayerProfile[];
  users: User[];
  planConfigs?: Record<PlanType, PlanConfig>;
  initialMode?: 'LOGIN' | 'REGISTER';
}

const Login: React.FC<LoginProps> = ({ 
    onLogin, onRegister, onResetPassword, onBackToHome, adminWhatsapp, supportButtonText = 'Suporte Técnico VIP', systemName = "PRO WORLD ARENA", customLogoUrl, customBackgroundUrl, customBackgroundSize, bannerLogoUrl, ads, news = [], socialLinks = [], loginLayout, enableExternalCarousel = true, enableThemedBackground = true, tournaments = [], leagues = [], teams = [], playerProfiles = [], users = [], planConfigs, initialMode = 'LOGIN'
}) => {
  const { T } = useLocale();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'VERIFY_2FA' | 'FORGOT_PASSWORD'>(initialMode);
  const [registerType, setRegisterType] = useState<'ORGANIZER' | 'PLAYER' | 'TEAM_MANAGER'>('PLAYER');
  const [selectedLigaId, setSelectedLigaId] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false); 
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [regTermsAccepted, setRegTermsAccepted] = useState(false);
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginRole, setLoginRole] = useState<UserRole>(UserRole.PLAYER); // NEW: Estado para o papel de login
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [error, setError] = useState('');

  // Register Shared State
  const [regStep, setRegStep] = useState(1);
  const [regName, setRegName] = useState('');
  const [regUser, setRegUser] = useState('');
  const [regEmail, setRegEmail] = useState(''); 
  const [regPass, setRegPass] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');

  // Register Organizer State
  const [regPlan, setRegPlan] = useState<PlanType>(PlanType.FREE);

  // Register Player State
  const [regNick, setRegNick] = useState('');
  const [regPhotoUrl, setRegPhotoUrl] = useState('');
  const [searchQueryNick, setSearchQueryNick] = useState('');
  const [regPlatform, setRegPlatform] = useState<string[]>([]);
  const [regPos, setRegPos] = useState<string[]>([]);
  const [regExperience, setRegExperience] = useState<ExperienceType | null>(null);
  
  // Shared Team Info
  const [regTeamName, setRegTeamName] = useState('');
  const [regTeamId, setRegTeamId] = useState('');
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  const [currentPlanIndex, setCurrentPlanIndex] = useState(1); 
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const PLANS_LIST = [PlanType.FREE, PlanType.PRO, PlanType.ELITE];

  // Team Library (Fallback for X1)
  const TEAM_LIBRARY = useMemo(() => [
    { id: 't-rma', name: 'Real Madrid', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=rma' },
    { id: 't-mci', name: 'Manchester City', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=mci' },
    { id: 't-ars', name: 'Arsenal', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=ars' },
    { id: 't-bay', name: 'Bayern Munich', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=bay' },
    { id: 't-psg', name: 'PSG', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=psg' },
    { id: 't-liv', name: 'Liverpool', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=liv' },
    { id: 't-bar', name: 'Barcelona', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=bar' },
    { id: 't-int', name: 'Inter Milan', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=int' },
    { id: 't-juv', name: 'Juventus', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=juv' },
    { id: 't-fla', name: 'Flamengo', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=fla' },
    { id: 't-pal', name: 'Palmeiras', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=pal' },
    { id: 't-spo', name: 'São Paulo', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=spo' },
  ], []);

  const availableTeams = useMemo(() => {
    if (!selectedLigaId) return TEAM_LIBRARY;
    
    // Get unique teams from all tournaments in this league
    const leagueTeamsFromTournaments = teams.filter(t => t.ligaId === selectedLigaId).map(t => ({
      id: t.id,
      name: t.name,
      logo: t.logoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${t.id}`
    }));

    // If no teams registered by the organizer, use the default library
    return leagueTeamsFromTournaments.length > 0 ? leagueTeamsFromTournaments : TEAM_LIBRARY;
  }, [selectedLigaId, teams, TEAM_LIBRARY]);

  const filteredTeamsForSearch = useMemo(() => {
    const query = teamSearchQuery.toLowerCase();
    return availableTeams.filter(t => t.name.toLowerCase().includes(query));
  }, [availableTeams, teamSearchQuery]);

  const isTeamOccupied = (teamId: string) => {
    if (!selectedLigaId) return false;
    // Check if any player profile is already using this team in this league
    return (playerProfiles || []).some(profile => 
        profile.ligaId === selectedLigaId && profile.teamId === teamId
    );
  };

  useEffect(() => {
    let interval: any;
    if (enableExternalCarousel && mode === 'LOGIN') {
        interval = setInterval(() => {
            setCurrentPlanIndex((prev) => (prev + 1) % PLANS_LIST.length);
            if (ads.length > 0) setCurrentAdIndex((prev) => (prev + 1) % ads.length);
            if (news.length > 0) setCurrentNewsIndex((prev) => (prev + 1) % news.length);
        }, 5000);
    }
    return () => clearInterval(interval);
  }, [enableExternalCarousel, mode, ads.length, news.length]);

  const isValidEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Usar os usuários passados por prop para garantir sincronização imediata
    const storedUsers = users || [];
    const hashedPassword = await hashPassword(password);
    
    const user = storedUsers.find((u: User) => 
        (u.username?.toLowerCase() === username.toLowerCase() || u.email?.toLowerCase() === username.toLowerCase()) && 
        (u.password === hashedPassword || u.password === password)
    );
    
    if (user) {
        if (user.role === UserRole.ORGANIZER && user.status === UserStatus.PENDING) { 
            setError(T.auth.waitingApproval); 
            return; 
        }
        onLogin(user);
    } else {
        console.log("Usuário não encontrado. Verificando credenciais de admin:", { isAdminLogin, username });
        if (isAdminLogin && username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            onLogin({ id: 'admin', name: 'Administrador', username: 'admin', role: UserRole.ADMIN, plan: PlanType.ELITE, emailVerified: true });
        } else {
            setError(T.auth.wrongCredentials);
        }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(regEmail)) {
        setError('Insira um endereço de e-mail válido.');
        return;
    }

    // Usar prop users para validar email existente
    const emailExists = users.some((u: User) => u.email?.toLowerCase() === regEmail.toLowerCase());
    if (emailExists) {
        setError('Este e-mail já está sendo utilizado.');
        return;
    }

    if (regPass !== regConfirm) {
        setError('As senhas não coincidem.');
        return;
    }

    const userId = generateId();
    const hashedPassword = await hashPassword(regPass);
    
    // Definir role corretamente incluindo TEAM_MANAGER
    let userRole: UserRole;
    if (registerType === 'PLAYER') userRole = UserRole.PLAYER;
    else if (registerType === 'TEAM_MANAGER') userRole = UserRole.TEAM_MANAGER;
    else userRole = UserRole.ORGANIZER;
    
    const selectedLeague = leagues.find(l => l.id === selectedLigaId);
    
    const newUser: User = { 
        id: userId, 
        organizadorId: selectedLeague?.organizadorId,
        name: regName, 
        username: regUser, 
        email: regEmail, 
        emailVerified: true, 
        password: hashedPassword, 
        role: userRole, 
        status: UserStatus.APPROVED,  // todos aprovados automaticamente
        plan: userRole === UserRole.ORGANIZER ? regPlan : PlanType.FREE, 
        whatsapp: regWhatsapp 
    };

    onRegister(newUser, registerType !== 'ORGANIZER' 
        ? { 
            userId, 
            nickname: regNick || regName || regUser, 
            photoUrl: regPhotoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(regNick || regUser)}`,
            platforms: regPlatform, 
            positions: regPos, 
            mode: regExperience === ExperienceType.PRO_CLUBS ? 'VIRTUAL' : 'REAL', 
            teamName: regTeamName, 
            teamId: regTeamId,
            teamLogoUrl: regPhotoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(regNick || regUser)}`,
            trophies: [],
            ligaId: selectedLigaId || undefined
        } 
        : undefined
    );
    
    newUser.experiencePreference = regExperience || undefined;
    
    toast.success("Cadastro realizado com sucesso! Você já pode entrar.");
    setMode('LOGIN');
  };

  const getSocialIcon = (platform: string) => {
      switch(platform) {
          case 'INSTAGRAM': return <Instagram size={20} />;
          case 'FACEBOOK': return <Facebook size={20} />;
          case 'TWITTER': return <Twitter size={20} />;
          case 'YOUTUBE': return <Youtube size={20} />;
          case 'DISCORD': return <Gamepad2 size={20} />;
          case 'WEBSITE': return <Globe size={20} />;
          case 'WHATSAPP': return <MessageSquare size={20} />;
          case 'TWITCH': return <Twitch size={20} />;
          case 'TIKTOK': return <Music size={20} />;
          case 'KICK': return <Play size={20} />;
          default: return <LinkIcon size={20} />;
      }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col md:flex-row bg-[var(--bg-global)] text-sans" style={{ backgroundColor: 'var(--bg-global)', color: 'var(--texto-global)' }}>
        
        {/* === BRANDING SECTION === */}
        <div className="flex-1 relative z-10 p-10 md:p-20 flex flex-col justify-between overflow-hidden">
            <div 
                className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
                style={{ backgroundImage: `url(${customBackgroundUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1936&auto=format&fit=crop'})` }}
            ></div>
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-[var(--bg-main)] via-[var(--bg-main)]/80 to-transparent"></div>
            
            <div className="relative z-10 animate-in slide-in-from-left duration-700">
                <div className="flex items-center gap-6 mb-12">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[var(--primary)] blur-[30px] opacity-20 rounded-full"></div>
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-[var(--bg-card)]/80 backdrop-blur-md rounded-3xl border-2 border-[var(--primary)]/30 p-4 flex items-center justify-center shadow-[0_0_40px_rgba(255,106,0,0.2)] hover:scale-105 transition-transform duration-500 overflow-hidden">
                            {customLogoUrl ? (
                                <img src={customLogoUrl} className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" alt="Logo" />
                            ) : (
                                <Shield size={60} className="text-[var(--primary)] drop-shadow-[0_0_15px_rgba(255,106,0,0.5)]" />
                            )}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter leading-none">
                            {systemName.split(' ')[0]} <span className="text-[var(--primary)]">{systemName.split(' ').slice(1).join(' ')}</span>
                        </h2>
                        <p className="text-[var(--text-secondary)] font-bold tracking-[0.3em] text-xs md:text-sm mt-1 uppercase">Portal Oficial</p>
                    </div>
                </div>

                <div className="inline-flex items-center gap-2 bg-[var(--bg-card)]/80 backdrop-blur px-4 py-1.5 rounded-full border border-white/10 mb-10 shadow-lg">
                    <div className="w-2 h-2 bg-[var(--success)] rounded-full animate-pulse shadow-[0_0_10px_var(--success)]"></div>
                    <span className="text-[10px] md:text-xs font-black text-[var(--text-main)] uppercase tracking-widest">Sistema Online</span>
                </div>

                <div className="max-w-2xl">
                    <h1 className="text-5xl md:text-7xl font-bold text-[var(--text-main)] leading-[1] tracking-tight drop-shadow-2xl">
                        A gestão profissional<br />
                        <span className="text-[var(--primary)] uppercase">
                            do seu campeonato
                        </span>
                    </h1>
                </div>
            </div>

            {enableExternalCarousel && mode === 'LOGIN' && (
                <div className="relative z-10 mt-auto flex flex-col gap-4 animate-in fade-in duration-1000 delay-500">
                    
                    {/* NEWS SECTION */}
                    {news.length > 0 && (
                        <div className="bg-[var(--primary)]/10 backdrop-blur-md border border-[var(--primary)]/30 rounded-2xl p-4 max-w-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <Info size={14} className="text-[var(--primary)]" />
                                <p className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest">Últimas Notícias</p>
                            </div>
                            <div className="animate-in slide-in-from-right-2">
                                <h4 className="text-[var(--text-main)] font-bold text-sm line-clamp-1">{news[currentNewsIndex].title}</h4>
                                <p className="text-[var(--text-secondary)] text-[10px] mt-1 line-clamp-2">{news[currentNewsIndex].content}</p>
                            </div>
                        </div>
                    )}

                    {/* SYSTEM HIGHLIGHT / STATS SECTION */}
                    <div className="bg-white/5 backdrop-blur-md border border-[var(--border)] rounded-2xl p-4 max-w-sm">
                        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                            <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest flex items-center gap-1.5">
                                <Trophy size={11} /> Arena em Números
                            </span>
                            <span className="text-[8px] bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded font-bold uppercase">
                                Realtime
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-black/20 p-2 rounded-xl border border-white/5">
                                <p className="text-sm font-black text-white italic">{tournaments.length}</p>
                                <p className="text-[8px] text-[var(--text-secondary)] uppercase font-semibold">Torneios</p>
                            </div>
                            <div className="bg-black/20 p-2 rounded-xl border border-white/5">
                                <p className="text-sm font-black text-white italic">{teams.length}</p>
                                <p className="text-[8px] text-[var(--text-secondary)] uppercase font-semibold">Clubes</p>
                            </div>
                            <div className="bg-black/20 p-2 rounded-xl border border-white/5">
                                <p className="text-sm font-black text-white italic">{playerProfiles.length}</p>
                                <p className="text-[8px] text-[var(--text-secondary)] uppercase font-semibold">Atletas</p>
                            </div>
                        </div>
                        {tournaments.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-white/5">
                                <p className="text-[9px] text-[var(--text-secondary)] uppercase font-bold tracking-wider mb-1.5">Destaque Ativo:</p>
                                <div className="flex items-center justify-between bg-black/20 p-2.5 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <p className="text-[10px] font-extrabold text-[#f2f2f2] uppercase truncate max-w-[150px]">{tournaments[0].name}</p>
                                    </div>
                                    <span className="text-[8px] font-extrabold text-[var(--primary)] uppercase tracking-wider">{tournaments[0].format || 'Liga'}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* PLANS SECTION */}
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 max-w-sm">
                        <div className="flex justify-between items-center mb-4">
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Planos e Valores</p>
                             <div className="flex gap-1">
                                {PLANS_LIST.map((_, i) => <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentPlanIndex ? 'w-4 bg-brand-primary' : 'w-1 bg-slate-700'}`}></div>)}
                             </div>
                        </div>
                        {(() => {
                            const planType = PLANS_LIST[currentPlanIndex];
                            const price = planConfigs?.[planType]?.price || 'R$ 0,00';
                            return (
                                <div className="animate-in slide-in-from-right-2">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-[var(--text-main)] font-black italic text-lg leading-tight">
                                            {PLAN_LIMITS[planType].maxTeams === 999 ? 'Gestão Ilimitada' : `Planos Profissionais`}
                                        </h3>
                                        <span className="bg-[var(--primary)] text-[var(--text-main)] text-[10px] font-black px-2 py-1 rounded shadow-lg shadow-[var(--primary)]/20">{price}</span>
                                    </div>
                                    <p className="text-[var(--text-secondary)] text-xs mt-2">Plano <span className="text-[var(--primary)] font-bold">{planType}</span>: {PLAN_LIMITS[planType].maxTeams === 999 ? 'Tudo o que você precisa sem limites.' : `Gerencie até ${PLAN_LIMITS[planType].maxTeams} times com ferramentas oficiais.`}</p>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>

        {/* === FORM SECTION === */}
        <div className="w-full md:w-[550px] bg-[var(--bg-main)]/95 backdrop-blur-3xl border-l border-[var(--border)] flex flex-col relative z-20 h-full overflow-y-auto custom-scrollbar">
            {onBackToHome && (
                <div className="p-6 md:px-12 flex items-center justify-between">
                    <button 
                        onClick={onBackToHome}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-white transition-colors group"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Voltar para o início
                    </button>
                    <LanguageSelector variant="compact" dropDirection="down" />
                </div>
            )}
            {!onBackToHome && (
                <div className="p-6 md:px-12 flex justify-end">
                    <LanguageSelector variant="compact" dropDirection="down" />
                </div>
            )}
            <div className="p-8 md:p-12 flex-1 flex flex-col">
                <div className="mb-10 text-center md:text-left">
                    <h2 className="text-2xl font-bold text-[var(--text-main)] uppercase tracking-tight">{mode === 'LOGIN' ? 'Painel de Acesso' : 'Crie sua Conta'}</h2>
                    <p className="text-[var(--text-secondary)] text-sm mt-2">{mode === 'LOGIN' ? 'Gerencie ligas e competições com ferramentas profissionais.' : 'Complete os dados para começar a gerenciar seu perfil.'}</p>
                </div>

                {/* Role Selection (Only shown during Register) */}
                {mode === 'REGISTER' && regStep === 1 && (
                    <div className="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                        {[
                            { id: UserRole.PLAYER, icon: Users, label: 'JOGADOR', description: 'Atleta que compete em ligas' },
                            { id: UserRole.TEAM_MANAGER, icon: Shield, label: 'MANAGER', description: 'Gerente de time' }
                        ].map((role) => (
                            <button 
                                key={role.id} 
                                type="button"
                                onClick={() => setRegisterType(role.id as any)}
                                className={`flex-1 flex flex-col items-center justify-center py-4 rounded-xl transition-all duration-300 ${
                                    registerType === role.id
                                    ? 'bg-[var(--primary)] text-[var(--text-main)] shadow-[0_5px_15_rgba(255,106,0,0.3)]' 
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-white/5'
                                }`}
                            >
                                <role.icon size={18} className="mb-1.5"/>
                                <span className="text-[9px] font-black tracking-widest">{role.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* LOGIN FORM */}
                {mode === 'LOGIN' ? (
                    <form onSubmit={handleLoginSubmit} className="space-y-6 animate-in slide-in-from-bottom-4">
                        <div className="space-y-4">
                            <div className="relative">
                                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-2 block">Usuário ou E-mail</label>
                                <div className="absolute left-4 top-[38px] text-[var(--text-secondary)]"><Users size={18}/></div>
                                <input 
                                    type="text" 
                                    value={username} 
                                    onChange={e=>setUsername(e.target.value)} 
                                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl py-4 pl-12 pr-4 text-[var(--text-main)] text-sm focus:border-[var(--primary)] outline-none transition-all placeholder:text-[var(--text-secondary)]/30" 
                                    placeholder="Digite seu login"
                                />
                            </div>
                            <div className="relative">
                                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-2 block">Sua Senha</label>
                                <div className="absolute left-4 top-[38px] text-[var(--text-secondary)]"><Lock size={18}/></div>
                                <input 
                                    type={showLoginPass ? "text" : "password"} 
                                    value={password} 
                                    onChange={e=>setPassword(e.target.value)} 
                                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl py-4 pl-12 pr-12 text-[var(--text-main)] text-sm focus:border-[var(--primary)] outline-none transition-all placeholder:text-[var(--text-secondary)]/30" 
                                    placeholder="••••••••"
                                />
                                <button type="button" onClick={()=>setShowLoginPass(!showLoginPass)} className="absolute right-4 top-[38px] text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors">
                                    {showLoginPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                                </button>
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-xs font-bold text-center bg-red-500/10 p-4 rounded-xl border border-red-500/20 leading-relaxed uppercase tracking-tighter">{error}</p>}

                        <div className="flex justify-between items-center px-1">
                            <button type="button" onClick={()=>setIsAdminLogin(!isAdminLogin)} className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isAdminLogin ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--primary)]'}`}>
                                {isAdminLogin ? T.auth.adminMode : T.auth.adminAccess}
                            </button>
                            <button type="button" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">Esqueci minha senha</button>
                        </div>

                        <button type="submit" className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--text-main)] font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 uppercase tracking-widest flex items-center justify-center gap-3">
                            <LogIn size={18}/> Acessar Arena
                        </button>

                        {adminWhatsapp && (
                            <a 
                                href={`https://wa.me/${adminWhatsapp.replace(/\D/g, '')}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-full bg-[var(--success)]/10 hover:bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/30 font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
                            >
                                <MessageSquare size={14} /> {supportButtonText}
                            </a>
                        )}
                        
                        <div className="text-center pt-4 border-t border-[var(--border)]">
                            <span className="text-[var(--text-secondary)] text-[11px] font-bold uppercase tracking-widest">Ainda não tem acesso? </span>
                            <button type="button" onClick={()=>setMode('REGISTER')} className="text-[var(--primary)] text-[11px] font-black uppercase tracking-widest hover:underline ml-1">Cadastre-se grátis</button>
                        </div>
                    </form>
                ) : (
                    /* REGISTER FORM */
                    <div className="space-y-6 animate-in slide-in-from-bottom-4">
                        
                        {/* STEP 1: Role and/or Experience Selection */}
                        {regStep === 1 && (
                            <div className="space-y-8">
                                {registerType === 'ORGANIZER' ? (
                                    <div className="space-y-4">
                                        <div className="bg-white/5 p-8 rounded-3xl border border-white/5 text-center">
                                            <div className="w-16 h-16 bg-brand-primary/20 rounded-2xl mx-auto flex items-center justify-center mb-4">
                                                <Shield className="text-brand-primary" size={32} />
                                            </div>
                                            <h3 className="text-lg font-black text-white uppercase italic">Perfil Organizador</h3>
                                            <p className="text-xs text-slate-500 mt-2">Você terá ferramentas completas para criar ligas, gerenciar mercado e organizar campeonatos profissionais.</p>
                                        </div>
                                        <button 
                                            onClick={() => setRegStep(3)} 
                                            className="w-full bg-brand-primary text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 group"
                                        >
                                            Continuar Cadastro <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                ) : registerType === 'TEAM_MANAGER' ? (
                                    <div className="space-y-4">
                                        <div className="bg-white/5 p-8 rounded-3xl border border-white/5 text-center">
                                            <div className="w-16 h-16 bg-brand-primary/20 rounded-2xl mx-auto flex items-center justify-center mb-4">
                                                <Shield className="text-brand-primary" size={32} />
                                            </div>
                                            <h3 className="text-lg font-black text-white uppercase italic">Perfil Manager</h3>
                                            <p className="text-xs text-slate-500 mt-2">Você gerencia um time dentro de uma federação ou campeonato.</p>
                                        </div>
                                        <button 
                                            onClick={() => setRegStep(3)} 
                                            className="w-full bg-brand-primary text-white font-black py-5 rounded-2xl uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 group"
                                        >
                                            Continuar Cadastro <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="text-center">
                                            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Escolha sua experiência</h3>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Isso definirá suas modalidades disponíveis</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-4">
                                            <button 
                                                onClick={() => { setRegExperience(ExperienceType.X1); setRegStep(2); }}
                                                className="bg-white/5 border border-white/10 p-6 rounded-3xl text-left group hover:bg-brand-primary hover:border-brand-primary transition-all duration-300"
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-all">
                                                        <Gamepad2 className="text-white" size={28} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-black text-white uppercase italic group-hover:text-black">🏆 Liga X1</h4>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-black/60">Competições individuais diretas</p>
                                                    </div>
                                                </div>
                                            </button>

                                            <button 
                                                onClick={() => { setRegExperience(ExperienceType.PRO_CLUBS); setRegStep(2); }}
                                                className="bg-white/5 border border-white/10 p-6 rounded-3xl text-left group hover:bg-brand-primary hover:border-brand-primary transition-all duration-300"
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-all">
                                                        <Users className="text-white" size={28} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-black text-white uppercase italic group-hover:text-black">👥 Pro Clubs (11x11)</h4>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-black/60">Competições profissionais em equipe</p>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STEP 2: Contextual Step (X1 Teams / Pro Clubs Positions) */}
                        {regStep === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4">
                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-2 block">
                                        {regExperience === ExperienceType.X1 ? 'Escolha a liga onde deseja competir' : 'Escolha sua federação'}
                                    </label>
                                    <select 
                                        value={selectedLigaId} 
                                        onChange={e => setSelectedLigaId(e.target.value)}
                                        className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-[var(--text-main)] text-sm outline-none focus:border-[var(--primary)] cursor-pointer font-bold"
                                    >
                                        <option value="">Buscar federação/liga...</option>
                                        {leagues.filter(l => l.experienceType === regExperience).map(l => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {regExperience === ExperienceType.X1 ? (
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 block">Escolha seu Time</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                placeholder="🔍 Pesquisar time..." 
                                                value={teamSearchQuery}
                                                onChange={e => setTeamSearchQuery(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white outline-none focus:border-brand-primary"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                                            {filteredTeamsForSearch.map(team => {
                                                const occupied = isTeamOccupied(team.id);
                                                return (
                                                    <button 
                                                        key={team.id}
                                                        type="button"
                                                        disabled={occupied}
                                                        onClick={() => { setRegTeamId(team.id); setRegTeamName(team.name); }}
                                                        className={`p-4 rounded-2xl border transition-all text-left flex items-center gap-3 ${
                                                            regTeamId === team.id 
                                                            ? 'bg-brand-primary border-brand-primary shadow-lg' 
                                                            : occupied 
                                                                ? 'opacity-40 grayscale cursor-not-allowed bg-black/20 border-white/5' 
                                                                : 'bg-white/5 border-white/10 hover:border-brand-primary'
                                                        }`}
                                                    >
                                                        <div className="w-10 h-10 bg-black rounded-lg p-1">
                                                            <img src={team.logo} className="w-full h-full object-contain" alt={team.name} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className={`text-[10px] font-black uppercase truncate ${regTeamId === team.id ? 'text-white' : 'text-slate-300'}`}>{team.name}</p>
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${occupied ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                                                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">{occupied ? '🔴 Ocupado' : '🟢 Disponível'}</span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 block">Escolha sua posição principal</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {['GOL', 'ZAG', 'ALA', 'VOL', 'MEI', 'SA', 'ATA'].map(pos => (
                                                <button 
                                                    key={pos}
                                                    type="button"
                                                    onClick={() => setRegPos([pos])}
                                                    className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${regPos.includes(pos) ? 'bg-brand-primary border-brand-primary text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
                                                >
                                                    ⚽ {pos}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setRegStep(1)} type="button" className="flex-1 bg-white/5 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] border border-white/10">Voltar</button>
                                    <button 
                                        onClick={() => setRegStep(4)} 
                                        type="button" 
                                        className="flex-[2] bg-brand-primary text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] shadow-xl disabled:opacity-50"
                                        disabled={!selectedLigaId || (regExperience === ExperienceType.X1 && !regTeamId) || (regExperience === ExperienceType.PRO_CLUBS && regPos.length === 0)}
                                    >
                                        Próximo Passo
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* NEW STEP 3: Account Details (Swapped to Step 3 for Organizers or later for Players) */}
                        {regStep === 3 && (
                            <div className="space-y-5 animate-in slide-in-from-right-4">
                                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 text-center mb-4">
                                    <h3 className="text-lg font-black text-white italic uppercase">Dados de Acesso</h3>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Crie suas credenciais de segurança</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-1 block">Seu Nome</label>
                                        <input type="text" placeholder="Ex: João" value={regName} onChange={e=>setRegName(e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-white text-sm focus:border-[var(--primary)] outline-none" required/>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-1 block">WhatsApp</label>
                                        <input type="text" placeholder="(11) 99999-9999" value={regWhatsapp} onChange={e=>setRegWhatsapp(e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-white text-sm focus:border-[var(--primary)] outline-none" required/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-1 block">Usuário (Nome da conta)</label>
                                        <input type="text" placeholder="Login único" value={regUser} onChange={e=>setRegUser(e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-white text-sm focus:border-[var(--primary)] outline-none" required/>
                                        {regUser && (
                                            <div className="text-[9px] mt-1 font-bold">
                                                {users.some(u => u.username?.toLowerCase() === regUser.trim().toLowerCase()) ? (
                                                    <span className="text-red-500">❌ Usuário já cadastrado</span>
                                                ) : (
                                                    <span className="text-emerald-400">✅ Nome disponível</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-1 block">E-mail</label>
                                        <input type="email" placeholder="seu@email.com" value={regEmail} onChange={e=>setRegEmail(e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-white text-sm focus:border-[var(--primary)] outline-none" required/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-1 block">Senha</label>
                                        <input type="password" placeholder="••••••••" value={regPass} onChange={e=>setRegPass(e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-white text-sm focus:border-[var(--primary)] outline-none" required/>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-1 block">Confirmar</label>
                                        <input type="password" placeholder="••••••••" value={regConfirm} onChange={e=>setRegConfirm(e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-white text-sm focus:border-[var(--primary)] outline-none" required/>
                                    </div>
                                </div>

                                {registerType === 'ORGANIZER' && (
                                    <div className="pt-4">
                                        <label className="text-[10px] font-black text-brand-primary uppercase tracking-widest ml-1 mb-2 block">Seu Plano de Gestão</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[PlanType.FREE, PlanType.PRO].map(p => (
                                                <button 
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setRegPlan(p)}
                                                    className={`p-4 rounded-2xl border text-left transition-all ${regPlan === p ? 'bg-brand-primary border-brand-primary text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:border-brand-primary'}`}
                                                >
                                                    <p className="text-[10px] font-black uppercase tracking-widest">{p}</p>
                                                    <p className="text-lg font-black italic">{planConfigs?.[p]?.price || 'Grátis'}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setRegStep(registerType === 'PLAYER' ? 4 : 1)} type="button" className="flex-1 bg-white/5 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] border border-white/10">Voltar</button>
                                    <button 
                                        onClick={handleRegisterSubmit}
                                        type="button" 
                                        className="flex-[2] bg-brand-primary text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] transition-all"
                                        disabled={!regUser || !regPass || !regEmail || (regPass !== regConfirm) || users.some(u => u.username?.toLowerCase() === regUser.trim().toLowerCase())}
                                    >
                                        Finalizar Cadastro 🎮
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* NEW STEP 4: Nickname (Shown after Step 2 for Players) */}
                        {regStep === 4 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4">
                                <div className="bg-white/5 p-8 rounded-3xl border border-white/5 text-center">
                                    <div className="w-20 h-20 bg-brand-primary/20 rounded-full mx-auto flex items-center justify-center mb-6">
                                        <UserPlus className="text-brand-primary" size={40} />
                                    </div>
                                    <h3 className="text-xl font-black text-white italic uppercase">Defina sua Identidade</h3>
                                    <p className="text-xs text-slate-500 mt-2">Este será o seu nome de exibição em todas as competições e rankings.</p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-2 block">Nickname / Gamertag (Nome de Exibição)</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            placeholder="Ex: RAFAEL_PRO_10" 
                                            value={regNick} 
                                            onChange={e => setRegNick(e.target.value)} 
                                            className="w-full bg-brand-surface border border-brand-border rounded-2xl p-4 text-white text-lg font-black uppercase text-center focus:border-brand-primary outline-none"
                                        />
                                        {regNick && (
                                            <div className="text-center text-[10px] mt-2 font-bold uppercase tracking-wide">
                                                {playerProfiles.some(p => p.nickname?.toLowerCase() === regNick.trim().toLowerCase()) ? (
                                                    <span className="text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">❌ Este nome de exibição já está em uso</span>
                                                ) : (
                                                    <span className="text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">✅ Nome de exibição disponível!</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Campo Pesquisar Disponibilidade específico */}
                                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3">
                                    <label className="text-[10px] font-black text-brand-textMuted uppercase tracking-widest block">🔍 Consultar Disponibilidade de Nome</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Digite um nome para testar..." 
                                            value={searchQueryNick} 
                                            onChange={e => setSearchQueryNick(e.target.value)} 
                                            className="flex-1 bg-black/35 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-brand-primary font-bold uppercase"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                if(!searchQueryNick.trim()) return;
                                                const isUsed = playerProfiles.some(p => p.nickname?.toLowerCase() === searchQueryNick.trim().toLowerCase());
                                                toast.info(isUsed ? `O nome "${searchQueryNick.trim().toUpperCase()}" já está em uso.` : `O nome "${searchQueryNick.trim().toUpperCase()}" está livre!`);
                                            }}
                                            className="bg-brand-primary hover:bg-brand-primary/80 text-white font-bold px-4 rounded-xl text-xs uppercase transition-all"
                                        >
                                            Pesquisar
                                        </button>
                                    </div>
                                </div>

                                {/* UPLOAD DE ESCUDO PERSONALIZADO */}
                                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3">
                                    <label className="text-[10px] font-black text-brand-primary uppercase tracking-widest block text-center">🛡️ Escudo Personalizado</label>
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-20 h-20 bg-black/40 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center relative shadow-lg">
                                            {regPhotoUrl ? (
                                                <img src={regPhotoUrl} className="w-full h-full object-cover" alt="Escudo escolhido" />
                                            ) : (
                                                <div className="text-center p-2 flex flex-col items-center justify-center">
                                                    <Shield size={28} className="text-slate-500 mb-1" />
                                                    <span className="text-[8px] text-slate-500 font-extrabold uppercase">Padrão</span>
                                                </div>
                                            )}
                                        </div>
                                        <label className="cursor-pointer bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all">
                                            📁 Enviar Escudo Personalizado
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={e => {
                                                    const file = e.target.files?.[0];
                                                    if(file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setRegPhotoUrl(reader.result as string);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                hidden 
                                            />
                                        </label>
                                        {regPhotoUrl && (
                                            <button 
                                                onClick={() => setRegPhotoUrl('')} 
                                                type="button" 
                                                className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline"
                                            >
                                                Remover escudo personalizado
                                            </button>
                                        )}
                                        <p className="text-[9px] text-slate-500 uppercase font-bold text-center italic leading-tight">Se não enviar escudo, usaremos o escudo padrão do sistema para o seu perfil e clube.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 pt-2">
                                    <input 
                                        type="checkbox" 
                                        id="terms" 
                                        checked={regTermsAccepted} 
                                        onChange={e => setRegTermsAccepted(e.target.checked)}
                                        className="mt-1 w-5 h-5 rounded border-white/10 bg-white/5 accent-brand-primary cursor-pointer"
                                    />
                                    <label htmlFor="terms" className="text-[10px] text-slate-500 font-bold leading-tight uppercase">
                                        Aceito os <button type="button" onClick={() => setShowTermsModal(true)} className="text-brand-primary underline">Termos e Condições</button> oficiais da arena.
                                    </label>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setRegStep(2)} type="button" className="flex-1 bg-white/5 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] border border-white/10 w-full">Voltar</button>
                                    <button 
                                        onClick={() => setRegStep(3)} 
                                        type="button" 
                                        className="flex-[2] bg-brand-primary text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] shadow-xl w-full"
                                        disabled={!regNick || playerProfiles.some(p => p.nickname?.toLowerCase() === regNick.trim().toLowerCase())}
                                    >
                                        Continuar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 5: Finalization (Organizer) */}
                        {regStep === 5 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4">
                                <div className="bg-white/5 p-8 rounded-3xl border border-white/5 text-center">
                                    <div className="w-20 h-20 bg-brand-primary/20 rounded-full mx-auto flex items-center justify-center mb-6">
                                        <Zap className="text-brand-primary" size={40} />
                                    </div>
                                    <h3 className="text-xl font-black text-white italic uppercase">Pronto para Organizar?</h3>
                                    <p className="text-xs text-slate-500 mt-2">Você terá acesso imediato às ferramentas de gestão após o cadastro.</p>
                                </div>

                                <div className="flex items-start gap-3 pt-2">
                                    <input 
                                        type="checkbox" 
                                        id="terms-org" 
                                        checked={regTermsAccepted} 
                                        onChange={e => setRegTermsAccepted(e.target.checked)}
                                        className="mt-1 w-5 h-5 rounded border-white/10 bg-white/5 accent-brand-primary cursor-pointer"
                                    />
                                    <label htmlFor="terms-org" className="text-[10px] text-slate-500 font-bold leading-tight uppercase">
                                        Aceito os <button type="button" onClick={() => setShowTermsModal(true)} className="text-brand-primary underline">Termos do Organizador</button>
                                    </label>
                                </div>

                                {error && <p className="text-red-500 text-[10px] font-black text-center bg-red-500/10 p-4 rounded-xl border border-red-500/20 uppercase">{error}</p>}

                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setRegStep(3)} type="button" className="flex-1 bg-white/5 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] border border-white/10">Voltar</button>
                                    <button 
                                        onClick={handleRegisterSubmit}
                                        type="button" 
                                        className="flex-[2] bg-brand-primary text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] transition-all"
                                        disabled={false}
                                    >
                                        Confirmar Cadastro 🚀
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="text-center pt-2">
                             <button type="button" onClick={()=>{setMode('LOGIN'); setRegStep(1);}} className="text-slate-600 text-[10px] font-black uppercase tracking-widest py-2 hover:text-white transition-colors">
                                Já tenho uma conta profissional
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Footer */}
            <div className="p-8 border-t border-white/5 flex flex-col items-center gap-4">
                <div className="flex gap-5">
                    {socialLinks.map(l => (
                        <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-brand-primary transition-all transform hover:scale-125">{getSocialIcon(l.platform)}</a>
                    ))}
                </div>
                <p className="text-[8px] text-slate-700 font-semibold uppercase tracking-[0.2em]">© 2024 {systemName} | Gestão de Competições Digitais</p>
            </div>
        </div>

        {/* --- FLOATING WHATSAPP BUTTON --- */}
        {adminWhatsapp && (
            <a 
                href={`https://wa.me/${adminWhatsapp.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noreferrer"
                className="fixed bottom-6 right-6 z-[100] w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:scale-110 transition-transform group"
                title={supportButtonText}
            >
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
                <MessageSquare size={32} className="relative z-10" />
                <span className="absolute right-20 bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-black uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl pointer-events-none">
                    {supportButtonText}
                </span>
            </a>
        )}

        {/* --- TERMS OF USE MODAL --- */}
        {showTermsModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-[var(--bg-card)] border border-[var(--border)] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <h3 className="text-xl font-black text-white italic uppercase">Termos de Uso & Privacidade</h3>
                        <button onClick={() => setShowTermsModal(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6 text-slate-400 text-sm leading-relaxed">
                        <section>
                            <h4 className="text-white font-bold uppercase mb-2">1. Aceitação dos Termos</h4>
                            <p>{T.auth.terms}</p>
                        </section>
                        <section>
                            <h4 className="text-white font-bold uppercase mb-2">2. Gestão de Dados</h4>
                            <p>Seus dados de perfil, estatísticas de jogos e informações de clube são armazenados para fins de ranking e histórico esportivo dentro da plataforma.</p>
                        </section>
                        <section>
                            <h4 className="text-white font-bold uppercase mb-2">3. Conduta Esportiva</h4>
                            <p>O uso de ferramentas para burlar placares ou estatísticas resultará em exclusão permanente de todos os campeonatos e da rede oficial do projeto.</p>
                        </section>
                        <p className="text-xs italic pt-4 border-t border-white/5 text-slate-500">Última atualização: 24 de Maio de 2024</p>
                    </div>
                    <div className="p-6 border-t border-white/10 bg-white/5">
                        <button 
                            onClick={() => { setRegTermsAccepted(true); setShowTermsModal(false); }}
                            className="w-full bg-brand-primary text-white font-black py-4 rounded-xl uppercase tracking-widest hover:bg-blue-600 transition-colors"
                        >
                            Compreendo e Aceito os Termos
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Support floating button */}
        <a href={`https://wa.me/${adminWhatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="fixed bottom-8 left-8 z-50 bg-green-600 hover:bg-green-500 text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 active:scale-95 group">
            <MessageSquare size={24}/>
            <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-black text-white text-[10px] font-black px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap border border-white/10 pointer-events-none uppercase tracking-widest shadow-2xl ml-2">{supportButtonText}</span>
        </a>

        {showPlansModal && <PlansModal onClose={() => setShowPlansModal(false)} />}
    </div>
  );
};

export default Login;