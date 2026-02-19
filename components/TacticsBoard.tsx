'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Player {
  id: string;
  name: string;
}

const PEN_COLORS = [
  { name: 'Zelená', value: '#22c55e' },
  { name: 'Červená', value: '#ef4444' },
  { name: 'Tmavě žlutá', value: '#ca8a04' },
] as const;

interface PlacedPlayer {
  playerId: string;
  playerName: string;
  x: number; // 0-100 percentage
  y: number;
}

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
}

export default function TacticsBoard({ players }: { players: Player[] }) {
  const [placedPlayers, setPlacedPlayers] = useState<PlacedPlayer[]>([]);
  const [drawMode, setDrawMode] = useState(false);
  const [penColor, setPenColor] = useState(PEN_COLORS[0].value);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [draggingPlayerOnPitch, setDraggingPlayerOnPitch] = useState<string | null>(null);
  const pitchRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const maxPlayers = 11;
  const canAddPlayer = placedPlayers.length < maxPlayers;
  const placedIds = new Set(placedPlayers.map((p) => p.playerId));

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const pitch = pitchRef.current;
    if (!canvas || !pitch) return;
    const rect = pitch.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);
    const scaleX = rect.width / 100;
    const scaleY = rect.height / 100;
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x * scaleX, stroke.points[0].y * scaleY);
      stroke.points.slice(1).forEach((pt) => ctx.lineTo(pt.x * scaleX, pt.y * scaleY));
      ctx.stroke();
    });
    currentStroke.forEach((pt, i) => {
      if (i === 0) return;
      ctx.strokeStyle = penColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(currentStroke[i - 1].x * scaleX, currentStroke[i - 1].y * scaleY);
      ctx.lineTo(pt.x * scaleX, pt.y * scaleY);
      ctx.stroke();
    });
  }, [strokes, currentStroke, penColor]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    const pitch = pitchRef.current;
    if (!pitch) return;
    const ro = new ResizeObserver(() => redrawCanvas());
    ro.observe(pitch);
    return () => ro.disconnect();
  }, [redrawCanvas]);

  const handleDragStart = (e: React.DragEvent, player: Player) => {
    if (!canAddPlayer || placedIds.has(player.id)) return;
    e.dataTransfer.setData('playerId', player.id);
    e.dataTransfer.setData('playerName', player.name);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = pitchRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const avatarId = e.dataTransfer.getData('avatar/playerId');
    if (avatarId) {
      setPlacedPlayers((prev) => prev.map((p) => (p.playerId === avatarId ? { ...p, x, y } : p)));
      setDraggingPlayerOnPitch(null);
      return;
    }

    const playerId = e.dataTransfer.getData('playerId');
    const playerName = e.dataTransfer.getData('playerName');
    if (!canAddPlayer || !playerId || !playerName || placedIds.has(playerId)) return;
    setPlacedPlayers((prev) => [...prev, { playerId, playerName, x, y }]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleAvatarDragStart = (e: React.DragEvent, playerId: string) => {
    setDraggingPlayerOnPitch(playerId);
    e.dataTransfer.setData('avatar/playerId', playerId);
    e.dataTransfer.effectAllowed = 'move';
  };


  const removeFromPitch = (playerId: string) => {
    setPlacedPlayers((prev) => prev.filter((p) => p.playerId !== playerId));
  };

  // Canvas drawing
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!drawMode) return;
    const rect = pitchRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setIsDrawing(true);
    setCurrentStroke([{ x, y }]);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!drawMode || !isDrawing) return;
    const rect = pitchRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCurrentStroke((prev) => [...prev, { x, y }]);
  };

  const handleCanvasMouseUp = () => {
    if (!drawMode || !isDrawing) return;
    if (currentStroke.length > 1) {
      setStrokes((prev) => [...prev, { points: currentStroke, color: penColor }]);
    }
    setCurrentStroke([]);
    setIsDrawing(false);
  };

  const handleCanvasMouseLeave = () => {
    if (isDrawing) handleCanvasMouseUp();
  };

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = pitchRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
    if (clientX == null || clientY == null) return null;
    return { x: ((clientX - rect.left) / rect.width) * 100, y: ((clientY - rect.top) / rect.height) * 100 };
  };

  const handleCanvasTouchStart = (e: React.TouchEvent) => {
    if (!drawMode) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    if (!coords) return;
    setIsDrawing(true);
    setCurrentStroke([coords]);
  };

  const handleCanvasTouchMove = (e: React.TouchEvent) => {
    if (!drawMode || !isDrawing) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    if (!coords) return;
    setCurrentStroke((prev) => [...prev, coords]);
  };

  const handleCanvasTouchEnd = () => {
    if (!drawMode || !isDrawing) return;
    if (currentStroke.length > 1) {
      setStrokes((prev) => [...prev, { points: currentStroke, color: penColor }]);
    }
    setCurrentStroke([]);
    setIsDrawing(false);
  };

  const clearDrawing = () => {
    setStrokes([]);
    setCurrentStroke([]);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 h-[calc(100vh-12rem)] min-h-[400px]">
      {/* Levý panel – hráči */}
      <div className="w-full lg:w-48 xl:w-56 shrink-0 glass-card rounded-2xl p-3 sm:p-4 overflow-hidden flex flex-col">
        <h3 className="text-sm font-semibold text-white mb-2 sm:mb-3">Hráči</h3>
        <p className="text-white/50 text-xs mb-2">
          Přetáhněte na hřiště ({placedPlayers.length}/11)
        </p>
        <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
          {players.length === 0 ? (
            <p className="text-white/40 text-sm py-4">Nejdříve přidejte hráče v záložce Hráči a zápasy.</p>
          ) : (
          players.map((p) => {
            const onPitch = placedIds.has(p.id);
            return (
              <div
                key={p.id}
                draggable={canAddPlayer && !onPitch}
                onDragStart={(e) => handleDragStart(e, p)}
                className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-grab active:cursor-grabbing ${
                  onPitch ? 'bg-white/10 opacity-60' : 'bg-white/5 hover:bg-white/10'
                } ${!canAddPlayer && !onPitch ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-white/60 text-lg" aria-hidden>
                  👕
                </span>
                <span className="text-white text-sm truncate flex-1">{p.name}</span>
              </div>
            );
          })
          )}
        </div>
      </div>

      {/* Hřiště + kreslení */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawMode(!drawMode)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              drawMode ? 'bg-violet-500/50 text-white border border-violet-400/50' : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'
            }`}
          >
            {drawMode ? '✏️ Kreslení' : 'Tužka'}
          </button>
          {drawMode && (
            <>
              {PEN_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setPenColor(c.value)}
                  className={`w-8 h-8 rounded-lg border-2 transition-transform ${
                    penColor === c.value ? 'scale-110 border-white' : 'border-white/30 hover:border-white/50'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
              <button
                type="button"
                onClick={clearDrawing}
                className="px-3 py-1.5 rounded-lg text-sm bg-white/10 text-white/70 hover:bg-white/20"
              >
                Smazat kresbu
              </button>
            </>
          )}
        </div>

        {/* Hřiště */}
        <div
          ref={pitchRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`flex-1 min-h-[280px] relative rounded-2xl overflow-hidden border-2 border-white/30 bg-[#2d5016] ${
            drawMode ? 'cursor-crosshair' : ''
          }`}
        >
          {/* Pitch outline (SVG) */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 105 68" preserveAspectRatio="xMidYMid meet">
            <rect x="1" y="1" width="103" height="66" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
            <line x1="52.5" y1="1" x2="52.5" y2="67" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
            <circle cx="52.5" cy="34" r="9.15" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
            <rect x="1" y="24.85" width="16.5" height="18.3" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
            <rect x="87.5" y="24.85" width="16.5" height="18.3" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
            <rect x="1" y="29.75" width="5.5" height="8.6" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
            <rect x="98.5" y="29.75" width="5.5" height="8.6" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
          </svg>

          {/* Placed players - under canvas when drawing so canvas gets draw events */}
          {placedPlayers.map((p) => (
            <div
              key={p.playerId}
              draggable={!drawMode}
              onDragStart={(e) => !drawMode && handleAvatarDragStart(e, p.playerId)}
              onDrop={(e) => { e.preventDefault(); handleDrop(e); }}
              onDragOver={handleDragOver}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing touch-none select-none ${
                draggingPlayerOnPitch === p.playerId ? 'opacity-50' : ''
              }`}
              style={{ left: `${p.x}%`, top: `${p.y}%`, zIndex: drawMode ? 0 : 1 }}
            >
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/95 shadow-lg flex items-center justify-center text-lg sm:text-xl font-bold text-gray-800 border border-gray-300">
                    👕
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromPitch(p.playerId)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity"
                    title="Odstranit"
                  >
                    ×
                  </button>
                </div>
                <span className="mt-1 text-xs font-medium text-white bg-black/50 px-1.5 py-0.5 rounded max-w-[80px] truncate">
                  {p.playerName}
                </span>
              </div>
            </div>
          ))}

          {/* Drawing canvas - on top when drawing */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: drawMode ? 'auto' : 'none', zIndex: drawMode ? 2 : 0, touchAction: drawMode ? 'none' : 'auto' }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseLeave}
            onTouchStart={handleCanvasTouchStart}
            onTouchMove={handleCanvasTouchMove}
            onTouchEnd={handleCanvasTouchEnd}
            onTouchCancel={handleCanvasTouchEnd}
          />
        </div>
      </div>
    </div>
  );
}
