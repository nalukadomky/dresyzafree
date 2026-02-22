'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
}

const PEN_COLORS = [
  { name: 'Zelená', value: '#22c55e' },
  { name: 'Červená', value: '#ef4444' },
  { name: 'Tmavě žlutá', value: '#ca8a04' },
] as const;

interface PlacedPlayer {
  playerId: string;
  playerName: string;
  jerseyNumber?: number;
  x: number; // 0-100 percentage
  y: number;
}

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
}

interface TacticVariant {
  name: string;
  sport: SportType;
  placedPlayers: PlacedPlayer[];
  strokes: Stroke[];
}

const MAX_VARIANTS = 5;

// --- Sport definitions ---
type SportType = 'football' | 'hockey' | 'handball' | 'volleyball' | 'basketball';

interface SportConfig {
  label: string;
  emoji: string;
  viewBox: string;
  maxPlayers: number;
}

const SPORTS: Record<SportType, SportConfig> = {
  football:   { label: 'Fotbal',    emoji: '⚽', viewBox: '0 0 105 68', maxPlayers: 11 },
  hockey:     { label: 'Hokej',     emoji: '🏒', viewBox: '0 0 61 30',  maxPlayers: 6 },
  handball:   { label: 'Házená',    emoji: '🤾', viewBox: '0 0 40 20',  maxPlayers: 7 },
  volleyball: { label: 'Volejbal',  emoji: '🏐', viewBox: '0 0 18 9',   maxPlayers: 6 },
  basketball: { label: 'Basketbal', emoji: '🏀', viewBox: '0 0 28 15',  maxPlayers: 5 },
};

const STROKE_STYLE = { fill: 'none', stroke: 'rgba(255,255,255,0.6)', strokeWidth: 0.5 } as const;
const STROKE_STYLE_THIN = { ...STROKE_STYLE, strokeWidth: 0.3 } as const;
const STROKE_STYLE_DASHED = { ...STROKE_STYLE, strokeDasharray: '0.6 0.4' } as const;

function FieldSVG({ sport }: { sport: SportType }) {
  const s = STROKE_STYLE;
  const st = STROKE_STYLE_THIN;
  const sd = STROKE_STYLE_DASHED;

  switch (sport) {
    case 'football':
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 105 68" preserveAspectRatio="xMidYMid meet">
          <rect x="1" y="1" width="103" height="66" {...s} />
          <line x1="52.5" y1="1" x2="52.5" y2="67" {...s} />
          <circle cx="52.5" cy="34" r="9.15" {...s} />
          <circle cx="52.5" cy="34" r="0.5" fill="rgba(255,255,255,0.6)" />
          <rect x="1" y="24.85" width="16.5" height="18.3" {...s} />
          <rect x="87.5" y="24.85" width="16.5" height="18.3" {...s} />
          <rect x="1" y="29.75" width="5.5" height="8.6" {...s} />
          <rect x="98.5" y="29.75" width="5.5" height="8.6" {...s} />
          {/* Penalty spots */}
          <circle cx="12" cy="34" r="0.4" fill="rgba(255,255,255,0.6)" />
          <circle cx="93" cy="34" r="0.4" fill="rgba(255,255,255,0.6)" />
          {/* Corner arcs */}
          <path d="M 1 4 A 3 3 0 0 1 4 1" {...st} />
          <path d="M 101 1 A 3 3 0 0 1 104 4" {...st} />
          <path d="M 4 67 A 3 3 0 0 1 1 64" {...st} />
          <path d="M 104 64 A 3 3 0 0 1 101 67" {...st} />
        </svg>
      );

    case 'hockey': {
      const ks = { fill: 'none', stroke: 'rgba(255,255,255,0.6)', strokeWidth: 0.3 } as const;
      const kst = { ...ks, strokeWidth: 0.2 } as const;
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 61 30" preserveAspectRatio="xMidYMid meet">
          {/* Rink outline with rounded corners */}
          <rect x="1" y="1" width="59" height="28" rx="8" ry="8" {...ks} />
          {/* Center line */}
          <line x1="30.5" y1="1" x2="30.5" y2="29" stroke="rgba(255,255,255,0.6)" strokeWidth="0.25" />
          {/* Blue lines */}
          <line x1="20" y1="1" x2="20" y2="29" stroke="rgba(100,150,255,0.5)" strokeWidth="0.25" />
          <line x1="41" y1="1" x2="41" y2="29" stroke="rgba(100,150,255,0.5)" strokeWidth="0.25" />
          {/* Center circle */}
          <circle cx="30.5" cy="15" r="4.5" {...ks} />
          <circle cx="30.5" cy="15" r="0.2" fill="rgba(255,255,255,0.6)" />
          {/* Faceoff circles */}
          <circle cx="11" cy="8" r="4.5" {...kst} />
          <circle cx="11" cy="22" r="4.5" {...kst} />
          <circle cx="50" cy="8" r="4.5" {...kst} />
          <circle cx="50" cy="22" r="4.5" {...kst} />
          {/* Faceoff dots */}
          <circle cx="11" cy="8" r="0.2" fill="rgba(255,255,255,0.6)" />
          <circle cx="11" cy="22" r="0.2" fill="rgba(255,255,255,0.6)" />
          <circle cx="50" cy="8" r="0.2" fill="rgba(255,255,255,0.6)" />
          <circle cx="50" cy="22" r="0.2" fill="rgba(255,255,255,0.6)" />
          {/* Goal creases */}
          <path d="M 4 11.5 A 3 3 0 0 1 4 18.5" {...ks} />
          <path d="M 57 11.5 A 3 3 0 0 0 57 18.5" {...ks} />
          {/* Goal lines */}
          <line x1="4" y1="11.5" x2="4" y2="18.5" {...kst} />
          <line x1="57" y1="11.5" x2="57" y2="18.5" {...kst} />
        </svg>
      );
    }

    case 'handball': {
      const hs = { fill: 'none', stroke: 'rgba(255,255,255,0.6)', strokeWidth: 0.2 } as const;
      const hst = { ...hs, strokeWidth: 0.15 } as const;
      const hsd = { ...hs, strokeDasharray: '0.4 0.3' } as const;
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 40 20" preserveAspectRatio="xMidYMid meet">
          <rect x="0.5" y="0.5" width="39" height="19" {...hs} />
          {/* Center line */}
          <line x1="20" y1="0.5" x2="20" y2="19.5" {...hs} />
          {/* Center circle */}
          <circle cx="20" cy="10" r="3" {...hst} />
          {/* 6m goal area (semicircles) */}
          <path d="M 0.5 4 A 6 6 0 0 1 0.5 16" {...hs} />
          <path d="M 39.5 4 A 6 6 0 0 0 39.5 16" {...hs} />
          {/* 9m free throw line (dashed semicircles) */}
          <path d="M 0.5 1 A 9 9 0 0 1 0.5 19" {...hsd} />
          <path d="M 39.5 1 A 9 9 0 0 0 39.5 19" {...hsd} />
          {/* 7m penalty marks */}
          <line x1="7" y1="9.5" x2="7" y2="10.5" stroke="rgba(255,255,255,0.6)" strokeWidth="0.15" />
          <line x1="33" y1="9.5" x2="33" y2="10.5" stroke="rgba(255,255,255,0.6)" strokeWidth="0.15" />
          {/* Goal */}
          <line x1="0.5" y1="7" x2="0.5" y2="13" stroke="rgba(255,255,255,0.8)" strokeWidth="0.25" />
          <line x1="39.5" y1="7" x2="39.5" y2="13" stroke="rgba(255,255,255,0.8)" strokeWidth="0.25" />
        </svg>
      );
    }

    case 'volleyball': {
      const vs = { fill: 'none', stroke: 'rgba(255,255,255,0.6)', strokeWidth: 0.12 } as const;
      const vst = { ...vs, strokeWidth: 0.08 } as const;
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 18 9" preserveAspectRatio="xMidYMid meet">
          <rect x="0.3" y="0.3" width="17.4" height="8.4" {...vs} />
          {/* Net (center line) */}
          <line x1="9" y1="0.3" x2="9" y2="8.7" stroke="rgba(255,255,255,0.7)" strokeWidth="0.1" />
          {/* Attack lines (3m from center) */}
          <line x1="6" y1="0.3" x2="6" y2="8.7" {...vst} />
          <line x1="12" y1="0.3" x2="12" y2="8.7" {...vst} />
        </svg>
      );
    }

    case 'basketball': {
      const bs = { fill: 'none', stroke: 'rgba(255,255,255,0.6)', strokeWidth: 0.18 } as const;
      const bst = { ...bs, strokeWidth: 0.12 } as const;
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 28 15" preserveAspectRatio="xMidYMid meet">
          <rect x="0.5" y="0.5" width="27" height="14" {...bs} />
          {/* Center line */}
          <line x1="14" y1="0.5" x2="14" y2="14.5" {...bs} />
          {/* Center circle */}
          <circle cx="14" cy="7.5" r="1.8" {...bs} />
          {/* Paint / key areas */}
          <rect x="0.5" y="3.5" width="5.8" height="8" {...bs} />
          <rect x="21.7" y="3.5" width="5.8" height="8" {...bs} />
          {/* Free throw circles */}
          <circle cx="6.3" cy="7.5" r="1.8" {...bst} />
          <circle cx="21.7" cy="7.5" r="1.8" {...bst} />
          {/* Backboard lines */}
          <line x1="1.2" y1="5.5" x2="1.2" y2="9.5" stroke="rgba(255,255,255,0.5)" strokeWidth="0.12" />
          <line x1="26.8" y1="5.5" x2="26.8" y2="9.5" stroke="rgba(255,255,255,0.5)" strokeWidth="0.12" />
          {/* 3-point arcs */}
          <path d="M 0.5 2 A 7.5 7.5 0 0 1 0.5 13" {...bst} />
          <path d="M 27.5 2 A 7.5 7.5 0 0 0 27.5 13" {...bst} />
          {/* Basket positions */}
          <circle cx="1.6" cy="7.5" r="0.15" fill="rgba(255,255,255,0.6)" />
          <circle cx="26.4" cy="7.5" r="0.15" fill="rgba(255,255,255,0.6)" />
        </svg>
      );
    }
  }
}

// --- Jersey PNG image ---
const JERSEY_IMG = '/images/dres_taktika.png';

function JerseySVG({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={JERSEY_IMG}
      alt=""
      width={size}
      height={size}
      className={`object-contain drop-shadow-lg ${className}`}
      draggable={false}
    />
  );
}

function JerseySVGSmall() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={JERSEY_IMG}
      alt=""
      width={24}
      height={24}
      className="object-contain opacity-75"
      draggable={false}
    />
  );
}

export default function TacticsBoard({ players }: { players: Player[] }) {
  const [placedPlayers, setPlacedPlayers] = useState<PlacedPlayer[]>([]);
  const [drawMode, setDrawMode] = useState(false);
  const [penColor, setPenColor] = useState<string>(PEN_COLORS[0].value);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [draggingPlayerOnPitch, setDraggingPlayerOnPitch] = useState<string | null>(null);
  const [sport, setSport] = useState<SportType>('football');

  // --- Tactic variants ---
  const [variants, setVariants] = useState<TacticVariant[]>([]);
  const [activeVariantIdx, setActiveVariantIdx] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<number | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [sportMenuOpen, setSportMenuOpen] = useState(false);
  const sportMenuRef = useRef<HTMLDivElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const pitchRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Escape to exit fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [fullscreen]);

  // Close sport menu on click outside
  useEffect(() => {
    if (!sportMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (sportMenuRef.current && !sportMenuRef.current.contains(e.target as Node)) {
        setSportMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [sportMenuOpen]);

  const sportConfig = SPORTS[sport];
  const maxPlayers = sportConfig.maxPlayers;
  const canAddPlayer = placedPlayers.length < maxPlayers;
  const placedIds = new Set(placedPlayers.map((p) => p.playerId));

  // Save current board state into the active variant
  const saveToActiveVariant = useCallback(() => {
    if (activeVariantIdx === null) return;
    setVariants((prev) => prev.map((v, i) =>
      i === activeVariantIdx ? { ...v, sport, placedPlayers, strokes } : v
    ));
  }, [activeVariantIdx, sport, placedPlayers, strokes]);

  // Auto-save when board changes
  useEffect(() => {
    saveToActiveVariant();
  }, [placedPlayers, strokes, sport, saveToActiveVariant]);

  const handleSaveVariant = () => {
    if (variants.length >= MAX_VARIANTS) return;
    const newVariant: TacticVariant = {
      name: `Varianta ${variants.length + 1}`,
      sport,
      placedPlayers: [...placedPlayers],
      strokes: [...strokes],
    };
    const newIdx = variants.length;
    setVariants((prev) => [...prev, newVariant]);
    setActiveVariantIdx(newIdx);
  };

  const handleLoadVariant = (idx: number) => {
    const v = variants[idx];
    if (!v) return;
    setSport(v.sport);
    setPlacedPlayers(v.placedPlayers);
    setStrokes(v.strokes);
    setCurrentStroke([]);
    setActiveVariantIdx(idx);
  };

  const handleDeleteVariant = (idx: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
    if (activeVariantIdx === idx) {
      setActiveVariantIdx(null);
    } else if (activeVariantIdx !== null && activeVariantIdx > idx) {
      setActiveVariantIdx(activeVariantIdx - 1);
    }
  };

  const handleRenameVariant = (idx: number) => {
    if (!editNameValue.trim()) return;
    setVariants((prev) => prev.map((v, i) => i === idx ? { ...v, name: editNameValue.trim() } : v));
    setEditingName(null);
    setEditNameValue('');
  };

  const handleNewBoard = () => {
    setPlacedPlayers([]);
    setStrokes([]);
    setCurrentStroke([]);
    setActiveVariantIdx(null);
  };

  const handleSportChange = (newSport: SportType) => {
    if (newSport === sport) return;
    // Detach from active variant so auto-save doesn't overwrite it
    setActiveVariantIdx(null);
    setSport(newSport);
    setPlacedPlayers([]);
    setStrokes([]);
    setCurrentStroke([]);
  };

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
    e.dataTransfer.setData('jerseyNumber', player.jerseyNumber != null ? String(player.jerseyNumber) : '');
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
    const jerseyNumberRaw = e.dataTransfer.getData('jerseyNumber');
    const jerseyNumber = jerseyNumberRaw ? Number(jerseyNumberRaw) : undefined;
    if (!canAddPlayer || !playerId || !playerName || placedIds.has(playerId)) return;
    setPlacedPlayers((prev) => [...prev, { playerId, playerName, jerseyNumber, x, y }]);
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
    <div
      ref={containerRef}
      className={`flex flex-col lg:flex-row gap-3 sm:gap-4 min-h-[400px] ${
        fullscreen
          ? 'fixed inset-0 z-50 bg-[#0a0a0f] p-4 h-screen'
          : 'h-[calc(100vh-12rem)]'
      }`}
    >
      {/* Levý panel - hráči */}
      <div className="w-full lg:w-48 xl:w-56 shrink-0 glass-card rounded-2xl p-3 sm:p-4 overflow-hidden flex flex-col">
        <h3 className="text-sm font-semibold text-white mb-2 sm:mb-3">Hráči</h3>
        <p className="text-white/50 text-xs mb-2">
          Přetáhněte na hřiště ({placedPlayers.length}/{maxPlayers})
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
                <JerseySVGSmall />
                <span className="text-white text-sm truncate flex-1">
                  {p.jerseyNumber != null ? `#${p.jerseyNumber} ` : ''}{p.name}
                </span>
              </div>
            );
          })
          )}
        </div>
      </div>

      {/* Hřiště + kreslení */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        {/* Sport selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="relative" ref={sportMenuRef}>
            <button
              type="button"
              onClick={() => setSportMenuOpen(!sportMenuOpen)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/20 text-white border border-white/30 transition-colors flex items-center gap-1.5"
            >
              {sportConfig.emoji} {sportConfig.label}
              <svg className={`w-3 h-3 transition-transform ${sportMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {sportMenuOpen && (
              <div className="absolute top-full left-0 mt-1 py-1 rounded-lg bg-[#1a1a2e] border border-white/20 shadow-xl z-20 min-w-[140px]">
                {(Object.entries(SPORTS) as [SportType, SportConfig][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { handleSportChange(key); setSportMenuOpen(false); }}
                    className={`w-full px-3 py-1.5 text-xs font-medium text-left transition-colors flex items-center gap-2 ${
                      sport === key
                        ? 'bg-white/15 text-white'
                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{cfg.emoji}</span>
                    <span>{cfg.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Variant tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {variants.map((v, idx) => (
            <div key={idx} className="flex items-center gap-0">
              {editingName === idx ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); handleRenameVariant(idx); }}
                  className="flex items-center"
                >
                  <input
                    type="text"
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    onBlur={() => handleRenameVariant(idx)}
                    autoFocus
                    className="px-2 py-1 rounded-l-lg text-xs bg-white/15 text-white border border-white/30 outline-none w-24"
                  />
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => handleLoadVariant(idx)}
                  onDoubleClick={() => { setEditingName(idx); setEditNameValue(v.name); }}
                  className={`px-2.5 py-1.5 rounded-l-lg text-xs font-medium transition-colors ${
                    activeVariantIdx === idx
                      ? 'bg-blue-500/40 text-white border border-blue-400/40'
                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 border border-white/10'
                  }`}
                  title="Klikni pro načtení, dvojklik pro přejmenování"
                >
                  {v.name}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDeleteVariant(idx)}
                className="px-1.5 py-1.5 rounded-r-lg text-xs text-white/30 hover:text-red-400 hover:bg-red-500/10 border border-l-0 border-white/10 transition-colors"
                title="Smazat variantu"
              >
                ×
              </button>
            </div>
          ))}
          {variants.length < MAX_VARIANTS && (
            <button
              type="button"
              onClick={handleSaveVariant}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 border border-dashed border-white/20 transition-colors"
              title="Uložit aktuální rozestavení jako novou variantu"
            >
              + Uložit variantu
            </button>
          )}
          {activeVariantIdx !== null && (
            <button
              type="button"
              onClick={handleNewBoard}
              className="px-2.5 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 transition-colors"
              title="Nová prázdná tabule"
            >
              Nová tabule
            </button>
          )}
        </div>

        {/* Drawing toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawMode(!drawMode)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              drawMode ? 'bg-blue-500/50 text-white border border-blue-400/50' : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'
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
          {(placedPlayers.length > 0 || strokes.length > 0) && (
            <button
              type="button"
              onClick={() => {
                setPlacedPlayers([]);
                setStrokes([]);
                setCurrentStroke([]);
              }}
              className="px-3 py-1.5 rounded-lg text-sm bg-white/10 text-white/70 hover:bg-red-500/20 hover:text-red-300 border border-white/10 hover:border-red-400/30 transition-colors"
              title="Resetovat rozestavení hráčů a kresbu"
            >
              Resetovat
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setFullscreen(!fullscreen)}
            className="px-2.5 py-1.5 rounded-lg text-sm bg-white/10 text-white/70 hover:bg-white/20 border border-white/10 transition-colors"
            title={fullscreen ? 'Ukončit celou obrazovku (Esc)' : 'Celá obrazovka'}
          >
            {fullscreen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0v4m0-4h4m7 11l5 5m0 0v-4m0 4h-4M9 15l-5 5m0 0v-4m0 4h4m7-11l5-5m0 0v4m0-4h-4" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
            )}
          </button>
        </div>

        {/* Hřiště */}
        <div
          ref={pitchRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`flex-1 min-h-[280px] relative rounded-2xl overflow-hidden border-2 border-white/30 ${
            drawMode ? 'cursor-crosshair' : ''
          }`}
        >
          {/* Pitch outline (SVG) */}
          <FieldSVG sport={sport} />

          {/* Placed players */}
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
                  <JerseySVG size={48} className="sm:w-14 sm:h-14 drop-shadow-lg" />
                  {p.jerseyNumber != null && (
                    <span className="absolute inset-0 flex items-center justify-center text-[11px] sm:text-xs font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                      #{p.jerseyNumber}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFromPitch(p.playerId)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity"
                    title="Odstranit"
                  >
                    ×
                  </button>
                </div>
                <span className="mt-0.5 text-[10px] sm:text-xs font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] max-w-[80px] truncate">
                  {p.playerName}
                </span>
              </div>
            </div>
          ))}

          {/* Drawing canvas */}
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
