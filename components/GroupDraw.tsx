import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Trophy, Sparkles, Check } from './Icons';

interface Participant {
  id: string;
  name: string;
  logoUrl?: string;
}

interface GroupDrawProps {
  participants: Participant[];
  groupCount: number;
  mode?: 'groups' | 'knockout';
  tournamentName: string;
  tournamentLogo?: string;
  themeColor?: string;
  onConfirm: (assignments: { participant: Participant; groupIndex: number }[]) => void;
  onClose: () => void;
}

const GROUP_COLORS = [
  '#FF6A00', '#3B82F6', '#22C55E', '#A855F7',
  '#EAB308', '#EC4899', '#06B6D4', '#EF4444',
  '#14B8A6', '#F97316', '#8B5CF6', '#10B981',
];

const GroupDraw: React.FC<GroupDrawProps> = ({
  participants, groupCount, mode = 'groups', tournamentName, tournamentLogo, themeColor = '#FF6A00', onConfirm, onClose,
}) => {
  // Ordem sorteada (embaralhada uma vez na montagem)
  const shuffled = useMemo(() => {
    const arr = [...participants];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [participants]);

  const [drawnCount, setDrawnCount] = useState(0);
  const [revealing, setRevealing] = useState<Participant | null>(null);
  const [groupOf, setGroupOf] = useState<Record<string, number>>({});
  const [autoRunning, setAutoRunning] = useState(false);

  const safeGroupCount = Math.max(1, groupCount);
  const groupNames = mode === 'knockout'
    ? Array.from({ length: safeGroupCount }, (_, i) => `Chave ${i + 1}`)
    : Array.from({ length: safeGroupCount }, (_, i) => `Grupo ${String.fromCharCode(65 + i)}`);
  const isComplete = drawnCount >= shuffled.length;
  const slotsPerGroup = Math.max(1, Math.ceil(shuffled.length / safeGroupCount));

  // Para onde o próximo participante vai (rodízio)
  const nextGroupIndex = drawnCount % safeGroupCount;

  // Layout do tabuleiro: nº de colunas conforme quantidade de grupos
  const cols = safeGroupCount <= 2 ? 2
    : safeGroupCount <= 4 ? 2
    : safeGroupCount <= 6 ? 3
    : safeGroupCount <= 9 ? 3
    : 4;

  const drawNext = () => {
    if (isComplete || revealing || autoRunning) return;
    const participant = shuffled[drawnCount];
    const groupIndex = drawnCount % safeGroupCount;
    setRevealing(participant);
    setTimeout(() => {
      setGroupOf(prev => ({ ...prev, [participant.id]: groupIndex }));
      setRevealing(null);
      setDrawnCount(c => c + 1);
    }, 1300);
  };

  const drawAll = () => {
    if (autoRunning || isComplete || revealing) return;
    setAutoRunning(true);
    let idx = drawnCount;
    const step = () => {
      if (idx >= shuffled.length) { setAutoRunning(false); return; }
      const participant = shuffled[idx];
      const groupIndex = idx % safeGroupCount;
      setRevealing(participant);
      setTimeout(() => {
        setGroupOf(prev => ({ ...prev, [participant.id]: groupIndex }));
        setRevealing(null);
        setDrawnCount(c => c + 1);
        idx++;
        setTimeout(step, 260);
      }, 720);
    };
    step();
  };

  const handleConfirm = () => {
    const assignments = shuffled.map((p, i) => ({
      participant: p,
      groupIndex: groupOf[p.id] ?? (i % safeGroupCount),
    }));
    onConfirm(assignments);
  };

  return (
    <div className="fixed inset-0 z-[300] flex flex-col"
         style={{ background: 'radial-gradient(ellipse at top, #1a1d2e 0%, #0d0e14 70%, #08090d 100%)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          {tournamentLogo
            ? <img src={tournamentLogo} className="w-10 h-10 object-contain" alt="" />
            : <Trophy size={28} style={{ color: themeColor }} />}
          <div>
            <h2 className="text-white font-black italic uppercase tracking-tight text-lg leading-none">{tournamentName}</h2>
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: themeColor }}>
              {mode === 'knockout' ? 'Sorteio do Mata-Mata' : 'Sorteio de Grupos'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-sm font-bold tabular-nums hidden sm:block">
            {drawnCount} / {shuffled.length}
          </span>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* TABULEIRO de grupos (fundo sempre visível) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 relative">
        <div
          className="grid gap-3 md:gap-4 max-w-6xl mx-auto"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {groupNames.map((gName, gIdx) => {
            const color = GROUP_COLORS[gIdx % GROUP_COLORS.length];
            const membersInGroup = shuffled.filter(p => groupOf[p.id] === gIdx);
            const isTarget = (!!revealing || autoRunning) && nextGroupIndex === gIdx;
            const emptySlots = Math.max(0, slotsPerGroup - membersInGroup.length);
            return (
              <motion.div
                key={gIdx}
                animate={isTarget ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl border overflow-hidden flex flex-col"
                style={{
                  borderColor: isTarget ? color : 'rgba(255,255,255,0.10)',
                  boxShadow: isTarget ? `0 0 28px ${color}66` : 'none',
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                <div className="py-2 px-3 text-center font-black uppercase tracking-widest text-xs text-black flex items-center justify-center gap-2"
                     style={{ background: color }}>
                  {gName}
                  <span className="bg-black/25 rounded-full px-1.5 text-[10px] tabular-nums">{membersInGroup.length}</span>
                </div>
                <div className="p-2 space-y-1.5 flex-1">
                  <AnimatePresence>
                    {membersInGroup.map(p => (
                      <motion.div
                        key={p.id}
                        initial={{ scale: 1.4, opacity: 0, y: -14 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                        className="flex items-center gap-2 bg-black/40 rounded-lg px-2 py-1.5 border border-white/5"
                      >
                        {p.logoUrl
                          ? <img src={p.logoUrl} className="w-6 h-6 rounded-full object-contain flex-shrink-0" alt="" />
                          : <Shield size={16} className="text-white/40 flex-shrink-0" />}
                        <span className="text-white text-xs font-bold truncate">{p.name}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {/* slots vazios (mostra a capacidade) */}
                  {Array.from({ length: emptySlots }).map((_, i) => (
                    <div key={`empty-${i}`}
                         className="flex items-center gap-2 rounded-lg px-2 py-1.5 border border-dashed border-white/8">
                      <div className="w-6 h-6 rounded-full bg-white/5 flex-shrink-0" />
                      <span className="text-white/15 text-xs font-bold">—</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* OVERLAY de revelação (sobreposto, deixa o tabuleiro visível atrás) */}
      <AnimatePresence>
        {revealing && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
            style={{ background: 'rgba(8,9,13,0.55)', backdropFilter: 'blur(2px)' }}
          >
            <motion.div
              key={revealing.id}
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: [0.2, 1.2, 1], opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0, y: 120, filter: 'blur(3px)' }}
              transition={{ duration: 0.6, times: [0, 0.6, 1], ease: 'easeOut' }}
              className="flex flex-col items-center"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-2xl opacity-60 animate-pulse" style={{ background: themeColor }} />
                <div className="relative w-40 h-40 rounded-full border-4 bg-black/70 flex items-center justify-center shadow-2xl"
                     style={{ borderColor: themeColor, boxShadow: `0 0 60px ${themeColor}` }}>
                  {revealing.logoUrl
                    ? <img src={revealing.logoUrl} className="w-24 h-24 object-contain" alt="" />
                    : <Shield size={64} style={{ color: themeColor }} />}
                </div>
                <Sparkles className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" size={28} />
              </div>
              <motion.h3
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mt-5 text-3xl md:text-4xl font-black italic text-white uppercase tracking-tight text-center px-4"
              >
                {revealing.name}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="mt-2 text-lg font-black uppercase tracking-widest"
                style={{ color: GROUP_COLORS[nextGroupIndex % GROUP_COLORS.length] }}
              >
                → {groupNames[nextGroupIndex]}
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra de ações */}
      <div className="flex-shrink-0 border-t border-white/10 bg-black/50 px-5 py-4 flex items-center justify-center gap-3 relative z-20">
        {!isComplete ? (
          <>
            <button
              onClick={drawAll}
              disabled={autoRunning || !!revealing}
              className="px-8 py-3.5 rounded-full font-black uppercase tracking-widest text-black shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100 text-base"
              style={{ background: themeColor }}
            >
              {autoRunning ? 'Sorteando...' : '🎲 Sortear Tudo'}
            </button>
            {!autoRunning && (
              <button
                onClick={drawNext}
                disabled={!!revealing}
                className="px-6 py-3.5 rounded-full font-bold uppercase tracking-wider text-white/80 border border-white/20 hover:bg-white/10 transition-all text-sm disabled:opacity-40"
              >
                Um por um
              </button>
            )}
          </>
        ) : (
          <button
            onClick={handleConfirm}
            className="px-10 py-3.5 rounded-full font-black uppercase tracking-widest text-white shadow-2xl transition-all hover:scale-105 text-base bg-green-600 hover:bg-green-500 flex items-center gap-2"
          >
            <Check size={20} /> Confirmar Sorteio
          </button>
        )}
      </div>
    </div>
  );
};

export default GroupDraw;
