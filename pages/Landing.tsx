import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Trophy, Users, BarChart, ChevronRight, Star, Globe, Zap, Search, Play, Gamepad2, 
  Instagram, Twitter, Youtube, ChevronLeft, Calendar, Clock, ArrowUp, ArrowDown, User, 
  Menu, X, Target, Award, Briefcase, LayoutDashboard, Home, ShoppingCart
} from '../components/Icons';
import { AppState, Tournament, League, MarketPlayer, Match, Team, Player, PlayerProfile, ExperienceType } from '../types';

interface LandingProps {
  state: AppState;
  leagueId?: string | null;
  activeView?: string;
  onNavigate: (page: string, subMode?: any) => void;
  onSelectLeague: (id: string) => void;
  onSelectTournament: (id: string) => void;
  onJoinLeague?: (id: string) => void;
  onViewMarket?: () => void;
  onNavigateView?: (view: string) => void;
  globalExperience?: ExperienceType | null;
  onSelectExperience?: (exp: ExperienceType) => void;
}

// --- HELPERS ---
const FifaCard: React.FC<{
    player: Player | MarketPlayer | PlayerProfile;
    label: string;
    statValue: string | number;
    statLabel: string;
    primaryColor?: string;
}> = ({ player, label, statValue, statLabel, primaryColor = '#FF5A00' }) => {
    return (
        <motion.div 
            whileHover={{ y: -6, scale: 1.02 }}
            className="relative w-full aspect-[2/3] max-w-[220px] mx-auto group perspective-1000"
        >
            {/* Card Background - Professional Style */}
            <div className="absolute inset-0 bg-brand-surface rounded-[1.5rem] border border-brand-border overflow-hidden shadow-xl">
                {/* Header Decoration */}
                <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white/[0.03] to-transparent"></div>
                
                {/* Content */}
                <div className="relative h-full flex flex-col items-center pt-8 pb-6 px-4">
                    {/* Badge Label */}
                    <div className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5 mb-4">
                        <span className="text-[7px] font-bold uppercase tracking-[0.2em] text-white/60">{label}</span>
                    </div>

                    {/* Overall & Position */}
                    <div className="absolute left-5 top-16 flex flex-col items-center">
                        <span className="text-2xl font-bold text-white leading-none">
                            {'overall' in player ? player.overall : (player as any).rating || 85}
                        </span>
                        <span className="text-[9px] font-bold uppercase opacity-40">
                            {'position' in player ? player.position : ('positions' in player ? player.positions[0] : 'N/A')}
                        </span>
                    </div>

                    {/* Player Photo */}
                    <div className="w-28 h-28 bg-white/5 rounded-full mb-4 border border-white/10 overflow-hidden relative">
                        {player.photoUrl ? (
                            <img src={player.photoUrl} alt={'name' in player ? player.name : player.nickname} className="w-full h-full object-cover" />
                        ) : (
                            <User size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/10" />
                        )}
                    </div>

                    {/* Player Name */}
                    <h4 className="text-lg font-bold text-white uppercase tracking-tight mb-1 text-center truncate w-full">
                        {'name' in player ? player.name : player.nickname}
                    </h4>
                    
                    {/* Stat Plate */}
                    <div className="mt-auto w-full bg-white/[0.03] border border-white/5 rounded-xl p-3 flex justify-between items-center group-hover:border-white/10 transition-colors">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-white/30">{statLabel}</span>
                        <span className="text-lg font-bold" style={{ color: primaryColor }}>{statValue}</span>
                    </div>
                </div>

                {/* Accent line */}
                <div 
                    className="absolute bottom-0 left-0 right-0 h-1 opacity-40 px-6"
                >
                    <div className="h-full w-full" style={{ backgroundColor: primaryColor }}></div>
                </div>
            </div>
        </motion.div>
    );
};

const Landing: React.FC<LandingProps> = ({ 
    state, 
    leagueId = null, 
    activeView = 'inicio',
    onNavigate, 
    onSelectLeague, 
    onSelectTournament,
    onJoinLeague,
    onViewMarket,
    onNavigateView,
    globalExperience = null,
    onSelectExperience
}) => {
    const [currentHighlight, setCurrentHighlight] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const league = useMemo(() => 
        leagueId ? state.leagues.find(l => l.id === leagueId) : null,
        [state.leagues, leagueId]
    );

    // --- DATA CALCULATIONS ---
    const federations = useMemo(() => 
        state.leagues.filter(l => !globalExperience || l.experienceType === globalExperience).slice(0, 6)
    , [state.leagues, globalExperience]);

    const activeTournaments = useMemo(() => 
        state.tournaments.filter(t => 
            t.status === 'ACTIVE' && 
            (leagueId ? t.ligaId === leagueId : !t.ligaId) &&
            (!globalExperience || t.experienceType === globalExperience)
        ).slice(0, 4)
    , [state.tournaments, leagueId, globalExperience]);

    const upcomingMatches = useMemo(() => 
        state.matches.filter(m => {
            const tournament = state.tournaments.find(t => t.id === m.tournamentId);
            const matchesLeague = leagueId ? tournament?.ligaId === leagueId : !tournament?.ligaId;
            return !m.isFinished && matchesLeague;
        })
        .sort((a, b) => (a.round || 0) - (b.round || 0))
        .slice(0, 5)
    , [state.matches, state.tournaments, leagueId]);

    const teamRanking = useMemo(() => 
        state.teams
            .filter(t => (leagueId ? t.ligaId === leagueId : !t.ligaId))
            .sort((a, b) => (b.points || 0) - (a.points || 0))
            .slice(0, 8)
    , [state.teams, leagueId]);

    const marketHighlights = useMemo(() => 
        state.marketPlayers
            .filter(p => {
                if (leagueId) {
                    if (p.ligaId === leagueId) return true;
                    const tournament = state.tournaments.find(t => t.id === p.tournamentId);
                    return tournament?.ligaId === leagueId;
                }
                const tournament = state.tournaments.find(t => t.id === p.tournamentId);
                return !tournament?.ligaId;
            })
            .sort((a, b) => b.overall - a.overall)
            .slice(0, 5)
    , [state.marketPlayers, state.tournaments, leagueId]);

    const latestNews = useMemo(() => 
        state.news
            .filter(n => (leagueId ? n.ligaId === leagueId : !n.ligaId))
            .sort((a, b) => (b.date || 0) - (a.date || 0))
            .slice(0, 3)
    , [state.news, leagueId]);

    const scorers = useMemo(() => 
        state.players
            .filter(p => {
                const team = state.teams.find(t => t.id === p.teamId);
                return leagueId ? team?.ligaId === leagueId : !team?.ligaId;
            })
            .sort((a, b) => (b.goals || 0) - (a.goals || 0))
            .slice(0, 1)
    , [state.players, state.teams, leagueId]);

    const goalkeepers = useMemo(() => 
        state.players
            .filter(p => (p.position === 'GL' || p.position === 'GK'))
            .filter(p => {
                const team = state.teams.find(t => t.id === p.teamId);
                return leagueId ? team?.ligaId === leagueId : !team?.ligaId;
            })
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 1)
    , [state.players, state.teams, leagueId]);

    const assistants = useMemo(() => 
        state.players
            .filter(p => {
                const team = state.teams.find(t => t.id === p.teamId);
                return leagueId ? team?.ligaId === leagueId : !team?.ligaId;
            })
            .sort((a, b) => (b.assists || 0) - (a.assists || 0))
            .slice(0, 1)
    , [state.players, state.teams, leagueId]);

    const isLeagueView = !!leagueId && !!league;

    const highlights = useMemo(() => [
        {
            title: isLeagueView && league ? `${league.name}` : "Portal PRO WORLD ARENA",
            subtitle: isLeagueView ? "Federação Oficial" : "Temporada 2024",
            description: isLeagueView && league ? `Portal de competições da ${league.name}. Acompanhe tabelas, estatísticas e resultados atualizados.` : "Gerencie seu time, participe de ligas profissionais e acompanhe o mercado de transferências em tempo real.",
            image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1936&auto=format&fit=crop",
            badge: isLeagueView ? "DA FEDERAÇÃO" : "MODO PRO",
            id: 'h1'
        },
        {
            title: "Mercado Aberto",
            subtitle: "Janela de Transferências",
            description: "Negocie jogadores, gerencie propostas e reforce seu elenco para as próximas competições.",
            image: "https://images.unsplash.com/photo-1522778119026-d647f0565c6a?q=80&w=2070&auto=format&fit=crop",
            badge: "MERCADO",
            id: 'h2'
        },
        {
            title: "Ranking de Managers",
            subtitle: "Performance Global",
            description: "Os melhores estrategistas da plataforma. Suba de nível e lidere a classificação.",
            image: "https://images.unsplash.com/photo-1627916560965-09c06587d540?q=80&w=2070&auto=format&fit=crop",
            badge: "RANKING",
            id: 'h3'
        }
    ], [isLeagueView, league]);

    const leagueAds = useMemo(() => 
        state.ads.filter(ad => ad.ligaId === leagueId)
    , [state.ads, leagueId]);

    const hallOfFame = useMemo(() => {
        if (!leagueId) return [];
        const leagueTournaments = state.tournaments.filter(t => t.ligaId === leagueId && t.status === 'FINISHED');
        return leagueTournaments.map(t => {
            const mvp = state.players.find(p => p.id === t.awards?.mvpId);
            const scorer = state.players.find(p => p.id === t.awards?.bestStrikerId);
            return { tournament: t, mvp, scorer };
        }).filter(item => item.mvp || item.scorer);
    }, [state.tournaments, state.players, leagueId]);

    const getTeamName = (id: string) => state.teams.find(t => t.id === id)?.name || id;
    const getTeamLogo = (id: string) => state.teams.find(t => t.id === id)?.logoUrl;

    const navItems = [
        { id: 'inicio', label: 'Início', icon: Home },
        { id: 'tournaments', label: 'Campeonatos', icon: Trophy },
        { id: 'federations', label: 'Federações', icon: Shield },
        { id: 'market', label: 'Mercado', icon: ShoppingCart },
        { id: 'ranking', label: 'Ranking', icon: Users },
        { id: 'halloffame', label: 'Hall da Fama', icon: Award }
    ];

    const leagueThemeColor = league?.primaryColor || '#FF5A00';
    const leagueSecondaryColor = league?.secondaryColor || '#20242D';

    const currentExperience = league?.experienceType || globalExperience;

    if (!leagueId && !globalExperience && onSelectExperience) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-brand-dark p-6 overflow-y-auto">
               <div className="max-w-4xl w-full text-center py-10">
                  <div className="w-20 h-20 bg-brand-primary/20 rounded-2xl mx-auto flex items-center justify-center mb-8 rotate-3 border border-brand-primary/30">
                     <Shield size={40} className="text-brand-primary" />
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black italic text-white uppercase tracking-tighter mb-4">Como deseja jogar?</h1>
                  <p className="text-slate-400 text-sm md:text-lg mb-12 uppercase tracking-[0.3em] font-bold">Escolha sua experiência para começar</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <button 
                      onClick={() => onSelectExperience(ExperienceType.X1)}
                      className="bg-white/5 border border-white/10 p-8 md:p-12 rounded-[40px] group hover:bg-brand-primary hover:border-brand-primary transition-all duration-500 flex flex-col items-center gap-6"
                    >
                      <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-500">
                        <Gamepad2 size={48} className="text-white group-hover:text-black" />
                      </div>
                      <div>
                        <h2 className="text-2xl md:text-3xl font-black italic text-white uppercase group-hover:text-black">⚽ X1</h2>
                        <p className="text-slate-500 text-[10px] md:text-xs mt-2 uppercase tracking-widest font-black group-hover:text-black/60">Competição direta entre pro players</p>
                      </div>
                    </button>
        
                    <button 
                      onClick={() => onSelectExperience(ExperienceType.PRO_CLUBS)}
                      className="bg-white/5 border border-white/10 p-8 md:p-12 rounded-[40px] group hover:bg-brand-primary hover:border-brand-primary transition-all duration-500 flex flex-col items-center gap-6"
                    >
                      <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-500">
                        <Users size={48} className="text-white group-hover:text-black" />
                      </div>
                      <div>
                        <h2 className="text-2xl md:text-3xl font-black italic text-white uppercase group-hover:text-black">⚽ Pro Clubs (11x11)</h2>
                        <p className="text-slate-500 text-[10px] md:text-xs mt-2 uppercase tracking-widest font-black group-hover:text-black/60">Gestão de elenco, mercado e federações</p>
                      </div>
                    </button>
                  </div>
                  
                  <p className="mt-12 text-[10px] font-bold text-slate-600 uppercase tracking-widest">PRO WORLD ARENA | GESTÃO ESPORTIVA PROFISSIONAL</p>
               </div>
            </div>
        );
    }

    const navigateToView = (view: string) => {
        if (onNavigateView) {
            onNavigateView(view);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        setIsMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-brand-dark text-white font-sans selection:bg-brand-primary selection:text-white">
            
            {/* 1. HEADER (TOPO FIXED) */}
            <header className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md border-b border-white/5"></div>
                <div className="container mx-auto px-6 h-16 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('landing')}>
                            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 group-hover:border-brand-primary/50 transition-all">
                                <Shield size={18} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold tracking-tight leading-none">
                                    {isLeagueView ? league.name : 'PRO WORLD'} {!isLeagueView && <span style={{ color: leagueThemeColor }}>ARENA</span>}
                                </h3>
                                <p className="text-[8px] font-medium uppercase tracking-[0.2em] mt-1 opacity-40">
                                    {isLeagueView ? 'Federação Integrada' : 'Portal Esportivo'}
                                </p>
                            </div>
                        </div>

                                <nav className="hidden lg:flex items-center gap-6">
                            {navItems.map(item => (
                                <button 
                                    key={item.id}
                                    onClick={() => navigateToView(item.id)}
                                    className={`text-[9px] font-semibold uppercase tracking-[0.1em] transition-all flex items-center gap-2 ${activeView === item.id ? '' : 'text-white/40 hover:text-white'}`}
                                    style={{ color: activeView === item.id ? leagueThemeColor : undefined }}
                                >
                                    <item.icon size={11} />
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => onNavigate('login')}
                            className="hidden md:flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl border border-white/5 transition-all"
                        >
                            Entrar
                        </button>
                        <button 
                            onClick={() => onNavigate('login', 'REGISTER')}
                            className="text-black font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl shadow-lg transition-all"
                            style={{ backgroundColor: leagueThemeColor, boxShadow: `0 0 20px ${leagueThemeColor}44` }}
                        >
                            Criar Conta
                        </button>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden w-10 h-10 bg-white/5 flex items-center justify-center rounded-xl border border-white/10">
                            {isMenuOpen ? <X size={20}/> : <Menu size={20}/>}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        className="fixed inset-0 z-[90] bg-black pt-24 px-6 lg:hidden"
                    >
                        <div className="flex flex-col gap-6">
                            {navItems.map(item => (
                                <button 
                                    key={item.id}
                                    onClick={() => navigateToView(item.id)}
                                    className={`text-2xl font-black italic uppercase tracking-tighter text-left flex items-center gap-4 ${activeView === item.id ? 'text-brand-primary' : 'text-white'}`}
                                >
                                    <item.icon size={24} />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. HERO (Only on Inicio) */}
            {activeView === 'inicio' && (
            <section id="hero" className="relative h-[100vh] lg:h-[85vh] flex items-center overflow-hidden pt-20">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop" 
                        className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
                        alt="Futebol Background"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#15181F] via-transparent to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#15181F] via-black/40 to-transparent"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-20">
                        <div className="flex-1 text-center lg:text-left">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-3 border px-6 py-2 rounded-full mb-8 backdrop-blur-xl"
                                style={{ backgroundColor: `${leagueThemeColor}11`, borderColor: `${leagueThemeColor}22` }}
                            >
                                <Zap size={14} style={{ color: leagueThemeColor }} />
                                <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: leagueThemeColor }}>
                                    {isLeagueView ? `Portal Oficial ${league.name}` : 'Pro Edition Arena'}
                                </span>
                            </motion.div>
                            
                            <motion.h1 
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-5xl md:text-7xl xl:text-[85px] font-bold tracking-tight leading-[1] mb-8 uppercase"
                            >
                                {isLeagueView ? league.name : 'A Arena Pro'} <br />
                                <span style={{ color: leagueThemeColor }}>
                                    {isLeagueView ? 'Portal Oficial' : 'do Futebol Virtual'}
                                </span>
                            </motion.h1>

                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-lg text-white/50 mb-10 max-w-2xl leading-relaxed"
                            >
                                {isLeagueView 
                                    ? `Acesse a plataforma oficial da ${league.name}. Acompanhe campeonatos, visualize estatísticas detalhadas e participe do mercado de transferências.`
                                    : 'Uma plataforma profissional para gerenciamento de ligas e campeonatos de Pro Clubs. Ferramentas avançadas para managers e jogadores.'}
                            </motion.p>
                            
                            <motion.div 
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mb-16"
                            >
                                {isLeagueView && onJoinLeague && (
                                    <button 
                                        onClick={() => onJoinLeague(league.id)}
                                        className="text-black font-black px-10 py-6 rounded-2xl shadow-2xl transition-all hover:-translate-y-2 uppercase tracking-widest text-sm flex items-center gap-3 active:scale-95"
                                        style={{ backgroundColor: leagueThemeColor, boxShadow: `0 0 40px ${leagueThemeColor}66` }}
                                    >
                                        <Shield size={20}/> Solicitar Vaga na Liga
                                    </button>
                                )}
                                <button onClick={() => onNavigate('login')} className="bg-white/5 border border-white/10 text-white font-black px-10 py-6 rounded-2xl transition-all hover:-translate-y-2 uppercase tracking-widest text-sm flex items-center gap-3 active:scale-95">
                                    <LayoutDashboard size={20}/> Entrar no Painel
                                </button>
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl"
                            >
                                {[
                                    { label: 'Times', value: (leagueId ? state.teams.filter(t => t.ligaId === leagueId).length : state.teams.filter(t => !t.ligaId).length) + (isLeagueView ? 0 : 42) },
                                    { label: 'Campeonatos', value: (leagueId ? state.tournaments.filter(t => t.ligaId === leagueId).length : state.tournaments.filter(t => !t.ligaId).length) + (isLeagueView ? 0 : 12) },
                                    { label: 'Jogadores', value: (leagueId ? state.users.filter(u => u.ligaId === leagueId).length : state.users.length) + (isLeagueView ? 0 : 150) },
                                    { label: 'Status', value: isLeagueView ? 'ATIVO' : 'GLOBAL' }
                                ].map((stat, i) => (
                                    <div key={i} className="text-left border-l border-white/10 pl-4">
                                        <p className="text-2xl font-black italic" style={{ color: leagueThemeColor }}>{stat.value}</p>
                                        <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-1">{stat.label}</p>
                                    </div>
                                ))}
                            </motion.div>
                        </div>
                        
                        {/* 3. CARROSSEL DE DESTAQUES (CENTRAL/LADO - Only on Inicio) */}
                        <div className="w-full lg:w-[480px] h-[520px] relative">
                            <AnimatePresence mode="wait">
                                <motion.div 
                                    key={currentHighlight}
                                    initial={{ opacity: 0, scale: 0.9, x: 50 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, x: -50 }}
                                    className="absolute inset-0 rounded-[40px] overflow-hidden border border-white/10 shadow-2xl group cursor-pointer"
                                    onClick={() => onNavigate('login')}
                                >
                                    <img 
                                        src={highlights[currentHighlight].image} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                        alt="Banner"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                                    <div className="absolute top-6 left-6">
                                        <span className="bg-brand-primary text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                            {highlights[currentHighlight].badge}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-8 left-8 right-8">
                                <p className="text-brand-primary text-xs font-bold uppercase tracking-widest mb-1">
                                            {highlights[currentHighlight].subtitle}
                                        </p>
                                        <h3 className="text-4xl font-bold text-white uppercase leading-none tracking-tighter mb-4">
                                            {highlights[currentHighlight].title}
                                        </h3>
                                        <p className="text-white/60 text-xs font-medium leading-relaxed">
                                            {highlights[currentHighlight].description}
                                        </p>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Carousel Controls */}
                            <div className="absolute -bottom-10 left-0 right-0 flex justify-between items-center px-4">
                                <div className="flex gap-2">
                                    {highlights.map((_, i) => (
                                        <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === currentHighlight ? 'w-8 bg-brand-primary' : 'w-2 bg-white/20'}`}></div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setCurrentHighlight(prev => (prev - 1 + highlights.length) % highlights.length)}
                                        className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white"
                                    >
                                        <ChevronLeft size={16}/>
                                    </button>
                                    <button 
                                        onClick={() => setCurrentHighlight(prev => (prev + 1) % highlights.length)}
                                        className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white"
                                    >
                                        <ChevronRight size={16}/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            )}

            {/* MAIN CONTENT GRID */}
            <main className="container mx-auto px-6 py-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* LEFT COLUMN (8 cols) */}
                    <div className="lg:col-span-8 space-y-24">
                        
                        {/* 4. CONTEÚDO RECENTE (Inicio Only) */}
                        {activeView === 'inicio' && (
                        <section id="news">
                            <div className="flex items-center justify-between mb-10 border-l-2 pl-6" style={{ borderColor: leagueThemeColor }}>
                                <div>
                                    <h2 className="text-3xl font-bold uppercase tracking-tight">Conteúdo <span style={{ color: leagueThemeColor }}>Recente</span></h2>
                                    <p className="text-[10px] text-white/30 uppercase font-semibold tracking-widest mt-1">Fique por dentro das novidades</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {latestNews.length > 0 ? latestNews.map((news, i) => (
                                    <motion.div 
                                        key={news.id}
                                        whileHover={{ y: -5 }}
                                        className="group cursor-pointer"
                                        onClick={() => onNavigate('login')}
                                    >
                                        <div className="aspect-video rounded-3xl overflow-hidden mb-6 border border-white/10 relative">
                                            <img 
                                                src={news.imageUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1740&auto=format&fit=crop'} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                                alt={news.title}
                                            />
                                            <div className="absolute top-4 left-4">
                                                <span className="bg-brand-primary text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest leading-none">
                                                    Portal RF
                                                </span>
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tight group-hover:text-brand-primary transition-colors leading-tight mb-3">
                                            {news.title}
                                        </h3>
                                        <p className="text-white/40 text-xs font-medium leading-relaxed line-clamp-2">
                                            {news.content}
                                        </p>
                                        <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/5">
                                            <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">
                                                {new Date(news.date).toLocaleDateString()}
                                            </span>
                                            <div className="flex items-center gap-1 text-[10px] text-brand-primary font-black uppercase tracking-widest group-hover:gap-3 transition-all">
                                                Ler mais <ChevronRight size={12}/>
                                            </div>
                                        </div>
                                    </motion.div>
                                )) : (
                                    [1, 2, 3].map(i => (
                                        <div key={i} className="animate-pulse">
                                            <div className="aspect-video bg-white/5 rounded-3xl mb-6 border border-white/5"></div>
                                            <div className="h-6 bg-white/5 rounded-lg mb-3 w-3/4"></div>
                                            <div className="h-4 bg-white/5 rounded-lg w-full mb-2"></div>
                                            <div className="h-4 bg-white/5 rounded-lg w-1/2"></div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                        )}

                        {/* 5. TORNEIOS EM ANDAMENTO */}
                        {(activeView === 'inicio' || activeView === 'tournaments') && (
                        <section id="tournaments">
                            <div className="flex items-center justify-between mb-10 border-l-2 pl-6" style={{ borderColor: leagueThemeColor }}>
                                <div>
                                    <h2 className="text-3xl font-bold uppercase tracking-tight">Torneios <span style={{ color: leagueThemeColor }}>{isLeagueView ? 'da Liga' : 'em Aberto'}</span></h2>
                                    <p className="text-[10px] text-white/30 uppercase font-semibold tracking-widest mt-1">Competições em andamento</p>
                                </div>
                                <button onClick={() => onNavigate('login')} className="group text-[9px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-2 transition-all">
                                    Ver todos <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" style={{ color: leagueThemeColor }} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {activeTournaments.length > 0 ? activeTournaments.map((t, i) => (
                                    <motion.div 
                                        key={t.id}
                                        whileHover={{ y: -5 }}
                                        className="bg-brand-surface rounded-[32px] overflow-hidden border border-brand-border group relative"
                                    >
                                        <div className="h-48 relative overflow-hidden">
                                            <img 
                                                src={t.bannerUrl || 'https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=1740&auto=format&fit=crop'} 
                                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                                                alt={t.name}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-brand-surface via-brand-surface/40 to-transparent"></div>
                                            <div className="absolute top-4 left-4 flex gap-2">
                                                <span className="bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest flex items-center gap-1">
                                                    <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div> LIVE
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-8">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-xl font-bold uppercase tracking-tight text-white group-hover:text-brand-primary transition-colors">{t.name}</h3>
                                                    <p className="text-[9px] text-white/30 font-semibold uppercase tracking-widest mt-1">{t.format} • {t.sport}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-6">
                                                <div className="flex items-center gap-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-bold">8/16</span>
                                                        <span className="text-[8px] text-white/20 uppercase font-medium">Equipes</span>
                                                    </div>
                                                    <div className="flex flex-col border-l border-white/10 pl-6">
                                                        <span className="font-bold" style={{ color: leagueThemeColor }}>Ativo</span>
                                                        <span className="text-[8px] text-white/20 uppercase font-medium">Status</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => onSelectTournament(t.id)}
                                                    className="w-12 h-12 bg-white/5 hover:bg-brand-primary text-white hover:text-black rounded-2xl flex items-center justify-center border border-white/10 hover:border-brand-primary transition-all"
                                                >
                                                    <ChevronRight size={20}/>
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                    )) : (
                                        <div className="col-span-full py-20 bg-white/5 rounded-[32px] border border-dashed border-white/10 flex flex-col items-center justify-center text-white/20">
                                            <Trophy size={40} className="mb-4 opacity-5" />
                                            <span className="text-sm font-medium">Nenhum torneio ativo no momento.</span>
                                        </div>
                                    )}
                                </div>
                            </section>
                            )}

                        {/* 6. LIGAS PARCEIRAS (Global Only) */}
                        {!isLeagueView && (activeView === 'inicio' || activeView === 'federations') && (
                        <section id="federations">
                            <div className="flex items-center justify-between mb-10 border-l-2 border-brand-primary pl-6">
                                <div>
                                    <h2 className="text-3xl font-bold uppercase tracking-tight">Ligas <span className="text-brand-primary">Parceiras</span></h2>
                                    <p className="text-[10px] text-white/30 uppercase font-semibold tracking-widest mt-1">Associações conectadas à Arena</p>
                                </div>
                            </div>
 
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                {federations.length > 0 ? federations.map((f, i) => (
                                    <motion.div 
                                        key={f.id}
                                        whileHover={{ y: -5 }}
                                        onClick={() => onSelectLeague(f.id)}
                                        className="bg-brand-surface p-8 rounded-[32px] border border-brand-border flex flex-col items-center text-center group cursor-pointer hover:border-brand-primary/40 transition-all"
                                    >
                                        <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center mb-6 border border-white/10 group-hover:border-brand-primary/30 transition-all">
                                            <Globe size={24} className="text-white/20 group-hover:text-brand-primary transition-colors" />
                                        </div>
                                        <h4 className="text-lg font-bold text-white uppercase tracking-tight mb-2 leading-none">{f.name}</h4>
                                        <p className="text-[9px] text-brand-primary font-semibold uppercase tracking-widest mb-6">{f.entranceType === 'convite' ? 'Privada' : 'Pública'}</p>
                                        <div className="flex items-center gap-1 text-[8px] font-bold text-white/20 uppercase tracking-widest group-hover:text-white transition-all">
                                            Acessar liga <ChevronRight size={12}/>
                                        </div>
                                    </motion.div>
                                )) : (
                                    [1, 2, 3].map(i => (
                                        <div key={i} className="bg-white/5 h-48 rounded-[40px] animate-pulse"></div>
                                    ))
                                )}
                            </div>
                        </section>
                        )}

                        {/* 7. CLASSIFICAÇÃO */}
                        {(activeView === 'inicio' || activeView === 'ranking') && (
                        <section id="ranking">
                            <div className="flex items-center justify-between mb-10 border-l-2 pl-6" style={{ borderColor: leagueThemeColor }}>
                                <div>
                                    <h2 className="text-3xl font-bold uppercase tracking-tight">Classificação <span style={{ color: leagueThemeColor }}>Geral</span></h2>
                                    <p className="text-[10px] text-white/30 uppercase font-semibold tracking-widest mt-1">Status atual das equipes</p>
                                </div>
                            </div>
                            
                            <div className="bg-brand-surface rounded-[24px] border border-brand-border overflow-hidden shadow-xl">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Trophy size={16} className="text-yellow-500 opacity-50" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Tabela de Liderança</span>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left table-fixed min-w-[500px]">
                                        <thead>
                                            <tr className="bg-white/[0.01]">
                                                <th className="px-6 py-4 w-12 text-[9px] font-bold uppercase tracking-widest text-white/30">#</th>
                                                <th className="px-6 py-4 w-auto text-[9px] font-bold uppercase tracking-widest text-white/30">Equipe</th>
                                                <th className="px-4 py-4 w-12 text-[9px] font-bold uppercase tracking-widest text-white/30 text-center">J</th>
                                                <th className="px-4 py-4 w-12 text-[9px] font-bold uppercase tracking-widest text-white/30 text-center">V</th>
                                                <th className="px-4 py-4 w-12 text-[9px] font-bold uppercase tracking-widest text-white/30 text-center">SG</th>
                                                <th className="px-6 py-4 w-16 text-[9px] font-bold uppercase tracking-widest text-white/30 text-right">Pts</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.03]">
                                            {teamRanking.map((team, i) => (
                                                <tr key={team.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer group">
                                                    <td className="px-6 py-4">
                                                        <span className={`text-xs font-bold ${i < 3 ? 'text-brand-primary' : 'text-white/20'}`}>
                                                            {i + 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-7 h-7 bg-black rounded border border-white/5 flex items-center justify-center p-1">
                                                                {team.logoUrl ? (
                                                                    <img src={team.logoUrl} alt={team.name} className="w-full h-full object-contain" />
                                                                ) : (
                                                                    <Shield size={14} className="text-white/10" />
                                                                )}
                                                            </div>
                                                            <span className="text-xs font-semibold uppercase text-white/80 group-hover:text-white">{team.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center text-[10px] font-medium text-white/30">0</td>
                                                    <td className="px-4 py-4 text-center text-[10px] font-medium text-white/30">0</td>
                                                    <td className="px-4 py-4 text-center text-[10px] font-medium text-white/30">0</td>
                                                    <td className="px-6 py-4 text-right font-bold text-sm" style={{ color: i < 3 ? leagueThemeColor : 'inherit' }}>{team.points || 0}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                        )}

                        {/* 6. LÍDERES DA TEMPORADA */}
                        {(activeView === 'inicio' || activeView === 'ranking') && (
                        <section>
                            <div className="flex items-center justify-between mb-10 border-l-2 pl-6" style={{ borderColor: leagueThemeColor }}>
                                <div>
                                    <h2 className="text-3xl font-bold uppercase tracking-tight">Líderes da <span style={{ color: leagueThemeColor }}>Temporada</span></h2>
                                    <p className="text-[10px] text-white/30 uppercase font-semibold tracking-widest mt-1">Principais atletas em destaque</p>
                                </div>
                            </div>
 
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                                {scorers[0] && (
                                    <FifaCard 
                                        player={scorers[0]} 
                                        label="Top Scorer" 
                                        statLabel="Gols" 
                                        statValue={scorers[0].goals} 
                                        primaryColor={leagueThemeColor}
                                    />
                                )}
                                {goalkeepers[0] && (
                                    <FifaCard 
                                        player={goalkeepers[0]} 
                                        label="Golden Glove" 
                                        statLabel="Rating" 
                                        statValue={goalkeepers[0].rating?.toFixed(1) || '0.0'} 
                                        primaryColor={leagueThemeColor}
                                    />
                                )}
                                {assistants[0] && (
                                    <FifaCard 
                                        player={assistants[0]} 
                                        label="Assist King" 
                                        statLabel="Assists" 
                                        statValue={assistants[0].assists} 
                                        primaryColor={leagueThemeColor}
                                    />
                                )}
                            </div>
                        </section>
                        )}

                        {/* HALL OF FAME TAB VIEW */}
                        {activeView === 'halloffame' && (
                        <section className="space-y-16">
                            <div className="flex items-center justify-between mb-10 border-l-4 pl-6" style={{ borderColor: leagueThemeColor }}>
                                <div>
                                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">Hall da <span style={{ color: leagueThemeColor }}>Fama</span></h2>
                                    <p className="text-xs text-white/40 uppercase font-black tracking-widest mt-1">Legado de Campeões</p>
                                </div>
                            </div>

                            {hallOfFame.length > 0 ? (
                                <div className="space-y-24">
                                    {hallOfFame.map((item, idx) => (
                                        <div key={idx} className="bg-white/[0.02] rounded-[40px] p-12 border border-white/5">
                                            <div className="flex items-center gap-6 mb-12">
                                                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center border border-white/10">
                                                    <Trophy size={32} style={{ color: leagueThemeColor }} />
                                                </div>
                                                <div>
                                                    <h3 className="text-3xl font-black italic uppercase text-white leading-none">{item.tournament.name}</h3>
                                                    <p className="text-xs text-white/30 uppercase font-black mt-1">Temporada Encerrada</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                                                {item.mvp && (
                                                    <FifaCard 
                                                        player={item.mvp} 
                                                        label="MVP" 
                                                        statLabel="MVPs" 
                                                        statValue={item.mvp.mvps} 
                                                        primaryColor={leagueThemeColor} 
                                                    />
                                                )}
                                                {item.scorer && (
                                                    <FifaCard 
                                                        player={item.scorer} 
                                                        label="Artilheiro" 
                                                        statLabel="Gols" 
                                                        statValue={item.scorer.goals} 
                                                        primaryColor={leagueThemeColor} 
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-32 bg-white/5 rounded-[40px] border border-dashed border-white/10 flex flex-col items-center justify-center text-white/20 italic">
                                    <Award size={64} className="mb-6 opacity-10" />
                                    O Hall da Fama está vazio. Termine uma competição para ver os campeões aqui.
                                </div>
                            )}
                        </section>
                        )}

                    </div>

                    {/* RIGHT COLUMN (4 cols) */}
                    <div className="lg:col-span-4 space-y-16">
                        
                        {/* 7. PRÓXIMOS JOGOS */}
                        {(activeView === 'inicio' || activeView === 'tournaments') && (
                        <section>
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                                    <Calendar className="text-brand-primary" size={20}/> Próximos Jogos
                                </h3>
                                <button onClick={() => onNavigate('login')} className="text-[9px] font-black uppercase tracking-widest text-brand-primary">Calendário</button>
                            </div>

                            <div className="space-y-4">
                                {upcomingMatches.length > 0 ? upcomingMatches.map((m, i) => (
                                    <div key={m.id} className="bg-brand-surface p-6 rounded-3xl border border-brand-border hover:border-brand-primary/30 transition-all cursor-pointer group">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1 flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform overflow-hidden p-1">
                                                    {getTeamLogo(m.homeTeamId) ? (
                                                        <img src={getTeamLogo(m.homeTeamId)} alt="Home" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Shield size={20} className="text-white/20"/>
                                                    )}
                                                </div>
                                                <span className="text-[9px] font-black uppercase text-center truncate w-full">{getTeamName(m.homeTeamId)}</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <div className="text-[10px] font-black text-white/20 mb-1">VS</div>
                                                <div className="bg-black/40 px-3 py-1 rounded text-[10px] font-black text-brand-primary italic">19:00</div>
                                            </div>
                                            <div className="flex-1 flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform overflow-hidden p-1">
                                                    {getTeamLogo(m.awayTeamId) ? (
                                                        <img src={getTeamLogo(m.awayTeamId)} alt="Away" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Shield size={20} className="text-white/20"/>
                                                    )}
                                                </div>
                                                <span className="text-[9px] font-black uppercase text-center truncate w-full">{getTeamName(m.awayTeamId)}</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-center">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Rodada {m.round} • Série A</span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-12 bg-white/5 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-white/20 italic text-xs">
                                        Sem jogos agendados.
                                    </div>
                                )}
                            </div>
                        </section>
                        )}

                        {/* 8. RANKING DE TIMES (TOP 5) */}
                        {(activeView === 'inicio' || activeView === 'ranking') && (
                        <section>
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                                    <Award className="text-brand-primary" size={20}/> Ranking Clubes
                                </h3>
                                <button onClick={() => onNavigate('login')} className="text-[9px] font-black uppercase tracking-widest text-brand-primary">Ranking Global</button>
                            </div>

                            <div className="bg-brand-surface rounded-[32px] border border-brand-border overflow-hidden">
                                {teamRanking.slice(0, 5).map((team, i) => (
                                    <div key={team.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all border-b border-white/5 last:border-0 group cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <span className={`text-xl font-black italic ${i < 3 ? 'text-brand-primary' : 'text-white/20'}`}>0{i+1}</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform overflow-hidden px-1">
                                                    {team.logoUrl ? (
                                                        <img src={team.logoUrl} alt={team.name} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Shield size={18} className="text-white/10"/>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black italic uppercase leading-none group-hover:text-brand-primary transition-colors">{team.name}</p>
                                                    <p className="text-[9px] text-white/30 uppercase font-black mt-1">Manager: Elite</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black italic text-white">{team.points || 0}</p>
                                            <p className="text-[8px] text-brand-primary uppercase font-black">Pontos</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                        )}

                        {/* 9. MERCADO DA LIGA */}
                        {(activeView === 'inicio' || activeView === 'market') && (
                        <section id="market">
                             <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                                    <Briefcase className="text-brand-primary" size={20}/> Mercado da Liga
                                </h3>
                                <button onClick={() => onNavigate('login')} className="text-[9px] font-black uppercase tracking-widest text-brand-primary">Ver Vitrine</button>
                            </div>

                            <div className="space-y-4">
                                {marketHighlights.length > 0 ? marketHighlights.map((p, i) => (
                                    <div 
                                        key={p.id}
                                        onClick={() => onNavigate('login')}
                                        className="bg-brand-surface p-6 rounded-3xl border border-brand-border hover:border-brand-primary/30 transition-all cursor-pointer group flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-brand-primary/20 group-hover:bg-brand-primary transition-all">
                                                <span className="text-xl font-black italic text-brand-primary group-hover:text-black">{p.overall}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-black italic uppercase leading-none group-hover:text-white transition-colors">{p.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{p.position}</span>
                                                    <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                                                    <span className="text-[8px] font-black text-brand-primary uppercase tracking-widest">Disponível</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black italic text-white whitespace-nowrap">R$ {p.valorTransferencia.toLocaleString()}</p>
                                            <button className="text-[8px] font-black uppercase tracking-widest text-brand-primary hover:underline mt-1">Proposta</button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-12 bg-white/5 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-white/20 italic text-xs">
                                        Janela fechada.
                                    </div>
                                )}

                                <button 
                                    onClick={() => isLeagueView && onViewMarket ? onViewMarket() : onNavigate('login')}
                                    className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/5 text-white/40 hover:text-white"
                                >
                                    {isLeagueView ? 'Abrir Mercado da Liga' : 'Abrir Mercado Profissional'}
                                </button>
                            </div>
                        </section>
                        )}

                        {/* ANÚNCIOS DA LIGA */}
                        {isLeagueView && leagueAds.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                                    <Globe style={{ color: leagueThemeColor }} size={20}/> Parceiros
                                </h3>
                            </div>
                            <div className="space-y-6">
                                {leagueAds.map(ad => (
                                    <a 
                                        key={ad.id} 
                                        href={ad.linkUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block rounded-[32px] overflow-hidden border border-white/5 hover:border-white/20 transition-all group"
                                    >
                                        <div className="aspect-[4/5] relative">
                                            <img src={ad.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={ad.title} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                            <div className="absolute bottom-6 left-6 right-6">
                                                <h4 className="text-lg font-black italic uppercase text-white shadow-sm">{ad.title}</h4>
                                                <p className="text-[9px] text-brand-primary font-black uppercase tracking-widest mt-1">Publicidade</p>
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </section>
                        )}

                    </div>
                </div>
            </main>

            {/* 10. CALL TO ACTION */}
            <section className="py-32 relative overflow-hidden bg-[var(--bg-main)]">
                <div className="absolute top-0 left-0 w-full h-full">
                    <img 
                        src="https://images.unsplash.com/photo-1575361204480-aadea2d107a9?q=80&w=2000&auto=format&fit=crop" 
                        className="w-full h-full object-cover opacity-10 mix-blend-screen"
                        alt="Stadium"
                    />
                </div>
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="max-w-4xl mx-auto"
                    >
                        <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-8 leading-none">
                            Faça parte desta <br />
                            <span className="text-brand-primary">História de Glória</span>
                        </h2>
                        <p className="text-xl text-white/50 mb-12 max-w-2xl mx-auto italic">
                            Junte-se a milhares de jogadores e organizadores na plataforma mais profissional do mercado. 
                            O seu próximo título começa agora.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-6">
                            <button onClick={() => onNavigate('login', 'REGISTER')} className="bg-brand-primary text-white font-black px-12 py-6 rounded-2xl shadow-[0_0_50px_rgba(255,90,0,0.2)] transition-all hover:-translate-y-2 uppercase tracking-widest text-lg active:scale-95 hover:bg-brand-primary/90">
                                Criar Minha Conta Grátis
                            </button>
                            <button onClick={() => onNavigate('login')} className="bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 text-white font-black px-12 py-6 rounded-2xl transition-all hover:-translate-y-2 uppercase tracking-widest text-lg active:scale-95">
                                Entrar no Sistema
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 11. RODAPÉ */}
            <footer className="py-24 bg-black border-t border-white/5">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20 text-center md:text-left">
                        <div className="lg:col-span-1">
                            <div className="flex items-center justify-center md:justify-start gap-4 mb-8">
                                <div className="w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,90,0,0.3)]">
                                    <Shield size={28} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black italic text-white leading-none">PRO WORLD <span className="text-brand-primary">ARENA</span></h3>
                                    <p className="text-[8px] text-brand-primary font-black uppercase tracking-[0.4em] mt-2 opacity-80">Est. 2024</p>
                                </div>
                            </div>
                            <p className="text-white/40 text-sm leading-relaxed mb-8 italic">
                                A elite dos campeonatos eletrônicos e presenciais. 
                                Tecnologia russa de processamento de dados para gestão esportiva.
                            </p>
                            <div className="flex items-center justify-center md:justify-start gap-4">
                                {[Instagram, Twitter, Youtube].map((Icon, i) => (
                                    <div key={i} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
                                        <Icon size={20} className="text-white/40 group-hover:text-brand-primary" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {[
                            { title: 'Plataforma', links: ['Início', 'Campeonatos', 'Federações', 'Ranking Nacional'] },
                            { title: 'Gerenciamento', links: ['Criar Liga', 'Painel Org', 'Suporte VIP', 'Manual do Manager'] },
                            { title: 'Informações', links: ['Sobre Nós', 'Contrato Profissional', 'Termos de Uso', 'Privacidade'] }
                        ].map((col, i) => (
                            <div key={i}>
                                <h4 className="text-white/40 font-black uppercase tracking-widest text-[10px] mb-8">{col.title}</h4>
                                <ul className="space-y-4">
                                    {col.links.map(link => (
                                        <li key={link}>
                                            <a href="#" className="text-sm font-bold text-white/60 hover:text-brand-primary transition-colors italic">{link}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
                        <div className="flex flex-col items-center md:items-start">
                            <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.4em]">
                                © 2025 PRO WORLD ARENA - SOLUÇÕES ESPORTIVAS DE ELITE
                            </p>
                            <p className="text-white/10 text-[8px] font-bold mt-2 uppercase">
                                Desenvolvido para a maior performance mundial.
                            </p>
                        </div>
                        <div className="flex items-center gap-8 grayscale opacity-20">
                             <img src="https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Premier_League_Logo.svg/1200px-Premier_League_Logo.svg.png" className="h-6" alt="Partner" />
                             <img src="https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png" className="h-8" alt="Partner" />
                             <img src="https://upload.wikimedia.org/wikipedia/en/thumb/0/05/Flag_of_Brazil.svg/1200px-Flag_of_Brazil.svg.png" className="h-6" alt="Brazil" />
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
