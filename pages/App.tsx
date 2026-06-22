import React, { useState, useEffect, useMemo } from "react";
import {
  AppState,
  User,
  UserRole,
  PlanType,
  PlayerProfile,
  Tournament,
  Match,
  PlanUpgradeRequest,
  PlanStatus,
  Team,
  Player,
  TournamentAwards,
  MatchEvent,
  SportType,
  TournamentFormat,
  FinalFormat,
  PlanConfig,
  Advertisement,
  NewsItem,
  ContractInvitation,
  SocialLink,
  ClubPlayer,
  UserStatus,
  TournamentRegistration,
  ChangeLogEntry,
  MarketStatus,
  Negotiation,
  League,
  MarketSettings,
  MarketPlayer,
  AppSettings,
  Proposal,
  TransferHistory,
  LeagueInvitation,
  LeagueMember,
  LeagueMemberStatus,
  ExperienceType,
} from "../types";
import {
  generateId,
  generateTestScenario,
  deleteFromSupabase,
  deleteWhereFromSupabase,
} from "../services/dataService";
import { BASE_PLAYERS_X1, MARKET_KEY } from "../constants";
import { REAL_PLAYER_NAMES } from "../src/constants/realPlayers";
import { hashPassword } from "../services/authService";

import Sidebar from "../components/Sidebar";
import LanguageSelector from "../components/LanguageSelector";
import { useLocale } from "../src/contexts/LocaleContext";
import { useApp } from "../src/contexts/AppContext";
import { translateSport, translateFormat, translateStatus, translatePlan } from "../src/i18n";
import { LoadingSpinner } from "../src/components/ui";
import {
  Settings,
  Trophy,
  Users,
  Plus,
  BarChart,
  LayoutDashboard,
} from "../components/Icons";
import Login from "./Login";
import AdminDashboard from "./AdminDashboard";
import AdminPersonalizacao from "./AdminPersonalizacao";
import CreateTournament from "./CreateTournament";
import PlayerInvitations from "./PlayerInvitations";
import TournamentDetails from "./TournamentDetails";
import OrganizerSettings from "./OrganizerSettings";
import PlayerDashboard from "./PlayerDashboard";
import Market from "./Market";
import Stats from "./Stats";
import Landing from "./Landing";
import FederationPublic from "./FederationPublic";
import OrganizerDashboard from "./OrganizerDashboard";
import { NotificationCenter } from "../src/components/NotificationCenter";
import { usePaymentGateway } from "../src/components/PaymentGateway";
import { Gamepad2, Menu, X } from "../components/Icons";

const ExperienceSelection: React.FC<{ onSelect: (exp: ExperienceType) => void; images?: any; lastExperience?: ExperienceType | null; onContinue?: () => void }> = ({ onSelect, images = {}, lastExperience, onContinue }) => {
  const { T } = useLocale();
  const LOGO = images.logo || 'https://i.imgur.com/3tIJK4S.png';
  const bgImage = images.experienceBg;
  const x1Image = images.experienceX1;
  const clubsImage = images.experienceClubs;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 overflow-y-auto"
         style={bgImage
           ? { backgroundImage: `linear-gradient(rgba(13,14,18,0.85), rgba(13,14,18,0.92)), url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
           : { background: 'radial-gradient(ellipse at top, #2A2D38 0%, #15171D 60%, #0D0E12 100%)' }}>
       {/* Textura de estádio ao fundo */}
       {!bgImage && <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{ backgroundImage: 'repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px)' }} />}

       <div className="max-w-5xl w-full text-center py-8 relative z-10">
          <div className="absolute top-0 right-0">
            <LanguageSelector variant="full" dropDirection="down" />
          </div>

          {/* Logo do projeto */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-[var(--primary)] blur-[50px] opacity-40 rounded-full"></div>
              <img src={LOGO} className="relative w-28 h-28 md:w-36 md:h-36 object-contain drop-shadow-[0_0_25px_rgba(255,106,0,0.5)]" alt="WORD PRO ARENA" />
            </div>
            <h1 className="text-3xl md:text-5xl font-black italic text-white uppercase tracking-tighter">{T.auth.chooseExperience}</h1>
            <p className="text-slate-400 text-[10px] md:text-sm mt-2 uppercase tracking-[0.3em] font-bold">{T.auth.chooseExperienceDesc}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-8 max-w-3xl mx-auto">
            {/* CARD X1 */}
            <button
              onClick={() => onSelect(ExperienceType.X1)}
              className="group relative w-full rounded-3xl overflow-hidden border-2 border-white/10 hover:border-[var(--primary)] transition-all duration-500 hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f4c75 50%, #1a1a2e 100%)', aspectRatio: '360 / 384' }}
            >
              {/* Diagonais decorativas */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute -right-10 top-10 w-40 h-2 bg-cyan-400 rotate-45"></div>
                <div className="absolute -right-6 top-16 w-32 h-1.5 bg-pink-500 rotate-45"></div>
                <div className="absolute -left-10 bottom-20 w-40 h-2 bg-yellow-400 -rotate-45"></div>
              </div>
              {/* Brilho estádio */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent"></div>

              {/* Imagem do jogador (personalizada pelo admin) */}
              {x1Image && (
                <img src={x1Image} className="absolute object-contain pointer-events-none drop-shadow-2xl"
                  style={{
                    width: `${images.experienceX1Zoom || 85}%`,
                    left: `${images.experienceX1PosX ?? 70}%`,
                    top: `${images.experienceX1PosY ?? 100}%`,
                    transform: 'translate(-50%, -50%)',
                    maxWidth: 'none',
                    maxHeight: 'none',
                  }} alt="" />
              )}

              <div className={`relative h-full flex flex-col ${x1Image ? 'items-start justify-end pb-16 pl-6' : 'items-center justify-center'} gap-4 p-6`}>
                <div className="w-20 h-20 md:w-24 md:h-24 bg-white/15 backdrop-blur rounded-full flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-500 shadow-2xl">
                  <Gamepad2 size={42} className="text-white group-hover:text-[#0f4c75]" />
                </div>
                <div className={x1Image ? 'text-left' : ''}>
                  <h2 className="text-2xl md:text-4xl font-black italic text-white uppercase tracking-tight drop-shadow-lg">⚽ X1</h2>
                  <p className="text-cyan-200 text-[9px] md:text-[11px] mt-2 uppercase tracking-widest font-black">Competição direta entre players</p>
                </div>
              </div>
              {/* Faixa inferior estilo "reward" */}
              <div className="absolute bottom-0 inset-x-0 bg-black/40 backdrop-blur py-2.5 border-t border-white/10">
                <span className="text-white font-black text-xs uppercase tracking-widest">▸ Jogar X1</span>
              </div>
            </button>

            {/* CARD PRO CLUBS */}
            <button
              onClick={() => onSelect(ExperienceType.PRO_CLUBS)}
              className="group relative w-full rounded-3xl overflow-hidden border-2 border-white/10 hover:border-[var(--primary)] transition-all duration-500 hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #4a148c 0%, #6a1b9a 50%, #1a1a2e 100%)', aspectRatio: '360 / 384' }}
            >
              <div className="absolute inset-0 opacity-30">
                <div className="absolute -right-10 top-12 w-40 h-2 bg-lime-400 rotate-45"></div>
                <div className="absolute -right-6 top-20 w-32 h-1.5 bg-cyan-400 rotate-45"></div>
                <div className="absolute -left-10 bottom-24 w-40 h-2 bg-pink-500 -rotate-45"></div>
              </div>
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent"></div>

              {/* Imagem do jogador (personalizada pelo admin) */}
              {clubsImage && (
                <img src={clubsImage} className="absolute object-contain pointer-events-none drop-shadow-2xl"
                  style={{
                    width: `${images.experienceClubsZoom || 85}%`,
                    left: `${images.experienceClubsPosX ?? 70}%`,
                    top: `${images.experienceClubsPosY ?? 100}%`,
                    transform: 'translate(-50%, -50%)',
                    maxWidth: 'none',
                    maxHeight: 'none',
                  }} alt="" />
              )}

              <div className={`relative h-full flex flex-col ${clubsImage ? 'items-start justify-end pb-16 pl-6' : 'items-center justify-center'} gap-4 p-6`}>
                <div className="w-20 h-20 md:w-24 md:h-24 bg-white/15 backdrop-blur rounded-full flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-500 shadow-2xl">
                  <Users size={42} className="text-white group-hover:text-[#6a1b9a]" />
                </div>
                <div className={clubsImage ? 'text-left' : ''}>
                  <h2 className="text-2xl md:text-4xl font-black italic text-white uppercase tracking-tight drop-shadow-lg">⚽ PRO CLUBS</h2>
                  <p className="text-purple-200 text-[9px] md:text-[11px] mt-2 uppercase tracking-widest font-black">Gestão de elenco e federações (11x11)</p>
                </div>
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-black/40 backdrop-blur py-2.5 border-t border-white/10">
                <span className="text-white font-black text-xs uppercase tracking-widest">▸ Jogar Pro Clubs</span>
              </div>
            </button>
          </div>

          <p className="mt-8 text-[10px] font-bold text-slate-600 uppercase tracking-widest">WORD PRO ARENA | {T.landing.tagline}</p>

          {/* Botão continuar — se já escolheu antes */}
          {lastExperience && onContinue && (
            <button
              onClick={onContinue}
              className="mt-6 inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[var(--primary)] hover:opacity-90 text-white font-black uppercase tracking-widest text-sm transition-all shadow-lg"
            >
              ▸ Continuar como {lastExperience === ExperienceType.X1 ? 'X1' : 'Pro Clubs'}
            </button>
          )}
       </div>
    </div>
  );
}


const App: React.FC = () => {
  const { locale, T } = useLocale();
  const { openPayment, PaymentModal } = usePaymentGateway();

  // ── Consumir AppContext — elimina ~1380 linhas de estado duplicado ──────────
  const {
    state, setState,
    currentPage, setCurrentPage, navigateTo,
    selectedLeagueId, setSelectedLeagueId,
    globalExperience, setGlobalExperience,
    landingView, setLandingView,
    loginMode, setLoginMode,
    isSidebarRetracted, setIsSidebarRetracted,
    selectedTournamentId, setSelectedTournamentId,
    publicMarketView, setPublicMarketView,
    isLoading, syncStatus,
    notifications, unreadCount, addNotification, markAllRead, markRead, clearNotifications,
    currentOrganizerId,
    filteredLeagues, filteredLeagueInvitations,
    filteredTournaments, filteredTeams,
    filteredPlayers, filteredMatches,
    filteredNews, filteredAds, filteredLogs,
    filteredPropostas, filteredHistory, filteredNegotiations,
    showMarketFeatures,
    handleLogin, handleLogout, handleRegister,
    handleUpdateSettings, logSystemAction,
    showToast,
  } = useApp();

  // Tela de seleção de modo — aparece ao abrir o app (uma vez por sessão do navegador)
  const [showExperienceGate, setShowExperienceGate] = React.useState(() => {
    try { return !sessionStorage.getItem('pwa_experience_gate_seen'); } catch { return true; }
  });
  React.useEffect(() => {
    if (!showExperienceGate) {
      try { sessionStorage.setItem('pwa_experience_gate_seen', '1'); } catch {}
    }
  }, [showExperienceGate]);


  const handleUpdateLogStatus = (
    id: string,
    status: "ACCEPTED" | "REVERT_NEEDED",
  ) => {
    setState((prev) => ({
      ...prev,
      systemLogs: prev.systemLogs.map((log) =>
        log.id === id ? { ...log, status } : log,
      ),
    }));
  };

  const handleClearLogs = () => {
    setState(prev => ({ ...prev, systemLogs: [] }));
    logSystemAction("Admin", "Todos os logs do sistema foram limpos pelo administrador", true);
  };

  const handleClearScreenshots = () => {
    setState(prev => ({
      ...prev,
      matches: prev.matches.map(m => ({ ...m, screenshotUrl: undefined }))
    }));
    logSystemAction("Admin", "Todas as capturas de tela de partidas foram removidas para liberar espaço", true);
  };

  const handleUpdatePassword = async (
    oldPass: string,
    newPass: string,
  ): Promise<{ success: boolean; msg: string }> => {
    if (!state.currentUser)
      return { success: false, msg: "Usuário não logado." };

    const user = state.users.find((u) => u.id === state.currentUser!.id);
    if (!user) return { success: false, msg: "Usuário não encontrado." };

    const hashedOld = await hashPassword(oldPass);

    // Check legacy plain text or hash
    if (user.password !== oldPass && user.password !== hashedOld) {
      return { success: false, msg: "Senha atual incorreta." };
    }

    const hashedNew = await hashPassword(newPass);

    const updatedUser = { ...user, password: hashedNew };
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === user.id ? updatedUser : u)),
      currentUser: updatedUser,
    }));

    logSystemAction(
      "Segurança",
      `Senha alterada para usuário: ${user.username}`,
      true,
    );
    return { success: true, msg: "Senha alterada com sucesso!" };
  };

  const handleSelectExperience = (exp: ExperienceType) => {
    setGlobalExperience(exp);
    if (state.currentUser) {
      handleUpdateUser(state.currentUser.id, { experiencePreference: exp });
    }
  };

  const handleChangeExperience = () => {
    // Reseta a experiência para fazer a tela de seleção reaparecer
    setGlobalExperience(null);
    if (state.currentUser) {
      handleUpdateUser(state.currentUser.id, { experiencePreference: undefined as any });
    }
  };

  const handleJoinLeague = (leagueId: string) => {
    if (!state.currentUser) { setCurrentPage('login'); return; }
    const already = state.leagueMembers?.some(m => m.leagueId === leagueId && m.userId === state.currentUser!.id);
    if (already) return;
    setState(prev => ({
      ...prev,
      leagueMembers: [...(prev.leagueMembers || []), {
        id: generateId(), leagueId, userId: state.currentUser!.id,
        role: 'MEMBER', status: 'ACTIVE', joinedAt: Date.now(),
      }]
    }));
  };

  const handleApproveUpgrade = (requestId: string) => {
    setState(prev => {
      const req = prev.planUpgradeRequests.find(r => r.id === requestId);
      if (!req) return prev;
      return {
        ...prev,
        users: prev.users.map(u => u.id === req.userId ? { ...u, plan: req.requestedPlan, planStatus: 'ACTIVE' as any } : u),
        planUpgradeRequests: prev.planUpgradeRequests.map(r => r.id === requestId ? { ...r, status: 'APPROVED' as any } : r),
      };
    });
  };

  const handleRejectUpgrade = (requestId: string) => {
    setState(prev => ({
      ...prev,
      planUpgradeRequests: prev.planUpgradeRequests.map(r => r.id === requestId ? { ...r, status: 'REJECTED' as any } : r),
    }));
  };

  const handleRequestUpgrade = (plan: any) => {
    if (!state.currentUser) return;
    setState(prev => ({
      ...prev,
      planUpgradeRequests: [...(prev.planUpgradeRequests || []), {
        id: generateId(), userId: state.currentUser!.id,
        requestedPlan: plan, status: 'PENDING' as any, timestamp: Date.now(),
      }]
    }));
  };

  const handleUpdatePlanManually = (userId: string, plan: any, status: any) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, plan, planStatus: status } : u),
    }));
  };

  const handleUpdateUserStatus = (userId: string, status: any) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, status } : u),
    }));
  };

  const handleCreateLeague = (nameOrData: any, entranceType?: string, type?: string, experienceType?: any) => {
    const leagueData = typeof nameOrData === 'string'
      ? { name: nameOrData, entranceType, type, experienceType }
      : nameOrData;
    const newLeague = { 
      ...leagueData, 
      id: generateId(), 
      organizadorId: state.currentUser?.id, 
      createdAt: Date.now(),
      slug: leagueData.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()
    };
    setState(prev => ({ ...prev, leagues: [...prev.leagues, newLeague] }));
    logSystemAction('Federação', `Nova federação criada: ${leagueData.name}`);
  };

  const handleUpdateLeague = (id: string, updates: any) => {
    setState(prev => ({ ...prev, leagues: prev.leagues.map(l => l.id === id ? { ...l, ...updates } : l) }));
  };

  const handleDeleteLeague = (id: string) => {
    setState(prev => ({ ...prev, leagues: prev.leagues.filter(l => l.id !== id) }));
  };

  const handleSendLeagueInvitation = (data: any) => {
    const invite = { ...data, id: generateId(), organizadorId: state.currentUser?.id, status: 'pendente', timestamp: Date.now() };
    setState(prev => ({ ...prev, leagueInvitations: [...(prev.leagueInvitations || []), invite] }));
  };

  const handleRespondToLeagueInvitation = (id: string, accept: boolean) => {
    setState(prev => ({
      ...prev,
      leagueInvitations: prev.leagueInvitations.map(i => i.id === id ? { ...i, status: accept ? 'aceito' : 'recusado' } : i),
    }));
  };

  const handleUpdateLeagueMemberStatus = (memberId: string, status: any) => {
    setState(prev => ({
      ...prev,
      leagueMembers: (prev.leagueMembers || []).map(m => m.id === memberId ? { ...m, status } : m),
    }));
  };

  const handleUpdateLeagueMarketStatus = (leagueId: string, status: any) => {
    setState(prev => ({ ...prev, leagues: prev.leagues.map(l => l.id === leagueId ? { ...l, marketStatus: status } : l) }));
  };

  const handleEnviarProposta = (data: any) => {
    const proposta = { ...data, id: generateId(), organizadorId: state.currentUser?.organizadorId, timestamp: Date.now(), status: 'PENDENTE' };
    setState(prev => ({ ...prev, propostas: [...(prev.propostas || []), proposta] }));
  };

  const handleResponderProposta = (id: string, aceitar: boolean) => {
    setState(prev => ({
      ...prev,
      propostas: (prev.propostas || []).map(p => p.id === id ? { ...p, status: aceitar ? 'ACEITA' : 'RECUSADA' } : p),
    }));
  };

  const handleTransferirManual = (data: any) => {
    const hist = { ...data, id: generateId(), timestamp: Date.now() };
    setState(prev => ({ ...prev, historicoTransferencias: [...(prev.historicoTransferencias || []), hist] }));
  };

  // --- ACTIONS ---

  const handleCreateTournament = (data: any) => {
    if (!state.currentUser || state.currentUser.role === UserRole.PLAYER) {
        console.error("Tentativa não autorizada de criar campeonato.");
        return;
    }

    const groupCount = Math.max(1, data.groupCount || 1);
    const tournamentId = generateId();

    const newTournament: Tournament = {
      ...data,
      id: tournamentId,
      organizadorId: state.currentUser.id,
      ligaId: data.ligaId || null,
      experienceType: data.experienceType || (data.ligaId ? state.leagues.find(l => l.id === data.ligaId)?.experienceType : ExperienceType.PRO_CLUBS),
      status: "ACTIVE",
      groups: Array.from({ length: groupCount }).map((_, i) => ({
        id: generateId(),
        name:
          groupCount > 1
            ? `Grupo ${String.fromCharCode(65 + i)}`
            : "Grupo Único",
      })),
      currentRound: 0,
      createdAt: Date.now(),
    };

    const newTeams: Team[] = [];
    const newPlayers: Player[] = [];
    const newRegistrations: any[] = [];
    const createdTeamNames = new Set<string>();

    // 1. Process SELECTED EXISTING TEAMS (Priority - Real Teams from Panel)
    // These teams get linked Owner ID and Snapshot Roster
    if (
      data.selectedExistingTeams &&
      Array.isArray(data.selectedExistingTeams)
    ) {
      data.selectedExistingTeams.forEach((profile: PlayerProfile) => {
        const groupIndex = newTeams.length % newTournament.groups.length;
        const teamId = generateId();

        // Register Team Linked to Owner
        newTeams.push({
          id: teamId,
          organizadorId: state.currentUser!.id,
          name: profile.teamName || "Time Sem Nome",
          tournamentId: newTournament.id,
          groupId: newTournament.groups[groupIndex].id,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
          logoUrl: profile.teamLogoUrl,
          ownerId: profile.userId, // LINK TO OWNER
          ligaId: data.ligaId,
        });

        // Create Registration Record (Auto-approve so it shows in 'My Tournaments')
        newRegistrations.push({
          id: generateId(),
          organizadorId: state.currentUser!.id,
          tournamentId: newTournament.id,
          teamOwnerId: profile.userId,
          teamName: profile.teamName || "Time Sem Nome",
          teamLogoUrl: profile.teamLogoUrl,
          status: "APPROVED",
          timestamp: Date.now(),
          roster: profile.clubData?.roster || [],
        });

        // SNAPSHOT ROSTER (Copy players from owner profile to tournament)
        if (profile.clubData && profile.clubData.roster) {
          profile.clubData.roster.forEach((clubPlayer) => {
            newPlayers.push({
              id: generateId(),
              organizadorId: state.currentUser!.id,
              name: clubPlayer.name,
              position: clubPlayer.position as any,
              teamId: teamId,
              goals: 0,
              assists: 0,
              mvps: 0,
              playedMatches: 0,
              totalRating: 0,
              photoUrl: clubPlayer.photoUrl,
              rating: clubPlayer.averageRating,
              ligaId: data.ligaId,
            });
          });
        }

        createdTeamNames.add(profile.teamName || "");
      });
    }

    // 2. Process MANUAL TEXT NAMES (If not already created via selection)
    // These are dummy teams without owners
    data.teamNames.forEach((name: string) => {
      if (name.trim() === "" || createdTeamNames.has(name.trim())) return; // Skip duplicates

      const groupIndex = newTeams.length % newTournament.groups.length;
      const teamId = generateId();
      newTeams.push({
        id: teamId,
        organizadorId: state.currentUser!.id,
        name: name,
        tournamentId: newTournament.id,
        groupId: newTournament.groups[groupIndex].id,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        ligaId: data.ligaId,
      });

      // REMOVED: Automatic fake players generation.
      // The team starts empty.
    });

    setState((prev) => ({
      ...prev,
      tournaments: [...prev.tournaments, newTournament],
      teams: [...prev.teams, ...newTeams],
      players: [...prev.players, ...newPlayers],
      registrations: [...prev.registrations, ...newRegistrations],
      marketPlayers:
        data.tournamentType === "X1"
          ? [
              ...prev.marketPlayers,
              ...BASE_PLAYERS_X1.map((p) => ({
                ...p,
                id: generateId(),
                tournamentId: newTournament.id,
              })),
            ]
          : prev.marketPlayers,
    }));

    logSystemAction(
      "Campeonatos",
      `Novo campeonato criado: ${newTournament.name} (${newTournament.format})`,
      true,
    );

    setSelectedTournamentId(newTournament.id);
    setCurrentPage("tournament-details");
  };

  // --- COMPREHENSIVE MATCH GENERATION ---
  const handleGenerateMatches = () => {
    if (!selectedTournamentId) return;
    const tournament = state.tournaments.find(
      (t) => t.id === selectedTournamentId,
    );
    if (!tournament) return;

    // ── Converter participantes manuais em times se existirem ────────────────
    const manualParticipants = (tournament as any).manualParticipants || [];
    if (manualParticipants.length > 0) {
      const existingTeamNames = state.teams
        .filter(t => t.tournamentId === tournament.id)
        .map(t => t.name.toLowerCase());

      const groups = tournament.groups || [];
      const hasGroups = groups.length > 0;

      const newTeams = manualParticipants
        .filter((p: any) => !existingTeamNames.includes(p.name.toLowerCase()))
        .map((p: any, index: number) => ({
          id: generateId(),
          name: p.name,
          tournamentId: tournament.id,
          organizadorId: tournament.organizadorId,
          ligaId: tournament.ligaId,
          // Distribui em rodízio entre os grupos (A, B, C, D, A, B...) em vez de jogar todos no A
          groupId: hasGroups ? groups[index % groups.length].id : 'NONE',
          ownerId: tournament.organizadorId,
          roster: [],
          played: 0, won: 0, drawn: 0, lost: 0,
          goalsFor: 0, goalsAgainst: 0, points: 0,
        }));

      if (newTeams.length > 0) {
        setState(prev => ({
          ...prev,
          teams: [...prev.teams, ...newTeams],
        }));
        showToast(`${newTeams.length} times adicionados ao campeonato.`, 'success');
        // Aguardar state atualizar antes de gerar jogos
        setTimeout(() => handleGenerateMatchesInternal(tournament.id), 100);
        return;
      }
    }

    handleGenerateMatchesInternal(tournament.id);
  };

  const handleGenerateMatchesInternal = (tournamentId: string) => {
    const tournament = state.tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;

    const newMatches: Match[] = [];
    const teams = state.teams.filter((t) => t.tournamentId === tournament.id);

    // --- LOGIC 1: LEAGUE / PONTOS CORRIDOS ---
    if (
      tournament.format === TournamentFormat.LEAGUE ||
      tournament.format === TournamentFormat.PONTOS_CORRIDOS ||
      tournament.format === TournamentFormat.PONTOS_CORRIDOS_PLAYOFF
    ) {
      const existingMatches = state.matches.filter(
        (m) => m.tournamentId === tournament.id,
      );
      const teamsCount = teams.length;

      if (teamsCount < 2) {
        showToast("Precisa de pelo menos 2 times para gerar jogos.", "error");
        return;
      }

      const roundsPerTurn = teamsCount % 2 === 0 ? teamsCount - 1 : teamsCount;

      if (existingMatches.length === 0) {
        // --- GENERATE 1ST TURN (Circle Method) ---
        let tournamentTeams = [...teams];
        if (tournamentTeams.length % 2 !== 0) {
          tournamentTeams.push({
            id: "BYE",
            name: "BYE",
            tournamentId: "",
            groupId: "",
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            points: 0,
          } as any);
        }

        const numTeams = tournamentTeams.length;
        const matchesPerRound = numTeams / 2;
        const fixedTeam = tournamentTeams[0];
        let rotatingTeams = tournamentTeams.slice(1);

        for (let r = 1; r <= roundsPerTurn; r++) {
          const roundMatches: { home: Team; away: Team }[] = [];
          roundMatches.push({
            home: fixedTeam,
            away: rotatingTeams[rotatingTeams.length - 1],
          });

          for (let i = 0; i < matchesPerRound - 1; i++) {
            roundMatches.push({
              home: rotatingTeams[i],
              away: rotatingTeams[rotatingTeams.length - 2 - i],
            });
          }

          roundMatches.forEach((matchup) => {
            if (matchup.home.id !== "BYE" && matchup.away.id !== "BYE") {
              // Randomize home/away for the first turn to balance (simple swap on even rounds)
              const isSwap = r % 2 === 0;
              newMatches.push({
                id: generateId(),
                organizadorId: tournament.organizadorId,
                tournamentId: tournament.id,
                ligaId: tournament.ligaId,
                groupId: tournament.groups[0]?.id || "",
                homeTeamId: isSwap ? matchup.away.id : matchup.home.id,
                awayTeamId: isSwap ? matchup.home.id : matchup.away.id,
                homeScore: null,
                awayScore: null,
                round: r,
                isFinished: false,
                events: [],
                stage: "LEAGUE",
              });
            }
          });
          rotatingTeams.unshift(rotatingTeams.pop()!);
        }
        showToast(`Tabela gerada com sucesso! (${roundsPerTurn} rodadas)`, "success");
      } else {
        showToast("A tabela já foi gerada!", "warning");
        return;
      }
    }
    // --- LOGIC 2: GROUPS / MATA-MATA ---
    else if (tournament.format === TournamentFormat.GROUPS) {
      // Prevent duplicates if already generated
      if (
        state.matches.some(
          (m) => m.tournamentId === tournament.id && m.stage === "GROUP",
        )
      ) {
        showToast("Jogos já foram gerados!", "warning");
        return;
      }

      tournament.groups.forEach((group) => {
        const groupTeams = teams.filter((t) => t.groupId === group.id);
        for (let i = 0; i < groupTeams.length; i++) {
          for (let j = i + 1; j < groupTeams.length; j++) {
            // Rodada 1 (Ida / 1º Turno)
            newMatches.push({
              id: generateId(),
              organizadorId: tournament.organizadorId,
              tournamentId: tournament.id,
              ligaId: tournament.ligaId,
              groupId: group.id,
              homeTeamId: groupTeams[i].id,
              awayTeamId: groupTeams[j].id,
              homeScore: null,
              awayScore: null,
              round: 1,
              isFinished: false,
              events: [],
              stage: "GROUP",
            });

            // Rodada 2 (Volta / 2º Turno) - Checks doubleRoundRobin flag (set in CreateTournament)
            const isDoubleLeg =
              tournament.fase_grupo === "Ida e Volta" ||
              tournament.doubleRoundRobin;
            if (isDoubleLeg) {
              newMatches.push({
                id: generateId(),
                organizadorId: tournament.organizadorId,
                tournamentId: tournament.id,
                ligaId: tournament.ligaId,
                groupId: group.id,
                homeTeamId: groupTeams[j].id,
                awayTeamId: groupTeams[i].id,
                homeScore: null,
                awayScore: null,
                round: 2,
                isFinished: false,
                events: [],
                stage: "GROUP",
              });
            }
          }
        }
      });
    }
    // --- LOGIC 3: SWISS SYSTEM (Pairing) ---
    else if (tournament.format === TournamentFormat.SWISS) {
      const currentRoundMatches = state.matches.filter(
        (m) => m.tournamentId === tournament.id,
      );
      const roundNumber =
        currentRoundMatches.length > 0
          ? Math.max(...currentRoundMatches.map((m) => m.round)) + 1
          : 1;
      const totalRounds = tournament.swissRounds || 3;

      if (roundNumber > totalRounds) {
        showToast(`Todas as ${totalRounds} rodadas do sistema suíço já foram geradas. Finalize para o mata-mata.`, 'warning');
        return;
      }

      // If not round 1, check if previous round finished
      if (roundNumber > 1) {
        const prevRoundMatches = currentRoundMatches.filter(
          (m) => m.round === roundNumber - 1,
        );
        if (prevRoundMatches.some((m) => !m.isFinished)) {
          showToast("Finalize todos os jogos da rodada anterior antes de gerar a próxima.", 'warning');
          return;
        }
      }

      // Sort teams by Points (Swiss Logic: High vs High)
      const sortedTeams = [...teams].sort(
        (a, b) =>
          b.points - a.points ||
          b.goalsFor - a.goalsAgainst - (a.goalsFor - a.goalsAgainst),
      );

      // Pairing
      const paired = new Set<string>();
      for (let i = 0; i < sortedTeams.length; i++) {
        if (paired.has(sortedTeams[i].id)) continue;

        const teamA = sortedTeams[i];
        let teamB: Team | undefined;

        // Find next available opponent
        for (let j = i + 1; j < sortedTeams.length; j++) {
          if (!paired.has(sortedTeams[j].id)) {
            teamB = sortedTeams[j];
            break;
          }
        }

        if (teamB) {
          newMatches.push({
            id: generateId(),
            organizadorId: tournament.organizadorId,
            tournamentId: tournament.id,
            ligaId: tournament.ligaId,
            groupId: "swiss_stage",
            homeTeamId: teamA.id,
            awayTeamId: teamB.id,
            homeScore: null,
            awayScore: null,
            round: roundNumber,
            isFinished: false,
            events: [],
            stage: "SWISS",
          });
          paired.add(teamA.id);
          paired.add(teamB.id);
        }
      }
    }
    // --- LOGIC 4: KNOCKOUT DIRECT (No Groups) ---
    else if (tournament.format === TournamentFormat.KNOCKOUT) {
      if (state.matches.some((m) => m.tournamentId === tournament.id)) {
        showToast("Chaveamento já gerado!", "warning");
        return;
      }

      const teamCount = teams.length;
      // Determine starting stage
      let stageName: Match["stage"] = "R16";
      let totalRounds = 4;
      if (teamCount <= 2) {
        stageName = "FINAL";
        totalRounds = 1;
      } else if (teamCount <= 4) {
        stageName = "SF";
        totalRounds = 2;
      } else if (teamCount <= 8) {
        stageName = "QF";
        totalRounds = 3;
      }

      // Simple shuffle or seeded if available (Random for now)
      const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

      // Generate Round 1 (Filled with teams)
      for (let i = 0; i < shuffledTeams.length; i += 2) {
        if (shuffledTeams[i + 1]) {
          const teamA = shuffledTeams[i];
          const teamB = shuffledTeams[i + 1];
          newMatches.push({
            id: generateId(),
            organizadorId: tournament.organizadorId,
            tournamentId: tournament.id,
            ligaId: tournament.ligaId,
            groupId: "knockout_bracket",
            homeTeamId: teamA.id,
            awayTeamId: teamB.id,
            homeScore: null,
            awayScore: null,
            round: 1,
            isFinished: false,
            events: [],
            stage: stageName,
          });
        }
      }

      // Generate subsequent empty rounds for tree structure
      let matchesInRound = newMatches.length;
      let currentRound = 1;
      const stages = ["R16", "QF", "SF", "FINAL"];
      let currentStageIndex = stages.indexOf(stageName || "R16");

      while (matchesInRound > 1) {
        matchesInRound = Math.ceil(matchesInRound / 2);
        currentRound++;
        currentStageIndex++;
        const nextStageName = stages[currentStageIndex] || "FINAL";

        for (let i = 0; i < matchesInRound; i++) {
          newMatches.push({
            id: generateId(),
            organizadorId: tournament.organizadorId,
            tournamentId: tournament.id,
            ligaId: tournament.ligaId,
            groupId: "knockout_bracket",
            homeTeamId: "TBD",
            awayTeamId: "TBD",
            homeScore: null,
            awayScore: null,
            round: currentRound,
            isFinished: false,
            events: [],
            stage: nextStageName,
          });
        }
      }
    }

    setState((prev) => ({
      ...prev,
      matches: [
        ...prev.matches.filter(m => m.tournamentId !== tournament.id),
        ...newMatches,
      ],
    }));

    logSystemAction(
      "Motor de Partidas",
      `Geradas ${newMatches.length} partidas para ${tournament.name}`,
      true,
    );
  };

  // --- UPDATED MATCH HANDLER WITH AUTO-PROGRESSION ---
  const handleUpdateUser = (userId: string, updates: Partial<User>) => {
    setState((prev) => {
      const updatedUsers = prev.users.map((u) => u.id === userId ? { ...u, ...updates } : u);
      const updatedCurrentUser = prev.currentUser?.id === userId ? { ...prev.currentUser, ...updates } : prev.currentUser;
      return { ...prev, users: updatedUsers, currentUser: updatedCurrentUser };
    });
  };

  const handleUpdateMatch = (matchId: string, updates: Partial<Match>) => {
    // 1. Log the update (Action Recording)
    const match = state.matches.find((m) => m.id === matchId);
    if (match) {
      let desc = `Atualização na partida ${matchId.substring(0, 4)}`;
      if (updates.homeScore !== undefined)
        desc = `Placar atualizado: Casa ${updates.homeScore} x Fora ${updates.awayScore}`;
      if (updates.isFinished) desc += " (Finalizado)";
      logSystemAction("Partidas", desc, true);
    }

    setState((prev) => {
      // 2. Update the specific match
      let updatedMatches = prev.matches.map((m) =>
        m.id === matchId ? { ...m, ...updates } : m,
      );

      // 3. Logic for Tournament Stats (Groups/League) & Player Stats
      if (updates.isFinished || updates.homeScore !== undefined) {
        const match = updatedMatches.find((m) => m.id === matchId);
        if (match) {
          const tourneyMatches = updatedMatches.filter(
            (m) => m.tournamentId === match.tournamentId && m.isFinished,
          );

          // --- RECALCULATE TEAM STATS (Points only for League/Groups) ---
          const teamsMap = new Map<string, Team>();
          prev.teams
            .filter((t) => t.tournamentId === match.tournamentId)
            .forEach((t) => {
              teamsMap.set(t.id, {
                ...t,
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                points: 0,
              });
            });

          tourneyMatches.forEach((m) => {
            const h = teamsMap.get(m.homeTeamId);
            const a = teamsMap.get(m.awayTeamId);
            if (h && a && m.homeScore !== null && m.awayScore !== null) {
              const sh = Number(m.homeScore);
              const sa = Number(m.awayScore);

              // Only count towards standings if it's a group/league/swiss match
              const isStandingsMatch =
                m.stage === "GROUP" ||
                m.stage === "SWISS" ||
                m.stage === "LEAGUE" ||
                !m.stage;

              if (isStandingsMatch) {
                h.played++;
                a.played++;
                h.goalsFor += sh;
                h.goalsAgainst += sa;
                a.goalsFor += sa;
                a.goalsAgainst += sh;

                if (sh > sa) {
                  h.won++;
                  h.points += 3;
                  a.lost++;
                } else if (sa > sh) {
                  a.won++;
                  a.points += 3;
                  h.lost++;
                } else {
                  h.drawn++;
                  h.points += 1;
                  a.drawn++;
                  a.points += 1;
                }
              }
            }
          });
          const newTeams = prev.teams.map((t) => teamsMap.get(t.id) || t);

          // --- RECALCULATE PLAYER STATS (CENTRAL DE ESTATÍSTICAS) ---
          // --- CRIAR JOGADORES VIRTUAIS X1 (id começa com 'x1-') que aparecem nos events ---
          const virtualPlayers: Player[] = [];
          tourneyMatches.forEach((m) => {
            m.events?.forEach((event) => {
              if (event.playerId?.startsWith('x1-') && !prev.players.some(p => p.id === event.playerId) && !virtualPlayers.some(p => p.id === event.playerId)) {
                const teamId = event.playerId.replace('x1-', '');
                const team = prev.teams.find(t => t.id === teamId);
                if (team) {
                  virtualPlayers.push({
                    id: event.playerId,
                    name: team.name,
                    teamId: team.id,
                    tournamentId: match.tournamentId,
                    organizadorId: team.organizadorId,
                    position: 'X1',
                    goals: 0, assists: 0, mvps: 0, playedMatches: 0, rating: 0, totalRating: 0,
                  } as any);
                }
              }
            });
          });

          const tourneyPlayers = [...prev.players.filter((p) => {
            const team = prev.teams.find((t) => t.id === p.teamId);
            return team && team.tournamentId === match.tournamentId;
          }), ...virtualPlayers];

          const playersMap = new Map<string, Player>();
          tourneyPlayers.forEach((p) => {
            playersMap.set(p.id, {
              ...p,
              goals: 0,
              assists: 0,
              mvps: 0,
              playedMatches: 0,
              totalRating: 0,
              rating: 0,
            });
          });

          tourneyMatches.forEach((m) => {
            const hasParticipationEvents = m.events?.some(
              (e) => e.type === "PARTICIPATION",
            );

            if (hasParticipationEvents) {
              m.events.forEach((event) => {
                if (event.type === "PARTICIPATION") {
                  const player = playersMap.get(event.playerId);
                  if (player) player.playedMatches++;
                }
              });
            } else {
              // Fallback: Increment playedMatches for all players in the rosters of these two teams
              const homeTeamPlayers = tourneyPlayers.filter(
                (p) => p.teamId === m.homeTeamId,
              );
              const awayTeamPlayers = tourneyPlayers.filter(
                (p) => p.teamId === m.awayTeamId,
              );

              homeTeamPlayers.forEach((p) => {
                const player = playersMap.get(p.id);
                if (player) player.playedMatches++;
              });
              awayTeamPlayers.forEach((p) => {
                const player = playersMap.get(p.id);
                if (player) player.playedMatches++;
              });
            }

            // Process Events
            if (m.events && Array.isArray(m.events)) {
              m.events.forEach((event) => {
                const player = playersMap.get(event.playerId);
                if (player) {
                  if (event.type === "GOAL") player.goals += event.value || 1;
                  if (event.type === "ASSIST")
                    player.assists += event.value || 1;
                  if (event.type === "MVP") player.mvps++;
                  if (event.type === "RATING" && event.value !== undefined) {
                    player.totalRating += event.value;
                  }
                }
              });
            }

            // If match has mvpPlayerId outside events
            if (m.mvpPlayerId) {
              const player = playersMap.get(m.mvpPlayerId);
              const alreadyCounted = m.events?.some(
                (e) => e.type === "MVP" && e.playerId === m.mvpPlayerId,
              );
              if (player && !alreadyCounted) player.mvps++;
            }
          });

          // Calculate average rating
          playersMap.forEach((p) => {
            const ratingEventsCount = tourneyMatches.reduce((acc, m) => {
              const matchRatingEvents =
                m.events?.filter(
                  (e) => e.type === "RATING" && e.playerId === p.id,
                ) || [];
              return acc + matchRatingEvents.length;
            }, 0);

            if (ratingEventsCount > 0) {
              p.rating = Number((p.totalRating / ratingEventsCount).toFixed(2));
            } else {
              p.rating = 0;
            }
          });

          // Inclui jogadores existentes atualizados + novos jogadores virtuais X1
          const newPlayers = [
            ...prev.players.map((p) => playersMap.get(p.id) || p),
            ...virtualPlayers.map(vp => playersMap.get(vp.id)).filter(Boolean) as Player[],
          ];

          // 4. LOGIC FOR KNOCKOUT PROGRESSION (MATA-MATA TREE)
          if (
            match &&
            match.stage &&
            match.stage !== "GROUP" &&
            match.stage !== "SWISS" &&
            match.stage !== "LEAGUE" &&
            match.isFinished
          ) {
            // Determine Winner
            let winnerId = "";
            if (match.isDecidedByPenalties) {
              if ((match.homePenaltyScore ?? 0) > (match.awayPenaltyScore ?? 0))
                winnerId = match.homeTeamId;
              else if (
                (match.awayPenaltyScore ?? 0) > (match.homePenaltyScore ?? 0)
              )
                winnerId = match.awayTeamId;
            } else if ((match.homeScore ?? -1) > (match.awayScore ?? -1))
              winnerId = match.homeTeamId;
            else if ((match.awayScore ?? -1) > (match.homeScore ?? -1))
              winnerId = match.awayTeamId;

            if (winnerId && winnerId !== "TBD") {
              const currentRoundMatches = updatedMatches
                .filter(
                  (m) =>
                    m.tournamentId === match.tournamentId &&
                    m.stage === match.stage,
                )
                .sort((a, b) => a.id.localeCompare(b.id));

              const matchIndex = currentRoundMatches.findIndex(
                (m) => m.id === match.id,
              );

              if (matchIndex !== -1) {
                const nextMatchIndex = Math.floor(matchIndex / 2);
                const isHomeSlot = matchIndex % 2 === 0;
                const nextRoundNumber = match.round + 1;
                const nextRoundMatches = updatedMatches
                  .filter(
                    (m) =>
                      m.tournamentId === match.tournamentId &&
                      m.round === nextRoundNumber,
                  )
                  .sort((a, b) => a.id.localeCompare(b.id));

                if (nextRoundMatches[nextMatchIndex]) {
                  const targetMatch = nextRoundMatches[nextMatchIndex];
                  updatedMatches = updatedMatches.map((m) => {
                    if (m.id === targetMatch.id) {
                      if (isHomeSlot) return { ...m, homeTeamId: winnerId };
                      else return { ...m, awayTeamId: winnerId };
                    }
                    return m;
                  });
                }
              }
            }
          }

          return {
            ...prev,
            matches: updatedMatches,
            teams: newTeams,
            players: newPlayers,
          };
        }
      }

      return { ...prev, matches: updatedMatches };
    });
  };

  // ... (Rest of App.tsx remains unchanged)
  // ✅ 3) FINALIZAR FASE (GRUPO/SUIÇO) -> MATA-MATA (CORRIGIDO PARA CRUZAMENTO)
  const handleAdvanceToKnockout = (tournamentId: string) => {
    const tournament = state.tournaments.find((t) => t.id === tournamentId);
    if (!tournament) return;

    // GUARD: Check if knockout matches ALREADY exist.
    if (
      state.matches.some(
        (m) =>
          m.tournamentId === tournament.id &&
          m.stage &&
          m.stage !== "GROUP" &&
          m.stage !== "SWISS" &&
          m.stage !== "LEAGUE",
      )
    ) {
      showToast("O mata-mata já foi gerado. Se precisar refazer, resete o torneio.", 'warning');
      return;
    }

    const allTeams = state.teams.filter((t) => t.tournamentId === tournamentId);
    const newMatches: Match[] = [];
    let nextRoundMatchesCount = 0; // To track how many matches in R1

    // A) SWISS SYSTEM CUT (Standard Top N)
    if (tournament.format === TournamentFormat.SWISS) {
      const sorted = [...allTeams].sort(
        (a, b) =>
          b.points - a.points ||
          b.goalsFor - a.goalsAgainst - (a.goalsFor - a.goalsAgainst),
      );
      const count = sorted.length;
      const cutSize = count >= 16 ? 16 : count >= 8 ? 8 : 4;
      const qualifiedTeams = sorted.slice(
        0,
        count >= cutSize ? cutSize : count % 2 === 0 ? count : count - 1,
      );

      // Pair Top vs Bottom (1 vs 16, 2 vs 15...)
      for (let i = 0; i < qualifiedTeams.length / 2; i++) {
        newMatches.push({
          id: generateId(),
          organizadorId: tournament.organizadorId,
          tournamentId,
          ligaId: tournament.ligaId,
          groupId: "knockout_bracket",
          homeTeamId: qualifiedTeams[i].id,
          awayTeamId: qualifiedTeams[qualifiedTeams.length - 1 - i].id,
          homeScore: null,
          awayScore: null,
          round: 1,
          isFinished: false,
          events: [],
          stage: cutSize === 16 ? "R16" : cutSize === 8 ? "QF" : "SF",
        });
      }
      nextRoundMatchesCount = newMatches.length;
    }
    // B) GROUP STAGE CUT (CROSS GROUP LOGIC: 1A vs 2B, 1B vs 2A)
    else {
      const qualifiersPerGroup = tournament.classificados_por_grupo || 2;
      const groups = tournament.groups; // Ordered list of groups [A, B, C, D...]

      // We iterate groups in pairs: (A & B), (C & D), etc.
      for (let i = 0; i < groups.length; i += 2) {
        const group1 = groups[i];
        const group2 = groups[i + 1]; // Valid if groups count is even

        if (group1 && group2) {
          // Get sorted teams for Group 1
          const teamsG1 = allTeams
            .filter((t) => t.groupId === group1.id)
            .sort(
              (a, b) =>
                b.points - a.points ||
                b.goalsFor - a.goalsAgainst - (a.goalsFor - a.goalsAgainst),
            );

          // Get sorted teams for Group 2
          const teamsG2 = allTeams
            .filter((t) => t.groupId === group2.id)
            .sort(
              (a, b) =>
                b.points - a.points ||
                b.goalsFor - a.goalsAgainst - (a.goalsFor - a.goalsAgainst),
            );

          // Match 1: 1st G1 vs 2nd G2
          if (teamsG1[0] && teamsG2[1]) {
            newMatches.push({
              id: generateId(),
              organizadorId: tournament.organizadorId,
              tournamentId,
              ligaId: tournament.ligaId,
              groupId: "knockout_bracket",
              homeTeamId: teamsG1[0].id,
              awayTeamId: teamsG2[1].id,
              homeScore: null,
              awayScore: null,
              round: 1,
              isFinished: false,
              events: [],
              stage:
                groups.length * qualifiersPerGroup === 16
                  ? "R16"
                  : groups.length * qualifiersPerGroup === 8
                    ? "QF"
                    : "SF",
            });
          }

          // Match 2: 1st G2 vs 2nd G1
          if (teamsG2[0] && teamsG1[1]) {
            newMatches.push({
              id: generateId(),
              organizadorId: tournament.organizadorId,
              tournamentId,
              ligaId: tournament.ligaId,
              groupId: "knockout_bracket",
              homeTeamId: teamsG2[0].id,
              awayTeamId: teamsG1[1].id,
              homeScore: null,
              awayScore: null,
              round: 1,
              isFinished: false,
              events: [],
              stage:
                groups.length * qualifiersPerGroup === 16
                  ? "R16"
                  : groups.length * qualifiersPerGroup === 8
                    ? "QF"
                    : "SF",
            });
          }
        } else if (group1 && !group2) {
          // Odd number of groups edge case (rare in even bracket),
          // usually handle Best 3rds here, simplifying to 1st vs 2nd internal if only 1 group
          const teamsG1 = allTeams
            .filter((t) => t.groupId === group1.id)
            .sort((a, b) => b.points - a.points);
          if (teamsG1[0] && teamsG1[1] && teamsG1[2] && teamsG1[3]) {
            // 1 vs 4
            newMatches.push({
              id: generateId(),
              organizadorId: tournament.organizadorId,
              tournamentId,
              groupId: "knockout_bracket",
              homeTeamId: teamsG1[0].id,
              awayTeamId: teamsG1[3].id,
              homeScore: null,
              awayScore: null,
              round: 1,
              isFinished: false,
              events: [],
              stage: "SF",
            });
            // 2 vs 3
            newMatches.push({
              id: generateId(),
              organizadorId: tournament.organizadorId,
              tournamentId,
              groupId: "knockout_bracket",
              homeTeamId: teamsG1[1].id,
              awayTeamId: teamsG1[2].id,
              homeScore: null,
              awayScore: null,
              round: 1,
              isFinished: false,
              events: [],
              stage: "SF",
            });
          }
        }
      }
      nextRoundMatchesCount = newMatches.length;
    }

    // --- GENERATE EMPTY SLOTS FOR FUTURE ROUNDS (TREE STRUCTURE) ---
    // If we generated 8 matches (R16), we need 4 QF, 2 SF, 1 Final slots.
    // The `handleUpdateMatch` logic relies on these existing with 'TBD' to move winners forward.

    let currentStageName = newMatches[0]?.stage || "FINAL";
    const stagesOrder = ["R16", "QF", "SF", "FINAL"];
    let stageIdx = stagesOrder.indexOf(currentStageName);
    let currentRoundNum = 1;

    while (nextRoundMatchesCount > 1) {
      nextRoundMatchesCount = Math.ceil(nextRoundMatchesCount / 2);
      currentRoundNum++;
      stageIdx++;
      const nextStageName = stagesOrder[stageIdx] || "FINAL";

      for (let i = 0; i < nextRoundMatchesCount; i++) {
        newMatches.push({
          id: generateId(), // ID generation order ensures correct index mapping (0,1 -> 0)
          organizadorId: tournament.organizadorId,
          tournamentId,
          groupId: "knockout_bracket",
          homeTeamId: "TBD",
          awayTeamId: "TBD",
          homeScore: null,
          awayScore: null,
          round: currentRoundNum,
          isFinished: false,
          events: [],
          stage: nextStageName,
        });
      }
    }

    setState((prev) => ({
      ...prev,
      matches: [...prev.matches, ...newMatches],
    }));

    logSystemAction(
      "Motor de Partidas",
      `Fase de Mata-Mata gerada para ${tournament.name}`,
      true,
    );
    showToast(`Mata-Mata Gerado! ${newMatches.length} jogos criados na árvore.`, "success");
  };

  const handleAddPlayer = (teamId: string, player: Partial<Player>) => {
    // Find tournament Id from team
    const team = state.teams.find(t => t.id === teamId);
    const tournament = state.tournaments.find(t => t.id === team?.tournamentId);
    
    const newPlayer: Player = {
      id: generateId(),
      organizadorId: tournament?.organizadorId || currentOrganizerId!,
      name: player.name || "Novo Jogador",
      position: player.position || "ST",
      teamId,
      goals: 0,
      assists: 0,
      mvps: 0,
      playedMatches: 0,
      totalRating: 0,
      ...player,
    } as Player;
    setState((prev) => ({ ...prev, players: [...prev.players, newPlayer] }));
    logSystemAction("Elenco", `Jogador adicionado ao time ${teamId}`, true);
  };

  const handleUpdateProfile = (updates: Partial<PlayerProfile>) => {
    if (!state.currentUser) return;
    setState((prev) => {
      const updatedProfiles = prev.playerProfiles.map((p) =>
        p.userId === state.currentUser!.id ? { ...p, ...updates } : p,
      );

      // Sincronizar com o Time se houver mudança no roster, nome ou logo
      let updatedTeams = prev.teams;
      const isManager = state.currentUser?.role === UserRole.TEAM_MANAGER;
      
      if (isManager) {
        updatedTeams = prev.teams.map(t => {
          if (t.ownerId === state.currentUser?.id || t.managerId === state.currentUser?.id) {
            const teamUpdates: Partial<Team> = {};
            if (updates.clubData?.roster) teamUpdates.roster = updates.clubData.roster;
            if (updates.teamName) teamUpdates.name = updates.teamName;
            if (updates.teamLogoUrl) teamUpdates.logoUrl = updates.teamLogoUrl;
            
            if (Object.keys(teamUpdates).length > 0) {
              return { ...t, ...teamUpdates };
            }
          }
          return t;
        });
      } else {
        // PLAYER X1 team synchronisation
        updatedTeams = prev.teams.map(t => {
          if (t.ownerId === state.currentUser?.id) {
            const teamUpdates: Partial<Team> = {};
            if (updates.nickname) teamUpdates.name = updates.nickname;
            if (updates.photoUrl) teamUpdates.logoUrl = updates.photoUrl;
            
            if (Object.keys(teamUpdates).length > 0) {
              return { ...t, ...teamUpdates };
            }
          }
          return t;
        });
      }

      return {
        ...prev,
        playerProfiles: updatedProfiles,
        teams: updatedTeams
      };
    });
  };

  const handleDistributeAwards = (
    tournamentId: string,
    awards: TournamentAwards,
  ) => {
    // 1. Update Tournament with Awards
    setState((prev) => ({
      ...prev,
      tournaments: prev.tournaments.map((t) =>
        t.id === tournamentId ? { ...t, awards } : t,
      ),
    }));

    // 2. Distribute Trophies to Profiles
    const awardMapping: {
      key: keyof TournamentAwards;
      type: any;
      title: string;
    }[] = [
      { key: "goldenGloveId", type: "GOLDEN_GLOVE", title: "Luva de Ouro" },
      { key: "bestDefenderId", type: "PITBULL", title: "Pitbull da Zaga" },
      {
        key: "bestMidfielderId",
        type: "ORCHESTRATOR",
        title: "Maestro do Meio",
      },
      { key: "bestStrikerId", type: "TOP_SCORER", title: "Artilheiro Máximo" },
      { key: "mvpId", type: "MVP_AWARD", title: "MVP da Temporada" },
    ];

    setState((prev) => {
      const newProfiles = [...prev.playerProfiles];

      awardMapping.forEach((aw) => {
        const winnerId = awards[aw.key];
        if (winnerId) {
          const player = prev.players.find((p) => p.id === winnerId);
          if (player) {
            // Try to find linked profile or fallback to name matching
            let profileIdx = -1;
            if (player.linkedProfileId) {
              profileIdx = newProfiles.findIndex(
                (p) => p.userId === player.linkedProfileId,
              );
            }

            if (profileIdx !== -1) {
              newProfiles[profileIdx] = {
                ...newProfiles[profileIdx],
                trophies: [
                  ...newProfiles[profileIdx].trophies,
                  {
                    id: generateId(),
                    title: `${aw.title}`,
                    type: aw.type,
                    imageUrl: "",
                    date: Date.now(),
                  },
                ],
              };
            }
          }
        }
      });

      return { ...prev, playerProfiles: newProfiles };
    });
    logSystemAction(
      "Premiação",
      `Prêmios distribuídos para torneio ${tournamentId}`,
      true,
    );
    showToast("Premiação distribuída e enviada para a galeria dos jogadores!", "success");
  };

  const handleFinishTournament = (tournamentId: string) => {
    const tournament = state.tournaments.find((t) => t.id === tournamentId);
    if (!tournament) return;

    // 1. Mark as FINISHED
    const updatedTournaments = state.tournaments.map((t) =>
      t.id === tournamentId ? { ...t, status: "FINISHED" as const } : t,
    );

    let nextTeams = [...state.teams];
    let nextPlayers = [...state.players];

    // 2. Process Qualification Rules
    if (tournament.qualificationRules && tournament.qualificationRules.length > 0) {
      // Calculate standings (simple points -> GD -> GF)
      const tournamentTeams = state.teams.filter((t) => t.tournamentId === tournamentId);
      const sortedTeams = [...tournamentTeams].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const bGD = b.goalsFor - b.goalsAgainst;
        const aGD = a.goalsFor - a.goalsAgainst;
        if (bGD !== aGD) return bGD - aGD;
        return b.goalsFor - a.goalsFor;
      });

      tournament.qualificationRules.forEach((rule) => {
        const qualifiedTeams = sortedTeams.slice(rule.startPosition - 1, rule.endPosition);
        const destinationTournament = state.tournaments.find(
          (t) => t.id === rule.destinationTournamentId,
        );

        if (destinationTournament) {
          qualifiedTeams.forEach((qTeam) => {
            // Check if team of same name and owner already exists in destination
            const teamExists = nextTeams.some(
              (t) =>
                t.tournamentId === destinationTournament.id &&
                t.name === qTeam.name,
            );

            if (!teamExists) {
              const newTeamId = generateId();
              const newTeam: Team = {
                ...qTeam,
                id: newTeamId,
                tournamentId: destinationTournament.id,
                ligaId: destinationTournament.ligaId,
                // Reset stats for new tournament
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                points: 0,
                groupId: destinationTournament.groups[0]?.id || "",
              };
              nextTeams.push(newTeam);

              // Clone current players too
              const currentPlayers = state.players.filter(
                (p) => p.teamId === qTeam.id,
              );
              const clonedPlayers = currentPlayers.map((p) => ({
                ...p,
                id: generateId(),
                teamId: newTeamId,
                ligaId: destinationTournament.ligaId,
                goals: 0,
                assists: 0,
                mvps: 0,
                playedMatches: 0,
                totalRating: 0,
              }));
              nextPlayers.push(...clonedPlayers);
            }
          });
        }
      });
    }

    setState((prev) => ({
      ...prev,
      tournaments: updatedTournaments,
      teams: nextTeams,
      players: nextPlayers,
    }));

    logSystemAction(
      "Campeonatos",
      `Campeonato ${tournament.name} finalizado e classificações processadas`,
      true,
    );
  };

  const handleRespondContractInvite = (inviteId: string, accept: boolean) => {
    setState((prev) => {
      // 1. Find the invite
      const invite = prev.contractInvitations.find((i) => i.id === inviteId);
      if (!invite) return prev;

      // 2. Update Invitations list
      const updatedInvitations = prev.contractInvitations.map((i) =>
        i.id === inviteId
          ? { ...i, status: accept ? "ACCEPTED" : ("REJECTED" as any) }
          : i,
      );

      // If rejected, just return updated invitations
      if (!accept) {
        return { ...prev, contractInvitations: updatedInvitations };
      }

      // 3. Handle Acceptance - Data Manipulation
      const senderIndex = prev.playerProfiles.findIndex(
        (p) => p.userId === invite.senderUserId,
      );
      const recipientIndex = prev.playerProfiles.findIndex(
        (p) => p.userId === invite.recipientUserId,
      );

      if (senderIndex > -1 && recipientIndex > -1) {
        // Create a shallow copy of profiles to modify
        const updatedProfiles = [...prev.playerProfiles];
        const senderProfile = updatedProfiles[senderIndex];
        const recipientProfile = updatedProfiles[recipientIndex];

        // A. PREPARE ROSTER PLAYER
        const newRosterPlayer: ClubPlayer = {
          id: recipientProfile.userId,
          name:
            recipientProfile.nickname ||
            prev.users.find((u) => u.id === recipientProfile.userId)?.name ||
            "Jogador",
          position: recipientProfile.positions[0] || "ST",
          photoUrl: recipientProfile.photoUrl || "", // Ensure photo carries over
          status: "ACTIVE",
          matches: 0,
          goals: 0,
          assists: 0,
          averageRating: 6.0,
          isCaptain: false,
          isViceCaptain: false,
          tipo: 'sistema',
          userId: recipientProfile.userId
        };

        // B. UPDATE OWNER (SENDER) PROFILE
        const currentClubData = senderProfile.clubData || {
          foundingYear: "2024",
          primaryColor: "#000000",
          secondaryColor: "#ffffff",
          roster: [],
          notices: [],
          history: [],
        };

        // Prevent duplicates
        let newRoster = [...currentClubData.roster];
        if (!newRoster.some((p) => p.id === newRosterPlayer.id)) {
          newRoster.push(newRosterPlayer);
        }

        updatedProfiles[senderIndex] = {
          ...senderProfile,
          clubData: {
            ...currentClubData,
            roster: newRoster,
          },
        };

        // C. UPDATE PLAYER (RECIPIENT) PROFILE
        const senderTeam = state.teams.find(
          (t) => t.managerId === invite.senderUserId,
        );
        updatedProfiles[recipientIndex] = {
          ...recipientProfile,
          teamName: invite.senderTeamName,
          teamLogoUrl: invite.senderTeamLogo,
          teamId: senderTeam ? senderTeam.id : undefined,
        };

        return {
          ...prev,
          contractInvitations: updatedInvitations,
          playerProfiles: updatedProfiles,
        };
      }

      return { ...prev, contractInvitations: updatedInvitations };
    });
    logSystemAction(
      "Mercado",
      `Convite ${accept ? "Aceito" : "Recusado"}`,
      true,
    );
  };

  const handleSendInvite = (targetPlayerId: string) => {
    if (!state.currentUser || state.currentUser.role !== UserRole.TEAM_MANAGER)
      return;
    const ownerProfile = state.playerProfiles.find(
      (p) => p.userId === state.currentUser!.id,
    );
    if (!ownerProfile || !ownerProfile.teamName) {
      showToast("Configure seu time antes de contratar.", "error");
      return;
    }

    const newInvite: ContractInvitation = {
      id: generateId(),
      organizadorId: state.currentUser.organizadorId!,
      senderUserId: state.currentUser.id,
      senderTeamName: ownerProfile.teamName,
      senderTeamLogo: ownerProfile.teamLogoUrl || "",
      recipientUserId: targetPlayerId,
      status: "PENDING",
      timestamp: Date.now(),
    };

    setState((prev) => ({
      ...prev,
      contractInvitations: [...prev.contractInvitations, newInvite],
    }));
    logSystemAction(
      "Mercado",
      `Convite enviado para jogador ${targetPlayerId}`,
      true,
    );
    showToast("Proposta enviada!", "success");
  };

  // Calculate Team Data for Player View
  const playerTeamData = useMemo(() => {
    if (!state.currentUser) return undefined;
    if (state.currentUser.role === UserRole.TEAM_MANAGER) return undefined;

    // Find if player is in a Roster
    // Safe access with optional chaining
    for (const p of state.playerProfiles) {
      if (
        p.clubData &&
        p.clubData.roster &&
        p.clubData.roster.some((rp) => rp.id === state.currentUser!.id)
      ) {
        return p.clubData;
      }
    }
    return undefined;
  }, [state.currentUser, state.playerProfiles]);

  // Fallback profile generation for non-existing profiles
  const currentProfile = useMemo(() => {
    if (!state.currentUser) return null;
    const existing = state.playerProfiles.find(
      (p) => p.userId === state.currentUser!.id,
    );
    if (existing) return existing;

    // Create a temporary fallback profile if none exists
    return {
      userId: state.currentUser.id,
      nickname: state.currentUser.name,
      platforms: [],
      positions: [],
      mode: "VIRTUAL",
      trophies: [],
      // If team owner, provide empty club data structure
      ...(state.currentUser.role === UserRole.TEAM_MANAGER
        ? {
            clubData: {
              foundingYear: new Date().getFullYear().toString(),
              primaryColor: "#000000",
              secondaryColor: "#ffffff",
              roster: [],
              notices: [],
              history: [],
            },
          }
        : {}),
    } as PlayerProfile;
  }, [state.currentUser, state.playerProfiles]);

  const inscreverMeuTime = (tournament: Tournament) => {
    if (!state.currentUser) return;

    const ownerProfile = state.playerProfiles.find(
      (p) => p.userId === state.currentUser!.id,
    );
    if (!ownerProfile) {
      showToast("Complete seu perfil antes de se inscrever.", "error");
      return;
    }

    // Em X1, usa o nickname como nome do time se não tiver teamName
    const teamNameForReg = ownerProfile.teamName || ownerProfile.nickname || state.currentUser!.name || state.currentUser!.username;

    const jaInscrito = state.registrations.some(
      (r) =>
        r.tournamentId === tournament.id &&
        r.teamOwnerId === state.currentUser!.id,
    );
    if (jaInscrito) {
      showToast("Sua equipe já está inscrita neste campeonato.", "warning");
      return;
    }

    const doInscrever = () => {
      const newReg: TournamentRegistration = {
        id: generateId(),
        organizadorId: tournament.organizadorId,
        tournamentId: tournament.id,
        teamOwnerId: state.currentUser!.id,
        teamName: teamNameForReg,
        teamLogoUrl: ownerProfile.photoUrl || ownerProfile.teamLogoUrl,
        status: "PENDING",
        timestamp: Date.now(),
        roster: ownerProfile.clubData?.roster || [],
      };
      setState((prev) => ({
        ...prev,
        registrations: [...prev.registrations, newReg],
      }));
      showToast("Solicitação enviada ao Organizador!", "success");
    };

    // Se torneio é pago, abrir gateway antes de inscrever
    if (tournament.isPaid && tournament.entryFee && parseFloat(tournament.entryFee) > 0) {
      openPayment(
        {
          amountCents: Math.round(parseFloat(tournament.entryFee) * 100),
          currency: 'BRL',
          description: `Inscrição: ${tournament.name}`,
          referenceId: tournament.id,
          pixKey: state.settings.globalImages?.logo ? undefined : undefined, // do .env
        },
        (_paymentId) => doInscrever()
      );
    } else {
      doInscrever();
    }
  };

  const themeColor =
    state.settings.globalTheme?.corPrimaria || '#FF6A00';

  // Não renderiza nada até o Supabase carregar — evita erro de null em currentUser
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center"
           style={{ background: '#1A1C22' }}>
        <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mb-8"
             style={{ borderColor: '#FF6A00', borderTopColor: 'transparent' }} />
        <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-2">
          Sincronizando Arena...
        </h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
          Aguarde enquanto carregamos os dados.
        </p>
      </div>
    );
  }

  return (
    <div 
      className="flex min-h-screen font-sans" 
      style={{ backgroundColor: 'var(--bg-global)', color: 'var(--texto-global)' }}
    >
            {/* EXPERIENCE SELECTION OVERLAY — aparece ao abrir o app */}
            {showExperienceGate && (
              <ExperienceSelection 
                onSelect={(exp) => { handleSelectExperience(exp); setShowExperienceGate(false); }} 
                images={state.settings.globalImages || {}}
                lastExperience={state.currentUser?.experiencePreference || globalExperience}
                onContinue={() => setShowExperienceGate(false)}
              />
            )}

            {currentPage === "landing" && (
              <Landing 
                state={state} 
                leagueId={selectedLeagueId}
                activeView={landingView}
                onNavigate={(page, mode) => {
                  if (page === 'login' && mode) setLoginMode(mode as any);
                  else setLoginMode('LOGIN');
                  navigateTo(page);
                }}
                onSelectLeague={(id) => {
                  setLandingView('inicio');
                  navigateTo("landing", { leagueId: id });
                }}
                onSelectTournament={(id) => { setSelectedTournamentId(id); navigateTo('tournament-details'); }}
                onJoinLeague={handleJoinLeague}
                onViewMarket={() => setLandingView('market')}
                onNavigateView={(view) => setLandingView(view)}
                globalExperience={globalExperience}
                onSelectExperience={handleSelectExperience}
              />
            )}

      {publicMarketView && selectedLeagueId && (
        <Market
          playerProfiles={state.playerProfiles}
          users={state.users}
          teams={filteredTeams}
          leagues={filteredLeagues}
          themeColor={themeColor}
          currentUser={state.currentUser}
          propostas={filteredPropostas}
          historicoTransferencias={filteredHistory}
          onBack={() => setPublicMarketView(false)}
        />
      )}

      {currentPage === "login" && (
        <Login
          onLogin={handleLogin}
          onRegister={handleRegister}
          onResetPassword={async (u, p) => {
            const user = state.users.find(
              (us) => us.username === u || us.email === u,
            );
            if (!user) return false;
            const hashed = await hashPassword(p);
            setState((prev) => ({
              ...prev,
              users: prev.users.map((us) =>
                us.id === user.id ? { ...us, password: hashed } : us,
              ),
            }));
            logSystemAction(
              "Segurança",
              `Senha redefinida para usuário: ${user.username}`,
              true,
            );
            return true;
          }}
          adminWhatsapp={state.settings.adminWhatsapp}
          supportButtonText={state.settings.supportButtonText}
          systemName={state.settings.brandingTextPrimary ? `${state.settings.brandingTextPrimary} ${state.settings.brandingTextSecondary || ''}` : "PRO WORLD ARENA"}
          customLogoUrl={state.settings.globalImages?.logo || state.settings.loginLogoUrl}
          bannerLogoUrl={state.settings.globalImages?.logo || state.settings.loginBannerLogoUrl}
          customBackgroundUrl={state.settings.globalImages?.loginBg || state.settings.loginBackgroundUrl}
          customBackgroundSize={state.settings.loginBackgroundSize}
          ads={state.ads || []}
          news={state.news || []}
          socialLinks={state.settings.socialLinks}
          loginLayout={state.settings.loginLayout}
          enableExternalCarousel={state.settings.enableExternalCarousel} // PASS PROP
          enableThemedBackground={state.settings.enableThemedBackground} // NEW PROP
          tournaments={state.tournaments} // PASS TOURNAMENTS FOR OFFICIAL SOCIALS
          leagues={state.leagues}
          teams={state.teams}
          playerProfiles={state.playerProfiles}
          users={state.users}
          planConfigs={state.planConfigs} // PASS PLAN CONFIGS
          initialMode={loginMode}
          onBackToHome={() => setCurrentPage('landing')}
        />
      )}

      {/* Public/Guest Pages and Main Content Area */}
      {currentPage !== "login" && currentPage !== "landing" && currentPage !== "federation-public" && (
        <>
          {/* Botão hambúrguer — só mobile */}
          {state.currentUser && currentProfile && (
            <button
              onClick={() => setIsSidebarRetracted(!isSidebarRetracted)}
              className="md:hidden fixed top-4 left-4 z-[60] w-11 h-11 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center shadow-lg"
              style={{ color: themeColor }}
            >
              {isSidebarRetracted ? <Menu size={22} /> : <X size={22} />}
            </button>
          )}

          {/* Overlay escuro mobile quando sidebar aberto */}
          {state.currentUser && currentProfile && !isSidebarRetracted && (
            <div
              className="md:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setIsSidebarRetracted(true)}
            />
          )}

          {state.currentUser && currentProfile && (
            <Sidebar
              role={state.currentUser.role}
              onNavigate={(page) => { setCurrentPage(page); if (window.innerWidth < 768) setIsSidebarRetracted(true); }}
              currentPage={currentPage}
              onLogout={handleLogout}
              onChangeExperience={handleChangeExperience}
              isRetracted={isSidebarRetracted}
              toggleRetract={() => setIsSidebarRetracted(!isSidebarRetracted)}
              themeColor={themeColor}
              organization={state.currentUser.organization}
              pendingLeaguesCount={state.leagueInvitations.filter(
                (i) => (i.jogadorId === state.currentUser!.id || i.email === state.currentUser!.email) && i.status === 'pendente'
              ).length}
              showMarket={showMarketFeatures}
              showStats={globalExperience === 'X11' || state.currentUser?.role === 'ORGANIZER' as any || state.currentUser?.role === 'ADMIN' as any}
              onChangeExperience={handleChangeExperience}
            />
          )}

          {/* NotificationCenter flutuante — aparece no canto superior direito */}
          {state.currentUser && (
            <div className="fixed top-4 right-4 z-[200]">
              <NotificationCenter
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAllRead={markAllRead}
                onMarkRead={markRead}
                onClearAll={clearNotifications}
                onNavigate={setCurrentPage}
              />
            </div>
          )}

          {/* Gateway de pagamento — abre quando inscrição é paga */}
          {PaymentModal}

          <main
            className={`flex-1 overflow-auto transition-all duration-300 ${(!state.currentUser || isSidebarRetracted) ? "ml-0" : "ml-0"}`}
            style={state.settings.globalImages?.homeBg ? { 
                backgroundImage: `url(${state.settings.globalImages.homeBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
            } : {}}
          >
            {currentPage === "dashboard" && state.currentUser && (
              <OrganizerDashboard
                currentUser={state.currentUser}
                tournaments={filteredTournaments}
                teams={filteredTeams}
                matches={filteredMatches}
                players={filteredPlayers}
                registrations={state.registrations}
                leagues={filteredLeagues}
                playerProfiles={state.playerProfiles}
                onNavigate={setCurrentPage}
                onSelectTournament={(id) => {
                  setSelectedTournamentId(id);
                  setCurrentPage('tournament-details');
                }}
              />
            )}


            {currentPage === "create-tournament" &&
              (state.currentUser.role === UserRole.ORGANIZER ||
                state.currentUser.role === UserRole.ADMIN) && (
                <CreateTournament
                  userPlan={state.currentUser.plan || PlanType.FREE}
                  planLimits={
                    state.planConfigs[
                      state.currentUser.plan || PlanType.FREE
                    ] || state.planConfigs[PlanType.FREE]
                  }
                  onBack={() => setCurrentPage("dashboard")}
                  onSubmit={handleCreateTournament}
                  existingTeams={state.playerProfiles.filter(
                    (p) => p.teamName && p.clubData,
                  )} // PASS REAL TEAMS ONLY
                  leagues={filteredLeagues}
                  initialLigaId={selectedLeagueId || ""}
                />
              )}

            {currentPage === "tournament-details" && selectedTournamentId && 
             (state.tournaments.find((t) => t.id === selectedTournamentId) || filteredTournaments.find((t) => t.id === selectedTournamentId)) && (
              <TournamentDetails
                tournament={
                  state.tournaments.find((t) => t.id === selectedTournamentId) || 
                  filteredTournaments.find((t) => t.id === selectedTournamentId)!
                }
                teams={state.teams.filter(
                  (t) => t.tournamentId === selectedTournamentId,
                )}
                matches={state.matches.filter(
                  (m) => m.tournamentId === selectedTournamentId,
                )}
                players={state.players.filter(
                  (p) =>
                    state.teams.find((t) => t.id === p.teamId)?.tournamentId ===
                    selectedTournamentId,
                )}
                playerProfiles={state.playerProfiles}
                registrations={state.registrations.filter(
                  (r) => r.tournamentId === selectedTournamentId,
                )}
                currentUser={state.currentUser}
                allTournaments={filteredTournaments}
                isOrganizer={
                    state.currentUser?.role === UserRole.ORGANIZER ||
                    state.currentUser?.role === UserRole.ADMIN
                }
                onUpdateMatch={handleUpdateMatch}
                onAddPlayer={handleAddPlayer}
                onBulkAddPlayers={(teamId, names) => {
                  names.forEach((line) => {
                    const trimmed = line.trim();
                    if (!trimmed) return;
                    // Regex for "POS - Name" format. Handles En-Dash, Em-Dash, Hyphen
                    const match = trimmed.match(
                      /^([a-zA-Z0-9]{2,4})\s*[-–—]\s*(.+)$/,
                    );
                    if (match) {
                      handleAddPlayer(teamId, {
                        position: match[1].toUpperCase().trim() as any,
                        name: match[2].trim(),
                      });
                    } else {
                      handleAddPlayer(teamId, { name: trimmed });
                    }
                  });
                }}
                onUpdateTeam={(teamId, updates) => {
                  setState((prev) => ({
                    ...prev,
                    teams: prev.teams.map((t) =>
                      t.id === teamId ? { ...t, ...updates } : t,
                    ),
                  }));
                  logSystemAction("Times", `Time ${teamId} atualizado`, true);
                }}
                onGenerateMatches={handleGenerateMatches}
                onDeleteTournament={(id) => {
                  // Remove do estado local
                  setState((prev) => ({
                    ...prev,
                    tournaments: prev.tournaments.filter((t) => t.id !== id),
                    matches: prev.matches.filter((m) => m.tournamentId !== id),
                    teams: prev.teams.filter((t) => t.tournamentId !== id),
                    players: prev.players.filter((p) => p.tournamentId !== id),
                  }));
                  // Remove do Supabase (senão volta no F5)
                  deleteFromSupabase('campeonatos', id);
                  deleteWhereFromSupabase('partidas', 'tournamentId', id);
                  deleteWhereFromSupabase('times', 'tournamentId', id);
                  deleteWhereFromSupabase('jogadores', 'tournamentId', id);
                  deleteWhereFromSupabase('participantes', 'tournamentId', id);
                  logSystemAction(
                    "Campeonatos",
                    "Torneio excluído permanentemente",
                    true,
                  );
                  setCurrentPage("dashboard");
                }}
                onResetTournament={(id) => {
                  setState((prev) => ({
                    ...prev,
                    matches: prev.matches.filter((m) => m.tournamentId !== id),
                    teams: prev.teams.map((t) =>
                      t.tournamentId === id
                        ? {
                            ...t,
                            played: 0,
                            won: 0,
                            drawn: 0,
                            lost: 0,
                            points: 0,
                            goalsFor: 0,
                            goalsAgainst: 0,
                          }
                        : t,
                    ),
                  }));
                  logSystemAction(
                    "Campeonatos",
                    "Torneio resetado (partidas apagadas)",
                    true,
                  );
                }}
                onDistributeAwards={handleDistributeAwards}
                onAdvanceToKnockout={handleAdvanceToKnockout}
                onRegistrationAction={(regId, action) => {
                  const reg = state.registrations.find((r) => r.id === regId);
                  if (reg && action === "APPROVE") {
                    const newTeamId = generateId();
                    const newTeam: Team = {
                      id: newTeamId,
                      organizadorId: reg.organizadorId,
                      name: reg.teamName,
                      logoUrl: reg.teamLogoUrl,
                      tournamentId: reg.tournamentId,
                      groupId:
                        state.tournaments.find((t) => t.id === reg.tournamentId)
                          ?.groups[0].id || "",
                      ownerId: reg.teamOwnerId,
                      played: 0,
                      won: 0,
                      drawn: 0,
                      lost: 0,
                      goalsFor: 0,
                      goalsAgainst: 0,
                      points: 0,
                    };

                    // Create Players from Snapshot (Fix for roster not showing)
                    const newPlayers: Player[] = (reg.roster || []).map(
                      (p) => ({
                        id: generateId(),
                        organizadorId: reg.organizadorId,
                        name: p.name,
                        position: p.position as any,
                        teamId: newTeamId,
                        goals: 0,
                        assists: 0,
                        mvps: 0,
                        playedMatches: 0,
                        totalRating: 0,
                        photoUrl: p.photoUrl,
                        rating: p.averageRating,
                      }),
                    );

                    setState((prev) => ({
                      ...prev,
                      registrations: prev.registrations.map((r) =>
                        r.id === regId ? { ...r, status: "APPROVED" } : r,
                      ),
                      teams: [...prev.teams, newTeam],
                      players: [...prev.players, ...newPlayers], // Add snapshot players to tournament
                    }));
                    logSystemAction(
                      "Inscrições",
                      `Time aprovado: ${reg.teamName}`,
                      true,
                    );
                  } else {
                    setState((prev) => ({
                      ...prev,
                      registrations: prev.registrations.map((r) =>
                        r.id === regId ? { ...r, status: "REJECTED" } : r,
                      ),
                    }));
                    if (reg)
                      logSystemAction(
                        "Inscrições",
                        `Time recusado: ${reg.teamName}`,
                        true,
                      );
                  }
                }}
                onBack={() => {
                  if (!state.currentUser) {
                    setCurrentPage(selectedLeagueId ? "federation-public" : "landing");
                  } else {
                    setCurrentPage("dashboard");
                  }
                }}
                themeColor={themeColor}
                bracketStyle={state.settings.bracketStyle}
                leagues={filteredLeagues}
                onRequestRegistration={inscreverMeuTime}
                onUpdateTournament={(id, updates) =>
                  setState((prev) => ({
                    ...prev,
                    tournaments: prev.tournaments.map((t) =>
                      t.id === id ? { ...t, ...updates } : t,
                    ),
                  }))
                } // Add social handler
                onUpdatePlayer={(playerId, updates) => {
                  setState((prev) => ({
                    ...prev,
                    players: prev.players.map((p) =>
                      p.id === playerId ? { ...p, ...updates } : p,
                    ),
                  }));
                  logSystemAction(
                    "Jogadores",
                    `Jogador ${playerId} atualizado`,
                    true,
                  );
                }}
                onFinishTournament={handleFinishTournament}
              />
            )}

            {currentPage === "admin-dashboard" &&
              state.currentUser.role === UserRole.ADMIN && (
                <AdminDashboard
                  state={state}
                  onApproveOrganizer={(id) =>
                    setState((prev) => ({
                      ...prev,
                      users: prev.users.map((u) =>
                        u.id === id ? { ...u, status: UserStatus.APPROVED } : u,
                      ),
                    }))
                  }
                  onRejectOrganizer={(id) =>
                    setState((prev) => ({
                      ...prev,
                      users: prev.users.map((u) =>
                        u.id === id ? { ...u, status: UserStatus.REJECTED } : u,
                      ),
                    }))
                  }
                  onUpdateSettings={(s) =>
                    setState((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, ...s },
                    }))
                  }
                  onLogoUpload={() => {}}
                  onAddUser={(u) =>
                    setState((prev) => ({ ...prev, users: [...prev.users, u] }))
                  }
                  onDeleteUser={(id) => {
                    setState((prev) => ({
                      ...prev,
                      users: prev.users.filter((u) => u.id !== id),
                    }));
                    deleteFromSupabase('usuarios', id);
                    deleteWhereFromSupabase('perfis', 'userId', id);
                  }}
                  onUpdatePlan={(type, cfg) =>
                    setState((prev) => ({
                      ...prev,
                      planConfigs: { ...prev.planConfigs, [type]: cfg },
                    }))
                  }
                  onAddAd={(ad) =>
                    setState((prev) => ({ ...prev, ads: [...prev.ads, ad] }))
                  }
                  onDeleteAd={(id) =>
                    setState((prev) => ({
                      ...prev,
                      ads: prev.ads.filter((a) => a.id !== id),
                    }))
                  }
                  onNavigate={(page) => setCurrentPage(page)}
                  onToggleOfficialTournament={(id) =>
                    setState((prev) => ({
                      ...prev,
                      tournaments: prev.tournaments.map((t) =>
                        t.id === id ? { ...t, isOfficial: !t.isOfficial } : t,
                      ),
                    }))
                  }
                  onDeleteTournament={(id) => {
                    setState((prev) => ({
                      ...prev,
                      tournaments: prev.tournaments.filter((t) => t.id !== id),
                      matches: prev.matches.filter((m) => m.tournamentId !== id),
                      teams: prev.teams.filter((t) => t.tournamentId !== id),
                      players: prev.players.filter((p) => p.tournamentId !== id),
                    }));
                    deleteFromSupabase('campeonatos', id);
                    deleteWhereFromSupabase('partidas', 'tournamentId', id);
                    deleteWhereFromSupabase('times', 'tournamentId', id);
                    deleteWhereFromSupabase('jogadores', 'tournamentId', id);
                    deleteWhereFromSupabase('participantes', 'tournamentId', id);
                  }}
                  onDeleteNews={(id) =>
                    setState((prev) => ({
                      ...prev,
                      news: prev.news.filter((n) => n.id !== id),
                    }))
                  }
                  onClearLogs={handleClearLogs}
                  onClearScreenshots={handleClearScreenshots}
                  onResetTournament={(id) => {}}
                  onAddNews={(news) =>
                    setState((prev) => ({
                      ...prev,
                      news: [...prev.news, news],
                    }))
                  }
                  onImportAdminPlayers={(players) =>
                    setState((prev) => ({
                      ...prev,
                      adminPlayerBank: [...prev.adminPlayerBank, ...players],
                    }))
                  }
                  onUpdateMarketStatus={(status) =>
                    setState((prev) => ({ 
                      ...prev, 
                      marketStatuses: { ...prev.marketStatuses, [currentOrganizerId!]: status } 
                    }))
                  }
                  onApproveUpgrade={handleApproveUpgrade}
                  onRejectUpgrade={handleRejectUpgrade}
                  onUpdatePlanManually={handleUpdatePlanManually}
                  onUpdateUserStatus={handleUpdateUserStatus}
                  onResetCampeonatos={async () => {
                    // Deleta todos os campeonatos do organizador atual do Supabase
                    const myTournaments = state.tournaments.filter(t => t.organizadorId === state.currentUser!.id || state.currentUser!.role === 'ADMIN');
                    for (const t of myTournaments) {
                      await deleteFromSupabase('campeonatos', t.id);
                      await deleteWhereFromSupabase('partidas', 'tournamentId', t.id);
                      await deleteWhereFromSupabase('times', 'tournamentId', t.id);
                      await deleteWhereFromSupabase('jogadores', 'tournamentId', t.id);
                      await deleteWhereFromSupabase('participantes', 'tournamentId', t.id);
                    }
                    setState(prev => ({ ...prev, tournaments: [], matches: [], teams: [], players: [], registrations: [] }));
                    logSystemAction("Admin", "Campeonatos resetados", true);
                  }}
                  onResetUsuarios={async () => {
                    // Deleta todos os usuários exceto o admin atual
                    const usersToDelete = state.users.filter(u => u.role !== 'ADMIN' && u.id !== state.currentUser!.id);
                    for (const u of usersToDelete) {
                      await deleteFromSupabase('usuarios', u.id);
                      await deleteWhereFromSupabase('perfis', 'userId', u.id);
                    }
                    setState(prev => ({ ...prev, users: prev.users.filter(u => u.role === 'ADMIN' || u.id === prev.currentUser!.id), playerProfiles: [] }));
                    logSystemAction("Admin", "Usuários resetados", true);
                  }}
                  onSeedData={() => {
                    const { tournaments, teams, players, matches } =
                      generateTestScenario(state.currentUser!.id);
                    setState((prev) => ({
                      ...prev,
                      tournaments: [
                        ...prev.tournaments,
                        ...(tournaments || []),
                      ],
                      teams: [...prev.teams, ...(teams || [])],
                      players: [...prev.players, ...(players || [])],
                      matches: [...prev.matches, ...(matches || [])],
                    }));
                    logSystemAction(
                      "Admin",
                      "Reset completo com dados de teste",
                      true,
                    );
                  }}
                />
              )}

            {currentPage === "admin-personalizacao" &&
              state.currentUser.role === UserRole.ADMIN && (
                <AdminPersonalizacao
                  state={state}
                  onUpdateSettings={(s) =>
                    setState((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, ...s },
                    }))
                  }
                  onBack={() => setCurrentPage("admin-dashboard")}
                />
              )}

            {/* Other routes unchanged */}
            {currentPage === "invitations" && state.currentUser && (
              <PlayerInvitations
                invitations={state.leagueInvitations.filter(
                  (i) => (i.jogadorId === state.currentUser!.id || i.email === state.currentUser!.email) && i.status === 'pendente'
                )}
                leagues={state.leagues}
                users={state.users}
                onRespond={handleRespondToLeagueInvitation}
              />
            )}

            {(currentPage === "player-profile" ||
              currentPage === "team-dashboard") &&
              state.currentUser &&
              (state.playerProfiles.find(
                (p) => p.userId === state.currentUser!.id,
              ) || currentProfile ? (
                <PlayerDashboard
                  user={state.currentUser}
                  profile={
                    state.playerProfiles.find(
                      (p) => p.userId === state.currentUser!.id,
                    ) || currentProfile!
                  }
                  allProfiles={state.playerProfiles}
                  playersData={state.players}
                  settings={state.settings}
                  onUpdateProfile={handleUpdateProfile}
                  onUpdateSettings={handleUpdateSettings}
                  onUpdatePassword={handleUpdatePassword}
                  themeColor={themeColor}
                  invitations={(state.contractInvitations || []).filter(
                    (i) =>
                      i.recipientUserId === state.currentUser!.id &&
                      i.status === "PENDING",
                  )}
                  onRespondInvite={handleRespondContractInvite}
                  leagueInvitations={state.leagueInvitations.filter(
                    (i) => (i.jogadorId === state.currentUser!.id || i.email === state.currentUser!.email) && i.status === 'pendente'
                  )}
                  onRespondLeagueInvitation={handleRespondToLeagueInvitation}
                  allLeagues={state.leagues}
                  propostas={filteredPropostas}
                  onResponderProposta={handleResponderProposta}
                  teamData={playerTeamData}
                  allTournaments={filteredTournaments}
                  allMatches={state.matches}
                  allTeams={filteredTeams}
                  registrations={state.registrations}
                  onRequestRegistration={inscreverMeuTime}
                  onTransferirManual={handleTransferirManual}
                  showMarket={false}
                />
              ) : (
                <div className="flex items-center justify-center h-screen bg-brand-dark text-white">
                  Carregando painel...
                </div>
              ))}

            {currentPage === "find-players" && (
              <Market
                playerProfiles={state.playerProfiles}
                users={state.users}
                teams={filteredTeams}
                leagues={filteredLeagues}
                themeColor={themeColor}
                currentUser={state.currentUser || undefined}
                onSendInvite={handleSendInvite}
                onEnviarProposta={handleEnviarProposta}
                propostas={filteredPropostas}
                historicoTransferencias={filteredHistory}
                onResponderProposta={handleResponderProposta}
                onTransferirManual={handleTransferirManual}
                onUpdateLeagueMarketStatus={handleUpdateLeagueMarketStatus}
              />
            )}

            {currentPage === "federation-public" && selectedLeagueId && (
              <FederationPublic
                state={state}
                leagueId={selectedLeagueId}
                currentUser={state.currentUser}
                leagueMembers={state.leagueMembers || []}
                onBack={() => setCurrentPage("landing")}
                onSelectTournament={(id) => { setSelectedTournamentId(id); setCurrentPage("tournament-details"); }}
                onNavigateLogin={() => setCurrentPage("login")}
                onViewMarket={() => setCurrentPage("market")}
                onJoinLeague={handleJoinLeague}
              />
            )}

            {currentPage === "stats" && (
              <Stats
                tournaments={filteredTournaments}
                teams={filteredTeams}
                players={filteredPlayers}
                leagues={filteredLeagues}
                currentUser={state.currentUser}
                onUpdatePlayer={(pid, up) =>
                  setState((prev) => ({
                    ...prev,
                    players: prev.players.map((p) =>
                      p.id === pid ? { ...p, ...up } : p,
                    ),
                  }))
                }
              />
            )}

            {currentPage === "settings" &&
              state.currentUser?.role === UserRole.ORGANIZER && (
                <OrganizerSettings
                  user={state.currentUser}
                  planConfig={
                    state.planConfigs[
                      state.currentUser.plan || PlanType.FREE
                    ] || state.planConfigs[PlanType.FREE]
                  }
                  usage={{
                    tournaments: filteredTournaments.length,
                    groups: filteredTournaments
                      .reduce((acc, t) => acc + t.groups.length, 0),
                    teams: filteredTeams.length,
                  }}
                  systemLogs={filteredLogs} // Pass logs
                  settings={state.settings}
                  onUpdateSettings={handleUpdateSettings}
                  onUpdateUser={(u) =>
                    setState((prev) => ({
                      ...prev,
                      users: prev.users.map((us) =>
                        us.id === state.currentUser!.id ? { ...us, ...u } : us,
                      ),
                      currentUser: { ...state.currentUser!, ...u },
                    }))
                  }
                  onUpdateLogStatus={handleUpdateLogStatus} // Pass handler
                  leagues={state.leagues.filter(l => l.organizadorId === state.currentUser?.id)}
                  onCreateLeague={handleCreateLeague}
                  onUpdateLeague={handleUpdateLeague}
                  onDeleteLeague={handleDeleteLeague}
                  onSendInvitation={handleSendLeagueInvitation}
                  allPlayers={state.users.filter(u => u.role === UserRole.PLAYER || u.role === UserRole.TEAM_MANAGER)}
                  pendingInvitations={state.leagueInvitations.filter(i => i.organizadorId === state.currentUser?.id)}
                  leagueMembers={state.leagueMembers}
                  onUpdateLeagueMemberStatus={handleUpdateLeagueMemberStatus}
                  onRequestUpgrade={handleRequestUpgrade}
                  upgradeRequests={state.planUpgradeRequests.filter(r => r.userId === state.currentUser?.id)}
                />
              )}
          </main>
          {syncStatus !== 'IDLE' && (
            <div className="fixed bottom-4 right-4 z-[3000] flex items-center gap-2 bg-[var(--theme-surface)] border border-[var(--theme-border)] px-4 py-2.5 rounded-full shadow-2xl">
              {syncStatus === 'SYNCING' ? (
                <>
                  <div className="w-3 h-3 border-2 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-black text-white uppercase tracking-wider">Sincronizando...</span>
                </>
              ) : (
                <>
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-wider">Erro na sincronização</span>
                  <button
                    onClick={() => setState(s => ({ ...s }))}
                    className="text-[10px] bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded-full font-black uppercase transition-colors"
                  >
                    Tentar novamente
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
