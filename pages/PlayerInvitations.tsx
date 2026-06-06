import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Mail, Shield, User, Clock } from '../components/Icons';
import { LeagueInvitation, League, User as UserType } from '../types';

interface PlayerInvitationsProps {
  invitations: LeagueInvitation[];
  leagues: League[];
  users: UserType[];
  onRespond: (id: string, status: 'aceito' | 'recusado') => void;
  isLoading?: boolean;
}

const PlayerInvitations: React.FC<PlayerInvitationsProps> = ({
  invitations,
  leagues,
  users,
  onRespond,
  isLoading = false
}) => {
  const getLeagueInfo = (ligaId: string) => leagues.find(l => l.id === ligaId);
  const getOrganizerInfo = (orgId: string) => users.find(u => u.id === orgId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-brand-textMuted">
        <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-4" />
        <p className="font-bold uppercase tracking-widest text-xs">Carregando seus convites...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
          <Mail className="text-brand-primary" size={28} />
          Convites Recebidos
        </h2>
        <p className="text-brand-textMuted text-sm mt-1">Gerencie seu ingresso em ligas profissionais.</p>
      </header>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {invitations.length > 0 ? (
            invitations.map((inv) => {
              const league = getLeagueInfo(inv.ligaId);
              const organizer = getOrganizerInfo(inv.organizadorId);

              return (
                <motion.div
                  key={inv.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-brand-surfaceHighlight border border-white/5 rounded-2xl overflow-hidden group hover:border-brand-primary/30 transition-all duration-300"
                >
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center border border-brand-primary/20 group-hover:scale-110 transition-transform">
                        <Shield className="text-brand-primary" size={32} />
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-black text-white uppercase italic tracking-tight group-hover:text-brand-primary transition-colors">
                          {league?.name || "Liga Desconhecida"}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          <span className="flex items-center gap-1.5 text-xs text-brand-textMuted font-bold uppercase tracking-wider">
                            <User size={12} className="text-brand-primary" />
                            Org: <span className="text-white">{organizer?.name || "Organizador"}</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-brand-textMuted font-bold uppercase tracking-wider">
                            <Clock size={12} />
                            {new Date(inv.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onRespond(inv.id, 'recusado')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-red-500/10 text-brand-textMuted hover:text-red-500 font-black uppercase text-xs tracking-widest border border-white/5 hover:border-red-500/20 transition-all active:scale-95"
                      >
                        <X size={16} /> Recusar
                      </button>
                      
                      <button
                        onClick={() => onRespond(inv.id, 'aceito')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-primary text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-brand-primary/20 hover:brightness-110 active:scale-95 transition-all"
                      >
                        <Check size={16} /> Aceitar Convite
                      </button>
                    </div>
                  </div>
                  
                  <div className="h-1 w-0 group-hover:w-full bg-brand-primary transition-all duration-500" />
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 flex flex-col items-center justify-center bg-black/20 rounded-3xl border border-dashed border-white/10"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 text-brand-textMuted opacity-20">
                <Mail size={40} />
              </div>
              <h3 className="text-white font-black uppercase italic tracking-tight">Nenhum convite pendente</h3>
              <p className="text-brand-textMuted text-xs font-bold uppercase mt-1">Você será notificado quando uma liga te convidar.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PlayerInvitations;
