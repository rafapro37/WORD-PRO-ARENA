import React, { useEffect, useRef, useState } from 'react';
import { Shield, Trophy, Check } from './Icons';

interface MatchLike {
  id: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  isFinished?: boolean;
  stage?: string;
}

interface TeamVisual {
  name: string;
  logoUrl?: string;
}

interface ChampionsBracketProps {
  r16: MatchLike[];
  quarters: MatchLike[];
  semis: MatchLike[];
  finals: MatchLike[];
  r32?: MatchLike[];
  getTeamVisual: (teamId?: string) => TeamVisual;
  themeColor: string;
  championLogoUrl?: string;
  backgroundUrl?: string;
  backgroundOpacity?: number;
  onMatchClick?: (match: MatchLike) => void;
}

// ---- Posicionamento por fase ----
interface Positioned {
  match: MatchLike;
  top: number; // centro vertical em px
}

const ChampionsBracket: React.FC<ChampionsBracketProps> = ({
  r16, quarters, semis, finals, r32 = [], getTeamVisual, themeColor,
  championLogoUrl, backgroundUrl, backgroundOpacity = 0.25, onMatchClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [, setTick] = useState(0);

  // Maior fase = a que tem mais confrontos. Define a base do layout.
  const phasesRaw = [
    { key: 'r32', matches: r32 },
    { key: 'r16', matches: r16 },
    { key: 'qf', matches: quarters },
    { key: 'sf', matches: semis },
    { key: 'final', matches: finals.slice(0, 1) },
  ].filter(p => p.matches.length > 0);

  const maxMatches = Math.max(1, ...phasesRaw.map(p => p.matches.length));

  // ---- ESCALA DINÂMICA conforme o tamanho do torneio ----
  // maxMatches: 8(R16) / 16(R32) / 32(R64)
  let CARD_W = 230, CARD_H = 76, GAP_MIN = 26, COL_GAP = 56, FONT = 13, CREST = 32;
  if (maxMatches >= 32) {        // 64 equipes
    CARD_W = 150; CARD_H = 46; GAP_MIN = 6; COL_GAP = 30; FONT = 9.5; CREST = 20;
  } else if (maxMatches >= 16) { // 32 equipes
    CARD_W = 180; CARD_H = 56; GAP_MIN = 12; COL_GAP = 40; FONT = 11; CREST = 25;
  } else if (maxMatches >= 8) {  // 16 equipes
    CARD_W = 220; CARD_H = 72; GAP_MIN = 22; COL_GAP = 50; FONT = 13; CREST = 30;
  }

  // Altura total = baseada na maior fase (cards + espaçamento proporcional)
  const TOP_PAD = 48;
  const BOTTOM_PAD = 30;
  const slotH = CARD_H + GAP_MIN;                  // altura de cada "slot" da maior fase
  const contentH = maxMatches * slotH;             // altura ocupada pela maior fase
  const totalH = contentH + TOP_PAD + BOTTOM_PAD;

  // Centro vertical do i-ésimo confronto da MAIOR fase
  const baseCenter = (i: number) => TOP_PAD + i * slotH + slotH / 2;

  // Para uma fase com N confrontos, o confronto i fica no ponto médio
  // dos confrontos que o alimentam na maior fase (distribuição proporcional).
  const phaseCenters = (count: number): number[] => {
    if (count <= 0) return [];
    if (count === maxMatches) return Array.from({ length: count }, (_, i) => baseCenter(i));
    const ratio = maxMatches / count; // quantos confrontos-base por confronto desta fase
    return Array.from({ length: count }, (_, i) => {
      const startBase = i * ratio;
      const endBase = (i + 1) * ratio - 1;
      return (baseCenter(Math.floor(startBase)) + baseCenter(Math.floor(endBase))) / 2;
    });
  };

  // Divide cada fase em dois lados
  const splitSide = (matches: MatchLike[], centers: number[]) => {
    const mid = Math.ceil(matches.length / 2);
    return {
      left: matches.slice(0, mid).map((m, i) => ({ match: m, top: centers[i] })),
      right: matches.slice(mid).map((m, i) => ({ match: m, top: centers[mid + i] })),
    };
  };

  // Monta posições para cada fase presente
  const built: Record<string, { left: Positioned[]; right: Positioned[] }> = {};
  phasesRaw.forEach(p => {
    if (p.key === 'final') return;
    const centers = phaseCenters(p.matches.length);
    built[p.key] = splitSide(p.matches, centers);
  });

  const finalMatch = finals[0];
  const championVisual = finalMatch && finalMatch.isFinished
    ? getTeamVisual((finalMatch.homeScore ?? 0) > (finalMatch.awayScore ?? 0) ? finalMatch.homeTeamId : finalMatch.awayTeamId)
    : null;

  // Ordem das colunas (esquerda -> centro -> direita)
  const leftOrder = phasesRaw.filter(p => p.key !== 'final').map(p => p.key);   // r32?, r16?, qf?, sf
  const rightOrder = [...leftOrder].reverse();

  // largura total
  const totalW = (leftOrder.length * 2 * (CARD_W + COL_GAP)) + 280;

  // ---- Conexões SVG ----
  const drawLinks = () => {
    const stage = stageRef.current;
    const svg = svgRef.current;
    if (!stage || !svg) return;
    const sb = stage.getBoundingClientRect();
    svg.setAttribute('width', String(sb.width));
    svg.setAttribute('height', String(sb.height));
    svg.setAttribute('viewBox', `0 0 ${sb.width} ${sb.height}`);
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const pts = (key: string) => {
      const col = stage.querySelector(`[data-bcol="${key}"]`);
      if (!col) return [];
      return Array.from(col.querySelectorAll('[data-bcard]')).map(c => {
        const r = c.getBoundingClientRect();
        return { leftX: r.left - sb.left, rightX: r.right - sb.left, y: r.top - sb.top + r.height / 2 };
      });
    };

    const connect = (fromKey: string, toKey: string, dir: 'right' | 'left') => {
      const a = pts(fromKey), b = pts(toKey);
      if (!a.length || !b.length) return;
      a.forEach((p, i) => {
        const target = b[Math.floor(i / 2)] || b[0];
        if (!target) return;
        const x1 = dir === 'right' ? p.rightX : p.leftX;
        const x2 = dir === 'right' ? target.leftX : target.rightX;
        const midX = (x1 + x2) / 2;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${x1} ${p.y} C ${midX} ${p.y}, ${midX} ${target.y}, ${x2} ${target.y}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', themeColor);
        path.setAttribute('stroke-width', maxMatches >= 16 ? '1.3' : '1.8');
        path.setAttribute('opacity', '0.5');
        path.style.filter = `drop-shadow(0 0 3px ${themeColor})`;
        svg.appendChild(path);
      });
    };

    // lado esquerdo flui pra direita até a final
    const lCols = leftOrder.map(k => `L-${k}`).concat('final');
    for (let i = 0; i < lCols.length - 1; i++) connect(lCols[i], lCols[i + 1], 'right');
    // lado direito flui pra esquerda até a final
    const rCols = leftOrder.map(k => `R-${k}`).concat('final');
    for (let i = 0; i < rCols.length - 1; i++) connect(rCols[i], rCols[i + 1], 'left');
  };

  useEffect(() => {
    const t = setTimeout(drawLinks, 120);
    setTick(x => x + 1);
    const onResize = () => drawLinks();
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(t); window.removeEventListener('resize', onResize); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r32, r16, quarters, semis, finals, themeColor]);

  const phaseTitle: Record<string, string> = { r32: 'Fase 32', r16: 'Oitavas', qf: 'Quartas', sf: 'Semifinal' };

  const Card: React.FC<{ match: MatchLike; phase: string }> = ({ match, phase }) => {
    const h = getTeamVisual(match.homeTeamId);
    const a = getTeamVisual(match.awayTeamId);
    const hasHome = match.homeTeamId && match.homeTeamId !== 'TBD';
    const hasAway = match.awayTeamId && match.awayTeamId !== 'TBD';
    const homeWon = match.isFinished && (match.homeScore ?? 0) > (match.awayScore ?? 0);
    const awayWon = match.isFinished && (match.awayScore ?? 0) > (match.homeScore ?? 0);
    const showHead = maxMatches < 16; // em torneios grandes oculta o cabeçalho pra economizar altura
    const rowPad = maxMatches >= 32 ? '2px 8px' : maxMatches >= 16 ? '4px 9px' : '7px 11px';

    return (
      <div data-bcard onClick={() => onMatchClick && onMatchClick(match)}
        className="rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
        style={{ width: CARD_W, background: 'linear-gradient(180deg, #2b2e38, #23252e)', border: `1px solid ${themeColor}55`, boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}>
        {showHead && (
          <div className="text-center font-black uppercase" style={{ fontSize: 9, letterSpacing: '2px', color: themeColor, background: `${themeColor}1f`, borderBottom: `1px solid ${themeColor}30`, padding: '4px' }}>
            {phase}
          </div>
        )}
        <div className="flex flex-col">
          <div className="flex items-center" style={{ gap: CREST > 24 ? 10 : 6, padding: rowPad, background: homeWon ? `${themeColor}1a` : 'transparent' }}>
            <div className="flex items-center justify-center shrink-0" style={{ width: CREST, height: CREST }}>
              {hasHome ? (h.logoUrl ? <img src={h.logoUrl} className="w-full h-full object-contain" alt="" /> : <Shield size={CREST * 0.55} style={{ color: themeColor }} />) : <div className="w-full h-full" />}
            </div>
            <span className="flex-1 truncate font-bold uppercase" style={{ fontSize: FONT, color: homeWon ? themeColor : (hasHome ? '#f3f5f0' : '#8a8f9c') }}>{hasHome ? h.name : 'A definir'}</span>
            {homeWon && CREST > 22 && <Check size={12} style={{ color: themeColor }} className="shrink-0" />}
            <span className="font-black text-center shrink-0" style={{ fontSize: FONT + 3, minWidth: 20, color: homeWon ? themeColor : '#f3f5f0' }}>{match.homeScore ?? '\u2013'}</span>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
          <div className="flex items-center" style={{ gap: CREST > 24 ? 10 : 6, padding: rowPad, background: awayWon ? `${themeColor}1a` : 'transparent' }}>
            <div className="flex items-center justify-center shrink-0" style={{ width: CREST, height: CREST }}>
              {hasAway ? (a.logoUrl ? <img src={a.logoUrl} className="w-full h-full object-contain" alt="" /> : <Shield size={CREST * 0.55} style={{ color: themeColor }} />) : <div className="w-full h-full" />}
            </div>
            <span className="flex-1 truncate font-bold uppercase" style={{ fontSize: FONT, color: awayWon ? themeColor : (hasAway ? '#f3f5f0' : '#8a8f9c') }}>{hasAway ? a.name : 'A definir'}</span>
            {awayWon && CREST > 22 && <Check size={12} style={{ color: themeColor }} className="shrink-0" />}
            <span className="font-black text-center shrink-0" style={{ fontSize: FONT + 3, minWidth: 20, color: awayWon ? themeColor : '#f3f5f0' }}>{match.awayScore ?? '\u2013'}</span>
          </div>
        </div>
      </div>
    );
  };

  // Coluna posicionada por absoluto (cada card no seu "top" calculado)
  const Col: React.FC<{ colKey: string; title: string; items: Positioned[]; side: 'L' | 'R' }> = ({ colKey, title, items, side }) => (
    <div data-bcol={colKey} className="relative shrink-0" style={{ width: CARD_W, height: totalH }}>
      <div className="text-center font-black uppercase absolute left-0 right-0" style={{ top: 18, fontSize: 11, letterSpacing: '2px', color: '#8a8f9c' }}>{title}</div>
      {items.map((it, i) => (
        <div key={`${it.match.id}-${i}`} className="absolute" style={{ top: it.top, left: 0, transform: 'translateY(-50%)' }}>
          <Card match={it.match} phase={title} />
        </div>
      ))}
    </div>
  );

  const finalCenter = totalH / 2;

  return (
    <div className="relative w-full overflow-x-auto rounded-2xl" style={{ background: '#1e1f26' }}>
      {backgroundUrl && (
        <div className="absolute inset-0 z-0" style={{ backgroundImage: `url(${backgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: backgroundOpacity }} />
      )}

      <div ref={stageRef} className="relative mx-auto" style={{ width: totalW, height: totalH }}>
        {/* marca d'água */}
        <svg className="absolute top-1/2 left-1/2 pointer-events-none z-0" style={{ transform: 'translate(-50%,-50%)', width: Math.min(560, totalH * 0.7), height: Math.min(560, totalH * 0.7), opacity: 0.05 }}
          viewBox="0 0 200 200" fill="none" stroke={themeColor} strokeWidth="1.5">
          <circle cx="100" cy="100" r="92" />
          <path d="M100 40l34 25-13 40h-42l-13-40z" />
          <path d="M100 40V8M134 65l36-13M121 105l22 30M79 105l-22 30M66 65L30 52" />
          <circle cx="100" cy="100" r="6" fill={themeColor} stroke="none" />
        </svg>

        <svg ref={svgRef} className="absolute inset-0 z-[1] pointer-events-none" preserveAspectRatio="none" />

        <div className="relative z-[2] flex flex-row items-start justify-center" style={{ gap: COL_GAP, height: totalH }}>
          {/* LADO ESQUERDO */}
          {leftOrder.map(key => (
            <Col key={`L-${key}`} colKey={`L-${key}`} title={phaseTitle[key]} items={built[key]?.left || []} side="L" />
          ))}

          {/* CENTRO: FINAL + CAMPEÃO */}
          <div className="relative shrink-0 flex flex-col items-center" style={{ width: CARD_W + 30 }}>
            <div data-bcol="final" className="absolute" style={{ top: finalCenter, left: '50%', transform: 'translate(-50%, -50%)' }}>
              <div className="text-center font-black uppercase mb-2" style={{ fontSize: 11, letterSpacing: '2px', color: themeColor }}>Grande Final</div>
              {finalMatch && <Card match={finalMatch} phase="Final" />}
              {/* Troféu + Campeão abaixo da final */}
              <div className="flex flex-col items-center gap-2 mt-4">
                <div className="relative grid place-items-center" style={{ width: 90, height: 90 }}>
                  <div className="absolute rounded-full animate-pulse" style={{ inset: -12, background: 'radial-gradient(circle, rgba(245,197,66,0.5) 0%, transparent 70%)' }} />
                  {championLogoUrl
                    ? <img src={championLogoUrl} className="relative z-[2] object-contain" style={{ width: 52, height: 52, filter: 'drop-shadow(0 0 14px rgba(245,197,66,0.5))' }} alt="" />
                    : <Trophy size={46} className="relative z-[2]" style={{ color: '#f5c542', filter: 'drop-shadow(0 0 14px rgba(245,197,66,0.5))' }} />}
                </div>
                <div className="font-black uppercase" style={{ fontSize: 9, letterSpacing: '4px', color: '#f5c542' }}>\u2605 Campe\u00e3o \u2605</div>
                <div className="relative z-[2] text-center rounded-xl px-4 py-2.5" style={{ minWidth: 170, background: 'linear-gradient(180deg, rgba(245,197,66,0.14), rgba(245,197,66,0.04))', border: '1.5px solid #f5c542', boxShadow: '0 0 24px rgba(245,197,66,0.45)' }}>
                  <div className="font-black italic uppercase" style={{ fontSize: 16, color: '#f5c542' }}>{championVisual ? championVisual.name : 'A definir'}</div>
                  <div className="font-bold uppercase mt-0.5" style={{ fontSize: 8, letterSpacing: '3px', color: '#8a8f9c' }}>Grande Vencedor</div>
                </div>
              </div>
            </div>
          </div>

          {/* LADO DIREITO */}
          {rightOrder.map(key => (
            <Col key={`R-${key}`} colKey={`R-${key}`} title={phaseTitle[key]} items={built[key]?.right || []} side="R" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChampionsBracket;
