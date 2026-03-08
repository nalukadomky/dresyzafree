'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  ImageIcon,
  Sparkles,
  Download,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  UserPlus,
  Check,
  Shirt,
  User,
  X,
} from 'lucide-react';
import DashboardBackground from '@/components/DashboardBackground';
import CursorGlow from '@/components/CursorGlow';
import { useToast } from '@/components/ui/toast';
import { resizeImageFile } from '@/lib/image-utils';

/* ─────────────────────── Types ─────────────────────── */

type Step = 1 | 2 | 3;
type ViewState = 'wizard' | 'result';

interface PhotoState {
  file: File | null;
  preview: string;
  url: string;
}

/* ─────────────────────── Constants ─────────────────────── */

const STEPS = [
  { num: 1 as const, label: 'Fotka hráče', icon: User },
  { num: 2 as const, label: 'Dres týmu', icon: Shirt },
  { num: 3 as const, label: 'Generování', icon: Sparkles },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

/* ─────────────────────── Page ─────────────────────── */

export default function TestPlayerCardPage() {
  const toast = useToast();

  // Wizard state
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const [view, setView] = useState<ViewState>('wizard');

  // Photo states
  const [playerPhoto, setPlayerPhoto] = useState<PhotoState>({ file: null, preview: '', url: '' });
  const [jerseyPhoto, setJerseyPhoto] = useState<PhotoState>({ file: null, preview: '', url: '' });
  const [cachedJersey, setCachedJersey] = useState<{ url: string; exists: boolean } | null>(null);

  // Generation state
  const [playerName, setPlayerName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedCardUrl, setGeneratedCardUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Check for cached jersey on mount
  useEffect(() => {
    fetch('/api/test/jersey')
      .then((r) => r.json())
      .then((data) => setCachedJersey(data))
      .catch(() => setCachedJersey({ url: '', exists: false }));
  }, []);

  /* ─────────── Navigation ─────────── */

  const goTo = useCallback((newStep: Step) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  }, [step]);

  const reset = useCallback((keepJersey = false) => {
    setStep(1);
    setDirection(-1);
    setView('wizard');
    setPlayerPhoto({ file: null, preview: '', url: '' });
    if (!keepJersey) setJerseyPhoto({ file: null, preview: '', url: '' });
    setPlayerName('');
    setGenerating(false);
    setGeneratedCardUrl('');
  }, []);

  /* ─────────── Upload ─────────── */

  const uploadFile = useCallback(async (file: File, type: 'player' | 'jersey'): Promise<string> => {
    setUploading(true);
    try {
      const resized = await resizeImageFile(file, 800);
      const form = new FormData();
      form.append('file', resized, file.name);
      form.append('type', type);

      const res = await fetch('/api/test/upload', { method: 'POST', body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Chyba uploadu');
      return data.url;
    } finally {
      setUploading(false);
    }
  }, []);

  const handlePlayerFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Nahrajte prosím obrázek (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Maximální velikost je 5 MB');
      return;
    }

    const preview = URL.createObjectURL(file);
    setPlayerPhoto({ file, preview, url: '' });

    try {
      const url = await uploadFile(file, 'player');
      setPlayerPhoto((prev) => ({ ...prev, url }));
    } catch (e: any) {
      toast.error(e.message);
      setPlayerPhoto({ file: null, preview: '', url: '' });
    }
  }, [uploadFile, toast]);

  const handleJerseyFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Nahrajte prosím obrázek');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Maximální velikost je 5 MB');
      return;
    }

    const preview = URL.createObjectURL(file);
    setJerseyPhoto({ file, preview, url: '' });

    try {
      const url = await uploadFile(file, 'jersey');
      setJerseyPhoto((prev) => ({ ...prev, url }));
      setCachedJersey({ url, exists: true });
    } catch (e: any) {
      toast.error(e.message);
      setJerseyPhoto({ file: null, preview: '', url: '' });
    }
  }, [uploadFile, toast]);

  /* ─────────── Generation ─────────── */

  const handleGenerate = useCallback(async () => {
    const pUrl = playerPhoto.url;
    const jUrl = jerseyPhoto.url || cachedJersey?.url;

    if (!pUrl || !jUrl) {
      toast.error('Chybí fotka hráče nebo dresu');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/test/generate-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerPhotoUrl: pUrl,
          jerseyPhotoUrl: jUrl,
          playerName: playerName || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chyba při generování');

      setGeneratedCardUrl(data.cardUrl);
      setView('result');
      toast.success('Karta byla vygenerována!');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGenerating(false);
    }
  }, [playerPhoto.url, jerseyPhoto.url, cachedJersey?.url, playerName, toast]);

  /* ─────────── Render ─────────── */

  return (
    <div className="relative min-h-screen overflow-hidden">
      <DashboardBackground />
      <CursorGlow />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="pt-8 pb-4 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium tracking-wider uppercase bg-[#86EF42]/10 text-[#86EF42] border border-[#86EF42]/20 mb-4">
              <Sparkles className="w-3 h-3" />
              Testovací prostředí
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Hráčská karta
            </h1>
            <p className="text-sm text-foreground/50 mt-1.5 max-w-md mx-auto">
              Nahrajte fotku hráče a dres týmu — AI vygeneruje profesionální kartu
            </p>
          </motion.div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-start justify-center px-4 pb-12">
          <div className="w-full max-w-xl">
            <AnimatePresence mode="wait">
              {view === 'wizard' ? (
                <motion.div
                  key="wizard"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Stepper */}
                  <Stepper current={step} playerDone={!!playerPhoto.url} jerseyDone={!!(jerseyPhoto.url || cachedJersey?.exists)} />

                  {/* Step Content */}
                  <div className="mt-6">
                    <AnimatePresence mode="wait" custom={direction}>
                      {step === 1 && (
                        <StepWrapper key="s1" direction={direction}>
                          <StepPlayerUpload
                            photo={playerPhoto}
                            uploading={uploading}
                            onFile={handlePlayerFile}
                            onClear={() => setPlayerPhoto({ file: null, preview: '', url: '' })}
                            onNext={() => goTo(2)}
                          />
                        </StepWrapper>
                      )}
                      {step === 2 && (
                        <StepWrapper key="s2" direction={direction}>
                          <StepJerseyUpload
                            photo={jerseyPhoto}
                            cached={cachedJersey}
                            uploading={uploading}
                            onFile={handleJerseyFile}
                            onUseCached={() => {
                              if (cachedJersey?.url) {
                                setJerseyPhoto((prev) => ({ ...prev, url: cachedJersey.url, preview: cachedJersey.url }));
                              }
                            }}
                            onClear={() => setJerseyPhoto({ file: null, preview: '', url: '' })}
                            onBack={() => goTo(1)}
                            onNext={() => goTo(3)}
                          />
                        </StepWrapper>
                      )}
                      {step === 3 && (
                        <StepWrapper key="s3" direction={direction}>
                          <StepGenerate
                            playerPhoto={playerPhoto}
                            jerseyPhoto={jerseyPhoto}
                            cachedJersey={cachedJersey}
                            playerName={playerName}
                            onPlayerNameChange={setPlayerName}
                            generating={generating}
                            onBack={() => goTo(2)}
                            onGenerate={handleGenerate}
                          />
                        </StepWrapper>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  <ResultView
                    cardUrl={generatedCardUrl}
                    playerName={playerName}
                    onRetry={() => { setView('wizard'); setStep(3); setDirection(-1); setGeneratedCardUrl(''); }}
                    onNewPlayer={() => reset(true)}
                    onFullReset={() => reset(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Stepper
   ═══════════════════════════════════════════════════════ */

function Stepper({
  current,
  playerDone,
  jerseyDone,
}: {
  current: Step;
  playerDone: boolean;
  jerseyDone: boolean;
}) {
  const doneMap = { 1: playerDone, 2: jerseyDone, 3: false };

  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((s, i) => {
        const isActive = current === s.num;
        const isDone = doneMap[s.num];
        const isPast = s.num < current;
        const Icon = s.icon;

        return (
          <div key={s.num} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
                  ${isActive
                    ? 'bg-[#86EF42] text-black shadow-[0_0_20px_rgba(134,239,66,0.3)]'
                    : isDone || isPast
                      ? 'bg-[#86EF42]/20 text-[#86EF42] border border-[#86EF42]/40'
                      : 'bg-surface border border-border text-foreground/30'
                  }
                `}
              >
                {isDone || isPast ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-[11px] mt-1.5 font-medium transition-colors duration-300 whitespace-nowrap ${
                  isActive ? 'text-foreground' : 'text-foreground/40'
                }`}
              >
                {s.label}
              </span>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={`w-12 sm:w-20 h-px mb-5 mx-1 transition-colors duration-300 ${
                  s.num < current ? 'bg-[#86EF42]/40' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Step Wrapper (animation)
   ═══════════════════════════════════════════════════════ */

function StepWrapper({ children, direction }: { children: React.ReactNode; direction: number }) {
  return (
    <motion.div
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   Upload Drop Zone (reusable)
   ═══════════════════════════════════════════════════════ */

function UploadZone({
  onFile,
  uploading,
  label,
  sublabel,
  icon: Icon = Upload,
}: {
  onFile: (f: File) => void;
  uploading: boolean;
  label: string;
  sublabel: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    },
    [onFile]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`
        relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200
        ${dragging
          ? 'border-[#86EF42] bg-[#86EF42]/5 scale-[1.01]'
          : 'border-border hover:border-foreground/20 hover:bg-surface'
        }
        ${uploading ? 'pointer-events-none opacity-60' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />

      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-foreground/10 border-t-[#86EF42] rounded-full animate-spin" />
          <p className="text-sm text-foreground/50">Nahrávám...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center">
            <Icon className="w-6 h-6 text-foreground/30" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground/70">{label}</p>
            <p className="text-xs text-foreground/35 mt-0.5">{sublabel}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Photo Preview (reusable)
   ═══════════════════════════════════════════════════════ */

function PhotoPreview({
  src,
  onClear,
  aspectClass = 'aspect-[3/4]',
}: {
  src: string;
  onClear?: () => void;
  aspectClass?: string;
}) {
  return (
    <div className={`relative group rounded-2xl overflow-hidden ${aspectClass} max-h-72`}>
      <img src={src} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      {onClear && (
        <button
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[11px] text-white/70 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
          Klikněte × pro změnu
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Step 1 — Player Photo Upload
   ═══════════════════════════════════════════════════════ */

function StepPlayerUpload({
  photo,
  uploading,
  onFile,
  onClear,
  onNext,
}: {
  photo: PhotoState;
  uploading: boolean;
  onFile: (f: File) => void;
  onClear: () => void;
  onNext: () => void;
}) {
  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">Nahrát fotku hráče</h2>
        <p className="text-sm text-foreground/50 mt-1">
          Ideálně portrét obličeje zblízka, ostrá fotka s dobrým osvětlením
        </p>
      </div>

      {photo.preview ? (
        <PhotoPreview src={photo.preview} onClear={onClear} />
      ) : (
        <UploadZone
          onFile={onFile}
          uploading={uploading}
          label="Klikněte nebo přetáhněte fotografii"
          sublabel="JPG, PNG, WebP — max 5 MB"
          icon={User}
        />
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={onNext}
          disabled={!photo.url}
          className={`
            modern-button flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all
            ${photo.url
              ? 'bg-[#86EF42] text-black hover:bg-[#a3f563] shadow-[0_4px_16px_rgba(134,239,66,0.25)]'
              : 'bg-surface text-foreground/30 cursor-not-allowed'
            }
          `}
        >
          Pokračovat
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Step 2 — Jersey Upload
   ═══════════════════════════════════════════════════════ */

function StepJerseyUpload({
  photo,
  cached,
  uploading,
  onFile,
  onUseCached,
  onClear,
  onBack,
  onNext,
}: {
  photo: PhotoState;
  cached: { url: string; exists: boolean } | null;
  uploading: boolean;
  onFile: (f: File) => void;
  onUseCached: () => void;
  onClear: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const hasSelected = !!photo.url;
  const showCached = cached?.exists && cached?.url && !photo.preview;

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">Nahrát fotku dresu</h2>
        <p className="text-sm text-foreground/50 mt-1">
          Fotka dresu či uniformy týmu — může být na ramínku nebo na hráčích
        </p>
      </div>

      {/* Cached jersey option */}
      {showCached && (
        <div className="mb-4 p-4 rounded-xl bg-[#86EF42]/5 border border-[#86EF42]/20">
          <div className="flex items-start gap-4">
            <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-border">
              <img src={cached.url} alt="Dres" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Dres již byl nahrán dříve</p>
              <p className="text-xs text-foreground/50 mt-0.5">Můžete použít uložený nebo nahrát nový</p>
              <button
                onClick={() => { onUseCached(); }}
                className="mt-2 px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#86EF42] text-black hover:bg-[#a3f563] transition-colors"
              >
                Použít uložený
              </button>
            </div>
          </div>
        </div>
      )}

      {photo.preview ? (
        <PhotoPreview src={photo.preview} onClear={onClear} aspectClass="aspect-[4/3]" />
      ) : (
        <UploadZone
          onFile={onFile}
          uploading={uploading}
          label={showCached ? 'Nebo nahrajte nový dres' : 'Klikněte nebo přetáhněte fotografii dresu'}
          sublabel="JPG, PNG, WebP — max 5 MB"
          icon={Shirt}
        />
      )}

      <div className="mt-6 flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-surface transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Zpět
        </button>
        <button
          onClick={onNext}
          disabled={!hasSelected}
          className={`
            modern-button flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all
            ${hasSelected
              ? 'bg-[#86EF42] text-black hover:bg-[#a3f563] shadow-[0_4px_16px_rgba(134,239,66,0.25)]'
              : 'bg-surface text-foreground/30 cursor-not-allowed'
            }
          `}
        >
          Pokračovat
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Step 3 — Generate
   ═══════════════════════════════════════════════════════ */

function StepGenerate({
  playerPhoto,
  jerseyPhoto,
  cachedJersey,
  playerName,
  onPlayerNameChange,
  generating,
  onBack,
  onGenerate,
}: {
  playerPhoto: PhotoState;
  jerseyPhoto: PhotoState;
  cachedJersey: { url: string; exists: boolean } | null;
  playerName: string;
  onPlayerNameChange: (v: string) => void;
  generating: boolean;
  onBack: () => void;
  onGenerate: () => void;
}) {
  const jerseySrc = jerseyPhoto.preview || cachedJersey?.url || '';

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8">
      {generating ? (
        /* Loading state */
        <div className="flex flex-col items-center py-8">
          <div className="relative w-48 h-64 rounded-2xl overflow-hidden mb-6">
            {/* Skeleton pulse */}
            <div className="absolute inset-0 bg-gradient-to-br from-surface via-surface-hover to-surface animate-pulse rounded-2xl" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-[3px] border-foreground/10 border-t-[#86EF42] rounded-full animate-spin" />
                <Sparkles className="w-5 h-5 text-[#86EF42] animate-pulse" />
              </div>
            </div>
            {/* Shimmer overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <motion.p
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-sm font-medium text-foreground/60"
          >
            AI generuje kartu hráče…
          </motion.p>
          <p className="text-xs text-foreground/30 mt-1">Může to trvat 30–60 sekund</p>
        </div>
      ) : (
        <>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-foreground">Vygenerovat kartu</h2>
            <p className="text-sm text-foreground/50 mt-1">
              AI vytvoří profesionální hráčskou kartu z vašich fotek
            </p>
          </div>

          {/* Preview both photos */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-foreground/40 font-medium mb-2">Hráč</p>
              <div className="aspect-[3/4] rounded-xl overflow-hidden border border-border">
                <img src={playerPhoto.preview} alt="Hráč" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-foreground/40 font-medium mb-2">Dres</p>
              <div className="aspect-[3/4] rounded-xl overflow-hidden border border-border">
                <img src={jerseySrc} alt="Dres" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* Player name (optional) */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-foreground/50 mb-1.5">
              Jméno hráče (nepovinné)
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => onPlayerNameChange(e.target.value)}
              placeholder="např. Jan Novák"
              className="glass-input w-full px-4 py-2.5 rounded-xl text-sm text-foreground"
            />
          </div>

          <div className="flex justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-surface transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Zpět
            </button>
            <button
              onClick={onGenerate}
              className="modern-button flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#86EF42] text-black hover:bg-[#a3f563] shadow-[0_4px_16px_rgba(134,239,66,0.25)] transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Vygenerovat kartu
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Result View
   ═══════════════════════════════════════════════════════ */

function ResultView({
  cardUrl,
  playerName,
  onRetry,
  onNewPlayer,
  onFullReset,
}: {
  cardUrl: string;
  playerName: string;
  onRetry: () => void;
  onNewPlayer: () => void;
  onFullReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center">
      {/* Success badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium tracking-wider uppercase bg-[#86EF42]/10 text-[#86EF42] border border-[#86EF42]/20 mb-5"
      >
        <Check className="w-3 h-3" />
        Karta vygenerována
      </motion.div>

      {/* Card display */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        <div className="glass-card rounded-2xl p-3 sm:p-4">
          <div className="aspect-[3/4] rounded-xl overflow-hidden">
            <img
              src={cardUrl}
              alt={playerName || 'Hráčská karta'}
              className="w-full h-full object-cover"
            />
          </div>
          {playerName && (
            <p className="text-center text-sm font-semibold text-foreground mt-3 mb-1">{playerName}</p>
          )}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-3 mt-6 w-full max-w-sm"
      >
        <a
          href={cardUrl}
          download={`hracska-karta${playerName ? `-${playerName.replace(/\s+/g, '-').toLowerCase()}` : ''}.png`}
          target="_blank"
          rel="noopener noreferrer"
          className="modern-button flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-[#86EF42] text-black hover:bg-[#a3f563] shadow-[0_4px_16px_rgba(134,239,66,0.25)] transition-all"
        >
          <Download className="w-4 h-4" />
          Stáhnout
        </a>
        <button
          onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border border-border text-foreground/70 hover:bg-surface hover:text-foreground transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Zkusit znovu
        </button>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex gap-3 mt-3"
      >
        <button
          onClick={onNewPlayer}
          className="flex items-center gap-1.5 text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Nový hráč (zachovat dres)
        </button>
        <span className="text-foreground/15">|</span>
        <button
          onClick={onFullReset}
          className="text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
        >
          Začít úplně znovu
        </button>
      </motion.div>
    </div>
  );
}
