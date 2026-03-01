'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import {
  MessageSquareWarning, BarChart3, CalendarDays, Crosshair,
  Star, Trophy, ChevronRight, ArrowRight, Check, Menu, X,
} from 'lucide-react';

// --- Data ---

const RATING_LABELS: Record<number, string> = {
  0: 'Zůstal v šatně', 1: 'Dnes to chytlo jiný kopačky', 2: 'Hrál, ale tráva víc',
  3: 'Aspoň se zpotil', 4: 'Průměrnej den v kanclu', 5: 'Solidní řemeslo',
  6: 'Začíná to jiskřit!', 7: 'Takovej výkon chceš každej víkend',
  8: 'Soupeř ho chtěl vyměnit k sobě', 9: 'Dnes to byl jinej level',
  10: 'Zavolejte mu agenta!',
};

const RATING_EMOJI: Record<number, string> = {
  0: '🪑', 1: '😬', 2: '🥴', 3: '😅', 4: '🙂', 5: '👍',
  6: '💪', 7: '🔥', 8: '⭐', 9: '🌟', 10: '👑',
};

const HERO_LABELS: Record<number, string> = {
  0: 'Spal na hřišti', 1: 'Dneska ne', 2: 'Aspoň tam byl',
  3: 'Jde to líp', 4: 'Nevadí, příště!', 5: 'Slušnej zápas!',
  6: 'To byla pecka!', 7: 'Soupeř plakal!',
  8: 'K nezastavení!', 9: 'Dnes to byl jinej hráč!',
  10: 'ZAVOLEJTE MU AGENTA!',
};

const HERO_EMOJI: Record<number, string> = {
  0: '😴', 1: '😬', 2: '🥴', 3: '😅', 4: '🙂',
  5: '👍', 6: '💪', 7: '🔥', 8: '🤩', 9: '🚀', 10: '👑',
};

const problems = [
  { icon: MessageSquareWarning, title: 'Chaos ve WhatsApp', description: 'Důležité zprávy se ztrácejí v záplavě chatů. Kdo přijde na trénink? Nikdo neví.', color: '#ef4444' },
  { icon: BarChart3, title: 'Žádná data o formě hráčů', description: 'Po zápase se zapomene, kdo hrál dobře. Rozhodnutí trenéra jdou od oka.', color: '#f59e0b' },
  { icon: CalendarDays, title: 'Docházka je noční můra', description: 'Ruční odškrtávání v excelu. Kdo chyběl třikrát po sobě? Nikdo nesleduje.', color: '#8b5cf6' },
  { icon: Crosshair, title: 'Taktika zůstává v hlavě', description: 'Trenér ví, jak chce hrát. Hráči ne. Není kde taktiku nakreslit a sdílet.', color: '#06b6d4' },
];

const featureTabs = [
  {
    id: 'hodnoceni', label: 'Hodnocení', icon: Star,
    title: 'Hodnocení hráčů po zápase',
    description: 'Po každém utkání hráči ohodnotí spoluhráče na škále 0–10. Férově, anonymně, bez možnosti dodatečné úpravy.',
    bullets: ['Smooth slider 0–10 s haptickou odezvou', 'Trenér má 30% větší váhu hodnocení', 'Emoji feedback pro každou hodnotu'],
  },
  {
    id: 'zebricek', label: 'Žebříček', icon: Trophy,
    title: 'Automatický žebříček formy',
    description: 'Průběžné pořadí hráčů podle hlasů celého týmu. Odznáčky za góly, asistence a docházku.',
    bullets: ['Filtr podle sezóny nebo zápasu', 'Detailní hráčská karta po kliknutí', 'Odznáčky: Střelec, Dříč, Král asistencí'],
  },
  {
    id: 'kalendar', label: 'Kalendář', icon: CalendarDays,
    title: 'Události a docházka',
    description: 'Tréninky a zápasy na jednom místě. Hráči potvrdí účast předem, trenér uzavře docházku po události.',
    bullets: ['Sdílený odkaz pro potvrzení účasti', 'Přehled kdo přijde a kdo ne', 'Statistiky účasti v grafu'],
  },
  {
    id: 'taktika', label: 'Taktika', icon: Crosshair,
    title: 'Taktická tabule',
    description: 'Přetáhni hráče na hřiště a připrav sestavu. Fotbal, hokej a florbal.',
    bullets: ['3 sporty, 5 variant sestav', 'Kreslení šipek a tahů', 'Drag & drop hráčů z kádru'],
  },
];

const steps = [
  { number: '01', title: 'Registrace', subtitle: 'Založíte tým za 3 minuty', description: 'Zadejte název týmu, kontakt a heslo. Žádná kreditní karta, žádný háček.' },
  { number: '02', title: 'Přidejte hráče', subtitle: 'Nastavte kádr a začněte plánovat', description: 'Pozvěte spoluhráče, naplánujte tréninky a zápasy přes kalendář.' },
  { number: '03', title: 'Hodnoťte a sledujte', subtitle: 'Po každém zápase máte data', description: 'Hráči hodnotí výkony, systém počítá žebříček a kanadské body.' },
];

// --- SmoothSnapSlider (copied from hodnoceni-hracu) ---

function SmoothSnapSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rawValue, setRawValue] = useState(value);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!dragging) setRawValue(value);
  }, [value, dragging]);

  const getValueFromEvent = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pct * 10;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    setAnimating(false);
    setRawValue(getValueFromEvent(e.clientX));
  }, [getValueFromEvent]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    setRawValue(getValueFromEvent(e.clientX));
  }, [dragging, getValueFromEvent]);

  const handlePointerUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    const snapped = Math.round(rawValue);
    setAnimating(true);
    setRawValue(snapped);
    onChange(snapped);
    setTimeout(() => setAnimating(false), 200);
  }, [dragging, rawValue, onChange]);

  const pct = (rawValue / 10) * 100;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-white/40 w-3 text-center shrink-0">0</span>
      <div
        ref={trackRef}
        className="flex-1 relative h-8 flex items-center cursor-pointer touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="absolute inset-x-0 h-2 rounded-full bg-white/[0.08]" />
        <div
          className={`absolute left-0 h-2 rounded-full ${animating ? 'transition-[width] duration-200 ease-out' : ''}`}
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #60a5fa, #3b82f6)' }}
        />
        {Array.from({ length: 11 }, (_, i) => (
          <div key={i} className="absolute w-1 h-1 rounded-full bg-white/20 -translate-x-1/2" style={{ left: `${(i / 10) * 100}%` }} />
        ))}
        <div
          className={`absolute w-[22px] h-[22px] rounded-full -translate-x-1/2 ${animating ? 'transition-[left] duration-200 ease-out' : ''} ${dragging ? 'scale-110' : ''}`}
          style={{
            left: `${pct}%`,
            background: '#3b82f6',
            border: '2px solid rgba(96, 165, 250, 0.95)',
            boxShadow: dragging
              ? '0 0 0 4px rgba(59, 130, 246, 0.25), 0 2px 16px rgba(0,0,0,0.45)'
              : '0 0 0 2px rgba(59, 130, 246, 0.2), 0 2px 14px rgba(0,0,0,0.35)',
            transition: dragging ? 'transform 0.1s, box-shadow 0.15s' : (animating ? 'left 0.2s ease-out, transform 0.15s, box-shadow 0.15s' : 'transform 0.15s, box-shadow 0.15s'),
          }}
        />
      </div>
      <span className="text-xs text-white/40 w-4 text-center shrink-0">10</span>
    </div>
  );
}

// --- CSS Mockup Components ---

function MockupFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[280px] sm:max-w-xs">
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#0a0f1a] to-[#050810] p-2.5 shadow-2xl">
        <div className="mx-auto w-20 h-4 bg-black rounded-full mb-1.5" />
        <div className="rounded-[1.5rem] overflow-hidden bg-[#070b14] min-h-[380px] p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function MockupRating() {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-500/10 border border-blue-500/30 mx-auto mb-2 flex items-center justify-center text-xl">JN</div>
        <p className="text-white text-sm font-semibold">Jan Novák</p>
        <p className="text-white/40 text-xs">Útočník</p>
      </div>
      <div className="text-center">
        <span className="text-3xl font-bold text-blue-400">8</span>
        <span className="text-white/30 text-lg">/10</span>
        <p className="text-xs text-white/40 mt-0.5">⭐ Velmi dobrý</p>
      </div>
      <div className="h-2 rounded-full bg-white/[0.08]">
        <div className="h-full w-[80%] rounded-full" style={{ background: 'linear-gradient(90deg, #60a5fa, #3b82f6)' }} />
      </div>
      <div className="space-y-2 mt-3">
        {[{ name: 'Petr Svoboda', score: 9 }, { name: 'Martin Král', score: 6 }].map((p) => (
          <div key={p.name} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white/5">
            <span className="text-white/70 text-xs">{p.name}</span>
            <span className="text-blue-400 text-xs font-bold">{p.score}/10</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockupLeaderboard() {
  const rows = [
    { rank: '1.', medal: '🥇', name: 'Petr Svoboda', score: 8.4, pct: 84 },
    { rank: '2.', medal: '🥈', name: 'Jan Novák', score: 7.9, pct: 79 },
    { rank: '3.', medal: '🥉', name: 'Martin Král', score: 7.2, pct: 72 },
  ];
  return (
    <div className="space-y-3">
      <p className="text-white/50 text-xs uppercase tracking-wider">Žebříček formy</p>
      {rows.map((r) => (
        <div key={r.name} className="p-2.5 rounded-lg bg-white/5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-white text-xs font-medium">{r.medal} {r.rank} {r.name}</span>
            <span className="text-blue-400 text-xs font-bold">{r.score}/10</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.08]">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: `${r.pct}%` }} />
          </div>
        </div>
      ))}
      <div className="flex gap-1.5 mt-2">
        {['Střelec', 'Dříč'].map((b) => (
          <span key={b} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">{b}</span>
        ))}
      </div>
    </div>
  );
}

function MockupCalendar() {
  return (
    <div className="space-y-3">
      <p className="text-white/50 text-xs uppercase tracking-wider">Únor 2026</p>
      <div className="space-y-2">
        {[
          { type: 'Trénink', date: 'Út 17.2. 18:00', color: 'bg-blue-500', status: 'Přijdu' },
          { type: 'Zápas vs Sparta', date: 'So 21.2. 15:00', color: 'bg-amber-500', status: 'Čeká' },
          { type: 'Trénink', date: 'Út 24.2. 18:00', color: 'bg-blue-500', status: 'Přijdu' },
        ].map((ev, i) => (
          <div key={i} className="p-2.5 rounded-lg bg-white/5 flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${ev.color} shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{ev.type}</p>
              <p className="text-white/40 text-[10px]">{ev.date}</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${ev.status === 'Přijdu' ? 'bg-blue-500/15 text-blue-400' : 'bg-amber-500/15 text-amber-400'}`}>{ev.status}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <button className="flex-1 py-1.5 rounded-lg bg-accent text-black text-xs font-medium">Přijdu</button>
        <button className="flex-1 py-1.5 rounded-lg bg-white/5 text-white/50 text-xs font-medium">Nepřijdu</button>
      </div>
    </div>
  );
}

function MockupTactics() {
  const players = [
    { x: 50, y: 85, name: 'GK' },
    { x: 25, y: 60, name: 'LB' }, { x: 75, y: 60, name: 'RB' },
    { x: 40, y: 40, name: 'CM' }, { x: 60, y: 40, name: 'CM' },
    { x: 50, y: 18, name: 'ST' },
  ];
  return (
    <div className="space-y-2">
      <p className="text-white/50 text-xs uppercase tracking-wider">Taktické schéma</p>
      <div className="relative rounded-lg overflow-hidden" style={{ aspectRatio: '68/100', background: 'linear-gradient(180deg, #0a0f2a 0%, #0d1333 100%)' }}>
        <svg viewBox="0 0 68 105" className="absolute inset-0 w-full h-full">
          <rect x="1" y="1" width="66" height="103" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
          <line x1="1" y1="52.5" x2="67" y2="52.5" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
          <circle cx="34" cy="52.5" r="9" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
          <rect x="14" y="1" width="40" height="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
          <rect x="14" y="88" width="40" height="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
        </svg>
        {players.map((p) => (
          <div key={p.name} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            <div className="w-5 h-5 rounded-full bg-blue-500/80 border border-blue-400 flex items-center justify-center">
              <span className="text-[7px] font-bold text-white">{p.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Animated Counter ---

function AnimatedCounter({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    if (target === 0) { setCount(0); return; }
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <div ref={ref} className="text-center">
      <span className="text-4xl md:text-6xl font-bold text-blue-400 tabular-nums">{count}{suffix}</span>
      <p className="text-white/50 mt-2 text-sm md:text-base">{label}</p>
    </div>
  );
}

// --- Main Page ---

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeatureTab, setActiveFeatureTab] = useState(0);
  const [demoRating, setDemoRating] = useState(7);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [heroRating, setHeroRating] = useState(9);
  const [yearlyBilling, setYearlyBilling] = useState(false);

  const { scrollYProgress } = useScroll();
  const navBg = useTransform(scrollYProgress, [0, 0.03], [0, 1]);

  // Mouse-reactive hero background
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 30 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth);
      mouseY.set(e.clientY / window.innerHeight);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const navLinks = [
    { label: 'Funkce', href: '#funkce' },
    { label: 'Jak to funguje', href: '#jak-to-funguje' },
    { label: 'Demo', href: '#demo' },
    { label: 'Cena', href: '#cena' },
  ];

  return (
    <main className="bg-black text-white min-h-screen overflow-x-hidden">
      {/* === Nav === */}
      <motion.nav
        className="fixed top-0 inset-x-0 z-50 transition-colors duration-300"
        style={{ backgroundColor: useTransform(navBg, (v) => `rgba(5, 7, 11, ${v * 0.9})`) }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={`max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between ${mobileMenuOpen ? '' : 'backdrop-blur-lg'}`}>
          <Link href="/" className="text-xl font-bold tracking-tight">
            My<span className="text-white">Pitch</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-white/60 hover:text-white transition-colors">{l.label}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login/team" className="text-sm text-white/70 hover:text-white font-medium transition-colors">Přihlásit se</Link>
            <Link href="/register" className="px-5 py-2.5 rounded-full bg-accent text-black text-sm font-semibold hover:bg-accent-light transition-colors">
              Registrovat tým
            </Link>
          </div>
          <button className="md:hidden p-2 text-white/70" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="px-6 py-4 space-y-3">
                {navLinks.map((l) => (
                  <a key={l.href} href={l.href} onClick={() => setMobileMenuOpen(false)} className="block text-white/70 hover:text-white py-2">{l.label}</a>
                ))}
                <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                  <Link href="/login/team" className="text-center py-2.5 text-white/70 hover:text-white font-medium">Přihlásit se</Link>
                  <Link href="/register" className="text-center py-2.5 rounded-full bg-accent text-black font-semibold">Registrovat tým</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* === Hero === */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        {/* Mouse-reactive background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Deep gradient base */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#020515] via-[#040a1a] to-[#010208]" />
          {/* Radial depth layer */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 30% 40%, rgba(15,23,60,0.6) 0%, transparent 70%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 50% at 80% 70%, rgba(10,15,40,0.5) 0%, transparent 60%)' }} />
          {/* Fine grid */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.4) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
          {/* Diagonal thin lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" preserveAspectRatio="none">
            <line x1="0%" y1="100%" x2="60%" y2="0%" stroke="rgba(59,130,246,0.6)" strokeWidth="0.5" />
            <line x1="20%" y1="100%" x2="80%" y2="0%" stroke="rgba(59,130,246,0.4)" strokeWidth="0.5" />
            <line x1="40%" y1="100%" x2="100%" y2="0%" stroke="rgba(59,130,246,0.6)" strokeWidth="0.5" />
            <line x1="60%" y1="100%" x2="100%" y2="20%" stroke="rgba(59,130,246,0.3)" strokeWidth="0.5" />
            <line x1="0%" y1="80%" x2="40%" y2="0%" stroke="rgba(59,130,246,0.3)" strokeWidth="0.5" />
          </svg>
          {/* Horizontal accent lines */}
          <div className="absolute top-[30%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/[0.08] to-transparent" />
          <div className="absolute top-[60%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/[0.06] to-transparent" />
          <div className="absolute top-[85%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/[0.05] to-transparent" />
          {/* Vertical accent lines */}
          <div className="absolute top-0 bottom-0 left-[25%] w-px bg-gradient-to-b from-transparent via-blue-500/[0.06] to-transparent" />
          <div className="absolute top-0 bottom-0 left-[65%] w-px bg-gradient-to-b from-transparent via-blue-400/[0.04] to-transparent" />
          {/* Mouse-following glow */}
          <motion.div
            className="absolute w-[700px] h-[700px] rounded-full pointer-events-none"
            style={{
              left: useTransform(springX, (v) => `calc(${v * 100}% - 350px)`),
              top: useTransform(springY, (v) => `calc(${v * 100}% - 350px)`),
              background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, rgba(59,130,246,0.04) 40%, transparent 70%)',
            }}
          />
          {/* Secondary subtle glow */}
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{
              right: useTransform(springX, (v) => `calc(${v * 100}% - 250px)`),
              bottom: useTransform(springY, (v) => `calc(${v * 100}% - 250px)`),
              background: 'radial-gradient(circle, rgba(30,58,138,0.08) 0%, transparent 60%)',
            }}
          />
          {/* Floating dots with parallax */}
          <motion.div
            className="absolute top-[20%] right-[20%] w-1 h-1 bg-blue-400/25 rounded-full pointer-events-none"
            style={{ x: useTransform(springX, [0, 1], [25, -25]), y: useTransform(springY, [0, 1], [15, -15]) }}
          />
          <motion.div
            className="absolute top-[45%] right-[10%] w-1.5 h-1.5 bg-blue-300/15 rounded-full pointer-events-none"
            style={{ x: useTransform(springX, [0, 1], [-20, 20]), y: useTransform(springY, [0, 1], [20, -20]) }}
          />
          <motion.div
            className="absolute top-[70%] left-[20%] w-1 h-1 bg-blue-400/20 rounded-full pointer-events-none"
            style={{ x: useTransform(springX, [0, 1], [30, -30]), y: useTransform(springY, [0, 1], [-25, 25]) }}
          />
          <motion.div
            className="absolute top-[15%] left-[45%] w-0.5 h-0.5 bg-white/15 rounded-full pointer-events-none"
            style={{ x: useTransform(springX, [0, 1], [-35, 35]), y: useTransform(springY, [0, 1], [20, -20]) }}
          />
          <motion.div
            className="absolute top-[55%] left-[55%] w-1 h-1 bg-blue-500/10 rounded-full pointer-events-none"
            style={{ x: useTransform(springX, [0, 1], [15, -15]), y: useTransform(springY, [0, 1], [-10, 10]) }}
          />
        </div>

        <div className="relative z-10 max-w-7xl pl-8 md:pl-16 lg:pl-24 pr-6 py-20 flex items-center justify-between gap-12">
          {/* Left — text */}
          <div className="flex-1 min-w-0">
            <motion.p
              className="text-blue-400 text-sm font-semibold uppercase tracking-[0.2em] mb-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Sportovní platforma pro týmy
            </motion.p>
            <motion.h1
              className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-[-0.03em] max-w-5xl"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              Zvol hráče utkání.
              <br />
              <span className="text-blue-400">Měj tréninky</span> pod kontrolou.
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-white/50 max-w-xl mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Jedna platforma pro hodnocení hráčů, docházku, kalendář událostí a taktiku. Zdarma, pro celý tým.
            </motion.p>
            <motion.div
              className="mt-10 flex flex-wrap items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Link
                href="/register"
                className="px-8 py-4 rounded-full bg-accent text-black font-bold text-lg animate-glow-pulse hover:bg-accent-light transition-colors"
              >
                Registrovat tým zdarma
              </Link>
              <a
                href="#jak-to-funguje"
                className="px-8 py-4 rounded-full border border-white/20 text-white font-semibold text-lg hover:bg-white/10 transition-all flex items-center gap-2"
              >
                Jak to funguje
                <ChevronRight className="w-5 h-5" />
              </a>
            </motion.div>
          </div>

          {/* Right — floating rating card */}
          <motion.div
            className="hidden lg:flex flex-col items-center w-[280px] shrink-0"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <motion.div
              className="relative w-full rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-6 shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Glow behind card */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-b from-blue-500/[0.06] to-transparent -z-10 blur-xl" />
              <p className="text-white/40 text-xs uppercase tracking-widest mb-4 text-center">Hodnocení hráče</p>
              {/* Big number + emoji */}
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-6xl font-bold text-white tabular-nums">{heroRating}</span>
                <span className="text-4xl">{HERO_EMOJI[heroRating] || ''}</span>
              </div>
              <p className="text-white/50 text-sm text-center mb-5">{HERO_LABELS[heroRating] || ''}</p>
              {/* Slider */}
              <div className="px-1">
                <SmoothSnapSlider value={heroRating} onChange={setHeroRating} />
              </div>
              <div className="flex justify-between text-[10px] text-white/25 mt-1.5 px-0.5">
                <span>0</span>
                <span>5</span>
                <span>10</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* === Problems === */}
      <section className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-12"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-blue-400 text-sm font-semibold uppercase tracking-[0.15em]">Problémy, které řešíme</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-3 tracking-tight">Proč MyPitch?</h2>
            <p className="text-white/50 mt-4 text-lg">Známe bolesti amatérských týmů. Řešíme je jednou platformou.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            {problems.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8 relative overflow-hidden group cursor-default"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25 } }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                >
                  <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${p.color}40, transparent)` }} />
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${p.color}15` }}>
                    <Icon className="w-6 h-6" style={{ color: p.color }} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{p.title}</h3>
                  <p className="text-white/50 leading-relaxed">{p.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* === Features === */}
      <section id="funkce" className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-12"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-blue-400 text-sm font-semibold uppercase tracking-[0.15em]">Funkce</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-3 tracking-tight">Vše, co tým potřebuje</h2>
          </motion.div>
          {/* Tabs */}
          <div className="flex gap-2 justify-center flex-wrap mb-12">
            {featureTabs.map((tab, i) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveFeatureTab(i)}
                  className={`px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors duration-300 ${
                    activeFeatureTab === i
                      ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.25)]'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>
          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeatureTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">{featureTabs[activeFeatureTab].title}</h3>
                <p className="text-white/50 text-lg leading-relaxed mb-6">{featureTabs[activeFeatureTab].description}</p>
                <ul className="space-y-3">
                  {featureTabs[activeFeatureTab].bullets.map((bp) => (
                    <li key={bp} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                      <span className="text-white/70">{bp}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <MockupFrame>
                {activeFeatureTab === 0 && <MockupRating />}
                {activeFeatureTab === 1 && <MockupLeaderboard />}
                {activeFeatureTab === 2 && <MockupCalendar />}
                {activeFeatureTab === 3 && <MockupTactics />}
              </MockupFrame>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* === Demo === */}
      <section id="demo" className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] bg-blue-500/8 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-12"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-blue-400 text-sm font-semibold uppercase tracking-[0.15em]">Interaktivní demo</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-3 tracking-tight">Vyzkoušej hodnocení</h2>
            <p className="text-white/50 mt-4 text-lg">Posuň táhlem a ohodnoť hráče. Přesně takto to funguje po zápase.</p>
          </motion.div>

          <motion.div
            className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8 md:p-12 max-w-2xl mx-auto relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-500/15 blur-[80px] rounded-full pointer-events-none" />
            <div className="relative flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-500/10 border-2 border-blue-500/40 flex items-center justify-center mb-4 overflow-hidden">
                <Image src="/images/player_image.png" alt="Hráč" width={96} height={96} className="object-cover" />
              </div>
              <h3 className="text-xl font-bold">Jan Novák</h3>
              <p className="text-white/50 text-sm mb-6">Útočník | #10</p>
              <div className="text-center mb-4">
                <span className="text-5xl font-bold text-blue-400 tabular-nums">{demoRating}</span>
                <span className="text-2xl text-white/40 font-light">/10</span>
              </div>
              <p className="text-white/50 text-sm mb-2">{RATING_EMOJI[demoRating]} {RATING_LABELS[demoRating]}</p>
              <div className="w-full max-w-md">
                <SmoothSnapSlider value={demoRating} onChange={(v) => { setDemoRating(v); setDemoSubmitted(false); }} />
              </div>
              <motion.button
                onClick={() => setDemoSubmitted(true)}
                className="mt-6 px-8 py-3 rounded-full bg-accent text-black font-bold hover:bg-accent-light transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Ohodnotit
              </motion.button>
              <AnimatePresence>
                {demoSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-6 text-center w-full"
                  >
                    <p className="text-blue-400 font-semibold mb-1">Hodnocení odesláno!</p>
                    <p className="text-white/50 text-sm">Takto jednoduše hodnotíte spoluhráče po každém zápase.</p>
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left max-w-xs mx-auto">
                      <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Dopad na žebříček</p>
                      <div className="flex justify-between items-center">
                        <span className="text-white font-medium text-sm">Jan Novák</span>
                        <span className="text-blue-400 font-bold text-sm">{demoRating}.0 / 10</span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-white/10">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${demoRating * 10}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* === How it works === */}
      <section id="jak-to-funguje" className="py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-blue-400 text-sm font-semibold uppercase tracking-[0.15em]">3 jednoduché kroky</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-3 tracking-tight">Jak to funguje</h2>
          </motion.div>
          <div className="max-w-2xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                className="flex gap-6 md:gap-10"
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                whileHover={{ x: 8, transition: { duration: 0.2 } }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-500/15 border-2 border-blue-500 flex items-center justify-center shrink-0">
                    <span className="text-blue-400 font-bold text-sm">{step.number}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gradient-to-b from-blue-500/40 to-transparent mt-3" />
                  )}
                </div>
                <div className="pb-12">
                  <h3 className="text-xl md:text-2xl font-bold">{step.title}</h3>
                  <p className="text-blue-400 text-sm font-semibold mt-1">{step.subtitle}</p>
                  <p className="text-white/50 mt-3 max-w-md">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === Stats === */}
      <section className="py-20 border-y border-white/10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 gap-8">
          <AnimatedCounter target={100} suffix="+" label="Registrovaných týmů" />
          <AnimatedCounter target={5000} suffix="+" label="Odeslaných hodnocení" />
        </div>
      </section>

      {/* === Pricing === */}
      <section id="cena" className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-16"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-blue-400 text-sm font-semibold uppercase tracking-[0.15em]">Ceník</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-3 tracking-tight">Jednoduchý ceník</h2>
            <p className="text-white/50 mt-4 text-lg">Jeden plán, všechny funkce. První měsíc na zkoušku zdarma.</p>
          </motion.div>

          <motion.div
            className="max-w-2xl mx-auto rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-500/[0.08] to-transparent p-8 md:p-10 relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25 } }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent" />

            {/* Billing toggle */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex p-1 rounded-xl bg-white/5 max-w-xs w-full">
                <button
                  onClick={() => setYearlyBilling(false)}
                  className={`flex-1 text-center py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    !yearlyBilling ? 'bg-blue-500/20 text-blue-400 shadow-sm' : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  Měsíčně
                </button>
                <button
                  onClick={() => setYearlyBilling(true)}
                  className={`flex-1 text-center py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                    yearlyBilling ? 'bg-blue-500/20 text-blue-400 shadow-sm' : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  Ročně <span className="text-accent text-xs ml-1">−20 %</span>
                </button>
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-block bg-accent/15 text-accent text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
                První měsíc zdarma
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={yearlyBilling ? 'yearly' : 'monthly'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-baseline justify-center gap-2 mb-1">
                    <span className="text-5xl md:text-6xl font-bold text-white">{yearlyBilling ? '312 Kč' : '390 Kč'}</span>
                    <span className="text-white/40 text-lg">/ měsíc</span>
                  </div>
                  {yearlyBilling ? (
                    <p className="text-white/50 text-sm">
                      <span className="text-white/30 line-through mr-2">4 680 Kč / rok</span>
                      <span className="text-blue-400 font-medium">3 744 Kč / rok</span>
                    </p>
                  ) : (
                    <p className="text-white/50 text-sm">Až 20 hráčů &middot; <span className="text-blue-400 font-medium">19,50 Kč / hráč</span></p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* CTA */}
            <Link
              href="/register"
              className="block w-full max-w-sm mx-auto py-4 rounded-xl bg-accent text-black text-base font-bold text-center hover:bg-accent-light transition-colors shadow-[0_0_24px_rgba(134,239,66,0.2)] mb-8"
            >
              Vyzkoušet zdarma na měsíc
            </Link>

            {/* Features */}
            <div className="border-t border-white/10 pt-8">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-5 text-center">Co je v ceně</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  'Hodnocení hráčů po zápase',
                  'Automatický žebříček formy',
                  'Kalendář událostí a docházka',
                  'Taktická tabule (fotbal, hokej, florbal)',
                  'Až 20 hráčů v kádru',
                  'Detailní statistiky výkonnosti',
                  'Export statistik do CSV',
                  'Odznáčky a ocenění',
                ].map((f) => (
                  <div key={f} className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-white/60 text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* === Final CTA === */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <motion.h2
            className="text-3xl md:text-5xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            Začněte ještě dnes
          </motion.h2>
          <motion.p
            className="text-white/50 mt-4 text-lg"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            Zdarma, bez závazků, bez kreditní karty. Pro celý tým.
          </motion.p>
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-accent text-black font-bold text-lg animate-glow-pulse hover:bg-accent-light transition-colors"
            >
              Registrovat tým zdarma
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
          <p className="text-white/30 text-sm mt-4">3 minuty a máte tým online</p>
        </div>
      </section>

      {/* === Footer === */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-lg font-bold tracking-tight">My<span className="text-white">Pitch</span></span>
          <nav className="flex gap-6 text-sm text-white/50">
            <a href="#funkce" className="hover:text-white transition-colors">Funkce</a>
            <a href="#jak-to-funguje" className="hover:text-white transition-colors">Jak to funguje</a>
            <a href="#demo" className="hover:text-white transition-colors">Demo</a>
            <Link href="/register" className="hover:text-white transition-colors">Registrace</Link>
          </nav>
          <p className="text-white/30 text-xs">&copy; 2026 MyPitch. Všechna práva vyhrazena.</p>
        </div>
      </footer>
    </main>
  );
}
