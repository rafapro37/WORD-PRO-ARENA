
import React, { useState } from 'react';
import { toast } from '../src/lib/toast';
import { User, PlanType, PlanConfig, ChangeLogEntry, League, MarketStatus, LeagueInvitation, LeagueMember, LeagueMemberStatus, PlanUpgradeRequest, PlanStatus, ExperienceType } from '../types';
import { Save, User as UserIcon, Shield, CreditCard, AlertTriangle, Check, LayoutDashboard, Clock, Eye, RefreshCw, XCircle, Trophy, Plus, Trash2, Edit, Send, Mail, Users, LinkIcon, ArrowUp, Lock, Gamepad2 } from '../components/Icons';
import ImageAdjuster from '../components/ImageAdjuster';
import { uploadFile } from '../services/supabase';

interface OrganizerSettingsProps {
  user: User;
  planConfig: PlanConfig;
  usage: {
    tournaments: number;
    groups: number;
    teams: number;
  };
  settings: any; // Add settings to props
  systemLogs?: ChangeLogEntry[]; // New prop
  onUpdateUser: (updates: Partial<User>) => void;
  onUpdateSettings: (settings: Partial<any>) => void; // Add handler
  onUpgradePlan?: () => void;
  onUpdateLogStatus?: (id: string, status: 'ACCEPTED' | 'REVERT_NEEDED') => void; // New prop
  leagues?: League[];
  onCreateLeague?: (name: string, entranceType: 'aberta' | 'convite', type: 'SIMPLE' | 'MARKET', experienceType: ExperienceType) => void;
  onUpdateLeague?: (id: string, updates: Partial<League>) => void;
  onDeleteLeague?: (id: string) => void;
  onSendInvitation?: (ligaId: string, jogadorId?: string, email?: string) => void;
  allPlayers?: User[];
  pendingInvitations?: LeagueInvitation[];
  leagueMembers?: LeagueMember[];
  onUpdateLeagueMemberStatus?: (leagueId: string, userId: string, status: LeagueMemberStatus) => void;
  onRequestUpgrade?: (planType: PlanType) => void;
  upgradeRequests?: PlanUpgradeRequest[];
}

const OrganizerSettings: React.FC<OrganizerSettingsProps> = ({ 
    user, planConfig, usage, settings, systemLogs = [], 
    onUpdateUser, onUpdateSettings, onUpgradePlan, onUpdateLogStatus,
    leagues = [], onCreateLeague, onUpdateLeague, onDeleteLeague,
    onSendInvitation, allPlayers = [], pendingInvitations = [],
    leagueMembers = [], onUpdateLeagueMemberStatus,
    onRequestUpgrade, upgradeRequests = []
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'logs' | 'leagues' | 'branding'>('profile');
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email || '');
  const [whatsapp, setWhatsapp] = useState(user.whatsapp || '');
  
  // Organization Branding State
  const [orgName, setOrgName] = useState(user.organization?.nome || user.name);
  const [orgLogo, setOrgLogo] = useState(user.organization?.logo || '');
  const [orgColor, setOrgColor] = useState(user.organization?.corPrimaria || '#FF6A00');

  // Fundo dos cards do painel (do organizador — sobrescreve o global do admin)
  const [cardsBg, setCardsBg] = useState((user as any).cardsBg || '');
  const [cardsBgZoom, setCardsBgZoom] = useState((user as any).cardsBgZoom ?? 100);
  const [cardsBgPosX, setCardsBgPosX] = useState((user as any).cardsBgPosX ?? 50);
  const [cardsBgPosY, setCardsBgPosY] = useState((user as any).cardsBgPosY ?? 50);
  const saveCardsBg = (next: { cardsBg?: string; cardsBgZoom?: number; cardsBgPosX?: number; cardsBgPosY?: number }) => {
    onUpdateUser({ cardsBg, cardsBgZoom, cardsBgPosX, cardsBgPosY, ...next } as any);
  };
  
  const [isSaved, setIsSaved] = useState(false);

  // League Form State
  const [newLeagueName, setNewLeagueName] = useState('');
  const [newLeagueEntrance, setNewLeagueEntrance] = useState<'aberta' | 'convite'>('aberta');
  const [newLeagueType, setNewLeagueType] = useState<'SIMPLE' | 'MARKET'>('SIMPLE');
  const [newLeagueExperience, setNewLeagueExperience] = useState<ExperienceType>(ExperienceType.PRO_CLUBS);
  const [editingLeagueId, setEditingLeagueId] = useState<string | null>(null);
  const [editLeagueName, setEditLeagueName] = useState('');

  // Invitation State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedLigaForInvite, setSelectedLigaForInvite] = useState<League | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      name,
      email,
      whatsapp,
      organization: {
          nome: orgName,
          logo: orgLogo,
          corPrimaria: orgColor
      }
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const getUsageColor = (current: number, max: number) => {
    if (max === 999) return 'text-green-500';
    const percentage = current / max;
    if (percentage >= 1) return 'text-red-500';
    if (percentage >= 0.8) return 'text-yellow-500';
    return 'text-blue-500';
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleString();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-brand-text mb-2 flex items-center gap-2">
        <Shield className="text-brand-primary" /> Configurações do Organizador
      </h1>
      <p className="text-brand-textMuted mb-8">Gerencie seus dados, plano e audite o sistema.</p>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-brand-border">
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'profile' ? 'border-brand-primary text-brand-text' : 'border-transparent text-brand-textMuted hover:text-brand-text'}`}
          >
              Perfil e Plano
          </button>
          <button 
            onClick={() => setActiveTab('logs')} 
            className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'logs' ? 'border-brand-primary text-brand-text' : 'border-transparent text-brand-textMuted hover:text-brand-text'}`}
          >
              <Clock size={16}/> Registro de Alterações (Logs)
          </button>
          <button 
            onClick={() => setActiveTab('leagues')} 
            className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'leagues' ? 'border-brand-primary text-brand-text' : 'border-transparent text-brand-textMuted hover:text-brand-text'}`}
          >
              <Trophy size={16}/> Gerenciar Ligas
          </button>
          <button 
            onClick={() => setActiveTab('branding')} 
            className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'branding' ? 'border-brand-primary text-brand-text' : 'border-transparent text-brand-textMuted hover:text-brand-text'}`}
          >
              <LayoutDashboard size={16}/> Identidade Visual
          </button>
      </div>

      {activeTab === 'branding' && (
          <div className="space-y-6 animate-in fade-in">
              <div className="bg-brand-surface p-6 rounded-xl border border-brand-border">
                  <h2 className="text-xl font-bold text-brand-text mb-4 flex items-center gap-2">
                      <LayoutDashboard className="text-brand-primary" /> Identidade Visual da Federação
                  </h2>
                  <p className="text-brand-textMuted text-sm mb-8">Personalize a aparência do portal para seus jogadores e times. As configurações afetam o logo, nome e cor principal.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                          <div>
                              <label className="block text-xs text-brand-textMuted uppercase font-bold mb-2">Nome Comercial do Sistema</label>
                              <input 
                                  value={orgName}
                                  onChange={e => setOrgName(e.target.value)}
                                  placeholder="Ex: LIGA PRO BRASIL"
                                  className="w-full bg-brand-surfaceHighlight border border-brand-border rounded-lg p-3 text-white outline-none focus:border-brand-primary"
                              />
                              <p className="text-[10px] text-slate-500 mt-1 italic italic">Título que aparecerá na barra do navegador e menus.</p>
                          </div>

                          <div>
                              <label className="block text-xs text-brand-textMuted uppercase font-bold mb-2">Sua Logo Própria (URL ou Base64)</label>
                              <div className="flex gap-4">
                                  <div className="w-20 h-20 bg-black rounded-xl border border-brand-border flex items-center justify-center overflow-hidden shrink-0">
                                      {orgLogo ? <img src={orgLogo} className="w-full h-full object-contain" alt="Logo Preview" /> : <Shield size={32} className="text-slate-800" />}
                                  </div>
                                  <div className="flex-1 space-y-2">
                                      <input 
                                          value={orgLogo}
                                          onChange={e => setOrgLogo(e.target.value)}
                                          placeholder="https://sua-url-logo.com/logo.png"
                                          className="w-full bg-brand-surfaceHighlight border border-brand-border rounded-lg p-2 text-white text-xs outline-none focus:border-brand-primary"
                                      />
                                      <label className="inline-flex items-center gap-2 bg-brand-border hover:bg-slate-700 px-4 py-2 rounded text-[10px] font-bold text-white cursor-pointer transition-colors">
                                          <Plus size={14}/> Carregar do PC
                                          <input 
                                              type="file" 
                                              hidden 
                                              accept="image/*" 
                                              onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
                                                      const reader = new FileReader();
                                                      reader.onloadend = () => setOrgLogo(reader.result as string);
                                                      reader.readAsDataURL(file);
                                                  }
                                              }} 
                                          />
                                      </label>
                                  </div>
                              </div>
                          </div>

                          <div>
                              <label className="block text-xs text-brand-textMuted uppercase font-bold mb-2">Cor Primária do Sistema</label>
                              <div className="flex items-center gap-4">
                                  <input 
                                      type="color" 
                                      value={orgColor}
                                      onChange={e => setOrgColor(e.target.value)}
                                      className="w-16 h-10 bg-transparent border-none cursor-pointer"
                                  />
                                  <input 
                                      value={orgColor}
                                      onChange={e => setOrgColor(e.target.value)}
                                      className="flex-1 bg-brand-surfaceHighlight border border-brand-border rounded-lg p-3 text-white font-mono text-sm uppercase"
                                  />
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1 italic italic">Essa cor será aplicada a botões, ícones e destaques do sistema.</p>
                          </div>

                          <div className="pt-4">
                              <button 
                                  onClick={handleSave}
                                  className="w-full bg-brand-primary hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                              >
                                  <Save size={18} /> Salvar Identidade Visual
                              </button>
                              {isSaved && <p className="text-center text-green-500 text-xs font-bold mt-2 animate-in fade-in">Configurações de branding salvas com sucesso!</p>}
                          </div>
                      </div>

                      <div className="bg-black/30 rounded-2xl border border-brand-border p-6 flex flex-col items-center justify-center">
                          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Pré-visualização do Sidebar</h3>
                          <div className="w-56 h-[400px] bg-black border border-slate-800 rounded-xl overflow-hidden relative shadow-2xl">
                              <div className="p-4 border-b border-slate-800 flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden" style={{ backgroundColor: orgColor }}>
                                      {orgLogo ? <img src={orgLogo} className="w-full h-full object-contain" /> : <Shield size={16} className="text-white" />}
                                  </div>
                                  <span className="font-black text-sm italic truncate" style={{ color: 'white', textShadow: `1px 1px 0 ${orgColor}` }}>{orgName}</span>
                              </div>
                              <div className="p-4 space-y-3">
                                  <div className="h-2 w-3/4 bg-slate-800 rounded"></div>
                                  <div className="h-2 w-1/2 bg-slate-800 rounded"></div>
                                  <div className="h-2 w-full bg-slate-800 rounded"></div>
                                  <div className="h-8 w-full rounded flex items-center px-2 gap-2 border-l-4" style={{ borderColor: orgColor, backgroundColor: '#1A1A1A' }}>
                                      <div className="w-4 h-4 rounded-full bg-slate-700"></div>
                                      <div className="h-2 w-1/2 bg-slate-500 rounded"></div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* FUNDO DOS CARDS DO PAINEL (definido pelo organizador) */}
              <div className="bg-brand-surface p-6 rounded-xl border border-brand-border">
                  <h2 className="text-xl font-bold text-brand-text mb-2 flex items-center gap-2">
                      <LayoutDashboard className="text-brand-primary" /> Fundo dos Cards do Painel
                  </h2>
                  <p className="text-brand-textMuted text-sm mb-6">Imagem atrás dos cards de métricas (Campeonatos, Times, Partidas...) no seu painel. Se você não definir, vale o fundo padrão do sistema.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      <div className="space-y-3">
                          <div className="w-full h-28 rounded-xl border border-brand-border overflow-hidden bg-black flex items-center justify-center">
                              {cardsBg ? <img src={cardsBg} className="w-full h-full object-cover" alt="" /> : <span className="text-slate-600 text-xs">Sem fundo definido</span>}
                          </div>
                          <div className="flex items-center gap-3">
                              <label className="inline-flex items-center gap-2 bg-brand-border hover:bg-slate-700 px-4 py-2 rounded text-[11px] font-bold text-white cursor-pointer transition-colors uppercase tracking-widest">
                                  <Plus size={14}/> Carregar imagem
                                  <input type="file" hidden accept="image/*" onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      if (file.size > 2 * 1024 * 1024) { toast.error('Imagem muito grande (máx 2MB).'); return; }
                                      try {
                                          const url = await uploadFile('arena-assets', `org-cards/${user.id}_${Date.now()}`, file);
                                          setCardsBg(url);
                                          saveCardsBg({ cardsBg: url });
                                          toast.success('Fundo atualizado!');
                                      } catch { toast.error('Falha ao enviar a imagem.'); }
                                  }} />
                              </label>
                              {cardsBg && (
                                  <button onClick={() => { setCardsBg(''); saveCardsBg({ cardsBg: '' }); }}
                                      className="text-[11px] text-red-400 hover:text-red-300 font-bold uppercase">Remover</button>
                              )}
                          </div>
                          <p className="text-[10px] text-slate-500 italic">PNG/JPG/WEBP, até 2MB. Imagem larga fica melhor.</p>
                      </div>
                      {cardsBg && (
                          <ImageAdjuster
                              image={cardsBg}
                              zoom={cardsBgZoom}
                              posX={cardsBgPosX}
                              posY={cardsBgPosY}
                              bgGradient="linear-gradient(135deg, #1a1c22, #0a0b0f)"
                              accentColor={orgColor}
                              label="Ajustar fundo"
                              aspectRatio="1600 / 400"
                              previewWidthClass="w-full"
                              hideDecor
                              onChange={vals => {
                                  if (vals.zoom !== undefined) setCardsBgZoom(vals.zoom);
                                  if (vals.posX !== undefined) setCardsBgPosX(vals.posX);
                                  if (vals.posY !== undefined) setCardsBgPosY(vals.posY);
                              }}
                          />
                      )}
                  </div>
                  {cardsBg && (
                      <button onClick={() => { saveCardsBg({}); toast.success('Enquadramento salvo!'); }}
                          className="mt-5 bg-brand-primary hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg flex items-center gap-2 transition-all">
                          <Save size={16}/> Salvar enquadramento
                      </button>
                  )}
              </div>
          </div>
      )}

      {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
            
            {/* Profile Settings */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
                 <h2 className="text-xl font-bold text-brand-text mb-6 flex items-center gap-2">
                    <UserIcon /> Dados Pessoais
                 </h2>
                 <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-brand-textMuted uppercase font-bold mb-1">Nome da Organização</label>
                            <input 
                              type="text" 
                              value={name}
                              onChange={e => setName(e.target.value)}
                              className="w-full bg-brand-surfaceHighlight border border-brand-border rounded-lg p-3 text-brand-text focus:border-brand-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-brand-textMuted uppercase font-bold mb-1">WhatsApp de Contato</label>
                            <input 
                              type="text" 
                              value={whatsapp}
                              onChange={e => setWhatsapp(e.target.value)}
                              className="w-full bg-brand-surfaceHighlight border border-brand-border rounded-lg p-3 text-brand-text focus:border-brand-primary outline-none"
                              placeholder="(00) 00000-0000"
                            />
                        </div>
                    </div>
                    
                    <div className="p-4 bg-brand-surfaceHighlight rounded-lg border border-brand-border">
                        <label className="block text-xs text-brand-textMuted uppercase font-bold mb-2">Tamanho da Fonte Global</label>
                        <input 
                            type="range" 
                            min="10" 
                            max="24" 
                            value={settings.globalFontSize || 16} 
                            onChange={e => onUpdateSettings({ globalFontSize: parseInt(e.target.value) })} 
                            className="w-full accent-brand-primary"
                        />
                        <span className="text-white text-xs mt-1 block">{settings.globalFontSize || 16}px</span>
                    </div>

                    <div>
                        <label className="block text-xs text-brand-textMuted uppercase font-bold mb-1">E-mail de Recuperação</label>
                        <input 
                          type="email" 
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full bg-brand-surfaceHighlight border border-brand-border rounded-lg p-3 text-brand-text focus:border-brand-primary outline-none"
                        />
                    </div>

                    <div className="pt-4 flex items-center gap-4">
                        <button 
                          type="submit" 
                          className="bg-brand-primary hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg flex items-center gap-2 transition-all"
                        >
                           <Save size={18} /> Salvar Alterações
                        </button>
                        {isSaved && <span className="text-green-500 font-bold text-sm flex items-center gap-1 animate-in fade-in"><Check size={16}/> Salvo com sucesso!</span>}
                    </div>
                 </form>
              </div>

              <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
                 <h2 className="text-xl font-bold text-brand-text mb-4 flex items-center gap-2">
                    <LayoutDashboard /> Preferências Globais
                 </h2>
                 <p className="text-brand-textMuted text-sm">
                     Configurações de aparência padrão para novos campeonatos serão adicionadas aqui em breve.
                 </p>
              </div>
            </div>

            {/* Plan & Usage */}
            <div className="space-y-6">
                 {/* Plan Card */}
                 <div className="bg-gradient-to-br from-brand-surfaceHighlight to-brand-surface rounded-xl border border-brand-border p-6 relative overflow-hidden group">
                     {/* Decorative Elements */}
                     <div className="absolute -top-10 -right-10 p-3 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                        <Shield size={160} />
                     </div>
                     
                     <div className="relative z-10">
                         <div className="flex items-center justify-between mb-1">
                            <p className="text-brand-textMuted text-[10px] font-black uppercase tracking-widest">Inscrição Ativa</p>
                            {user.planStatus === PlanStatus.ACTIVE && <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20"><Check size={10}/> Verificado</span>}
                         </div>
                         <h2 className={`text-4xl font-black italic tracking-tighter mb-4 ${user.plan === PlanType.ELITE ? 'text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]' : user.plan === PlanType.PRO ? 'text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'text-brand-text'}`}>
                             {(planConfig.name || '').toUpperCase()}
                         </h2>

                         <div className="space-y-4 mb-8">
                             <div>
                                 <div className="flex justify-between text-[10px] font-black uppercase mb-1 text-brand-textMuted tracking-tight">
                                     <span>Grupos / Ligas</span>
                                     <span className={getUsageColor(usage.groups, planConfig.maxGroups)}>
                                         {usage.groups} / {planConfig.maxGroups === 999 ? 'ILIMITADO' : planConfig.maxGroups}
                                     </span>
                                 </div>
                                 <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                     <div 
                                        className={`h-full transition-all duration-1000 ${getUsageColor(usage.groups, planConfig.maxGroups).replace('text-', 'bg-')}`} 
                                        style={{ width: planConfig.maxGroups === 999 ? '5%' : `${Math.min((usage.groups / planConfig.maxGroups) * 100, 100)}%` }}
                                     ></div>
                                 </div>
                             </div>

                             <div>
                                 <div className="flex justify-between text-[10px] font-black uppercase mb-1 text-brand-textMuted tracking-tight">
                                     <span>Times Gerenciados</span>
                                     <span className={getUsageColor(usage.teams, planConfig.maxTeams)}>
                                         {usage.teams} / {planConfig.maxTeams === 999 ? 'ILIMITADO' : planConfig.maxTeams}
                                     </span>
                                 </div>
                                 <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                     <div 
                                        className={`h-full transition-all duration-1000 ${getUsageColor(usage.teams, planConfig.maxTeams).replace('text-', 'bg-')}`} 
                                        style={{ width: planConfig.maxTeams === 999 ? '5%' : `${Math.min((usage.teams / planConfig.maxTeams) * 100, 100)}%` }}
                                     ></div>
                                 </div>
                             </div>
                         </div>

                         {/* Upgrade Options */}
                         <div className="pt-6 border-t border-brand-border space-y-4">
                            <h3 className="text-xs font-bold text-brand-text uppercase mb-4 flex items-center gap-2"><ArrowUp size={14} className="text-brand-primary"/> Evoluir seu sistema</h3>
                            
                            {user.plan !== PlanType.ELITE && (
                                <div className="space-y-2">
                                    {user.plan === PlanType.FREE && (
                                        <button 
                                            onClick={() => onRequestUpgrade?.(PlanType.PRO)}
                                            disabled={upgradeRequests.some(r => r.status === 'PENDING')}
                                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black py-3 rounded-lg flex items-center justify-between px-4 transition-all uppercase italic shadow-lg shadow-blue-500/20"
                                        >
                                            <span>Upgrade para PRO</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] opacity-70 line-through">R$ --,--</span>
                                                <span>R$ 49,90</span>
                                            </div>
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => onRequestUpgrade?.(PlanType.ELITE)}
                                        disabled={upgradeRequests.some(r => r.status === 'PENDING')}
                                        className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-black py-3 rounded-lg flex items-center justify-between px-4 transition-all uppercase italic shadow-lg shadow-yellow-500/20"
                                    >
                                        <span>Upgrade para ELITE</span>
                                        <span>R$ 99,90</span>
                                    </button>
                                </div>
                            )}

                            {upgradeRequests.length > 0 && (
                                <div className="mt-6 space-y-2">
                                    <p className="text-[10px] text-brand-textMuted uppercase font-bold">Histórico de Solicitações</p>
                                    {upgradeRequests.map(req => (
                                        <div key={req.id} className="bg-black/40 border border-brand-border rounded p-3 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black italic text-brand-text mb-0.5 uppercase">{req.requestedPlan}</p>
                                                <p className="text-[9px] text-brand-textMuted">{new Date(req.timestamp).toLocaleDateString()}</p>
                                            </div>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${req.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' : req.status === 'APPROVED' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                                {req.status === 'PENDING' ? 'PENDENTE' : req.status === 'APPROVED' ? 'APROVADO' : 'RECUSADO'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {user.plan === PlanType.ELITE && (
                                <div className="p-4 bg-yellow-500/5 rounded-xl border border-yellow-500/20 text-center">
                                    <p className="text-yellow-500 text-xs font-bold uppercase">Você é Elite</p>
                                    <p className="text-[10px] text-brand-textMuted italic tracking-tight">Aproveite todos os recursos liberados no sistema.</p>
                                </div>
                            )}
                         </div>
                     </div>
                 </div>

                 <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-xl p-4 flex gap-3 items-start">
                     <AlertTriangle className="text-yellow-500 shrink-0" size={20} />
                     <div>
                         <h4 className="text-yellow-500 font-bold text-sm">Precisa de Ajuda?</h4>
                         <p className="text-yellow-200/70 text-xs mt-1">
                             Para suporte técnico, dúvidas sobre cobrança ou reportar bugs, entre em contato com o administrador.
                         </p>
                     </div>
                 </div>
            </div>

          </div>
      )}

      {activeTab === 'leagues' && (
          <div className="space-y-8 animate-in fade-in">
              <div className="bg-brand-surface p-6 rounded-xl border border-brand-border">
                  <h2 className="text-xl font-bold text-brand-text mb-4 flex items-center gap-2">
                    <Trophy className="text-brand-primary" /> Minhas Ligas / Campeonatos
                  </h2>
                  <p className="text-brand-textMuted text-sm mb-6">Crie ligas independentes para gerenciar mercados e campeonatos separadamente.</p>
                  
                  <div className="flex flex-wrap gap-4 items-end mb-8 bg-brand-surfaceHighlight p-4 rounded-xl border border-brand-border/30">
                      <div className="flex-1 min-w-[200px]">
                          <label className="block text-xs font-bold text-brand-textMuted mb-2 uppercase tracking-wide">Nome da Nova Liga</label>
                          <input 
                            type="text" 
                            value={newLeagueName}
                            onChange={e => setNewLeagueName(e.target.value)}
                            placeholder="Ex: Premier League X1"
                            className="w-full bg-brand-surface border border-brand-border rounded-lg p-3 text-white outline-none focus:border-brand-primary"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-brand-textMuted mb-2 uppercase tracking-wide">Experiência</label>
                          <select 
                            value={newLeagueExperience}
                            onChange={(e) => setNewLeagueExperience(e.target.value as any)}
                            className="bg-brand-surface border border-brand-border rounded-lg p-3 text-white focus:border-brand-primary outline-none"
                          >
                              <option value={ExperienceType.PRO_CLUBS}>⚽ Pro Clubs (11x11)</option>
                              <option value={ExperienceType.X1}>⚖️ X1 (1 Contra 1)</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-brand-textMuted mb-2 uppercase tracking-wide">Tipo de Entrada</label>
                          <select 
                            value={newLeagueEntrance}
                            onChange={(e) => setNewLeagueEntrance(e.target.value as any)}
                            className="bg-brand-surface border border-brand-border rounded-lg p-3 text-white focus:border-brand-primary outline-none"
                          >
                              <option value="aberta">Aberta (Livre)</option>
                              <option value="convite">Convite (Controlada)</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-brand-textMuted mb-2 uppercase tracking-wide">Modelo de Gestão</label>
                          <select 
                            value={newLeagueType}
                            onChange={(e) => setNewLeagueType(e.target.value as any)}
                            className="bg-brand-surface border border-brand-border rounded-lg p-3 text-white focus:border-brand-primary outline-none"
                          >
                              <option value="SIMPLE">🟢 Gestão Simples (Apenas Tabela)</option>
                          </select>
                      </div>
                      <button 
                        onClick={() => {
                            if (!newLeagueName.trim()) return;
                            onCreateLeague?.(newLeagueName, newLeagueEntrance, newLeagueType, newLeagueExperience);
                            setNewLeagueName('');
                        }}
                        className="bg-brand-primary hover:bg-blue-600 text-white h-[46px] px-8 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg"
                      >
                         <Plus size={18}/> Criar Liga
                      </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {leagues.map(league => (
                          <div key={league.id} className="bg-brand-surfaceHighlight p-5 rounded-xl border border-brand-border group hover:border-brand-primary transition-all flex flex-col justify-between">
                              <div>
                                  <div className="flex justify-between items-start mb-2">
                                      {editingLeagueId === league.id ? (
                                          <div className="flex-1 flex gap-2">
                                              <input 
                                                value={editLeagueName}
                                                onChange={e => setEditLeagueName(e.target.value)}
                                                className="flex-1 bg-brand-surface border border-brand-primary rounded p-1 text-sm text-white"
                                                autoFocus
                                              />
                                              <button 
                                                onClick={() => {
                                                    onUpdateLeague?.(league.id, { name: editLeagueName });
                                                    setEditingLeagueId(null);
                                                }}
                                                className="text-green-500"
                                              >
                                                  <Check size={16}/>
                                              </button>
                                          </div>
                                      ) : (
                                          <h3 className="font-bold text-brand-text flex items-center gap-2 text-lg">
                                              {league.name}
                                              <button 
                                                onClick={() => {
                                                    setEditingLeagueId(league.id);
                                                    setEditLeagueName(league.name);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-brand-primary transition-opacity"
                                              >
                                                  <Edit size={14}/>
                                              </button>
                                              <button 
                                                onClick={() => {
                                                    const url = `${window.location.origin}/liga/${league.slug || league.id}`;
                                                    navigator.clipboard.writeText(url);
                                                    toast.info("Link da liga copiado!");
                                                }}
                                                className="bg-brand-surfaceHighlight text-brand-primary p-1 rounded-lg border border-brand-border hover:border-brand-primary transition-all flex items-center gap-1 text-[9px] uppercase font-black"
                                                title="Copiar Link da Liga"
                                              >
                                                  <LinkIcon size={12}/> Link
                                              </button>
                                          </h3>
                                      )}
                                      <button onClick={() => onDeleteLeague?.(league.id)} className="text-red-900/40 hover:text-red-500 transition-colors">
                                          <Trash2 size={16}/>
                                      </button>
                                  </div>

                                  <div className="flex gap-2 mb-4">
                                      <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${league.entranceType === 'convite' ? 'bg-amber-900/30 text-amber-500 border border-amber-900/50' : 'bg-blue-900/30 text-blue-500 border border-blue-900/50'}`}>
                                          {league.entranceType === 'convite' ? '🔒 Convite' : '🌐 Aberta'}
                                      </span>
                                      <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${league.type === 'SIMPLE' ? 'bg-green-900/30 text-green-500 border border-green-900/50' : 'bg-yellow-900/30 text-yellow-500 border border-yellow-900/50'}`}>
                                          {league.type === 'SIMPLE' ? '🟢 X1 SIMPLES' : '🟡 MERCADO ATIVO'}
                                      </span>
                                      <span className="text-[9px] px-2 py-0.5 rounded font-black uppercase bg-slate-900/30 text-slate-500 border border-slate-900/50">
                                          ID: {league.id.substring(0, 8)}
                                      </span>
                                  </div>
                              </div>
                              
                              <div className="flex items-center justify-between mt-auto pt-4 border-t border-brand-border/30">
                                  {league.type === 'MARKET' ? (
                                      <div className="flex items-center gap-3">
                                          <div className="flex items-center gap-1.5 focus-within:ring-0">
                                              <div className={`w-2 h-2 rounded-full ${league.mercadoStatus === MarketStatus.OPEN ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 opacity-40'}`}></div>
                                              <span className="text-[10px] font-bold text-brand-textMuted uppercase tracking-wider">
                                                  Mercado {league.mercadoStatus === MarketStatus.OPEN ? 'Aberto' : 'Fechado'}
                                              </span>
                                          </div>
                                          <button 
                                            onClick={() => onUpdateLeague?.(league.id, { 
                                                mercadoStatus: league.mercadoStatus === MarketStatus.OPEN ? MarketStatus.CLOSED : MarketStatus.OPEN 
                                            })}
                                            className="text-[9px] text-brand-primary hover:underline font-bold uppercase tracking-tight"
                                          >
                                              {league.mercadoStatus === MarketStatus.OPEN ? 'Fechar' : 'Abrir'}
                                          </button>
                                      </div>
                                  ) : null}
                                  
                                  {league.entranceType === 'convite' && (
                                      <button 
                                        onClick={() => {
                                            try {
                                                if (league) {
                                                    setSelectedLigaForInvite(league);
                                                    setShowInviteModal(true);
                                                } else {
                                                    console.error("Tentativa de convidar para uma liga nula/undefined.");
                                                }
                                            } catch (error) {
                                                console.error("Erro ao abrir modal de convite:", error);
                                                toast.error("Ocorreu um erro ao abrir o convite. Consulte o console.");
                                            }
                                        }}
                                        className="bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-brand-primary/20 flex items-center gap-1.5"
                                      >
                                          <Send size={12}/> Convidar
                                      </button>
                                  )}
                              </div>
                          </div>
                      ))}
                      {leagues.length === 0 && (
                          <div className="col-span-full py-12 text-center bg-brand-surfaceHighlight border border-dashed border-brand-border rounded-xl">
                              <Trophy size={48} className="mx-auto text-slate-700 mb-4 opacity-20" />
                              <p className="text-brand-textMuted font-medium">Você ainda não criou nenhuma liga.</p>
                              <p className="text-[10px] text-slate-600 uppercase mt-2">Crie uma liga para associar campeonatos e habilitar o mercado.</p>
                          </div>
                      )}
                  </div>
              </div>

              {/* Modal de Convite */}
              {showInviteModal && selectedLigaForInvite && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                      <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-md p-6 shadow-2xl shadow-brand-primary/10 animate-in zoom-in-95 duration-200">
                          <div className="flex justify-between items-center mb-6">
                              <div>
                                  <h3 className="text-xl font-bold text-white">Convidar para Liga</h3>
                                  <p className="text-xs text-brand-textMuted font-medium">{selectedLigaForInvite.name}</p>
                              </div>
                              <button onClick={() => setShowInviteModal(false)} className="text-brand-textMuted hover:text-white transition-colors">
                                  <XCircle size={28}/>
                              </button>
                          </div>

                          <div className="space-y-6">
                              {/* Invite by Player Selection */}
                              <div>
                                  <label className="block text-xs font-black text-brand-primary uppercase tracking-widest mb-3">Selecionar Jogador</label>
                                  <div className="flex gap-2">
                                      <select 
                                        value={selectedPlayerId}
                                        onChange={(e) => setSelectedPlayerId(e.target.value)}
                                        className="flex-1 bg-brand-surfaceHighlight border border-brand-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-brand-primary transition-colors cursor-pointer"
                                      >
                                          <option value="">Selecione um jogador cadastrado...</option>
                                          {(allPlayers || []).filter(p => selectedLigaForInvite && (p.organizadorId !== selectedLigaForInvite.organizadorId || !p.organizadorId)).map(p => (
                                              <option key={p.id} value={p.id}>{p.name} (@{p.username})</option>
                                          ))}
                                      </select>
                                      <button 
                                        disabled={!selectedPlayerId}
                                        onClick={() => {
                                            try {
                                                if (selectedPlayerId && onSendInvitation && selectedLigaForInvite) {
                                                    onSendInvitation(selectedLigaForInvite.id, selectedPlayerId);
                                                    setSelectedPlayerId('');
                                                } else if (!onSendInvitation) {
                                                    console.error("Função onSendInvitation não fornecida via props.");
                                                }
                                            } catch (error) {
                                                console.error("Erro ao enviar convite por seleção:", error);
                                                toast.error("Erro ao processar convite. Verifique o console.");
                                            }
                                        }}
                                        className="bg-brand-primary disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold px-4 rounded-lg hover:brightness-110 active:scale-95 transition-all"
                                      >
                                          <Send size={18}/>
                                      </button>
                                  </div>
                              </div>

                              <div className="relative py-2">
                                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-brand-border/50"></div></div>
                                  <div className="relative flex justify-center text-[10px] font-black uppercase"><span className="bg-brand-surface px-4 text-brand-textMuted">OU</span></div>
                              </div>

                              {/* Invite by Email */}
                              <div>
                                  <label className="block text-xs font-black text-brand-primary uppercase tracking-widest mb-3">Convidar por Email</label>
                                  <div className="flex gap-2">
                                      <div className="relative flex-1">
                                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-textMuted" size={16}/>
                                          <input 
                                            type="email"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            placeholder="jogador@email.com"
                                            className="w-full bg-brand-surfaceHighlight border border-brand-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-brand-primary transition-colors"
                                          />
                                      </div>
                                      <button 
                                        disabled={!inviteEmail.includes('@')}
                                        onClick={() => {
                                            try {
                                                if (inviteEmail && onSendInvitation && selectedLigaForInvite) {
                                                    onSendInvitation(selectedLigaForInvite.id, undefined, inviteEmail);
                                                    setInviteEmail('');
                                                    setShowInviteModal(false);
                                                    setSelectedLigaForInvite(null);
                                                } else if (!onSendInvitation) {
                                                    console.error("Função onSendInvitation não fornecida via props.");
                                                }
                                            } catch (error) {
                                                console.error("Erro ao enviar convite por email:", error);
                                                toast.error("Erro ao processar convite por email. Verifique o console.");
                                            }
                                        }}
                                        className="bg-brand-primary disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold px-4 rounded-lg hover:brightness-110 active:scale-95 transition-all"
                                      >
                                          Convidar
                                      </button>
                                  </div>
                              </div>

                              {/* Convites Pendentes */}
                              <div>
                                  <h4 className="text-[10px] font-black text-brand-textMuted uppercase tracking-widest mb-3 flex items-center gap-2">
                                      <Clock size={12}/> Convites Recentes
                                  </h4>
                                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                      {selectedLigaForInvite && (pendingInvitations || []).filter(i => i.ligaId === selectedLigaForInvite.id && i.status === 'pendente').map(inv => {
                                          const targetPlayer = (allPlayers || []).find(p => p.id === inv.jogadorId);
                                          return (
                                              <div key={inv.id} className="p-3 bg-brand-surfaceHighlight border border-white/5 rounded-xl text-xs flex justify-between items-center group">
                                                  <div className="flex items-center gap-3">
                                                      <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold">
                                                          {(targetPlayer?.name || inv.email || 'J')[0].toUpperCase()}
                                                      </div>
                                                      <div>
                                                          <p className="font-bold text-white group-hover:text-brand-primary transition-colors">{targetPlayer?.name || inv.email || 'Convidado'}</p>
                                                          <p className="text-[10px] text-brand-textMuted uppercase font-medium">{new Date(inv.timestamp).toLocaleDateString()}</p>
                                                      </div>
                                                  </div>
                                                  <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">Pendente</span>
                                              </div>
                                          );
                                      })}
                                      {selectedLigaForInvite && (pendingInvitations || []).filter(i => i.ligaId === selectedLigaForInvite.id && i.status === 'pendente').length === 0 && (
                                          <div className="text-center py-6 bg-black/20 rounded-xl border border-dashed border-brand-border/50">
                                              <Mail className="mx-auto text-brand-textMuted opacity-20 mb-2" size={24}/>
                                              <p className="text-[10px] text-brand-textMuted font-bold uppercase italic">Nenhum convite pendente.</p>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </div>

                          <div className="mt-8 pt-6 border-t border-brand-border/30">
                              <h4 className="text-[10px] font-black text-brand-textMuted uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <Users size={12}/> Solicitações de Acesso
                              </h4>
                              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                  {selectedLigaForInvite && leagueMembers.filter(m => m.ligaId === selectedLigaForInvite.id && (m.status === 'PENDING' || m.status === 'WAITING_PAYMENT')).map(req => {
                                      const userReq = allPlayers.find(u => u.id === req.userId);
                                      return (
                                          <div key={req.id} className="p-3 bg-brand-surfaceHighlight border border-brand-border rounded-xl flex justify-between items-center group animate-in slide-in-from-right-2">
                                              <div className="flex items-center gap-3">
                                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${req.status === 'WAITING_PAYMENT' ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-brand-text'}`}>
                                                      {userReq?.name?.[0] || 'U'}
                                                  </div>
                                                  <div>
                                                      <div className="flex items-center gap-2">
                                                          <p className="text-xs font-bold text-white">{userReq?.name || 'Usuário'}</p>
                                                          {req.status === 'WAITING_PAYMENT' && <span className="text-[8px] bg-yellow-500 text-black px-1 rounded font-black italic">AGUARDANDO PGTO</span>}
                                                      </div>
                                                      <p className="text-[9px] text-brand-textMuted uppercase">
                                                          {req.status === 'PENDING' ? `Solicitou há ${Math.floor((Date.now() - req.joinedAt) / 60000)}m` : 'Aguardando confirmação de pagamento'}
                                                      </p>
                                                  </div>
                                              </div>
                                              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <button 
                                                    onClick={() => onUpdateLeagueMemberStatus?.(selectedLigaForInvite.id, req.userId, 'WAITING_PAYMENT' as any)}
                                                    className="p-1.5 bg-yellow-600/20 text-yellow-500 hover:bg-yellow-600 hover:text-white rounded-lg transition-all"
                                                    title="Aguardando Pagamento"
                                                  >
                                                      <CreditCard size={14}/>
                                                  </button>
                                                  <button 
                                                    onClick={() => onUpdateLeagueMemberStatus?.(selectedLigaForInvite.id, req.userId, 'APPROVED' as any)}
                                                    className="p-1.5 bg-green-600/20 text-green-500 hover:bg-green-600 hover:text-white rounded-lg transition-all"
                                                    title="Aprovar Acesso"
                                                  >
                                                      <Check size={14}/>
                                                  </button>
                                                  <button 
                                                    onClick={() => onUpdateLeagueMemberStatus?.(selectedLigaForInvite.id, req.userId, 'REJECTED' as any)}
                                                    className="p-1.5 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                                                    title="Recusar"
                                                  >
                                                      <XCircle size={14}/>
                                                  </button>
                                              </div>
                                          </div>
                                      );
                                  })}
                                  {selectedLigaForInvite && leagueMembers.filter(m => m.ligaId === selectedLigaForInvite.id && (m.status === 'PENDING' || m.status === 'WAITING_PAYMENT')).length === 0 && (
                                      <p className="text-[10px] text-brand-textMuted italic text-center py-4 bg-black/10 rounded-xl border border-dashed border-brand-border/30">Nenhuma solicitação pendente.</p>
                                  )}
                              </div>
                          </div>

                          <button 
                            onClick={() => setShowInviteModal(false)}
                            className="w-full mt-8 py-3 bg-brand-surfaceHighlight hover:bg-brand-border border border-brand-border text-brand-text font-bold rounded-xl transition-all uppercase tracking-widest text-xs"
                          >
                              Fechar
                          </button>
                      </div>
                  </div>
              )}
          </div>
      )}

      {activeTab === 'logs' && (
          <div className="bg-brand-surface rounded-xl border border-brand-border p-6 animate-in fade-in">
              <div className="flex justify-between items-center mb-6">
                  <div>
                      <h2 className="text-xl font-bold text-brand-text flex items-center gap-2"><Clock/> Change Log (Auditoria)</h2>
                      <p className="text-sm text-brand-textMuted">Histórico completo de alterações no sistema. Ações não solicitadas são destacadas.</p>
                  </div>
                  <div className="flex gap-2">
                      <div className="flex items-center gap-2 px-3 py-1 bg-red-900/20 border border-red-500/30 rounded text-xs text-red-300 font-bold">
                          <AlertTriangle size={12}/> Não Solicitado
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-900/20 border border-green-500/30 rounded text-xs text-green-300 font-bold">
                          <Check size={12}/> Aceito
                      </div>
                  </div>
              </div>

              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-brand-surfaceHighlight text-brand-textMuted uppercase font-bold text-xs">
                          <tr>
                              <th className="p-4">Data/Hora</th>
                              <th className="p-4">Módulo</th>
                              <th className="p-4">Descrição da Alteração</th>
                              <th className="p-4 text-center">Origem</th>
                              <th className="p-4 text-center">Status</th>
                              <th className="p-4 text-right">Ação</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border">
                          {[...systemLogs].sort((a,b) => b.timestamp - a.timestamp).map(log => (
                              <tr key={log.id} className={`hover:bg-brand-surfaceHighlight transition-colors ${!log.isRequested && log.status === 'PENDING' ? 'bg-red-900/10' : ''}`}>
                                  <td className="p-4 font-mono text-brand-textMuted text-xs whitespace-nowrap">{formatTime(log.timestamp)}</td>
                                  <td className="p-4 font-bold text-brand-text whitespace-nowrap">{log.module}</td>
                                  <td className="p-4 text-brand-text max-w-md">
                                      {log.description}
                                      {!log.isRequested && log.status === 'PENDING' && (
                                          <div className="mt-1 text-xs text-red-400 font-bold flex items-center gap-1 animate-pulse">
                                              <AlertTriangle size={12}/> Alteração não solicitada detectada
                                          </div>
                                      )}
                                  </td>
                                  <td className="p-4 text-center">
                                      {log.isRequested ? (
                                          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-[10px] font-bold uppercase">Solicitado</span>
                                      ) : (
                                          <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-[10px] font-bold uppercase border border-red-500/50">Não Solicitado</span>
                                      )}
                                  </td>
                                  <td className="p-4 text-center">
                                      {log.status === 'ACCEPTED' && <span className="text-green-500 font-bold text-xs flex justify-center items-center gap-1"><Check size={14}/> Aceito</span>}
                                      {log.status === 'REVERT_NEEDED' && <span className="text-red-500 font-bold text-xs flex justify-center items-center gap-1"><RefreshCw size={14}/> Reversão Req.</span>}
                                      {log.status === 'PENDING' && <span className="text-yellow-500 font-bold text-xs flex justify-center items-center gap-1"><Clock size={14}/> Pendente</span>}
                                  </td>
                                  <td className="p-4 text-right">
                                      {onUpdateLogStatus && log.status === 'PENDING' && (
                                          <div className="flex justify-end gap-2">
                                              <button onClick={() => onUpdateLogStatus(log.id, 'ACCEPTED')} className="p-1.5 bg-green-600 hover:bg-green-500 text-white rounded shadow" title="Aceitar Alteração"><Check size={14}/></button>
                                              <button onClick={() => onUpdateLogStatus(log.id, 'REVERT_NEEDED')} className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded shadow" title="Marcar para Reversão Manual"><XCircle size={14}/></button>
                                          </div>
                                      )}
                                  </td>
                              </tr>
                          ))}
                          {systemLogs.length === 0 && (
                              <tr><td colSpan={6} className="p-8 text-center text-brand-textMuted italic">Nenhuma alteração registrada no sistema.</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

    </div>
  );
};

export default OrganizerSettings;
