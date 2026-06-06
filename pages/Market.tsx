
import React, { useState, useMemo } from 'react';
import { toast } from '../src/lib/toast';
import { PlayerProfile, User, UserRole, Team, Proposal, TransferHistory, League, MarketStatus } from '../types';
import { Search, Filter, Shield, Users, Trophy, Hand, Clock, Check, X, Send, LayoutDashboard, Lock } from '../components/Icons';
import { POSITIONS, MARKET_KEY } from '../constants';

interface MarketProps {
  playerProfiles: PlayerProfile[];
  users: User[];
  teams: Team[];
  leagues: League[];
  themeColor: string;
  currentUser?: User;
  onSendInvite?: (playerId: string) => void;
  onEnviarProposta?: (jogadorId: string) => void;
  propostas?: Proposal[];
  historicoTransferencias?: TransferHistory[];
  onResponderProposta?: (id: string, acao: 'aceitar' | 'recusar') => void;
  onTransferirManual?: (manualPlayerId: string, fromTeamId: string | null, toTeamId: string) => void;
  onUpdateLeagueMarketStatus?: (leagueId: string, status: MarketStatus) => void;
  onBack?: () => void;
}

const Market: React.FC<MarketProps> = ({ 
  playerProfiles, 
  users, 
  teams, 
  leagues,
  themeColor, 
  currentUser, 
  onSendInvite, 
  onEnviarProposta,
  propostas = [],
  historicoTransferencias = [],
  onResponderProposta,
  onTransferirManual,
  onUpdateLeagueMarketStatus,
  onBack
}) => {
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  
  // Encontrar a liga do usuário atual como sugestão inicial
  useMemo(() => {
    if (selectedLeagueId) return;
    
    if (currentUser) {
        // Se for manager, pegar a liga do time dele
        const managerTeam = teams.find(t => t.managerId === currentUser.id || t.ownerId === currentUser.id);
        if (managerTeam?.ligaId) {
            setSelectedLeagueId(managerTeam.ligaId);
            return;
        }
        
        // Se for jogador, pegar a liga do perfil
        const playerProfile = playerProfiles.find(p => p.userId === currentUser.id);
        if (playerProfile?.ligaId) {
            setSelectedLeagueId(playerProfile.ligaId);
            return;
        }

        // Se for organizador, pegar a primeira liga dele
        if (currentUser.role === UserRole.ORGANIZER) {
            const orgLeague = leagues.find(l => l.organizadorId === currentUser.id);
            if (orgLeague) {
                setSelectedLeagueId(orgLeague.id);
                return;
            }
        }
    }
    
    // Fallback para a primeira liga disponível se nada acima funcionar
    if (leagues.length > 0) setSelectedLeagueId(leagues[0].id);
  }, [currentUser, teams, playerProfiles, leagues]);

  const currentLeague = leagues.find(l => l.id === selectedLeagueId);
  const mercadoStatus = currentLeague?.mercadoStatus || MarketStatus.CLOSED;
  const mercadoAberto = mercadoStatus === MarketStatus.OPEN;
  
  const isManager = currentUser?.role === UserRole.TEAM_MANAGER || currentUser?.role === 'manager' as any;
  const isOrganizer = currentUser?.role === UserRole.ORGANIZER && currentLeague?.organizadorId === currentUser.id;

  const [activeTab, setActiveTab] = useState<'JOGADORES' | 'PROPOSTAS' | 'TRANSFERENCIAS' | 'TIMES'>('JOGADORES');
  const [selectedTeamForRoster, setSelectedTeamForRoster] = useState<string | null>(null);

  const teamRoster = useMemo(() => {
    if (!selectedTeamForRoster) return [];
    const team = teams.find(t => t.id === selectedTeamForRoster);
    if (!team) return [];
    
    // Prioritize the roster directly on the Team object (requested)
    if (team.roster && team.roster.length > 0) {
        return team.roster;
    }
    
    // Fallback to manager profile if Team roster is empty (legacy support)
    const managerProfile = playerProfiles.find(p => p.userId === (team.managerId || team.ownerId));
    return managerProfile?.clubData?.roster || [];
  }, [selectedTeamForRoster, teams, playerProfiles]);

  // Filter States
  const [searchText, setSearchText] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [filterTeam, setFilterTeam] = useState('');

  const platforms = ['PS4', 'PS5', 'XBOX ONE', 'XBOX SERIES', 'PC'];

  const filteredPlayers = useMemo(() => {
      const meuTime = currentUser ? teams.find(t => t.managerId === currentUser.id || t.ownerId === currentUser.id) : null;

      const validPlayerProfiles = playerProfiles.filter((p, index, self) =>
          index === self.findIndex((t) => t.userId === p.userId)
      ).filter(p => {
          const user = users.find(u => u.id === p.userId);
          // Filtrar por liga se selecionada
          const matchLeague = !selectedLeagueId || p.ligaId === selectedLeagueId;
          return user && user.role === UserRole.PLAYER && p.nickname && p.nickname.trim() !== "" && matchLeague;
      });

      return validPlayerProfiles.filter(profile => {
          if (currentUser && profile.userId === currentUser.id) return false;
          const estaNoMeuTime = meuTime && profile.teamId === meuTime.id;
          if (estaNoMeuTime) return false;

          const userName = users.find(u => u.id === profile.userId)?.name || '';
          const matchText = searchText === '' || (
              profile.nickname.toLowerCase().includes(searchText.toLowerCase()) || 
              userName.toLowerCase().includes(searchText.toLowerCase())
          );
          if (!matchText) return false;

          if (filterPlatform && filterPlatform !== 'Todas' && !profile.platforms.includes(filterPlatform)) return false;
          if (filterPosition && filterPosition !== 'Todas' && !profile.positions.includes(filterPosition)) return false;
          if (filterMode && filterMode !== 'Todos' && profile.mode !== 'BOTH' && profile.mode !== filterMode) return false;

          if (filterTeam === 'FREE_AGENT' && profile.teamName) return false;
          if (filterTeam === 'HAS_TEAM' && !profile.teamName) return false;
          
          return true;
      });
  }, [playerProfiles, users, teams, searchText, filterPlatform, filterPosition, filterMode, filterTeam, currentUser]);

  const minhasPropostas = useMemo(() => {
    if (!currentUser) return [];
    return propostas.filter(p => p.origemId === currentUser.id || p.destinoId === currentUser.id);
  }, [propostas, currentUser]);

  const teamsInLeague = useMemo(() => {
    return teams.filter(t => !selectedLeagueId || t.ligaId === selectedLeagueId);
  }, [teams, selectedLeagueId]);

  return (
    <div className="p-8">
        {/* LEAGUE SELECTOR AND MARKET CONTROL */}
        <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border mb-8 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex-1 w-full">
                    <label className="text-[10px] font-black text-brand-textMuted uppercase tracking-widest mb-2 block">Selecionar Campeonato / Liga</label>
                    <select 
                        value={selectedLeagueId} 
                        onChange={e => setSelectedLeagueId(e.target.value)}
                        className="w-full md:max-w-md bg-brand-surfaceHighlight border border-brand-border rounded-xl p-4 text-white font-bold outline-none focus:border-brand-primary appearance-none cursor-pointer"
                    >
                        <option value="">Todas as Ligas</option>
                        {leagues.map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </select>
                </div>

                {selectedLeagueId && currentLeague && (
                    <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
                        {currentLeague.type === 'SIMPLE' ? (
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-brand-textMuted uppercase">Status do Mercado</p>
                                    <p className="text-lg font-black italic uppercase text-brand-textMuted">Desativado</p>
                                </div>
                                <div className="p-3 rounded-xl border bg-brand-surfaceHighlight border-brand-border text-brand-textMuted">
                                    <Lock size={24} />
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-brand-textMuted uppercase">Status do Mercado</p>
                                    <p className={`text-lg font-black italic uppercase ${mercadoAberto ? 'text-green-500' : 'text-red-500'}`}>
                                        {mercadoAberto ? 'Aberto' : 'Fechado'}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-xl border ${mercadoAberto ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                                    <Clock size={24} />
                                </div>
                            </div>
                        )}
                        
                        {isOrganizer && currentLeague.type !== 'SIMPLE' && onUpdateLeagueMarketStatus && (
                            <button 
                                onClick={() => onUpdateLeagueMarketStatus(selectedLeagueId, mercadoAberto ? MarketStatus.CLOSED : MarketStatus.OPEN)}
                                className={`mt-2 px-6 py-2 rounded-lg text-xs font-black uppercase transition-all shadow-lg ${mercadoAberto ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'} text-white active:scale-95`}
                            >
                                {mercadoAberto ? 'Fechar Mercado' : 'Abrir Mercado'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
                {onBack && (
                  <button 
                    onClick={onBack}
                    className="p-3 bg-brand-surfaceHighlight border border-brand-border rounded-xl text-brand-text hover:text-brand-primary transition-all shadow-lg"
                  >
                    <LayoutDashboard size={20} />
                  </button>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-brand-text mb-2 flex items-center gap-2">
                      <Users className="text-brand-primary" /> Mercado da Bola
                    {selectedLeagueId && (
                        <span className="text-sm bg-brand-primary/20 text-brand-primary px-3 py-1 rounded-full font-black uppercase italic">
                            {currentLeague?.name}
                        </span>
                    )}
                </h1>
                <p className="text-brand-textMuted">Negocie jogadores e monte seu elenco dos sonhos.</p>
              </div>
            </div>
            
            <div className="flex bg-brand-surface p-1 rounded-xl border border-brand-border">
                <button 
                  onClick={() => setActiveTab('JOGADORES')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'JOGADORES' ? 'bg-brand-primary text-white' : 'text-brand-textMuted hover:text-brand-text'}`}
                >
                  Jogadores
                </button>
                <button 
                  onClick={() => setActiveTab('TIMES')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'TIMES' ? 'bg-brand-primary text-white' : 'text-brand-textMuted hover:text-brand-text'}`}
                >
                  Times
                </button>
                {currentLeague?.type === 'MARKET' && (
                  <button 
                    onClick={() => setActiveTab('PROPOSTAS')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'PROPOSTAS' ? 'bg-brand-primary text-white' : 'text-brand-textMuted hover:text-brand-text'}`}
                  >
                    Propostas
                  </button>
                )}
                {currentLeague?.type === 'MARKET' && (
                  <button 
                    onClick={() => setActiveTab('TRANSFERENCIAS')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'TRANSFERENCIAS' ? 'bg-brand-primary text-white' : 'text-brand-textMuted hover:text-brand-text'}`}
                  >
                    Transferências
                  </button>
                )}
            </div>
        </div>

        {activeTab === 'JOGADORES' && (
          <div className="animate-in fade-in duration-500">
              {/* Filters Bar */}
              <div className="bg-brand-surface p-4 rounded-xl border border-brand-border mb-8 sticky top-0 z-20 shadow-xl backdrop-blur-md bg-opacity-95">
                  <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 relative">
                          <Search className="absolute left-3 top-3 text-brand-textMuted" size={18} />
                          <input 
                              type="text" 
                              placeholder="Buscar por Nick ou Nome..." 
                              value={searchText}
                              onChange={(e) => setSearchText(e.target.value)}
                              className="w-full bg-brand-surfaceHighlight border border-brand-border rounded-lg pl-10 pr-4 py-2.5 text-brand-text focus:border-brand-primary outline-none"
                          />
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full md:w-auto">
                          <select 
                              value={filterPlatform}
                              onChange={(e) => setFilterPlatform(e.target.value)}
                              className="bg-brand-surfaceHighlight border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:border-brand-primary outline-none"
                          >
                              <option value="Todas">Todas Plataformas</option>
                              {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>

                          <select 
                              value={filterPosition}
                              onChange={(e) => setFilterPosition(e.target.value)}
                              className="bg-brand-surfaceHighlight border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:border-brand-primary outline-none"
                          >
                              <option value="Todas">Todas Posições</option>
                              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>

                          <select 
                              value={filterMode}
                              onChange={(e) => setFilterMode(e.target.value)}
                              className="bg-brand-surfaceHighlight border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:border-brand-primary outline-none"
                          >
                              <option value="Todos">Todos Modos</option>
                              <option value="VIRTUAL">Virtual</option>
                              <option value="REAL">Presencial</option>
                          </select>

                          <select 
                              value={filterTeam}
                              onChange={(e) => setFilterTeam(e.target.value)}
                              className="bg-brand-surfaceHighlight border border-brand-border rounded-lg px-3 py-2 text-brand-text text-sm focus:border-brand-primary outline-none"
                          >
                              <option value="">Todos Status</option>
                              <option value="FREE_AGENT">Sem Contrato</option>
                              <option value="HAS_TEAM">Com Contrato</option>
                          </select>
                      </div>
                  </div>
              </div>

              {/* Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredPlayers.map(player => (
                      <div key={player.userId} className="bg-brand-surface p-4 rounded-xl border border-brand-border hover:border-brand-primary/50 transition-colors group">
                           <div className="flex justify-between items-start mb-2">
                               <h3 className="font-bold text-lg text-brand-text tracking-tight group-hover:text-brand-primary transition-colors">{player.nickname}</h3>
                               <div className="text-[10px] bg-brand-surfaceHighlight px-2 py-1 rounded text-brand-textMuted uppercase font-black">ID: {player.userId.slice(0,5)}</div>
                           </div>
                           <div className="space-y-1 mb-4">
                              <p className="text-xs text-brand-textMuted">POS: <span className="font-bold text-brand-text">{player.positions.join(', ')}</span></p>
                              <p className="text-xs text-brand-textMuted">PLAT: <span className="font-bold text-brand-text">{player.platforms.join(', ')}</span></p>
                              <p className={`text-xs font-bold mt-2 ${player.teamName ? 'text-brand-primary' : 'text-green-500'}`}>
                                  {player.teamName ? `No Time: ${player.teamName}` : 'Agente Livre'}
                              </p>
                           </div>

                           {/* CONTRACT BUTTON */}
                           {isManager && mercadoAberto && currentLeague?.type === 'MARKET' && onEnviarProposta && (
                               <button 
                                  onClick={() => onEnviarProposta(player.userId)}
                                  className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-black py-3 rounded-xl text-xs transition-all shadow-lg shadow-brand-primary/20 active:scale-95 flex items-center justify-center gap-2"
                               >
                                  <Send size={14}/> Enviar Proposta
                               </button>
                           )}
                      </div>
                  ))}
              </div>
              
              {filteredPlayers.length === 0 && (
                  <div className="text-center py-20 border-2 border-dashed border-brand-border rounded-xl bg-brand-surface">
                      <Users size={48} className="mx-auto text-brand-textMuted mb-4" />
                      <h3 className="text-xl font-bold text-brand-text mb-2">Nenhum jogador encontrado</h3>
                      <p className="text-brand-textMuted">Tente ajustar os filtros de busca.</p>
                  </div>
              )}
          </div>
        )}

        {activeTab === 'PROPOSTAS' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 gap-4">
                {minhasPropostas.length === 0 ? (
                  <div className="text-center py-20 bg-brand-surface rounded-xl border border-brand-border">
                    <Hand size={48} className="mx-auto text-brand-textMuted mb-4" />
                    <p className="text-brand-textMuted">Nenhuma proposta enviada ou recebida.</p>
                  </div>
                ) : (
                  minhasPropostas.map(p => {
                    const isIncoming = p.destinoId === currentUser?.id;
                    const sender = users.find(u => u.id === p.origemId);
                    const playerName = users.find(u => u.id === p.jogadorId)?.name;
                    
                    return (
                      <div key={p.id} className="bg-brand-surface p-6 rounded-xl border border-brand-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                         <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-full ${p.status === 'aceita' ? 'bg-green-500/20 text-green-500' : p.status === 'recusada' ? 'bg-red-500/20 text-red-500' : 'bg-brand-primary/20 text-brand-primary'}`}>
                               <Hand size={24} />
                            </div>
                            <div>
                               <h3 className="font-bold text-brand-text">Proposta para {playerName}</h3>
                               <p className="text-sm text-brand-textMuted">
                                 {isIncoming ? `De: ${sender?.name}` : `Destino: ${users.find(u => u.id === p.destinoId)?.name}`}
                               </p>
                               <div className="flex gap-4 mt-1">
                                  <span className="text-xs bg-brand-surfaceHighlight px-2 py-0.5 rounded text-brand-primary font-bold">R$ {p.valor?.toLocaleString()}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${p.status === 'aceita' ? 'text-green-500' : p.status === 'recusada' ? 'text-red-500' : 'text-yellow-500'}`}>
                                     {p.status}
                                  </span>
                               </div>
                            </div>
                         </div>

                         {isIncoming && p.status === 'pendente' && onResponderProposta && (
                            <div className="flex gap-2">
                               <button 
                                 onClick={() => onResponderProposta(p.id, 'aceitar')}
                                 className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                               >
                                 <Check size={16}/> Aceitar
                               </button>
                               <button 
                                 onClick={() => onResponderProposta(p.id, 'recusar')}
                                 className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                               >
                                 <X size={16}/> Recusar
                               </button>
                            </div>
                         )}
                      </div>
                    );
                  })
                )}
             </div>
          </div>
        )}

        {activeTab === 'TIMES' && (
            <div className="animate-in fade-in space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {teamsInLeague.map(team => (
                        <div key={team.id} className="bg-brand-surface p-6 rounded-xl border border-brand-border flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 bg-brand-surfaceHighlight rounded-xl flex items-center justify-center p-2 border border-brand-border shadow-inner">
                                {team.logoUrl ? (
                                    <img src={team.logoUrl} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                ) : (
                                    <Shield size={32} className="text-brand-textMuted" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-brand-text">{team.name}</h3>
                                <p className="text-[10px] text-brand-textMuted uppercase font-black mt-1">
                                    Manager: {users.find(u => u.id === (team.managerId || team.ownerId))?.name || 'Desconhecido'}
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedTeamForRoster(team.id)}
                                className="w-full mt-auto bg-brand-surfaceHighlight hover:bg-brand-border text-brand-text font-bold py-2 rounded-lg text-xs transition-all border border-brand-border flex items-center justify-center gap-2"
                            >
                                <Users size={14}/> Ver Elenco
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'TRANSFERENCIAS' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
             <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-brand-surfaceHighlight text-[10px] text-brand-textMuted uppercase font-black tracking-widest border-b border-brand-border">
                      <tr>
                         <th className="p-4">Data</th>
                         <th className="p-4">Jogador</th>
                         <th className="p-4">Origem</th>
                         <th className="p-4">Destino</th>
                         <th className="p-4">Valor</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-brand-border">
                      {historicoTransferencias.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-20 text-center text-brand-textMuted">
                             Nenhuma transferência registrada.
                          </td>
                        </tr>
                      ) : (
                        historicoTransferencias.map(h => {
                            const player = users.find(u => u.id === h.jogadorId);
                            const fromTeam = h.timeOrigemId ? teams.find(t => t.id === h.timeOrigemId)?.name : 'Agente Livre';
                            const toTeam = teams.find(t => t.id === h.timeDestinoId)?.name;

                            return (
                               <tr key={h.id} className="hover:bg-brand-surfaceHighlight transition-colors">
                                  <td className="p-4 text-xs font-mono text-brand-textMuted">{new Date(h.data).toLocaleDateString()}</td>
                                  <td className="p-4">
                                     <div className="font-bold text-brand-text text-sm">{player?.name}</div>
                                  </td>
                                  <td className="p-4 text-sm text-brand-textMuted">{fromTeam}</td>
                                  <td className="p-4">
                                     <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        <span className="text-sm font-bold text-brand-text">{toTeam}</span>
                                     </div>
                                  </td>
                                  <td className="p-4 text-sm font-mono text-brand-primary font-bold">R$ {h.valor?.toLocaleString()}</td>
                               </tr>
                            );
                        })
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* MODAL ELENCO */}
        {selectedTeamForRoster && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                <div className="bg-brand-surface border border-brand-border w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                    <div className="p-6 border-b border-brand-border flex justify-between items-center bg-brand-surfaceHighlight">
                        <div className="flex items-center gap-3">
                            <Shield className="text-brand-primary" size={24} />
                            <div>
                                <h3 className="font-black text-white uppercase italic text-lg">{teams.find(t => t.id === selectedTeamForRoster)?.name}</h3>
                                <p className="text-[10px] text-brand-textMuted font-bold uppercase tracking-widest">Elenco Completo</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedTeamForRoster(null)} className="text-brand-textMuted hover:text-white transition-colors bg-black/20 p-2 rounded-full"><X size={20}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                        {teamRoster.length === 0 ? (
                            <div className="text-center py-10 opacity-50">Nenhum jogador registrado neste time.</div>
                        ) : (
                            teamRoster.map(p => (
                                <div key={p.id} className="bg-brand-surfaceHighlight border border-brand-border p-4 rounded-2xl flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-black border border-brand-border overflow-hidden flex items-center justify-center">
                                         {p.photoUrl ? <img src={p.photoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Users size={20} className="opacity-20"/>}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-black text-white uppercase italic">{p.name}</p>
                                            {p.tipo === 'sistema' ? (
                                                <span className="text-[8px] bg-brand-primary/20 text-brand-primary px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Sistema</span>
                                            ) : (
                                                <span className="text-[8px] bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Sem conta</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">{p.position}</p>
                                    </div>
                                    {currentUser?.role === UserRole.TEAM_MANAGER && currentLeague?.type === 'MARKET' && (
                                        <button 
                                          onClick={() => {
                                              const myTeam = teams.find(t => String(t.ownerId || t.managerId) === String(currentUser.id));
                                              if (!myTeam) {
                                                  toast.error("Você precisa ter um time ativo.");
                                                  return;
                                              }
                                              if (myTeam.id === selectedTeamForRoster) {
                                                  toast.error("Este jogador já está no seu time.");
                                                  return;
                                              }
                                              
                                              if (p.tipo === 'manual') {
                                                  if (onTransferirManual) onTransferirManual(p.id, selectedTeamForRoster, myTeam.id);
                                              } else {
                                                  // For system players in roster, use their userId
                                                  if (onEnviarProposta && p.userId) onEnviarProposta(p.userId);
                                              }
                                          }}
                                          className="bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white border border-brand-primary/30 rounded-full p-2 transition-all group"
                                          title={p.tipo === 'manual' ? 'Contratar Direto' : 'Enviar Proposta'}
                                        >
                                            {p.tipo === 'manual' ? <Hand size={16} /> : <Send size={16} />}
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Market;
