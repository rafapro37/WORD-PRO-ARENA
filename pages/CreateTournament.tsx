
import React, { useState, useEffect, useMemo } from 'react';
import { toast } from '../src/lib/toast';
import { SportType, PlanType, PlanConfig, TournamentFormat, FinalFormat, PlayerProfile, League, TournamentPhase } from '../types';
import { uploadFile } from '../services/supabase';
import { 
  ChevronLeft, 
  Upload, 
  Image, 
  Check, 
  Settings, 
  Trophy, 
  CreditCard, 
  Hand, 
  Shield, 
  Users, 
  Filter, 
  Zap, 
  LayoutGrid, 
  ListPlus, 
  RefreshCw, 
  BarChart, 
  Info, 
  MessageSquare, 
  List,
  Plus,
  Trash2,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { POSITIONS, AWARD_LABELS, POSITIONS_VIRTUAL, POSITIONS_REAL } from '../constants';
import TournamentVisualFlow from '../components/TournamentVisualFlow';
import { motion, AnimatePresence } from 'motion/react';

interface CreateTournamentProps {
  userPlan: PlanType;
  planLimits: PlanConfig;
  onBack: () => void;
  onSubmit: (data: any) => void;
  existingTeams?: PlayerProfile[]; 
  leagues?: League[];
  initialLigaId?: string;
}

const CreateTournament: React.FC<CreateTournamentProps> = ({ userPlan, planLimits, onBack, onSubmit, existingTeams = [], leagues = [], initialLigaId = '' }) => {
  const [name, setName] = useState('');
  const [ligaId, setLigaId] = useState(initialLigaId);
  const [sport, setSport] = useState<SportType>(SportType.VIRTUAL);
  const [tournamentType, setTournamentType] = useState<'X1' | 'X11'>('X1');
  const [format, setFormat] = useState<TournamentFormat>(TournamentFormat.GROUPS);
  const [theme, setTheme] = useState('DEFAULT');  // mantido por compatibilidade — não exibido
  
  const [groupCount, setGroupCount] = useState(1);
  const [swissRounds, setSwissRounds] = useState(3);
  const [playoffQualifiedCount, setPlayoffQualifiedCount] = useState(4);
  
  // Group Distribution State
  const [distributionMode, setDistributionMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [manualAssignments, setManualAssignments] = useState<Record<string, number>>({});

  const [doubleRoundRobin, setDoubleRoundRobin] = useState(false);
  const [hasBestThird, setHasBestThird] = useState(false);
  const [finalFormat, setFinalFormat] = useState<FinalFormat>(FinalFormat.SINGLE);

  const [classificadosPorGrupo, setClassificadosPorGrupo] = useState(2);
  const [melhorTerceiro, setMelhorTerceiro] = useState(false);
  const [faseGrupo, setFaseGrupo] = useState<'Ida' | 'Ida e Volta'>('Ida');
  const [eyeMata, setEyeMata] = useState<'Somente ida' | 'Ida e volta'>('Somente ida');
  const [endType, setEndType] = useState<'Jogo único' | 'Ida e Volta'>('Jogo único');
  const [golFora, setGolFora] = useState(false);

  const [leagueTurns, setLeagueTurns] = useState<'SINGLE' | 'DOUBLE'>('SINGLE');

  // --- ADVANCED MODE STATE ---
  const [advancedMode, setAdvancedMode] = useState(false);
  const [pointsPerWin, setPointsPerWin] = useState(3);
  const [pointsPerDraw, setPointsPerDraw] = useState(1);
  const [pointsPerLoss, setPointsPerLoss] = useState(0);
  const [hasExtraTime, setHasExtraTime] = useState(false);
  const [hasPenalties, setHasPenalties] = useState(true);
  const [awayGoalRule, setAwayGoalRule] = useState(false);
  const [tieBreakCriteria, setTieBreakCriteria] = useState<string[]>(['SG', 'GP', 'Confronto Direto']);
  const [manualPhases, setManualPhases] = useState<TournamentPhase[]>([]);
  const [rulesText, setRulesText] = useState('');

  const [isPaid, setIsPaid] = useState(false);
  const [entryFee, setEntryFee] = useState('');
  const [paymentInfo, setPaymentInfo] = useState('');

  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerSize, setBannerSize] = useState<'cover' | 'contain' | '100% 100%'>('cover');
  
  const [groupStageBackground, setGroupStageBackground] = useState('');
  const [knockoutBackground, setKnockoutBackground] = useState('');
  const [knockoutOpacity, setKnockoutOpacity] = useState(30); 
  const [trophyIconUrl, setTrophyIconUrl] = useState('');

  const [isCustomBanner, setIsCustomBanner] = useState(false);

  // --- DRAFT PERSISTENCE ---
  useEffect(() => {
    const draft = localStorage.getItem('tournament_creation_draft');
    if (draft) {
      try {
        const d = JSON.parse(draft);
        if (d.name) setName(d.name);
        if (d.ligaId) setLigaId(d.ligaId);
        if (d.sport) setSport(d.sport);
        if (d.tournamentType) setTournamentType(d.tournamentType);
        if (d.format) setFormat(d.format);
        if (d.theme) setTheme(d.theme);
        if (d.groupCount !== undefined) setGroupCount(d.groupCount);
        if (d.swissRounds !== undefined) setSwissRounds(d.swissRounds);
        if (d.playoffQualifiedCount !== undefined) setPlayoffQualifiedCount(d.playoffQualifiedCount);
        if (d.doubleRoundRobin !== undefined) setDoubleRoundRobin(d.doubleRoundRobin);
        if (d.hasBestThird !== undefined) setHasBestThird(d.hasBestThird);
        if (d.finalFormat) setFinalFormat(d.finalFormat);
        if (d.advancedMode !== undefined) setAdvancedMode(d.advancedMode);
        if (d.rulesText) setRulesText(d.rulesText);
        if (d.isPaid !== undefined) setIsPaid(d.isPaid);
        if (d.entryFee) setEntryFee(d.entryFee);
        if (d.paymentInfo) setPaymentInfo(d.paymentInfo);
        if (d.bannerUrl) {
          setBannerUrl(d.bannerUrl);
          setIsCustomBanner(d.isCustomBanner || false);
        }
      } catch (e) {
        console.error("Error parsing tournament draft", e);
      }
    }
  }, []);

  useEffect(() => {
    const draftData = {
      name, ligaId, sport, tournamentType, format, theme,
      groupCount, swissRounds, playoffQualifiedCount,
      doubleRoundRobin, hasBestThird, finalFormat,
      advancedMode, rulesText, isPaid, entryFee, paymentInfo,
      bannerUrl, isCustomBanner
    };
    localStorage.setItem('tournament_creation_draft', JSON.stringify(draftData));
  }, [
    name, ligaId, sport, tournamentType, format, theme,
    groupCount, swissRounds, playoffQualifiedCount,
    doubleRoundRobin, hasBestThird, finalFormat,
    advancedMode, rulesText, isPaid, entryFee, paymentInfo,
    bannerUrl, isCustomBanner
  ]);

  // Banner URL vem do upload manual do organizador

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const publicUrl = await uploadFile('arena-assets', `tournaments/banner_${Date.now()}`, file);
              setBannerUrl(publicUrl);
              setIsCustomBanner(true);
          } catch (err: any) {
              console.error("Upload error:", err);
              toast.error(err.message || 'Erro no upload.');
          }
      }
  };

  const handleGroupBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const publicUrl = await uploadFile('arena-assets', `tournaments/group_bg_${Date.now()}`, file);
              setGroupStageBackground(publicUrl);
          } catch (err: any) {
              toast.error(err.message || 'Erro no upload.');
          }
      }
  };

  const handleKnockoutBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const publicUrl = await uploadFile('arena-assets', `tournaments/ko_bg_${Date.now()}`, file);
              setKnockoutBackground(publicUrl);
          } catch (err: any) {
              toast.error(err.message || 'Erro no upload.');
          }
      }
  };

  const handleTrophyUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const publicUrl = await uploadFile('arena-assets', `tournaments/trophy_${Date.now()}`, file);
              setTrophyIconUrl(publicUrl);
          } catch (err: any) {
              toast.error(err.message || 'Erro no upload.');
          }
      }
  };

  const handleManualAssignment = (teamName: string, groupIdx: number) => {
    setManualAssignments(prev => ({
      ...prev,
      [teamName]: groupIdx
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
        toast.error('Ops! Você esqueceu de dar um nome para o seu campeonato.');
        return;
    }
    
    const isLeagueDouble = format === TournamentFormat.LEAGUE && leagueTurns === 'DOUBLE';

    localStorage.removeItem('tournament_creation_draft');
    onSubmit({
      name,
      ligaId,
      sport,
      tournamentType,
      format,
      theme,
      groupCount: format === TournamentFormat.GROUPS ? groupCount : 1, 
      swissRounds: format === TournamentFormat.SWISS ? swissRounds : undefined,
      distributionMode: 'AUTO',
      playoffQualifiedCount: format === TournamentFormat.PONTOS_CORRIDOS_PLAYOFF ? playoffQualifiedCount : undefined,
      bannerUrl,
      bannerSize,
      groupStageBackground,
      knockoutBackground,
      knockoutOpacity,
      trophyIconUrl,
      teamNames: [],
      selectedExistingTeams: [], 
      doubleRoundRobin: isLeagueDouble || doubleRoundRobin, 
      hasBestThird: format === TournamentFormat.GROUPS ? hasBestThird : false,
      finalFormat,
      classificados_por_grupo: classificadosPorGrupo,
      melhor_terceiro: melhorTerceiro,
      fase_grupo: faseGrupo,
      eye_mata: eyeMata,
      end_type: endType,
      gol_fora: golFora || awayGoalRule,
      isPaid,
      rulesText,
      entryFee: isPaid ? entryFee : '',
      paymentInfo: isPaid ? paymentInfo : '',
      // Advanced
      advancedMode,
      pointsPerWin,
      pointsPerDraw,
      pointsPerLoss,
      hasExtraTime,
      hasPenalties,
      manualPhases: advancedMode ? manualPhases : [],
      tieBreakCriteria
    });
  };

  const addManualPhase = () => {
    const newPhase: TournamentPhase = {
      id: `phase-${Date.now()}`,
      name: manualPhases.length === 0 ? 'Fase de Grupos' : 'Mata-mata',
      type: manualPhases.length === 0 ? 'GROUPS' : 'KNOCKOUT',
      groupCount: 1,
      teamsPerGroup: 4,
      qualifiersCount: 2
    };
    setManualPhases([...manualPhases, newPhase]);
  };

  const removeManualPhase = (id: string) => {
    setManualPhases(manualPhases.filter(p => p.id !== id));
  };

  const updateManualPhase = (id: string, updates: Partial<TournamentPhase>) => {
    setManualPhases(manualPhases.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  return (
    <div className="min-h-screen bg-brand-dark flex">
      <div className="flex-1 p-6 lg:p-12 overflow-y-auto h-screen custom-scrollbar">
        <button onClick={onBack} className="flex items-center text-white/40 hover:text-white mb-8 transition-colors group">
          <ChevronLeft className="mr-2 group-hover:-translate-x-1 transition-transform" /> 
          <span className="text-xs font-black uppercase tracking-widest">Painel Administrativo</span>
        </button>

        <div className="max-w-4xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-brand-primary/10 rounded-lg border border-brand-primary/20">
                  <Trophy size={20} className="text-brand-primary" />
                </div>
                <span className="text-[10px] text-brand-primary font-black uppercase tracking-[0.3em]">Setup de Campeonato</span>
              </div>
              <h1 className="text-5xl font-black italic uppercase text-white tracking-tighter leading-none">Configurar <span className="text-brand-primary">Evento</span></h1>
            </div>

            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
              <button 
                type="button"
                onClick={() => setAdvancedMode(false)}
                className={`px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!advancedMode ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white'}`}
              >
                Padrão
              </button>
              <button 
                type="button"
                onClick={() => setAdvancedMode(true)}
                className={`px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${advancedMode ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/25' : 'text-white/40 hover:text-white'}`}
              >
                <Zap size={12} /> Avançado
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 pb-32">
            {/* O resto do form continua aqui... Vou substituir por partes para não exceder limites */}
        
        {/* Basic Info */}
        <div className="bg-brand-surface p-8 rounded-[32px] border border-brand-border relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-brand-primary/10 transition-colors" />
          
          <h2 className="text-xl font-black italic uppercase tracking-tight text-white mb-6 flex items-center gap-3">
             <Info className="text-brand-primary" size={20} /> Identidade do Torneio
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-brand-textMuted font-black uppercase tracking-widest ml-1 mb-2 block">Nome Oficial</label>
                <input 
                  type="text" 
                  required
                  placeholder="EX: COPA DOS CAMPEÕES 2024"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#1A1E26] border border-brand-border rounded-2xl p-4 text-white font-black italic uppercase focus:border-brand-primary outline-none shadow-inner"
                />
              </div>
              
              <div>
                <label className="text-[10px] text-brand-primary font-black uppercase tracking-widest ml-1 mb-2 block">Vincular Projeto / Liga</label>
                <select 
                  value={ligaId}
                  onChange={e => setLigaId(e.target.value)}
                  className="w-full bg-[#1A1E26] border border-brand-border rounded-2xl p-4 text-white font-black italic uppercase focus:border-brand-primary outline-none appearance-none cursor-pointer"
                >
                  <option value="">LIGA INDEPENDENTE (GLOBAL)</option>
                  {leagues.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-brand-textMuted font-black uppercase tracking-widest ml-1 mb-2 block">Tipo</label>
                    <div className="flex bg-[#1A1E26] p-1 rounded-2xl border border-brand-border">
                       {(['X1', 'X11'] as const).map(t => (
                          <button 
                            key={t}
                            type="button"
                            onClick={() => setTournamentType(t)}
                            className={`flex-1 py-3 text-[10px] font-black italic uppercase rounded-xl transition-all ${tournamentType === t ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25' : 'text-white/40 hover:text-white'}`}
                          >
                             {t}
                          </button>
                       ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-brand-textMuted font-black uppercase tracking-widest ml-1 mb-2 block">Esporte</label>
                    <select 
                      value={sport}
                      onChange={e => setSport(e.target.value as SportType)}
                      className="w-full bg-[#1A1E26] border border-brand-border rounded-2xl p-4 text-white font-black italic uppercase focus:border-brand-primary outline-none appearance-none cursor-pointer"
                    >
                      {Object.values(SportType).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
               </div>

               {!advancedMode ? (
                 <div>
                  <label className="text-[10px] text-brand-textMuted font-black uppercase tracking-widest ml-1 mb-2 block">Modelo de Disputa</label>
                  <select 
                    value={format}
                    onChange={e => setFormat(e.target.value as TournamentFormat)}
                    className="w-full bg-[#1A1E26] border border-brand-primary/20 rounded-2xl p-4 text-white font-black italic uppercase focus:border-brand-primary outline-none shadow-[0_0_20px_rgba(255,90,0,0.05)]"
                  >
                    <option value={TournamentFormat.GROUPS}>⚽ FASE DE GRUPOS + MATA-MATA</option>
                    <option value={TournamentFormat.PONTOS_CORRIDOS}>🏆 LIGA (PONTOS CORRIDOS)</option>
                    <option value={TournamentFormat.PONTOS_CORRIDOS_PLAYOFF}>💥 LIGA COM PLAYOFFS</option>
                    <option value={TournamentFormat.KNOCKOUT}>💀 MATA-MATA DIRETO</option>
                    <option value={TournamentFormat.SWISS}>🌐 SISTEMA SUÍÇO</option>
                    <option value={TournamentFormat.MD3}>⚡ DESAFIO MD3</option>
                  </select>
                 </div>
               ) : (
                 <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-2xl p-4 flex items-center gap-4">
                    <Zap className="text-brand-primary" size={24} />
                    <div>
                       <div className="text-[10px] text-brand-primary font-black uppercase tracking-widest">Configuração Manual</div>
                       <div className="text-[10px] text-white/40 font-bold leading-tight">Combine fases e regras livremente no painel avançado abaixo.</div>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>

        {advancedMode && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-brand-surface p-8 rounded-[32px] border border-brand-border overflow-hidden"
          >
             <h2 className="text-xl font-black italic uppercase tracking-tight text-white mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="text-brand-primary" size={20} /> Estrutura do Campeonato
                </div>
                <button 
                  type="button"
                  onClick={addManualPhase}
                  className="bg-brand-primary text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary/80 transition-transform flex items-center gap-2"
                >
                   <Plus size={14} /> Adicionar Fase
                </button>
             </h2>

             <div className="space-y-4">
                {manualPhases.length === 0 && (
                   <div className="py-12 border-2 border-dashed border-brand-border/40 rounded-2xl text-center">
                      <Zap className="mx-auto text-white/10 mb-4" size={40} />
                      <p className="text-sm font-bold text-white/40 uppercase tracking-widest">Nenhuma fase configurada</p>
                      <button type="button" onClick={addManualPhase} className="mt-4 text-brand-primary text-[10px] font-black uppercase tracking-widest underline underline-offset-4">Clique para iniciar</button>
                   </div>
                )}
                {manualPhases.map((phase, idx) => (
                   <div key={phase.id} className="bg-[#1A1E26] border border-brand-border rounded-2xl p-6 relative group">
                      <button 
                        type="button"
                        onClick={() => removeManualPhase(phase.id)}
                        className="absolute top-4 right-4 text-white/20 hover:text-red-500 transition-colors"
                      >
                         <Trash2 size={16} />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                         <div>
                            <label className="text-[8px] text-brand-textMuted font-black uppercase tracking-widest mb-2 block">Nome da Fase</label>
                            <input 
                               type="text"
                               value={phase.name}
                               onChange={e => updateManualPhase(phase.id, { name: e.target.value })}
                               className="w-full bg-[#20242D] border border-brand-border rounded-xl p-3 text-xs text-white font-black uppercase italic outline-none focus:border-brand-primary"
                            />
                         </div>
                         <div>
                            <label className="text-[8px] text-brand-textMuted font-black uppercase tracking-widest mb-2 block">Formato</label>
                            <select 
                               value={phase.type}
                               onChange={e => updateManualPhase(phase.id, { type: e.target.value as any })}
                               className="w-full bg-[#20242D] border border-brand-border rounded-xl p-3 text-xs text-white font-black uppercase italic outline-none focus:border-brand-primary"
                            >
                               <option value="GROUPS">FASE DE GRUPOS</option>
                               <option value="KNOCKOUT">ELIMINATÓRIA</option>
                               <option value="SWISS">SISTEMA SUÍÇO</option>
                            </select>
                         </div>
                         {phase.type === 'GROUPS' ? (
                            <>
                               <div>
                                  <label className="text-[8px] text-brand-textMuted font-black uppercase tracking-widest mb-2 block">Grupos</label>
                                  <input 
                                     type="number"
                                     value={phase.groupCount}
                                     onChange={e => updateManualPhase(phase.id, { groupCount: parseInt(e.target.value) })}
                                     className="w-full bg-[#20242D] border border-brand-border rounded-xl p-3 text-xs text-white font-black outline-none focus:border-brand-primary"
                                  />
                               </div>
                               <div>
                                  <label className="text-[8px] text-brand-textMuted font-black uppercase tracking-widest mb-2 block">Classif./Grupo</label>
                                  <input 
                                     type="number"
                                     value={phase.qualifiersCount}
                                     onChange={e => updateManualPhase(phase.id, { qualifiersCount: parseInt(e.target.value) })}
                                     className="w-full bg-[#1A1E26] border border-brand-border rounded-xl p-3 text-xs text-white font-black outline-none focus:border-brand-primary"
                                  />
                               </div>
                            </>
                         ) : (
                            <div className="col-span-2">
                               <label className="text-[8px] text-white/30 font-black uppercase tracking-widest mb-2 block">Configuração de Jogos</label>
                               <div className="flex bg-black p-1 rounded-xl border border-white/10">
                                  <button 
                                    type="button" 
                                    onClick={() => updateManualPhase(phase.id, { isDoubleLeg: false })}
                                    className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${!phase.isDoubleLeg ? 'bg-white text-black' : 'text-white/40'}`}
                                  >
                                    Ida Única
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => updateManualPhase(phase.id, { isDoubleLeg: true })}
                                    className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${phase.isDoubleLeg ? 'bg-white text-black' : 'text-white/40'}`}
                                  >
                                    Ida e Volta
                                  </button>
                               </div>
                            </div>
                         )}
                      </div>
                      
                      <div className="mt-4 flex items-center justify-center">
                         <div className="h-4 w-px bg-white/10" />
                      </div>
                   </div>
                ))}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-12 border-t border-white/5">
                <div className="space-y-4">
                   <h4 className="text-[10px] text-brand-primary font-black uppercase tracking-[0.2em] mb-4">Pontuação</h4>
                   <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-[8px] text-white/30 font-black uppercase mb-1 block">Vitória</label>
                        <input type="number" value={pointsPerWin} onChange={e => setPointsPerWin(parseInt(e.target.value))} className="w-full bg-black border border-white/5 rounded-xl p-3 text-xs text-white font-black" />
                      </div>
                      <div>
                        <label className="text-[8px] text-white/30 font-black uppercase mb-1 block">Empate</label>
                        <input type="number" value={pointsPerDraw} onChange={e => setPointsPerDraw(parseInt(e.target.value))} className="w-full bg-black border border-white/5 rounded-xl p-3 text-xs text-white font-black" />
                      </div>
                      <div>
                        <label className="text-[8px] text-white/30 font-black uppercase mb-1 block">Derrota</label>
                        <input type="number" value={pointsPerLoss} onChange={e => setPointsPerLoss(parseInt(e.target.value))} className="w-full bg-black border border-white/5 rounded-xl p-3 text-xs text-white font-black" />
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] text-brand-primary font-black uppercase tracking-[0.2em] mb-4">Regras de Desempate</h4>
                   <div className="bg-black border border-white/5 rounded-2xl p-4 flex flex-wrap gap-2">
                       {tieBreakCriteria.map(c => (
                         <span key={c} className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1">
                            {c} <X size={10} className="cursor-pointer hover:text-white" onClick={() => setTieBreakCriteria(tieBreakCriteria.filter(x => x !== c))} />
                         </span>
                       ))}
                       <button 
                         type="button" 
                         onClick={() => {
                            const newTag = prompt("Nome do Critério (ex: Saldo, GP, Amarelos)");
                            if (newTag) setTieBreakCriteria([...tieBreakCriteria, newTag]);
                         }}
                         className="text-white/20 hover:text-white text-[9px] font-black uppercase border border-white/5 border-dashed px-2 py-1 rounded-lg"
                       >+ Novo</button>
                   </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] text-brand-primary font-black uppercase tracking-[0.2em] mb-4">Critérios Knockout</h4>
                   <div className="flex flex-col gap-2">
                      {[
                        { label: 'Prorrogação', active: hasExtraTime, set: setHasExtraTime },
                        { label: 'Pênaltis', active: hasPenalties, set: setHasPenalties },
                        { label: 'Gol Fora', active: awayGoalRule, set: setAwayGoalRule }
                      ].map(rule => (
                        <label key={rule.label} className="flex items-center justify-between p-3 bg-[#1A1E26] rounded-xl border border-brand-border cursor-pointer hover:border-brand-primary/30 transition-all">
                           <span className="text-[10px] font-black uppercase italic text-white/60">{rule.label}</span>
                           <input 
                             type="checkbox" 
                             checked={rule.active} 
                             onChange={e => rule.set(e.target.checked)}
                             className="w-4 h-4 rounded accent-brand-primary cursor-pointer"
                           />
                        </label>
                      ))}
                   </div>
                </div>
             </div>

             <div className="mt-12">
                <label className="text-[10px] text-brand-primary font-black uppercase tracking-[0.2em] mb-4 block flex items-center gap-2">
                  <MessageSquare size={14} /> Regras do Campeonato (Texto Livre)
                </label>
                <textarea 
                  value={rulesText}
                  onChange={e => setRulesText(e.target.value)}
                  placeholder="Descreva as regras da federação, fair play, prazos, etc..."
                  className="w-full bg-[#1A1E26] border border-brand-border rounded-2xl p-6 text-sm text-white focus:border-brand-primary outline-none min-h-[160px] leading-relaxed shadow-inner"
                />
             </div>
          </motion.div>
        )}

        {!advancedMode && (
          <div className="bg-brand-surface p-8 rounded-[32px] border border-brand-border">
            <h2 className="text-xl font-black italic uppercase tracking-tight text-white mb-6 flex items-center gap-3">
               <Settings className="text-brand-primary" size={20} /> Detalhes da Competição
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {format === TournamentFormat.GROUPS && (
                  <div>
                    <label className="text-[10px] text-white/30 font-black uppercase tracking-widest ml-1 mb-2 block">Quantidade de Grupos</label>
                    <input 
                      type="number" 
                      min="1"
                      max={planLimits.maxGroups}
                      value={groupCount}
                      onChange={e => setGroupCount(parseInt(e.target.value))}
                      className="w-full bg-[#1A1E26] border border-brand-border rounded-2xl p-4 text-white font-black italic focus:border-brand-primary outline-none"
                    />
                  </div>
                )}

                {format === TournamentFormat.PONTOS_CORRIDOS_PLAYOFF && (
                  <div>
                    <label className="text-[10px] text-white/30 font-black uppercase tracking-widest ml-1 mb-2 block">Classificados p/ Playoff</label>
                    <input
                      type="number"
                      value={playoffQualifiedCount}
                      onChange={e => setPlayoffQualifiedCount(parseInt(e.target.value))}
                      className="w-full bg-[#1A1E26] border border-brand-border rounded-2xl p-4 text-white font-black italic focus:border-brand-primary outline-none"
                      min={2}
                      step={2}
                    />
                  </div>
                )}

                {format === TournamentFormat.SWISS && (
                  <div>
                    <label className="text-[10px] text-white/30 font-black uppercase tracking-widest ml-1 mb-2 block">Rodadas Suíças</label>
                    <input
                      type="number"
                      value={swissRounds}
                      onChange={e => setSwissRounds(parseInt(e.target.value))}
                      className="w-full bg-[#1A1E26] border border-brand-border rounded-2xl p-4 text-white font-black italic focus:border-brand-primary outline-none"
                      min={1}
                    />
                  </div>
                )}
            </div>

            {format === TournamentFormat.GROUPS && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                 <div>
                    <label className="text-[10px] text-white/30 font-black uppercase tracking-widest ml-1 mb-2 block">Classif./Grupo</label>
                    <input type="number" min="1" value={classificadosPorGrupo} onChange={e => setClassificadosPorGrupo(parseInt(e.target.value))} className="w-full bg-[#1A1E26] border border-brand-border rounded-2xl p-4 text-white font-black outline-none focus:border-brand-primary" />
                 </div>
                 <div>
                    <label className="text-[10px] text-white/30 font-black uppercase tracking-widest ml-1 mb-2 block">Rodada de Grupos</label>
                    <select value={faseGrupo} onChange={e => setFaseGrupo(e.target.value as any)} className="w-full bg-[#1A1E26] border border-brand-border rounded-2xl p-4 text-white font-black uppercase italic outline-none focus:border-brand-primary">
                       <option value="Ida">Somente Ida</option>
                       <option value="Ida e Volta">Ida e Volta</option>
                    </select>
                 </div>
                 <div className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-2xl p-4 px-6 mt-6">
                    <input type="checkbox" checked={melhorTerceiro} onChange={e => { setMelhorTerceiro(e.target.checked); setHasBestThird(e.target.checked); }} className="w-5 h-5 rounded accent-brand-primary cursor-pointer" />
                    <span className="text-[10px] font-black uppercase italic text-white/60">Classificar Melhores Terceiros</span>
                 </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
               <div>
                  <label className="text-[10px] text-white/30 font-black uppercase tracking-widest ml-1 mb-2 block">Fase Eliminatória</label>
                  <select value={eyeMata} onChange={e => setEyeMata(e.target.value as any)} className="w-full bg-[#1A1E26] border border-brand-border rounded-2xl p-4 text-white font-black uppercase italic outline-none focus:border-brand-primary">
                     <option value="Somente ida">Jogo Único</option>
                     <option value="Ida e volta">Ida e Volta</option>
                  </select>
               </div>
               <div>
                  <label className="text-[10px] text-white/30 font-black uppercase tracking-widest ml-1 mb-2 block">Grande Final</label>
                  <select value={endType} onChange={e => setEndType(e.target.value as any)} className="w-full bg-[#1A1E26] border border-brand-border rounded-2xl p-4 text-white font-black uppercase italic outline-none focus:border-brand-primary">
                     <option value="Jogo único">Jogo Único (Campo Neutro)</option>
                     <option value="Ida e Volta">Ida e Volta</option>
                  </select>
               </div>
            </div>
          </div>
        )}

        {/* PAYMENT SETTINGS */}
        <div className="bg-brand-surface p-8 rounded-[32px] border border-brand-border">
            <h2 className="text-xl font-black italic uppercase tracking-tight text-white mb-6 flex items-center gap-3">
               <CreditCard className="text-brand-primary" size={20} /> Inscrição e Taxas
            </h2>
            
            <div className="flex gap-4 mb-8 bg-[#1A1E26] p-1 rounded-2xl border border-brand-border">
                <button 
                    type="button"
                    onClick={() => setIsPaid(false)}
                    className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isPaid ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white'}`}
                >
                    Gratuito
                </button>
                <button 
                    type="button"
                    onClick={() => setIsPaid(true)}
                    className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isPaid ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/25' : 'text-white/40 hover:text-white'}`}
                >
                    Inscrição Paga
                </button>
            </div>
            
            {isPaid && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                    <div>
                        <label className="text-[10px] text-brand-textMuted font-black uppercase tracking-widest ml-1 mb-2 block">Valor (R$)</label>
                        <input 
                            type="text" 
                            value={entryFee}
                            onChange={e => setEntryFee(e.target.value)}
                            placeholder="Ex: 50,00"
                            className="w-full bg-[#1A1E26] border border-brand-border rounded-2xl p-4 text-white font-black italic text-xl focus:border-brand-primary outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-brand-textMuted font-black uppercase tracking-widest ml-1 mb-2 block">Dados de Pagamento (PIX)</label>
                        <textarea 
                            value={paymentInfo}
                            onChange={e => setPaymentInfo(e.target.value)}
                            placeholder="Sua chave PIX ou instruções..."
                            className="w-full bg-[#1A1E26] border border-brand-border rounded-2xl p-4 text-white font-black italic focus:border-brand-primary outline-none h-24"
                        />
                    </div>
                </div>
            )}
        </div>

        {/* Visual appearance */}
        <div className="bg-brand-surface p-8 rounded-[32px] border border-brand-border">
           <h2 className="text-xl font-black italic uppercase tracking-tight text-white mb-6 flex items-center gap-3">
              <Image className="text-brand-primary" size={20} /> Identidade Visual
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="text-[10px] text-brand-textMuted font-black uppercase tracking-widest ml-1 mb-2 block">Capa do Campeonato</label>
                <label className="w-full cursor-pointer bg-[#1A1E26] hover:bg-brand-surfaceHighlight text-white/60 border border-brand-border rounded-2xl p-4 flex items-center justify-center gap-2 transition-all group">
                    {isCustomBanner ? <Check size={16} className="text-brand-primary"/> : <Upload size={16} className="group-hover:text-brand-primary"/>}
                    <span className="text-[10px] font-black uppercase tracking-widest">{isCustomBanner ? 'Banner Carregado' : 'Fazer Upload da Capa'}</span>
                    <input type="file" hidden accept="image/*" onChange={handleBannerUpload} />
                </label>
                <p className="text-[10px] text-brand-textMuted mt-2 ml-1">PNG, JPG ou WEBP. Máximo 2MB.</p>
              </div>

              <div className="flex flex-col justify-center">
                <p className="text-[10px] text-brand-textMuted font-black uppercase tracking-widest mb-2">Cor de Destaque</p>
                <p className="text-sm text-brand-textMuted">
                  O campeonato herda automaticamente as cores da federação. Use um banner personalizado para identidade própria.
                </p>
              </div>
           </div>
        </div>

        <button 
          type="submit" 
          className="w-full bg-brand-primary hover:bg-white text-white hover:text-black font-black py-6 rounded-[28px] transition-all shadow-2xl shadow-brand-primary/20 uppercase tracking-[0.3em] italic text-sm transform hover:-translate-y-1 active:scale-[0.98]"
        >
          Validar e Criar Campeonato
        </button>
      </form>
    </div>
  </div>

  {/* LATERAL DRAWER PREVIEW */}
    <div className="hidden xl:block w-[450px] bg-brand-dark border-l border-brand-border relative overflow-hidden">
       <TournamentVisualFlow 
          name={name}
          format={format}
          groupCount={groupCount}
          teamsCount={0}
          classificadosPorGrupo={classificadosPorGrupo}
          playoffQualifiedCount={playoffQualifiedCount}
          manualPhases={manualPhases}
          advancedMode={advancedMode}
       />
    </div>
  </div>
);
};

export default CreateTournament;
