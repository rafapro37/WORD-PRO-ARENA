import React, { useState, useMemo, useEffect } from 'react';
import { toast } from '../src/lib/toast';
import { Tournament, Team, Match, Player, MatchEvent, TournamentFormat, TournamentAwards, PlayerProfile, TournamentRegistration, User, UserRole, SocialLink } from '../types';
import { POSITIONS, AWARD_LABELS, POSITIONS_VIRTUAL, POSITIONS_REAL } from '../constants';
import { Calendar, Users, BarChart, Trophy, Shirt, Plus, Save, Edit, UserPlus, Check, X, Trash2, Award, Shield, RefreshCw, Crown, ListPlus, Search, Filter, LayoutList, ChevronRight, Zap, ChevronLeft, Image, Upload, Hand, Lock, Info, Clock, DollarSign, AlertTriangle, ChevronDown, ChevronUp, Globe, Instagram, Facebook, Twitter, Youtube, Gamepad2, MessageSquare, LinkIcon, Palette, Settings, Sparkles, CreditCard } from '../components/Icons';
import { extractStatsFromImage, ExtractedPlayerStats } from '../services/ocrService';

interface TournamentDetailsProps {
  tournament: Tournament;
  teams: Team[];
  matches: Match[];
  players: Player[];
  playerProfiles?: PlayerProfile[];
  registrations?: TournamentRegistration[]; 
  currentUser?: User;
  allTournaments: Tournament[];
  isOrganizer: boolean;
  onUpdateMatch: (matchId: string, updates: Partial<Match>) => void;
  onAddPlayer: (teamId: string, player: Partial<Player>) => void;
  onBulkAddPlayers: (teamId: string, names: string[]) => void;
  onUpdateTeam: (teamId: string, updates: Partial<Team>) => void;
  onGenerateMatches: () => void;
  onDeleteTournament: (id: string) => void;
  onResetTournament: (id: string) => void;
  onDistributeAwards: (tournamentId: string, awards: TournamentAwards) => void;
  onAdvanceToKnockout?: (tournamentId: string) => void;
  onMD3Action?: (tournamentId: string) => void;
  onViewTournament?: (id: string) => void;
  onRegistrationAction?: (regId: string, action: 'APPROVE' | 'REJECT') => void;
  onRequestRegistration?: (tournament: Tournament) => void;
  onRemovePlayer?: (playerId: string) => void; 
  onBack: () => void;
  themeColor: string;
  bracketStyle?: 'CHAMPIONS' | 'CLASSIC';
  onUpdateTournament?: (id: string, updates: Partial<Tournament>) => void; 
  onUpdatePlayer?: (playerId: string, updates: Partial<Player>) => void; // Added for position editing
  onFinishTournament?: (id: string) => void;
}

const TournamentDetails: React.FC<TournamentDetailsProps> = ({ 
  tournament, teams, matches, players, playerProfiles = [], registrations = [], currentUser, allTournaments, isOrganizer, onUpdateMatch, onAddPlayer, onBulkAddPlayers, onUpdateTeam, onGenerateMatches, onDeleteTournament, onResetTournament, onDistributeAwards, onAdvanceToKnockout, onMD3Action, onRegistrationAction, onRequestRegistration, onRemovePlayer, onBack, themeColor, bracketStyle = 'CHAMPIONS', onUpdateTournament, onUpdatePlayer, onFinishTournament
}) => {
  const isKnockout = tournament.format === TournamentFormat.KNOCKOUT;
  const isSwiss = tournament.format === TournamentFormat.SWISS;
  const isMD3 = tournament.format === TournamentFormat.MD3;
  const isGroups = tournament.format === TournamentFormat.GROUPS;
  const isLeague = tournament.format === TournamentFormat.LEAGUE;
  const isTeamManager = currentUser?.role === UserRole.TEAM_MANAGER;

  // Decide default tab based on format
  const getDefaultTab = () => {
      if (isKnockout) return 'brackets';
      return 'overview';
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'standings' | 'matches' | 'brackets' | 'teams' | 'participants' | 'my-roster' | 'marketing' | 'appearance' | 'config'>(getDefaultTab());
  const [activeGroupId, setActiveGroupId] = useState<string>(tournament?.groups?.[0]?.id || '');
  
  if (!tournament) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)] p-10">
        <RefreshCw size={48} className="animate-spin text-[var(--primary)] mb-4" />
        <p className="text-xl font-bold italic uppercase tracking-widest">Carregando Campeonato...</p>
        <button onClick={onBack} className="mt-8 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Voltar</button>
      </div>
    );
  }

  // LEAGUE TURN STATE
  const [standingsFilter, setStandingsFilter] = useState<'ALL' | 'TURN1' | 'TURN2'>('ALL'); // Standings View Mode
  const [matchTurnFilter, setMatchTurnFilter] = useState<number>(1); // Match List View Mode (Turn 1 or 2)

  const getTeamNameAndEscudo = (team: Team | undefined) => {
    if (!team) return { name: '-', logoUrl: '' };
    if (tournament.experienceType === 'X1') {
      const profile = playerProfiles?.find(p => p.userId === team.ownerId);
      if (profile) {
        return {
          name: profile.nickname || team.name,
          logoUrl: profile.photoUrl || team.logoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(profile.nickname || team.name)}`
        };
      }
    }
    return {
      name: team.name,
      logoUrl: team.logoUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(team.name)}`
    };
  };

  // Roster Management State
  const [activeRosterTeamId, setActiveRosterTeamId] = useState<string>('');
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterPosFilter, setRosterPosFilter] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkPlayersText, setBulkPlayersText] = useState('');
  const [bulkPreviewPlayers, setBulkPreviewPlayers] = useState<{name: string, position: string}[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPos, setNewPlayerPos] = useState(POSITIONS[0]);
  
  const handleBulkAddPlayers = () => {
    if (!bulkPlayersText) return;
    const lines = bulkPlayersText.split('\n');
    const previewPlayers = lines.filter(line => line.trim()).map(line => {
      const parts = line.trim().split("-"); // Use hífen como separador padrão
      let posicao, nome;

      if (parts.length > 1) {
        posicao = parts[0].trim();
        nome = parts.slice(1).join("-").trim();
      } else {
        // Tenta Split por espaço
        const spaceParts = line.trim().split(" ");
        posicao = spaceParts[0];
        nome = spaceParts.slice(1).join(" ");
      }

      const allowedPositions = ['GL', 'GK', 'ZG', 'ZGD', 'ZGC', 'ZGE', 'LD', 'LE', 'VOL', 'MCD', 'MCE', 'VLD', 'VLE', 'MC', 'MLG', 'MAT', 'MEI', 'MLD', 'MLE', 'MD', 'ME', 'PD', 'PE', 'PTD', 'PTE', 'ST', 'SA', 'CA', 'ATA-D', 'ATA-E'];
      
      let finalPosicao = (posicao || "MEI").toUpperCase().trim();
      let finalNome = (nome || parts[0] || "Sem Nome").trim();
      
      if (!allowedPositions.includes(finalPosicao)) {
          finalPosicao = "MEI";
      }

      return { name: finalNome, position: finalPosicao };
    });
    setBulkPreviewPlayers(previewPlayers);
    setBulkPlayersText('');
  };

  const handleConfirmBulkAdd = () => {
    if (!activeRosterTeamId || !onAddPlayer) return;
    bulkPreviewPlayers.filter(p => p.name.trim()).forEach(p => {
        onAddPlayer(activeRosterTeamId, { name: p.name, position: p.position as any });
    });
    setBulkPreviewPlayers([]);
    setShowBulkImport(false);
    showToast('Jogadores importados com sucesso!');
  };

  // Marketing / Social State
  const [socialName, setSocialName] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [socialIconMode, setSocialIconMode] = useState<'UPLOAD' | 'URL'>('UPLOAD');
  const [socialIconUrl, setSocialIconUrl] = useState('');
  const [socialX, setSocialX] = useState(50);
  const [socialY, setSocialY] = useState(50);

  // Match Modal State
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matchHomeScore, setMatchHomeScore] = useState<number>(0);
  const [matchAwayScore, setMatchAwayScore] = useState<number>(0);
  const [matchMvpId, setMatchMvpId] = useState<string>('');
  const [matchScreenshotUrl, setMatchScreenshotUrl] = useState<string>('');
  const [playerRatings, setPlayerRatings] = useState<Record<string, string>>({});
  
  // Awards Modal State
  const [showAwardsModal, setShowAwardsModal] = useState(false);
  const [awardSelections, setAwardSelections] = useState<TournamentAwards>(tournament.awards || {});

  // Registration Modal State
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  // Detailed Stats State
  const [homeGoalDetails, setHomeGoalDetails] = useState<{scorer: string, assist: string}[]>([]);
  const [awayGoalDetails, setAwayGoalDetails] = useState<{scorer: string, assist: string}[]>([]);
  const [isGoldenGoal, setIsGoldenGoal] = useState(false);
  const [isDecidedByPenalties, setIsDecidedByPenalties] = useState(false);
  const [homePenaltyScore, setHomePenaltyScore] = useState<number | null>(null);
  const [awayPenaltyScore, setAwayPenaltyScore] = useState<number | null>(null);

  // Collapsible Rounds State
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedRounds, setExpandedRounds] = useState<number[]>([]);

  // Qualification Rules State
  const [newRuleStart, setNewRuleStart] = useState(1);
  const [newRuleEnd, setNewRuleEnd] = useState(4);
  const [newRuleDest, setNewRuleDest] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');

  // Toast State
  const [toast, setToast] = useState<{message: string, type: 'info' | 'error'} | null>(null);
  
  const showToast = (message: string, type: 'info' | 'error' = 'info') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
  };

  const toggleRound = (round: number) => {
      setExpandedRounds(prev => 
          prev.includes(round) ? prev.filter(r => r !== round) : [...prev, round]
      );
  };

  // Initialize active roster team
  useEffect(() => {
      if (!activeRosterTeamId && teams.length > 0) {
          setActiveRosterTeamId(teams[0].id);
      }
  }, [teams, activeRosterTeamId]);

  // Social Media Handlers
  const handleSocialIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setSocialIconUrl(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  const handleAddSocial = () => {
      if (!newSocialUrl || !onUpdateTournament) return;
      if (!socialName) {
          showToast('Nome da rede social é obrigatório!', 'error');
          return;
      }

      const newLink: SocialLink = {
          id: Math.random().toString(36).substr(2, 9),
          platform: 'CUSTOM',
          name: socialName,
          url: newSocialUrl,
          customIconUrl: socialIconUrl,
          position: { x: socialX, y: socialY }
      };
      onUpdateTournament(tournament.id, { 
          socialLinks: [...(tournament.socialLinks || []), newLink] 
      });
      setNewSocialUrl('');
      setSocialName('');
      setSocialIconUrl('');
      showToast('Rede social adicionada!');
  };

  const handleRemoveSocial = (id: string) => {
      if (!onUpdateTournament) return;
      onUpdateTournament(tournament.id, {
          socialLinks: (tournament.socialLinks || []).filter(l => l.id !== id)
      });
  };

  const hasMatches = useMemo(() => matches.some(m => m.tournamentId === tournament.id), [matches, tournament.id]);
  const hasKnockoutStarted = useMemo(() => matches.some(m => m.tournamentId === tournament.id && m.stage && m.stage !== 'GROUP' && m.stage !== 'SWISS' && m.stage !== 'LEAGUE'), [matches, tournament.id]);
  const isGroupStageFinished = useMemo(() => {
      if (isKnockout || isMD3) return false;
      const relevantMatches = matches.filter(m => m.tournamentId === tournament.id && (m.stage === 'GROUP' || m.stage === 'SWISS' || m.stage === 'LEAGUE' || !m.stage));
      if (relevantMatches.length === 0) return false;
      if (isSwiss) {
          const maxRound = Math.max(...relevantMatches.map(m => m.round), 0);
          const allFinished = relevantMatches.every(m => m.isFinished);
          const totalRounds = tournament.swissRounds || 3;
          return maxRound >= totalRounds && allFinished;
      }
      return relevantMatches.every(m => m.isFinished);
  }, [matches, isGroups, isSwiss, isKnockout, isMD3, isLeague, tournament.id, tournament.swissRounds]);

  const leagueRoundsPerTurn = useMemo(() => {
      const n = teams.length;
      return n % 2 === 0 ? n - 1 : n;
  }, [teams]);

  const hasTurn2Matches = useMemo(() => {
      if (!isLeague) return false;
      return matches.some(m => m.tournamentId === tournament.id && m.round > leagueRoundsPerTurn);
  }, [isLeague, matches, tournament.id, leagueRoundsPerTurn]);

  const isTurn1Finished = useMemo(() => {
      if (!isLeague) return false;
      const turn1Matches = matches.filter(m => m.tournamentId === tournament.id && m.round <= leagueRoundsPerTurn);
      return turn1Matches.length > 0 && turn1Matches.every(m => m.isFinished);
  }, [isLeague, matches, tournament.id, leagueRoundsPerTurn]);

  const myRegistration = useMemo(() => {
    if (!currentUser || currentUser.role !== UserRole.TEAM_MANAGER) return null;
    const regs = registrations.filter(r => r.teamOwnerId === currentUser.id && r.tournamentId === tournament.id);
    return regs.length > 0 ? regs.sort((a,b) => b.timestamp - a.timestamp)[0] : null;
  }, [registrations, currentUser, tournament.id]);

  const myTeamInTournament = useMemo(() => {
    if (!currentUser || currentUser.role !== UserRole.TEAM_MANAGER) return null;
    return teams.find(t => t.ownerId === currentUser.id);
  }, [teams, currentUser]);

  const myTournamentPlayers = useMemo(() => {
      if (!myTeamInTournament) return [];
      return players.filter(p => p.teamId === myTeamInTournament.id);
  }, [players, myTeamInTournament]);

  const backgroundImage = useMemo(() => {
      if (activeTab === 'standings' && tournament.groupStageBackground) return tournament.groupStageBackground;
      if ((activeTab === 'matches' || activeTab === 'brackets') && tournament.knockoutBackground) return tournament.knockoutBackground;
      return tournament.bannerUrl || '';
  }, [activeTab, tournament]);

  const bgOpacity = useMemo(() => {
      if ((activeTab === 'matches' || activeTab === 'brackets') && tournament.knockoutBackground) {
          return tournament.knockoutOpacity !== undefined ? tournament.knockoutOpacity / 100 : 0.3;
      }
      return 0.2; 
  }, [activeTab, tournament]);

  // Tema global é controlado pelo AppContext — TournamentDetails herda automaticamente

  const displayMatches = useMemo(() => {
      let filtered = [];
      if (isKnockout) filtered = matches.sort((a, b) => a.id.localeCompare(b.id));
      else if (isSwiss) filtered = matches.sort((a, b) => b.round - a.round); 
      else if (isMD3) filtered = matches.sort((a, b) => (b.round === 99 ? 1 : a.round === 99 ? -1 : a.round - b.round));
      else if (isLeague) {
          if (matchTurnFilter === 1) {
              filtered = matches.filter(m => m.round <= leagueRoundsPerTurn).sort((a,b) => a.round - b.round);
          } else {
              filtered = matches.filter(m => m.round > leagueRoundsPerTurn).sort((a,b) => a.round - b.round);
          }
      } else {
          filtered = matches.filter(m => m.groupId === activeGroupId).sort((a,b) => a.round - b.round);
      }
      return filtered;
  }, [matches, activeGroupId, isSwiss, isMD3, isKnockout, isLeague, matchTurnFilter, leagueRoundsPerTurn]);

  const matchesByRound = useMemo(() => {
      const groups: Record<number, Match[]> = {};
      displayMatches.forEach(m => {
          if (!groups[m.round]) groups[m.round] = [];
          groups[m.round].push(m);
      });
      return groups;
  }, [displayMatches]);

  const sortedTeams = useMemo(() => {
    if (!isLeague) {
        const teamsToShow = (isSwiss || isMD3) ? teams : teams.filter(t => t.groupId === activeGroupId);
        return teamsToShow.sort((a, b) => b.points - a.points || (b.goalsFor - a.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor);
    }
    let relevantMatches = matches.filter(m => m.tournamentId === tournament.id && m.isFinished);
    if (standingsFilter === 'TURN1') relevantMatches = relevantMatches.filter(m => m.round <= leagueRoundsPerTurn);
    else if (standingsFilter === 'TURN2') relevantMatches = relevantMatches.filter(m => m.round > leagueRoundsPerTurn);
    
    const statsMap = new Map<string, Team>();
    teams.forEach(t => {
        statsMap.set(t.id, { ...t, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 });
    });
    relevantMatches.forEach(m => {
        const h = statsMap.get(m.homeTeamId);
        const a = statsMap.get(m.awayTeamId);
        if (h && a && m.homeScore !== null && m.awayScore !== null) {
             const sh = Number(m.homeScore);
             const sa = Number(m.awayScore);
             h.played++; a.played++;
             h.goalsFor += sh; h.goalsAgainst += sa;
             a.goalsFor += sa; a.goalsAgainst += sh;
             if (sh > sa) { h.won++; h.points += 3; a.lost++; }
             else if (sa > sh) { a.won++; a.points += 3; h.lost++; }
             else { h.drawn++; h.points += 1; a.drawn++; a.points += 1; }
        }
    });
    return Array.from(statsMap.values()).sort((a, b) => b.points - a.points || (b.goalsFor - a.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor);
  }, [teams, activeGroupId, isSwiss, isMD3, isLeague, standingsFilter, matches, tournament.id, leagueRoundsPerTurn]);

  const rosterPlayers = useMemo(() => {
      if (!activeRosterTeamId) return [];
      return players.filter(p => {
          if (p.teamId !== activeRosterTeamId) return false;
          if (rosterSearch && !p.name.toLowerCase().includes(rosterSearch.toLowerCase())) return false;
          if (rosterPosFilter && p.position !== rosterPosFilter) return false;
          return true;
      });
  }, [players, activeRosterTeamId, rosterSearch, rosterPosFilter]);

  const bracketData = useMemo(() => {
      const allMatches = matches.filter(m => m.stage && m.stage !== 'GROUP' && m.stage !== 'SWISS' && m.stage !== 'LEAGUE').sort((a,b) => a.id.localeCompare(b.id));
      const r16 = allMatches.filter(m => m.stage === 'R16');
      const quarters = allMatches.filter(m => m.stage === 'QF');
      const semis = allMatches.filter(m => m.stage === 'SF');
      const finals = allMatches.filter(m => m.stage === 'FINAL');
      return { r16, quarters, semis, finals, hasR16: r16.length > 0, hasQuarters: quarters.length > 0 };
  }, [matches]);

  const matchPlayers = useMemo(() => {
      if (!selectedMatch) return { home: [], away: [], all: [] };
      const homeP = players.filter(p => p.teamId === selectedMatch.homeTeamId);
      const awayP = players.filter(p => p.teamId === selectedMatch.awayTeamId);
      return { home: homeP, away: awayP, all: [...homeP, ...awayP] };
  }, [selectedMatch, players]);

  const md3Stats = useMemo(() => {
      if (!isMD3 || teams.length !== 2) return null;
      let wins1 = 0, wins2 = 0;
      const finished = matches.filter(m => m.isFinished);
      finished.forEach(m => {
          if((m.homeScore||0) > (m.awayScore||0)) { if(m.homeTeamId===teams[0].id) wins1++; else wins2++; }
          else if((m.awayScore||0) > (m.homeScore||0)) { if(m.awayTeamId===teams[0].id) wins1++; else wins2++; }
      });
      return { wins1, wins2, finishedCount: finished.length, totalCount: matches.length };
  }, [isMD3, teams, matches]);

  const handleAddPlayer = () => { if (newPlayerName && activeRosterTeamId) { onAddPlayer(activeRosterTeamId, { name: newPlayerName, position: newPlayerPos as any }); setNewPlayerName(''); } };
  const handleTeamLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file && activeRosterTeamId) { const reader = new FileReader(); reader.onloadend = () => { onUpdateTeam(activeRosterTeamId, { logoUrl: reader.result as string }); }; reader.readAsDataURL(file); } };
  
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);

  const handleOCR = async () => {
    if (!matchScreenshotUrl) {
      showToast("Faça o upload do print primeiro!", 'error');
      return;
    }
    
    setIsProcessingOCR(true);
    try {
      const extracted = await extractStatsFromImage(matchScreenshotUrl);
      
      if (extracted.length === 0) {
        showToast("Nenhum dado encontrado na imagem.", 'error');
        return;
      }

      const newHomeGoals: {scorer: string, assist: string}[] = [];
      const newAwayGoals: {scorer: string, assist: string}[] = [];
      const newRatings: Record<string, string> = { ...playerRatings };
      const warnings: string[] = [];

      // Temporary storage for assists to be assigned
      const homeAssists: string[] = [];
      const awayAssists: string[] = [];

      extracted.forEach(data => {
        const player = players.find(p => 
          p.name.toLowerCase().trim() === data.nome.toLowerCase().trim()
        );

        if (player) {
          newRatings[player.id] = data.nota.toString();
          const isHome = player.teamId === selectedMatch?.homeTeamId;
          const targetGoals = isHome ? newHomeGoals : newAwayGoals;
          const targetAssists = isHome ? homeAssists : awayAssists;

          // Add goals
          for (let i = 0; i < data.gols; i++) {
            targetGoals.push({ scorer: player.id, assist: '' });
          }

          // Collect assists
          for (let i = 0; i < data.assistencias; i++) {
            targetAssists.push(player.id);
          }
        } else {
          warnings.push(`Jogador "${data.nome}" não encontrado no elenco.`);
        }
      });

      // Try to match assists to goals for each team
      const matchAssists = (goals: {scorer: string, assist: string}[], assists: string[]) => {
        let assistIdx = 0;
        for (let i = 0; i < goals.length && assistIdx < assists.length; i++) {
          // A player cannot assist themselves
          if (goals[i].scorer !== assists[assistIdx]) {
            goals[i].assist = assists[assistIdx];
            assistIdx++;
          } else {
            // Try next goal for this assist
            let found = false;
            for (let j = i + 1; j < goals.length; j++) {
              if (goals[j].scorer !== assists[assistIdx]) {
                goals[j].assist = assists[assistIdx];
                assistIdx++;
                found = true;
                break;
              }
            }
            // If still not found, we'll just have to leave it or warn
          }
        }
        return assistIdx < assists.length ? assists.length - assistIdx : 0;
      };

      const unassignedHome = matchAssists(newHomeGoals, homeAssists);
      const unassignedAway = matchAssists(newAwayGoals, awayAssists);

      if (unassignedHome > 0) warnings.push(`${unassignedHome} assistências do time da casa não puderam ser atribuídas automaticamente.`);
      if (unassignedAway > 0) warnings.push(`${unassignedAway} assistências do time visitante não puderam ser atribuídas automaticamente.`);

      setHomeGoalDetails(newHomeGoals);
      setAwayGoalDetails(newAwayGoals);
      setPlayerRatings(newRatings);
      
      if (warnings.length > 0) {
        toast.warning("Processamento concluído com avisos:\n\n" + warnings.join('\n'));
      } else {
        showToast("Estatísticas extraídas com sucesso!", 'info');
      }
    } catch (error) {
      console.error(error);
      showToast("Erro ao processar imagem. Tente novamente.", 'error');
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setMatchScreenshotUrl(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  const openMatchModal = (m: Match) => { 
      setSelectedMatch(m); 
      setMatchHomeScore(m.homeScore||0); 
      setMatchAwayScore(m.awayScore||0); 
      setMatchMvpId(m.mvpPlayerId||''); 
      setMatchScreenshotUrl(m.screenshotUrl || '');
      setIsGoldenGoal(m.isGoldenGoal || false);
      setIsDecidedByPenalties(m.isDecidedByPenalties || false);
      setHomePenaltyScore(m.homePenaltyScore ?? null);
      setAwayPenaltyScore(m.awayPenaltyScore ?? null);
      
      // Initialize ratings
      const initialRatings: Record<string, string> = {};
      m.events.filter(e => e.type === 'RATING').forEach(e => {
          initialRatings[e.playerId] = e.value?.toString() || '';
      });
      setPlayerRatings(initialRatings);
      
      // Reconstruct goal details from events
      const homeGoals = m.events.filter(e => e.type === 'GOAL' && players.find(p => p.id === e.playerId)?.teamId === m.homeTeamId);
      const awayGoals = m.events.filter(e => e.type === 'GOAL' && players.find(p => p.id === e.playerId)?.teamId === m.awayTeamId);
      
      // This is a bit complex because we need to match goals with assists. 
      // For now, we'll just initialize with the score count as before, 
      // but the user can re-enter or we could try to be smarter.
      const initialHome = Array(m.homeScore || 0).fill({ scorer: '', assist: '' }); 
      const initialAway = Array(m.awayScore || 0).fill({ scorer: '', assist: '' }); 
      setHomeGoalDetails(initialHome); 
      setAwayGoalDetails(initialAway); 
  };
  
  useEffect(() => { setHomeGoalDetails(prev => { const diff = matchHomeScore - prev.length; if (diff > 0) return [...prev, ...Array(diff).fill({ scorer: '', assist: '' })]; if (diff < 0) return prev.slice(0, matchHomeScore); return prev; }); }, [matchHomeScore]);
  useEffect(() => { setAwayGoalDetails(prev => { const diff = matchAwayScore - prev.length; if (diff > 0) return [...prev, ...Array(diff).fill({ scorer: '', assist: '' })]; if (diff < 0) return prev.slice(0, matchAwayScore); return prev; }); }, [matchAwayScore]);

  const saveMatchDetails = () => { 
      if(selectedMatch) { 
          if (!matchScreenshotUrl) {
              showToast("O upload do print da partida é obrigatório!", 'error');
              return;
          }

          const events: MatchEvent[] = []; 
          // Add ratings and participation
          const participants = new Set<string>();
          
          homeGoalDetails.forEach(g => { 
              if (g.scorer) {
                  events.push({ type: 'GOAL', playerId: g.scorer }); 
                  participants.add(g.scorer);
              }
              if (g.assist) {
                  events.push({ type: 'ASSIST', playerId: g.assist }); 
                  participants.add(g.assist);
              }
          }); 
          awayGoalDetails.forEach(g => { 
              if (g.scorer) {
                  events.push({ type: 'GOAL', playerId: g.scorer }); 
                  participants.add(g.scorer);
              }
              if (g.assist) {
                  events.push({ type: 'ASSIST', playerId: g.assist }); 
                  participants.add(g.assist);
              }
          }); 
          if (matchMvpId) { 
              events.push({ type: 'MVP', playerId: matchMvpId }); 
              participants.add(matchMvpId);
          } 
          
          Object.entries(playerRatings).forEach(([playerId, rating]) => {
              const val = parseFloat(rating as string);
              if (!isNaN(val)) {
                  events.push({ type: 'RATING', playerId, value: val });
                  participants.add(playerId);
              }
          });

          // Add participation events for all unique players involved
          participants.forEach(playerId => {
              events.push({ type: 'PARTICIPATION', playerId });
          });

          onUpdateMatch(selectedMatch.id, { 
              homeScore: matchHomeScore, 
              awayScore: matchAwayScore, 
              isFinished: true, 
              mvpPlayerId: matchMvpId, 
              events: events,
              isGoldenGoal,
              isDecidedByPenalties,
              homePenaltyScore,
              awayPenaltyScore,
              screenshotUrl: matchScreenshotUrl
          }); 
          setSelectedMatch(null); 
      } 
  };
  const handleSimulateGroupStage = () => { if (!window.confirm("Isso vai gerar placares aleatórios. Continuar?")) return; const pendingMatches = matches.filter(m => !m.isFinished); if (pendingMatches.length === 0) { toast.error("Não há jogos pendentes."); return; } pendingMatches.forEach(match => { const scoreH = Math.floor(Math.random() * 4); const scoreA = Math.floor(Math.random() * 3); onUpdateMatch(match.id, { homeScore: scoreH, awayScore: scoreA, isFinished: true }); }); toast.success(`Simulados ${pendingMatches.length} jogos!`); };
  const handleAutoSelectAwards = () => { const sortedByGoals = [...players].sort((a,b) => b.goals - a.goals); const topScorer = sortedByGoals[0]; const sortedByAssists = [...players].sort((a,b) => b.assists - a.assists); const topAssister = sortedByAssists[0]; const sortedByMvp = [...players].sort((a,b) => b.mvps - a.mvps || (b.rating || 0) - (a.rating || 0)); const topMvp = sortedByMvp[0]; const defenders = players.filter(p => ['ZGD','ZGE','ZGC','LD','LE','VOL'].includes(p.position)); const topDefender = defenders.sort((a,b) => (b.rating || 0) - (a.rating || 0))[0]; const gks = players.filter(p => p.position === 'GK'); const topGk = gks.sort((a,b) => (b.rating || 0) - (a.rating || 0))[0]; setAwardSelections({ mvpId: topMvp?.id, bestStrikerId: topScorer?.id, bestMidfielderId: topAssister?.id, bestDefenderId: topDefender?.id, goldenGloveId: topGk?.id }); };

  // Match Cards - UPDATED FOR COMPACTNESS & FLEX/GRID ROBUSTNESS
  const ClassicMatchCard = ({ match }: { match: Match }) => { 
      const h = teams.find(t => t.id === match.homeTeamId); 
      const a = teams.find(t => t.id === match.awayTeamId); 
      const hasHome = h && match.homeTeamId && match.homeTeamId !== 'TBD'; 
      const hasAway = a && match.awayTeamId && match.awayTeamId !== 'TBD'; 
      const hVisual = getTeamNameAndEscudo(h);
      const aVisual = getTeamNameAndEscudo(a);
      return ( 
          <div className="bg-brand-surface border border-brand-primary/50 rounded w-full relative z-10 shadow cursor-pointer hover:border-brand-primary transition-all flex flex-col overflow-hidden group" onClick={() => openMatchModal(match)}> 
              <div className="bg-black/40 text-brand-textMuted text-[9px] text-center font-bold px-1 uppercase tracking-wider py-0.5 border-b border-white/5">{match.stage || 'JOGO'}</div> 
              <div className="p-1.5 grid gap-y-1"> 
                  <div className="flex items-center justify-between gap-2 h-5"> 
                      <div className="flex items-center gap-2 min-w-0 flex-1"> 
                          <div className="w-4 h-4 flex items-center justify-center shrink-0"> {hasHome ? (hVisual.logoUrl ? <img src={hVisual.logoUrl} className="w-full h-full object-contain" /> : <Shield size={10} className="text-brand-textMuted"/>) : <div className="w-4"/>} </div> 
                          <span className="text-[10px] font-bold truncate text-brand-text leading-tight block">{hasHome ? hVisual.name : <span className="text-transparent">-</span>}</span> 
                      </div> 
                      <span className="text-brand-primary font-mono font-black text-xs w-5 text-center shrink-0 bg-black/20 rounded">{match.homeScore ?? '-'}</span> 
                  </div> 
                  <div className="flex items-center justify-between gap-2 h-5"> 
                      <div className="flex items-center gap-2 min-w-0 flex-1"> 
                          <div className="w-4 h-4 flex items-center justify-center shrink-0"> {hasAway ? (aVisual.logoUrl ? <img src={aVisual.logoUrl} className="w-full h-full object-contain" /> : <Shield size={10} className="text-brand-textMuted"/>) : <div className="w-4"/>} </div> 
                          <span className="text-[10px] font-bold truncate text-brand-text leading-tight block">{hasAway ? aVisual.name : <span className="text-transparent">-</span>}</span> 
                      </div> 
                      <span className="text-brand-primary font-mono font-black text-xs w-5 text-center shrink-0 bg-black/20 rounded">{match.awayScore ?? '-'}</span> 
                  </div> 
              </div> 
          </div> 
      ); 
  };

  const NeonMatchCard = ({ match }: { match: Match }) => { 
      const h = teams.find(t => t.id === match.homeTeamId); 
      const a = teams.find(t => t.id === match.awayTeamId); 
      const hasHome = h && match.homeTeamId && match.homeTeamId !== 'TBD'; 
      const hasAway = a && match.awayTeamId && match.awayTeamId !== 'TBD'; 
      const hVisual = getTeamNameAndEscudo(h);
      const aVisual = getTeamNameAndEscudo(a);
      return ( 
          <div className="bg-brand-surface border border-brand-primary/40 rounded-lg shadow-[0_0_10px_rgba(var(--theme-primary),0.1)] w-full relative z-10 overflow-hidden cursor-pointer hover:border-brand-primary transition-all hover:shadow-[0_0_15px_rgba(var(--theme-primary),0.3)] flex flex-col" onClick={() => openMatchModal(match)}> 
              <div className="bg-brand-primary/10 text-brand-primary text-[9px] text-center font-bold px-1 py-0.5 border-b border-brand-primary/20 uppercase tracking-widest">{match.stage || 'VS'}</div> 
              <div className="p-2 grid gap-y-1"> 
                  <div className="flex justify-between items-center gap-2 h-6"> 
                      <div className="flex items-center gap-2 min-w-0 flex-1"> 
                          <div className="w-5 h-5 rounded-full bg-black border border-brand-primary/30 flex items-center justify-center shrink-0 overflow-hidden"> {hasHome ? (hVisual.logoUrl ? <img src={hVisual.logoUrl} className="w-full h-full object-cover"/> : <Shield size={10} className="text-brand-primary"/>) : <div className="w-full h-full bg-transparent"></div>} </div> 
                          <span className="text-[10px] font-bold text-brand-text truncate group-hover:text-brand-primary transition-colors block">{hasHome ? hVisual.name : <span className="text-transparent">-</span>}</span> 
                      </div> 
                      <span className="text-brand-primary font-mono text-sm font-bold drop-shadow-[0_0_3px_rgba(var(--theme-primary),0.8)] min-w-[1.2rem] text-center shrink-0">{match.homeScore ?? '-'}</span> 
                  </div> 
                  <div className="flex justify-between items-center gap-2 h-6"> 
                      <div className="flex items-center gap-2 min-w-0 flex-1"> 
                          <div className="w-5 h-5 rounded-full bg-black border border-brand-primary/30 flex items-center justify-center shrink-0 overflow-hidden"> {hasAway ? (aVisual.logoUrl ? <img src={aVisual.logoUrl} className="w-full h-full object-cover"/> : <Shield size={10} className="text-brand-primary"/>) : <div className="w-full h-full bg-transparent"></div>} </div> 
                          <span className="text-[10px] font-bold text-brand-text truncate group-hover:text-brand-primary transition-colors block">{hasAway ? aVisual.name : <span className="text-transparent">-</span>}</span> 
                      </div> 
                      <span className="text-brand-primary font-mono text-sm font-bold drop-shadow-[0_0_3px_rgba(var(--theme-primary),0.8)] min-w-[1.2rem] text-center shrink-0">{match.awayScore ?? '-'}</span> 
                  </div> 
              </div> 
          </div> 
      ); 
  };

  const HorizontalMatchCard = ({ match }: { match: Match }) => {
      const h = teams.find(t => t.id === match.homeTeamId);
      const a = teams.find(t => t.id === match.awayTeamId);
      const hVisual = getTeamNameAndEscudo(h);
      const aVisual = getTeamNameAndEscudo(a);
      return (
          <div className="match-card-horizontal jogo-linha" onClick={() => openMatchModal(match)}>
              <div className="time justify-end">
                  <span className="team-name">{hVisual.name || 'TBD'}</span>
                  {hVisual.logoUrl ? <img src={hVisual.logoUrl} className="logo-match" /> : <Shield size={32} className="text-slate-600"/>}
              </div>
              <div className="placar">
                  {match.isFinished ? `${match.homeScore} - ${match.awayScore}` : 'X'}
              </div>
              <div className="time">
                  {aVisual.logoUrl ? <img src={aVisual.logoUrl} className="logo-match" /> : <Shield size={32} className="text-slate-600"/>}
                  <span className="team-name">{aVisual.name || 'TBD'}</span>
              </div>
          </div>
      );
  };

  const MatchCard: React.FC<{ match: Match }> = bracketStyle === 'CHAMPIONS' ? NeonMatchCard : ClassicMatchCard;
  const bracketBgClass = useMemo(() => tournament.knockoutBackground ? 'bg-black/20 backdrop-blur-sm' : bracketStyle === 'CHAMPIONS' ? 'bg-brand-dark' : 'bg-gradient-to-br from-brand-primary via-red-900 to-black', [bracketStyle, tournament.knockoutBackground]);
  const connectorColor = bracketStyle === 'CHAMPIONS' ? 'border-brand-primary/60' : 'border-white/60';
  const pendingRegistrations = registrations.filter(r => r.status === 'PENDING');
  const processedRegistrations = registrations.filter(r => r.status !== 'PENDING');
  const BracketColumn = ({ matches, title, slotHeightClass, isFirstColumn = false, isLastColumn = false }: { matches: Match[], title: string, slotHeightClass: string, isFirstColumn?: boolean, isLastColumn?: boolean }) => ( <div className="flex flex-col"> <div className="text-center text-white/50 text-[10px] font-bold uppercase mb-4 h-4">{title}</div> <div className="flex flex-col justify-center"> {matches.map((m, i) => ( <div key={`${m.id}-${i}`} className={`${slotHeightClass} flex items-center justify-center relative`}> {!isFirstColumn && <div className={`absolute left-[-1.25rem] w-5 border-b-2 ${connectorColor} top-1/2`}></div>} <div className="w-48"><MatchCard match={m} /></div> {!isLastColumn && ( <> <div className={`absolute right-[-1.25rem] w-5 border-b-2 ${connectorColor} top-1/2`}></div> <div className={`absolute right-[-1.25rem] w-0 border-r-2 ${connectorColor} ${i % 2 === 0 ? 'h-[50%] top-1/2' : 'h-[50%] bottom-1/2'}`}></div> </> )} </div> ))} </div> </div> );

  return (
    <div className="relative min-h-screen flex flex-col">
      {toast && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300 ${toast.type === 'error' ? 'bg-red-600 text-white border border-red-400' : 'bg-brand-primary text-white border border-blue-400'}`}>
              {toast.type === 'error' ? <AlertTriangle size={18}/> : <Info size={18}/>}
              {toast.message}
          </div>
      )}

      {backgroundImage && (
          <div className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: tournament.bannerSize || 'cover', opacity: bgOpacity }}></div>
      )}
      
      <div className="relative z-10 p-6 flex-1">
          
          {/* HEADER */}
          <div className="bg-brand-surface/80 backdrop-blur-xl p-0 rounded-2xl border border-brand-border shadow-2xl mb-8 overflow-hidden">
              <div className="relative h-48 w-full overflow-hidden">
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${tournament.bannerUrl || ''})` }}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                  
                  <div className="absolute top-4 left-4">
                      <button onClick={onBack} className="bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all border border-white/10 backdrop-blur-sm"><ChevronLeft size={16}/> Voltar</button>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row justify-between items-end gap-4">
                      <div className="flex items-center gap-4">
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-surface rounded-xl flex items-center justify-center border-2 border-brand-primary shadow-lg shadow-brand-primary/20">
                              {tournament.trophyIconUrl ? <img src={tournament.trophyIconUrl} className="w-12 h-12 md:w-14 md:h-14 object-contain"/> : <Trophy className="text-brand-primary w-10 h-10 md:w-12 md:h-12"/>}
                          </div>
                          <div>
                              <div className="flex gap-2 mb-1">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${tournament.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400 border-green-500/50' : tournament.status === 'FINISHED' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'}`}>
                                      {tournament.status === 'ACTIVE' ? 'Em Andamento' : tournament.status === 'FINISHED' ? 'Finalizado' : 'Inscrições Abertas'}
                                  </span>
                                  {tournament.isOfficial && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 flex items-center gap-1"><Crown size={10}/> Oficial</span>}
                              </div>
                              <h1 className="text-3xl md:text-4xl font-black text-white italic tracking-wide drop-shadow-lg leading-none">{tournament.name}</h1>
                              <p className="text-slate-300 text-xs md:text-sm font-medium mt-1 flex items-center gap-2">
                                  <span>{tournament.sport}</span> • <span>{tournament.format}</span>
                              </p>
                          </div>
                      </div>

                      {currentUser?.role === UserRole.TEAM_MANAGER && onRequestRegistration && (
                         <div>
                             <button 
                                onClick={() => {
                                    if (myTeamInTournament || (myRegistration && myRegistration.status === 'PENDING')) {
                                        showToast("Seu time já está inscrito neste torneio.", 'error');
                                        return;
                                    }
                                    setShowRegistrationModal(true);
                                }}
                                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-105 border-b-4 ${
                                    myTeamInTournament 
                                        ? 'bg-green-600 border-green-800 text-white' 
                                        : myRegistration && myRegistration.status === 'PENDING'
                                            ? 'bg-yellow-600 border-yellow-800 text-white'
                                            : myRegistration && myRegistration.status === 'REJECTED'
                                                ? 'bg-red-600 border-red-800 text-white'
                                                : 'bg-brand-primary border-blue-800 text-white hover:bg-blue-500 animate-pulse'
                                }`}
                             >
                                 {myTeamInTournament ? <Check size={20}/> : myRegistration?.status === 'PENDING' ? <Clock size={20}/> : myRegistration?.status === 'REJECTED' ? <X size={20}/> : <Hand size={20}/>}
                                 {myTeamInTournament ? `Inscrito: ${myTeamInTournament.name}` : myRegistration?.status === 'PENDING' ? 'Aguardando Aprovação' : myRegistration?.status === 'REJECTED' ? 'Inscrição Recusada' : 'Inscrever Meu Time'}
                             </button>
                         </div>
                      )}
                  </div>
              </div>
          </div>

          {/* TABS */}
          <div className="flex gap-2 border-b border-brand-border mb-6 overflow-x-auto pb-1">
              <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 font-bold whitespace-nowrap rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'overview' ? 'bg-brand-surfaceHighlight text-brand-text border-b-2 border-brand-primary' : 'text-brand-textMuted hover:text-brand-text hover:bg-brand-surfaceHighlight/50'}`}>
                  <Info size={16}/> Visão Geral
              </button>
              
              {!isKnockout && (
                  <button onClick={() => setActiveTab('standings')} className={`px-4 py-2 font-bold whitespace-nowrap rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'standings' ? 'bg-brand-surfaceHighlight text-brand-text border-b-2 border-brand-primary' : 'text-brand-textMuted hover:text-brand-text hover:bg-brand-surfaceHighlight/50'}`}>
                      <BarChart size={16}/> Classificação
                  </button>
              )}
              
              <button onClick={() => setActiveTab('matches')} className={`px-4 py-2 font-bold whitespace-nowrap rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'matches' ? 'bg-brand-surfaceHighlight text-brand-text border-b-2 border-brand-primary' : 'text-brand-textMuted hover:text-brand-text hover:bg-brand-surfaceHighlight/50'}`}>
                  <Calendar size={16}/> Jogos
              </button>
              
              {(!isMD3 && !isLeague && (isKnockout || hasKnockoutStarted)) && (
                  <button onClick={() => setActiveTab('brackets')} className={`px-4 py-2 font-bold whitespace-nowrap rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'brackets' ? 'bg-brand-surfaceHighlight text-brand-text border-b-2 border-brand-primary' : 'text-brand-textMuted hover:text-brand-text hover:bg-brand-surfaceHighlight/50'}`}>
                      <Trophy size={16}/> Chaveamento
                  </button>
              )}
              
              {isTeamManager && myTeamInTournament && (
                  <button onClick={() => setActiveTab('my-roster')} className={`px-4 py-2 font-bold whitespace-nowrap rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'my-roster' ? 'bg-brand-surfaceHighlight text-brand-text border-b-2 border-brand-primary' : 'text-brand-textMuted hover:text-brand-text hover:bg-brand-surfaceHighlight/50'}`}>
                      <Users size={16}/> Meu Elenco
                  </button>
              )}

              <button onClick={() => setActiveTab('teams')} className={`px-4 py-2 font-bold whitespace-nowrap rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'teams' ? 'bg-brand-surfaceHighlight text-brand-text border-b-2 border-brand-primary' : 'text-brand-textMuted hover:text-brand-text hover:bg-brand-surfaceHighlight/50'}`}>
                  <Shield size={16}/> Chaves/Times
              </button>
              
              <button onClick={() => setActiveTab('participants')} className={`px-4 py-2 font-bold whitespace-nowrap rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'participants' ? 'bg-brand-surfaceHighlight text-brand-text border-b-2 border-brand-primary' : 'text-brand-textMuted hover:text-brand-text hover:bg-brand-surfaceHighlight/50'}`}>
                  <Users size={16}/> Participantes {pendingRegistrations.length > 0 && isOrganizer && <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingRegistrations.length}</span>}
              </button>

              {/* MARKETING TAB FOR ORGANIZERS */}
              {isOrganizer && (
                  <button onClick={() => setActiveTab('marketing')} className={`px-4 py-2 font-bold whitespace-nowrap rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'marketing' ? 'bg-brand-surfaceHighlight text-brand-text border-b-2 border-brand-primary' : 'text-brand-textMuted hover:text-brand-text hover:bg-brand-surfaceHighlight/50'}`}>
                      <Globe size={16}/> Divulgação
                  </button>
              )}

              {/* NEW APPEARANCE TAB FOR ORGANIZERS */}
              {isOrganizer && (
                  <button onClick={() => setActiveTab('appearance')} className={`px-4 py-2 font-bold whitespace-nowrap rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'appearance' ? 'bg-brand-surfaceHighlight text-brand-text border-b-2 border-brand-primary' : 'text-brand-textMuted hover:text-brand-text hover:bg-brand-surfaceHighlight/50'}`}>
                      <Palette size={16}/> Aparência
                  </button>
              )}

              {/* NEW SETTINGS TAB FOR ORGANIZERS */}
              {isOrganizer && (
                  <button onClick={() => setActiveTab('config')} className={`px-4 py-2 font-bold whitespace-nowrap rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'config' ? 'bg-brand-surfaceHighlight text-brand-text border-b-2 border-brand-primary' : 'text-brand-textMuted hover:text-brand-text hover:bg-brand-surfaceHighlight/50'}`}>
                      <Settings size={16}/> Configurações
                  </button>
              )}
          </div>

          <div className="bg-brand-surface/90 backdrop-blur rounded-xl border border-brand-border min-h-[400px] shadow-2xl relative overflow-hidden">
              
              {/* --- APPEARANCE TAB --- */}
              {activeTab === 'appearance' && isOrganizer && (
                  <div className="p-6 animate-in fade-in space-y-8">
                      <div>
                          <h3 className="text-xl font-bold text-brand-text mb-1 flex items-center gap-2"><Palette/> Aparência do Campeonato</h3>
                          <p className="text-sm text-brand-textMuted">Personalize a identidade visual deste campeonato.</p>
                      </div>

                      {/* Banner / Capa */}
                      <div className="bg-brand-surfaceHighlight rounded-xl p-5 border border-brand-border">
                          <label className="block text-xs font-bold text-brand-textMuted uppercase tracking-widest mb-3">Capa do Campeonato</label>
                          <div className="flex gap-4 items-start">
                              <div className="w-32 h-20 rounded-lg overflow-hidden bg-brand-surface border border-brand-border flex-shrink-0 flex items-center justify-center">
                                  {tournament.bannerUrl
                                      ? <img src={tournament.bannerUrl} className="w-full h-full object-cover" />
                                      : <Trophy size={24} className="text-brand-textMuted opacity-30" />
                                  }
                              </div>
                              <div className="flex-1 space-y-2">
                                  <input
                                      type="text"
                                      value={tournament.bannerUrl || ''}
                                      onChange={e => onUpdateTournament && onUpdateTournament(tournament.id, { bannerUrl: e.target.value })}
                                      placeholder="https://url-da-imagem.com/capa.jpg"
                                      className="w-full bg-brand-surface border border-brand-border rounded-lg p-3 text-brand-text text-sm focus:border-brand-primary outline-none"
                                  />
                                  <label className="inline-flex items-center gap-2 bg-brand-surface border border-brand-border hover:border-brand-primary px-4 py-2 rounded-lg cursor-pointer text-[11px] font-bold text-brand-textMuted hover:text-brand-text transition-all uppercase tracking-widest">
                                      <Upload size={13}/> Enviar imagem
                                      <input type="file" hidden accept="image/*" onChange={async e => {
                                          const file = e.target.files?.[0];
                                          if (!file || !onUpdateTournament) return;
                                          const reader = new FileReader();
                                          reader.onloadend = () => onUpdateTournament(tournament.id, { bannerUrl: reader.result as string });
                                          reader.readAsDataURL(file);
                                      }} />
                                  </label>
                              </div>
                          </div>
                      </div>

                      {/* Cor de destaque */}
                      <div className="bg-brand-surfaceHighlight rounded-xl p-5 border border-brand-border">
                          <label className="block text-xs font-bold text-brand-textMuted uppercase tracking-widest mb-3">Cor de Destaque</label>
                          <div className="flex items-center gap-4">
                              <div
                                  className="relative w-10 h-10 rounded-lg overflow-hidden border border-brand-border flex-shrink-0 cursor-pointer"
                                  style={{ background: tournament.primaryColor || 'var(--theme-primary)' }}
                              >
                                  <input
                                      type="color"
                                      value={tournament.primaryColor || '#FF6A00'}
                                      onChange={e => onUpdateTournament && onUpdateTournament(tournament.id, { primaryColor: e.target.value })}
                                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                  />
                              </div>
                              <input
                                  type="text"
                                  value={tournament.primaryColor || '#FF6A00'}
                                  onChange={e => onUpdateTournament && onUpdateTournament(tournament.id, { primaryColor: e.target.value })}
                                  maxLength={7}
                                  className="flex-1 bg-brand-surface border border-brand-border rounded-lg p-3 text-brand-text font-mono text-sm uppercase focus:border-brand-primary outline-none"
                              />
                          </div>
                          <p className="text-[11px] text-brand-textMuted mt-2 italic">Afeta botões e destaques apenas neste campeonato.</p>
                      </div>
                  </div>
              )}

              {/* --- CONFIG TAB --- */}
              {activeTab === 'config' && isOrganizer && (
                  <div className="p-6 animate-in fade-in">
                      <h3 className="text-xl font-bold text-brand-text mb-4 flex items-center gap-2"><Settings/> Configurações Básicas</h3>
                      <p className="text-sm text-brand-textMuted mb-6">Edite as informações fundamentais do seu campeonato.</p>
                      
                      <div className="space-y-6 max-w-2xl">
                          <div>
                              <label className="block text-xs font-bold text-brand-textMuted uppercase mb-1">Nome do Campeonato</label>
                              <input 
                                  type="text" 
                                  value={tournament.name}
                                  onChange={(e) => onUpdateTournament && onUpdateTournament(tournament.id, { name: e.target.value })}
                                  className="w-full bg-brand-surfaceHighlight border border-brand-border rounded-lg p-3 text-brand-text focus:border-brand-primary outline-none"
                              />
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-brand-textMuted uppercase mb-1">URL do Banner</label>
                              <div className="flex gap-2">
                                  <input 
                                      type="text" 
                                      value={tournament.bannerUrl || ''}
                                      onChange={(e) => onUpdateTournament && onUpdateTournament(tournament.id, { bannerUrl: e.target.value })}
                                      className="flex-1 bg-brand-surfaceHighlight border border-brand-border rounded-lg p-3 text-brand-text focus:border-brand-primary outline-none"
                                      placeholder="https://exemplo.com/imagem.jpg"
                                  />
                                  <label className="bg-brand-surfaceHighlight border border-brand-border px-4 py-2 rounded-lg cursor-pointer hover:bg-brand-border transition-colors flex items-center gap-2 text-brand-text text-sm font-bold">
                                      <Upload size={16}/> Upload
                                      <input 
                                          type="file" 
                                          hidden 
                                          accept="image/*" 
                                          onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                  const reader = new FileReader();
                                                  reader.onloadend = () => {
                                                      if (onUpdateTournament) onUpdateTournament(tournament.id, { bannerUrl: reader.result as string });
                                                  };
                                                  reader.readAsDataURL(file);
                                              }
                                          }} 
                                      />
                                  </label>
                              </div>
                          </div>

                          <div className="pt-8 border-t border-brand-border text-center">
                               {tournament.status !== 'FINISHED' && (
                                  <button 
                                      onClick={() => {
                                          if (window.confirm('Deseja realmente FINALIZAR este campeonato Oficialmente? Se houverem regras de classificação, as vagas serão preenchidas automaticamente nos torneios de destino.')) {
                                              if (onFinishTournament) onFinishTournament(tournament.id);
                                          }
                                      }}
                                      className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl shadow-xl shadow-green-600/20 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:scale-95 uppercase tracking-widest text-sm"
                                  >
                                      <Check size={20}/> Finalizar Campeonato Oficialmente
                                  </button>
                               )}
                               {tournament.status === 'FINISHED' && (
                                   <div className="bg-green-600/10 border border-green-600/30 p-4 rounded-xl text-green-500 font-bold flex items-center justify-center gap-2">
                                       <Check size={18}/> Este campeonato já está finalizado e as classificações foram processadas.
                                   </div>
                               )}
                          </div>

                          <div className="pt-8 border-t border-brand-border">
                              <h4 className="text-brand-primary font-bold mb-4 flex items-center gap-2"><Trophy size={18}/> Regras de Classificação Automática</h4>
                              <p className="text-xs text-brand-textMuted mb-6">Defina vagas automáticas para outros campeonatos ao finalizar este.</p>
                              
                              <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-4 mb-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                                      <div className="lg:col-span-1">
                                          <label className="text-[10px] font-bold text-brand-textMuted uppercase mb-1 block">Pos. Início</label>
                                          <input type="number" value={newRuleStart} onChange={e => setNewRuleStart(Number(e.target.value))} className="w-full bg-brand-surface border border-brand-border rounded-lg p-3 text-white text-xs outline-none focus:border-brand-primary" />
                                      </div>
                                      <div className="lg:col-span-1">
                                          <label className="text-[10px] font-bold text-brand-textMuted uppercase mb-1 block">Pos. Final</label>
                                          <input type="number" value={newRuleEnd} onChange={e => setNewRuleEnd(Number(e.target.value))} className="w-full bg-brand-surface border border-brand-border rounded-lg p-3 text-white text-xs outline-none focus:border-brand-primary" />
                                      </div>
                                      <div className="lg:col-span-1">
                                          <label className="text-[10px] font-bold text-brand-textMuted uppercase mb-1 block">Torneio Destino</label>
                                          <select value={newRuleDest} onChange={e => setNewRuleDest(e.target.value)} className="w-full bg-brand-surface border border-brand-border rounded-lg p-3 text-white text-xs outline-none focus:border-brand-primary cursor-pointer">
                                              <option value="">Selecione...</option>
                                              {allTournaments.filter(t => t.id !== tournament.id).map(t => (
                                                  <option key={t.id} value={t.id} className="bg-brand-surface">{t.name}</option>
                                              ))}
                                          </select>
                                      </div>
                                      <div className="lg:col-span-1">
                                          <label className="text-[10px] font-bold text-brand-textMuted uppercase mb-1 block">Descrição (Ex: Libertadores)</label>
                                          <input type="text" value={newRuleDesc} onChange={e => setNewRuleDesc(e.target.value)} placeholder="Opcional" className="w-full bg-brand-surface border border-brand-border rounded-lg p-3 text-white text-xs outline-none focus:border-brand-primary" />
                                      </div>
                                      <button 
                                          type="button"
                                          onClick={() => {
                                              if (!newRuleDest) {
                                                  showToast('Selecione um torneio de destino!', 'error');
                                                  return;
                                              }
                                              const newRule = {
                                                  id: Math.random().toString(36).substr(2, 9),
                                                  startPosition: newRuleStart,
                                                  endPosition: newRuleEnd,
                                                  destinationTournamentId: newRuleDest,
                                                  description: newRuleDesc
                                              };
                                              if (onUpdateTournament) {
                                                  onUpdateTournament(tournament.id, {
                                                      qualificationRules: [...(tournament.qualificationRules || []), newRule]
                                                  });
                                              }
                                              setNewRuleDest('');
                                              setNewRuleDesc('');
                                              showToast('Regra de classificação adicionada!');
                                          }}
                                          className="bg-brand-primary text-white p-3 rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center h-[46px]"
                                      >
                                          <Plus size={20}/>
                                      </button>
                                  </div>

                                  {tournament.qualificationRules && tournament.qualificationRules.length > 0 && (
                                      <div className="mt-4 space-y-2">
                                          {tournament.qualificationRules.map(rule => (
                                              <div key={rule.id} className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-white/5 group">
                                                  <div className="text-xs">
                                                      <span className="font-black text-yellow-500">{rule.startPosition}º ao {rule.endPosition}º</span> 
                                                      <span className="text-brand-textMuted mx-2">→</span>
                                                      <span className="text-white font-bold">{allTournaments.find(t => t.id === rule.destinationTournamentId)?.name || 'Torneio Excluído'}</span>
                                                      {rule.description && <span className="ml-2 text-blue-400 font-black uppercase text-[9px] bg-blue-400/10 px-2 py-1 rounded border border-blue-400/20 tracking-widest">{rule.description}</span>}
                                                  </div>
                                                  <button 
                                                      onClick={() => {
                                                          if (onUpdateTournament) {
                                                              onUpdateTournament(tournament.id, {
                                                                  qualificationRules: tournament.qualificationRules?.filter(r => r.id !== rule.id)
                                                              });
                                                          }
                                                      }}
                                                      className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/10 rounded-lg"
                                                  >
                                                      <Trash2 size={16}/>
                                                  </button>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          </div>

                          <div className="pt-8 border-t border-brand-border">
                              <h4 className="text-red-500 font-bold mb-2 flex items-center gap-2"><AlertTriangle size={16}/> Zona de Perigo</h4>
                              <p className="text-xs text-brand-textMuted mb-4">Ações irreversíveis que afetam todo o campeonato.</p>
                              
                              <div className="flex flex-wrap gap-3">
                                  <button 
                                      onClick={() => {
                                          if (window.confirm('TEM CERTEZA? Isso vai apagar todos os times e jogos, mas manterá as configurações do campeonato.')) {
                                              onResetTournament(tournament.id);
                                              showToast('Campeonato resetado com sucesso!');
                                          }
                                      }}
                                      className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-500 border border-yellow-600/30 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                                  >
                                      <RefreshCw size={14}/> Resetar Dados
                                  </button>
                                  
                                  <button 
                                      onClick={() => {
                                          if (window.confirm('CUIDADO! Isso vai apagar o campeonato PERMANENTEMENTE. Continuar?')) {
                                              onDeleteTournament(tournament.id);
                                              onBack();
                                          }
                                      }}
                                      className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-600/30 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                                  >
                                      <Trash2 size={14}/> Excluir Campeonato
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* ... (Existing tabs remain unchanged) ... */}
              {activeTab === 'marketing' && isOrganizer && (
                  <div className="p-6 animate-in fade-in">
                      <h3 className="text-xl font-bold text-brand-text mb-4 flex items-center gap-2"><Globe/> Redes Sociais do Campeonato</h3>
                      
                      {!tournament.isOfficial ? (
                          <div className="flex flex-col items-center justify-center p-12 bg-black/30 border border-dashed border-slate-700 rounded-xl text-center">
                              <div className="bg-slate-800 p-4 rounded-full mb-4 shadow-inner">
                                  <Lock size={32} className="text-slate-400" />
                              </div>
                              <h4 className="text-lg font-bold text-brand-text mb-2">Recurso Bloqueado</h4>
                              <p className="text-brand-textMuted max-w-md text-sm">
                                  A gestão de redes sociais externas é exclusiva para campeonatos 
                                  <span className="text-yellow-500 font-bold mx-1">OFICIAIS</span>.
                              </p>
                              <p className="text-brand-textMuted text-xs mt-4 bg-brand-surfaceHighlight p-3 rounded border border-brand-border">
                                  Solicite a oficialização ao administrador para liberar este módulo.
                              </p>
                          </div>
                      ) : (
                          <>
                              <p className="text-sm text-brand-textMuted mb-6">
                                  Configure links que aparecerão na tela de login como <span className="text-yellow-500 font-bold">Links Oficiais</span>. 
                                  <span className="block mt-1 text-xs text-yellow-500/70">Nota: O posicionamento é livre (0-100% da tela). Teste para não cobrir elementos importantes.</span>
                              </p>

                              <div className="bg-brand-surfaceHighlight border border-brand-border p-4 rounded-xl mb-6 shadow-inner">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-4">
                                      <div className="lg:col-span-2">
                                          <label className="text-xs font-bold text-brand-textMuted uppercase mb-1 block">Nome da Rede Social</label>
                                          <input 
                                              value={socialName} 
                                              onChange={e=>setSocialName(e.target.value)} 
                                              placeholder="Ex: Instagram Oficial, Canal YouTube..." 
                                              className="w-full bg-black border border-brand-border rounded p-2 text-white text-sm outline-none focus:border-brand-primary"
                                          />
                                      </div>
                                      <div className="lg:col-span-2">
                                          <label className="text-xs font-bold text-brand-textMuted uppercase mb-1 block">Link / URL</label>
                                          <input value={newSocialUrl} onChange={e=>setNewSocialUrl(e.target.value)} placeholder="https://..." className="w-full bg-black border border-brand-border rounded p-2 text-white text-sm outline-none focus:border-brand-primary"/>
                                      </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                      {/* ICON CONFIG */}
                                      <div className="bg-black/30 p-3 rounded border border-brand-border">
                                          <label className="text-xs font-bold text-brand-textMuted uppercase mb-2 block">Ícone / Logotipo</label>
                                          <div className="flex gap-2 mb-3">
                                              <button 
                                                  onClick={() => setSocialIconMode('UPLOAD')} 
                                                  className={`flex-1 py-1.5 text-xs font-bold rounded ${socialIconMode === 'UPLOAD' ? 'bg-brand-primary text-white' : 'bg-brand-surface border border-brand-border text-brand-textMuted'}`}
                                              >
                                                  Upload Arquivo
                                              </button>
                                              <button 
                                                  onClick={() => setSocialIconMode('URL')} 
                                                  className={`flex-1 py-1.5 text-xs font-bold rounded ${socialIconMode === 'URL' ? 'bg-brand-primary text-white' : 'bg-brand-surface border border-brand-border text-brand-textMuted'}`}
                                              >
                                                  Link Direto
                                              </button>
                                          </div>
                                          
                                          {socialIconMode === 'UPLOAD' ? (
                                              <label className="flex items-center justify-center gap-2 cursor-pointer bg-brand-surface hover:bg-brand-surfaceHighlight text-brand-text border border-brand-border rounded p-2 text-xs transition-colors h-10">
                                                  <Upload size={14}/> {socialIconUrl ? 'Imagem Carregada' : 'Escolher PNG/JPG'}
                                                  <input type="file" hidden accept="image/*" onChange={handleSocialIconUpload} />
                                              </label>
                                          ) : (
                                              <input 
                                                  value={socialIconUrl} 
                                                  onChange={e=>setSocialIconUrl(e.target.value)} 
                                                  placeholder="https://imgur.com/..." 
                                                  className="w-full bg-black border border-brand-border rounded p-2 text-white text-xs h-10 outline-none"
                                              />
                                          )}

                                          {socialIconUrl && (
                                              <div className="mt-3 flex items-center justify-center bg-black/50 p-2 rounded border border-brand-border relative">
                                                  <img src={socialIconUrl} className="w-10 h-10 object-contain" alt="Preview"/>
                                                  <button onClick={() => setSocialIconUrl('')} className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1 text-white hover:scale-110 transition-transform"><X size={10}/></button>
                                              </div>
                                          )}
                                      </div>

                                      {/* POSITION CONFIG */}
                                      <div className="bg-black/30 p-3 rounded border border-brand-border h-full flex flex-col justify-between">
                                          <div>
                                              <label className="text-xs font-bold text-brand-textMuted uppercase mb-1 flex justify-between">Posição Horizontal (X): {socialX}%</label>
                                              <input type="range" min="0" max="100" value={socialX} onChange={e=>setSocialX(parseInt(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-primary mb-3"/>
                                          
                                              <label className="text-xs font-bold text-brand-textMuted uppercase mb-1 flex justify-between">Posição Vertical (Y): {socialY}%</label>
                                              <input type="range" min="0" max="100" value={socialY} onChange={e=>setSocialY(parseInt(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-primary"/>
                                          </div>
                                          <button onClick={handleAddSocial} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded text-sm flex items-center justify-center gap-2 mt-4 w-full shadow-lg"><Plus size={16}/> Adicionar Rede Oficial</button>
                                      </div>
                                  </div>
                              </div>

                              <div className="space-y-2">
                                  <h4 className="text-sm font-bold text-brand-text uppercase mb-2 flex items-center gap-2"><Crown size={14} className="text-yellow-500"/> Redes Ativas</h4>
                                  {tournament.socialLinks && tournament.socialLinks.length > 0 ? (
                                      tournament.socialLinks.map((link, idx) => (
                                          <div key={link.id} className="flex justify-between items-center bg-black/40 p-3 rounded border border-brand-border hover:border-yellow-500/50 transition-colors">
                                              <div className="flex items-center gap-3">
                                                  <div className="bg-brand-primary/10 p-2 rounded text-brand-primary border border-brand-primary/30 w-10 h-10 flex items-center justify-center overflow-hidden">
                                                      {link.customIconUrl ? (
                                                          <img src={link.customIconUrl} className="w-full h-full object-contain"/>
                                                      ) : (
                                                          <LinkIcon size={16}/>
                                                      )}
                                                  </div>
                                                  <div>
                                                      <p className="text-sm font-bold text-brand-text">{link.name || link.platform}</p>
                                                      <a href={link.url} target="_blank" rel="noreferrer" className="text-[10px] text-brand-textMuted truncate max-w-[200px] hover:text-brand-primary hover:underline block">{link.url}</a>
                                                  </div>
                                              </div>
                                              <div className="flex items-center gap-4">
                                                  <span className="text-[10px] text-brand-textMuted font-mono bg-black px-2 py-1 rounded border border-slate-800">Pos: {link.position?.x}% / {link.position?.y}%</span>
                                                  <button onClick={() => handleRemoveSocial(link.id)} className="text-red-500 hover:text-white p-2 hover:bg-red-500/20 rounded transition-colors"><Trash2 size={16}/></button>
                                              </div>
                                          </div>
                                      ))
                                  ) : (
                                      <p className="text-sm text-brand-textMuted italic bg-black/20 p-4 rounded text-center border border-dashed border-slate-700">Nenhuma rede social configurada para este campeonato.</p>
                                  )}
                              </div>
                          </>
                      )}
                  </div>
              )}

              {/* ... (Existing tabs code: overview, standings, matches, etc. remains unchanged) ... */}
              {activeTab === 'overview' && (
                  <div className="p-6 md:p-8 animate-in fade-in">
                      {/* ... existing overview content ... */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                          <div className="bg-brand-surfaceHighlight border border-brand-border p-4 rounded-xl flex items-center gap-4">
                              <div className="p-3 bg-blue-500/20 rounded-full text-blue-400"><Users size={24}/></div>
                              <div>
                                  <p className="text-brand-textMuted text-xs font-bold uppercase">Times Inscritos</p>
                                  <p className="text-2xl font-black text-brand-text">{teams.length}</p>
                              </div>
                          </div>
                          <div className="bg-brand-surfaceHighlight border border-brand-border p-4 rounded-xl flex items-center gap-4">
                              <div className="p-3 bg-green-500/20 rounded-full text-green-400"><Calendar size={24}/></div>
                              <div>
                                  <p className="text-brand-textMuted text-xs font-bold uppercase">Criado em</p>
                                  <p className="text-xl font-bold text-brand-text">{new Date(tournament.createdAt || Date.now()).toLocaleDateString()}</p>
                              </div>
                          </div>
                          {tournament.entryFee && (
                              <div className="bg-brand-surfaceHighlight border border-brand-border p-4 rounded-xl flex items-center gap-4">
                                  <div className="p-3 bg-yellow-500/20 rounded-full text-yellow-400"><DollarSign size={24}/></div>
                                  <div>
                                      <p className="text-brand-textMuted text-xs font-bold uppercase">Valor Inscrição</p>
                                      <p className="text-xl font-bold text-brand-text">R$ {tournament.entryFee}</p>
                                  </div>
                              </div>
                          )}
                      </div>
                      <h3 className="text-xl font-bold text-brand-text mb-4 flex items-center gap-2 border-b border-brand-border pb-2"><Shield size={20} className="text-brand-primary"/> Times Participantes Confirmados</h3>
                      {teams.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              {teams.map((team, index) => (
                                  <div key={`${team.id}-${index}`} className="bg-black/40 border border-brand-border p-4 rounded-xl flex items-center gap-4 hover:border-brand-primary transition-colors cursor-default">
                                      <div className="w-12 h-12 bg-brand-surface rounded-full flex items-center justify-center overflow-hidden border border-brand-border shrink-0">
                                          {team.logoUrl ? <img src={team.logoUrl} className="w-full h-full object-cover"/> : <Shield className="text-slate-600"/>}
                                      </div>
                                      <div>
                                          <p className="font-bold text-brand-text truncate">{team.name}</p>
                                          <p className="text-xs text-green-500 font-bold flex items-center gap-1"><Check size={10}/> Aprovado</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="text-center py-10 bg-brand-surfaceHighlight rounded-xl border border-dashed border-brand-border"><Users size={32} className="text-brand-textMuted mx-auto mb-2 opacity-50"/><p className="text-brand-textMuted">Nenhum time inscrito ou aprovado ainda.</p></div>
                      )}
                  </div>
              )}

              {/* ... (Include existing logic for my-roster, registrations, matches, standings, teams, brackets) ... */}
              
              {/* Re-inserting other tabs for completeness of the file */}
              {activeTab === 'my-roster' && myTeamInTournament && (
                  <div className="p-6 md:p-8 animate-in fade-in">
                      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                          <div><h3 className="text-2xl font-black text-brand-text italic uppercase flex items-center gap-2">{myTeamInTournament.name}</h3><p className="text-brand-textMuted text-sm">Elenco oficial registrado.</p></div>
                          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 max-w-md"><Info size={16}/><span>Snapshot do elenco na inscrição.</span></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {myTournamentPlayers.map(p => (
                              <div key={p.id} className="bg-brand-surfaceHighlight border border-brand-border p-3 rounded-xl flex items-center gap-3 relative overflow-hidden group hover:border-brand-primary transition-all">
                                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center font-bold text-xs text-brand-textMuted border border-brand-border shrink-0 z-10">{p.position}</div>
                                  <div className="flex-1 z-10"><p className="font-bold text-brand-text text-sm truncate">{p.name}</p>{p.rating !== undefined && (<div className="flex items-center gap-1 mt-0.5"><span className="text-[10px] text-brand-textMuted uppercase font-bold">OVR</span><span className={`text-xs font-black ${p.rating >= 8 ? 'text-green-500' : p.rating >= 6 ? 'text-yellow-500' : 'text-red-500'}`}>{p.rating.toFixed(1)}</span></div>)}</div>
                                  {p.photoUrl && (<img src={p.photoUrl} className="absolute right-[-10px] bottom-[-10px] w-20 h-20 object-cover opacity-20 grayscale group-hover:grayscale-0 group-hover:opacity-40 transition-all z-0 pointer-events-none"/>)}
                              </div>
                          ))}
                      </div>
                      {myTournamentPlayers.length === 0 && <div className="text-center py-10"><p className="text-brand-textMuted">Nenhum jogador encontrado.</p></div>}
                  </div>
              )}

              {activeTab === 'participants' && (
                  <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-brand-text flex items-center gap-2"><Users/> Lista de Participantes</h3>
                        <div className="text-[10px] font-bold text-brand-textMuted bg-brand-border px-3 py-1 rounded-full uppercase tracking-wider">
                           {registrations.length} Total
                        </div>
                      </div>

                      <div className="space-y-3">
                          {registrations.length === 0 && (
                            <div className="text-center py-12 bg-black/20 rounded-xl border border-dashed border-brand-border">
                              <Search size={32} className="mx-auto text-brand-textMuted mb-2 opacity-30"/>
                              <p className="text-brand-textMuted italic">Ainda não há inscritos neste campeonato.</p>
                            </div>
                          )}

                          {registrations.sort((a,b) => b.timestamp - a.timestamp).map(reg => {
                              const participantProfile = playerProfiles.find(p => p.userId === reg.teamOwnerId);
                              const pName = participantProfile?.nickname || 'Usuário Pró';
                              
                              return (
                                  <div key={reg.id} className="bg-brand-surfaceHighlight border border-brand-border/30 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-brand-primary/50 transition-all">
                                      <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 bg-black rounded-lg border border-brand-border flex items-center justify-center overflow-hidden shrink-0">
                                              {reg.teamLogoUrl ? <img src={reg.teamLogoUrl} className="w-full h-full object-cover"/> : <Shield className="text-brand-textMuted opacity-30" size={20}/>}
                                          </div>
                                          <div>
                                              <div className="flex items-center gap-2">
                                                <p className="text-brand-text font-black uppercase text-sm">{pName}</p>
                                                <span className="text-brand-textMuted">•</span>
                                                <p className="text-brand-primary font-bold italic text-sm">{reg.teamName}</p>
                                              </div>
                                              <p className="text-[9px] text-brand-textMuted font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                                <Clock size={10}/> Inscrito em {new Date(reg.timestamp).toLocaleString()}
                                              </p>
                                          </div>
                                      </div>

                                      <div className="flex items-center gap-3">
                                          {reg.status === 'APPROVED' && (
                                              <span className="px-3 py-1.5 bg-green-900/30 text-green-400 text-[10px] font-black italic uppercase rounded-lg border border-green-500/20 flex items-center gap-1.5">
                                                  <Check size={12}/> Confirmado
                                              </span>
                                          )}
                                          {reg.status === 'REJECTED' && (
                                              <span className="px-3 py-1.5 bg-red-900/30 text-red-400 text-[10px] font-black italic uppercase rounded-lg border border-red-500/20 flex items-center gap-1.5">
                                                  <X size={12}/> Recusado
                                              </span>
                                          )}
                                          {reg.status === 'PENDING' && (
                                              <span className="px-3 py-1.5 bg-yellow-900/30 text-yellow-500 text-[10px] font-black italic uppercase rounded-lg border border-yellow-500/20 flex items-center gap-1.5">
                                                  <Clock size={12}/> Aguardando
                                              </span>
                                          )}

                                          {isOrganizer && reg.status === 'PENDING' && (
                                              <div className="flex flex-col items-end gap-2">
                                                  {tournament.isPaid && (
                                                      <span className="text-[9px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20 font-bold uppercase tracking-tighter flex items-center gap-1">
                                                          <CreditCard size={10}/> Verificar Pagamento
                                                      </span>
                                                  )}
                                                  <div className="flex gap-1">
                                                      <button 
                                                          onClick={() => onRegistrationAction && onRegistrationAction(reg.id, 'APPROVE')}
                                                          className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg font-black text-[10px] uppercase transition-all flex items-center gap-1"
                                                      >
                                                          <Check size={12}/> Aprovar
                                                      </button>
                                                      <button 
                                                          onClick={() => onRegistrationAction && onRegistrationAction(reg.id, 'REJECT')}
                                                          className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg font-black text-[10px] uppercase transition-all flex items-center gap-1"
                                                      >
                                                          <X size={12}/> Recusar
                                                      </button>
                                                  </div>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              )}

              {activeTab === 'matches' && (
                  <div className="p-6">
                      {/* Removed the inline style block for .match-grid */}
                      {isMD3 && isOrganizer && onMD3Action && (
                          <div className="bg-brand-surfaceHighlight border-2 border-brand-primary/30 p-4 rounded-xl mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                              <div><h3 className="text-brand-text font-bold text-lg flex items-center gap-2"><Zap size={18} className="text-brand-primary"/> Gestão do Desafio</h3><p className="text-brand-textMuted text-sm">Controle jogos extras e finais.</p></div>
                              <div className="flex items-center gap-4">
                                  {teams.length === 2 && md3Stats && (<div className="bg-black px-4 py-2 rounded text-sm font-bold border border-brand-border"><span className="text-slate-400 mr-2">PLACAR SÉRIE:</span><span className="text-white">{md3Stats.wins1}</span> x <span className="text-white">{md3Stats.wins2}</span></div>)}
                                  {teams.length === 2 && md3Stats && ( <> {(md3Stats.finishedCount === 1 && md3Stats.totalCount === 1) && (<button onClick={() => onMD3Action(tournament.id)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold text-sm shadow-lg flex items-center gap-2"><RefreshCw size={14}/> Gerar Jogo de Volta</button>)} {(md3Stats.wins1 === 1 && md3Stats.wins2 === 1 && md3Stats.totalCount < 3) && (<button onClick={() => onMD3Action(tournament.id)} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-bold text-sm shadow-lg flex items-center gap-2 animate-pulse"><Zap size={14}/> Gerar Jogo Decisivo (Nega)</button>)} </> )}
                                  {teams.length >= 3 && (<button onClick={() => onMD3Action(tournament.id)} className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded font-bold text-sm shadow-lg flex items-center gap-2"><Crown size={14}/> Gerar Grande Final (Top 2)</button>)}
                              </div>
                          </div>
                      )}
                      
                      {isLeague && (
                          <div className="flex gap-2 mb-6 items-center">
                              <button onClick={() => setMatchTurnFilter(1)} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${matchTurnFilter === 1 ? 'bg-brand-primary text-white shadow-lg' : 'bg-brand-surfaceHighlight text-brand-textMuted hover:bg-brand-border'}`}>1º Turno (Ida)</button>
                              {tournament.doubleRoundRobin && ( <button onClick={() => { if (hasTurn2Matches) setMatchTurnFilter(2); }} disabled={!hasTurn2Matches} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${matchTurnFilter === 2 ? 'bg-brand-primary text-white shadow-lg' : hasTurn2Matches ? 'bg-brand-surfaceHighlight text-brand-textMuted hover:bg-brand-border' : 'bg-black/20 text-slate-600 cursor-not-allowed border border-dashed border-slate-700'}`}> {hasTurn2Matches ? '2º Turno (Volta)' : '2º Turno (Bloqueado)'} </button> )}
                              {isOrganizer && tournament.doubleRoundRobin && !hasTurn2Matches && isTurn1Finished && matchTurnFilter === 1 && ( <button onClick={onGenerateMatches} className="ml-auto bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold text-xs flex items-center gap-2 shadow-lg animate-pulse"> <Check size={14}/> Finalizar 1º Turno (Gerar Returno) </button> )}
                          </div>
                      )}

                      {!isSwiss && !isMD3 && !isKnockout && !isLeague && tournament.groups.length > 1 && (
                          <div className="flex gap-2 mb-6 overflow-x-auto">{tournament.groups.map(group => (<button key={group.id} onClick={() => setActiveGroupId(group.id)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeGroupId === group.id ? 'bg-brand-primary text-white' : 'bg-brand-surfaceHighlight text-brand-textMuted'}`}>{group.name}</button>))}</div>
                      )}

                      {isOrganizer && !hasMatches && (
                          <div className="flex flex-col items-center justify-center py-16 bg-black/20 rounded-xl border border-dashed border-brand-border mb-6">
                              <Calendar size={48} className="text-brand-textMuted mb-4 opacity-50"/><h4 className="text-lg font-bold text-brand-text mb-2">Tabela de Jogos Vazia</h4><p className="text-brand-textMuted text-sm text-center max-w-md mb-6">{isSwiss ? 'Inicie a 1ª rodada do Sistema Suíço.' : isKnockout ? 'Gere o chaveamento inicial.' : isLeague ? 'Gere a tabela do 1º Turno.' : 'Configure os confrontos.'}</p><button onClick={onGenerateMatches} className="bg-brand-primary hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transform hover:scale-105 transition-all"><RefreshCw size={20}/> Gerar Jogos</button>
                          </div>
                      )}

                      {isSwiss && isOrganizer && hasMatches && !isGroupStageFinished && (
                          <div className="flex justify-center mb-6"><button onClick={onGenerateMatches} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"><RefreshCw size={20}/> Gerar Próxima Rodada (Suíço)</button></div>
                      )}

                      {isOrganizer && (isKnockout || isGroupStageFinished) && !hasKnockoutStarted && hasMatches && !isLeague && (
                          <div className="flex flex-col items-center justify-center py-12 bg-black/20 rounded-xl border border-dashed border-brand-border mb-6 animate-in fade-in">
                              <Trophy size={48} className="text-yellow-500 mb-4 opacity-80"/><h4 className="text-lg font-bold text-brand-text mb-2">Chaveamento Disponível</h4><p className="text-brand-textMuted text-sm text-center max-w-md mb-6">{isKnockout ? 'O torneio está pronto para iniciar o mata-mata.' : 'Fase classificatória concluída. Gere os confrontos finais.'}</p><button onClick={() => onAdvanceToKnockout && onAdvanceToKnockout(tournament.id)} className="bg-brand-primary hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transform hover:scale-105 transition-all"><Zap size={20}/> Gerar Chaveamento</button>
                          </div>
                      )}

                      {displayMatches.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3 items-start">
                              {Object.entries(
                                  displayMatches.reduce((acc: any, m: any) => {
                                      const groupName = tournament.groups.find(g => g.id === m.groupId)?.name || 'Outros';
                                      if (!acc[groupName]) acc[groupName] = [];
                                      acc[groupName].push(m);
                                      return acc;
                                  }, {})
                              ).map(([groupName, matches]: [string, any]) => (
                                  <div key={groupName} className="grupo-jogos">
                                      <div className="grupo-header" onClick={() => setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }))}>
                                          {groupName} {expandedGroups[groupName] ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                      </div>
                                      {expandedGroups[groupName] && (
                                          <div className="grupo-conteudo">
                                              {matches.map((m: any) => <HorizontalMatchCard key={m.id} match={m} />)}
                                          </div>
                                      )}
                                  </div>
                              ))}
                          </div>
                      ) : ( hasMatches && <div className="text-center py-10 text-brand-textMuted">Nenhum jogo encontrado para este turno/filtro.</div> )}
                  </div>
              )}

              {activeTab === 'standings' && (
                  <div className="p-4 md:p-6 classificacao-wrapper flex flex-col lg:flex-row gap-6 items-start w-full">
                      {/* Tabela de Classificação - 75% */}
                      <div className="tabela-container w-full lg:w-[75%] bg-black/20 p-4 rounded-xl border border-white/5">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                              {isLeague && ( 
                                  <div className="flex flex-wrap gap-2"> 
                                      <button onClick={() => setStandingsFilter('ALL')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${standingsFilter === 'ALL' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-brand-surfaceHighlight text-brand-textMuted hover:bg-white/10'}`}>Classificação Geral</button> 
                                      <button onClick={() => setStandingsFilter('TURN1')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${standingsFilter === 'TURN1' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-brand-surfaceHighlight text-brand-textMuted hover:bg-white/10'}`}>1º Turno</button> 
                                      {tournament.doubleRoundRobin && hasTurn2Matches && ( 
                                          <button onClick={() => setStandingsFilter('TURN2')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${standingsFilter === 'TURN2' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-brand-surfaceHighlight text-brand-textMuted hover:bg-white/10'}`}>2º Turno</button> 
                                      )} 
                                  </div> 
                              )}
                              {!isSwiss && !isLeague && tournament.groups.length > 1 && ( 
                                  <div className="flex flex-wrap gap-2">
                                      {tournament.groups.map(g => (
                                          <button key={g.id} onClick={()=>setActiveGroupId(g.id)} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeGroupId===g.id ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25':'bg-brand-surfaceHighlight text-brand-textMuted hover:bg-white/5'}`}>{g.name}</button>
                                      ))}
                                  </div> 
                              )}
                              <div className="flex gap-2 ml-auto sm:ml-0"> 
                                  {isOrganizer && (
                                      <button onClick={handleSimulateGroupStage} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-md">
                                          ⚡ Simular (Dev)
                                      </button>
                                  )} 
                                  {(isGroups || isSwiss) && isOrganizer && !hasKnockoutStarted && isGroupStageFinished && ( 
                                      <button id="btnFinalizarGrupos" onClick={() => { if (onAdvanceToKnockout) { if(window.confirm('Tem certeza? Isso vai encerrar a fase classificatória e gerar o mata-mata.')) { onAdvanceToKnockout(tournament.id); setActiveTab('brackets'); } } }} className="bg-brand-primary hover:bg-brand-primary/80 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg transition-all animate-all duration-300"> <Zap size={14}/> Finalizar Fase & Gerar Mata-Mata </button> 
                                  )} 
                              </div>
                          </div>
                          
                          <div className="classificacao-container overflow-x-auto rounded-xl border border-white/5 bg-black/30">
                              <table className="w-full min-w-[720px] text-left text-sm text-brand-text border-collapse table-fixed">
                                  <thead className="bg-[#181818] text-brand-textMuted uppercase font-black text-[10px] tracking-wider border-b border-white/5">
                                      <tr>
                                          <th className="py-4 px-2 w-[40px] text-center">#</th>
                                          <th className="py-4 px-3 text-left w-auto">Time / Identidade</th>
                                          <th className="py-4 px-1 w-[55px] text-center font-black bg-brand-primary/15 text-brand-primary border-l border-r border-white/5">Pts</th>
                                          <th className="py-4 px-1 w-[32px] text-center">J</th>
                                          <th className="py-4 px-1 w-[32px] text-center text-green-500/85">V</th>
                                          <th className="py-4 px-1 w-[32px] text-center">E</th>
                                          <th className="py-4 px-1 w-[32px] text-center text-red-500/85">D</th>
                                          <th className="py-4 px-1 w-[35px] text-center">GP</th>
                                          <th className="py-4 px-1 w-[35px] text-center">GC</th>
                                          <th className="py-4 px-1 w-[38px] text-center">SG</th>
                                          <th className="py-4 px-2 w-[44px] text-center">%</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5">
                                      {sortedTeams.map((t, i) => { 
                                          const possiblePoints = t.played * 3; 
                                          const percentage = possiblePoints > 0 ? Math.round((t.points / possiblePoints) * 100) : 0; 
                                          const isMyTeam = myTeamInTournament?.id === t.id; 
                                          const classificadosCount = tournament.classificados_por_grupo || tournament.playoffQualifiedCount || 4;
                                          const isClassified = i < classificadosCount;
                                          const tVisual = getTeamNameAndEscudo(t);
                                          
                                          return ( 
                                              <React.Fragment key={t.id}>
                                                  <tr className={`hover:bg-white/[0.04] transition-all border-b border-white/5 ${isMyTeam ? 'bg-brand-primary/10' : ''} cursor-pointer`} onClick={() => setSelectedMatch(selectedMatch?.homeTeamId === t.id ? null : { homeTeamId: t.id, awayTeamId: t.id } as any)}> 
                                                      <td className="py-5 px-2 md:py-6 text-center font-mono text-sm text-brand-textMuted/80 font-black">
                                                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[12px] font-black ${isClassified ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/50'}`}>
                                                              {i+1}
                                                          </span>
                                                      </td> 
                                                      <td className="py-5 px-3 md:py-6 font-bold text-brand-text"> 
                                                          <div className="flex items-center gap-4"> 
                                                              <div className="shrink-0 flex items-center justify-center"> 
                                                                  {tVisual.logoUrl ? (
                                                                      <img src={tVisual.logoUrl} className="w-12 h-12 md:w-14 md:h-14 object-contain rounded-xl border border-white/10 p-1 bg-black/40 shadow-xl" alt={tVisual.name} />
                                                                  ) : (
                                                                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-brand-textMuted shadow-md">
                                                                          <Shield size={26} className="text-slate-500"/>
                                                                      </div>
                                                                  )} 
                                                              </div> 
                                                              <div className="flex flex-col">
                                                                  <span className={`text-base md:text-xl font-extrabold italic tracking-wide uppercase ${isMyTeam ? 'text-brand-primary' : 'text-white'}`}>{tVisual.name}</span> 
                                                                  {tournament.experienceType === 'X1' && (
                                                                      <span className="text-[9px] font-bold text-brand-textMuted uppercase tracking-wider">Cadastro X1 Ativo</span>
                                                                  )}
                                                              </div>
                                                          </div> 
                                                      </td> 
                                                      <td className="py-5 px-1 md:py-6 text-center font-black text-lg md:text-xl text-brand-primary bg-brand-primary/10 border-l border-r border-white/5">{t.points}</td> 
                                                      <td className="py-5 px-1 md:py-6 text-center font-bold text-xs md:text-sm text-white/90">{t.played}</td> 
                                                      <td className="py-5 px-1 md:py-6 text-center font-bold text-xs md:text-sm text-green-400">{t.won}</td> 
                                                      <td className="py-5 px-1 md:py-6 text-center font-medium text-xs md:text-sm text-white/60">{t.drawn}</td> 
                                                      <td className="py-5 px-1 md:py-6 text-center font-bold text-xs md:text-sm text-red-400">{t.lost}</td> 
                                                      <td className="py-5 px-1 md:py-6 text-center text-xs md:text-sm text-white/80">{t.goalsFor}</td> 
                                                      <td className="py-5 px-1 md:py-6 text-center text-xs md:text-sm text-white/50">{t.goalsAgainst}</td> 
                                                      <td className="py-5 px-1 md:py-6 text-center font-bold text-xs md:text-sm text-white">{t.goalsFor - t.goalsAgainst}</td> 
                                                      <td className="py-5 px-2 md:py-6 text-center font-mono text-xs text-brand-textMuted font-bold">{percentage}%</td> 
                                                  </tr>
                                                  {selectedMatch && selectedMatch.homeTeamId === t.id && (
                                                      <tr>
                                                          <td colSpan={11} className="p-4 bg-black/40 hover:bg-transparent border-t border-b border-white/5 animate-in slide-in-from-top-2 fade-in duration-300">
                                                              <div className="text-[10px] font-black text-brand-primary space-x-1 uppercase tracking-widest mb-3">CONFRONTOS RECENTES</div>
                                                              {matches.filter(m => m.isFinished && (m.homeTeamId === t.id || m.awayTeamId === t.id)).length > 0 ? (
                                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                      {matches.filter(m => m.isFinished && (m.homeTeamId === t.id || m.awayTeamId === t.id)).map(m => {
                                                                          const isHome = m.homeTeamId === t.id;
                                                                          const adversario = isHome ? teams.find(tm => tm.id === m.awayTeamId) : teams.find(tm => tm.id === m.homeTeamId);
                                                                          const placarTime = isHome ? m.homeScore : m.awayScore;
                                                                          const placarAdversario = isHome ? m.awayScore : m.homeScore;
                                                                          const advVisual = getTeamNameAndEscudo(adversario);
                                                                          return (
                                                                              <div key={`${m.id}-${t.id}`} className="flex items-center justify-between bg-brand-surfaceHighlight p-3 rounded-lg border border-white/5">
                                                                                  <div className="flex items-center gap-2 truncate">
                                                                                      <div className="w-2 h-2 rounded-full bg-brand-primary shrink-0"></div>
                                                                                      <span className="text-sm font-bold text-white truncate">{tVisual.name}</span>
                                                                                  </div>
                                                                                  <span className="text-sm font-black text-brand-primary mx-3 shrink-0">{placarTime} - {placarAdversario}</span>
                                                                                  <span className="text-sm font-bold text-brand-textMuted truncate">{advVisual.name || '...'}</span>
                                                                              </div>
                                                                          )
                                                                      })}
                                                                  </div>

                                                              ) : (
                                                                  <div className="text-xs text-brand-textMuted font-bold italic p-1">Nenhum confronto finalizado registrado.</div>
                                                              )}
                                                          </td>
                                                      </tr>
                                                  )}
                                              </React.Fragment>
                                          ); 
                                      })}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                      
                      {/* Painel Lateral - 25% */}
                      <div className="jogos-container w-full lg:w-[25%] flex flex-col gap-4">
                          <h3 className="text-lg font-black text-white hover:text-brand-primary transition-colors flex items-center gap-2 uppercase tracking-wide border-b border-white/5 pb-2">
                              <span>Jogos</span>
                              <span className="text-xs bg-brand-primary/25 text-brand-primary px-2 py-0.5 rounded font-black font-mono">{displayMatches.length}</span>
                          </h3>
                          {displayMatches.length > 0 ? (
                              Object.entries(
                                  displayMatches.reduce((acc: any, m: any) => {
                                      const groupName = tournament.groups.find(g => g.id === m.groupId)?.name || 'Outros';
                                      if (!acc[groupName]) acc[groupName] = [];
                                      acc[groupName].push(m);
                                      return acc;
                                  }, {})
                              ).map(([groupName, mList]: [string, any]) => (
                                  <div key={groupName} className="grupo-jogos border border-white/5 rounded-xl bg-black/25">
                                      <div className="grupo-header bg-white/[0.03] hover:bg-white/[0.06] p-3 text-sm font-bold text-white flex justify-between items-center cursor-pointer transition-all" onClick={() => setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }))}>
                                          <span className="font-extrabold uppercase tracking-wider text-xs text-brand-textMuted">{groupName}</span> 
                                          <span>{expandedGroups[groupName] ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</span>
                                      </div>
                                      {expandedGroups[groupName] && (
                                          <div className="grupo-conteudo p-2 flex flex-col gap-2">
                                              {mList.map((m: any) => <HorizontalMatchCard key={m.id} match={m} />)}
                                          </div>
                                      )}
                                  </div>
                              ))
                          ) : (
                              <div className="flex flex-col gap-4">
                                  {/* Alert Banner / "Aviso de Geração" */}
                                  <div className="bg-brand-primary/10 border border-brand-primary/30 p-5 rounded-xl text-center shadow-lg">
                                      <div className="flex justify-center mb-2.5">
                                          <Calendar size={32} className="text-brand-primary animate-pulse"/>
                                      </div>
                                      <div className="text-xs font-black text-brand-primary uppercase tracking-wider">Aviso de Confrontos</div>
                                      <p className="text-xs text-brand-textMuted mt-1.5 leading-relaxed font-bold">
                                          Jogos serão exibidos após geração da rodada
                                      </p>
                                  </div>

                                  {/* Info do Grupo */}
                                  <div className="bg-[#151515] border border-white/5 rounded-xl p-5 shadow-xl">
                                      <div className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-3 border-b border-white/5 pb-2">
                                          Situação do Grupo
                                      </div>
                                      <div className="space-y-3 font-bold text-xs">
                                          <div className="flex justify-between items-center bg-white/[0.02] p-3 rounded-lg border border-white/5">
                                              <span className="text-white/50 uppercase tracking-wider text-[10px]">Equipes</span>
                                              <span className="text-sm font-black text-white">{sortedTeams.length}</span>
                                          </div>
                                          <div className="flex justify-between items-center bg-white/[0.02] p-3 rounded-lg border border-white/5">
                                              <span className="text-white/50 uppercase tracking-wider text-[10px]">Rodada</span>
                                              <span className="text-sm font-black text-emerald-400">
                                                  {tournament.currentRound || 1}
                                              </span>
                                          </div>
                                          <div className="flex justify-between items-center bg-white/[0.02] p-3 rounded-lg border border-white/5">
                                              <span className="text-white/50 uppercase tracking-wider text-[10px]">Classificados</span>
                                              <span className="text-sm font-black text-brand-primary">
                                                  {tournament.classificados_por_grupo || tournament.playoffQualifiedCount || 4}
                                              </span>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              )}

              {activeTab === 'teams' && (
                  <div className="flex flex-col h-full min-h-[500px]">
                      <div className="flex overflow-x-auto gap-2 p-4 border-b border-brand-border bg-black/20"> {teams.map(t => ( <button key={t.id} onClick={() => setActiveRosterTeamId(t.id)} className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap text-sm flex items-center gap-2 transition-all ${activeRosterTeamId === t.id ? 'bg-brand-primary text-white shadow-lg' : 'bg-brand-surfaceHighlight text-brand-textMuted hover:bg-brand-border'}`}> {t.logoUrl ? <img src={t.logoUrl} className="w-4 h-4 rounded-full"/> : <Shield size={12}/>} {t.name} </button> ))} </div>
                      <div className="p-4 bg-brand-surfaceHighlight border-b border-brand-border">
                                                                {isOrganizer && (
                                          <div className="mb-4">
                                              <button 
                                                  onClick={() => setShowBulkImport(!showBulkImport)} 
                                                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
                                              >
                                                  <ListPlus size={20}/> Importar Lista (Formato: POS Nome)
                                              </button>
                                              {showBulkImport && (
                                                  <div className="mt-2 bg-brand-surface p-4 rounded-lg border border-brand-border animate-in slide-in-from-top-2">
                                                      <textarea 
                                                          value={bulkPlayersText} 
                                                          onChange={e => setBulkPlayersText(e.target.value)} 
                                                          className="w-full bg-black border border-brand-border rounded p-2 text-white h-32 text-sm font-mono mb-2" 
                                                          placeholder="Exemplo (Formato: POS-Nome):&#10;GK-Carlos&#10;ZAG-João&#10;MEI-Lucas"
                                                      />
                                                      {bulkPreviewPlayers.length === 0 ? (
                                                          <button 
                                                              onClick={handleBulkAddPlayers} 
                                                              className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-bold w-full"
                                                          >
                                                              Processar Lista
                                                          </button>
                                                      ) : (
                                                          <div className="flex gap-2">
                                                              <button 
                                                                  onClick={handleConfirmBulkAdd} 
                                                                  className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold w-full"
                                                              >
                                                                  Confirmar {bulkPreviewPlayers.length} Jogadores
                                                              </button>
                                                              <button 
                                                                  onClick={() => setBulkPreviewPlayers([])}
                                                                  className="bg-slate-700 text-white px-4 py-2 rounded text-sm font-bold"
                                                              >
                                                                  Limpar
                                                              </button>
                                                          </div>
                                                      )}
                                                  </div>
                                              )}
                                          </div>
                                      )}
                          <div className="flex flex-col md:flex-row gap-2"> <div className="flex-1 relative"> <input value={rosterSearch} onChange={e => setRosterSearch(e.target.value)} placeholder="🔍 Buscar Jogador..." className="w-full bg-brand-surface border border-brand-border rounded-lg pl-3 pr-10 py-2 text-brand-text focus:border-brand-primary outline-none text-sm"/> <div className="absolute right-2 top-2 text-brand-textMuted"><Search size={16}/></div> </div> {isOrganizer && ( <> <div className="w-full md:w-48 flex gap-1"> <input value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder="Nome Novo Jogador" className="w-full bg-brand-surface border border-brand-border rounded-lg px-2 py-2 text-brand-text text-sm focus:border-green-500 outline-none"/> </div> <div className="w-full md:w-40"> <select value={newPlayerPos} onChange={e => { setNewPlayerPos(e.target.value); setRosterPosFilter(e.target.value); }} className="w-full bg-brand-surface border border-brand-border rounded-lg p-2 text-brand-text focus:border-brand-primary outline-none font-bold text-sm"> 
                                  <optgroup label="EA FC 26">
                                      {POSITIONS_VIRTUAL.map(p => <option key={`v-${p}`} value={p}>{p}</option>)}
                                  </optgroup>
                                  <optgroup label="Futebol Real">
                                      {POSITIONS_REAL.map(p => <option key={`r-${p}`} value={p}>{p}</option>)}
                                  </optgroup>
                              </select> </div> <button onClick={handleAddPlayer} className="bg-green-600 hover:bg-green-500 text-white px-4 rounded-lg flex items-center justify-center shadow-lg font-bold text-sm"><Plus size={16}/> Adicionar</button> </> )} </div>
                      </div>
                      <div className="flex-1 bg-brand-surfaceHighlight p-4 overflow-y-auto">
                          <div className="flex justify-between text-[10px] text-brand-textMuted font-bold uppercase mb-2 px-2"><span>Posição / Nome</span><span>Nota / Ações</span></div>
                          <div className="space-y-2"> {rosterPlayers.map(p => ( <div key={p.id} className="flex items-center justify-between bg-brand-surface hover:bg-brand-surfaceHighlight p-2 rounded-lg border border-brand-border transition-colors group"> <div className="flex items-center gap-3"> 
                              <div className="relative w-8 h-7 flex items-center justify-center bg-brand-surfaceHighlight rounded font-bold text-xs text-brand-textMuted border border-brand-border group-hover:border-brand-primary transition-colors cursor-pointer overflow-hidden">
                                  {p.position}
                                  {isOrganizer && onUpdatePlayer && (
                                      <select 
                                          className="absolute inset-0 opacity-0 cursor-pointer text-xs" 
                                          value={p.position} 
                                          onChange={(e) => onUpdatePlayer(p.id, { position: e.target.value as any })}
                                      >
                                          <optgroup label="EA FC 26">
                                              {POSITIONS_VIRTUAL.map(pos => <option key={`ev-${pos}`} value={pos}>{pos}</option>)}
                                          </optgroup>
                                          <optgroup label="Futebol Real">
                                              {POSITIONS_REAL.map(pos => <option key={`er-${pos}`} value={pos}>{pos}</option>)}
                                          </optgroup>
                                      </select>
                                  )}
                              </div>
                              <div> <p className="text-brand-text font-bold text-sm">{p.name}</p> <p className="text-[10px] text-brand-textMuted font-mono">#{p.id.substring(0,4)}</p> </div> </div> <div className="flex items-center gap-4"> {p.rating !== undefined && ( <div className="flex flex-col items-center"> <span className="text-[9px] text-brand-textMuted uppercase font-bold">OVR</span> <span className={`text-sm font-black ${p.rating >= 8 ? 'text-green-500' : p.rating >= 6 ? 'text-yellow-500' : 'text-red-500'}`}>{p.rating.toFixed(1)}</span> </div> )} <div className="text-xs text-brand-textMuted flex flex-col items-end mr-2"><span className="flex items-center gap-1"><img src="https://cdn-icons-png.flaticon.com/512/33/33736.png" className="w-3 h-3 invert opacity-50"/> {p.goals}</span></div> {isOrganizer && ( <button onClick={() => onRemovePlayer && onRemovePlayer(p.id)} className="text-brand-textMuted hover:text-red-500 p-2 hover:bg-red-500/10 rounded transition-colors"><Trash2 size={16}/></button> )} </div> </div> ))} {rosterPlayers.length === 0 && ( <div className="text-center py-10 text-brand-textMuted"><Users size={32} className="mx-auto mb-2 opacity-50"/><p>Nenhum jogador encontrado neste time.</p></div> )} </div>
                      </div>
                      {isOrganizer && activeRosterTeamId && ( <div className="p-4 border-t border-brand-border bg-black/40 flex justify-between items-center"> <div className="flex items-center gap-3"> <div className="w-10 h-10 bg-black border border-brand-border rounded-lg overflow-hidden flex items-center justify-center"> {teams.find(t=>t.id===activeRosterTeamId)?.logoUrl ? <img src={teams.find(t=>t.id===activeRosterTeamId)?.logoUrl} className="w-full h-full object-cover"/> : <Shield className="text-slate-700"/>} </div> <label className="text-xs bg-brand-surface hover:bg-brand-surfaceHighlight text-brand-text px-3 py-2 rounded cursor-pointer flex items-center gap-2 border border-brand-border"> <Upload size={12}/> Alterar Logo do Time <input type="file" hidden accept="image/*" onChange={handleTeamLogoUpload} /> </label> </div> <div className="text-xs text-brand-textMuted font-bold">TOTAL: {rosterPlayers.length}</div> </div> )}
                  </div>
              )}

              {activeTab === 'brackets' && !isMD3 && !isLeague && (
                  <div className={`p-8 min-h-[600px] overflow-x-auto flex items-center justify-center ${bracketBgClass}`}>
                      {hasKnockoutStarted ? (
                          <div className="flex flex-row items-center justify-center gap-10">
                               {bracketData.hasR16 && <BracketColumn matches={bracketData.r16} title="Oitavas" slotHeightClass="h-32" isFirstColumn={true}/>}
                               {bracketData.hasQuarters && <BracketColumn matches={bracketData.quarters} title="Quartas" slotHeightClass="h-64" isFirstColumn={!bracketData.hasR16}/>}
                               <BracketColumn matches={bracketData.semis} title="Semifinais" slotHeightClass="h-[32rem]" isFirstColumn={!bracketData.hasQuarters && !bracketData.hasR16}/>
                               <div className="flex flex-col">
                                    <div className="text-center text-white/50 text-[10px] font-bold uppercase mb-4 h-4">Final</div>
                                    <div className="h-[64rem] flex items-center justify-center relative">
                                         <div className="relative">
                                             <div className={`absolute left-[-1.25rem] w-5 border-b-2 ${connectorColor} top-1/2`}></div>
                                             <Trophy className="absolute -top-12 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" size={40}/>
                                             <div className="w-48">
                                                {bracketData.finals.map(m => <MatchCard key={m.id} match={m} />)}
                                             </div>
                                         </div>
                                    </div>
                               </div>
                          </div>
                      ) : ( <div className="text-center text-white/50 italic"> O mata-mata ainda não foi gerado. Finalize a fase de grupos. </div> )}
                  </div>
              )}
          </div>

          {showRegistrationModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                  <div className="bg-brand-surface border border-brand-border w-full max-w-sm p-6 rounded-xl shadow-2xl flex flex-col items-center text-center">
                      <div className="bg-brand-primary/20 p-4 rounded-full text-brand-primary mb-4 border border-brand-primary/50"><Hand size={32} /></div>
                      <h3 className="text-xl font-black text-white mb-2">CONFIRMAR INSCRIÇÃO?</h3>
                      <p className="text-brand-textMuted text-sm mb-6">Você está prestes a inscrever o time <b>{playerProfiles.find(p => p.userId === currentUser?.id)?.teamName || 'Seu Time'}</b> neste campeonato.</p>
                      <div className="flex gap-3 w-full"> <button onClick={() => setShowRegistrationModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors">Cancelar</button> <button onClick={() => { if (onRequestRegistration) { onRequestRegistration(tournament); setShowRegistrationModal(false); } }} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2"><Check size={18}/> Confirmar</button> </div>
                  </div>
              </div>
          )}

          {selectedMatch && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                  <div className="bg-brand-surface border border-brand-border p-6 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="text-brand-text font-bold">{isOrganizer ? 'Editar Placar e Detalhes' : 'Detalhes da Partida'}</h3>
                          <button onClick={() => setSelectedMatch(null)} className="text-brand-textMuted hover:text-white"><X size={20}/></button>
                      </div>

                      <div className="flex justify-between items-center mb-6 bg-brand-surfaceHighlight p-4 rounded-lg border border-brand-border">
                          <div className="text-center"> 
                              <span className="block text-xs font-bold text-brand-text mb-1 truncate max-w-[80px]">{teams.find(t=>t.id===selectedMatch.homeTeamId)?.name}</span> 
                              {isOrganizer ? (
                                  <input type="number" value={matchHomeScore} onChange={e=>setMatchHomeScore(parseInt(e.target.value) || 0)} className="w-16 bg-black border border-brand-border rounded p-2 text-center text-white text-xl font-bold" />
                              ) : (
                                  <span className="text-2xl font-black text-white">{selectedMatch.homeScore ?? '-'}</span>
                              )}
                          </div> 
                          <span className="text-brand-textMuted font-bold text-xl">X</span> 
                          <div className="text-center"> 
                              <span className="block text-xs font-bold text-brand-text mb-1 truncate max-w-[80px]">{teams.find(t=>t.id===selectedMatch.awayTeamId)?.name}</span> 
                              {isOrganizer ? (
                                  <input type="number" value={matchAwayScore} onChange={e=>setMatchAwayScore(parseInt(e.target.value) || 0)} className="w-16 bg-black border border-brand-border rounded p-2 text-center text-white text-xl font-bold" />
                              ) : (
                                  <span className="text-2xl font-black text-white">{selectedMatch.awayScore ?? '-'}</span>
                              )}
                          </div>
                      </div>

                      {/* Gols e Assistências - Mandante */}
                      {(isOrganizer ? matchHomeScore > 0 : (selectedMatch.homeScore || 0) > 0) && (
                          <div className="mb-4">
                              <label className="block text-[10px] font-black text-brand-textMuted uppercase tracking-widest mb-2">Gols {teams.find(t=>t.id===selectedMatch.homeTeamId)?.name}</label>
                              {isOrganizer ? (
                                  homeGoalDetails.map((g, idx) => (
                                      <div key={`home-goal-${idx}`} className="grid grid-cols-2 gap-2 mb-2">
                                          <select 
                                              value={g.scorer} 
                                              onChange={e => setHomeGoalDetails(prev => prev.map((item, i) => i === idx ? { ...item, scorer: e.target.value } : item))}
                                              className="bg-black border border-brand-border rounded p-2 text-xs text-white outline-none focus:border-brand-primary"
                                          >
                                              <option value="">Autor do Gol</option>
                                              {matchPlayers.home.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                          </select>
                                          <select 
                                              value={g.assist} 
                                              onChange={e => setHomeGoalDetails(prev => prev.map((item, i) => i === idx ? { ...item, assist: e.target.value } : item))}
                                              className="bg-black border border-brand-border rounded p-2 text-xs text-white outline-none focus:border-brand-primary"
                                          >
                                              <option value="">Assistência</option>
                                              {matchPlayers.home.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                          </select>
                                      </div>
                                  ))
                              ) : (
                                  <div className="space-y-1">
                                      {selectedMatch.events.filter(e => e.type === 'GOAL' && players.find(p => p.id === e.playerId)?.teamId === selectedMatch.homeTeamId).map((e, idx) => {
                                          const scorer = players.find(p => p.id === e.playerId);
                                          const assistEvent = selectedMatch.events.find(ae => ae.type === 'ASSIST' && ae.playerId !== e.playerId && Math.abs(ae.timestamp - e.timestamp) < 100); // Simple heuristic
                                          const assistant = assistEvent ? players.find(p => p.id === assistEvent.playerId) : null;
                                          return (
                                              <div key={idx} className="text-xs text-brand-text flex items-center gap-2">
                                                  <Zap size={10} className="text-yellow-500" />
                                                  <span className="font-bold">{scorer?.name}</span>
                                                  {assistant && <span className="text-brand-textMuted text-[10px]">(Ass: {assistant.name})</span>}
                                              </div>
                                          );
                                      })}
                                  </div>
                              )}
                          </div>
                      )}

                      {/* Gols e Assistências - Visitante */}
                      {(isOrganizer ? matchAwayScore > 0 : (selectedMatch.awayScore || 0) > 0) && (
                          <div className="mb-4">
                              <label className="block text-[10px] font-black text-brand-textMuted uppercase tracking-widest mb-2">Gols {teams.find(t=>t.id===selectedMatch.awayTeamId)?.name}</label>
                              {isOrganizer ? (
                                  awayGoalDetails.map((g, idx) => (
                                      <div key={`away-goal-${idx}`} className="grid grid-cols-2 gap-2 mb-2">
                                          <select 
                                              value={g.scorer} 
                                              onChange={e => setAwayGoalDetails(prev => prev.map((item, i) => i === idx ? { ...item, scorer: e.target.value } : item))}
                                              className="bg-black border border-brand-border rounded p-2 text-xs text-white outline-none focus:border-brand-primary"
                                          >
                                              <option value="">Autor do Gol</option>
                                              {matchPlayers.away.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                          </select>
                                          <select 
                                              value={g.assist} 
                                              onChange={e => setAwayGoalDetails(prev => prev.map((item, i) => i === idx ? { ...item, assist: e.target.value } : item))}
                                              className="bg-black border border-brand-border rounded p-2 text-xs text-white outline-none focus:border-brand-primary"
                                          >
                                              <option value="">Assistência</option>
                                              {matchPlayers.away.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                          </select>
                                      </div>
                                  ))
                              ) : (
                                  <div className="space-y-1">
                                      {selectedMatch.events.filter(e => e.type === 'GOAL' && players.find(p => p.id === e.playerId)?.teamId === selectedMatch.awayTeamId).map((e, idx) => {
                                          const scorer = players.find(p => p.id === e.playerId);
                                          const assistEvent = selectedMatch.events.find(ae => ae.type === 'ASSIST' && ae.playerId !== e.playerId && Math.abs(ae.timestamp - e.timestamp) < 100);
                                          const assistant = assistEvent ? players.find(p => p.id === assistEvent.playerId) : null;
                                          return (
                                              <div key={idx} className="text-xs text-brand-text flex items-center gap-2">
                                                  <Zap size={10} className="text-yellow-500" />
                                                  <span className="font-bold">{scorer?.name}</span>
                                                  {assistant && <span className="text-brand-textMuted text-[10px]">(Ass: {assistant.name})</span>}
                                              </div>
                                          );
                                      })}
                                  </div>
                              )}
                          </div>
                      )}

                      {(isOrganizer || isGoldenGoal || isDecidedByPenalties) && (
                          <div className="grid grid-cols-2 gap-4 mb-6">
                              <label className={`flex items-center gap-2 cursor-pointer bg-brand-surfaceHighlight p-3 rounded-lg border border-brand-border transition-colors ${isOrganizer ? 'hover:border-brand-primary' : ''}`}>
                                  <input type="checkbox" checked={isGoldenGoal} disabled={!isOrganizer} onChange={e => setIsGoldenGoal(e.target.checked)} className="w-4 h-4 accent-brand-primary" />
                                  <span className="text-[10px] text-brand-text font-black uppercase tracking-widest">Gol de Ouro</span>
                              </label>
                              <label className={`flex items-center gap-2 cursor-pointer bg-brand-surfaceHighlight p-3 rounded-lg border border-brand-border transition-colors ${isOrganizer ? 'hover:border-brand-primary' : ''}`}>
                                  <input type="checkbox" checked={isDecidedByPenalties} disabled={!isOrganizer} onChange={e => setIsDecidedByPenalties(e.target.checked)} className="w-4 h-4 accent-brand-primary" />
                                  <span className="text-[10px] text-brand-text font-black uppercase tracking-widest">Pênaltis</span>
                              </label>
                          </div>
                      )}

                      {isDecidedByPenalties && (
                          <div className="mb-6 p-4 bg-brand-surfaceHighlight rounded-lg border border-brand-border animate-in slide-in-from-top-2">
                              <label className="block text-[10px] font-black text-brand-textMuted uppercase tracking-widest mb-3 text-center">Placar dos Pênaltis</label>
                              <div className="flex justify-center items-center gap-4">
                                  {isOrganizer ? (
                                      <>
                                          <input type="number" value={homePenaltyScore || 0} onChange={e => setHomePenaltyScore(parseInt(e.target.value) || 0)} className="w-16 bg-black border border-brand-border rounded p-2 text-center text-white font-bold" placeholder="0" />
                                          <span className="text-brand-textMuted font-bold">X</span>
                                          <input type="number" value={awayPenaltyScore || 0} onChange={e => setAwayPenaltyScore(parseInt(e.target.value) || 0)} className="w-16 bg-black border border-brand-border rounded p-2 text-center text-white font-bold" placeholder="0" />
                                      </>
                                  ) : (
                                      <span className="text-xl font-black text-white">{homePenaltyScore} X {awayPenaltyScore}</span>
                                  )}
                              </div>
                          </div>
                      )}

                      {(isOrganizer || matchMvpId) && (
                          <div className="mb-6"> 
                              <label className="block text-xs text-brand-textMuted uppercase font-bold mb-2 flex items-center gap-1"><Award size={14} className="text-purple-400"/> MVP da Partida</label> 
                              {isOrganizer ? (
                                  <select value={matchMvpId} onChange={(e) => setMatchMvpId(e.target.value)} className="w-full bg-brand-surfaceHighlight border border-brand-border rounded p-2 text-brand-text text-sm outline-none focus:border-purple-500"> 
                                      <option value="">-- Selecione o MVP --</option> 
                                      {matchPlayers.all.map(p => <option key={p.id} value={p.id}>{p.name} ({teams.find(t=>t.id===p.teamId)?.name})</option>)} 
                                  </select> 
                              ) : (
                                  <div className="bg-brand-surfaceHighlight p-3 rounded border border-brand-border flex items-center gap-3">
                                      <div className="p-2 bg-purple-500/20 rounded-full text-purple-400"><Award size={18}/></div>
                                      <div>
                                          <p className="text-sm font-bold text-brand-text">{players.find(p => p.id === matchMvpId)?.name}</p>
                                          <p className="text-[10px] text-brand-textMuted uppercase font-bold">{teams.find(t => t.id === players.find(p => p.id === matchMvpId)?.teamId)?.name}</p>
                                      </div>
                                  </div>
                              )}
                          </div>
                      )}

                      {/* NOTAS DOS JOGADORES */}
                      <div className="mb-6">
                          <label className="block text-xs text-brand-textMuted uppercase font-bold mb-3 flex items-center gap-1"><Edit size={14} className="text-brand-primary"/> Notas dos Jogadores</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Home Team Ratings */}
                              <div className="space-y-2">
                                  <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest border-b border-brand-primary/20 pb-1">{teams.find(t=>t.id===selectedMatch.homeTeamId)?.name}</p>
                                  {matchPlayers.home.map(p => (
                                      <div key={`rating-${p.id}`} className="flex items-center justify-between gap-2 bg-black/20 p-1.5 rounded border border-brand-border/30">
                                          <span className="text-[10px] text-brand-text truncate flex-1">{p.name}</span>
                                          {isOrganizer ? (
                                              <input 
                                                  type="number" 
                                                  step="0.1" 
                                                  min="0" 
                                                  max="10" 
                                                  value={playerRatings[p.id] || ''} 
                                                  onChange={e => setPlayerRatings(prev => ({ ...prev, [p.id]: e.target.value }))}
                                                  placeholder="0.0"
                                                  className="w-12 bg-black border border-brand-border rounded px-1 py-0.5 text-center text-xs text-white outline-none focus:border-brand-primary"
                                              />
                                          ) : (
                                              <span className={`text-xs font-bold ${parseFloat(playerRatings[p.id]) >= 8 ? 'text-green-500' : parseFloat(playerRatings[p.id]) >= 6 ? 'text-yellow-500' : 'text-brand-textMuted'}`}>
                                                  {playerRatings[p.id] || '-'}
                                              </span>
                                          )}
                                      </div>
                                  ))}
                              </div>
                              {/* Away Team Ratings */}
                              <div className="space-y-2">
                                  <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest border-b border-brand-primary/20 pb-1">{teams.find(t=>t.id===selectedMatch.awayTeamId)?.name}</p>
                                  {matchPlayers.away.map(p => (
                                      <div key={`rating-${p.id}`} className="flex items-center justify-between gap-2 bg-black/20 p-1.5 rounded border border-brand-border/30">
                                          <span className="text-[10px] text-brand-text truncate flex-1">{p.name}</span>
                                          {isOrganizer ? (
                                              <input 
                                                  type="number" 
                                                  step="0.1" 
                                                  min="0" 
                                                  max="10" 
                                                  value={playerRatings[p.id] || ''} 
                                                  onChange={e => setPlayerRatings(prev => ({ ...prev, [p.id]: e.target.value }))}
                                                  placeholder="0.0"
                                                  className="w-12 bg-black border border-brand-border rounded px-1 py-0.5 text-center text-xs text-white outline-none focus:border-brand-primary"
                                              />
                                          ) : (
                                              <span className={`text-xs font-bold ${parseFloat(playerRatings[p.id]) >= 8 ? 'text-green-500' : parseFloat(playerRatings[p.id]) >= 6 ? 'text-yellow-500' : 'text-brand-textMuted'}`}>
                                                  {playerRatings[p.id] || '-'}
                                              </span>
                                          )}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>

                      {/* PROVA DA PARTIDA (SCREENSHOT) */}
                      <div className="mb-6">
                          <label className="block text-xs text-brand-textMuted uppercase font-bold mb-2 flex items-center gap-1"><Image size={14} className="text-green-400"/> Prova da Partida (Screenshot)</label>
                          {isOrganizer ? (
                              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-brand-border rounded-xl cursor-pointer hover:bg-brand-surfaceHighlight transition-all group relative overflow-hidden">
                                  {matchScreenshotUrl ? (
                                      <>
                                          <img src={matchScreenshotUrl} className="w-full h-full object-cover opacity-50 group-hover:opacity-30" />
                                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                                              <RefreshCw size={24} className="text-white mb-2" />
                                              <span className="text-xs font-bold text-white uppercase">Alterar Print</span>
                                          </div>
                                      </>
                                  ) : (
                                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                          <Upload size={24} className="text-brand-textMuted mb-2 group-hover:text-brand-primary" />
                                          <p className="text-xs text-brand-textMuted font-bold uppercase tracking-widest">Clique para enviar</p>
                                          <p className="text-[10px] text-brand-textMuted mt-1">JPG, PNG ou WEBP</p>
                                      </div>
                                  )}
                                  <input type="file" className="hidden" accept="image/*" onChange={handleScreenshotUpload} />
                              </label>
                          ) : (
                              <div className="w-full rounded-xl overflow-hidden border border-brand-border bg-black/40">
                                  {matchScreenshotUrl ? (
                                      <a href={matchScreenshotUrl} target="_blank" rel="noreferrer" className="block relative group">
                                          <img src={matchScreenshotUrl} className="w-full h-auto object-contain max-h-64" />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                              <Search size={24} className="text-white" />
                                          </div>
                                      </a>
                                  ) : (
                                      <div className="py-10 text-center text-brand-textMuted italic flex flex-col items-center gap-2">
                                          <AlertTriangle size={24} className="opacity-50" />
                                          <p className="text-xs">Nenhum print enviado para esta partida.</p>
                                      </div>
                                  )}
                              </div>
                          )}
                          
                          {isOrganizer && matchScreenshotUrl && (
                              <button 
                                  onClick={handleOCR} 
                                  disabled={isProcessingOCR}
                                  className={`w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
                                      isProcessingOCR 
                                      ? 'bg-brand-surfaceHighlight text-brand-textMuted cursor-not-allowed' 
                                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                  }`}
                              >
                                  {isProcessingOCR ? (
                                      <>
                                          <RefreshCw size={16} className="animate-spin" />
                                          Processando Print...
                                      </>
                                  ) : (
                                      <>
                                          <Sparkles size={16} />
                                          Extrair Estatísticas do Print
                                      </>
                                  )}
                              </button>
                          )}
                      </div>

                      {isOrganizer && (
                          <button onClick={saveMatchDetails} className="w-full bg-brand-primary text-white font-bold py-3 rounded hover:opacity-90">{isKnockout ? 'Finalizar e Avançar Time' : 'Salvar Resultado'}</button>
                      )}
                      <button onClick={()=>setSelectedMatch(null)} className="w-full mt-2 text-brand-textMuted text-sm">Fechar</button>
                  </div>
              </div>
          )}

          {showAwardsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                 <div className="bg-brand-surface border border-brand-border w-full max-w-2xl p-6 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                     <div className="flex justify-between items-center mb-6 border-b border-brand-border pb-4"> <h2 className="text-xl font-bold text-brand-text flex items-center gap-2"><Crown size={24} className="text-yellow-500"/> Distribuição de Prêmios</h2> <button onClick={() => setShowAwardsModal(false)} className="text-brand-textMuted hover:text-white"><X size={24}/></button> </div>
                     <div className="space-y-4 mb-6"> {[ { key: 'mvpId', label: 'MVP da Temporada', icon: Crown, color: 'text-purple-400' }, { key: 'bestStrikerId', label: 'Artilheiro (Chuteira de Ouro)', icon: Trophy, color: 'text-yellow-400' }, { key: 'bestMidfielderId', label: 'Melhor Meio-Campo (Maestro)', icon: Zap, color: 'text-blue-400' }, { key: 'bestDefenderId', label: 'Melhor Defensor (Pitbull)', icon: Shield, color: 'text-red-400' }, { key: 'goldenGloveId', label: 'Luva de Ouro (Goleiro)', icon: Hand, color: 'text-orange-400' } ].map((award) => ( <div key={award.key} className="bg-brand-surfaceHighlight p-4 rounded-lg border border-brand-border"> <label className={`block text-xs uppercase font-bold mb-2 flex items-center gap-2 ${award.color}`}> <award.icon size={14}/> {award.label} </label> <select value={awardSelections[award.key as keyof TournamentAwards] || ''} onChange={(e) => setAwardSelections({ ...awardSelections, [award.key]: e.target.value })} className="w-full bg-black border border-brand-border rounded p-2.5 text-brand-text text-sm outline-none focus:border-brand-primary" > <option value="">-- Selecione o Vencedor --</option> {players.map(p => { const t = teams.find(tm => tm.id === p.teamId); return ( <option key={p.id} value={p.id}>{p.name} - {t?.name} ({p.position})</option> ) })} </select> </div> ))} </div>
                     <div className="flex flex-col md:flex-row gap-3 pt-2"> <button onClick={handleAutoSelectAwards} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2"><Zap size={16}/> Auto-Selecionar (Estatísticas)</button> <button onClick={() => { onDistributeAwards(tournament.id, awardSelections); setShowAwardsModal(false); }} className="flex-1 bg-brand-primary text-white font-bold py-3 rounded flex items-center justify-center gap-2 shadow-lg" > <Award size={16}/> Confirmar Premiação </button> </div>
                 </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default TournamentDetails;