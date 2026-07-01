import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClubPlayer, TournamentRegistration } from '../types';
import { X, Plus, Trash2, Save, Star, Crown, Users, Search, Shield } from '../components/Icons';
import { REAL_PLAYER_NAMES } from '../src/constants/realPlayers';
import { toast } from '../src/lib/toast';

interface LineupModalProps {
  registration: TournamentRegistration;
  tournamentName: string;
  onSave: (roster: ClubPlayer[]) => void;
  onClose: () => void;
}

const COMMON_POSITIONS = ['GOL', 'ZAG', 'LD', 'LE', 'VOL', 'MC', 'MEI', 'PD', 'PE', 'SA', 'ATA'];

const newId = () => Math.random().toString(36).substr(2, 9);

const LineupModal: React.FC<LineupModalProps> = ({ registration, tournamentName, onSave, onClose }) => {
  const [roster, setRoster] = useState<ClubPlayer[]>(registration.roster || []);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('ATA');
  const [kitNumber, setKitNumber] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Autocomplete a partir da lista de craques reais
  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (!q) return [];
    return REAL_PLAYER_NAMES.filter(n => n.toLowerCase().includes(q)).slice(0, 6);
  }, [name]);

  const addPlayer = (forcedName?: string) => {
    const finalName = (forcedName ?? name).trim();
    if (!finalName) { toast.info('Digite o nome do jogador'); return; }
    const player: ClubPlayer = {
      id: newId(),
      name: finalName,
      position,
      status: 'ACTIVE',
      matches: 0, goals: 0, assists: 0, averageRating: 6.0,
      kitNumber: kitNumber ? parseInt(kitNumber, 10) : undefined,
      isStar: false,
      tipo: 'manual',
    };
    setRoster(prev => [...prev, player]);
    setName(''); setKitNumber(''); setShowSuggestions(false);
  };

  const removePlayer = (id: string) => setRoster(prev => prev.filter(p => p.id !== id));
  const toggleStar = (id: string) => setRoster(prev => prev.map(p => p.id === id ? { ...p, isStar: !p.isStar } : p));
  const toggleCaptain = (id: string) => setRoster(prev => prev.map(p => ({ ...p, isCaptain: p.id === id ? !p.isCaptain : false })));

  const handleSave = () => {
    onSave(roster);
    toast.success('Escalação salva!');
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
          className="bg-brand-surface border border-brand-border rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Cabeçalho */}
          <div className="p-6 border-b border-brand-border flex items-start justify-between gap-4 shrink-0">
            <div>
              <h2 className="text-xl md:text-2xl font-black italic uppercase text-white flex items-center gap-2">
                <Shield className="text-brand-primary" size={24} /> Montar Escalação
              </h2>
              <p className="text-[11px] font-black text-brand-primary uppercase mt-1 tracking-widest">{tournamentName}</p>
              <p className="text-[10px] text-brand-textMuted mt-1">Monte o elenco do time que você vai usar neste campeonato.</p>
            </div>
            <button onClick={onClose} className="text-brand-textMuted hover:text-white transition-colors shrink-0">
              <X size={24} />
            </button>
          </div>

          {/* Formulário de adicionar */}
          <div className="p-6 border-b border-brand-border bg-brand-surfaceHighlight shrink-0 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,auto] gap-3">
              <div className="relative">
                <label className="text-[10px] font-bold text-brand-textMuted uppercase">Nome do jogador</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={e => { if (e.key === 'Enter') addPlayer(); }}
                  placeholder="Ex: Vinicius Jr"
                  className="w-full bg-black border border-brand-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-brand-primary mt-1"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-2xl">
                    {suggestions.map(s => (
                      <button
                        key={s}
                        onClick={() => addPlayer(s)}
                        className="w-full text-left px-4 py-2 text-sm text-white hover:bg-brand-primary/20 flex items-center gap-2"
                      >
                        <Search size={12} className="text-brand-textMuted" /> {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-brand-textMuted uppercase">Posição</label>
                <select
                  value={position}
                  onChange={e => setPosition(e.target.value)}
                  className="w-full bg-black border border-brand-border rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-brand-primary mt-1"
                >
                  {COMMON_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-brand-textMuted uppercase">Nº</label>
                <input
                  type="number"
                  value={kitNumber}
                  onChange={e => setKitNumber(e.target.value)}
                  placeholder="10"
                  className="w-20 bg-black border border-brand-border rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-brand-primary mt-1"
                />
              </div>
            </div>
            <button
              onClick={() => addPlayer()}
              className="w-full bg-brand-primary text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-widest shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Adicionar ao elenco
            </button>
          </div>

          {/* Lista do elenco */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-white uppercase flex items-center gap-2">
                <Users size={16} className="text-brand-primary" /> Elenco ({roster.length})
              </h3>
              {roster.length > 0 && (
                <span className="text-[10px] text-brand-textMuted uppercase">⭐ craque · 👑 capitão</span>
              )}
            </div>

            {roster.length === 0 ? (
              <div className="text-center py-12">
                <Users size={40} className="text-brand-textMuted/30 mx-auto mb-3" />
                <p className="text-brand-textMuted text-sm font-bold">Nenhum jogador ainda.</p>
                <p className="text-brand-textMuted/60 text-xs mt-1">Adicione os jogadores do time que você vai usar.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {roster.map(p => (
                  <div key={p.id} className="flex items-center gap-3 bg-brand-surfaceHighlight border border-brand-border rounded-xl px-3 py-2.5">
                    <div className="w-9 h-9 rounded-lg bg-black border border-brand-border flex items-center justify-center shrink-0">
                      <span className="text-xs font-black text-brand-primary">{p.kitNumber ?? '-'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate flex items-center gap-1.5">
                        {p.name}
                        {p.isStar && <Star size={12} className="text-yellow-400 fill-yellow-400" />}
                        {p.isCaptain && <Crown size={12} className="text-brand-primary fill-brand-primary" />}
                      </p>
                      <p className="text-[10px] font-bold text-brand-textMuted uppercase">{p.position}</p>
                    </div>
                    <button onClick={() => toggleStar(p.id)} title="Craque"
                      className={`p-1.5 rounded-lg transition-colors ${p.isStar ? 'text-yellow-400' : 'text-brand-textMuted hover:text-yellow-400'}`}>
                      <Star size={16} className={p.isStar ? 'fill-yellow-400' : ''} />
                    </button>
                    <button onClick={() => toggleCaptain(p.id)} title="Capitão"
                      className={`p-1.5 rounded-lg transition-colors ${p.isCaptain ? 'text-brand-primary' : 'text-brand-textMuted hover:text-brand-primary'}`}>
                      <Crown size={16} className={p.isCaptain ? 'fill-brand-primary' : ''} />
                    </button>
                    <button onClick={() => removePlayer(p.id)} title="Remover"
                      className="p-1.5 rounded-lg text-brand-textMuted hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rodapé */}
          <div className="p-6 border-t border-brand-border shrink-0 flex gap-3">
            <button onClick={onClose} className="flex-1 bg-brand-surfaceHighlight border border-brand-border text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-white/5 transition-all">
              Cancelar
            </button>
            <button onClick={handleSave} className="flex-[2] bg-brand-primary text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
              <Save size={16} /> Salvar escalação
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LineupModal;
