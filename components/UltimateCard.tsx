
import React from 'react';
import { TrophyItem } from '../types';
import { Shield, Hand, Target, Brain, Zap, Trophy, Award, Crown, User } from './Icons';

interface UltimateCardProps {
  item: TrophyItem;
  playerImage?: string;
  playerPosition?: string;
  onDelete?: () => void;
  id?: string; // Added ID prop for HTML2Canvas capture
  clubTheme?: string; // New prop for club style overrides
}

const UltimateCard: React.FC<UltimateCardProps> = ({ item, playerImage, playerPosition, onDelete, id, clubTheme }) => {
  
  // Define Card Visual Model based on Award Type
  const getCardConfig = () => {
    switch (item.type) {
      case 'GOLDEN_GLOVE':
        return { 
            icon: <Hand size={24} className="text-yellow-900 drop-shadow-md" />, 
            // Gold Metal Look
            bgClass: 'bg-gradient-to-br from-yellow-200 via-yellow-500 to-yellow-800',
            borderClass: 'border-yellow-300',
            textClass: 'text-yellow-950',
            texture: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.6) 0%, transparent 60%)',
            label: 'GOLEIRO',
            rarity: 'LENDA'
        };
      case 'PITBULL':
        return { 
            icon: <Shield size={24} className="text-red-500 drop-shadow-[0_2px_10px_rgba(255,0,0,0.8)]" />, 
            // Carbon Fiber / Aggressive Dark
            bgClass: 'bg-gradient-to-b from-gray-800 via-gray-900 to-black',
            borderClass: 'border-red-600',
            textClass: 'text-red-100',
            texture: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.2), rgba(0,0,0,0.2) 10px, rgba(0,0,0,0.3) 10px, rgba(0,0,0,0.3) 20px)',
            label: 'DEFENSOR',
            rarity: 'FOGO'
        };
      case 'ORCHESTRATOR':
        return { 
            icon: <Brain size={24} className="text-cyan-300 drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]" />, 
            // Tech / Future Blue
            bgClass: 'bg-gradient-to-br from-cyan-900 via-blue-900 to-slate-900',
            borderClass: 'border-cyan-400',
            textClass: 'text-cyan-100',
            texture: 'linear-gradient(0deg, transparent 24%, rgba(0, 255, 255, .1) 25%, rgba(0, 255, 255, .1) 26%, transparent 27%, transparent 74%, rgba(0, 255, 255, .1) 75%, rgba(0, 255, 255, .1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 255, 255, .1) 25%, rgba(0, 255, 255, .1) 26%, transparent 27%, transparent 74%, rgba(0, 255, 255, .1) 75%, rgba(0, 255, 255, .1) 76%, transparent 77%, transparent)',
            textureSize: '30px 30px',
            label: 'MEIA',
            rarity: 'TECH'
        };
      case 'TOP_SCORER':
        return { 
            icon: <Target size={24} className="text-white drop-shadow-md" />, 
            // Magma / Explosive
            bgClass: 'bg-gradient-to-tr from-orange-600 via-red-600 to-purple-900',
            borderClass: 'border-orange-400',
            textClass: 'text-white',
            texture: 'radial-gradient(circle at bottom left, rgba(255,200,0,0.4), transparent 50%)',
            label: 'ATACANTE',
            rarity: 'HERÓI'
        };
      case 'MVP_AWARD':
        // --- TOTY / ULTIMATE STYLE ---
        return { 
            icon: <Crown size={32} className="text-[#fcf6ba] drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]" />, 
            // TOTY: Royal Blue Deep + Gold Accent
            bgClass: 'bg-[#101c3f]',
            // Simulated Metallic Gold Border using gradient via inline styles/classes logic below would be cleaner, but standard Border here:
            borderClass: 'border-transparent', // We will handle border manually for TOTY
            isToty: true,
            textClass: 'text-[#fcf6ba]',
            // Crystallized Texture
            texture: `
                linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 10%, rgba(255,255,255,0.05) 50%, transparent 51%),
                repeating-linear-gradient(45deg, rgba(20, 40, 90, 0.4) 0px, rgba(20, 40, 90, 0.4) 1px, transparent 1px, transparent 40px),
                radial-gradient(circle at 50% 0%, rgba(37, 99, 235, 0.4) 0%, transparent 80%)
            `,
            textureSize: '100% 100%',
            label: 'TOTY',
            rarity: '99 OVR'
        };
      case 'TROPHY':
        return {
            icon: <Trophy size={24} className="text-yellow-600" />, 
            bgClass: 'bg-gradient-to-t from-yellow-100 via-yellow-300 to-yellow-500',
            borderClass: 'border-yellow-600',
            textClass: 'text-yellow-900',
            texture: '',
            label: 'CAMPEÃO',
            rarity: 'OURO'
        };
      default:
        return { 
            icon: <Award size={24} className="text-white" />, 
            bgClass: 'bg-slate-800',
            borderClass: 'border-slate-600',
            textClass: 'text-slate-100',
            texture: '',
            label: 'PRÊMIO',
            rarity: 'COMUM'
        };
    }
  };

  const config = getCardConfig();
  // @ts-ignore
  const isToty = config.isToty === true;

  return (
    <div id={id} className={`group relative w-60 h-[22rem] perspective-1000 mx-auto select-none font-sans ${isToty ? 'p-[6px] rounded-t-2xl rounded-b-xl' : ''}`}>
      
      {/* TOTY Special Gold Border Container */}
      {isToty && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#e5c687] via-[#a47e3b] to-[#e5c687] rounded-t-2xl rounded-b-xl z-0 shadow-[0_0_25px_rgba(234,179,8,0.6)]">
              {/* Metallic Shine on Border */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-50 rounded-t-2xl rounded-b-xl"></div>
          </div>
      )}

      {/* Card Body */}
      <div className={`w-full h-full relative transition-all duration-500 transform ${isToty ? 'rounded-t-[14px] rounded-b-[10px]' : 'border-[4px] rounded-t-2xl rounded-b-xl'} shadow-2xl overflow-hidden ${config.bgClass} ${config.borderClass} z-10`}>
        
        {/* Texture Layer */}
        <div 
            className="absolute inset-0 z-0 pointer-events-none mix-blend-overlay" 
            style={{ 
                backgroundImage: config.texture,
                backgroundSize: (config as any).textureSize || 'auto',
                opacity: isToty ? 0.8 : 0.4
            }}
        ></div>

        {/* Shimmer/Holographic Effect - Hidden during capture typically, but adds nice effect if captured at right moment */}
        <div className="absolute inset-0 z-30 pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity duration-700 bg-gradient-to-tr from-transparent via-white to-transparent translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite]"></div>

        {/* TOTY Crystal Shards Decoration */}
        {isToty && (
            <>
                <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-blue-500/20 rotate-45 blur-2xl z-0"></div>
                <div className="absolute bottom-[-20px] left-[-20px] w-full h-1/2 bg-gradient-to-t from-[#15181F] to-transparent z-10 opacity-90"></div>
                {/* Side Glows */}
                <div className="absolute top-1/4 left-0 w-2 h-1/2 bg-blue-400/30 blur-md"></div>
                <div className="absolute top-1/4 right-0 w-2 h-1/2 bg-blue-400/30 blur-md"></div>
            </>
        )}

        {/* --- TOP HEADER (Flag/Brand Vibe) --- */}
        <div className="absolute top-0 left-0 right-0 h-16 z-10 border-b border-white/5">
             {/* Rarity Label */}
             <div className={`absolute top-3 right-4 text-[10px] font-black uppercase tracking-[0.2em] ${isToty ? 'text-[#fcf6ba] drop-shadow-[0_2px_4px_rgba(0,0,0,1)]' : 'opacity-60 mix-blend-overlay text-white'}`}>
                 {config.rarity}
             </div>
        </div>

        {/* --- LEFT SIDEBAR INFO --- */}
        <div className="absolute top-6 left-4 z-20 flex flex-col items-center w-14">
            {/* Rating Number */}
            <span className={`text-5xl font-black ${config.textClass} leading-none drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] tracking-tighter`}>
                {isToty ? '99' : '99'}
            </span>
            
            {/* Position Code */}
            <span className={`text-lg font-bold ${config.textClass} uppercase mb-3 drop-shadow-md border-b-2 ${isToty ? 'border-[#fcf6ba]/30' : 'border-white/20'} pb-1 w-full text-center tracking-wider`}>
                {playerPosition || 'PRO'}
            </span>
            
            {/* Badge Icon Container */}
            <div className={`w-12 h-12 flex items-center justify-center rounded-full backdrop-blur-sm shadow-inner ${isToty ? 'bg-gradient-to-br from-[#1e3a8a] to-black border border-[#fcf6ba]/50' : 'bg-black/20 border border-white/20'}`}>
                {config.icon}
            </div>
        </div>

        {/* --- PLAYER IMAGE --- */}
        <div className="absolute top-8 right-[-15px] w-48 h-52 z-10 flex items-end justify-center">
             {playerImage ? (
                 <img 
                    src={playerImage} 
                    alt="Player" 
                    loading="lazy"
                    className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] transform scale-110" 
                 />
             ) : (
                 <User size={110} className={`${isToty ? 'text-white/10' : 'text-white/20'} drop-shadow-lg`} />
             )}
        </div>

        {/* --- BOTTOM NAME PLATE --- */}
        <div className="absolute bottom-0 w-full h-28 z-20 flex flex-col justify-end pb-3">
            
            {/* Curved Name Background */}
            <div className={`p-3 pt-8 text-center relative ${isToty ? 'bg-transparent' : 'bg-gradient-to-t from-black via-black/80 to-transparent'}`}>
                
                {/* Decorative Lines for TOTY */}
                {isToty && <div className="w-2/3 mx-auto h-[2px] bg-gradient-to-r from-transparent via-[#fcf6ba] to-transparent mb-2 shadow-[0_0_10px_#fcf6ba]"></div>}
                {!isToty && <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/70 to-transparent mb-1"></div>}
                
                <h3 className={`${config.textClass} font-black text-2xl uppercase tracking-tighter leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,1)] px-2 line-clamp-2 scale-y-110`}>
                    {item.title}
                </h3>
                
                <div className="flex justify-center items-center gap-3 mt-2">
                    <span className={`text-[10px] font-bold px-3 py-[2px] rounded uppercase tracking-widest shadow-lg ${isToty ? 'bg-gradient-to-r from-[#a47e3b] to-[#e5c687] text-black border border-[#fcf6ba]' : 'bg-white/20 backdrop-blur text-white'}`}>
                        {config.label}
                    </span>
                    {!isToty && (
                        <span className="text-[10px] text-slate-300 font-mono">
                            {new Date(item.date).getFullYear()}
                        </span>
                    )}
                </div>
            </div>
        </div>

        {/* Delete Button (Hover) */}
        {onDelete && (
            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="absolute top-2 left-2 z-50 bg-red-600 hover:bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg text-xs"
                title="Remover"
                data-html2canvas-ignore="true" // Ignore this button during capture
            >
                ✕
            </button>
        )}
      </div>
      
      {/* 3D Bottom Shadow - Ignore during capture to keep clean image */}
      <div className="absolute -bottom-2 left-4 right-4 h-4 bg-black/60 blur-xl rounded-[100%] group-hover:scale-90 transition-transform duration-500" data-html2canvas-ignore="true"></div>
      
      <style>{`
        @keyframes shimmer {
            0% { transform: translateX(-150%) skewX(-20deg); }
            100% { transform: translateX(150%) skewX(-20deg); }
        }
      `}</style>
    </div>
  );
};

export default React.memo(UltimateCard);
