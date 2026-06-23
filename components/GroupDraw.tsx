import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Trophy, Sparkles } from './Icons';

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

  const groupNames = mode === 'knockout'
    ? Array.from({ length: groupCount }, (_, i) => `Chave ${i + 1}`)
    : Array.from({ length: groupCount }, (_, i) => `Grupo ${String.fromCharCode(65 + i)}`);
  const isComplete = drawnCount >= shuffled.length;

  const drawNext = () => {
    if (isComplete || revealing) return;
    const participant = shuffled[drawnCount];
    const groupIndex = drawnCount % groupCount; // distribui em rodízio

    setRevealing(participant);
    setTimeout(() => {
      setGroupOf(prev => ({ ...prev, [participant.id]: groupIndex }));
      setRevealing(null);
      setDrawnCount(c => c + 1);
    }, 1400);
  };

  // Sorteia TODOS automaticamente em sequência rápida
  const [autoRunning, setAutoRunning] = useState(false);
  const drawAll = () => {
    if (autoRunning || isComplete) return;
    setAutoRunning(true);
    let idx = drawnCount;
    const step = () => {
      if (idx >= shuffled.length) { setAutoRunning(false); return; }
      const participant = shuffled[idx];
      const groupIndex = idx % groupCount;
      setRevealing(participant);
      setTimeout(() => {
        setGroupOf(prev => ({ ...prev, [participant.id]: groupIndex }));
        setRevealing(null);
        setDrawnCount(c => c + 1);
        idx++;
        setTimeout(step, 200);
      }, 650);
    };
    step();
  };

  const handleConfirm = () => {
    const assignments = shuffled.map((p, i) => ({
      participant: p,
      groupIndex: groupOf[p.id] ?? (i % groupCount),
    }));
    onConfirm(assignments);
  };

  return (
    <div className="fixed inset-0 z-[300] flex flex-col"
         style={{ background: 'radial-gradient(ellipse at top, #1a1d2e 0%, #0d0e14 70%, #08090d 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          {tournamentLogo
            ? <img src={tournamentLogo} className="w-10 h-10 object-contain" alt="" />
            : <Trophy size={28} style={{ color: themeColor }} />}
          <div>
            <h2 className="text-white font-black italic uppercase tracking-tight text-lg leading-none">{tournamentName}</h2>
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: themeColor }}>{mode === 'knockout' ? 'Sorteio do Mata-Mata' : 'Sorteio de Grupos'}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Área central de revelação */}
      <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden">
        {/* Brilho de fundo */}
        <div className="absolute w-96 h-96 rounded-full blur-[120px] opacity-20" style={{ background: themeColor }} />

        <AnimatePresence mode="wait">
          {revealing ? (
            <motion.div
              key={revealing.id}
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{ scale: [0.1, 1.25, 1], opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0, y: -260, filter: 'blur(4px)' }}
              transition={{ duration: 0.7, times: [0, 0.6, 1], ease: 'easeOut' }}
              className="relative z-10 flex flex-col items-center"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-2xl opacity-60 animate-pulse" style={{ background: themeColor }} />
                <div className="relative w-44 h-44 rounded-full border-4 bg-black/60 flex items-center justify-center shadow-2xl"
                     style={{ borderColor: themeColor, boxShadow: `0 0 60px ${themeColor}` }}>
                  {revealing.logoUrl
                    ? <img src={revealing.logoUrl} className="w-28 h-28 object-contain" alt="" />
                    : <Shield size={70} style={{ color: themeColor }} />}
                </div>
                <Sparkles className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" size={28} />
              </div>
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 text-3xl md:text-4xl font-black italic text-white uppercase tracking-tight text-center px-4"
              >
                {revealing.name}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-2 text-lg font-black uppercase tracking-widest"
                style={{ color: GROUP_COLORS[(drawnCount % groupCount)] }}
              >
                → {groupNames[drawnCount % groupCount]}
              </motion.p>
            </motion.div>
          ) : !isComplete ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative z-10 flex flex-col items-center"
            >
              <div className="w-44 h-44 rounded-full border-4 border-dashed border-white/20 flex items-center justify-center">
                <span className="text-6xl font-black text-white/30">{drawnCount + 1}</span>
              </div>
              <p className="mt-6 text-white/50 uppercase tracking-widest text-sm font-bold">
                {drawnCount} de {shuffled.length} sorteados
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative z-10 flex flex-col items-center"
            >
              <Trophy size={80} style={{ color: themeColor }} className="animate-bounce" />
              <h3 className="mt-4 text-3xl font-black italic text-white uppercase">Sorteio Completo!</h3>
              <p className="text-white/50 uppercase tracking-widest text-sm font-bold mt-2">Todos os participantes foram distribuídos</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão de ação */}
        <div className="absolute bottom-8 z-20 flex items-center gap-3">
          {!isComplete ? (
            <>
              <button
                onClick={drawAll}
                disabled={autoRunning || !!revealing}
                className="px-10 py-4 rounded-full font-black uppercase tracking-widest text-white shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100 text-lg"
                style={{ background: themeColor }}
              >
                {autoRunning ? 'Sorteando...' : '🎲 Sortear Tudo'}
              </button>
              {!autoRunning && (
                <button
                  onClick={drawNext}
                  disabled={!!revealing}
                  className="px-6 py-4 rounded-full font-bold uppercase tracking-wider text-white/80 border border-white/20 hover:bg-white/10 transition-all text-sm disabled:opacity-40"
                >
                  Um por um
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleConfirm}
              className="px-10 py-4 rounded-full font-black uppercase tracking-widest text-white shadow-2xl transition-all hover:scale-105 text-lg bg-green-600 hover:bg-green-500"
            >
              ✓ Confirmar Sorteio
            </button>
          )}
        </div>
      </div>

      {/* Grupos na parte inferior */}
      <div className="border-t border-white/10 bg-black/40 p-4 overflow-x-auto">
        <div className="flex gap-3 min-w-min justify-center">
          {groupNames.map((gName, gIdx) => {
            const membersInGroup = shuffled.filter(p => groupOf[p.id] === gIdx);
            const isActiveGroup = revealing && (drawnCount % groupCount) === gIdx;
            return (
              <div key={gIdx} className="flex-shrink-0 w-40 rounded-xl border overflow-hidden transition-all duration-300"
                   style={{
                     borderColor: isActiveGroup ? GROUP_COLORS[gIdx % GROUP_COLORS.length] : 'rgba(255,255,255,0.1)',
                     boxShadow: isActiveGroup ? `0 0 20px ${GROUP_COLORS[gIdx % GROUP_COLORS.length]}` : 'none',
                     background: 'rgba(255,255,255,0.05)',
                   }}>
                <div className="py-2 text-center font-black uppercase tracking-widest text-xs text-white"
                     style={{ background: GROUP_COLORS[gIdx % GROUP_COLORS.length] }}>
                  {gName}
                </div>
                <div className="p-2 space-y-1.5 min-h-[100px]">
                  <AnimatePresence>
                    {membersInGroup.map(p => (
                      <motion.div
                        key={p.id}
                        initial={{ scale: 1.5, opacity: 0, y: -20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="flex items-center gap-2 bg-black/30 rounded-lg px-2 py-1.5"
                      >
                        {p.logoUrl
                          ? <img src={p.logoUrl} className="w-5 h-5 rounded-full object-contain" alt="" />
                          : <Shield size={14} className="text-white/40" />}
                        <span className="text-white text-xs font-bold truncate">{p.name}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GroupDraw;
