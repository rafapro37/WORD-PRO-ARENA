import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Tournament, Team, Match, Player, TournamentRegistration,
  User, UserRole, PlanType, League, PlayerProfile,
} from '../types';
import { useLocale } from '../src/contexts/LocaleContext';
import { translatePlan, translateFormat, translateSport } from '../src/i18n';
import { StatCard, PlayerAvatar, PlanBadge, EmptyState } from '../src/components/ui';
import {
  Trophy, Users, BarChart, Plus, Settings, Target,
  Zap, Clock, Star, ChevronRight, Shield, Award,
} from '../components/Icons';

interface OrganizerDashboardProps {
  currentUser: User;
  tournaments: Tournament[];
  teams: Team[];
  matches: Match[];
  players: Player[];
  registrations: TournamentRegistration[];
  leagues: League[];
  playerProfiles: PlayerProfile[];
  onNavigate: (page: string) => void;
  onSelectTournament: (id: string) => void;
}

// ─── Mini Gráfico de barras ───────────────────────────────────────────────────
const BarChart2D: React.FC<{
  data: { label: string; value: number; color?: string }[];
  height?: number;
}> = ({ data, height = 80 }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10"
          >
            {d.label}: {d.value}
          </div>
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.04, duration: 0.4, ease: 'easeOut' }}
            style={{
              height: `${(d.value / max) * 100}%`,
              background: d.color || 'var(--theme-primary)',
              minHeight: d.value > 0 ? 4 : 0,
              transformOrigin: 'bottom',
            }}
            className="w-full rounded-t-sm opacity-80 hover:opacity-100 transition-opacity"
          />
        </div>
      ))}
    </div>
  );
};

// ─── Badge de status de torneio ───────────────────────────────────────────────
const TournamentStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg: Record<string, { label: string; cls: string }> = {
    ACTIVE:   { label: 'Ativo',      cls: 'bg-green-900  text-green-300  border-green-700'  },
    DRAFT:    { label: 'Rascunho',   cls: 'bg-slate-800  text-slate-400  border-slate-600'  },
    FINISHED: { label: 'Finalizado', cls: 'bg-purple-900 text-purple-300 border-purple-700' },
    PENDING:  { label: 'Pendente',   cls: 'bg-yellow-900 text-yellow-300 border-yellow-700' },
  };
  const { label, cls } = cfg[status] || cfg.DRAFT;
  return (
    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────
const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  currentUser, tournaments, teams, matches, players,
  registrations, leagues, playerProfiles,
  onNavigate, onSelectTournament,
}) => {
  const { locale, T } = useLocale();
  const [activeTab, setActiveTab] = useState<'campeonatos' | 'atividade' | 'artilheiros'>('campeonatos');

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const primaryColor = 'var(--theme-primary)';

  // ── Métricas gerais ─────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const activeTournaments = tournaments.filter(t => t.status === 'ACTIVE');
    const totalMatches      = matches.length;
    const finishedMatches   = matches.filter(m => m.isFinished).length;
    const totalRegistrations = registrations.length;
    const approvedReg       = registrations.filter(r => r.status === 'APPROVED').length;
    const pendingReg        = registrations.filter(r => r.status === 'PENDING').length;
    const totalGoals        = matches.reduce((sum, m) => sum + (m.scoreA || 0) + (m.scoreB || 0), 0);

    return {
      activeTournaments: activeTournaments.length,
      totalTournaments:  tournaments.length,
      totalTeams:        teams.length,
      totalRegistrations,
      approvedReg,
      pendingReg,
      totalMatches,
      finishedMatches,
      totalGoals,
      totalPlayers: players.length,
    };
  }, [tournaments, teams, matches, players, registrations]);

  // ── Gráfico: partidas por rodada (último torneio ativo) ─────────────────
  const matchChartData = useMemo(() => {
    const activeTournament = tournaments.find(t => t.status === 'ACTIVE') || tournaments[0];
    if (!activeTournament) return [];

    const tourneyMatches = matches.filter(m => m.tournamentId === activeTournament.id);
    const byRound = tourneyMatches.reduce<Record<number, number>>((acc, m) => {
      const round = m.round || 1;
      acc[round] = (acc[round] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(byRound)
      .sort(([a], [b]) => Number(a) - Number(b))
      .slice(-12)
      .map(([round, count]) => ({
        label: `R${round}`,
        value: count,
      }));
  }, [tournaments, matches]);

  // ── Ranking artilheiros (top 8) ─────────────────────────────────────────
  const topScorers = useMemo(() => {
    return [...players]
      .filter(p => (p.goals || 0) > 0)
      .sort((a, b) => (b.goals || 0) - (a.goals || 0))
      .slice(0, 8)
      .map(p => {
        const team = teams.find(t => t.id === p.teamId);
        const profile = playerProfiles.find(pr => pr.userId === p.userId);
        return { ...p, teamName: team?.name || '—', photoUrl: profile?.photoUrl };
      });
  }, [players, teams, playerProfiles]);

  // ── Atividade recente (últimas partidas finalizadas) ─────────────────────
  const recentMatches = useMemo(() =>
    [...matches]
      .filter(m => m.isFinished)
      .sort((a, b) => (b.date || 0) - (a.date || 0))
      .slice(0, 6)
      .map(m => {
        const teamA = teams.find(t => t.id === m.teamAId);
        const teamB = teams.find(t => t.id === m.teamBId);
        const tourney = tournaments.find(t => t.id === m.tournamentId);
        return { ...m, teamAName: teamA?.name || '?', teamBName: teamB?.name || '?', tourneyName: tourney?.name };
      }),
    [matches, teams, tournaments],
  );

  // ── Torneios com inscrições pendentes ────────────────────────────────────
  const tourneysWithPending = useMemo(() =>
    tournaments.filter(t =>
      registrations.some(r => r.tournamentId === t.id && r.status === 'PENDING'),
    ), [tournaments, registrations]);

  return (
    <div className="p-6 md:p-8 space-y-8 min-h-screen" style={{ background: 'var(--theme-bg)' }}>

      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-black flex-shrink-0 shadow-lg"
            style={{ background: primaryColor }}
          >
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-[var(--theme-text-muted)]">
              Bem-vindo de volta
            </p>
            <h1 className="text-2xl font-black text-white italic tracking-tight leading-tight">
              {currentUser.name.toUpperCase()}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <PlanBadge plan={currentUser.plan || PlanType.FREE} />
              {metrics.pendingReg > 0 && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-900 text-yellow-300 border border-yellow-700 animate-pulse">
                  {metrics.pendingReg} inscrição{metrics.pendingReg > 1 ? 'ões' : ''} pendente{metrics.pendingReg > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('create-tournament')}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-black text-sm text-black shadow-lg transition-all hover:scale-105 hover:shadow-xl self-start md:self-auto"
          style={{ background: primaryColor }}
        >
          <Plus size={18} />
          Novo Campeonato
        </button>
      </motion.div>

      {/* ── MÉTRICAS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Campeonatos',
            value: metrics.totalTournaments,
            sub: `${metrics.activeTournaments} ativo${metrics.activeTournaments !== 1 ? 's' : ''}`,
            icon: <Trophy size={20} />, color: primaryColor,
          },
          {
            label: 'Times',
            value: metrics.totalTeams,
            sub: `${metrics.approvedReg} aprovados`,
            icon: <Shield size={20} />, color: '#3B82F6',
          },
          {
            label: 'Partidas',
            value: metrics.totalMatches,
            sub: `${metrics.finishedMatches} finalizada${metrics.finishedMatches !== 1 ? 's' : ''}`,
            icon: <Target size={20} />, color: '#10B981',
          },
          {
            label: 'Gols marcados',
            value: metrics.totalGoals,
            sub: `${metrics.totalPlayers} jogadores`,
            icon: <Zap size={20} />, color: '#F59E0B',
          },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-2xl p-4 border border-[var(--theme-border)] flex flex-col gap-2"
            style={{ background: 'var(--theme-surface)' }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-widest text-[var(--theme-text-muted)]">{m.label}</p>
              <span style={{ color: m.color }}>{m.icon}</span>
            </div>
            <p className="text-3xl font-black text-white leading-none">{m.value}</p>
            <p className="text-[11px] text-[var(--theme-text-muted)]">{m.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── ALERTA: inscrições pendentes ── */}
      {tourneysWithPending.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-xl border border-yellow-700 bg-yellow-900/30 p-4 flex items-center gap-3"
        >
          <Clock size={18} className="text-yellow-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-yellow-300">
              {metrics.pendingReg} inscrição{metrics.pendingReg > 1 ? 'ões' : ''} aguardando aprovação
            </p>
            <p className="text-[11px] text-yellow-400/70 truncate">
              em: {tourneysWithPending.map(t => t.name).join(', ')}
            </p>
          </div>
          <button
            onClick={() => { onSelectTournament(tourneysWithPending[0].id); onNavigate('tournament-details'); }}
            className="text-[11px] font-black uppercase tracking-wider text-yellow-300 hover:text-white transition-colors flex-shrink-0"
          >
            Ver →
          </button>
        </motion.div>
      )}

      {/* ── TABS ── */}
      <div className="flex gap-1 border-b border-[var(--theme-border)]">
        {([
          { id: 'campeonatos', label: '🏆 Campeonatos' },
          { id: 'atividade',   label: '📊 Atividade' },
          { id: 'artilheiros', label: '⚽ Artilheiros' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-black border-b-2 -mb-px transition-all ${
              activeTab === tab.id
                ? 'border-[var(--theme-primary)] text-white'
                : 'border-transparent text-[var(--theme-text-muted)] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── ABA: CAMPEONATOS ── */}
      {activeTab === 'campeonatos' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
        >
          {tournaments.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon="🏆"
                title="Nenhum campeonato criado"
                description="Crie seu primeiro campeonato para começar a gerenciar partidas e times."
                action={{ label: 'Criar Campeonato', onClick: () => onNavigate('create-tournament') }}
              />
            </div>
          )}

          {tournaments.map((t, i) => {
            const tourneyMatches  = matches.filter(m => m.tournamentId === t.id);
            const finishedCount   = tourneyMatches.filter(m => m.isFinished).length;
            const progress        = tourneyMatches.length > 0 ? (finishedCount / tourneyMatches.length) * 100 : 0;
            const pendingCount    = registrations.filter(r => r.tournamentId === t.id && r.status === 'PENDING').length;

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => { onSelectTournament(t.id); onNavigate('tournament-details'); }}
                className="group cursor-pointer rounded-2xl border border-[var(--theme-border)] overflow-hidden transition-all hover:border-[var(--theme-primary)]/60 hover:shadow-xl hover:shadow-black/30"
                style={{ background: 'var(--theme-surface)' }}
              >
                {/* Banner */}
                <div className="relative h-28 bg-[var(--theme-bg)] overflow-hidden">
                  {t.bannerUrl ? (
                    <img src={t.bannerUrl} className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-5">
                      <Trophy size={80} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--theme-surface)] via-transparent to-transparent" />
                  <div className="absolute top-3 right-3">
                    <TournamentStatusBadge status={t.status} />
                  </div>
                  {pendingCount > 0 && (
                    <div className="absolute top-3 left-3 bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                      {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-black text-white truncate">{t.name}</h3>
                    <p className="text-[11px] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--theme-primary)' }}>
                      {translateSport(t.sport, locale)} • {translateFormat(t.format, locale)}
                    </p>
                  </div>

                  {/* Progress bar */}
                  {tourneyMatches.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-[var(--theme-text-muted)] font-bold">
                        <span>Progresso</span>
                        <span>{finishedCount}/{tourneyMatches.length} partidas</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--theme-bg)] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: 'var(--theme-primary)' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-[11px] text-[var(--theme-text-muted)]">
                      <Users size={13} />
                      <span>{teams.filter(tm => tm.tournamentId === t.id).length} times</span>
                    </div>
                    <span
                      className="text-[11px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                      style={{ color: 'var(--theme-primary)' }}
                    >
                      Gerenciar <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ── ABA: ATIVIDADE ── */}
      {activeTab === 'atividade' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Gráfico de partidas por rodada */}
          <div className="rounded-2xl border border-[var(--theme-border)] p-5 space-y-4" style={{ background: 'var(--theme-surface)' }}>
            <div>
              <h3 className="font-black text-white text-sm">Partidas por Rodada</h3>
              <p className="text-[11px] text-[var(--theme-text-muted)]">Torneio ativo atual</p>
            </div>
            {matchChartData.length > 0 ? (
              <>
                <BarChart2D data={matchChartData} height={100} />
                <div className="flex justify-between text-[10px] text-[var(--theme-text-muted)] font-bold pt-1">
                  {matchChartData.slice(0, 1).map(d => <span key={d.label}>{d.label}</span>)}
                  <span>...</span>
                  {matchChartData.slice(-1).map(d => <span key={d.label}>{d.label}</span>)}
                </div>
              </>
            ) : (
              <div className="h-24 flex items-center justify-center text-[var(--theme-text-muted)] text-sm">
                Nenhuma partida gerada ainda
              </div>
            )}
          </div>

          {/* Últimas partidas */}
          <div className="rounded-2xl border border-[var(--theme-border)] p-5 space-y-3" style={{ background: 'var(--theme-surface)' }}>
            <h3 className="font-black text-white text-sm">Últimas Partidas</h3>
            {recentMatches.length === 0 && (
              <p className="text-sm text-[var(--theme-text-muted)] italic">Nenhuma partida finalizada ainda.</p>
            )}
            {recentMatches.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 py-2 border-b border-[var(--theme-border)] last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-black text-white">
                    <span className="truncate">{m.teamAName}</span>
                    <span className="flex-shrink-0 px-2 py-0.5 rounded font-black text-[12px]"
                          style={{ background: 'var(--theme-primary)', color: 'black' }}>
                      {m.scoreA ?? '—'} × {m.scoreB ?? '—'}
                    </span>
                    <span className="truncate">{m.teamBName}</span>
                  </div>
                  {m.tourneyName && (
                    <p className="text-[10px] text-[var(--theme-text-muted)] truncate mt-0.5">{m.tourneyName}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Distribuição de torneios por status */}
          <div className="rounded-2xl border border-[var(--theme-border)] p-5 lg:col-span-2" style={{ background: 'var(--theme-surface)' }}>
            <h3 className="font-black text-white text-sm mb-4">Visão Geral dos Campeonatos</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['ACTIVE', 'DRAFT', 'FINISHED', 'PENDING'] as const).map(status => {
                const count = tournaments.filter(t => t.status === status).length;
                const labels: Record<string, string> = {
                  ACTIVE: 'Ativos', DRAFT: 'Rascunho', FINISHED: 'Finalizados', PENDING: 'Pendentes',
                };
                const colors: Record<string, string> = {
                  ACTIVE: '#10B981', DRAFT: '#6B7280', FINISHED: '#8B5CF6', PENDING: '#F59E0B',
                };
                return (
                  <div key={status} className="text-center p-4 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)]">
                    <p className="text-3xl font-black" style={{ color: colors[status] }}>{count}</p>
                    <p className="text-[11px] font-bold text-[var(--theme-text-muted)] uppercase mt-1">{labels[status]}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── ABA: ARTILHEIROS ── */}
      {activeTab === 'artilheiros' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {topScorers.length === 0 && (
            <EmptyState icon="⚽" title="Nenhum gol registrado" description="Os artilheiros aparecem aqui conforme os resultados são lançados." />
          )}
          {topScorers.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-4 p-4 rounded-xl border border-[var(--theme-border)] transition-all hover:border-[var(--theme-primary)]/40"
              style={{ background: 'var(--theme-surface)' }}
            >
              {/* Posição */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                  i === 0 ? 'bg-yellow-500 text-black' :
                  i === 1 ? 'bg-slate-400 text-black' :
                  i === 2 ? 'bg-amber-700 text-white' :
                  'bg-[var(--theme-bg)] text-[var(--theme-text-muted)]'
                }`}
              >
                {i + 1}
              </div>

              {/* Avatar */}
              <PlayerAvatar name={p.name} photoUrl={p.photoUrl} size="sm" />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-sm truncate">{p.name}</p>
                <p className="text-[11px] text-[var(--theme-text-muted)] truncate">{p.teamName} • {p.position}</p>
              </div>

              {/* Gols */}
              <div className="flex items-center gap-3 flex-shrink-0 text-right">
                <div>
                  <p className="text-xl font-black text-white">{p.goals || 0}</p>
                  <p className="text-[10px] text-[var(--theme-text-muted)] font-bold">Gols</p>
                </div>
                {(p.assists || 0) > 0 && (
                  <div>
                    <p className="text-lg font-black text-[var(--theme-text-muted)]">{p.assists}</p>
                    <p className="text-[10px] text-[var(--theme-text-muted)] font-bold">Assis.</p>
                  </div>
                )}
                {i < 3 && (
                  <span className="text-lg">{['🥇', '🥈', '🥉'][i]}</span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default OrganizerDashboard;
