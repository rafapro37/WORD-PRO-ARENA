
import React, { useState } from 'react';
import { PlanType } from '../types';
import { Check, X, XCircle } from './Icons';

interface PlansModalProps {
  onClose: () => void;
}

const PlansModal: React.FC<PlansModalProps> = ({ onClose }) => {
  const [activePlan, setActivePlan] = useState<PlanType>(PlanType.PRO);

  const plans = {
    [PlanType.FREE]: {
      name: 'FREE',
      price: 'R$ 0,00',
      desc: 'Para quem está começando.',
      features: [
        { name: 'Criar Campeonatos', included: true },
        { name: 'Até 2 Grupos', included: true },
        { name: 'Até 8 Times', included: true },
        { name: 'Jogos Automáticos', included: true },
        { name: 'Exportar Dados (PDF/Excel)', included: false },
        { name: 'Personalização Visual', included: false },
        { name: 'Painel Organizador PRO', included: false }
      ]
    },
    [PlanType.PRO]: {
      name: 'PROFISSIONAL',
      price: 'R$ 29,90',
      desc: 'O mais popular para organizadores.',
      features: [
        { name: 'Criar Campeonatos Ilimitados', included: true },
        { name: 'Até 8 Grupos', included: true },
        { name: 'Até 32 Times', included: true },
        { name: 'Jogos Ida e Volta', included: true },
        { name: 'Exportar Dados (PDF/Excel)', included: true },
        { name: 'Personalização Padrão', included: true },
        { name: 'Rank e Estatísticas', included: true }
      ]
    },
    [PlanType.ELITE]: {
      name: 'ELITE',
      price: 'R$ 59,90',
      desc: 'Poder total e personalização máxima.',
      features: [
        { name: 'Tudo Ilimitado', included: true },
        { name: 'Grupos Ilimitados', included: true },
        { name: 'Times Ilimitados', included: true },
        { name: 'Gestão Completa', included: true },
        { name: 'Exportar Tudo + Premium', included: true },
        { name: 'Branding e Layout Custom', included: true },
        { name: 'Árbitros + Biblioteca Pro', included: true }
      ]
    }
  };

  const current = plans[activePlan];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-brand-surface border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px]">
        
        {/* Left Side: Navigation */}
        <div className="w-full md:w-1/3 bg-slate-900/50 border-r border-slate-800 p-6 flex flex-col">
            <h2 className="text-2xl font-black text-white italic mb-6">ESCOLHA SEU <span className="text-brand-primary">PLANO</span></h2>
            
            <div className="space-y-3 flex-1">
                {Object.keys(plans).map((key) => {
                    const type = key as PlanType;
                    const isActive = activePlan === type;
                    let colorClass = 'hover:bg-slate-800 text-slate-400';
                    if (isActive) {
                        if (type === 'FREE') colorClass = 'bg-slate-700 text-white shadow-lg';
                        if (type === 'PRO') colorClass = 'bg-blue-600 text-white shadow-lg shadow-blue-900/50';
                        if (type === 'ELITE') colorClass = 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50';
                    }

                    return (
                        <button
                            key={type}
                            onClick={() => setActivePlan(type)}
                            className={`w-full text-left px-6 py-4 rounded-xl font-bold transition-all duration-300 flex justify-between items-center ${colorClass} ${isActive ? 'scale-105' : ''}`}
                        >
                            <span>{type}</span>
                            {isActive && <Check size={18} />}
                        </button>
                    )
                })}
            </div>

            <button onClick={onClose} className="mt-6 flex items-center justify-center gap-2 text-slate-500 hover:text-white transition-colors py-4">
                <XCircle /> Fechar
            </button>
        </div>

        {/* Right Side: Content */}
        <div className="w-full md:w-2/3 p-8 relative overflow-y-auto bg-gradient-to-br from-brand-surface to-black">
            <div key={activePlan} className="animate-in slide-in-from-right-8 duration-500">
                <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-4xl font-black italic tracking-tighter ${activePlan === 'FREE' ? 'text-slate-400' : activePlan === 'PRO' ? 'text-blue-500' : 'text-yellow-500'}`}>
                        {current.name}
                    </h3>
                    <div className="text-right">
                        <span className="block text-3xl font-bold text-white">{current.price}</span>
                        <span className="text-sm text-slate-500">/mês</span>
                    </div>
                </div>
                <p className="text-slate-400 mb-8 text-lg">{current.desc}</p>

                <div className="space-y-4">
                    {current.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                            <div className={`p-1.5 rounded-full ${feat.included ? (activePlan==='ELITE' ? 'bg-yellow-500 text-black' : activePlan==='PRO' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white') : 'bg-slate-800 text-slate-600'}`}>
                                {feat.included ? <Check size={16} /> : <X size={16} />}
                            </div>
                            <span className={`font-medium ${feat.included ? 'text-white' : 'text-slate-600 line-through'}`}>
                                {feat.name}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-8 border-t border-slate-800">
                     <button onClick={onClose} className={`w-full py-4 rounded-xl font-bold text-lg transition-transform hover:scale-[1.02] shadow-xl ${
                         activePlan === 'FREE' ? 'bg-slate-700 text-white hover:bg-slate-600' :
                         activePlan === 'PRO' ? 'bg-blue-600 text-white hover:bg-blue-500' :
                         'bg-yellow-500 text-black hover:bg-yellow-400'
                     }`}>
                         {activePlan === 'FREE' ? 'Começar Grátis' : 'Assinar Agora'}
                     </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default PlansModal;
