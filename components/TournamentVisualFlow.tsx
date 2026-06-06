
import React from 'react';
import { TournamentFormat, TournamentPhase } from '../types';
import { Shield, ChevronRight, LayoutGrid, Trophy, List } from 'lucide-react';
import { motion } from 'motion/react';

interface TournamentVisualFlowProps {
  name: string;
  format: TournamentFormat;
  groupCount: number;
  teamsCount: number;
  classificadosPorGrupo: number;
  playoffQualifiedCount: number;
  manualPhases: TournamentPhase[];
  advancedMode: boolean;
}

const TournamentVisualFlow: React.FC<TournamentVisualFlowProps> = ({
  name,
  format,
  groupCount,
  teamsCount,
  classificadosPorGrupo,
  playoffQualifiedCount,
  manualPhases,
  advancedMode
}) => {
  const renderPhase = (title: string, subtitle: string, icon: React.ReactNode, color: string) => (
    <div className="relative flex flex-col items-center">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 shadow-lg border ${color}`}>
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-tighter text-white text-center leading-none mb-1">
        {title}
      </span>
      <span className="text-[8px] text-white/40 uppercase font-black tracking-widest leading-none">
        {subtitle}
      </span>
    </div>
  );

  const renderConnector = () => (
    <div className="h-0.5 w-6 bg-white/10 mx-2 mt-6" />
  );

  const getFlow = () => {
    if (advancedMode && manualPhases.length > 0) {
      return (
        <div className="flex flex-wrap items-start justify-center gap-y-8">
          {manualPhases.map((phase, idx) => (
            <React.Fragment key={phase.id}>
              {renderPhase(
                phase.name,
                phase.type === 'GROUPS' ? `${phase.groupCount} Grupos` : 'Mata-mata',
                phase.type === 'GROUPS' ? <LayoutGrid size={20} /> : <Trophy size={20} />,
                phase.type === 'GROUPS' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-amber-500/20 border-amber-500/50 text-amber-400'
              )}
              {idx < manualPhases.length - 1 && renderConnector()}
            </React.Fragment>
          ))}
        </div>
      );
    }

    switch (format) {
      case TournamentFormat.GROUPS:
        return (
          <div className="flex items-center">
            {renderPhase("Fase de Grupos", `${groupCount} Grupos`, <LayoutGrid size={20} />, "bg-blue-500/20 border-blue-500/50 text-blue-400")}
            {renderConnector()}
            {renderPhase("Mata-Mata", `${groupCount * classificadosPorGrupo} Times`, <Trophy size={20} />, "bg-amber-500/20 border-amber-500/50 text-amber-400")}
            {renderConnector()}
            {renderPhase("Final", "Campeão", <Trophy size={24} className="text-yellow-400" />, "bg-yellow-500/20 border-yellow-500/50 text-yellow-400")}
          </div>
        );
      case TournamentFormat.LEAGUE:
      case TournamentFormat.PONTOS_CORRIDOS:
        return (
          <div className="flex items-center">
            {renderPhase("Liga", "Todos contra todos", <List size={20} />, "bg-green-500/20 border-green-500/50 text-green-400")}
            {renderConnector()}
            {renderPhase("Campeão", "Maior Pontuação", <Trophy size={24} className="text-yellow-400" />, "bg-yellow-500/20 border-yellow-500/50 text-yellow-400")}
          </div>
        );
      case TournamentFormat.PONTOS_CORRIDOS_PLAYOFF:
        return (
          <div className="flex items-center">
            {renderPhase("Pontos Corridos", "Liga Regular", <List size={20} />, "bg-green-500/20 border-green-500/50 text-green-400")}
            {renderConnector()}
            {renderPhase("Playoffs", `${playoffQualifiedCount} Melhores`, <Shield size={20} />, "bg-purple-500/20 border-purple-500/50 text-purple-400")}
            {renderConnector()}
            {renderPhase("Final", "Decisão", <Trophy size={24} />, "bg-yellow-500/20 border-yellow-500/50 text-yellow-400")}
          </div>
        );
      case TournamentFormat.KNOCKOUT:
        return (
          <div className="flex items-center">
            {renderPhase("Sorteio", "Chaveamento", <Shield size={20} />, "bg-slate-500/20 border-slate-500/50 text-slate-400")}
            {renderConnector()}
            {renderPhase("Mata-Mata", "Eliminatória", <Trophy size={20} />, "bg-amber-500/20 border-amber-500/50 text-amber-400")}
            {renderConnector()}
            {renderPhase("Final", "Campeão", <Trophy size={24} />, "bg-yellow-500/20 border-yellow-500/50 text-yellow-400")}
          </div>
        );
      default:
        return <div className="text-white/20 italic text-xs">Selecione um formato</div>;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-8 border-b border-white/5">
        <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-1">
          Fluxo <span className="text-brand-primary">Visual</span>
        </h3>
        <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Preview Estrutural</p>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center">
        <div className="mb-12 text-center">
          <div className="text-xs text-brand-primary font-black uppercase tracking-[0.3em] mb-2">Tournament Prototype</div>
          <h2 className="text-3xl font-black italic uppercase text-white tracking-widest">{name || "Novo Torneio"}</h2>
          <div className="w-12 h-1 bg-brand-primary mx-auto mt-4" />
        </div>

        <div className="scale-110">
          {getFlow()}
        </div>

        <div className="mt-16 w-full space-y-6">
           <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-4">Sumário Técnico</div>
              <div className="space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] text-white/40 uppercase font-black italic">Times</span>
                    <span className="text-xs text-white font-black">{teamsCount}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] text-white/40 uppercase font-black italic">Formato</span>
                    <span className="text-xs text-brand-primary font-black">{format}</span>
                 </div>
                 {format === TournamentFormat.GROUPS && (
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white/40 uppercase font-black italic">Grupos</span>
                      <span className="text-xs text-white font-black">{groupCount}</span>
                   </div>
                 )}
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col items-center text-center">
                 <div className="text-[8px] text-white/30 font-black uppercase tracking-widest mb-1">Partidas Estimadas</div>
                 <div className="text-xl font-black text-white italic">~{teamsCount * 2}</div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col items-center text-center">
                 <div className="text-[8px] text-white/30 font-black uppercase tracking-widest mb-1">Duração Est.</div>
                 <div className="text-xl font-black text-white italic">4 Sem.</div>
              </div>
           </div>
        </div>
      </div>

      <div className="p-8 bg-black/40 border-t border-white/5">
        <p className="text-[10px] text-white/20 italic leading-tight text-center">
          * Este é um fluxo representativo baseado nas configurações atuais. O chaveamento real será gerado após o preenchimento de todos os times.
        </p>
      </div>
    </div>
  );
};

export default TournamentVisualFlow;
