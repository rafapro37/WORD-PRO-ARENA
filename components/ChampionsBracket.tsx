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
  getTeamVisual: (teamId?: string) => TeamVisual;
  themeColor: string;
  championLogoUrl?: string;
  backgroundUrl?: string;
  backgroundOpacity?: number;
  onMatchClick?: (match: MatchLike) => void;
}

const ChampionsBracket: React.FC<ChampionsBracketProps> = ({
  r16, quarters, semis, finals, getTeamVisual, themeColor,
  championLogoUrl, backgroundUrl, backgroundOpacity = 0.25, onMatchClick,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [, setTick] = useState(0);

  const hasR16 = r16.length > 0;
  const hasQuarters = quarters.length > 0;

  const half = <T,>(arr: T[]) => {
    const mid = Math.ceil(arr.length / 2);
    return { left: arr.slice(0, mid), right: arr.slice(mid) };
  };
  const r16Split = half(r16);
  const qfSplit = half(quarters);
  const sfSplit = half(semis);

  const finalMatch = finals[0];
  const championVisual = finalMatch && finalMatch.isFinished
    ? getTeamVisual(
        (finalMatch.homeScore ?? 0) > (finalMatch.awayScore ?? 0)
          ? finalMatch.homeTeamId
          : finalMatch.awayTeamId
      )
    : null;

  const drawLinks = () => {
    const stage = stageRef.current;
    const svg = svgRef.current;
    if (!stage || !svg) return;

    const sb = stage.getBoundingClientRect();
    svg.setAttribute('width', String(sb.width));
    svg.setAttribute('height', String(sb.height));
    svg.setAttribute('viewBox', `0 0 ${sb.width} ${sb.height}`);
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const getCardPoints = (colKey: string) => {
      const col = stage.querySelector(`[data-bcol="${colKey}"]`);
      if (!col) return [];
      const cards = Array.from(col.querySelectorAll('[data-bcard]'));
      return cards.map(c => {
        const r = c.getBoundingClientRect();
        return {
          leftX: r.left - sb.left,
          rightX: r.right - sb.left,
          y: r.top - sb.top + r.height / 2,
        };
      });
    };

    const connect = (fromKey: string, toKey: string, dir: 'right' | 'left') => {
      const a = getCardPoints(fromKey);
      const b = getCardPoints(toKey);
      if (a.length === 0 || b.length === 0) return;
      a.forEach((p, i) => {
        const target = b[Math.floor(i / 2)] || b[0];
        if (!target) return;
        let x1: number, x2: number;
        if (dir === 'right') { x1 = p.rightX; x2 = target.leftX; }
        else { x1 = p.leftX; x2 = target.rightX; }
        const midX = (x1 + x2) / 2;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${x1} ${p.y} C ${midX} ${p.y}, ${midX} ${target.y}, ${x2} ${target.y}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', themeColor);
        path.setAttribute('stroke-width', '1.8');
        path.setAttribute('opacity', '0.5');
        path.style.filter = `drop-shadow(0 0 3px ${themeColor})`;
        svg.appendChild(path);
      });
    };

    const leftCols: string[] = [];
    if (hasR16) leftCols.push('L-r16');
    if (hasQuarters) leftCols.push('L-qf');
    if (sfSplit.left.length) leftCols.push('L-sf');
    leftCols.push('final');
    for (let i = 0; i < leftCols.length - 1; i++) connect(leftCols[i], leftCols[i + 1], 'right');

    const rightCols: string[] = [];
    if (hasR16) rightCols.push('R-r16');
    if (hasQuarters) rightCols.push('R-qf');
    if (sfSplit.right.length) rightCols.push('R-sf');
    rightCols.push('final');
    for (let i = 0; i < rightCols.length - 1; i++) connect(rightCols[i], rightCols[i + 1], 'left');
  };

  useEffect(() => {
    const t = setTimeout(drawLinks, 120);
    setTick(x => x + 1);
    const onResize = () => drawLinks();
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(t); window.removeEventListener('resize', onResize); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r16, quarters, semis, finals, themeColor]);

  const MatchCard: React.FC<{ match: MatchLike; phase: string }> = ({ match, phase }) => {
    const h = getTeamVisual(match.homeTeamId);
    const a = getTeamVisual(match.awayTeamId);
    const hasHome = match.homeTeamId && match.homeTeamId !== 'TBD';
    const hasAway = match.awayTeamId && match.awayTeamId !== 'TBD';
    const homeWon = match.isFinished && (match.homeScore ?? 0) > (match.awayScore ?? 0);
    const awayWon = match.isFinished && (match.awayScore ?? 0) > (match.homeScore ?? 0);

    return (
      <div
        data-bcard
        onClick={() => onMatchClick && onMatchClick(match)}
        className="rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
        style={{
          width: 230,
          background: 'linear-gradient(180deg, #2b2e38, #23252e)',
          border: `1px solid ${themeColor}55`,
          boxShadow: '0 6px 22px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="text-center font-black uppercase py-1.5"
          style={{ fontSize: 10, letterSpacing: '2.5px', color: themeColor, background: `${themeColor}1f`, borderBottom: `1px solid ${themeColor}30` }}
        >
          {phase}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-3 px-3 py-2.5" style={{ background: homeWon ? `${themeColor}1a` : 'transparent' }}>
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              {hasHome
                ? (h.logoUrl ? <img src={h.logoUrl} className="w-full h-full object-contain" alt="" /> : <Shield size={16} style={{ color: themeColor }} />)
                : <div className="w-full h-full" />}
            </div>
            <span className="flex-1 truncate font-bold uppercase" style={{ fontSize: 13, color: homeWon ? themeColor : (hasHome ? '#f3f5f0' : '#8a8f9c'), letterSpacing: '.3px' }}>
              {hasHome ? h.name : 'A definir'}
            </span>
            {homeWon && <Check size={14} style={{ color: themeColor }} className="shrink-0" />}
            <span className="font-black text-center shrink-0" style={{ fontSize: 17, minWidth: 24, color: homeWon ? themeColor : '#f3f5f0', textShadow: homeWon ? `0 0 8px ${themeColor}` : 'none' }}>
              {match.homeScore ?? '\u2013'}
            </span>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
          <div className="flex items-center gap-3 px-3 py-2.5" style={{ background: awayWon ? `${themeColor}1a` : 'transparent' }}>
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              {hasAway
                ? (a.logoUrl ? <img src={a.logoUrl} className="w-full h-full object-contain" alt="" /> : <Shield size={16} style={{ color: themeColor }} />)
                : <div className="w-full h-full" />}
            </div>
            <span className="flex-1 truncate font-bold uppercase" style={{ fontSize: 13, color: awayWon ? themeColor : (hasAway ? '#f3f5f0' : '#8a8f9c'), letterSpacing: '.3px' }}>
              {hasAway ? a.name : 'A definir'}
            </span>
            {awayWon && <Check size={14} style={{ color: themeColor }} className="shrink-0" />}
            <span className="font-black text-center shrink-0" style={{ fontSize: 17, minWidth: 24, color: awayWon ? themeColor : '#f3f5f0', textShadow: awayWon ? `0 0 8px ${themeColor}` : 'none' }}>
              {match.awayScore ?? '\u2013'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const Column: React.FC<{ colKey: string; title: string; matches: MatchLike[]; phase: string }> = ({ colKey, title, matches, phase }) => (
    <div data-bcol={colKey} className="flex flex-col justify-around h-full relative">
      <div className="text-center font-black uppercase absolute -top-8 left-0 right-0" style={{ fontSize: 11, letterSpacing: '2px', color: '#8a8f9c' }}>
        {title}
      </div>
      {matches.map((m, i) => (
        <div key={`${m.id}-${i}`} className="py-3 px-2 flex items-center justify-center">
          <MatchCard match={m} phase={phase} />
        </div>
      ))}
    </div>
  );

  const sideColCount = (hasR16 ? 1 : 0) + (hasQuarters ? 1 : 0) + 1;
  const totalWidth = sideColCount * 2 * 270 + 320;

  return (
    <div className="relative w-full overflow-x-auto rounded-2xl" style={{ background: '#1e1f26' }}>
      {backgroundUrl && (
        <div className="absolute inset-0 z-0" style={{
          backgroundImage: `url(${backgroundUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: backgroundOpacity,
        }} />
      )}

      <div ref={stageRef} className="relative mx-auto" style={{ width: totalWidth, minHeight: 780, padding: '60px 24px 40px' }}>
        <svg className="absolute top-1/2 left-1/2 pointer-events-none z-0"
          style={{ transform: 'translate(-50%,-50%)', width: 560, height: 560, opacity: 0.05 }}
          viewBox="0 0 200 200" fill="none" stroke={themeColor} strokeWidth="1.5">
          <circle cx="100" cy="100" r="92" />
          <path d="M100 40l34 25-13 40h-42l-13-40z" />
          <path d="M100 40V8M134 65l36-13M121 105l22 30M79 105l-22 30M66 65L30 52" />
          <circle cx="100" cy="100" r="6" fill={themeColor} stroke="none" />
        </svg>

        <svg ref={svgRef} className="absolute inset-0 z-[1] pointer-events-none" preserveAspectRatio="none" />

        <div className="relative z-[2] flex flex-row items-stretch justify-center h-[700px] gap-10">
          {hasR16 && <Column colKey="L-r16" title="Oitavas" matches={r16Split.left} phase="Oitavas" />}
          {hasQuarters && <Column colKey="L-qf" title="Quartas" matches={qfSplit.left} phase="Quartas" />}
          {sfSplit.left.length > 0 && <Column colKey="L-sf" title="Semifinal" matches={sfSplit.left} phase="Semifinal" />}

          <div className="flex flex-col items-center justify-center h-full gap-5 px-2">
            <div data-bcol="final" className="flex flex-col justify-center relative">
              <div className="text-center font-black uppercase absolute -top-8 left-0 right-0" style={{ fontSize: 11, letterSpacing: '2px', color: themeColor }}>
                Grande Final
              </div>
              {finalMatch && (
                <div className="flex items-center justify-center">
                  <MatchCard match={finalMatch} phase="Final" />
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-3 mt-2">
              <div className="relative w-28 h-28 grid place-items-center">
                <div className="absolute rounded-full animate-pulse" style={{ inset: -14, background: 'radial-gradient(circle, rgba(245,197,66,0.5) 0%, transparent 70%)' }} />
                {championLogoUrl ? (
                  <img src={championLogoUrl} className="relative z-[2] w-16 h-16 object-contain" style={{ filter: 'drop-shadow(0 0 16px rgba(245,197,66,0.5))' }} alt="" />
                ) : (
                  <Trophy size={56} className="relative z-[2]" style={{ color: '#f5c542', filter: 'drop-shadow(0 0 16px rgba(245,197,66,0.5))' }} />
                )}
              </div>
              <div className="font-black uppercase" style={{ fontSize: 10, letterSpacing: '4px', color: '#f5c542' }}>\u2605 Campe\u00e3o \u2605</div>
              <div className="relative z-[2] text-center rounded-2xl px-5 py-3" style={{
                minWidth: 190,
                background: 'linear-gradient(180deg, rgba(245,197,66,0.14), rgba(245,197,66,0.04))',
                border: '1.5px solid #f5c542',
                boxShadow: '0 0 30px rgba(245,197,66,0.5)',
              }}>
                <div className="mx-auto mb-2 grid place-items-center rounded-xl" style={{ width: 44, height: 44, background: 'rgba(0,0,0,0.3)', border: '1px solid #f5c542' }}>
                  {championVisual?.logoUrl
                    ? <img src={championVisual.logoUrl} className="w-8 h-8 object-contain" alt="" />
                    : <Trophy size={22} style={{ color: '#f5c542' }} />}
                </div>
                <div className="font-black italic uppercase" style={{ fontSize: 18, color: '#f5c542', letterSpacing: '.5px' }}>
                  {championVisual ? championVisual.name : 'A definir'}
                </div>
                <div className="font-bold uppercase mt-1" style={{ fontSize: 9, letterSpacing: '3px', color: '#8a8f9c' }}>
                  Grande Vencedor
                </div>
              </div>
            </div>
          </div>

          {sfSplit.right.length > 0 && <Column colKey="R-sf" title="Semifinal" matches={sfSplit.right} phase="Semifinal" />}
          {hasQuarters && qfSplit.right.length > 0 && <Column colKey="R-qf" title="Quartas" matches={qfSplit.right} phase="Quartas" />}
          {hasR16 && r16Split.right.length > 0 && <Column colKey="R-r16" title="Oitavas" matches={r16Split.right} phase="Oitavas" />}
        </div>
      </div>
    </div>
  );
};

export default ChampionsBracket;
