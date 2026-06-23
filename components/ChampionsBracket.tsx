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
interface TeamVisual { name: string; logoUrl?: string; }
interface ChampionsBracketProps {
  r16: MatchLike[];
  quarters: MatchLike[];
  semis: MatchLike[];
  finals: MatchLike[];
  r32?: MatchLike[];
  getTeamVisual: (teamId?: string) => TeamVisual;
  themeColor: string;
  /** Cor de destaque do chaveamento (linhas, bordas, vencedor). Default = themeColor */
  accentColor?: string;
  /** Cor do texto das informações (nomes/placar). Default = claro */
  textColor?: string;
  /** Troféu personalizado mostrado no centro. Default = ícone padrão */
  championTrophyUrl?: string;
  /** Fonte dos nomes dos times no chaveamento */
  nameFont?: string;
  /** Cor de fundo dos cards do chaveamento */
  cardColor?: string;
  championLogoUrl?: string;
  backgroundUrl?: string;
  backgroundOpacity?: number;
  onMatchClick?: (match: MatchLike) => void;
}

const ChampionsBracket: React.FC<ChampionsBracketProps> = ({
  r16, quarters, semis, finals, r32 = [], getTeamVisual, themeColor,
  accentColor, textColor, championTrophyUrl, nameFont, cardColor,
  championLogoUrl, backgroundUrl, backgroundOpacity = 0.25, onMatchClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [, setTick] = useState(0);

  // Cores configuráveis (com fallback para o tema)
  const accent = accentColor || themeColor;
  const txt = textColor || '#f3f5f0';
  const txtMuted = textColor ? `${textColor}99` : '#8a8f9c';
  const cardBg = cardColor || 'linear-gradient(180deg, #2b2e38, #23252e)';
  const labelShadow = '0 1px 5px rgba(0,0,0,0.95)';
  const trophyImg = championTrophyUrl || championLogoUrl;

  // Fases existentes (da maior para a final)
  const phaseList = [
    { key: 'r32', title: 'Fase 32', matches: r32 },
    { key: 'r16', title: 'Oitavas', matches: r16 },
    { key: 'qf', title: 'Quartas', matches: quarters },
    { key: 'sf', title: 'Semifinal', matches: semis },
  ].filter(p => p.matches.length > 0);

  const maxMatches = Math.max(1, ...phaseList.map(p => p.matches.length));
  const halfMax = Math.ceil(maxMatches / 2); // nº de confrontos da maior fase em CADA lado

  // ---- ESCALA conforme tamanho ----
  let CARD_W = 230, CARD_H = 74, V_GAP = 50, COL_GAP = 44, FONT = 13, CREST = 32, showHead = true;
  if (maxMatches >= 32) { CARD_W = 160, CARD_H = 52, V_GAP = 30, COL_GAP = 30, FONT = 10, CREST = 22, showHead = false; }
  else if (maxMatches >= 16) { CARD_W = 188, CARD_H = 60, V_GAP = 40, COL_GAP = 36, FONT = 11.5, CREST = 26, showHead = false; }
  else if (maxMatches >= 8) { CARD_W = 220, CARD_H = 72, V_GAP = 52, COL_GAP = 40, FONT = 13, CREST = 31, showHead = true; }

  const TOP_PAD = 54;
  const BOTTOM_PAD = 40;
  const slotH = CARD_H + V_GAP;                 // altura de cada confronto da maior fase (em um lado)
  const contentH = halfMax * slotH;             // altura ocupada por um lado da maior fase
  const totalH = contentH + TOP_PAD + BOTTOM_PAD;

  // Troféu personalizado GRANDE (até 150px), mas proporcional à altura do
  // chaveamento pra não estourar em mata-mata com poucos times.
  const trophySize = trophyImg ? Math.round(Math.max(90, Math.min(150, totalH * 0.32))) : 64;

  // Centro vertical do i-ésimo confronto de UM LADO da maior fase
  const baseCenterSide = (i: number) => TOP_PAD + i * slotH + slotH / 2;

  // Distribuição HIERÁRQUICA: cada confronto de uma fase fica exatamente no
  // centro vertical dos dois confrontos que o alimentam na fase anterior.
  // Isso garante a árvore equilibrada (sem "buracos" nem cards colados).
  const buildSideCenters = (counts: number[]): number[][] => {
    const result: number[][] = [];
    counts.forEach((count, phaseIdx) => {
      if (count <= 0) { result.push([]); return; }
      if (phaseIdx === 0) {
        result.push(Array.from({ length: count }, (_, i) => baseCenterSide(i)));
      } else {
        const prev = result[phaseIdx - 1];
        result.push(Array.from({ length: count }, (_, i) => {
          const a = prev[i * 2];
          const b = prev[i * 2 + 1];
          if (a != null && b != null) return (a + b) / 2;
          if (a != null) return a;
          return baseCenterSide(i);
        }));
      }
    });
    return result;
  };

  // Cada fase é dividida em lado esquerdo/direito; calculamos os centros por lado.
  const leftCounts = phaseList.map(p => Math.ceil(p.matches.length / 2));
  const rightCounts = phaseList.map(p => Math.floor(p.matches.length / 2));
  const leftCenters = buildSideCenters(leftCounts);
  const rightCenters = buildSideCenters(rightCounts);

  const built: Record<string, { left: { match: MatchLike; top: number }[]; right: { match: MatchLike; top: number }[] }> = {};
  phaseList.forEach((p, idx) => {
    const mid = Math.ceil(p.matches.length / 2);
    const left = p.matches.slice(0, mid);
    const right = p.matches.slice(mid);
    built[p.key] = {
      left: left.map((m, i) => ({ match: m, top: leftCenters[idx][i] })),
      right: right.map((m, i) => ({ match: m, top: rightCenters[idx][i] })),
    };
  });

  const finalMatch = finals[0];
  const championVisual = finalMatch && finalMatch.isFinished
    ? getTeamVisual((finalMatch.homeScore ?? 0) > (finalMatch.awayScore ?? 0) ? finalMatch.homeTeamId : finalMatch.awayTeamId)
    : null;

  const leftOrder = phaseList.map(p => p.key);
  const rightOrder = [...leftOrder].reverse();
  const totalW = leftOrder.length * 2 * (CARD_W + COL_GAP) + CARD_W + COL_GAP * 2 + 120;

  // ---- Conexões ----
  const drawLinks = () => {
    const stage = stageRef.current, svg = svgRef.current;
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
        path.setAttribute('stroke', accent);
        path.setAttribute('stroke-width', maxMatches >= 16 ? '1.3' : '1.7');
        path.setAttribute('opacity', '0.5');
        path.style.filter = `drop-shadow(0 0 3px ${accent})`;
        svg.appendChild(path);
      });
    };
    const lCols = leftOrder.map(k => `L-${k}`).concat('final');
    for (let i = 0; i < lCols.length - 1; i++) connect(lCols[i], lCols[i + 1], 'right');
    const rCols = leftOrder.map(k => `R-${k}`).concat('final');
    for (let i = 0; i < rCols.length - 1; i++) connect(rCols[i], rCols[i + 1], 'left');
  };

  useEffect(() => {
    const t = setTimeout(drawLinks, 130);
    setTick(x => x + 1);
    const onResize = () => drawLinks();
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(t); window.removeEventListener('resize', onResize); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r32, r16, quarters, semis, finals, accent, textColor]);

  const Card: React.FC<{ match: MatchLike; phase: string }> = ({ match, phase }) => {
    const h = getTeamVisual(match.homeTeamId);
    const a = getTeamVisual(match.awayTeamId);
    const hasHome = match.homeTeamId && match.homeTeamId !== 'TBD';
    const hasAway = match.awayTeamId && match.awayTeamId !== 'TBD';
    const homeWon = match.isFinished && (match.homeScore ?? 0) > (match.awayScore ?? 0);
    const awayWon = match.isFinished && (match.awayScore ?? 0) > (match.homeScore ?? 0);
    const rowPad = maxMatches >= 32 ? '3px 8px' : maxMatches >= 16 ? '5px 9px' : '7px 11px';
    const gap = CREST > 24 ? 10 : 6;
    return (
      <div data-bcard onClick={() => onMatchClick && onMatchClick(match)}
        className="rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
        style={{ width: CARD_W, background: cardBg, border: `1px solid ${accent}55`, boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}>
        {showHead && (
          <div className="text-center font-black uppercase" style={{ fontSize: 9, letterSpacing: '2px', color: accent, background: `${accent}1f`, borderBottom: `1px solid ${accent}30`, padding: '4px' }}>{phase}</div>
        )}
        <div className="flex flex-col">
          <div className="flex items-center" style={{ gap, padding: rowPad, background: homeWon ? `${accent}1a` : 'transparent' }}>
            <div className="flex items-center justify-center shrink-0" style={{ width: CREST, height: CREST }}>
              {hasHome ? (h.logoUrl ? <img src={h.logoUrl} className="w-full h-full object-contain" alt="" /> : <Shield size={CREST * 0.55} style={{ color: accent }} />) : <div className="w-full h-full" />}
            </div>
            <span className="flex-1 truncate font-bold uppercase" style={{ fontSize: FONT, fontFamily: nameFont || undefined, color: homeWon ? accent : (hasHome ? txt : txtMuted) }}>{hasHome ? h.name : 'A definir'}</span>
            {homeWon && CREST > 22 && <Check size={12} style={{ color: accent }} className="shrink-0" />}
            <span className="font-black text-center shrink-0" style={{ fontSize: FONT + 3, minWidth: 20, color: homeWon ? accent : txt }}>{match.homeScore ?? '\u2013'}</span>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
          <div className="flex items-center" style={{ gap, padding: rowPad, background: awayWon ? `${accent}1a` : 'transparent' }}>
            <div className="flex items-center justify-center shrink-0" style={{ width: CREST, height: CREST }}>
              {hasAway ? (a.logoUrl ? <img src={a.logoUrl} className="w-full h-full object-contain" alt="" /> : <Shield size={CREST * 0.55} style={{ color: accent }} />) : <div className="w-full h-full" />}
            </div>
            <span className="flex-1 truncate font-bold uppercase" style={{ fontSize: FONT, fontFamily: nameFont || undefined, color: awayWon ? accent : (hasAway ? txt : txtMuted) }}>{hasAway ? a.name : 'A definir'}</span>
            {awayWon && CREST > 22 && <Check size={12} style={{ color: accent }} className="shrink-0" />}
            <span className="font-black text-center shrink-0" style={{ fontSize: FONT + 3, minWidth: 20, color: awayWon ? accent : txt }}>{match.awayScore ?? '\u2013'}</span>
          </div>
        </div>
      </div>
    );
  };

  // Coluna: largura fixa, cards posicionados por TOP absoluto
  const Col: React.FC<{ colKey: string; title: string; items: { match: MatchLike; top: number }[]; leftPx: number }> = ({ colKey, title, items, leftPx }) => (
    <div data-bcol={colKey} className="absolute top-0" style={{ left: leftPx, width: CARD_W, height: totalH }}>
      <div className="text-center font-black uppercase absolute left-0 right-0" style={{ top: 18, fontSize: 11, letterSpacing: '2px', color: txtMuted, textShadow: labelShadow }}>{title}</div>
      {items.map((it, i) => (
        <div key={`${it.match.id}-${i}`} className="absolute" style={{ top: it.top, left: 0, transform: 'translateY(-50%)' }}>
          <Card match={it.match} phase={title} />
        </div>
      ))}
    </div>
  );

  // Posições X (left) de cada coluna
  const colStep = CARD_W + COL_GAP;
  const leftXs = leftOrder.map((_, i) => 60 + i * colStep);
  const centerX = 60 + leftOrder.length * colStep;
  const rightXs = rightOrder.map((_, i) => centerX + (CARD_W + COL_GAP) + i * colStep);
  const finalCenterY = totalH / 2;

  return (
    <div className="relative w-full overflow-x-auto rounded-2xl" style={{ background: backgroundUrl ? '#0a0b0f' : '#1e1f26' }}>
      {backgroundUrl && (
        <div className="absolute inset-0 z-0" style={{ backgroundImage: `url(${backgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: backgroundOpacity }} />
      )}
      <div ref={stageRef} className="relative mx-auto" style={{ width: totalW, height: totalH }}>
        {/* marca d'água */}
        <svg className="absolute top-1/2 left-1/2 pointer-events-none z-0" style={{ transform: 'translate(-50%,-50%)', width: Math.min(520, totalH * 0.65), height: Math.min(520, totalH * 0.65), opacity: 0.05 }}
          viewBox="0 0 200 200" fill="none" stroke={accent} strokeWidth="1.5">
          <circle cx="100" cy="100" r="92" />
          <path d="M100 40l34 25-13 40h-42l-13-40z" />
          <path d="M100 40V8M134 65l36-13M121 105l22 30M79 105l-22 30M66 65L30 52" />
          <circle cx="100" cy="100" r="6" fill={accent} stroke="none" />
        </svg>

        <svg ref={svgRef} className="absolute inset-0 z-[1] pointer-events-none" preserveAspectRatio="none" />

        {/* LADO ESQUERDO */}
        {leftOrder.map((key, i) => (
          <Col key={`L-${key}`} colKey={`L-${key}`} title={built[key] ? phaseList.find(p => p.key === key)!.title : ''} items={built[key]?.left || []} leftPx={leftXs[i]} />
        ))}

        {/* CENTRO: FINAL + CAMPEÃO (posicionado absoluto) */}
        <div data-bcol="final" className="absolute z-[2]" style={{ left: centerX, width: CARD_W, top: finalCenterY, transform: 'translateY(-50%)' }}>
          <div className="text-center font-black uppercase mb-2" style={{ fontSize: 11, letterSpacing: '2px', color: accent, textShadow: labelShadow }}>Grande Final</div>
          {finalMatch && <Card match={finalMatch} phase="Final" />}
          <div className="flex flex-col items-center gap-2 mt-4">
            <div className="relative grid place-items-center" style={{ width: trophySize + 24, height: trophySize + 24 }}>
              <div className="absolute rounded-full animate-pulse" style={{ inset: -8, background: `radial-gradient(circle, ${accent}80 0%, transparent 70%)` }} />
              {trophyImg
                ? <img src={trophyImg} className="relative z-[2] object-contain" style={{ width: trophySize, height: trophySize, filter: `drop-shadow(0 0 22px ${accent}aa)` }} alt="" />
                : <Trophy size={trophySize} className="relative z-[2]" style={{ color: accent, filter: `drop-shadow(0 0 14px ${accent}88)` }} />}
            </div>
            <div className="font-black uppercase" style={{ fontSize: 9, letterSpacing: '4px', color: accent }}>★ CAMPEÃO ★</div>
            <div className="relative z-[2] text-center rounded-xl px-4 py-2.5" style={{ minWidth: 160, background: `linear-gradient(180deg, ${accent}24, ${accent}08)`, border: `1.5px solid ${accent}`, boxShadow: `0 0 24px ${accent}73` }}>
              <div className="font-black italic uppercase" style={{ fontSize: 16, color: accent }}>{championVisual ? championVisual.name : 'A definir'}</div>
              <div className="font-bold uppercase mt-0.5" style={{ fontSize: 8, letterSpacing: '3px', color: txtMuted }}>Grande Vencedor</div>
            </div>
          </div>
        </div>

        {/* LADO DIREITO */}
        {rightOrder.map((key, i) => (
          <Col key={`R-${key}`} colKey={`R-${key}`} title={phaseList.find(p => p.key === key)!.title} items={built[key]?.right || []} leftPx={rightXs[i]} />
        ))}
      </div>
    </div>
  );
};

export default ChampionsBracket;
