import React, { useRef } from 'react';

// ─── Ajuste de imagem (arrastar livre + zoom) ─────────────────────────────────
// Reutilizável em qualquer formato (card vertical, banner wide, fundo, etc.)
const ImageAdjuster: React.FC<{
  image: string;
  zoom: number;
  posX: number;
  posY: number;
  bgGradient: string;
  accentColor: string;
  label: string;
  aspectRatio?: string;
  previewWidthClass?: string;
  hideDecor?: boolean;
  onChange: (vals: { zoom?: number; posX?: number; posY?: number }) => void;
}> = ({ image, zoom, posX, posY, bgGradient, accentColor, label, aspectRatio = '360 / 384', previewWidthClass = 'w-56', hideDecor = false, onChange }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const start = useRef({ mx: 0, my: 0, px: 50, py: 100 });

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    start.current = { mx: e.clientX, my: e.clientY, px: posX, py: posY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    const dx = ((e.clientX - start.current.mx) / rect.width) * 100;
    const dy = ((e.clientY - start.current.my) / rect.height) * 100;
    onChange({
      posX: Math.max(-20, Math.min(120, start.current.px + dx)),
      posY: Math.max(-20, Math.min(120, start.current.py + dy)),
    });
  };
  const onPointerUp = () => { dragging.current = false; };

  return (
    <div className="bg-black/20 rounded-2xl p-5 border border-white/10">
      <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: accentColor }}>{label}</p>
      <p className="text-[10px] text-slate-500 mb-4">Arraste a imagem para posicionar. Use o zoom abaixo.</p>

      <div
        ref={boxRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={`relative ${previewWidthClass} mx-auto rounded-3xl overflow-hidden mb-4 border-2 border-white/10 cursor-move select-none touch-none`}
        style={{ background: bgGradient, aspectRatio }}
      >
        {!hideDecor && (
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute -right-6 top-8 w-28 h-1.5 rotate-45" style={{ background: accentColor }}></div>
            <div className="absolute -left-6 bottom-16 w-28 h-1.5 -rotate-45 bg-yellow-400"></div>
          </div>
        )}
        <img src={image} draggable={false} className="absolute pointer-events-none drop-shadow-2xl"
          style={{
            width: `${zoom}%`,
            left: `${posX}%`,
            top: `${posY}%`,
            transform: 'translate(-50%, -50%)',
            maxWidth: 'none',
            maxHeight: 'none',
          }} />
        <div className="absolute bottom-0 inset-x-0 bg-black/40 py-1.5 text-center pointer-events-none">
          <span className="text-white font-black text-[9px] uppercase tracking-widest">Pré-visualização</span>
        </div>
      </div>

      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Zoom: {zoom}%</label>
      <input type="range" min="20" max="500" value={zoom} onChange={e => onChange({ zoom: +e.target.value })} className="w-full" style={{ accentColor }} />
      <div className="flex gap-2 mt-2">
        <button onClick={() => onChange({ zoom: Math.max(20, zoom - 10) })} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded py-1.5 text-xs font-bold text-slate-300">− Diminuir</button>
        <button onClick={() => onChange({ zoom: zoom + 10 })} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded py-1.5 text-xs font-bold text-slate-300">+ Aumentar</button>
      </div>
    </div>
  );
};

export default ImageAdjuster;
