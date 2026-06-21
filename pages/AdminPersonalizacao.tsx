import React, { useState, useEffect, useRef } from 'react';
import { toast } from '../src/lib/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AppState, AppSettings } from '../types';
import { uploadFile } from '../services/supabase';
import { useLocale } from '../src/contexts/LocaleContext';

interface AdminPersonalizacaoProps {
    state: AppState;
    onUpdateSettings: (settings: Partial<AppSettings>) => void;
    onBack: () => void;
}

// ─── Presets exclusivos PRO WORLD ARENA — sem referências a ligas reais ──────
const PRESETS = [
  {
    id: 'padrao',
    nome: 'PRO WORLD Padrão',
    desc: 'Cinza grafite profundo + laranja vibrante',
    corPrimaria: '#FF6A00',
    background: '#1A1C22',
    superficie: '#20242D',
    texto: '#F2F2F2',
  },
  {
    id: 'carbon',
    nome: 'Carbon Elite',
    desc: 'Preto carbono com laranja neon',
    corPrimaria: '#FF4500',
    background: '#0D0E11',
    superficie: '#161820',
    texto: '#EDEDED',
  },
  {
    id: 'steel',
    nome: 'Steel Blue',
    desc: 'Cinza aço com azul elétrico',
    corPrimaria: '#3B82F6',
    background: '#111827',
    superficie: '#1E2535',
    texto: '#F0F4FF',
  },
  {
    id: 'night',
    nome: 'Night Purple',
    desc: 'Noite escura com roxo neon',
    corPrimaria: '#9333EA',
    background: '#12101A',
    superficie: '#1C1828',
    texto: '#EDE9FF',
  },
  {
    id: 'esmeralda',
    nome: 'Esmeralda Pro',
    desc: 'Grafite escuro com verde esmeralda',
    corPrimaria: '#10B981',
    background: '#0F1714',
    superficie: '#172420',
    texto: '#E8FFF5',
  },
  {
    id: 'crimson',
    nome: 'Crimson Arena',
    desc: 'Escuro intenso com vermelho vivo',
    corPrimaria: '#EF4444',
    background: '#150E0E',
    superficie: '#201515',
    texto: '#FFF0F0',
  },
];

// ─── Componente de swatch de cor ──────────────────────────────────────────────
const ColorInput: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}> = ({ label, value, onChange, hint }) => (
  <div className="space-y-2">
    <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">{label}</label>
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--primary)]/50 transition-colors">
      <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 cursor-pointer"
           style={{ backgroundColor: value }}>
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        />
      </div>
      <input
        type="text"
        value={value.toUpperCase()}
        onChange={e => onChange(e.target.value)}
        maxLength={7}
        className="flex-1 bg-transparent text-[var(--text-main)] font-mono text-sm uppercase outline-none border-none"
      />
    </div>
    {hint && <p className="text-[10px] text-[var(--text-secondary)] italic">{hint}</p>}
  </div>
);

// ─── Upload de imagem com preview ─────────────────────────────────────────────
const ImageUploadBox: React.FC<{
  label: string;
  desc: string;
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
  aspect?: string;
}> = ({ label, desc, value, onChange, onUpload, aspect = 'aspect-video' }) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await onUpload(file);
      onChange(url);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar imagem.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">{label}</p>
        <p className="text-[11px] text-[var(--text-secondary)] opacity-60 mt-0.5">{desc}</p>
      </div>
      <div
        className={`relative ${aspect} bg-[var(--bg-card)] rounded-xl border-2 border-dashed border-[var(--border)] overflow-hidden group cursor-pointer hover:border-[var(--primary)]/60 transition-colors`}
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <>
            <img src={value} alt={label} className="absolute inset-0 w-full h-full object-contain p-2" />
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-all">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
              <span className="text-white text-[11px] font-bold uppercase tracking-widest">Trocar imagem</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[var(--text-secondary)]">
            {uploading ? (
              <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-50">Clique para enviar</span>
              </>
            )}
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleFile} />
      </div>
      {value && (
        <button
          onClick={() => onChange('')}
          className="text-[11px] text-red-400 hover:text-red-300 transition-colors font-bold uppercase tracking-wider"
        >
          × Remover imagem
        </button>
      )}
    </div>
  );
};

// ─── Ajuste de imagem do card (arrastar livre + zoom) ─────────────────────────
const CardImageAdjuster: React.FC<{
  image: string;
  zoom: number;
  posX: number;
  posY: number;
  bgGradient: string;
  accentColor: string;
  label: string;
  onChange: (vals: { zoom?: number; posX?: number; posY?: number }) => void;
}> = ({ image, zoom, posX, posY, bgGradient, accentColor, label, onChange }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const start = useRef({ mx: 0, my: 0, px: 50, py: 100 });

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    start.current = { mx: e.clientX, my: e.clientY, px: posX, py: posY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    const dx = ((e.clientX - start.current.mx) / rect.width) * 100;
    const dy = ((e.clientY - start.current.my) / rect.height) * 100;
    onChange({
      posX: Math.max(-20, Math.min(120, start.current.px + dx)),
      posY: Math.max(-20, Math.min(120, start.current.py + dy)),
    });
  };
  const onPointerUp = () => { dragging.current = false; };

  return (
    <div className="bg-black/20 rounded-2xl p-5 border border-white/10">
      <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: accentColor }}>{label}</p>
      <p className="text-[10px] text-slate-500 mb-4">Arraste a imagem para posicionar. Use o zoom abaixo.</p>

      {/* Preview no formato vertical do card real */}
      <div
        ref={boxRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="relative w-44 h-64 mx-auto rounded-3xl overflow-hidden mb-4 border-2 border-white/10 cursor-move select-none touch-none"
        style={{ background: bgGradient }}
      >
        {/* Diagonais decorativas iguais ao card real */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -right-6 top-8 w-28 h-1.5 rotate-45" style={{ background: accentColor }}></div>
          <div className="absolute -left-6 bottom-16 w-28 h-1.5 -rotate-45 bg-yellow-400"></div>
        </div>
        <img src={image} draggable={false} className="absolute pointer-events-none drop-shadow-2xl"
          style={{
            height: `${zoom}%`,
            left: `${posX}%`,
            top: `${posY}%`,
            transform: 'translate(-50%, -50%)',
            objectFit: 'contain'
          }} />
        {/* Faixa inferior como no card real */}
        <div className="absolute bottom-0 inset-x-0 bg-black/40 py-1.5 text-center pointer-events-none">
          <span className="text-white font-black text-[9px] uppercase tracking-widest">Pré-visualização</span>
        </div>
      </div>

      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Zoom: {zoom}%</label>
      <input type="range" min="20" max="500" value={zoom} onChange={e => onChange({ zoom: +e.target.value })} className="w-full" style={{ accentColor }} />
      <div className="flex gap-2 mt-2">
        <button onClick={() => onChange({ zoom: Math.max(20, zoom - 10) })} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded py-1.5 text-xs font-bold text-slate-300">− Diminuir</button>
        <button onClick={() => onChange({ zoom: zoom + 10 })} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded py-1.5 text-xs font-bold text-slate-300">+ Aumentar</button>
      </div>
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────
const AdminPersonalizacao: React.FC<AdminPersonalizacaoProps> = ({ state, onUpdateSettings, onBack }) => {
  const { T } = useLocale();

  const [activeTab, setActiveTab] = useState<'cores' | 'imagens' | 'tipografia'>('cores');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [cores, setCores] = useState({
    corPrimaria: '#FF6A00',
    background:  '#1A1C22',
    superficie:  '#20242D',
    texto:       '#F2F2F2',
    ...(state.settings.globalTheme || {}),
  });

  const [imagens, setImagens] = useState({
    logo:    '',
    loginBg: '',
    homeBg:  '',
    favicon: '',
    experienceBg:    '',
    experienceX1:    '',
    experienceClubs: '',
    experienceX1Zoom:    100,
    experienceX1PosX:    50,
    experienceX1PosY:    100,
    experienceClubsZoom: 100,
    experienceClubsPosX: 50,
    experienceClubsPosY: 100,
    ...(state.settings.globalImages || {}),
  });

  const [textos, setTextos] = useState({
    nomePrimario:    state.settings.brandingTextPrimary   || 'PRO WORLD',
    nomeSecundario:  state.settings.brandingTextSecondary || 'ARENA',
    slogan:          '',
  });

  // Preview em tempo real
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary',   cores.corPrimaria);
    root.style.setProperty('--theme-bg',        cores.background);
    root.style.setProperty('--theme-surface',   cores.superficie);
    root.style.setProperty('--theme-text-main', cores.texto);
    root.style.setProperty('--primary',         cores.corPrimaria);
  }, [cores]);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setCores({
      corPrimaria: preset.corPrimaria,
      background:  preset.background,
      superficie:  preset.superficie,
      texto:       preset.texto,
    });
  };

  const handleUpload = async (field: string, file: File): Promise<string> => {
    // Validação
    if (file.size > 2 * 1024 * 1024) throw new Error('Imagem muito grande. Limite: 2MB.');
    const allowed = ['image/png','image/jpeg','image/webp','image/svg+xml'];
    if (!allowed.includes(file.type)) throw new Error('Formato inválido. Use PNG, JPG, WEBP ou SVG.');
    return await uploadFile('arena-assets', `customization/${field}_${Date.now()}`, file);
  };

  const handleSave = () => {
    setSaving(true);
    onUpdateSettings({
      globalTheme: cores,
      globalImages: imagens,
      brandingTextPrimary:   textos.nomePrimario,
      brandingTextSecondary: textos.nomeSecundario,
    });
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 700);
  };

  const TABS = [
    { id: 'cores',       icon: '🎨', label: 'Cores e Tema'     },
    { id: 'imagens',     icon: '🖼️',  label: 'Imagens e Logo'  },
    { id: 'tipografia',  icon: '🔡', label: 'Nome e Texto'     },
  ] as const;

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--theme-bg)' }}>

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--theme-surface-highlight)] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
               style={{ background: cores.corPrimaria + '25' }}>
            🎨
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">Personalização Global</h1>
            <p className="text-[11px] text-[var(--theme-text-muted)] uppercase tracking-widest">
              Identidade visual da plataforma
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-bold text-[var(--theme-text-muted)] hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-black transition-all shadow-lg"
            style={{ background: saving ? cores.corPrimaria + '80' : cores.corPrimaria }}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
            ) : saved ? (
              <span>✓</span>
            ) : (
              <span>↑</span>
            )}
            {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── SIDEBAR ── */}
        <div className="w-56 flex-shrink-0 border-r border-[var(--theme-surface-highlight)] flex flex-col overflow-y-auto"
             style={{ background: cores.superficie }}>

          {/* Tabs */}
          <div className="p-3 space-y-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all text-left ${
                  activeTab === tab.id
                    ? 'text-black'
                    : 'text-[var(--theme-text-muted)] hover:text-white hover:bg-white/5'
                }`}
                style={activeTab === tab.id ? { background: cores.corPrimaria } : {}}
              >
                <span className="text-base">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Presets — só visíveis na aba cores */}
          {activeTab === 'cores' && (
            <div className="p-3 border-t border-white/5 mt-2">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--theme-text-muted)] mb-3 px-1">
                Presets rápidos
              </p>
              <div className="space-y-1.5">
                {PRESETS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-black/20 hover:bg-black/40 border border-transparent hover:border-white/10 transition-all text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-white truncate">{p.nome}</p>
                      <p className="text-[10px] text-[var(--theme-text-muted)] truncate">{p.desc}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      <div className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ background: p.corPrimaria }} />
                      <div className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ background: p.background }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mini preview do tema atual */}
          <div className="mt-auto p-3 border-t border-white/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] mb-2">Preview atual</p>
            <div className="rounded-lg overflow-hidden border border-white/10" style={{ background: cores.background }}>
              <div className="px-3 py-2 flex items-center gap-2 border-b border-white/5" style={{ background: cores.superficie }}>
                <div className="w-4 h-4 rounded" style={{ background: cores.corPrimaria }} />
                <span className="text-[10px] font-black truncate" style={{ color: cores.texto }}>
                  {textos.nomePrimario}
                </span>
              </div>
              <div className="p-2 space-y-1">
                {[1,2].map(i => (
                  <div key={i} className="h-2 rounded-full opacity-30" style={{ background: cores.texto, width: i === 1 ? '80%' : '60%' }} />
                ))}
                <div className="h-5 rounded mt-2" style={{ background: cores.corPrimaria, width: '50%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── CONTEÚDO PRINCIPAL ── */}
        <div className="flex-1 overflow-y-auto p-8" style={{ background: cores.background }}>

          <AnimatePresence mode="wait">

            {/* ──────────────── CORES ──────────────── */}
            {activeTab === 'cores' && (
              <motion.div
                key="cores"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="max-w-2xl space-y-8"
              >
                <div>
                  <h2 className="text-xl font-black text-white mb-1">Paleta de Cores</h2>
                  <p className="text-sm text-[var(--theme-text-muted)]">
                    As cores se aplicam em toda a plataforma em tempo real. Salve para persistir.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <ColorInput
                    label="Cor Primária"
                    value={cores.corPrimaria}
                    onChange={v => setCores(p => ({ ...p, corPrimaria: v }))}
                    hint="Botões, destaques, ícones ativos e badges"
                  />
                  <ColorInput
                    label="Cor de Fundo Global"
                    value={cores.background}
                    onChange={v => setCores(p => ({ ...p, background: v }))}
                    hint="Fundo principal das páginas"
                  />
                  <ColorInput
                    label="Cor de Superfície (Cards)"
                    value={cores.superficie}
                    onChange={v => setCores(p => ({ ...p, superficie: v }))}
                    hint="Cards, sidebars, modais"
                  />
                  <ColorInput
                    label="Cor do Texto Principal"
                    value={cores.texto}
                    onChange={v => setCores(p => ({ ...p, texto: v }))}
                    hint="Títulos, rótulos e textos de destaque"
                  />
                </div>

                {/* Preview de componentes */}
                <div className="rounded-2xl border border-white/10 overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/10" style={{ background: cores.superficie }}>
                    <p className="text-[11px] font-black uppercase tracking-widest text-[var(--theme-text-muted)]">Preview de componentes</p>
                  </div>
                  <div className="p-6 space-y-5" style={{ background: cores.background }}>
                    <div className="flex flex-wrap gap-3">
                      <button className="px-5 py-2 rounded-xl font-bold text-sm shadow-lg" style={{ background: cores.corPrimaria, color: cores.background }}>
                        Botão Principal
                      </button>
                      <button className="px-5 py-2 rounded-xl font-bold text-sm border border-white/10" style={{ background: cores.superficie, color: cores.texto }}>
                        Botão Secundário
                      </button>
                      <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase" style={{ background: cores.corPrimaria + '25', color: cores.corPrimaria }}>
                        Badge Elite
                      </span>
                    </div>
                    <div className="rounded-xl p-4 border" style={{ background: cores.superficie, borderColor: cores.corPrimaria + '30' }}>
                      <p className="font-black text-sm mb-1" style={{ color: cores.corPrimaria }}>Card de exemplo</p>
                      <p className="text-xs opacity-70" style={{ color: cores.texto }}>
                        Visualize como os elementos ficam com sua paleta aplicada.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ──────────────── IMAGENS ──────────────── */}
            {activeTab === 'imagens' && (
              <motion.div
                key="imagens"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="max-w-2xl space-y-8"
              >
                <div>
                  <h2 className="text-xl font-black text-white mb-1">Imagens e Logo</h2>
                  <p className="text-sm text-[var(--theme-text-muted)]">
                    Envie PNG, JPG, WEBP ou SVG. Máximo 2MB por arquivo.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <ImageUploadBox
                    label="Logo Principal"
                    desc="Aparece no sidebar e no login"
                    value={imagens.logo}
                    onChange={v => setImagens(p => ({ ...p, logo: v }))}
                    onUpload={f => handleUpload('logo', f)}
                    aspect="aspect-square"
                  />
                  <ImageUploadBox
                    label="Favicon"
                    desc="Ícone da aba do navegador (recomendado: 64×64px)"
                    value={imagens.favicon}
                    onChange={v => setImagens(p => ({ ...p, favicon: v }))}
                    onUpload={f => handleUpload('favicon', f)}
                    aspect="aspect-square"
                  />
                  <ImageUploadBox
                    label="Background do Login"
                    desc="Imagem lateral da tela de acesso"
                    value={imagens.loginBg}
                    onChange={v => setImagens(p => ({ ...p, loginBg: v }))}
                    onUpload={f => handleUpload('loginBg', f)}
                  />
                  <ImageUploadBox
                    label="Banner da Home"
                    desc="Imagem de destaque na página inicial"
                    value={imagens.homeBg}
                    onChange={v => setImagens(p => ({ ...p, homeBg: v }))}
                    onUpload={f => handleUpload('homeBg', f)}
                  />
                  <ImageUploadBox
                    label="Fundo 'Como Deseja Jogar'"
                    desc="Imagem de fundo da tela de seleção de experiência"
                    value={imagens.experienceBg}
                    onChange={v => setImagens(p => ({ ...p, experienceBg: v }))}
                    onUpload={f => handleUpload('experienceBg', f)}
                  />
                  <ImageUploadBox
                    label="Imagem Card X1"
                    desc="Jogador/imagem em destaque no card X1"
                    value={imagens.experienceX1}
                    onChange={v => setImagens(p => ({ ...p, experienceX1: v }))}
                    onUpload={f => handleUpload('experienceX1', f)}
                  />
                  <ImageUploadBox
                    label="Imagem Card Pro Clubs"
                    desc="Jogador/imagem em destaque no card Pro Clubs (11x11)"
                    value={imagens.experienceClubs}
                    onChange={v => setImagens(p => ({ ...p, experienceClubs: v }))}
                    onUpload={f => handleUpload('experienceClubs', f)}
                  />
                </div>

                {/* AJUSTES DE POSIÇÃO E ZOOM DAS IMAGENS DOS CARDS */}
                {(imagens.experienceX1 || imagens.experienceClubs) && (
                  <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {imagens.experienceX1 && (
                      <CardImageAdjuster
                        image={imagens.experienceX1}
                        zoom={imagens.experienceX1Zoom}
                        posX={imagens.experienceX1PosX}
                        posY={imagens.experienceX1PosY}
                        bgGradient="linear-gradient(135deg, #1e3a5f, #0f4c75)"
                        accentColor="#22d3ee"
                        label="Ajustar Imagem Card X1"
                        onChange={vals => setImagens(p => ({
                          ...p,
                          ...(vals.zoom !== undefined ? { experienceX1Zoom: vals.zoom } : {}),
                          ...(vals.posX !== undefined ? { experienceX1PosX: vals.posX } : {}),
                          ...(vals.posY !== undefined ? { experienceX1PosY: vals.posY } : {}),
                        }))}
                      />
                    )}
                    {imagens.experienceClubs && (
                      <CardImageAdjuster
                        image={imagens.experienceClubs}
                        zoom={imagens.experienceClubsZoom}
                        posX={imagens.experienceClubsPosX}
                        posY={imagens.experienceClubsPosY}
                        bgGradient="linear-gradient(135deg, #4a148c, #6a1b9a)"
                        accentColor="#c084fc"
                        label="Ajustar Imagem Card Pro Clubs"
                        onChange={vals => setImagens(p => ({
                          ...p,
                          ...(vals.zoom !== undefined ? { experienceClubsZoom: vals.zoom } : {}),
                          ...(vals.posX !== undefined ? { experienceClubsPosX: vals.posX } : {}),
                          ...(vals.posY !== undefined ? { experienceClubsPosY: vals.posY } : {}),
                        }))}
                      />
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ──────────────── TIPOGRAFIA / NOME ──────────────── */}
            {activeTab === 'tipografia' && (
              <motion.div
                key="tipografia"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="max-w-2xl space-y-8"
              >
                <div>
                  <h2 className="text-xl font-black text-white mb-1">Nome e Identidade</h2>
                  <p className="text-sm text-[var(--theme-text-muted)]">
                    O nome da plataforma exibido nos menus, login e cabeçalhos.
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--theme-text-muted)]">
                      Nome Principal
                    </label>
                    <input
                      value={textos.nomePrimario}
                      onChange={e => setTextos(p => ({ ...p, nomePrimario: e.target.value.toUpperCase() }))}
                      maxLength={20}
                      placeholder="EX: LIGA"
                      className="w-full rounded-xl px-4 py-3 font-black text-lg uppercase outline-none border transition-colors"
                      style={{
                        background: cores.superficie,
                        color: cores.texto,
                        borderColor: cores.corPrimaria + '40',
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--theme-text-muted)]">
                      Destaque / Sufixo
                      <span className="ml-2 normal-case font-normal">(aparece em laranja)</span>
                    </label>
                    <input
                      value={textos.nomeSecundario}
                      onChange={e => setTextos(p => ({ ...p, nomeSecundario: e.target.value.toUpperCase() }))}
                      maxLength={20}
                      placeholder="EX: ARENA"
                      className="w-full rounded-xl px-4 py-3 font-black text-lg uppercase outline-none border transition-colors"
                      style={{
                        background: cores.superficie,
                        color: cores.corPrimaria,
                        borderColor: cores.corPrimaria + '40',
                      }}
                    />
                  </div>

                  {/* Preview do nome */}
                  <div className="rounded-2xl p-6 border border-white/10 flex items-center justify-center"
                       style={{ background: cores.superficie }}>
                    <h1 className="text-4xl font-black italic tracking-tighter">
                      <span style={{ color: cores.texto }}>{textos.nomePrimario || 'PRO WORLD'} </span>
                      <span style={{ color: cores.corPrimaria }}>{textos.nomeSecundario || 'ARENA'}</span>
                    </h1>
                  </div>

                  <p className="text-[11px] text-[var(--theme-text-muted)] italic">
                    Exibido no sidebar, login, cabeçalho e páginas públicas.
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminPersonalizacao;
