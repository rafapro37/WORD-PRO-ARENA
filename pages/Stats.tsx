import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tournament, Team, Player, User, UserRole, League } from '../types';
import { Trophy, Award, Shield, Star, Edit, Save, X, Check, Crown, Gamepad2, User as UserIcon, BarChart, ChevronRight, Filter, Target, Hand, Zap, Clock, ListPlus, Globe } from '../components/Icons';

interface StatsProps {
  tournaments: Tournament[];
  teams: Team[];
  players: Player[];
  leagues: League[];
  onUpdatePlayer?: (playerId: string, updates: Partial<Player>) => void;
  currentUser?: User;
}

// Mapeamento de Posições para Exibição
const POSITION_MAP = {
    VIRTUAL: {
        'GK': 'GK', 'GL': 'GK', 'GOL': 'GK',
        'ZGD': 'ZGD', 'ZGC': 'ZGC', 'ZGE': 'ZGE', 'ZAG': 'ZAG',
        'VOL': 'VOL', 'VLD': 'VLD', 'VLE': 'VLE',
        'MCD': 'MCD', 'MCE': 'MCE',
        'MD': 'MD', 'ME': 'ME',
        'MEI': 'MEI',
        'PD': 'PD', 'PE': 'PE',
        'ST': 'ST', 'ATAD': 'ATAD', 'ATAE': 'ATAE'
    },
    REAL: {
        'GK': 'GK',
        'ZGD': 'ZG', 'ZGE': 'ZG', 'ZGC': 'ZG', 'ZAG': 'ZG',
        'LD': 'LD', 'LE': 'LE',
        'VOL': 'VOL',
        'MC': 'MLG', 'MLG': 'MLG',
        'MD': 'MLD', 'ME': 'MLE',
        'MEI': 'MAT', 'MAT': 'MAT',
        'PTD': 'PTD', 'PTE': 'PTE',
        'SA': 'SA', 'CF': 'SA',
        'CA': 'CA', 'ST': 'CA'
    }
};

const mapaPosicoes: Record<string, string[]> = {
  GOLEIRO: ["GL", "GK"],
  DEFESA: ["ZG", "ZAG", "ZGD", "ZGC", "ZGE", "LD", "LE"],
  MEIO: ["VOL", "MCD", "MCE", "VLD", "VLE", "MC", "MLG", "MAT", "MEI", "MLD", "MLE", "MD", "ME"],
  ATAQUE: ["PD", "PE", "PTD", "PTE", "SA", "CA", "ATA", "ATA-D", "ATA-E", "ST"]
};

const Stats: React.FC<StatsProps> = ({ tournaments, teams, players, leagues, onUpdatePlayer, currentUser }) => {
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(tournaments[0]?.id || '');
  const [championshipType, setChampionshipType] = useState<'VIRTUAL' | 'REAL'>('VIRTUAL');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Filter tournaments by League
  const filteredTournaments = useMemo(() => {
    if (!selectedLeagueId) return tournaments;
    return tournaments.filter(t => t.ligaId === selectedLeagueId);
  }, [selectedLeagueId, tournaments]);

  // Adjust selectedTournamentId if it's not in the filtered list
  useEffect(() => {
    if (selectedTournamentId && !filteredTournaments.some(t => t.id === selectedTournamentId)) {
        setSelectedTournamentId(filteredTournaments[0]?.id || '');
    } else if (!selectedTournamentId && filteredTournaments.length > 0) {
        setSelectedTournamentId(filteredTournaments[0].id);
    }
  }, [filteredTournaments]);
  
  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);
  const canEdit = currentUser && (currentUser.role === UserRole.ADMIN || (currentUser.role === UserRole.ORGANIZER && selectedTournament?.organizadorId === currentUser.id));

  // --- FILTERS & DATA ---

  const getTeam = (teamId: string) => teams.find(t => t.id === teamId);

  const getDisplayPosition = (internalPos: string) => {
      // @ts-ignore
      return POSITION_MAP[championshipType][internalPos] || internalPos;
  };

  const tournamentPlayers = useMemo(() => {
    if (!selectedTournamentId) return [];
    const tournamentTeamIds = teams.filter(t => t.tournamentId === selectedTournamentId).map(t => t.id);
    return players.filter(p => tournamentTeamIds.includes(p.teamId));
  }, [selectedTournamentId, teams, players]);

  // Rankings Logic
  const getRanking = (sortFn: (a: Player, b: Player) => number, filterFn?: (p: Player) => boolean) => {
      let list = [...tournamentPlayers];
      if (filterFn) list = list.filter(filterFn);
      return list.sort(sortFn);
  };

  const rankings = {
      general: getRanking((a, b) => (b.rating || 0) - (a.rating || 0)),
      scorers: getRanking((a, b) => b.goals - a.goals, p => p.goals > 0),
      assists: getRanking((a, b) => b.assists - a.assists, p => p.assists > 0),
      participations: getRanking((a, b) => (b.goals + b.assists) - (a.goals + a.assists), p => (p.goals + p.assists) > 0),
      goalkeepers: getRanking(
          (a, b) => (b.rating || 0) - (a.rating || 0), 
          p => mapaPosicoes.GOLEIRO.includes(p.position)
      ),
      defenders: getRanking(
          (a, b) => (b.rating || 0) - (a.rating || 0), 
          p => mapaPosicoes.DEFESA.includes(p.position)
      ),
      midfielders: getRanking(
          (a, b) => (b.rating || 0) - (a.rating || 0), 
          p => mapaPosicoes.MEIO.includes(p.position) || !([...mapaPosicoes.GOLEIRO, ...mapaPosicoes.DEFESA, ...mapaPosicoes.MEIO, ...mapaPosicoes.ATAQUE].includes(p.position))
      ),
      attackers: getRanking(
          (a, b) => (b.rating || 0) - (a.rating || 0), 
          p => mapaPosicoes.ATAQUE.includes(p.position)
      )
  };

  const handleRatingChange = (playerId: string, val: string) => {
      const numVal = parseFloat(val);
      if (isNaN(numVal) || numVal < 0 || numVal > 10) return;
      if (onUpdatePlayer) onUpdatePlayer(playerId, { rating: numVal });
  };

  const getRatingColor = (rating: number) => {
      if (rating >= 8.5) return 'text-green-400';
      if (rating >= 7.0) return 'text-blue-400';
      if (rating >= 5.0) return 'text-yellow-500';
      return 'text-red-500';
  };

  // --- COMPONENTS ---

  const StatCard = ({ title, icon: Icon, color, data, type }: { title: string, icon: any, color: string, data: Player[], type: 'GENERAL' | 'GOALS' | 'ASSISTS' | 'PARTICIPATIONS' | 'GK' | 'DEF' | 'MID' }) => (
      <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden shadow-xl flex flex-col h-[500px]">
          <div className={`p-4 border-b border-brand-border bg-gradient-to-r from-brand-surfaceHighlight to-transparent flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-black/20 ${color}`}><Icon size={20} /></div>
                  <h2 className="font-black text-brand-text uppercase tracking-widest text-sm">{title}</h2>
              </div>
              <div className="text-[10px] font-bold text-brand-textMuted bg-black/40 px-2 py-1 rounded border border-white/5">RANKING GLOBAL</div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-black/40 text-[10px] text-brand-textMuted uppercase font-bold sticky top-0 z-10 backdrop-blur-sm">
                      <tr>
                          <th className="p-3 w-12 text-center">#</th>
                          <th className="p-3">Atleta / Clube</th>
                          <th className="p-3 text-center">Pos</th>
                          {type !== 'PARTICIPATIONS' && <th className="p-3 text-center">PJ</th>}
                          
                          {/* Dynamic Columns based on Type */}
                          {type === 'GK' && <th className="p-3 text-center">GS</th>}
                          {(type !== 'GK' && type !== 'PARTICIPATIONS') && <th className={`p-3 text-center ${type === 'GOALS' ? 'text-yellow-400' : ''}`}>Gols</th>}
                          {(type !== 'GK' && type !== 'PARTICIPATIONS') && <th className={`p-3 text-center ${type === 'ASSISTS' ? 'text-blue-400' : ''}`}>Assis</th>}
                          
                          {/* Columns for Participations */}
                          {type === 'PARTICIPATIONS' && <th className="p-3 text-center text-yellow-400">G</th>}
                          {type === 'PARTICIPATIONS' && <th className="p-3 text-center text-blue-400">A</th>}
                          {type === 'PARTICIPATIONS' && <th className="p-3 text-center text-brand-primary">G+A</th>}

                          {type !== 'PARTICIPATIONS' && <th className={`p-3 text-right pr-4 ${type === 'GENERAL' ? 'text-green-400' : ''}`}>Nota</th>}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/50 text-xs">
                      {data.map((p, idx) => {
                          const team = getTeam(p.teamId);
                          const isLeader = idx === 0;
                          const posLabel = getDisplayPosition(p.position);
                          // GS (Goals conceded) proxy
                          const gs = type === 'GK' && team && team.played > 0 ? (team.goalsAgainst / team.played).toFixed(1) : '-';

                          return (
                              <tr 
                                  key={p.id} 
                                  onClick={() => setSelectedPlayer(p)}
                                  className={`group transition-all cursor-pointer ${isLeader ? 'bg-gradient-to-r from-yellow-900/10 to-transparent hover:from-yellow-900/20' : 'hover:bg-brand-surfaceHighlight'}`}
                              >
                                  <td className="p-3 text-center font-mono text-brand-textMuted">
                                      {isLeader ? <Crown size={14} className="text-yellow-500 mx-auto animate-pulse"/> : idx + 1}
                                  </td>
                                  <td className="p-3">
                                      <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 rounded-full bg-black/50 border overflow-hidden shrink-0 ${isLeader ? 'border-yellow-500' : 'border-brand-border'}`}>
                                              {p.photoUrl ? <img src={p.photoUrl} className="w-full h-full object-cover"/> : <UserIcon className="w-full h-full p-1 text-brand-textMuted"/>}
                                          </div>
                                          <div className="min-w-0">
                                              <div className={`font-bold truncate ${isLeader ? 'text-yellow-200' : 'text-brand-text'}`}>{p.name}</div>
                                              <div className="text-[10px] text-brand-textMuted flex items-center gap-1">
                                                  {team?.logoUrl && <img src={team.logoUrl} className="w-3 h-3 object-contain"/>}
                                                  <span className="truncate max-w-[80px]">{team?.name || '-'}</span>
                                              </div>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="p-3 text-center">
                                      <span className="bg-brand-surfaceHighlight border border-white/5 px-1.5 py-0.5 rounded text-[9px] font-bold text-brand-textMuted">{posLabel}</span>
                                  </td>
                                  {type !== 'PARTICIPATIONS' && <td className="p-3 text-center text-brand-textMuted">{p.playedMatches || 0}</td>}
                                  
                                  {type === 'GK' && <td className="p-3 text-center text-red-400 font-mono">{gs}</td>}
                                  
                                  {/* Render Normal Goals/Assists */}
                                  {(type !== 'GK' && type !== 'PARTICIPATIONS') && (
                                      <td className={`p-3 text-center font-bold ${type === 'GOALS' ? 'text-xl text-yellow-400' : 'text-brand-textMuted'}`}>
                                          {p.goals}
                                      </td>
                                  )}
                                  {(type !== 'GK' && type !== 'PARTICIPATIONS') && (
                                      <td className={`p-3 text-center font-bold ${type === 'ASSISTS' ? 'text-xl text-blue-400' : 'text-brand-textMuted'}`}>
                                          {p.assists}
                                      </td>
                                  )}

                                  {/* Render Participations specific columns */}
                                  {type === 'PARTICIPATIONS' && <td className="p-3 text-center text-brand-textMuted font-bold">{p.goals}</td>}
                                  {type === 'PARTICIPATIONS' && <td className="p-3 text-center text-brand-textMuted font-bold">{p.assists}</td>}
                                  {type === 'PARTICIPATIONS' && (
                                      <td className="p-3 text-center font-black text-brand-primary text-lg">
                                          {p.goals + p.assists}
                                      </td>
                                  )}
                                  
                                  {type !== 'PARTICIPATIONS' && (
                                    <td className={`p-3 text-right pr-4 font-black ${type === 'GENERAL' ? 'text-lg' : ''} ${getRatingColor(p.rating || 0)}`}>
                                        {(p.rating || 0).toFixed(1)}
                                    </td>
                                  )}
                              </tr>
                          );
                      })}
                      {data.length === 0 && (
                          <tr><td colSpan={8} className="p-8 text-center text-brand-textMuted italic">Sem dados registrados.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
  );

  return (
    <div className="p-6 md:p-8 min-h-screen relative flex flex-col">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-black text-brand-text flex items-center gap-3 italic tracking-tight">
                    <BarChart className="text-brand-primary" size={32} />
                    CENTRAL DE <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-white">ESTATÍSTICAS</span>
                </h1>
                <p className="text-brand-textMuted mt-1 font-medium pl-1">
                    Ranking oficial e performance detalhada dos atletas.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                {/* LEAGUE SELECTOR */}
                <div className="bg-brand-surface border border-brand-border rounded-xl px-4 py-2 min-w-[200px]">
                    <label className="text-[10px] text-brand-textMuted uppercase font-bold block mb-1">Federação / Liga</label>
                    <div className="flex items-center gap-2">
                        <Globe size={14} className="text-brand-primary" />
                        <select 
                            value={selectedLeagueId}
                            onChange={(e) => setSelectedLeagueId(e.target.value)}
                            className="w-full bg-transparent text-brand-text font-bold text-sm outline-none cursor-pointer"
                        >
                            <option value="" className="bg-brand-surface">Todas as Ligas</option>
                            {leagues.map(l => <option key={l.id} value={l.id} className="bg-brand-surface">{l.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* TOURNAMENT SELECTOR (CAMPEONATO) */}
                <div className="bg-brand-surface border border-brand-border rounded-xl px-4 py-2 min-w-[200px]">
                    <label className="text-[10px] text-brand-textMuted uppercase font-bold block mb-1">Campeonato Especifico</label>
                    <div className="flex items-center gap-2">
                        <Trophy size={14} className="text-brand-primary" />
                        <select 
                            value={selectedTournamentId}
                            onChange={(e) => setSelectedTournamentId(e.target.value)}
                            className="w-full bg-transparent text-brand-text font-bold text-sm outline-none cursor-pointer"
                        >
                            {filteredTournaments.map(t => <option key={t.id} value={t.id} className="bg-brand-surface">{t.name}</option>)}
                            {filteredTournaments.length === 0 && <option value="" className="bg-brand-surface">Nenhum Torneio</option>}
                        </select>
                    </div>
                </div>

                {/* MODE SELECTOR */}
                <div className="bg-brand-surface border border-brand-border rounded-xl p-1 flex items-center">
                    <button 
                        onClick={() => setChampionshipType('VIRTUAL')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${championshipType === 'VIRTUAL' ? 'bg-purple-600 text-white shadow-lg' : 'text-brand-textMuted hover:text-white'}`}
                    >
                        <Gamepad2 size={16}/> Virtual (EA FC)
                    </button>
                    <button 
                        onClick={() => setChampionshipType('REAL')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${championshipType === 'REAL' ? 'bg-green-600 text-white shadow-lg' : 'text-brand-textMuted hover:text-white'}`}
                    >
                        <Trophy size={16}/> Futebol Real
                    </button>
                </div>

                {canEdit && (
                    <button 
                        onClick={() => setShowRatingModal(true)} 
                        className="bg-brand-surface hover:bg-brand-surfaceHighlight border border-brand-border text-brand-text px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                        <Edit size={16}/> Editar Notas
                    </button>
                )}
            </div>
        </div>

        {/* --- DASHBOARD GRID --- */}

        {/* ── TOTALIZADORES DO CAMPEONATO SELECIONADO ── */}
        {selectedTournament && (() => {
          const tourneyTeams   = teams.filter(t => t.tournamentId === selectedTournamentId);
          const tourneyPlayers = tournamentPlayers;
          const totalGoals     = tourneyPlayers.reduce((s, p) => s + (p.goals || 0), 0);
          const totalAssists   = tourneyPlayers.reduce((s, p) => s + (p.assists || 0), 0);
          const avgRating      = tourneyPlayers.length > 0
            ? (tourneyPlayers.reduce((s, p) => s + (p.rating || 0), 0) / tourneyPlayers.length).toFixed(1)
            : '—';
          const topScorer = [...tourneyPlayers].sort((a, b) => (b.goals || 0) - (a.goals || 0))[0];

          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Times',           value: tourneyTeams.length,   icon: Shield,  color: '#3B82F6' },
                { label: 'Gols no torneio', value: totalGoals,             icon: Target,  color: 'var(--theme-primary)' },
                { label: 'Assistências',    value: totalAssists,           icon: Star,    color: '#10B981' },
                { label: 'Nota média',      value: avgRating,              icon: BarChart, color: '#8B5CF6' },
              ].map((m, i) => (
                <div key={i} className="bg-brand-surface border border-brand-border rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: m.color + '20' }}>
                    <m.icon size={18} style={{ color: m.color }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-textMuted">{m.label}</p>
                    <p className="text-2xl font-black text-white">{m.value}</p>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ── APROVEITAMENTO DOS TIMES ── */}
        {(() => {
          const tourneyTeams = teams
            .filter(t => t.tournamentId === selectedTournamentId && t.played > 0)
            .sort((a, b) => b.points - a.points)
            .slice(0, 6);
          if (tourneyTeams.length === 0) return null;

          return (
            <div className="bg-brand-surface border border-brand-border rounded-xl p-5 mb-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-brand-text mb-4 flex items-center gap-2">
                <Shield size={16} className="text-brand-primary" /> Aproveitamento dos Times
              </h3>
              <div className="space-y-3">
                {tourneyTeams.map((team, i) => {
                  const aproveitamento = team.played > 0 ? Math.round((team.points / (team.played * 3)) * 100) : 0;
                  return (
                    <div key={team.id} className="flex items-center gap-3">
                      <span className="text-[11px] font-black text-brand-textMuted w-4 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-black text-brand-text truncate">{team.name}</span>
                          <span className="text-xs font-black text-brand-primary ml-2 flex-shrink-0">{aproveitamento}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-black/40 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${aproveitamento}%`,
                              background: aproveitamento >= 60
                                ? 'var(--theme-primary)'
                                : aproveitamento >= 35
                                  ? '#F59E0B'
                                  : '#EF4444',
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 text-[10px] font-black text-brand-textMuted flex-shrink-0">
                        <span title="Pontos" className="text-brand-primary">{team.points}pts</span>
                        <span title="Jogos">{team.played}J</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 pb-12">
            
            {/* 🟥 TOP 10 — GERAL (NOTA) */}
            <StatCard 
                title="TOP 10 — GERAL (NOTA)" 
                icon={Star} 
                color="text-yellow-400" 
                data={rankings.general} 
                type="GENERAL" 
            />

            {/* 🟦 TOP 10 — ARTILHEIROS */}
            <StatCard 
                title="TOP 10 — ARTILHEIROS" 
                icon={Target} 
                color="text-blue-400" 
                data={rankings.scorers} 
                type="GOALS" 
            />

            {/* 🟩 TOP 10 — ASSISTÊNCIAS */}
            <StatCard 
                title="TOP 10 — ASSISTÊNCIAS" 
                icon={Zap} 
                color="text-green-400" 
                data={rankings.assists} 
                type="ASSISTS" 
            />

            {/* 🔥 TOP 10 — PARTICIPAÇÕES EM GOLS (G+A) */}
            {/* Fix: Type '"PARTICIPAÇÕES"' is not assignable to type '"GK" | "GENERAL" | "GOALS" | "ASSISTS" | "PARTICIPATIONS" | "DEF" | "MID"'. */}
            <StatCard 
                title="TOP 10 — PARTICIPAÇÕES EM GOLS" 
                icon={ListPlus} 
                color="text-brand-primary" 
                data={rankings.participations} 
                type="PARTICIPATIONS" 
            />

            {/* 🟧 TOP 10 — GOLEIROS */}
            <StatCard 
                title="TOP 10 — GOLEIROS" 
                icon={Hand} 
                color="text-orange-400" 
                data={rankings.goalkeepers} 
                type="GK" 
            />

            {/* 🟫 TOP 10 — DEFENSORES */}
            <StatCard 
                title="TOP 10 — DEFENSORES" 
                icon={Shield} 
                color="text-red-400" 
                data={rankings.defenders} 
                type="DEF" 
            />

            {/* 🟦 TOP 10 — MEIO-CAMPO */}
            <StatCard 
                title="TOP 10 — MEIO-CAMPO" 
                icon={Zap} 
                color="text-blue-400" 
                data={rankings.midfielders} 
                type="MID" 
            />

            {/* 🟥 TOP 10 — ATAQUE */}
            <StatCard 
                title="TOP 10 — ATAQUE" 
                icon={Target} 
                color="text-yellow-400" 
                data={rankings.attackers} 
                type="GOALS" 
            />

        </div>

        {/* --- PLAYER DETAILS DRAWER (SIDE PANEL) --- */}
        {selectedPlayer && (
            <div className="fixed inset-0 z-50 flex justify-end">
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedPlayer(null)}></div>
                
                {/* Drawer */}
                <div className="relative w-full max-w-md bg-brand-surface border-l border-brand-border h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                    <button onClick={() => setSelectedPlayer(null)} className="absolute top-4 left-4 z-10 bg-black/50 hover:bg-black p-2 rounded-full text-white transition-colors">
                        <X size={20}/>
                    </button>

                    {/* Header Image */}
                    <div className="h-64 relative bg-gradient-to-b from-brand-surfaceHighlight to-brand-surface flex items-center justify-center overflow-hidden shrink-0">
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                        {selectedPlayer.photoUrl ? (
                            <img src={selectedPlayer.photoUrl} className="h-full w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] z-10 transform scale-110 translate-y-4"/>
                        ) : (
                            <UserIcon size={120} className="text-brand-textMuted opacity-20"/>
                        )}
                        <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-brand-surface to-transparent z-20"></div>
                    </div>

                    {/* Info Body */}
                    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-black text-brand-text italic uppercase leading-none mb-2">{selectedPlayer.name}</h2>
                            <div className="flex justify-center items-center gap-3">
                                <span className="bg-brand-primary text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wider shadow-lg shadow-brand-primary/20">
                                    {getDisplayPosition(selectedPlayer.position)}
                                </span>
                                <div className="flex items-center gap-1 text-brand-textMuted text-sm font-bold">
                                    {getTeam(selectedPlayer.teamId)?.logoUrl && <img src={getTeam(selectedPlayer.teamId)?.logoUrl} className="w-4 h-4 object-contain"/>}
                                    {getTeam(selectedPlayer.teamId)?.name || 'Sem Clube'}
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-brand-surfaceHighlight border border-brand-border p-4 rounded-xl text-center">
                                <div className="text-xs text-brand-textMuted uppercase font-bold mb-1">Nota Média</div>
                                <div className={`text-4xl font-black ${getRatingColor(selectedPlayer.rating || 0)}`}>{(selectedPlayer.rating || 0).toFixed(1)}</div>
                            </div>
                            <div className="bg-brand-surfaceHighlight border border-brand-border p-4 rounded-xl text-center">
                                <div className="text-xs text-brand-textMuted uppercase font-bold mb-1">Partidas</div>
                                <div className="text-4xl font-black text-white">{selectedPlayer.playedMatches || 0}</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 rounded-lg bg-black/20 border border-brand-border">
                                <span className="text-sm font-bold text-brand-textMuted flex items-center gap-2"><Target size={16} className="text-yellow-500"/> Gols Marcados</span>
                                <span className="text-xl font-bold text-brand-text">{selectedPlayer.goals}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-black/20 border border-brand-border">
                                <span className="text-sm font-bold text-brand-textMuted flex items-center gap-2"><Zap size={16} className="text-blue-500"/> Assistências</span>
                                <span className="text-xl font-bold text-brand-text">{selectedPlayer.assists}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-black/20 border border-brand-border">
                                <span className="text-sm font-bold text-brand-textMuted flex items-center gap-2"><Crown size={16} className="text-purple-500"/> MVPs</span>
                                <span className="text-xl font-bold text-brand-text">{selectedPlayer.mvps}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-black/20 border border-brand-border">
                                <span className="text-sm font-bold text-brand-textMuted flex items-center gap-2"><Clock size={16} className="text-green-500"/> M.S (Minutos)</span>
                                <span className="text-xl font-bold text-brand-text">-</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- EDIT RATING MODAL (ADMIN ONLY) --- */}
        {showRatingModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in duration-200">
                 <div className="bg-brand-surface border border-brand-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                     <div className="p-4 border-b border-brand-border bg-brand-surfaceHighlight flex justify-between items-center">
                        <h2 className="text-lg font-bold text-brand-text flex items-center gap-2"><Edit size={18}/> Gerenciar Notas</h2>
                        <button onClick={() => setShowRatingModal(false)}><X size={20} className="text-brand-textMuted hover:text-white"/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {tournamentPlayers.map(p => {
                            const team = getTeam(p.teamId);
                            return (
                                <div key={p.id} className="flex items-center justify-between bg-black/20 p-2 rounded border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-brand-surfaceHighlight flex items-center justify-center text-[10px] font-bold border border-brand-border">
                                            {getDisplayPosition(p.position)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-xs text-brand-text">{p.name}</p>
                                            <p className="text-[10px] text-brand-textMuted">{team?.name}</p>
                                        </div>
                                    </div>
                                    <input 
                                        type="number" step="0.1" min="0" max="10"
                                        value={p.rating || ''}
                                        onChange={(e) => handleRatingChange(p.id, e.target.value)}
                                        className={`w-16 bg-black border border-brand-border rounded p-1 text-center font-bold text-sm outline-none focus:border-brand-primary ${getRatingColor(p.rating || 0)}`}
                                        placeholder="0.0"
                                    />
                                </div>
                            );
                        })}
                    </div>
                 </div>
            </div>
        )}

    </div>
  );
};

export default Stats;