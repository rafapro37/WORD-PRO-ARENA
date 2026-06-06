import React, { useState, useEffect } from 'react';
import { toast } from '../src/lib/toast';
import { User, PlanType, PlanConfig, Advertisement, NewsItem, MarketPlayer, SocialLink, UserRole, UserStatus, MarketStatus, PlanStatus } from '../types';
import { marketService } from '../src/services/marketService';
import { calculateMarketValue } from '../services/playerService';
import { Users, Check, X, Shield, Upload, Trash2, Megaphone, Tag, Crown, UserCog, Edit, Save, Image, RefreshCw, Globe, Plus, Trophy, Star, FileText, LayoutList, Briefcase, AlertTriangle, Monitor, Instagram, Facebook, Twitter, Youtube, Gamepad2, LinkIcon, ArrowUp, ArrowDown, Palette, Eye, Search, Smartphone, MessageSquare } from '../components/Icons';
import { MARKET_KEY } from '../constants';
import { AppState } from '../types';

interface AdminDashboardProps {
  state: AppState;
  onApproveOrganizer: (id: string) => void;
  onRejectOrganizer: (id: string) => void;
  onUpdateSettings: (settings: Partial<AppState['settings']>) => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onUpdatePlan: (type: PlanType, config: PlanConfig) => void;
  onAddAd: (ad: Advertisement) => void;
  onDeleteAd: (id: string) => void;
  onToggleOfficialTournament: (id: string) => void;
  onDeleteTournament: (id: string) => void;
  onResetTournament: (id: string) => void;
  onAddNews: (news: NewsItem) => void; 
  onDeleteNews: (id: string) => void; 
  onSeedData?: () => void;
  onClearLogs?: () => void;
  onClearScreenshots?: () => void;
  onImportAdminPlayers: (players: MarketPlayer[]) => void;
  onLimparElencos?: () => void;
  onUpdateMarketStatus: (status: 'aberto' | 'fechado') => void;
  onNavigate?: (page: string) => void;
  onApproveUpgrade: (requestId: string) => void;
  onRejectUpgrade: (requestId: string) => void;
  onUpdatePlanManually: (userId: string, plan: PlanType, status: PlanStatus) => void;
  onUpdateUserStatus: (userId: string, status: UserStatus) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  state, onApproveOrganizer, onRejectOrganizer, onUpdateSettings, onLogoUpload,
  onAddUser, onDeleteUser, onUpdatePlan, onAddAd, onDeleteAd, onToggleOfficialTournament,
  onDeleteTournament, onResetTournament, onAddNews, onDeleteNews, onSeedData, onClearLogs, onClearScreenshots, onImportAdminPlayers, onLimparElencos,
  onUpdateMarketStatus, onNavigate,
  onApproveUpgrade, onRejectUpgrade, onUpdatePlanManually, onUpdateUserStatus
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'organizers' | 'tournaments' | 'mods' | 'plans' | 'ads' | 'news' | 'official' | 'themes' | 'market' | 'players'>('overview');
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['overview']));
  const [loadingTabs, setLoadingTabs] = useState<Set<string>>(new Set());

  // --- MARKET ADMIN ---
  const toggleMarket = (aberto: boolean) => {
      const novoStatus = aberto ? "aberto" : "fechado";
      localStorage.setItem(MARKET_KEY, novoStatus);
      onUpdateMarketStatus(novoStatus);
      console.log("STATUS MERCADO ATUALIZADO:", novoStatus);
  };

  useEffect(() => {
    if (!loadedTabs.has(activeTab)) {
      setLoadingTabs(prev => new Set(prev).add(activeTab));
      setTimeout(() => {
        setLoadedTabs(prev => new Set(prev).add(activeTab));
        setLoadingTabs(prev => {
          const next = new Set(prev);
          next.delete(activeTab);
          return next;
        });
      }, 600); // Simula carregamento assíncrono
    }
  }, [activeTab]);

  // Local State for Actions (Immediate)
  const [modName, setModName] = useState('');
  const [modUser, setModUser] = useState('');
  const [modPass, setModPass] = useState('');

  // New Organizer Form State
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgUser, setNewOrgUser] = useState('');
  const [newOrgPass, setNewOrgPass] = useState('');
  const [adTitle, setAdTitle] = useState('');
  const [adImage, setAdImage] = useState('');
  const [adLink, setAdLink] = useState('');
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsType, setNewsType] = useState<NewsItem['type']>('INFO');

  // Social Media State
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [newSocialPlatform, setNewSocialPlatform] = useState<SocialLink['platform']>('INSTAGRAM');

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [bulkPlayersText, setBulkPlayersText] = useState('');

  const handleProcessPlayerList = () => {
    const lines = bulkPlayersText.split('\n');
    const newPlayers: MarketPlayer[] = [];

    lines.forEach(line => {
      if (!line.trim()) return;
      const parts = line.split(',');
      if (parts.length < 5) return;

      const [name, position, overallStr, nacionalidade, clube] = parts;
      const overall = parseInt(overallStr.trim());
      if (isNaN(overall)) return;

      newPlayers.push({
        id: Math.random().toString(36).substr(2, 9),
        organizadorId: 'system',
        name: name.trim(),
        position: position.trim(),
        overall: overall,
        nacionalidade: nacionalidade.trim(),
        timeAtual: 'BANCO DE JOGADORES (ADMIN)',
        status: 'DISPONIVEL',
        tournamentId: '',
        isFictitious: false,
        valorTransferencia: calculateMarketValue(overall, position.trim())
      });
    });

    if (newPlayers.length > 0) {
      onImportAdminPlayers(newPlayers);
      toast.success(`${newPlayers.length} jogadores processados com sucesso!`);
      setIsImportModalOpen(false);
      setBulkPlayersText('');
    } else {
      toast.error('Nenhum jogador válido encontrado na lista.');
    }
  };

  // --- CHANGE TRACKING & BUFFERING ---
  const [pendingSettings, setPendingSettings] = useState<Partial<AppState['settings']>>({});
  const [editingPlans, setEditingPlans] = useState<Record<string, Partial<PlanConfig>>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Helper to merge current state with pending changes for rendering
  const currentSettings = { ...state.settings, ...pendingSettings };
  const getPlanConfig = (type: PlanType) => ({ ...(state.planConfigs?.[type] || {}), ...(editingPlans[type] || {}) });

  // Update Settings Buffer
  const updateLocalSetting = (key: keyof AppState['settings'], value: any) => {
      setPendingSettings(prev => ({ ...prev, [key]: value }));
      setHasChanges(true);
      setShowSuccess(false);
  };
  
  // Nested Settings Helper (Login Layout)
  const updateLocalLoginLayout = (updates: Partial<AppState['settings']['loginLayout']>) => {
      const currentLayout = pendingSettings.loginLayout || state.settings.loginLayout;
      updateLocalSetting('loginLayout', { ...currentLayout, ...updates });
  };
  
  // Deep Nested Helper (Login Layout Positions)
  const updateLocalLayoutPos = (section: 'brandingPos' | 'formPos' | 'plansPos' | 'socialPos', updates: any) => {
      const currentLayout = pendingSettings.loginLayout || state.settings.loginLayout;
      const currentSection = currentLayout[section] || {};
      updateLocalLoginLayout({
          [section]: { ...currentSection, ...updates }
      });
  };

  // Update Plan Buffer
  const handlePlanEditChange = (type: PlanType, field: keyof PlanConfig, value: any) => {
      setEditingPlans(prev => ({
          ...prev,
          [type]: { ...(prev[type] || {}), [field]: value }
      }));
      setHasChanges(true);
      setShowSuccess(false);
  };

  // --- SAVE ACTION ---
  const handleSaveChanges = () => {
      // 1. Commit Settings
      if (Object.keys(pendingSettings).length > 0) {
          onUpdateSettings(pendingSettings);
      }

      // 2. Commit Plans
      Object.keys(editingPlans).forEach(key => {
          const type = key as PlanType;
          const finalConfig = { ...(state.planConfigs?.[type] || {}), ...(editingPlans[type] || {}) };
          // @ts-ignore
          onUpdatePlan(type, finalConfig);
      });

      // 3. Reset Buffers & Show Success
      setPendingSettings({});
      setEditingPlans({});
      setHasChanges(false);
      setPreviewTheme(null); // Clear preview on save
      setShowSuccess(true);

      setTimeout(() => setShowSuccess(false), 3000);
  };

  // --- HANDLERS (Actions remain immediate) ---
  const handleCreateOrganizer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName || !newOrgUser || !newOrgPass) return;
    onAddUser({
      id: Math.random().toString(36).substr(2, 9),
      name: newOrgName,
      username: newOrgUser,
      password: newOrgPass,
      role: UserRole.ORGANIZER,
      status: UserStatus.APPROVED,
      plan: PlanType.FREE,
      verified: true,
      createdAt: new Date().toISOString()
    });
    setNewOrgName(''); setNewOrgUser(''); setNewOrgPass('');
    toast.success('Organizador criado com sucesso!');
  };

  const handleCreateMod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modName || !modUser || !modPass) return;
    onAddUser({
      id: Math.random().toString(36).substr(2, 9),
      name: modName,
      username: modUser,
      password: modPass,
      role: UserRole.MODERATOR,
      status: UserStatus.APPROVED,
      verified: true,
      createdAt: new Date().toISOString()
    });
    setModName(''); setModUser(''); setModPass('');
    toast.success('Moderador criado com sucesso!');
  };

  const handleAddAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTitle || !adImage) return;
    onAddAd({
      id: Math.random().toString(36).substr(2, 9),
      organizadorId: state.currentUser!.id,
      title: adTitle,
      imageUrl: adImage,
      linkUrl: adLink,
      isActive: true
    });
    setAdTitle(''); setAdImage(''); setAdLink('');
    toast.success('Anúncio adicionado!');
  };

  const handleAddNews = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newsTitle || !newsContent) return;
      onAddNews({
          id: Math.random().toString(36).substr(2, 9),
          organizadorId: state.currentUser!.id,
          title: newsTitle,
          content: newsContent,
          type: newsType,
          date: Date.now()
      });
      setNewsTitle('');
      setNewsContent('');
      toast.success('Notícia publicada!');
  };

  // SOCIAL MEDIA HANDLERS
  const handleAddSocial = () => {
      if(!newSocialUrl) return;
      const newLink: SocialLink = {
          id: Math.random().toString(36).substr(2,9),
          platform: newSocialPlatform,
          url: newSocialUrl
      };
      const currentLinks = pendingSettings.socialLinks || state.settings.socialLinks || [];
      updateLocalSetting('socialLinks', [...currentLinks, newLink]);
      setNewSocialUrl('');
  };

  const handleRemoveSocial = (id: string) => {
      const currentLinks = pendingSettings.socialLinks || state.settings.socialLinks || [];
      updateLocalSetting('socialLinks', currentLinks.filter(l => l.id !== id));
  };

  const handleMoveSocial = (index: number, direction: 'UP' | 'DOWN') => {
      const currentLinks = [...(pendingSettings.socialLinks || state.settings.socialLinks || [])];
      if (direction === 'UP' && index > 0) {
          [currentLinks[index], currentLinks[index - 1]] = [currentLinks[index - 1], currentLinks[index]];
      } else if (direction === 'DOWN' && index < currentLinks.length - 1) {
          [currentLinks[index], currentLinks[index + 1]] = [currentLinks[index + 1], currentLinks[index]];
      }
      updateLocalSetting('socialLinks', currentLinks);
  };

  const handleProjectLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            updateLocalSetting('loginLogoUrl', reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleAdImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setAdImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const players: MarketPlayer[] = json.map((p: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: p.nome,
          position: p.posicao,
          overall: p.overall,
          nacionalidade: p.nacionalidade,
          timeAtual: 'BANCO DE JOGADORES (ADMIN)',
          status: 'DISPONIVEL',
          tournamentId: '', // ADMIN bank
          isFictitious: false,
          valorTransferencia: calculateMarketValue(p.overall, p.posicao)
        }));
        onImportAdminPlayers(players);
        toast.info(`${players.length} jogadores importados!`);
      } catch (err) {
        toast.error('Erro ao importar JSON.');
      }
    };
    reader.readAsText(file);
  };

  const pendingOrganizers = (state.users || []).filter(u => u.role === UserRole.ORGANIZER && u.status === UserStatus.PENDING && u.emailVerified === true);
  const activeOrganizers = (state.users || []).filter(u => u.role === UserRole.ORGANIZER && u.status !== UserStatus.PENDING);

  return (
    <div className="p-8 pb-32">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-brand-text">Painel Administrativo</h1>
        <div className="flex gap-2 flex-wrap">
            {[
                { id: 'overview', icon: Shield, label: 'Geral' },
                { id: 'organizers', icon: Users, label: 'Organizadores' },
                { id: 'tournaments', icon: Trophy, label: 'Campeonatos' },
                { id: 'themes', icon: Palette, label: 'Temas Visuais' },
                { id: 'mods', icon: UserCog, label: 'Moderadores' },
                { id: 'plans', icon: Tag, label: 'Planos' },
                { id: 'ads', icon: Megaphone, label: 'Anúncios' },
                { id: 'news', icon: FileText, label: 'Notícias' },
                { id: 'official', icon: Crown, label: 'Oficiais' },
                { id: 'market', icon: Briefcase, label: 'Mercado' },
                { id: 'players', icon: Users, label: 'Jogadores' },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
                        activeTab === tab.id 
                        ? 'bg-brand-primary text-white' 
                        : 'bg-brand-surfaceHighlight text-slate-400 hover:bg-brand-surface'
                    }`}
                >
                    <tab.icon size={16} /> {tab.label}
                </button>
            ))}
        </div>
      </div>

      {loadingTabs.has(activeTab) && (
          <div className="p-20 text-center text-brand-textMuted animate-pulse">
              <p className="text-xl font-bold">Carregando conteúdo...</p>
          </div>
      )}

      {activeTab === 'themes' && !loadingTabs.has('themes') && (
          <div className="bg-brand-surface p-10 rounded-xl border border-brand-border animate-in fade-in flex flex-col items-center text-center gap-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: 'var(--theme-primary, #FF6A00)25' }}>
                🎨
              </div>
              <div>
                <h2 className="text-2xl font-black text-brand-text mb-2">Personalização Visual</h2>
                <p className="text-brand-textMuted text-sm max-w-md">
                  Configure cores, logo, imagens e o nome da plataforma na página de Personalização Global.
                  O sistema usa tema único cinza + laranja — você pode ajustar a cor primária e os fundos.
                </p>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('admin-personalizacao')}
                className="flex items-center gap-3 px-8 py-3 rounded-xl font-black text-sm text-black shadow-lg transition-all hover:scale-105"
                style={{ background: 'var(--theme-primary, #FF6A00)' }}
              >
                <Palette size={18} /> Abrir Personalização Global
              </button>
          </div>
      )}

      {activeTab === 'overview' && !loadingTabs.has('overview') && (
        <div className="space-y-8 animate-in fade-in">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest flex items-center gap-2"><Palette size={14}/> Tamanho da Fonte Global</h4>
                    <input 
                        type="range" 
                        min="10" 
                        max="24" 
                        value={currentSettings.globalFontSize || 16} 
                        onChange={e => updateLocalSetting('globalFontSize', parseInt(e.target.value))} 
                        className="w-full accent-brand-primary"
                    />
                    <span className="text-white text-xs mt-2 block">{currentSettings.globalFontSize || 16}px</span>
                </div>
                 <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border)] flex items-center gap-4">
                     <div className="p-3 bg-blue-900/50 rounded-full text-blue-400"><Users /></div>
                     <div>
                         <p className="text-sm text-[var(--text-secondary)] uppercase font-bold">Total Usuários</p>
                         <p className="text-2xl font-bold text-[var(--text-main)]">{(state.users || []).length}</p>
                     </div>
                 </div>
                 <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border)] flex items-center gap-4">
                     <div className="p-3 bg-yellow-900/50 rounded-full text-yellow-400"><Trophy /></div>
                     <div>
                         <p className="text-sm text-[var(--text-secondary)] uppercase font-bold">Campeonatos</p>
                         <p className="text-2xl font-bold text-[var(--text-main)]">{(state.tournaments || []).length}</p>
                     </div>
                 </div>
                 <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border)] flex items-center gap-4">
                     <div className="p-3 bg-green-900/50 rounded-full text-green-400"><Briefcase /></div>
                     <div>
                         <p className="text-sm text-[var(--text-secondary)] uppercase font-bold">Times Criados</p>
                         <p className="text-2xl font-bold text-[var(--text-main)]">{(state.teams || []).length}</p>
                     </div>
                 </div>
                 {pendingOrganizers.length > 0 && (
                     <div onClick={() => setActiveTab('organizers')} className="bg-yellow-600 p-6 rounded-xl border border-yellow-400 flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform shadow-lg animate-pulse">
                         <div className="p-3 bg-black/20 rounded-full text-white"><Shield /></div>
                         <div>
                             <p className="text-sm text-yellow-100 uppercase font-bold">Verificados</p>
                             <p className="text-2xl font-bold text-white">{pendingOrganizers.length} Pendentes</p>
                         </div>
                     </div>
                 )}
                 <div onClick={() => onUpdateSettings({} as any)} className="bg-brand-surface p-6 rounded-xl border border-brand-border">
                     <h2 className="text-xl font-bold text-brand-text mb-4">Importar Jogadores (JSON)</h2>
                     <label className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg cursor-pointer w-fit">
                         <Upload size={16} /> Importar Arquivo JSON
                         <input type="file" hidden accept=".json" onChange={handleImportJson} />
                     </label>
                 </div>

                 <div onClick={() => { /* This is just a visual card that highlights a feature, we can make it a button */ }} className="bg-gradient-to-br from-indigo-900/40 to-brand-primary/20 p-6 rounded-2xl border border-brand-primary/30 flex flex-col justify-between group">
                    <div>
                        <div className="w-10 h-10 bg-brand-primary/20 rounded-lg flex items-center justify-center text-brand-primary mb-4 group-hover:scale-110 transition-transform">
                            <Palette size={24}/>
                        </div>
                        <h3 className="text-white font-bold text-lg">Personalização Global</h3>
                        <p className="text-slate-400 text-xs mt-1">Altere cores, banners e logos de toda a plataforma em tempo real.</p>
                    </div>
                    <button 
                        onClick={() => {
                           if (onNavigate) onNavigate('admin-personalizacao');
                        }}
                        className="mt-6 w-full py-2 bg-brand-primary text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-brand-primary/20 group-hover:translate-y-[-2px] transition-all"
                    >
                        Configurar Visual
                    </button>
                 </div>
             </div>

             <div className="bg-brand-surface p-6 rounded-xl border border-brand-border max-w-4xl">
                <h2 className="text-xl font-bold mb-4 text-brand-text">Configurações Globais</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-brand-surfaceHighlight border border-brand-border rounded-xl flex justify-between items-center">
                        <div>
                            <h3 className="text-brand-text font-bold flex items-center gap-2"><Monitor size={18}/> Carrossel Externo</h3>
                            <p className="text-brand-textMuted text-xs mt-1">Carrossel de planos na tela de login.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={currentSettings.enableExternalCarousel ?? true}
                                onChange={(e) => updateLocalSetting('enableExternalCarousel', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>

                    <div className="p-4 bg-brand-surfaceHighlight border border-brand-border rounded-xl flex justify-between items-center">
                        <div>
                            <h3 className="text-brand-text font-bold flex items-center gap-2"><Image size={18}/> Fundo Temático</h3>
                            <p className="text-brand-textMuted text-xs mt-1">Ativar cores e imagens do tema.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={currentSettings.enableThemedBackground ?? true}
                                onChange={(e) => updateLocalSetting('enableThemedBackground', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>
                </div>

                <div className="p-4 bg-brand-surfaceHighlight border border-brand-border rounded-xl mb-6">
                    <h3 className="text-brand-text font-bold flex items-center gap-2 mb-4"><MessageSquare size={18} className="text-green-500"/> Suporte e Contato</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] text-brand-textMuted uppercase font-bold mb-1 block">WhatsApp do Administrador</label>
                            <div className="relative">
                                <div className="absolute left-3 top-2.5 text-brand-textMuted"><Smartphone size={16}/></div>
                                <input 
                                    type="text"
                                    value={currentSettings.adminWhatsapp || ''}
                                    onChange={(e) => updateLocalSetting('adminWhatsapp', e.target.value)}
                                    placeholder="Ex: 5511999999999"
                                    className="w-full bg-black border border-brand-border rounded-lg pl-10 pr-4 py-2 text-white text-sm outline-none focus:border-brand-primary"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-brand-textMuted uppercase font-bold mb-1 block">Texto do Botão de Suporte</label>
                            <div className="relative">
                                <div className="absolute left-3 top-2.5 text-brand-textMuted"><Edit size={16}/></div>
                                <input 
                                    type="text"
                                    value={currentSettings.supportButtonText || ''}
                                    onChange={(e) => updateLocalSetting('supportButtonText', e.target.value)}
                                    placeholder="Ex: Suporte Técnico VIP"
                                    className="w-full bg-black border border-brand-border rounded-lg pl-10 pr-4 py-2 text-white text-sm outline-none focus:border-brand-primary"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-brand-surfaceHighlight border border-brand-border rounded-xl mb-6">
                    <h3 className="text-brand-text font-bold flex items-center gap-2 mb-2"><Shield size={18} className="text-brand-primary"/> Logotipo do Projeto</h3>
                    <p className="text-brand-textMuted text-xs mb-3">Imagem que aparece acima do nome na tela de login e menu lateral.</p>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-black rounded-lg border border-brand-border flex items-center justify-center overflow-hidden">
                            {currentSettings.loginLogoUrl ? (
                                <img src={currentSettings.loginLogoUrl} className="w-full h-full object-contain" alt="Project Logo" />
                            ) : (
                                <Shield className="text-slate-600" size={32} />
                            )}
                        </div>
                        <div className="flex-1">
                            <label className="flex items-center gap-2 bg-brand-surface hover:bg-brand-surfaceHighlight text-brand-text border border-brand-border px-4 py-2 rounded-lg cursor-pointer transition-colors w-fit">
                                <Upload size={16} /> Fazer Upload do Logo
                                <input type="file" hidden accept="image/*" onChange={handleProjectLogoUpload} />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-brand-border">
                    <h3 className="font-bold text-brand-text mb-4">Editor de Login</h3>
                    <div className="flex gap-4 mb-4">
                        <button 
                            onClick={() => updateLocalLoginLayout({ mode: 'STANDARD' })}
                            className={`px-4 py-2 rounded text-xs font-bold border ${currentSettings.loginLayout.mode === 'STANDARD' ? 'bg-brand-primary border-brand-primary text-white' : 'border-brand-border text-brand-textMuted'}`}
                        >
                            Layout Padrão
                        </button>
                        <button 
                            onClick={() => updateLocalLoginLayout({ mode: 'CUSTOM' })}
                            className={`px-4 py-2 rounded text-xs font-bold border ${currentSettings.loginLayout.mode === 'CUSTOM' ? 'bg-brand-primary border-brand-primary text-white' : 'border-brand-border text-brand-textMuted'}`}
                        >
                            Layout Livre
                        </button>
                    </div>

                    {currentSettings.loginLayout.mode === 'CUSTOM' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-brand-surfaceHighlight p-4 rounded-lg border border-brand-border animate-in fade-in">
                            <div>
                                <h4 className="text-xs text-brand-primary font-bold uppercase mb-3 flex items-center gap-2"><Briefcase size={14}/> Caixa de Login</h4>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-[10px] text-brand-textMuted uppercase font-bold mb-1">
                                            <span>Posição Horizontal (X)</span>
                                            <span>{currentSettings.loginLayout.formPos.x}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={currentSettings.loginLayout.formPos.x ?? 50} onChange={(e) => updateLocalLayoutPos('formPos', { x: parseInt(e.target.value) })} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-primary"/>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[10px] text-brand-textMuted uppercase font-bold mb-1">
                                            <span>Posição Vertical (Y)</span>
                                            <span>{currentSettings.loginLayout.formPos.y}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={currentSettings.loginLayout.formPos.y ?? 50} onChange={(e) => updateLocalLayoutPos('formPos', { y: parseInt(e.target.value) })} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-primary"/>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs text-yellow-500 font-bold uppercase mb-3 flex items-center gap-2"><Tag size={14}/> Carousel de Planos</h4>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-[10px] text-brand-textMuted uppercase font-bold mb-1">
                                            <span>Posição Horizontal (X)</span>
                                            <span>{currentSettings.loginLayout.plansPos?.x ?? 25}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={currentSettings.loginLayout.plansPos?.x ?? 25} onChange={(e) => updateLocalLayoutPos('plansPos', { x: parseInt(e.target.value) })} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"/>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[10px] text-brand-textMuted uppercase font-bold mb-1">
                                            <span>Posição Vertical (Y)</span>
                                            <span>{currentSettings.loginLayout.plansPos?.y ?? 50}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={currentSettings.loginLayout.plansPos?.y ?? 50} onChange={(e) => updateLocalLayoutPos('plansPos', { y: parseInt(e.target.value) })} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"/>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-xs text-blue-400 font-bold uppercase flex items-center gap-2"><Globe size={14}/> Redes Sociais</h4>
                                    <label className="text-[10px] bg-slate-800 px-2 py-1 rounded cursor-pointer">
                                        <input type="checkbox" checked={currentSettings.loginLayout.socialPos?.visible ?? true} onChange={e => updateLocalLayoutPos('socialPos', { visible: e.target.checked })} className="mr-1"/>
                                        Visível
                                    </label>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-[10px] text-brand-textMuted uppercase font-bold mb-1">
                                            <span>Posição Horizontal (X)</span>
                                            <span>{currentSettings.loginLayout.socialPos?.x ?? 50}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={currentSettings.loginLayout.socialPos?.x ?? 50} onChange={(e) => updateLocalLayoutPos('socialPos', { x: parseInt(e.target.value) })} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-400"/>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[10px] text-brand-textMuted uppercase font-bold mb-1">
                                            <span>Posição Vertical (Y)</span>
                                            <span>{currentSettings.loginLayout.socialPos?.y ?? 90}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={currentSettings.loginLayout.socialPos?.y ?? 90} onChange={(e) => updateLocalLayoutPos('socialPos', { y: parseInt(e.target.value) })} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-400"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-brand-border">
                    <h3 className="font-bold text-brand-text mb-4 flex items-center gap-2"><Globe size={18}/> Gerenciar Links Sociais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <select value={newSocialPlatform} onChange={e => setNewSocialPlatform(e.target.value as any)} className="bg-brand-surfaceHighlight border border-brand-border p-2 rounded text-brand-text text-sm outline-none">
                            <option value="INSTAGRAM">Instagram</option>
                            <option value="FACEBOOK">Facebook</option>
                            <option value="TWITTER">Twitter / X</option>
                            <option value="YOUTUBE">YouTube</option>
                            <option value="DISCORD">Discord</option>
                            <option value="TIKTOK">TikTok</option>
                            <option value="TWITCH">Twitch</option>
                            <option value="KICK">Kick</option>
                            <option value="WEBSITE">Website</option>
                        </select>
                        <div className="flex gap-2">
                            <input value={newSocialUrl} onChange={e => setNewSocialUrl(e.target.value)} placeholder="URL do link..." className="flex-1 bg-brand-surfaceHighlight border border-brand-border p-2 rounded text-brand-text text-sm outline-none"/>
                            <button onClick={handleAddSocial} className="bg-green-600 hover:bg-green-500 text-white px-4 rounded font-bold text-sm"><Plus/></button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-brand-border">
                    <h3 className="text-red-500 font-bold mb-2">Zona de Perigo</h3>
                    <div className="flex gap-4 mb-4 flex-wrap">
                        <button 
                            onClick={() => {
                                if(window.confirm('TEM CERTEZA? Isso apagará TODOS os dados. Ação irreversível.')) {
                                    if (onSeedData) onSeedData();
                                }
                            }}
                            className="bg-red-900/50 hover:bg-red-700 text-red-200 border border-red-800 px-4 py-3 rounded flex items-center gap-2 flex-1"
                        >
                            <Trash2 size={18} /> Resetar Banco Total
                        </button>
                        <button 
                            onClick={() => {
                                if(window.confirm('Limpar todos os logs do sistema?')) {
                                    if (onClearLogs) onClearLogs();
                                }
                            }}
                            className="bg-brand-surfaceHighlight hover:bg-brand-border text-brand-text border border-brand-border px-4 py-3 rounded flex items-center gap-2 flex-1"
                        >
                            <FileText size={18} /> Limpar Logs
                        </button>
                        <button 
                            onClick={() => {
                                if(window.confirm('Remover todas as imagens de resultados de partidas? Isso libera muito espaço.')) {
                                    if (onClearScreenshots) onClearScreenshots();
                                }
                            }}
                            className="bg-brand-surfaceHighlight hover:bg-brand-border text-brand-text border border-brand-border px-4 py-3 rounded flex items-center gap-2 flex-1"
                        >
                            <Image size={18} /> Limpar Screenshots
                        </button>
                    </div>
                </div>
             </div>
        </div>
      )}

      {activeTab === 'players' && !loadingTabs.has('players') && (
          <div className="space-y-6 animate-in fade-in">
              <h3 className="text-xl font-bold text-brand-text mb-4 flex items-center gap-2"><Users /> Gestão de Jogadores</h3>
              <div className="bg-brand-surface p-6 rounded-xl border border-brand-border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-brand-text">
                        <thead className="bg-brand-surfaceHighlight text-brand-textMuted uppercase text-xs">
                          <tr>
                            <th className="p-3">Nome</th>
                            <th className="p-3">E-mail</th>
                            <th className="p-3">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {state.users.filter(u => u.role === UserRole.PLAYER).map(user => (
                            <tr key={user.id} className="border-b border-brand-border">
                              <td className="p-3">{user.name}</td>
                              <td className="p-3">{user.email}</td>
                              <td className="p-3">
                                <button onClick={() => onDeleteUser(user.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16}/></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                    </table>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'organizers' && !loadingTabs.has('organizers') && (
          <div className="space-y-8 animate-in fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <div className="bg-brand-surface p-6 rounded-xl border border-brand-border">
                      <h3 className="text-xl font-bold text-brand-text mb-6 flex items-center gap-2"><Plus /> Criar Novo Organizador</h3>
                      <p className="text-xs text-brand-textMuted mb-4">Crie contas manuais para organizadores. O cadastro público foi desativado.</p>
                      <form onSubmit={handleCreateOrganizer} className="space-y-4">
                          <div>
                              <label className="text-xs text-brand-textMuted font-bold uppercase block mb-1">Nome da Organização / Organizador</label>
                              <input value={newOrgName} onChange={e=>setNewOrgName(e.target.value)} className="w-full bg-brand-surfaceHighlight border border-brand-border rounded p-2 text-brand-text" placeholder="Ex: Liga Elite"/>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="text-xs text-brand-textMuted font-bold uppercase block mb-1">Usuário (Login)</label>
                                  <input value={newOrgUser} onChange={e=>setNewOrgUser(e.target.value)} className="w-full bg-brand-surfaceHighlight border border-brand-border rounded p-2 text-brand-text" placeholder="username"/>
                              </div>
                              <div>
                                  <label className="text-xs text-brand-textMuted font-bold uppercase block mb-1">Senha Inicial</label>
                                  <input type="password" value={newOrgPass} onChange={e=>setNewOrgPass(e.target.value)} className="w-full bg-brand-surfaceHighlight border border-brand-border rounded p-2 text-brand-text" placeholder="******"/>
                              </div>
                          </div>
                          <button className="w-full bg-brand-primary text-white font-bold py-2 rounded shadow-lg hover:brightness-110 transition-all">Criar Organizador</button>
                      </form>
                  </div>

                  {pendingOrganizers.length > 0 && (
                      <div className="bg-yellow-900/20 border-l-4 border-yellow-500 p-6 rounded-r-xl h-fit">
                          <h3 className="text-xl font-bold text-yellow-500 mb-4 flex items-center gap-2">
                              <Shield /> Aprovações Pendentes ({pendingOrganizers.length})
                          </h3>
                          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                              {pendingOrganizers.map(org => (
                                  <div key={org.id} className="bg-brand-surfaceHighlight border border-yellow-700/50 p-4 rounded-lg flex justify-between items-center gap-4">
                                      <div className="min-w-0">
                                          <p className="font-bold text-brand-text truncate">{org.name}</p>
                                          <p className="text-[10px] text-brand-textMuted truncate">@{org.username} • {org.email}</p>
                                      </div>
                                      <div className="flex gap-2 shrink-0">
                                          <button onClick={() => onApproveOrganizer(org.id)} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded shadow transition-all"><Check size={16}/></button>
                                          <button onClick={() => onRejectOrganizer(org.id)} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded shadow transition-all"><X size={16}/></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>

              <div className="bg-brand-surface p-6 rounded-xl border border-brand-border">
                  <h3 className="text-xl font-bold text-brand-text mb-6 flex items-center gap-2"><Users /> Organizadores Cadastrados</h3>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead className="bg-brand-surfaceHighlight text-brand-textMuted uppercase text-xs">
                              <tr>
                                  <th className="p-4">Nome / Usuário</th>
                                  <th className="p-4">Plano</th>
                                  <th className="p-4">Status</th>
                                  <th className="p-4 text-right">Ações</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-border">
                              {state.users.filter(u => u.role === UserRole.ORGANIZER && u.status !== UserStatus.PENDING).map(org => (
                                  <tr key={org.id} className="hover:bg-brand-surfaceHighlight transition-colors">
                                      <td className="p-4">
                                          <div className="font-bold text-brand-text">{org.name}</div>
                                          <div className="text-xs text-brand-textMuted">@{org.username}</div>
                                      </td>
                                      <td className="p-4">
                                          <select 
                                            value={org.plan || PlanType.FREE} 
                                            onChange={(e) => onUpdatePlanManually(org.id, e.target.value as PlanType, org.planStatus || PlanStatus.ACTIVE)}
                                            className="bg-black border border-brand-border text-[10px] font-bold rounded px-2 py-1 outline-none text-white"
                                          >
                                              {Object.values(PlanType).map(p => <option key={p} value={p}>{p}</option>)}
                                          </select>
                                      </td>
                                      <td className="p-4">
                                          <button 
                                            onClick={() => onUpdateUserStatus(org.id, org.status === UserStatus.APPROVED ? UserStatus.REJECTED : UserStatus.APPROVED)}
                                            className={`px-3 py-1 rounded text-[10px] font-black uppercase transition-all ${org.status === UserStatus.APPROVED ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-red-500 text-white shadow-lg shadow-red-500/20'}`}
                                          >
                                              {org.status === UserStatus.APPROVED ? 'ATIVO' : 'DESATIVADO'}
                                          </button>
                                      </td>
                                      <td className="p-4 text-right">
                                          <button onClick={() => { if(window.confirm('Excluir permanentemente?')) onDeleteUser(org.id) }} className="text-red-500 hover:text-white bg-red-900/20 hover:bg-red-600 p-2 rounded transition-colors"><Trash2 size={16} /></button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'tournaments' && !loadingTabs.has('tournaments') && (
          <div className="bg-brand-surface p-6 rounded-xl border border-brand-border animate-in fade-in">
              <h3 className="text-xl font-bold text-brand-text mb-6 flex items-center gap-2"><Trophy /> Todos os Campeonatos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {state.tournaments.map(t => (
                      <div key={t.id} className="bg-brand-surfaceHighlight border border-brand-border rounded-xl overflow-hidden group">
                          <div className="h-32 bg-slate-800 relative">
                              {t.bannerUrl && <img src={t.bannerUrl} className="w-full h-full object-cover opacity-50" />}
                              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                              <div className="absolute bottom-3 left-3">
                                  <p className="text-white font-bold">{t.name}</p>
                                  <p className="text-[10px] text-brand-textMuted uppercase font-bold">{t.sport} • {t.format}</p>
                              </div>
                              <div className="absolute top-2 right-2 flex gap-1">
                                  <button onClick={() => onToggleOfficialTournament(t.id)} className={`p-1.5 rounded shadow-lg transition-colors ${t.isOfficial ? 'bg-yellow-500 text-black' : 'bg-black/50 text-white hover:bg-yellow-500/50'}`} title="Marcar como Oficial"><Crown size={14}/></button>
                                  <button onClick={() => onDeleteTournament(t.id)} className="p-1.5 bg-red-600/80 text-white rounded hover:bg-red-600 shadow-lg" title="Excluir"><Trash2 size={14}/></button>
                              </div>
                          </div>
                      </div>
                  ))}
                  {state.tournaments.length === 0 && <p className="text-brand-textMuted italic col-span-full text-center py-10">Nenhum campeonato registrado.</p>}
              </div>
          </div>
      )}

      {activeTab === 'market' && !loadingTabs.has('market') && (() => {
          const currentMarketStatus = state.marketStatuses[state.currentUser?.id || ''] || 'fechado';
          return (
            <div className="bg-brand-surface p-6 rounded-xl border border-brand-border animate-in fade-in">
                <h3 className="text-xl font-bold text-brand-text mb-6 flex items-center gap-2"><Briefcase /> Gerenciar Mercado</h3>
                <div className="flex gap-4">
                    <button onClick={() => toggleMarket(true)} className={`px-6 py-3 rounded-lg font-bold ${currentMarketStatus === 'aberto' ? 'bg-green-600 text-white' : 'bg-brand-surfaceHighlight text-brand-textMuted'}`}>Abrir Mercado</button>
                    <button onClick={() => toggleMarket(false)} className={`px-6 py-3 rounded-lg font-bold ${currentMarketStatus === 'fechado' ? 'bg-red-600 text-white' : 'bg-brand-surfaceHighlight text-brand-textMuted'}`}>Fechar Mercado</button>
                </div>
                <p className="mt-4 text-brand-textMuted text-sm font-bold">Status atual detectado: <span className={currentMarketStatus === 'aberto' ? 'text-green-500' : 'text-red-500'}>{currentMarketStatus.toUpperCase()}</span></p>
            </div>
          );
      })()}

      {activeTab === 'mods' && !loadingTabs.has('mods') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
              <div className="lg:col-span-1 bg-brand-surface p-6 rounded-xl border border-brand-border h-fit">
                  <h3 className="text-xl font-bold text-brand-text mb-6 flex items-center gap-2"><UserCog /> Novo Moderador</h3>
                  <form onSubmit={handleCreateMod} className="space-y-4">
                      <div><label className="text-xs text-brand-textMuted font-bold uppercase block mb-1">Nome</label><input value={modName} onChange={e=>setModName(e.target.value)} className="w-full bg-brand-surfaceHighlight border border-brand-border rounded p-2 text-brand-text"/></div>
                      <div><label className="text-xs text-brand-textMuted font-bold uppercase block mb-1">Usuário</label><input value={modUser} onChange={e=>setModUser(e.target.value)} className="w-full bg-brand-surfaceHighlight border border-brand-border rounded p-2 text-brand-text"/></div>
                      <div><label className="text-xs text-brand-textMuted font-bold uppercase block mb-1">Senha</label><input type="password" value={modPass} onChange={e=>setModPass(e.target.value)} className="w-full bg-brand-surfaceHighlight border border-brand-border rounded p-2 text-brand-text"/></div>
                      <button className="w-full bg-brand-primary text-white font-bold py-2 rounded shadow-lg">Criar Moderador</button>
                  </form>
              </div>
              <div className="lg:col-span-2 bg-brand-surface p-6 rounded-xl border border-brand-border">
                  <h3 className="text-xl font-bold text-brand-text mb-6">Equipe de Moderação</h3>
                  <div className="space-y-4">
                      {state.users.filter(u => u.role === UserRole.MODERATOR).map(mod => (
                          <div key={mod.id} className="bg-brand-surfaceHighlight border border-brand-border p-4 rounded-lg flex justify-between items-center">
                              <div className="flex items-center gap-3"><div className="p-2 bg-blue-900/30 rounded text-blue-400"><Shield size={20}/></div><div><p className="font-bold text-brand-text">{mod.name}</p><p className="text-xs text-brand-textMuted">@{mod.username}</p></div></div>
                              <button onClick={() => onDeleteUser(mod.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded transition-colors"><Trash2 size={18}/></button>
                          </div>
                      ))}
                      {state.users.filter(u => u.role === UserRole.MODERATOR).length === 0 && <p className="text-brand-textMuted italic text-center py-10 border border-dashed border-brand-border rounded-lg">Nenhum moderador ativo.</p>}
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'plans' && !loadingTabs.has('plans') && (
          <div className="space-y-8 animate-in fade-in">
              {/* Upgrade Requests Section */}
              <div className="bg-brand-surface p-6 rounded-xl border border-brand-border">
                  <h3 className="text-xl font-bold text-brand-text mb-6 flex items-center gap-2"><ArrowUp className="text-brand-primary"/> Solicitações de Upgrade</h3>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-brand-surfaceHighlight text-brand-textMuted uppercase text-xs font-bold">
                              <tr>
                                  <th className="p-4">Organizador</th>
                                  <th className="p-4">Plano Desejado</th>
                                  <th className="p-4">Data</th>
                                  <th className="p-4 text-center">Status</th>
                                  <th className="p-4 text-right">Ações</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-border">
                              {(state.planUpgradeRequests || []).filter(r => r.status === 'PENDING').map(req => {
                                  const user = state.users.find(u => u.id === req.userId);
                                  return (
                                      <tr key={req.id} className="hover:bg-brand-surfaceHighlight transition-colors animate-pulse-slow">
                                          <td className="p-4">
                                              <div className="font-bold text-brand-text">{user?.name || 'User Deletado'}</div>
                                              <div className="text-[10px] text-brand-textMuted uppercase">@{user?.username}</div>
                                          </td>
                                          <td className="p-4">
                                              <span className={`px-2 py-0.5 rounded text-[10px] font-black italic ${req.requestedPlan === PlanType.ELITE ? 'text-yellow-500' : 'text-blue-500'}`}>{req.requestedPlan}</span>
                                          </td>
                                          <td className="p-4 text-brand-textMuted text-xs">
                                              {new Date(req.timestamp).toLocaleString()}
                                          </td>
                                          <td className="p-4 text-center">
                                              <span className="bg-yellow-900/30 text-yellow-500 border border-yellow-700/50 px-2 py-1 rounded text-[10px] font-black uppercase">Aguardando</span>
                                          </td>
                                          <td className="p-4 text-right flex gap-2 justify-end">
                                              <button onClick={() => onApproveUpgrade(req.id)} className="p-2 bg-green-600 hover:bg-green-500 text-white rounded shadow-lg transition-all" title="Aprovar Upgrade"><Check size={16}/></button>
                                              <button onClick={() => onRejectUpgrade(req.id)} className="p-2 bg-red-600 hover:bg-red-500 text-white rounded shadow-lg transition-all" title="Recusar"><X size={16}/></button>
                                          </td>
                                      </tr>
                                  );
                              })}
                              {(state.planUpgradeRequests || []).filter(r => r.status === 'PENDING').length === 0 && (
                                  <tr>
                                      <td colSpan={5} className="p-8 text-center text-brand-textMuted italic">Nenhuma solicitação de upgrade pendente.</td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>

              <div className="bg-brand-surface p-6 rounded-xl border border-brand-border">
                  <h3 className="text-xl font-bold text-brand-text mb-6 flex items-center gap-2"><Tag /> Configuração de Limites por Plano</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {Object.values(PlanType).map(type => {
                          const cfg = getPlanConfig(type);
                          return (
                              <div key={type} className={`p-6 rounded-xl border-2 ${type === 'ELITE' ? 'border-yellow-500/30 bg-yellow-500/5' : type === 'PRO' ? 'border-blue-500/30 bg-blue-500/5' : 'border-brand-border bg-brand-surfaceHighlight'}`}>
                                  <h4 className={`text-2xl font-black italic mb-4 ${type === 'ELITE' ? 'text-yellow-500' : type === 'PRO' ? 'text-blue-500' : 'text-brand-text'}`}>{type}</h4>
                                  <div className="space-y-4">
                                      <div><label className="text-[10px] text-brand-textMuted font-bold uppercase mb-1 block">Preço Mensal</label><input value={cfg.price || ''} onChange={e=>handlePlanEditChange(type, 'price', e.target.value)} className="w-full bg-black border border-brand-border rounded p-2 text-white font-mono shadow-inner"/></div>
                                      <div><label className="text-[10px] text-brand-textMuted font-bold uppercase mb-1 block">Máx. Grupos</label><input type="number" value={cfg.maxGroups || 0} onChange={e=>handlePlanEditChange(type, 'maxGroups', parseInt(e.target.value))} className="w-full bg-black border border-brand-border rounded p-2 text-white font-mono shadow-inner"/></div>
                                      <div><label className="text-[10px] text-brand-textMuted font-bold uppercase mb-1 block">Máx. Times</label><input type="number" value={cfg.maxTeams || 0} onChange={e=>handlePlanEditChange(type, 'maxTeams', parseInt(e.target.value))} className="w-full bg-black border border-brand-border rounded p-2 text-white font-mono shadow-inner"/></div>
                                      <div className="flex items-center gap-2 bg-black/30 p-2 rounded border border-white/5"><input type="checkbox" checked={cfg.canExport} onChange={e=>handlePlanEditChange(type, 'canExport', e.target.checked)} className="w-4 h-4 accent-brand-primary"/><label className="text-xs text-brand-text font-bold uppercase tracking-tighter">Exportação Excel/JSON</label></div>
                                      <div className="flex items-center gap-2 bg-black/30 p-2 rounded border border-white/5"><input type="checkbox" checked={cfg.customization} onChange={e=>handlePlanEditChange(type, 'customization', e.target.checked)} className="w-4 h-4 accent-brand-primary"/><label className="text-xs text-brand-text font-bold uppercase tracking-tighter">Branding (White-Label)</label></div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'ads' && !loadingTabs.has('ads') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
              <div className="lg:col-span-1 bg-brand-surface p-6 rounded-xl border border-brand-border">
                  <h3 className="text-xl font-bold text-brand-text mb-6 flex items-center gap-2"><Megaphone /> Novo Anúncio</h3>
                  <form onSubmit={handleAddAd} className="space-y-4">
                      <div><label className="text-xs text-brand-textMuted font-bold uppercase block mb-1">Título</label><input value={adTitle} onChange={e=>setAdTitle(e.target.value)} className="w-full bg-brand-surfaceHighlight border border-brand-border rounded p-2 text-brand-text"/></div>
                      <div><label className="text-xs text-brand-textMuted font-bold uppercase block mb-1">Link de Redirecionamento</label><input value={adLink} onChange={e=>setAdLink(e.target.value)} className="w-full bg-brand-surfaceHighlight border border-brand-border rounded p-2 text-brand-text"/></div>
                      <div>
                          <label className="text-xs text-brand-textMuted font-bold uppercase block mb-1">Banner (Imagem)</label>
                          <div className="flex flex-col gap-2">
                              <label className="cursor-pointer bg-brand-surfaceHighlight border border-brand-border border-dashed rounded-lg p-6 flex flex-col items-center gap-2 hover:bg-brand-border transition-colors">
                                  {adImage ? <img src={adImage} className="h-32 object-contain" /> : <><Image className="text-brand-textMuted" size={32}/><span className="text-xs text-brand-textMuted">Clique para Upload</span></>}
                                  <input type="file" hidden accept="image/*" onChange={handleAdImageUpload} />
                              </label>
                              <p className="text-[10px] text-brand-textMuted text-center italic">Recomendado: 1200x400px</p>
                          </div>
                      </div>
                      <button className="w-full bg-brand-primary text-white font-bold py-2 rounded shadow-lg">Publicar Anúncio</button>
                  </form>
              </div>
              <div className="lg:col-span-2 bg-brand-surface p-6 rounded-xl border border-brand-border">
                  <h3 className="text-xl font-bold text-brand-text mb-6">Campanhas Ativas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {state.ads.map(ad => (
                          <div key={ad.id} className="bg-brand-surfaceHighlight border border-brand-border rounded-xl overflow-hidden flex flex-col">
                              <img src={ad.imageUrl} className="h-32 object-cover" />
                              <div className="p-3 flex justify-between items-center">
                                  <div className="min-w-0">
                                      <p className="font-bold text-brand-text truncate">{ad.title}</p>
                                      <p className="text-[10px] text-brand-textMuted truncate">{ad.linkUrl}</p>
                                  </div>
                                  <button onClick={() => onDeleteAd(ad.id)} className="text-red-500 p-2 hover:bg-red-500/10 rounded"><Trash2 size={18}/></button>
                              </div>
                          </div>
                      ))}
                      {state.ads.length === 0 && <p className="text-brand-textMuted italic text-center py-10 col-span-full border border-dashed border-brand-border rounded-lg">Nenhum anúncio em exibição.</p>}
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'news' && !loadingTabs.has('news') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
               <div className="lg:col-span-1 bg-brand-surface p-6 rounded-xl border border-brand-border">
                  <h3 className="text-xl font-bold text-brand-text mb-6 flex items-center gap-2"><FileText /> Publicar Notícia</h3>
                  <form onSubmit={handleAddNews} className="space-y-4">
                      <div><label className="text-xs text-brand-textMuted font-bold uppercase block mb-1">Título</label><input value={newsTitle} onChange={e=>setNewsTitle(e.target.value)} className="w-full bg-brand-surfaceHighlight border border-brand-border rounded p-2 text-brand-text"/></div>
                      <div>
                          <label className="text-xs text-brand-textMuted font-bold uppercase block mb-1">Tipo</label>
                          <select value={newsType} onChange={e=>setNewsType(e.target.value as any)} className="w-full bg-brand-surfaceHighlight border border-brand-border rounded p-2 text-brand-text">
                              <option value="INFO">Informação</option>
                              <option value="PROMO">Promoção</option>
                              <option value="ALERT">Alerta</option>
                          </select>
                      </div>
                      <div><label className="text-xs text-brand-textMuted font-bold uppercase block mb-1">Conteúdo</label><textarea value={newsContent} onChange={e=>setNewsContent(e.target.value)} className="w-full bg-brand-surfaceHighlight border border-brand-border rounded p-2 text-brand-text h-32"/></div>
                      <button className="w-full bg-brand-primary text-white font-bold py-2 rounded shadow-lg">Lançar Notícia</button>
                  </form>
              </div>
              <div className="lg:col-span-2 bg-brand-surface p-6 rounded-xl border border-brand-border">
                  <h3 className="text-xl font-bold text-brand-text mb-6">Mural de Notícias</h3>
                  <div className="space-y-4">
                      {state.news.map(n => (
                          <div key={n.id} className="bg-brand-surfaceHighlight border border-brand-border p-4 rounded-xl flex justify-between items-start">
                              <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${n.type === 'ALERT' ? 'bg-red-500 text-white' : n.type === 'PROMO' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>{n.type}</span>
                                      <span className="text-[10px] text-brand-textMuted">{new Date(n.date).toLocaleString()}</span>
                                  </div>
                                  <h4 className="font-bold text-brand-text">{n.title}</h4>
                                  <p className="text-sm text-brand-textMuted line-clamp-2 mt-1">{n.content}</p>
                              </div>
                              <button onClick={() => onDeleteNews(n.id)} className="text-red-500 p-2 hover:bg-red-500/10 rounded shrink-0"><Trash2 size={18}/></button>
                          </div>
                      ))}
                      {state.news.length === 0 && <p className="text-brand-textMuted italic text-center py-10 border border-dashed border-brand-border rounded-lg">Nenhuma notícia publicada.</p>}
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'official' && !loadingTabs.has('official') && (
          <div className="bg-brand-surface p-6 rounded-xl border border-brand-border animate-in fade-in">
              <h3 className="text-xl font-bold text-brand-text mb-4 flex items-center gap-2"><Crown className="text-yellow-500"/> Gestão de Campeonatos Oficiais</h3>
              <p className="text-sm text-brand-textMuted mb-6">Campeonatos oficiais podem ter redes sociais e links externos configurados para aparecerem na tela de login de todos os usuários.</p>
              
              <div className="overflow-x-auto">
                   <table className="w-full text-left">
                       <thead className="bg-brand-surfaceHighlight text-brand-textMuted uppercase text-xs">
                           <tr>
                               <th className="p-4">Campeonato</th>
                               <th className="p-4">Organizador</th>
                               <th className="p-4">Status</th>
                               <th className="p-4 text-center">Oficial</th>
                               <th className="p-4 text-right">Ações</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-brand-border">
                           {state.tournaments.map(t => {
                               const organizer = state.users.find(u => u.id === t.organizadorId);
                               return (
                                   <tr key={t.id} className="hover:bg-brand-surfaceHighlight transition-colors">
                                       <td className="p-4">
                                           <div className="font-bold text-brand-text">{t.name}</div>
                                           <div className="text-[10px] text-brand-textMuted uppercase">{t.format}</div>
                                       </td>
                                       <td className="p-4 text-sm text-brand-textMuted">
                                           {organizer?.name || 'Sistema'}
                                       </td>
                                       <td className="p-4">
                                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.status === 'ACTIVE' ? 'text-green-500' : 'text-yellow-500'}`}>{t.status}</span>
                                       </td>
                                       <td className="p-4 text-center">
                                            <button 
                                               onClick={() => onToggleOfficialTournament(t.id)}
                                               className={`p-2 rounded-full transition-all ${t.isOfficial ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-brand-surface border border-brand-border text-brand-textMuted hover:text-yellow-500'}`}
                                            >
                                                <Crown size={18}/>
                                            </button>
                                       </td>
                                       <td className="p-4 text-right">
                                           <button onClick={() => onDeleteTournament(t.id)} className="text-red-500 hover:text-white p-2 hover:bg-red-600 rounded transition-colors"><Trash2 size={16}/></button>
                                       </td>
                                   </tr>
                               );
                           })}
                           {state.tournaments.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-brand-textMuted italic">Sem campeonatos registrados.</td></tr>}
                       </tbody>
                   </table>
              </div>
          </div>
      )}

      {hasChanges && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-brand-surface/90 backdrop-blur-md border-t border-brand-primary/50 flex flex-col md:flex-row justify-between items-center gap-4 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-full text-yellow-400 animate-pulse"><AlertTriangle size={24}/></div>
                  <div>
                      <h4 className="text-brand-text font-bold text-lg">Alterações Pendentes</h4>
                      <p className="text-brand-textMuted text-sm">Você tem modificações não salvas no painel.</p>
                  </div>
              </div>
              <div className="flex gap-4">
                  <button onClick={() => { setPendingSettings({}); setEditingPlans({}); setHasChanges(false); }} className="px-6 py-3 rounded-xl font-bold text-brand-textMuted hover:text-brand-text hover:bg-white/10 transition-colors">Descartar</button>
                  <button onClick={handleSaveChanges} className="px-8 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"><Save size={20}/> Salvar Alterações</button>
              </div>
          </div>
      )}
      {isImportModalOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-brand-surface p-8 rounded-2xl border border-brand-border w-full max-w-2xl shadow-2xl">
                  <h3 className="text-xl font-bold text-brand-text mb-4">Importar Lista de Jogadores</h3>
                  <p className="text-brand-textMuted text-sm mb-4">Cole a lista no formato: Nome,Posição,Overall,Nacionalidade,Clube</p>
                  <textarea 
                      value={bulkPlayersText} 
                      onChange={e => setBulkPlayersText(e.target.value)} 
                      placeholder="Kylian Mbappe,ATA,91,França,PSG&#10;Erling Haaland,ATA,91,Noruega,Manchester City" 
                      className="w-full bg-black border border-brand-border rounded-xl p-4 text-white h-64 outline-none focus:border-brand-primary mb-6"
                  />
                  <div className="flex justify-end gap-4">
                      <button onClick={() => setIsImportModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-brand-textMuted hover:text-brand-text hover:bg-white/10 transition-colors">Cancelar</button>
                      <button onClick={handleProcessPlayerList} className="px-8 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-bold shadow-lg">Processar Lista</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;