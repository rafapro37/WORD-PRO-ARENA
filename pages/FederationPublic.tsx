import React, { useMemo, useState } from 'react';
import { toast } from '../src/lib/toast';
import { Shield, Trophy, Users, BarChart, ChevronLeft, Star, Globe, Zap, Search, Play, ChevronRight, Mail, MessageSquare, Clock, XCircle, CreditCard, LinkIcon } from '../components/Icons';
import { AppState, Tournament, League, MarketPlayer, Team, User, LeagueMember } from '../types';
import { useShareableUrl } from '../src/hooks/useShareableUrl';

interface FederationPublicProps {
  state: AppState;
  leagueId: string;
  onBack: () => void;
  onSelectTournament: (id: string) => void;
  onNavigateLogin: () => void;
  onViewMarket: () => void;
  currentUser?: User | null;
  leagueMembers: LeagueMember[];
  onJoinLeague: (ligaId: string) => void;
}

const FederationPublic: React.FC<FederationPublicProps> = ({ 
    state, leagueId, onBack, onSelectTournament, onNavigateLogin, onViewMarket,
    currentUser, leagueMembers, onJoinLeague
}) => {
    const { leagueUrl, tournamentUrl, copyToClipboard } = useShareableUrl();
    const [copied, setCopied] = useState(false);

    const handleCopyLink = async (url: string) => {
        const ok = await copyToClipboard(url);
        if (ok) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    
    const league = useMemo(() => 
        state.leagues.find(l => l.id === leagueId),
        [state.leagues, leagueId]
    );

    const leagueTournaments = useMemo(() => 
        state.tournaments.filter(t => t.ligaId === leagueId),
        [state.tournaments, leagueId]
    );

    const leagueTeams = useMemo(() => 
        state.teams.filter(t => t.ligaId === leagueId),
        [state.teams, leagueId]
    );

    const leagueMarket = useMemo(() => 
        state.marketPlayers.filter(p => {
            if (p.ligaId === leagueId) return true;
            const tournament = state.tournaments.find(t => t.id === p.tournamentId);
            return tournament?.ligaId === leagueId;
        }),
        [state.marketPlayers, state.tournaments, leagueId]
    );

    const leagueNews = useMemo(() => 
        state.news
            .filter(n => n.ligaId === leagueId)
            .sort((a, b) => (b.date || 0) - (a.date || 0)),
        [state.news, leagueId]
    );

    const membership = useMemo(() => 
        leagueMembers.find(m => m.ligaId === leagueId && m.userId === currentUser?.id),
        [leagueMembers, leagueId, currentUser]
    );

    if (!league) return <div className="p-20 text-center text-white">Liga não encontrada.</div>;

    return (
        <div className="min-h-screen bg-[var(--bg-global)] text-[var(--texto-global)]">
            {/* Header / Banner */}
            <div className="relative h-64 flex items-end">
                <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1740&auto=format&fit=crop)', filter: 'brightness(0.3)' }}></div>
                <div className="absolute inset-0 z-0 bg-gradient-to-t from-[var(--bg-global)] to-transparent"></div>
                
                <div className="container mx-auto px-6 relative z-10 pb-10">
                    <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6 uppercase text-[10px] font-black tracking-widest">
                        <ChevronLeft size={16} /> Voltar ao Início
                    </button>
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-[var(--bg-card)] border-2 border-[var(--primary)] rounded-3xl flex items-center justify-center shadow-2xl">
                            <Shield size={48} className="text-[var(--primary)]" />
                        </div>
                        <div>
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter text-white leading-none">
                                    {league.name}
                                </h1>
                                {/* Botão copiar link público */}
                                <button
                                    onClick={() => handleCopyLink(leagueUrl(league.slug, league.id))}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-black uppercase tracking-wider transition-all self-start"
                                    title="Copiar link público da federação"
                                >
                                    <LinkIcon size={13} />
                                    {copied ? 'Copiado!' : 'Copiar link'}
                                </button>
                                <button 
                                    onClick={() => {
                                        const url = `${window.location.origin}/liga/${league.slug || league.id}`;
                                        navigator.clipboard.writeText(url);
                                        toast.info("Link da liga copiado!");
                                    }}
                                    className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl border border-white/10 transition-all flex items-center gap-2 text-[10px] uppercase font-black tracking-widest w-fit"
                                >
                                    <LinkIcon size={14}/> Compartilhar
                                </button>
                            </div>
                            <p className="text-[var(--primary)] font-bold text-xs uppercase tracking-widest mt-2 flex items-center gap-2">
                                <Globe size={14} /> Federação Oficial Integrada
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-12">
                {/* Access Request Section */}
                {!membership && (
                    <div className="mb-10 bg-brand-surfaceHighlight border border-brand-border p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 animate-in slide-in-from-top-4">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">Deseja participar desta liga?</h3>
                            <p className="text-sm text-brand-textMuted">Esta liga requer autorização do organizador para participação plena.</p>
                        </div>
                        {currentUser ? (
                            <button 
                                onClick={() => onJoinLeague(leagueId)}
                                className="bg-[var(--primary)] hover:brightness-110 text-white font-black px-8 py-3 rounded-2xl shadow-lg shadow-[var(--primary)]/20 transition-all uppercase text-xs tracking-widest"
                            >
                                Solicitar Entrada na Liga
                            </button>
                        ) : (
                            <button 
                                onClick={onNavigateLogin}
                                className="bg-brand-surface border border-brand-border hover:bg-brand-border text-white font-black px-8 py-3 rounded-2xl transition-all uppercase text-xs tracking-widest"
                            >
                                Entrar para Solicitar Acesso
                            </button>
                        )}
                    </div>
                )}

                {membership && (membership.status === 'PENDING' || membership.status === 'WAITING_PAYMENT') && (
                    <div className={`mb-10 p-6 rounded-3xl flex justify-between items-center animate-in fade-in border ${membership.status === 'WAITING_PAYMENT' ? 'bg-blue-900/20 border-blue-500/30' : 'bg-amber-900/20 border-amber-500/30'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${membership.status === 'WAITING_PAYMENT' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-500'}`}>
                                {membership.status === 'WAITING_PAYMENT' ? <CreditCard size={24}/> : <Clock size={24}/>}
                            </div>
                            <div>
                                <h3 className={`text-xl font-bold mb-1 ${membership.status === 'WAITING_PAYMENT' ? 'text-blue-400' : 'text-amber-500'}`}>
                                    {membership.status === 'WAITING_PAYMENT' ? 'Aguardando Pagamento' : 'Solicitação Enviada'}
                                </h3>
                                <p className={`text-sm ${membership.status === 'WAITING_PAYMENT' ? 'text-blue-200/60' : 'text-amber-200/60'}`}>
                                    {membership.status === 'WAITING_PAYMENT' ? 'O organizador enviou as instruções de pagamento. Entre em contato para finalizar.' : 'Seu acesso está sendo analisado pelo organizador. Você será notificado em breve.'}
                                </p>
                            </div>
                        </div>
                        <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-full border ${membership.status === 'WAITING_PAYMENT' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-amber-500 bg-amber-500/10 border-amber-500/20'}`}>
                            {membership.status === 'WAITING_PAYMENT' ? 'Aguardando Pagamento' : 'Aguardando Aprovação'}
                        </span>
                    </div>
                )}

                {membership && membership.status === 'REJECTED' && (
                    <div className="mb-10 bg-red-900/20 border border-red-500/30 p-6 rounded-3xl flex items-center gap-4 animate-in fade-in">
                        <div className="p-3 bg-red-500/20 rounded-2xl text-red-500">
                            <XCircle size={24}/>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-red-500 mb-1">Acesso Negado</h3>
                            <p className="text-sm text-red-200/60">Sua solicitação de acesso a esta liga foi recusada pelo organizador.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Championships */}
                        <section>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold uppercase tracking-tight">Campeonatos <span className="text-[var(--primary)]">Ativos</span></h2>
                                <span className="text-[var(--text-secondary)] text-xs font-bold uppercase">{leagueTournaments.length} Encontrados</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {leagueTournaments.length > 0 ? leagueTournaments.map(tournament => (
                                    <div 
                                        key={tournament.id}
                                        onClick={() => onSelectTournament(tournament.id)}
                                        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden cursor-pointer hover:border-[var(--primary)] transition-all group"
                                    >
                                        <div className="h-32 relative">
                                            <img src={tournament.bannerUrl || 'https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=1740&auto=format&fit=crop'} className="w-full h-full object-cover opacity-60" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                                            <div className="absolute bottom-4 left-4">
                                                <h3 className="text-xl font-bold text-white uppercase">{tournament.name}</h3>
                                            </div>
                                        </div>
                                        <div className="p-4 flex justify-between items-center bg-black/20">
                                            <div className="flex gap-4">
                                                <div className="text-center">
                                                    <p className="text-white font-bold text-sm">{state.teams.filter(t => t.tournamentId === tournament.id).length}</p>
                                                    <p className="text-[8px] text-[var(--text-secondary)] uppercase font-black tracking-widest">Times</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-white font-bold text-sm">{tournament.format}</p>
                                                    <p className="text-[8px] text-[var(--text-secondary)] uppercase font-black tracking-widest">Formato</p>
                                                </div>
                                            </div>
                                            <button className="text-[var(--primary)] hover:bg-[var(--primary)]/10 p-2 rounded-lg transition-all">
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-2 py-10 text-center text-white/30 italic uppercase text-xs tracking-widest border border-white/5 rounded-2xl bg-black/20">
                                        Nenhum campeonato ativo nesta liga
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Recent News / Feed */}
                        {leagueNews.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-bold uppercase tracking-tight mb-6 flex items-center gap-2">
                                    <MessageSquare className="text-[var(--primary)]" size={24} /> 
                                    Notícias da <span className="text-[var(--primary)]">Liga</span>
                                </h2>
                                <div className="space-y-4">
                                    {leagueNews.slice(0, 3).map(news => (
                                        <div key={news.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--primary)]/30 transition-all">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                                    news.type === 'ALERT' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                                                    news.type === 'PROMO' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                                                    'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20'
                                                }`}>
                                                    {news.type}
                                                </span>
                                                <span className="text-[10px] text-white/40 font-bold flex items-center gap-1 uppercase">
                                                    <Clock size={12} /> {new Date(news.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-2 uppercase leading-tight">{news.title}</h3>
                                            <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">{news.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Top Teams - Standings Preview */}
                        <section>
                            <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">Times da <span className="text-[var(--primary)]">Elite</span></h2>
                            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-black/40 text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest">
                                        <tr>
                                            <th className="p-4 text-left">Clube</th>
                                            <th className="p-4 text-center">Torneios</th>
                                            <th className="p-4 text-center">Status</th>
                                            <th className="p-4 text-right">Fundação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {leagueTeams.slice(0, 8).map(team => (
                                            <tr key={team.id} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-black rounded-lg border border-white/5 flex items-center justify-center">
                                                        <Shield size={20} className="text-[var(--primary)]" />
                                                    </div>
                                                    <span className="text-white font-bold text-sm uppercase">{team.name}</span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="text-xs text-[var(--text-secondary)]">
                                                        {state.tournaments.filter(trn => state.teams.find(tm => tm.id === team.id && tm.tournamentId === trn.id)).length} Torneios
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="bg-green-500/10 text-green-500 text-[10px] font-black px-2 py-0.5 rounded border border-green-500/20 uppercase tracking-widest">Ativo</span>
                                                </td>
                                                <td className="p-4 text-right text-[var(--text-secondary)] text-xs">
                                                    2023
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Area */}
                    <div className="space-y-8">
                        {/* Market Preview - ONLY FOR MARKET LEAGUES */}
                        {league.type === 'MARKET' && (
                            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-black uppercase italic text-lg">Mercado <span className="text-blue-400">Liga</span></h3>
                                    <button onClick={onViewMarket} className="text-blue-400 font-bold text-[10px] uppercase tracking-widest hover:underline">Ver Tudo</button>
                                </div>
                                <div className="space-y-4 mb-6">
                                    {leagueMarket.slice(0, 5).map(player => (
                                        <div key={player.id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-500/10 rounded flex items-center justify-center font-bold text-blue-400 text-xs italic">{player.overall}</div>
                                                <div>
                                                    <p className="text-white font-bold text-xs">{player.name}</p>
                                                    <p className="text-[var(--text-secondary)] text-[8px] font-bold uppercase tracking-widest">{player.position}</p>
                                                </div>
                                            </div>
                                            <p className="text-blue-400 font-black text-xs">R$ 5M</p>
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={onNavigateLogin}
                                    className="w-full py-4 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    Iniciar Proposta de Mercado
                                </button>
                            </div>
                        )}

                        {/* CTA Section */}
                        <div className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/50 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute -right-10 -bottom-10 opacity-20 transform rotate-12">
                                <Shield size={200} />
                            </div>
                            <h3 className="text-2xl font-bold uppercase leading-tight mb-4">FAÇA PARTE DESTA HISTÓRIA</h3>
                            <p className="text-white/80 text-xs leading-relaxed mb-6">Crie seu time ou inscreva-se como jogador livre para começar sua jornada competitiva.</p>
                            <button 
                                onClick={onNavigateLogin}
                                className="w-full py-4 bg-white text-[var(--primary)] font-black rounded-2xl shadow-xl shadow-black/20 uppercase tracking-widest text-[10px] transform hover:-translate-y-1 transition-all"
                            >
                                Registrar Gratuitamente
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FederationPublic;
