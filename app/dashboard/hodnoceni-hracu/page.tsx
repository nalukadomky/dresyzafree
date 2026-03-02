'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GhostHodnoceni, GhostOverviewCards } from '@/components/GhostLoader';
import LoadingSpinner from '@/components/LoadingSpinner';
import PlayerDetailModal from '@/components/PlayerDetailModal';
import TacticsBoard from '@/components/TacticsBoard';
import ThemeToggle from '@/components/ThemeToggle';
import { MotionPage } from '@/components/Motion';
import { getCroppedImage, resizeImageFile } from '@/lib/image-utils';
import Cropper, { type Area } from 'react-easy-crop';
import { Reorder, useDragControls, AnimatePresence, motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ChevronDown } from 'lucide-react';
import { DatePicker } from '@/components/ui/datepicker';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import confetti from 'canvas-confetti';
import dynamic from 'next/dynamic';

const FanVoteBarChart = dynamic(() => import('@/components/FanVoteBarChart'), { ssr: false });

// --- Time input component (keyboard-friendly HH:MM) ---
function TimeInput({ value, onChange, className, required }: { value: string; onChange: (v: string) => void; className?: string; required?: boolean }) {
  const hRef = useRef<HTMLInputElement>(null);
  const mRef = useRef<HTMLInputElement>(null);
  const [localHH, setLocalHH] = useState('');
  const [localMM, setLocalMM] = useState('');
  const lastCommitted = useRef(value);

  // Sync from parent when value changes externally (e.g. auto-fill from match)
  useEffect(() => {
    if (value !== lastCommitted.current) {
      const parts = value ? value.split(':') : ['', ''];
      setLocalHH(parts[0] || '');
      setLocalMM(parts[1] || '');
      lastCommitted.current = value;
    }
  }, [value]);

  const commit = (h: string, m: string) => {
    let result: string;
    if (h && m) result = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    else if (!h && !m) result = '';
    else result = `${h || ''}:${m || ''}`;
    lastCommitted.current = result;
    onChange(result);
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 2) v = v.slice(0, 2);
    const n = parseInt(v, 10);
    if (v.length > 0 && n > 23) v = '23';
    setLocalHH(v);
    if (v.length === 2) {
      commit(v, localMM);
      mRef.current?.focus();
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 2) v = v.slice(0, 2);
    const n = parseInt(v, 10);
    if (v.length > 0 && n > 59) v = '59';
    setLocalMM(v);
    if (v.length === 2) {
      commit(localHH, v);
    }
  };

  const handleHourBlur = () => commit(localHH, localMM);
  const handleMinuteBlur = () => commit(localHH, localMM);

  const handleMinuteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !localMM) {
      e.preventDefault();
      hRef.current?.focus();
    }
  };

  return (
    <div className={`inline-flex items-center gap-0 rounded-lg glass-input h-10 px-3 ${className || ''}`}>
      <svg className="w-4 h-4 text-white/50 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <input
        ref={hRef}
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={localHH}
        onChange={handleHourChange}
        onBlur={handleHourBlur}
        placeholder="HH"
        className="w-7 bg-transparent text-foreground text-sm text-center outline-none placeholder:text-white/30"
        required={required}
      />
      <span className="text-foreground/50 text-sm">:</span>
      <input
        ref={mRef}
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={localMM}
        onChange={handleMinuteChange}
        onBlur={handleMinuteBlur}
        onKeyDown={handleMinuteKeyDown}
        placeholder="MM"
        className="w-7 bg-transparent text-foreground text-sm text-center outline-none placeholder:text-white/30"
        required={required}
      />
    </div>
  );
}

// --- Smooth-snap slider component ---
function SmoothSnapSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rawValue, setRawValue] = useState(value);
  const [animating, setAnimating] = useState(false);

  // Sync external value
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
    const v = getValueFromEvent(e.clientX);
    setRawValue(v);
  }, [getValueFromEvent]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const v = getValueFromEvent(e.clientX);
    setRawValue(v);
  }, [dragging, getValueFromEvent]);

  const handlePointerUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    const snapped = Math.round(rawValue);
    setAnimating(true);
    setRawValue(snapped);
    onChange(snapped);
    // Reset animation flag after transition
    setTimeout(() => setAnimating(false), 200);
  }, [dragging, rawValue, onChange]);

  const pct = (rawValue / 10) * 100;
  const displayVal = dragging ? rawValue : value;
  const displayPct = (displayVal / 10) * 100;

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
        {/* Track background */}
        <div className="absolute inset-x-0 h-2 rounded-full bg-white/[0.08]" />
        {/* Filled track */}
        <div
          className={`absolute left-0 h-2 rounded-full ${animating ? 'transition-[width] duration-200 ease-out' : ''}`}
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #7cff5b, #39ff14)',
          }}
        />
        {/* Snap dots */}
        {Array.from({ length: 11 }, (_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/20 -translate-x-1/2"
            style={{ left: `${(i / 10) * 100}%` }}
          />
        ))}
        {/* Thumb */}
        <div
          className={`absolute w-[22px] h-[22px] rounded-full -translate-x-1/2 ${animating ? 'transition-[left] duration-200 ease-out' : ''} ${dragging ? 'scale-110' : ''}`}
          style={{
            left: `${pct}%`,
            background: '#39ff14',
            border: '2px solid rgba(124, 255, 91, 0.95)',
            boxShadow: dragging
              ? '0 0 0 4px rgba(57, 255, 20, 0.25), 0 2px 16px rgba(0, 0, 0, 0.45)'
              : '0 0 0 2px rgba(57, 255, 20, 0.2), 0 2px 14px rgba(0, 0, 0, 0.35)',
            transition: dragging ? 'transform 0.1s, box-shadow 0.15s' : (animating ? 'left 0.2s ease-out, transform 0.15s, box-shadow 0.15s' : 'transform 0.15s, box-shadow 0.15s'),
          }}
        />
      </div>
      <span className="text-xs text-white/40 w-4 text-center shrink-0">10</span>
    </div>
  );
}

interface Player {
  id: string;
  teamId: string;
  name: string;
  jerseyNumber?: number;
  photoUrl?: string;
}

interface Match {
  id: string;
  teamId: string;
  date: string;
  opponent?: string;
  name?: string;
  result?: string;
  goalsFor?: number;
  goalsAgainst?: number;
  startTime?: string;
  matchRating?: number;
  /** Z hodnocení spoluhráčů a trenéra (nejvyšší průměr) */
  playerOfMatch?: { playerId: string; playerName: string } | null;
}

interface IcsImportCandidate {
  uid: string;
  date: string;
  startTime: string;
  opponent: string;
  summary: string;
  selected: boolean;
}

interface PsmfImportCandidate {
  uid: string;
  date: string;
  startTime: string;
  opponent: string;
  venueName: string;
  venueAbbrev: string;
  round: string;
  isHome: boolean;
  summary: string;
  selected: boolean;
}

interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  avgScore: number;
  voteCount: number;
}

type EventType = 'training' | 'friendly_match' | 'competitive_match' | 'custom';

interface Event {
  id: string;
  teamId: string;
  date: string;
  eventType: string;
  location?: string;
  opponent?: string;
  startTime?: string;
  note?: string;
  shareToken?: string;
  attendanceClosed?: boolean;
}

interface AttendanceStat {
  playerId: string;
  playerName: string;
  attendancePct: number;
  matchAttendancePct: number;
  avgMatchScore: number;
  trainingCount: number;
  matchEventCount: number;
  matchCount: number;
}

type Tab = 'dashboard' | 'manage' | 'vote' | 'leaderboard' | 'canadian' | 'calendar' | 'taktika' | 'fanousci';
type OverviewCardId = 'lastMatch' | 'upcomingEvents' | 'teamForm';
type OverviewCardSize = 'small' | 'wide' | 'full';
type OverviewCardLayoutItem = { id: OverviewCardId; order: number; size: OverviewCardSize; visible: boolean };
type TeamOverviewLayout = { version: 1; cards: OverviewCardLayoutItem[] };

const DEFAULT_TAB_ORDER: Tab[] = ['dashboard', 'manage', 'vote', 'leaderboard', 'canadian', 'calendar', 'taktika', 'fanousci'];
const OVERVIEW_CARD_IDS: OverviewCardId[] = ['lastMatch', 'upcomingEvents', 'teamForm'];
const DEFAULT_OVERVIEW_LAYOUT: TeamOverviewLayout = {
  version: 1,
  cards: [
    { id: 'lastMatch', order: 0, size: 'full', visible: true },
    { id: 'upcomingEvents', order: 1, size: 'small', visible: true },
    { id: 'teamForm', order: 2, size: 'wide', visible: true },
  ],
};

function tabLabel(tab: Tab): string {
  if (tab === 'dashboard') return 'Přehled';
  if (tab === 'manage') return 'Hráči a zápasy';
  if (tab === 'vote') return 'Ohodnotit';
  if (tab === 'leaderboard') return 'Žebříček';
  if (tab === 'canadian') return 'Kanadské bodování';
  if (tab === 'calendar') return 'Události/docházka';
  if (tab === 'taktika') return 'Taktika';
  return 'Fanoušci';
}


function overviewCardLabel(id: OverviewCardId): string {
  if (id === 'lastMatch') return 'Poslední zápas';
  if (id === 'upcomingEvents') return 'Následující události';
  return 'Forma týmu a hráčů';
}

function normalizeOverviewLayout(value: unknown): TeamOverviewLayout {
  if (!value || typeof value !== 'object') return DEFAULT_OVERVIEW_LAYOUT;
  const src = value as { version?: unknown; cards?: unknown };
  if (src.version !== 1 || !Array.isArray(src.cards)) return DEFAULT_OVERVIEW_LAYOUT;

  const cards: OverviewCardLayoutItem[] = [];
  const seen = new Set<OverviewCardId>();
  for (const raw of src.cards) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Partial<OverviewCardLayoutItem>;
    if (!item.id || !OVERVIEW_CARD_IDS.includes(item.id)) continue;
    if (seen.has(item.id)) continue;
    const size: OverviewCardSize =
      item.size === 'small' || item.size === 'wide' || item.size === 'full' ? item.size : 'small';
    cards.push({
      id: item.id,
      order: Number.isInteger(item.order) ? Number(item.order) : cards.length,
      size,
      visible: typeof item.visible === 'boolean' ? item.visible : true,
    });
    seen.add(item.id);
  }

  for (const fallback of DEFAULT_OVERVIEW_LAYOUT.cards) {
    if (!seen.has(fallback.id)) cards.push({ ...fallback });
  }

  cards.sort((a, b) => a.order - b.order);
  return {
    version: 1,
    cards: cards.map((c, index) => ({ ...c, order: index })),
  };
}

function toOverviewPayload(layout: OverviewCardLayoutItem[]): TeamOverviewLayout {
  const normalized = normalizeOverviewLayout({ version: 1, cards: layout });
  return { version: 1, cards: normalized.cards };
}

function layoutItemClass(size: OverviewCardSize): string {
  if (size === 'full') return 'col-span-full lg:col-span-2 xl:col-span-3';
  if (size === 'wide') return 'col-span-full lg:col-span-2 xl:col-span-2';
  return 'col-span-full lg:col-span-1 xl:col-span-1';
}

function SortableOverviewCard({
  item,
  editMode,
  onToggleVisibility,
  onSizeChange,
  children,
}: {
  item: OverviewCardLayoutItem;
  editMode: boolean;
  onToggleVisibility: (id: OverviewCardId) => void;
  onSizeChange: (id: OverviewCardId, size: OverviewCardSize) => void;
  children: React.ReactNode;
}) {
  const dragControls = useDragControls();
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPressTimer = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className={`${layoutItemClass(item.size)} ${editMode ? 'touch-none' : ''}`}
      whileDrag={{ scale: 1.01, zIndex: 30 }}
    >
      <div className="relative">
        {editMode && (
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 p-1.5 rounded-lg bg-black/45 border border-white/15 backdrop-blur-sm">
            <button
              type="button"
              className="px-2 py-1 rounded-md text-xs bg-surface-hover text-foreground border border-border cursor-grab active:cursor-grabbing"
              aria-label={`Přesunout ${overviewCardLabel(item.id)}`}
              onPointerDown={(e) => {
                clearPressTimer();
                pressTimerRef.current = setTimeout(() => {
                  dragControls.start(e);
                }, 220);
              }}
              onPointerUp={clearPressTimer}
              onPointerLeave={clearPressTimer}
              onPointerCancel={clearPressTimer}
            >
              ⋮⋮
            </button>
            <Select value={item.size} onValueChange={(v) => onSizeChange(item.id, v as OverviewCardSize)}>
              <SelectTrigger className="h-7 w-[96px] rounded-md glass-input text-xs text-foreground focus:ring-2 focus:ring-blue-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="wide">Wide</SelectItem>
                <SelectItem value="full">Full</SelectItem>
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={() => onToggleVisibility(item.id)}
              className="px-2 py-1 rounded-md text-xs bg-surface-hover text-foreground border border-border"
            >
              Skrýt
            </button>
          </div>
        )}
        {children}
      </div>
    </Reorder.Item>
  );
}

interface CanadianEntry {
  playerId: string;
  playerName: string;
  goals: number;
  assists: number;
  total: number;
}

function getSeasonFromDate(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  if (month >= 7) return `${year}/${String(year + 1).slice(-2)}`;
  return `${year - 1}/${String(year).slice(-2)}`;
}

function unescapeIcsValue(value: string): string {
  return value
    .replace(/\\n/gi, ' ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

function unfoldIcsLines(content: string): string[] {
  const rawLines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const lines: string[] = [];
  for (const line of rawLines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

function parseIcsDateTime(raw: string): { date: string; startTime: string } | null {
  const value = raw.trim();
  if (/^\d{8}$/.test(value)) return null;

  const timed = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})\d{2}(Z)?$/);
  if (!timed) return null;
  const [, year, month, day, hh, mm, zulu] = timed;

  if (!zulu) {
    return { date: `${year}-${month}-${day}`, startTime: `${hh}:${mm}` };
  }

  const dt = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hh), Number(mm), 0));
  if (Number.isNaN(dt.getTime())) return null;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  const h = String(dt.getHours()).padStart(2, '0');
  const min = String(dt.getMinutes()).padStart(2, '0');
  return { date: `${y}-${m}-${d}`, startTime: `${h}:${min}` };
}

function extractOpponentFromSummary(summary: string, clubFilter: string): string {
  const trimmed = summary.trim();
  if (!trimmed) return 'Soupeř';
  if (!clubFilter.trim()) return trimmed;

  const escaped = clubFilter.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const withoutClub = trimmed.replace(new RegExp(escaped, 'ig'), ' ');
  const withoutSeparators = withoutClub.replace(/\s*(vs\.?| v | x |:|-|–|—)\s*/gi, ' ').replace(/\s+/g, ' ').trim();
  return withoutSeparators || trimmed;
}

function parseIcsImportCandidates(content: string, clubFilter: string): {
  candidates: IcsImportCandidate[];
  totalEvents: number;
  matchingEvents: number;
  skippedWithoutTime: number;
} {
  const lines = unfoldIcsLines(content);
  const events: Array<Record<string, string>> = [];
  let current: Record<string, string> | null = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }
    if (line === 'END:VEVENT') {
      if (current) events.push(current);
      current = null;
      continue;
    }
    if (!current) continue;
    const idx = line.indexOf(':');
    if (idx <= 0) continue;
    const rawKey = line.slice(0, idx);
    const value = line.slice(idx + 1);
    const key = rawKey.split(';')[0].toUpperCase();
    if (!current[key]) current[key] = value;
  }

  const normalizedFilter = clubFilter.trim().toLowerCase();
  let skippedWithoutTime = 0;
  let matchingEvents = 0;
  const candidates: IcsImportCandidate[] = [];

  for (const ev of events) {
    const summary = unescapeIcsValue(ev.SUMMARY || '');
    const description = unescapeIcsValue(ev.DESCRIPTION || '');
    const location = unescapeIcsValue(ev.LOCATION || '');
    const searchText = `${summary} ${description} ${location}`.toLowerCase();
    if (normalizedFilter && !searchText.includes(normalizedFilter)) continue;
    matchingEvents += 1;

    const dtstart = ev.DTSTART;
    if (!dtstart) continue;
    const parsed = parseIcsDateTime(dtstart);
    if (!parsed) {
      skippedWithoutTime += 1;
      continue;
    }
    const opponent = extractOpponentFromSummary(summary, clubFilter);
    const uid = (ev.UID || `${parsed.date}-${parsed.startTime}-${summary}`).trim();
    candidates.push({
      uid,
      date: parsed.date,
      startTime: parsed.startTime,
      opponent,
      summary: summary || `${parsed.date} ${parsed.startTime}`,
      selected: true,
    });
  }

  const dedup = new Map<string, IcsImportCandidate>();
  for (const candidate of candidates) {
    const key = `${candidate.date}|${candidate.startTime}|${candidate.opponent.toLowerCase()}`;
    if (!dedup.has(key)) dedup.set(key, candidate);
  }

  return {
    candidates: Array.from(dedup.values()).sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)),
    totalEvents: events.length,
    matchingEvents,
    skippedWithoutTime,
  };
}

/** Odpovědi na účast se uzavírají hodinu před začátkem události. */
function isUcastClosed(dateStr: string, startTime?: string): boolean {
  let eventStart: Date;
  if (startTime && /^\d{1,2}:\d{2}$/.test(startTime.trim())) {
    eventStart = new Date(dateStr + 'T' + startTime.trim() + ':00');
  } else {
    eventStart = new Date(dateStr + 'T00:00:00');
  }
  const deadline = new Date(eventStart.getTime() - 60 * 60 * 1000);
  return new Date() >= deadline;
}

function formatMatchScore(m: Match, teamLabel: string, opponentLabel: string): string | null {
  if (m.goalsFor != null && m.goalsAgainst != null) {
    return `${teamLabel} ${m.goalsFor} : ${m.goalsAgainst} ${opponentLabel}`;
  }
  if (m.result) return m.result;
  return null;
}

const MATCH_RATING_LABELS: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '😞', label: 'Špatný' }, 2: { emoji: '😞', label: 'Špatný' }, 3: { emoji: '😞', label: 'Špatný' },
  4: { emoji: '😐', label: 'Průměrný' }, 5: { emoji: '😐', label: 'Průměrný' },
  6: { emoji: '🙂', label: 'Dobrý' }, 7: { emoji: '🙂', label: 'Dobrý' },
  8: { emoji: '😄', label: 'Skvělý' }, 9: { emoji: '😄', label: 'Skvělý' },
  10: { emoji: '🔥', label: 'Výborný!' },
};

function MatchResultPopup({
  match, teamId, token, teamLabel, opponentLabel, players, onSaved, onClose,
}: {
  match: Match; teamId: string; token: string; teamLabel: string; opponentLabel: string;
  players: { id: string; name: string }[]; onSaved: () => void; onClose: () => void;
}) {
  const [goalsFor, setGoalsFor] = useState(match.goalsFor != null ? String(match.goalsFor) : '');
  const [goalsAgainst, setGoalsAgainst] = useState(match.goalsAgainst != null ? String(match.goalsAgainst) : '');
  const [matchRating, setMatchRating] = useState(match.matchRating ?? 5);
  const [scorers, setScorers] = useState<{ goalOrder: number; playerId: string }[]>([]);
  const [assists, setAssists] = useState<{ assistOrder: number; playerId: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const gfCount = (() => { const n = parseInt(goalsFor, 10); return !isNaN(n) && n >= 0 ? n : 0; })();

  // Load existing scorers
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/teams/${teamId}/matches/${match.id}/scorers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const d = await res.json();
          const s = (d.scorers || []).map((x: any) => ({ goalOrder: x.goalOrder, playerId: x.playerId }));
          const a = (d.assists || []).map((x: any) => ({ assistOrder: x.assistOrder, playerId: x.playerId }));
          setScorers(s);
          setAssists(a);
        }
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Sync scorer/assist row count with goalsFor
  useEffect(() => {
    if (!loaded) return;
    setScorers(prev => {
      const arr = [...prev];
      while (arr.length < gfCount) arr.push({ goalOrder: arr.length + 1, playerId: '' });
      return arr.slice(0, gfCount);
    });
    setAssists(prev => {
      const arr = [...prev];
      while (arr.length < gfCount) arr.push({ assistOrder: arr.length + 1, playerId: '' });
      return arr.slice(0, gfCount);
    });
  }, [gfCount, loaded]);

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { matchRating };
      const gf = goalsFor !== '' ? parseInt(goalsFor, 10) : undefined;
      const ga = goalsAgainst !== '' ? parseInt(goalsAgainst, 10) : undefined;
      if (gf != null && !isNaN(gf)) body.goalsFor = gf;
      if (ga != null && !isNaN(ga)) body.goalsAgainst = ga;
      await fetch(`/api/teams/${teamId}/matches/${match.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (gfCount > 0) {
        await fetch(`/api/teams/${teamId}/matches/${match.id}/scorers`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scorers: scorers.filter(s => s.playerId).map(s => ({ goalOrder: s.goalOrder, playerId: s.playerId })),
            assists: assists.filter(a => a.playerId).map(a => ({ assistOrder: a.assistOrder, playerId: a.playerId })),
          }),
        });
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const ratingInfo = MATCH_RATING_LABELS[matchRating] || { emoji: '😐', label: '' };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="glass-card rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-border max-h-[85vh] overflow-y-auto pointer-events-auto" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-foreground font-semibold">{match.opponent ? `vs ${match.opponent}` : 'Zápas'}</p>
              <p className="text-foreground/50 text-sm">{formatEventDateTime(match.date, match.startTime)}</p>
            </div>
            <button onClick={onClose} className="text-foreground/30 hover:text-foreground text-xl leading-none">✕</button>
          </div>

          {/* Score */}
          <div className="mb-5">
            <p className="text-foreground/70 text-xs font-medium mb-2 uppercase tracking-wide">Skóre</p>
            <div className="flex items-center justify-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <span className="text-foreground/60 text-xs">{teamLabel}</span>
                <input type="number" min={0} value={goalsFor} onChange={e => setGoalsFor(e.target.value)}
                  placeholder="0" autoFocus
                  className="w-16 h-14 text-center text-2xl font-bold rounded-xl glass-input text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
              <span className="text-foreground/40 text-2xl font-light mt-5">:</span>
              <div className="flex flex-col items-center gap-1">
                <span className="text-foreground/60 text-xs">{opponentLabel}</span>
                <input type="number" min={0} value={goalsAgainst} onChange={e => setGoalsAgainst(e.target.value)}
                  placeholder="0"
                  className="w-16 h-14 text-center text-2xl font-bold rounded-xl glass-input text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
            </div>
          </div>

          {/* Scorers + Assists */}
          {gfCount > 0 && loaded && (
            <div className="mb-5">
              <p className="text-foreground/70 text-xs font-medium mb-2 uppercase tracking-wide">Střelci &amp; asistence</p>
              <div className="space-y-2">
                {Array.from({ length: gfCount }, (_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-foreground/50 text-xs w-6 shrink-0 text-right">{i + 1}.</span>
                    <Select
                      value={scorers[i]?.playerId || '__none__'}
                      onValueChange={v => setScorers(prev => prev.map((s, j) => j === i ? { ...s, playerId: v === '__none__' ? '' : v } : s))}
                    >
                      <SelectTrigger className="h-8 flex-1 min-w-0 rounded-lg glass-input text-foreground text-sm">
                        <SelectValue placeholder="Střelec" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Střelec —</SelectItem>
                        {players.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <span className="text-foreground/30 text-xs">+</span>
                    <Select
                      value={assists[i]?.playerId || '__none__'}
                      onValueChange={v => setAssists(prev => prev.map((a, j) => j === i ? { ...a, playerId: v === '__none__' ? '' : v } : a))}
                    >
                      <SelectTrigger className="h-8 flex-1 min-w-0 rounded-lg glass-input text-foreground text-sm">
                        <SelectValue placeholder="Asistence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Asistence —</SelectItem>
                        {players.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Match Rating */}
          <div className="mb-6">
            <p className="text-foreground/70 text-xs font-medium mb-2 uppercase tracking-wide">Jak se zápas vyvedl?</p>
            <div className="flex items-center gap-3">
              <input
                type="range" min={1} max={10} step={1} value={matchRating}
                onChange={e => setMatchRating(Number(e.target.value))}
                className="flex-1 h-2 rounded-full appearance-none cursor-pointer rating-range-modern"
              />
              <span className="text-lg w-8 text-center">{ratingInfo.emoji}</span>
            </div>
            <p className="text-foreground/50 text-xs mt-1 text-center">{matchRating}/10 — {ratingInfo.label}</p>
          </div>

          {/* Save */}
          <button
            onClick={save} disabled={saving}
            className="w-full py-3 rounded-xl bg-[#86EF42] hover:bg-[#65d630] disabled:opacity-50 text-black font-semibold text-sm transition-colors"
          >
            {saving ? 'Ukládám...' : 'Uložit'}
          </button>
        </div>
      </motion.div>
    </>
  );
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  training: 'Trénink',
  friendly_match: 'Zápas přátelský',
  competitive_match: 'Zápas mistrovský',
  custom: 'Vlastní',
};

/** Vždy zobrazí datum a přesný čas začátku události/tréninku/zápasu. */
function formatEventDateTime(date: string, startTime?: string): string {
  const dateStr = new Date(date + 'T12:00:00').toLocaleDateString('cs-CZ');
  return startTime && /^\d{1,2}:\d{2}$/.test(startTime.trim())
    ? `${dateStr} ${startTime.trim()}`
    : `${dateStr}, čas neuveden`;
}

function isMatchPlayed(date: string, startTime?: string): boolean {
  if (!startTime || !/^\d{1,2}:\d{2}$/.test(startTime.trim())) return false;
  const matchDateTime = new Date(`${date}T${startTime.trim()}:00`);
  return !Number.isNaN(matchDateTime.getTime()) && matchDateTime.getTime() <= Date.now();
}

/** Humorné emoji – motivační, s nadsázkou. */
const RATING_EMOJI: Record<number, string> = {
  0: '🪑',  // zůstal na lavičce
  1: '😬',  // no...
  2: '🥴',  // slabší den
  3: '😅',  // aspoň se zpotil
  4: '🙂',  // průměr
  5: '👍',  // solidní řemeslo
  6: '💪',  // začíná jiskřit
  7: '🔥',  // takovej výkon chceš každej víkend
  8: '⭐',  // soupeř plakal
  9: '🚀',  // jinej level
  10: '👑', // zavolejte agenta
};

/** Humorné popisky – s nadsázkou a týmovým duchem. */
const RATING_LABELS: Record<number, string> = {
  0: 'Zůstal v šatně',
  1: 'Dnes to chytlo jiný kopačky',
  2: 'Hrál, ale tráva víc',
  3: 'Aspoň se zpotil',
  4: 'Průměrnej den v kanclu',
  5: 'Solidní řemeslo',
  6: 'Začíná to jiskřit!',
  7: 'Takovej výkon chceš každej víkend',
  8: 'Soupeř ho chtěl vyměnit k sobě',
  9: 'Dnes to byl jinej level',
  10: 'Zavolejte mu agenta!',
};

type BadgeId = 'střelec' | 'dříč' | 'král_asistencí';

const BADGES: { id: BadgeId; label: string; icon: string; title: string }[] = [
  { id: 'střelec', label: 'Střelec', icon: '⚽', title: 'Nejvíce gólů v týmu' },
  { id: 'dříč', label: 'Dříč', icon: '💪', title: 'Nejlepší docházka' },
  { id: 'král_asistencí', label: 'Král asistencí', icon: '👑', title: 'Nejvíce asistencí' },
];

/** Přezdívka a ikona podle hodnocení a statistik – pro hráčskou kartu. */
function getPlayerNicknameAndIcon(
  entry: LeaderboardEntry,
  badges: BadgeId[],
  canadianStats: CanadianEntry[],
  _attendanceStats: AttendanceStat[]
): { nickname: string; icon: string } {
  if (badges.includes('střelec')) return { nickname: 'Kanonýr', icon: '⚽' };
  if (badges.includes('král_asistencí')) return { nickname: 'Číšník', icon: '👑' };
  if (badges.includes('dříč')) return { nickname: 'Železnej muž', icon: '💪' };
  const s = entry.avgScore;
  if (s >= 9) return { nickname: 'Zavolejte agenta', icon: '🚀' };
  if (s >= 8) return { nickname: 'Hvězda týmu', icon: '⭐' };
  if (s >= 7) return { nickname: 'Mašina', icon: '🔥' };
  if (s >= 6) return { nickname: 'Jistota', icon: '👍' };
  if (s >= 5) return { nickname: 'Pracant', icon: '🙂' };
  return { nickname: 'Tichej zabiják', icon: '🤫' };
}

function getPlayerBadges(
  playerId: string,
  canadianStats: CanadianEntry[],
  attendanceStats: AttendanceStat[]
): BadgeId[] {
  const badges: BadgeId[] = [];
  if (canadianStats.length > 0) {
    const topGoals = canadianStats.filter((c) => c.goals > 0).sort((a, b) => b.goals - a.goals)[0];
    if (topGoals?.playerId === playerId) badges.push('střelec');
    const topAssists = canadianStats.filter((c) => c.assists > 0).sort((a, b) => b.assists - a.assists)[0];
    if (topAssists?.playerId === playerId) badges.push('král_asistencí');
  }
  if (attendanceStats.length > 0) {
    const withTrainings = attendanceStats.filter((s) => s.trainingCount > 0);
    if (withTrainings.length > 0) {
      const topAttendance = [...withTrainings].sort((a, b) => b.attendancePct - a.attendancePct)[0];
      if (topAttendance?.playerId === playerId) badges.push('dříč');
    }
  }
  return badges;
}

function HodnoceniHracuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const confirm = useConfirm();
  const tabParam = searchParams.get('tab');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialDataReady, setInitialDataReady] = useState(false);
  const [dashboardCardsLoading, setDashboardCardsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [tab, setTab] = useState<Tab>(
    tabParam === 'dashboard' || tabParam === 'calendar' || tabParam === 'vote' || tabParam === 'leaderboard' || tabParam === 'canadian' || tabParam === 'taktika' || tabParam === 'fanousci'
      ? tabParam as Tab
      : 'dashboard'
  );
  const [overviewLayout, setOverviewLayout] = useState<OverviewCardLayoutItem[]>(DEFAULT_OVERVIEW_LAYOUT.cards);
  const [overviewDraft, setOverviewDraft] = useState<OverviewCardLayoutItem[]>(DEFAULT_OVERVIEW_LAYOUT.cards);
  const [overviewEditMode, setOverviewEditMode] = useState(false);
  const [savingOverviewLayout, setSavingOverviewLayout] = useState(false);

  const [teamName, setTeamName] = useState('');
  const [teamBackgroundColor, setTeamBackgroundColor] = useState<string | undefined>();
  const [coachPlayerId, setCoachPlayerId] = useState<string | null>(null);
  const [savingCoach, setSavingCoach] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerCardModal, setPlayerCardModal] = useState<LeaderboardEntry | null>(null);

  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerJerseyNumber, setNewPlayerJerseyNumber] = useState('');
  const [newMatchDate, setNewMatchDate] = useState('');
  const [newMatchStartTime, setNewMatchStartTime] = useState('');
  const [newMatchOpponent, setNewMatchOpponent] = useState('');
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [addPlayerPhoto, setAddPlayerPhoto] = useState<File | null>(null);
  const [addPlayerPhotoPreview, setAddPlayerPhotoPreview] = useState<string | null>(null);
  const [addPlayerCropMode, setAddPlayerCropMode] = useState(false);
  const [addPlayerRawSrc, setAddPlayerRawSrc] = useState<string | null>(null);
  const [addPlayerCrop, setAddPlayerCrop] = useState({ x: 0, y: 0 });
  const [addPlayerZoom, setAddPlayerZoom] = useState(1);
  const [addPlayerCroppedArea, setAddPlayerCroppedArea] = useState<Area | null>(null);
  const [addingMatch, setAddingMatch] = useState(false);

  const [voterId, setVoterId] = useState('');
  const [matchId, setMatchId] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showVoteValidation, setShowVoteValidation] = useState(false);
  const [hasVoted, setHasVoted] = useState<boolean | null>(null);
  const [voteSubmittedSuccess, setVoteSubmittedSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ playerId: string; playerName: string } | null>(null);
  const [deleteFeedback, setDeleteFeedback] = useState<string | null>(null);
  const [playerJerseyInputs, setPlayerJerseyInputs] = useState<Record<string, string>>({});
  const [savingPlayerJerseyId, setSavingPlayerJerseyId] = useState<string | null>(null);
  const [playerJerseyFeedback, setPlayerJerseyFeedback] = useState<string | null>(null);
  const [matchesSeason, setMatchesSeason] = useState<string>('__all__');
  const [leaderboardFilter, setLeaderboardFilter] = useState<string>('');
  const [canadianStats, setCanadianStats] = useState<CanadianEntry[]>([]);
  const [canadianFilter, setCanadianFilter] = useState<string>('');
  const [matchPopup, setMatchPopup] = useState<Match | null>(null);
  const [showAllUpcomingMatches, setShowAllUpcomingMatches] = useState(false);
  const [playerDetailModal, setPlayerDetailModal] = useState<Player | null>(null);
  const newPlayerInputRef = useRef<HTMLInputElement>(null);
  const addPlayerFileInputRef = useRef<HTMLInputElement>(null);
  const icsFileInputRef = useRef<HTMLInputElement>(null);
  const [icsClubFilter, setIcsClubFilter] = useState('');
  const [icsCandidates, setIcsCandidates] = useState<IcsImportCandidate[]>([]);
  const [icsPanelOpen, setIcsPanelOpen] = useState(false);
  const [icsPreviewOpen, setIcsPreviewOpen] = useState(false);
  const [icsFeedback, setIcsFeedback] = useState<string | null>(null);
  const [icsParsing, setIcsParsing] = useState(false);
  const [icsImporting, setIcsImporting] = useState(false);
  const [recentlyImportedMatchIds, setRecentlyImportedMatchIds] = useState<string[]>([]);
  const importAnimationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [deletingMatches, setDeletingMatches] = useState(false);

  // PSMF import state
  const [psmfClubName, setPsmfClubName] = useState('');
  const [psmfSearchResults, setPsmfSearchResults] = useState<{ name: string; slug: string; division: string; url: string }[]>([]);
  const [psmfSelectedTeam, setPsmfSelectedTeam] = useState<{ name: string; url: string } | null>(null);
  const [psmfCandidates, setPsmfCandidates] = useState<PsmfImportCandidate[]>([]);
  const [psmfPanelOpen, setPsmfPanelOpen] = useState(false);
  const [psmfPreviewOpen, setPsmfPreviewOpen] = useState(false);
  const [psmfFeedback, setPsmfFeedback] = useState<string | null>(null);
  const [psmfSearching, setPsmfSearching] = useState(false);
  const [psmfParsing, setPsmfParsing] = useState(false);
  const [psmfImporting, setPsmfImporting] = useState(false);

  const [events, setEvents] = useState<Event[]>([]);
  const [ucastModal, setUcastModal] = useState<Event | null>(null);
  const [ucastModalFinalized, setUcastModalFinalized] = useState(false);
  const [ucastModalData, setUcastModalData] = useState<{ playerId: string; attended: boolean; absenceReason?: string; responded: boolean }[]>([]);
  const [quickPlayerId, setQuickPlayerId] = useState('');
  const [quickAttending, setQuickAttending] = useState<boolean | null>(null);
  const [quickAbsenceReason, setQuickAbsenceReason] = useState('');
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [quickSuccess, setQuickSuccess] = useState<string | null>(null);
  const [attendanceModal, setAttendanceModal] = useState<Event | null>(null);
  const [attendanceModalClosed, setAttendanceModalClosed] = useState(false);
  const [attendanceModalFinalized, setAttendanceModalFinalized] = useState(false);
  const [attendanceData, setAttendanceData] = useState<{ playerId: string; attended: boolean; absenceReason?: string }[]>([]);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventStartTime, setNewEventStartTime] = useState('');
  const [newEventType, setNewEventType] = useState<EventType>('training');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventOpponent, setNewEventOpponent] = useState('');
  const [newEventNote, setNewEventNote] = useState('');
  const [newEventCustomName, setNewEventCustomName] = useState('');
  const [eventTypeOpen, setEventTypeOpen] = useState(false);
  const [addingEvent, setAddingEvent] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStat[]>([]);
  const [showAllFormPlayers, setShowAllFormPlayers] = useState(true);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [createdEventLink, setCreatedEventLink] = useState<string | null>(null);
  const [eventAttendanceSummary, setEventAttendanceSummary] = useState<Record<string, { attended: number; notAttended: number; noResponse: number }>>({});

  // Fan votes
  const [fanVoteData, setFanVoteData] = useState<{ matchId: string; date: string; opponent: string; results: { playerId: string; playerName: string; voteCount: number }[]; totalVotes: number }[]>([]);
  const [fanVoteLoading, setFanVoteLoading] = useState(false);
  const [fanVoteLoaded, setFanVoteLoaded] = useState(false);

  const headers = () => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => {
    const t = localStorage.getItem('token');
    const tid = localStorage.getItem('teamId');
    if (!t || !tid) {
      router.push('/login/team');
      return;
    }
    setToken(t);
    setTeamId(tid);
    setLoading(false);
  }, [router]);

  const matchSeasons = [...new Set(matches.map((m) => getSeasonFromDate(m.date)))].sort().reverse();
  const selectedSeason = matchesSeason;
  const filteredMatches = (selectedSeason === '__all__'
    ? matches
    : matches.filter((m) => getSeasonFromDate(m.date) === selectedSeason)
  ).sort((a, b) => `${a.date} ${a.startTime ?? ''}`.localeCompare(`${b.date} ${b.startTime ?? ''}`));
  const playedMatches = matches
    .filter((m) => isMatchPlayed(m.date, m.startTime))
    .sort((a, b) => `${b.date} ${b.startTime ?? ''}`.localeCompare(`${a.date} ${a.startTime ?? ''}`));

  useEffect(() => {
    if (!icsClubFilter && teamName) setIcsClubFilter(teamName);
  }, [icsClubFilter, teamName]);

  useEffect(() => {
    setPlayerJerseyInputs(
      Object.fromEntries(players.map((p) => [p.id, p.jerseyNumber != null ? String(p.jerseyNumber) : '']))
    );
  }, [players]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'dashboard' || t === 'calendar' || t === 'vote' || t === 'leaderboard' || t === 'canadian' || t === 'taktika' || t === 'fanousci') setTab(t as Tab);
  }, [searchParams]);

  useEffect(() => {
    if (!teamId || !token) return;
    let active = true;
    const initLoad = async () => {
      setInitialDataReady(false);
      setDashboardCardsLoading(true);
      setLoadingProgress(0);

      const withProgress = (p: Promise<unknown>) =>
        p.finally(() => setLoadingProgress((prev) => Math.min(95, prev + 19)));

      const teamFetch = fetch(`/api/teams/${teamId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!active || !d?.team) return;
          if (d.team.teamName) setTeamName(d.team.teamName);
          setTeamBackgroundColor(d.team.backgroundColor);
          setCoachPlayerId(d.team.coachPlayerId ?? null);
          const normalized = normalizeOverviewLayout(d.team.overviewLayout);
          setOverviewLayout(normalized.cards);
          setOverviewDraft(normalized.cards);
        })
        .catch(() => {});

      await Promise.allSettled([
        withProgress(fetchPlayers()),
        withProgress(fetchMatches()),
        withProgress(fetchEvents()),
        withProgress(fetchAttendanceStats()),
        withProgress(teamFetch),
      ]);

      if (!active) return;
      setLoadingProgress(100);
      setInitialDataReady(true);
      // setDashboardCardsLoading(false) is called by OverviewProgressLoader's onNearComplete
      // once the spring animation visually reaches 99%
    };
    initLoad();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, token]);

  useEffect(() => {
    if (!initialDataReady || !teamId || !token) return;
    if (tab === 'dashboard' || tab === 'calendar') {
      fetchEvents();
      fetchAttendanceStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (!initialDataReady || !teamId || !token) return;
    if (tab === 'fanousci' && !fanVoteLoaded) {
      setFanVoteLoading(true);
      fetch(`/api/teams/${teamId}/fan-votes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : { matches: [] }))
        .then((d: { matches?: typeof fanVoteData }) => {
          setFanVoteData(d?.matches || []);
          setFanVoteLoaded(true);
        })
        .catch(() => setFanVoteData([]))
        .finally(() => setFanVoteLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, initialDataReady, teamId, token]);

  useEffect(() => {
    if (!initialDataReady || !teamId || !token) return;
    if (tab === 'leaderboard') {
      fetchLeaderboard();
      fetchAttendanceStats();
      const params = new URLSearchParams();
      if (leaderboardFilter.startsWith('season:')) params.set('season', leaderboardFilter.slice(7));
      fetch(`/api/teams/${teamId}/canadian-scoring${params.toString() ? `?${params}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : {}))
        .then((d: { stats?: CanadianEntry[] }) => setCanadianStats(d?.stats || []))
        .catch(() => setCanadianStats([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, leaderboardFilter]);

  useEffect(() => {
    if (!initialDataReady || tab !== 'canadian' || !teamId || !token) return;
    const params = new URLSearchParams();
    if (canadianFilter.startsWith('season:')) params.set('season', canadianFilter.slice(7));
    fetch(`/api/teams/${teamId}/canadian-scoring${params.toString() ? `?${params}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: { stats?: CanadianEntry[] }) => setCanadianStats(d?.stats || []))
      .catch(() => setCanadianStats([]));
  }, [tab, teamId, token, canadianFilter]);

  useEffect(() => {
    if (!teamId || !token || events.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    const upcomingIds = events.filter((e) => e.date >= today).slice(0, 10).map((e) => e.id);
    if (upcomingIds.length === 0) return;
    fetch(`/api/teams/${teamId}/events-attendance-summary?ids=${upcomingIds.join(',')}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: { summary?: Record<string, { attended: number; notAttended: number; noResponse: number }> }) => setEventAttendanceSummary(d?.summary || {}))
      .catch(() => {});
  }, [teamId, token, events]);

  useEffect(() => {
    if (!matchId) return;
    if (!playedMatches.some((m) => m.id === matchId)) {
      setMatchId('');
    }
  }, [matchId, playedMatches]);

  useEffect(() => {
    return () => {
      if (importAnimationTimeoutRef.current) {
        clearTimeout(importAnimationTimeoutRef.current);
      }
    };
  }, []);

  const fetchPlayers = async () => {
    if (!teamId || !token) return;
    const res = await fetch(`/api/teams/${teamId}/players`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setPlayers(data.players);
    }
  };

  const fetchMatches = async (): Promise<Match[]> => {
    if (!teamId || !token) return [];
    const res = await fetch(`/api/teams/${teamId}/matches`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setMatches(data.matches);
      return data.matches || [];
    }
    return [];
  };

  const fetchLeaderboard = async () => {
    if (!teamId || !token) return;
    const params = new URLSearchParams();
    if (leaderboardFilter.startsWith('season:')) {
      params.set('season', leaderboardFilter.slice(7));
    } else if (leaderboardFilter.startsWith('match:')) {
      params.set('matchId', leaderboardFilter.slice(6));
    }
    const qs = params.toString();
    const res = await fetch(`/api/teams/${teamId}/ratings${qs ? `?${qs}` : ''}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setLeaderboard(data.leaderboard);
    }
  };

  const fetchEvents = async () => {
    if (!teamId || !token) return;
    setCalendarError(null);
    const res = await fetch(`/api/teams/${teamId}/events`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setEvents(data.events || []);
    } else if (res.status === 503) {
      setCalendarError(data.error || 'Chyba konfigurace');
    }
  };

  const fetchAttendanceStats = async () => {
    if (!teamId || !token) return;
    const res = await fetch(`/api/teams/${teamId}/attendance-stats`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setAttendanceStats(data.stats || []);
    }
  };

  const fetchEventAttendanceSummary = async () => {
    if (!teamId || !token || events.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    const upcomingIds = events.filter((e) => e.date >= today).slice(0, 10).map((e) => e.id);
    if (upcomingIds.length === 0) return;
    const res = await fetch(`/api/teams/${teamId}/events-attendance-summary?ids=${upcomingIds.join(',')}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setEventAttendanceSummary(data.summary || {});
    }
  };

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventDate || !teamId || !token) {
      toast.warning('Datum je povinné');
      return;
    }
    const time = newEventStartTime.trim();
    if (!time || !/^\d{1,2}:\d{2}$/.test(time)) {
      toast.warning('Čas začátku je povinný (HH:mm)');
      return;
    }
    const location = newEventLocation.trim();
    if (!location) {
      toast.warning('Místo konání je povinné');
      return;
    }
    if (newEventType === 'custom' && !newEventCustomName.trim()) {
      toast.warning('Zadejte název vlastní události');
      return;
    }
    setAddingEvent(true);
    const resolvedEventType = newEventType === 'custom' ? newEventCustomName.trim() : newEventType;
    try {
      const res = await fetch(`/api/teams/${teamId}/events`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          date: newEventDate,
          eventType: resolvedEventType,
          location,
          opponent: (newEventType !== 'training' ? newEventOpponent : undefined)?.trim() || undefined,
          startTime: time,
          note: newEventNote.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const base = typeof window !== 'undefined' ? window.location.origin : '';
        if (data.event?.shareToken) {
          setCreatedEventLink(`${base}/udalost/${data.event.shareToken}`);
          setTimeout(() => setCreatedEventLink(null), 15000);
        }
        setNewEventDate('');
        setNewEventStartTime('');
        setNewEventLocation('');
        setNewEventOpponent('');
        setNewEventNote('');
        setNewEventCustomName('');
        setNewEventType('training');
        await fetchEvents();
        await fetchAttendanceStats();
      } else {
        const d = await res.json();
        const err = d.error || 'Chyba';
        if (err.includes('migrate-event-note') || err.includes('chybí sloupce')) {
          const base = typeof window !== 'undefined' ? window.location.origin : '';
          console.error(`${err}\n\nRychlé řešení:\n1. supabase.com/dashboard/account/tokens → vygeneruj token\n2. Do .env.local přidej: SUPABASE_ACCESS_TOKEN=sbp_xxx\n3. Restartuj server, navštiv: ${base}/api/admin/migrate-event-note?key=migrate-event-note-2024`);
          toast.error('Chyba: chybí sloupce v tabulce. Viz konzole pro detaily.');
        } else {
          toast.error(err);
        }
      }
    } finally {
      setAddingEvent(false);
    }
  };

  /** Účast – před událostí: odkaz pro hráče + přehled odpovědí (kdo přijde / nepřijde). Hráči se označí nejpozději do půlnoci předchozího dne. */
  const openUcastModal = async (ev: Event) => {
    setUcastModal(ev);
    setQuickPlayerId('');
    setQuickAttending(null);
    setQuickAbsenceReason('');
    setQuickError(null);
    setQuickSuccess(null);
    const res = await fetch(`/api/teams/${teamId}/events/${ev.id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setUcastModalFinalized(data.event?.attendanceFinalized ?? false);
      const current = (data.attendance || []) as { playerId: string; attended: boolean; absenceReason?: string }[];
      const byPlayer = Object.fromEntries(current.map((a) => [a.playerId, a]));
      setUcastModalData(
        players.map((p) => {
          const a = byPlayer[p.id];
          return {
            playerId: p.id,
            attended: a?.attended ?? false,
            absenceReason: a?.absenceReason,
            responded: a !== undefined,
          };
        })
      );
    } else {
      setUcastModalData(players.map((p) => ({ playerId: p.id, attended: false, absenceReason: undefined, responded: false })));
    }
  };

  const submitQuickAttendance = async () => {
    if (!ucastModal?.shareToken) return;
    if (!quickPlayerId) {
      setQuickError('Vyberte prosím své jméno.');
      return;
    }
    if (quickAttending === null) {
      setQuickError('Vyberte prosím, zda se zúčastníte.');
      return;
    }
    if (!quickAttending && !quickAbsenceReason.trim()) {
      setQuickError('Při neúčasti je nutné vyplnit důvod.');
      return;
    }

    setQuickSubmitting(true);
    setQuickError(null);
    setQuickSuccess(null);
    try {
      const res = await fetch(`/api/udalost/${ucastModal.shareToken}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: quickPlayerId,
          attended: quickAttending,
          absenceReason: quickAttending ? undefined : quickAbsenceReason.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setQuickError(data?.error || 'Nepodařilo se uložit odpověď.');
        return;
      }

      setQuickSuccess('Odpověď byla uložena.');
      if (ucastModal) {
        await openUcastModal(ucastModal);
      }
      setQuickAttending(null);
      setQuickAbsenceReason('');
    } catch {
      setQuickError('Nepodařilo se uložit odpověď.');
    } finally {
      setQuickSubmitting(false);
    }
  };

  useEffect(() => {
    if (!quickPlayerId) return;
    const existing = ucastModalData.find((x) => x.playerId === quickPlayerId);
    if (!existing || !existing.responded) {
      setQuickAttending(null);
      setQuickAbsenceReason('');
      return;
    }
    setQuickAttending(existing.attended);
    setQuickAbsenceReason(existing.absenceReason || '');
  }, [quickPlayerId, ucastModalData]);

  /** Docházka – po události: trenér finálně zaznamená, kdo skutečně přišel (jednorázové odeslání). */
  const openDochazkaModal = async (ev: Event) => {
    setAttendanceModal(ev);
    setAttendanceModalClosed(false);
    setAttendanceModalFinalized(false);
    const res = await fetch(`/api/teams/${teamId}/events/${ev.id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setAttendanceModalClosed(data.event?.attendanceClosed ?? false);
      setAttendanceModalFinalized(data.event?.attendanceFinalized ?? false);
      const current = (data.attendance || []) as { playerId: string; attended: boolean; absenceReason?: string }[];
      const byPlayer = Object.fromEntries(current.map((a) => [a.playerId, a]));
      setAttendanceData(
        players.map((p) => {
          const a = byPlayer[p.id];
          return { playerId: p.id, attended: a?.attended ?? false, absenceReason: a?.absenceReason };
        })
      );
    } else {
      setAttendanceData(players.map((p) => ({ playerId: p.id, attended: false, absenceReason: undefined })));
    }
  };

  const saveAttendance = async () => {
    if (!attendanceModal || !teamId || !token) return;
    const ok = await confirm({ message: 'Finálně odeslat docházku? Zakliknutí hráči skutečně přišli. Po odeslání již nelze měnit.', variant: 'danger' });
    if (!ok) return;
    setAttendanceSaving(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/events/${attendanceModal.id}/attendance`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({
          attendance: attendanceData.map((a) => ({
            playerId: a.playerId,
            attended: a.attended,
            absenceReason: a.attended ? undefined : a.absenceReason,
          })),
        }),
      });
      if (res.ok) {
        setAttendanceModal(null);
        fetchAttendanceStats();
        fetchEventAttendanceSummary();
      } else {
        const d = await res.json();
        toast.error(d.error || 'Chyba');
      }
    } finally {
      setAttendanceSaving(false);
    }
  };

  const toggleAttendance = (playerId: string) => {
    setAttendanceData((prev) =>
      prev.map((a) =>
        a.playerId === playerId
          ? { ...a, attended: !a.attended, absenceReason: a.attended ? undefined : a.absenceReason }
          : a
      )
    );
  };

  const deleteEvent = async (eventId: string) => {
    const ok = await confirm({ message: 'Opravdu smazat událost?', variant: 'danger' });
    if (!ok) return;
    const res = await fetch(`/api/teams/${teamId}/events/${eventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await fetchEvents();
      await fetchAttendanceStats();
    }
  };

  const handleAddPlayerPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (addPlayerRawSrc) URL.revokeObjectURL(addPlayerRawSrc);
    setAddPlayerRawSrc(URL.createObjectURL(file));
    setAddPlayerCrop({ x: 0, y: 0 });
    setAddPlayerZoom(1);
    setAddPlayerCroppedArea(null);
    setAddPlayerCropMode(true);
    e.target.value = '';
  };

  const handleAddPlayerCropConfirm = async () => {
    if (!addPlayerRawSrc || !addPlayerCroppedArea) return;
    const croppedBlob = await getCroppedImage(addPlayerRawSrc, addPlayerCroppedArea);
    const croppedFile = new File([croppedBlob], 'photo.jpg', { type: 'image/jpeg' });
    if (addPlayerPhotoPreview) URL.revokeObjectURL(addPlayerPhotoPreview);
    setAddPlayerPhoto(croppedFile);
    setAddPlayerPhotoPreview(URL.createObjectURL(croppedBlob));
    URL.revokeObjectURL(addPlayerRawSrc);
    setAddPlayerRawSrc(null);
    setAddPlayerCropMode(false);
  };

  const handleAddPlayerCropCancel = () => {
    if (addPlayerRawSrc) URL.revokeObjectURL(addPlayerRawSrc);
    setAddPlayerRawSrc(null);
    setAddPlayerCropMode(false);
  };

  const clearAddPlayerPhoto = () => {
    if (addPlayerPhotoPreview) URL.revokeObjectURL(addPlayerPhotoPreview);
    if (addPlayerRawSrc) URL.revokeObjectURL(addPlayerRawSrc);
    setAddPlayerPhoto(null);
    setAddPlayerPhotoPreview(null);
    setAddPlayerRawSrc(null);
    setAddPlayerCropMode(false);
  };

  const addPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim() || !teamId || !token) return;
    const jerseyNumber = newPlayerJerseyNumber.trim() ? Number(newPlayerJerseyNumber.trim()) : null;
    if (jerseyNumber != null && (!Number.isInteger(jerseyNumber) || jerseyNumber < 1 || jerseyNumber > 99)) {
      toast.warning('Číslo dresu musí být celé číslo (1-99).');
      return;
    }
    setAddingPlayer(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/players`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ name: newPlayerName.trim(), jerseyNumber }),
      });
      if (res.ok) {
        const { player: newPlayer } = await res.json();
        // Upload photo if selected
        if (addPlayerPhoto && newPlayer?.id) {
          try {
            const resized = await resizeImageFile(addPlayerPhoto);
            const fd = new FormData();
            fd.append('photo', resized, 'photo.jpg');
            await fetch(`/api/teams/${teamId}/players/${newPlayer.id}/photo`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: fd,
            });
          } catch {
            toast.warning('Hráč vytvořen, ale fotka se nepodařila nahrát.');
          }
        }
        setNewPlayerName('');
        setNewPlayerJerseyNumber('');
        clearAddPlayerPhoto();
        setShowAddPlayerModal(false);
        await fetchPlayers();
      } else {
        const d = await res.json();
        toast.error(d.error || 'Chyba');
      }
    } finally {
      setAddingPlayer(false);
    }
  };

  const savePlayerJerseyNumber = async (playerId: string) => {
    if (!teamId || !token) return;
    const raw = (playerJerseyInputs[playerId] || '').trim();
    const parsedNumber = raw ? Number(raw) : null;
    const hasValidNumber =
      parsedNumber != null && Number.isInteger(parsedNumber) && parsedNumber >= 1 && parsedNumber <= 99;
    if (raw && !hasValidNumber) {
      setPlayerJerseyFeedback('error:Číslo dresu musí být celé číslo v rozsahu 1-99.');
      setTimeout(() => setPlayerJerseyFeedback(null), 3000);
      return;
    }
    const jerseyNumber = hasValidNumber ? parsedNumber : null;
    setSavingPlayerJerseyId(playerId);
    try {
      const res = await fetch(`/api/teams/${teamId}/players/${playerId}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ jerseyNumber }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        await fetchPlayers();
        setPlayerJerseyFeedback('success:Číslo dresu bylo uloženo.');
      } else {
        setPlayerJerseyFeedback(`error:${d.error || 'Nepodařilo se uložit číslo dresu.'}`);
      }
      setTimeout(() => setPlayerJerseyFeedback(null), 3000);
    } finally {
      setSavingPlayerJerseyId(null);
    }
  };

  const setCoach = async (playerId: string | null) => {
    if (!teamId || !token) return;
    setSavingCoach(true);
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ coachPlayerId: playerId || null }),
      });
      if (res.ok) {
        setCoachPlayerId(playerId);
        await fetchLeaderboard();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || 'Chyba při aktualizaci');
      }
    } finally {
      setSavingCoach(false);
    }
  };

  const deletePlayer = (playerId: string, playerName: string) => {
    setDeleteConfirm({ playerId, playerName });
  };

  const confirmDeletePlayer = async () => {
    if (!deleteConfirm || !teamId || !token) return;
    const { playerId } = deleteConfirm;
    setDeleteConfirm(null);
    const res = await fetch(`/api/teams/${teamId}/players/${playerId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      await fetchPlayers();
      if (playerId === coachPlayerId) {
        setCoachPlayerId(null);
        fetch(`/api/teams/${teamId}`, { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.ok && r.json())
          .then((d) => d?.team && setCoachPlayerId(d.team.coachPlayerId ?? null))
          .catch(() => {});
      }
      setDeleteFeedback('success:Hráč byl odstraněn.');
      setTimeout(() => setDeleteFeedback(null), 3000);
    } else {
      setDeleteFeedback('error:Chyba při mazání hráče.');
      setTimeout(() => setDeleteFeedback(null), 3000);
    }
  };

  const addMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatchDate || !teamId || !token) {
      toast.warning('Chybí datum nebo nejste přihlášeni.');
      return;
    }
    const time = newMatchStartTime.trim();
    if (!time || !/^\d{1,2}:\d{2}$/.test(time)) {
      toast.warning('Vyplňte čas začátku zápasu.');
      return;
    }
    setAddingMatch(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/matches`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          date: newMatchDate,
          opponent: newMatchOpponent.trim() || undefined,
          startTime: time,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setNewMatchDate('');
        setNewMatchStartTime('');
        setNewMatchOpponent('');
        await fetchMatches();
      } else {
        let msg = d.error || `Chyba (${res.status})`;
        if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('tabulk')) {
          msg += '\n\nMožná chybí tabulka matches. Spusťte v Supabase SQL Editoru skript scripts/setup-player-voting.sql';
        }
        toast.error(msg);
      }
    } catch (err) {
      toast.error('Chyba při odesílání: ' + (err instanceof Error ? err.message : 'Neznámá chyba'));
    } finally {
      setAddingMatch(false);
    }
  };

  const handleIcsFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.ics') && file.type !== 'text/calendar') {
      setIcsFeedback('error:Vyberte prosím soubor .ics (kalendář).');
      return;
    }

    setIcsParsing(true);
    setIcsFeedback(null);
    try {
      const content = await file.text();
      const parsed = parseIcsImportCandidates(content, icsClubFilter);
      setIcsPanelOpen(true);
      setIcsCandidates(parsed.candidates);
      setIcsPreviewOpen(parsed.candidates.length > 0);
      setIcsFeedback(
        `success:Načteno ${parsed.candidates.length} zápasů z ${parsed.totalEvents} událostí` +
          (icsClubFilter.trim() ? ` (filtr: "${icsClubFilter.trim()}")` : '') +
          `. Odpovídajících událostí: ${parsed.matchingEvents}.` +
          (parsed.skippedWithoutTime > 0 ? ` Přeskočeno bez času: ${parsed.skippedWithoutTime}.` : '')
      );
      if (icsFileInputRef.current) icsFileInputRef.current.value = '';
    } catch {
      setIcsFeedback('error:Nepodařilo se načíst .ics soubor.');
    } finally {
      setIcsParsing(false);
    }
  };

  const toggleIcsCandidate = (uid: string) => {
    setIcsCandidates((prev) => prev.map((item) => (item.uid === uid ? { ...item, selected: !item.selected } : item)));
  };

  const setAllIcsCandidates = (selected: boolean) => {
    setIcsCandidates((prev) => prev.map((item) => ({ ...item, selected })));
  };

  const resetIcsImportSession = ({ keepFeedback = false }: { keepFeedback?: boolean } = {}) => {
    setIcsCandidates([]);
    setIcsPreviewOpen(false);
    if (!keepFeedback) setIcsFeedback(null);
    if (icsFileInputRef.current) icsFileInputRef.current.value = '';
  };

  const importSelectedIcsMatches = async () => {
    if (!teamId || !token) return;
    const selected = icsCandidates.filter((item) => item.selected);
    if (selected.length === 0) {
      setIcsFeedback('error:Vyberte alespoň jeden zápas k importu.');
      return;
    }

    setIcsImporting(true);
    setIcsFeedback(null);
    try {
      const existing = new Set(
        matches.map((m) => `${m.date}|${(m.startTime || '').trim()}|${(m.opponent || '').trim().toLowerCase()}`)
      );
      let created = 0;
      let skipped = 0;
      let failed = 0;
      const createdKeys: string[] = [];

      for (const candidate of selected) {
        const key = `${candidate.date}|${candidate.startTime}|${candidate.opponent.trim().toLowerCase()}`;
        if (existing.has(key)) {
          skipped += 1;
          continue;
        }
        const res = await fetch(`/api/teams/${teamId}/matches`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({
            date: candidate.date,
            startTime: candidate.startTime,
            opponent: candidate.opponent || undefined,
          }),
        });
        if (res.ok) {
          created += 1;
          existing.add(key);
          createdKeys.push(key);
        } else {
          failed += 1;
        }
      }

      const latestMatches = await fetchMatches();
      if (importAnimationTimeoutRef.current) {
        clearTimeout(importAnimationTimeoutRef.current);
      }
      const importedIds = latestMatches
        .filter((m) => createdKeys.includes(`${m.date}|${(m.startTime || '').trim()}|${(m.opponent || '').trim().toLowerCase()}`))
        .map((m) => m.id);
      setRecentlyImportedMatchIds(importedIds);
      if (importedIds.length > 0) {
        importAnimationTimeoutRef.current = setTimeout(() => {
          setRecentlyImportedMatchIds([]);
        }, 2200);
      }
      resetIcsImportSession({ keepFeedback: true });
      setIcsPanelOpen(false);
      setIcsFeedback(`success:Import hotov. Přidáno: ${created}, přeskočeno (duplicitní): ${skipped}, chyby: ${failed}.`);
    } finally {
      setIcsImporting(false);
    }
  };


  // --- PSMF import handlers ---

  /** Search for teams by club name */
  const handlePsmfSearch = async () => {
    const name = psmfClubName.trim();
    if (name.length < 2) {
      setPsmfFeedback('error:Zadejte alespoň 2 znaky názvu klubu.');
      return;
    }
    setPsmfSearching(true);
    setPsmfFeedback(null);
    setPsmfSearchResults([]);
    setPsmfSelectedTeam(null);
    setPsmfCandidates([]);
    setPsmfPreviewOpen(false);
    try {
      const res = await fetch('/api/psmf-search', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPsmfFeedback(`error:${data.error || 'Nepodařilo se vyhledat týmy.'}`);
        return;
      }
      const teams = data.teams || [];
      if (teams.length === 0) {
        setPsmfFeedback('error:Žádný tým nebyl nalezen. Zkuste jiný název.');
        return;
      }
      setPsmfSearchResults(teams);
      if (teams.length === 1) {
        // Auto-select if exactly one result
        handlePsmfSelectTeam(teams[0]);
      } else {
        setPsmfFeedback(`success:Nalezeno ${data.total} týmů. Vyberte svůj tým.`);
      }
    } catch {
      setPsmfFeedback('error:Chyba při komunikaci se serverem.');
    } finally {
      setPsmfSearching(false);
    }
  };

  /** Select a team and load its match schedule */
  const handlePsmfSelectTeam = async (team: { name: string; slug: string; division: string; url: string }) => {
    setPsmfSelectedTeam({ name: team.name, url: team.url });
    setPsmfSearchResults([]);
    setPsmfParsing(true);
    setPsmfFeedback(null);
    try {
      const res = await fetch('/api/psmf-scrape', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ url: team.url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPsmfFeedback(`error:${data.error || 'Nepodařilo se načíst rozpis.'}`);
        return;
      }
      const candidates: PsmfImportCandidate[] = ((data.matches || []) as Omit<PsmfImportCandidate, 'selected'>[]).map((m) => ({
        ...m,
        selected: true,
      }));
      setPsmfCandidates(candidates);
      setPsmfPreviewOpen(candidates.length > 0);
      setPsmfFeedback(`success:${team.name} — načteno ${candidates.length} zápasů.`);
    } catch {
      setPsmfFeedback('error:Chyba při komunikaci se serverem.');
    } finally {
      setPsmfParsing(false);
    }
  };

  const togglePsmfCandidate = (uid: string) => {
    setPsmfCandidates((prev) => prev.map((item) => (item.uid === uid ? { ...item, selected: !item.selected } : item)));
  };

  const setAllPsmfCandidates = (selected: boolean) => {
    setPsmfCandidates((prev) => prev.map((item) => ({ ...item, selected })));
  };

  const resetPsmfImportSession = ({ keepFeedback = false }: { keepFeedback?: boolean } = {}) => {
    setPsmfCandidates([]);
    setPsmfPreviewOpen(false);
    if (!keepFeedback) setPsmfFeedback(null);
  };

  const importSelectedPsmfMatches = async () => {
    if (!teamId || !token) return;
    const selected = psmfCandidates.filter((item) => item.selected);
    if (selected.length === 0) {
      setPsmfFeedback('error:Vyberte alespoň jeden zápas k importu.');
      return;
    }
    setPsmfImporting(true);
    setPsmfFeedback(null);
    try {
      const existingMatches = new Set(
        matches.map((m) => `${m.date}|${(m.startTime || '').trim()}|${(m.opponent || '').trim().toLowerCase()}`)
      );
      const existingEvents = new Set(
        events.map((e) => `${e.date}|${(e.startTime || '').trim()}|${(e.opponent || '').trim().toLowerCase()}`)
      );
      let created = 0;
      let eventsCreated = 0;
      let skipped = 0;
      let failed = 0;
      const createdKeys: string[] = [];

      for (const candidate of selected) {
        const key = `${candidate.date}|${candidate.startTime}|${candidate.opponent.trim().toLowerCase()}`;
        if (existingMatches.has(key)) {
          skipped += 1;
          continue;
        }
        const venueInfo = candidate.venueName || candidate.venueAbbrev || undefined;
        const res = await fetch(`/api/teams/${teamId}/matches`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({
            date: candidate.date,
            startTime: candidate.startTime,
            opponent: candidate.opponent || undefined,
            name: venueInfo,
          }),
        });
        if (res.ok) {
          created += 1;
          existingMatches.add(key);
          createdKeys.push(key);

          // Automaticky vytvořit i událost v kalendáři (pokud ještě neexistuje)
          if (!existingEvents.has(key)) {
            const evRes = await fetch(`/api/teams/${teamId}/events`, {
              method: 'POST',
              headers: headers(),
              body: JSON.stringify({
                date: candidate.date,
                startTime: candidate.startTime,
                eventType: 'competitive_match',
                location: venueInfo || 'psmf.cz',
                opponent: candidate.opponent || undefined,
                note: `Kolo ${candidate.round} – Hanspaulská liga`,
              }),
            });
            if (evRes.ok) {
              eventsCreated += 1;
              existingEvents.add(key);
            }
          }
        } else {
          failed += 1;
        }
      }

      const latestMatches = await fetchMatches();
      await fetchEvents();
      if (importAnimationTimeoutRef.current) {
        clearTimeout(importAnimationTimeoutRef.current);
      }
      const importedIds = latestMatches
        .filter((m) => createdKeys.includes(`${m.date}|${(m.startTime || '').trim()}|${(m.opponent || '').trim().toLowerCase()}`))
        .map((m) => m.id);
      setRecentlyImportedMatchIds(importedIds);
      if (importedIds.length > 0) {
        importAnimationTimeoutRef.current = setTimeout(() => {
          setRecentlyImportedMatchIds([]);
        }, 2200);
      }
      resetPsmfImportSession({ keepFeedback: true });
      setPsmfPanelOpen(false);
      setPsmfFeedback(`success:Import hotov. Přidáno: ${created} zápasů + ${eventsCreated} událostí, přeskočeno: ${skipped}, chyby: ${failed}.`);
    } finally {
      setPsmfImporting(false);
    }
  };

  const deleteMatch = async (matchId: string) => {
    const ok = await confirm({ message: 'Opravdu smazat zápas?', variant: 'danger' });
    if (!ok) return;
    const res = await fetch(`/api/teams/${teamId}/matches/${matchId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      if (matchPopup?.id === matchId) setMatchPopup(null);
      await fetchMatches();
    }
  };

  const deleteAllMatches = async (scope: 'all' | 'season') => {
    if (!teamId || !token) return;
    const targetMatches = scope === 'all' ? matches : filteredMatches;
    if (targetMatches.length === 0) {
      toast.info(scope === 'all' ? 'Není co mazat.' : 'Ve vybrané sezóně nejsou žádné zápasy.');
      return;
    }
    const seasonLabel = selectedSeason === '__all__' ? 'všechny sezóny' : `sezónu ${selectedSeason}`;
    const prompt =
      scope === 'all'
        ? `Opravdu smazat všechny zápasy (${targetMatches.length})?`
        : `Opravdu smazat všechny zápasy pro ${seasonLabel} (${targetMatches.length})?`;
    const ok = await confirm({ message: prompt, title: 'Smazat zápasy', confirmLabel: 'Smazat', variant: 'danger' });
    if (!ok) return;

    setDeletingMatches(true);
    try {
      const results = await Promise.allSettled(
        targetMatches.map((m) =>
          fetch(`/api/teams/${teamId}/matches/${m.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      const failed = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok)).length;
      await fetchMatches();
      if (failed > 0) {
        toast.warning(`Nepodařilo se smazat ${failed} zápasů.`);
      } else {
        toast.success('Zápasy byly smazány.');
      }
    } finally {
      setDeletingMatches(false);
    }
  };

  const otherPlayers = voterId ? players.filter((p) => p.id !== voterId && p.id !== coachPlayerId) : [];

  useEffect(() => {
    if (!teamId || !token || !voterId || !matchId) {
      setHasVoted(null);
      return;
    }
    fetch(`/api/teams/${teamId}/ratings/check?matchId=${matchId}&voterPlayerId=${voterId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: { hasVoted?: boolean }) => setHasVoted(d?.hasVoted ?? false))
      .catch(() => setHasVoted(false));
  }, [teamId, token, voterId, matchId]);

  useEffect(() => {
    setCurrentPlayerIndex(0);
    if (otherPlayers.length === 0) {
      setScores({});
      return;
    }
    const next: Record<string, number> = {};
    otherPlayers.forEach((p) => {
      next[p.id] = 0; // výchozí: nebyl nasazen
    });
    setScores(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voterId, players.length]);

  const allRated = otherPlayers.every((p) => {
    const s = scores[p.id];
    return s >= 0 && s <= 10;
  });
  const canSubmit = voterId && matchId && otherPlayers.length > 0 && allRated && !hasVoted;

  const submitVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !token) return;
    if (!voterId || !matchId) {
      setShowVoteValidation(true);
      toast.warning('Zvolte hlasujícího a vyberte zápas.');
      return;
    }
    if (!canSubmit) return;
    const ok = await confirm({ message: 'Jste si jistí, že jste ohodnotil všechny hrající hráče? Po odeslání nelze hodnocení měnit.', title: 'Odeslat hodnocení', variant: 'default' });
    if (!ok) return;
    setShowVoteValidation(false);
    setSubmitting(true);
    try {
      const ratings = otherPlayers.map((p) => ({
        ratedPlayerId: p.id,
        percentage: scores[p.id] ?? 0,
      }));
      const res = await fetch(`/api/teams/${teamId}/ratings`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ matchId, voterPlayerId: voterId, ratings }),
      });
      if (res.ok) {
        setVoterId('');
        setMatchId('');
        setScores({});
        setVoteSubmittedSuccess(true);
        fetchLeaderboard();
        setTimeout(() => setVoteSubmittedSuccess(false), 5000);
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || 'Chyba při odesílání');
      }
    } catch (err) {
      console.error('Chyba při odesílání hodnocení:', err);
      toast.error('Chyba připojení. Zkuste to znovu.');
    } finally {
      setSubmitting(false);
    }
  };

  const sortedOverview = [...overviewLayout].sort((a, b) => a.order - b.order);
  const sortedOverviewDraft = [...overviewDraft].sort((a, b) => a.order - b.order);
  const activeOverview = overviewEditMode ? sortedOverviewDraft : sortedOverview;
  const visibleOverview = activeOverview.filter((c) => c.visible);

  const setOverviewDraftWithNormalize = (next: OverviewCardLayoutItem[]) => {
    setOverviewDraft(normalizeOverviewLayout({ version: 1, cards: next }).cards);
  };

  const handleOverviewReorder = (nextVisible: OverviewCardLayoutItem[]) => {
    if (!overviewEditMode) return;
    setOverviewDraft((prev) => {
      const hidden = [...prev].sort((a, b) => a.order - b.order).filter((c) => !c.visible);
      const merged = [...nextVisible.map((c) => ({ ...c, visible: true })), ...hidden];
      return merged.map((c, index) => ({ ...c, order: index }));
    });
  };

  const handleOverviewSizeChange = (id: OverviewCardId, size: OverviewCardSize) => {
    setOverviewDraft((prev) => prev.map((c) => (c.id === id ? { ...c, size } : c)));
  };

  const handleOverviewToggleVisibility = (id: OverviewCardId) => {
    setOverviewDraft((prev) => prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)));
  };

  const saveOverviewLayout = async () => {
    if (!teamId || !token) return;
    setSavingOverviewLayout(true);
    try {
      const payload = toOverviewPayload(overviewDraft);
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ overviewLayout: payload }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d?.error || 'Nepodařilo se uložit rozložení');
        return;
      }
      setOverviewLayout(payload.cards);
      setOverviewDraft(payload.cards);
      setOverviewEditMode(false);
    } finally {
      setSavingOverviewLayout(false);
    }
  };

  const cancelOverviewEdit = () => {
    setOverviewDraft(sortedOverview);
    setOverviewEditMode(false);
  };

  if (loading || !teamId) {
    return (
      <div className="min-h-screen py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
        <GhostHodnoceni />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8 relative"
      style={teamBackgroundColor ? { background: teamBackgroundColor } : undefined}
    >
      {/* Match Result Popup */}
      <AnimatePresence>
        {matchPopup && (
          <MatchResultPopup
            match={matchPopup}
            teamId={teamId!}
            token={token!}
            teamLabel={teamName || 'Náš tým'}
            opponentLabel={matchPopup.opponent || 'Soupeř'}
            players={players}
            onSaved={fetchMatches}
            onClose={() => setMatchPopup(null)}
          />
        )}
      </AnimatePresence>

      {/* Modální okno pro potvrzení mazání hráče */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="glass-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-border" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-2">Odstranit hráče</h3>
            <p className="text-foreground/80 mb-6">
              Opravdu odstranit hráče „{deleteConfirm.playerName}"?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-5 py-3 rounded-xl bg-surface-hover text-foreground hover:bg-white/20 transition-colors font-medium whitespace-nowrap"
              >
                Ne, zrušit
              </button>
              <button
                type="button"
                onClick={confirmDeletePlayer}
                className="flex-1 px-5 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors whitespace-nowrap"
              >
                Ano, smazat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hláška po smazání */}
      {deleteFeedback && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl text-white font-medium shadow-lg border border-border whitespace-nowrap ${
            deleteFeedback.startsWith('success:') ? 'bg-green-600/95' : 'bg-red-600/95'
          }`}
        >
          {deleteFeedback.replace(/^(success|error):/, '')}
        </div>
      )}

      <div className="fixed top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-9 h-9 sm:w-10 sm:h-10 glass-card text-foreground/90 rounded-xl border border-border hover:bg-surface flex items-center justify-center"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <Link href="/" className="text-lg font-bold tracking-tight text-foreground">
            My<span className="text-foreground">Pitch</span>
          </Link>
        </div>
        <ThemeToggle />
      </div>

      <MotionPage className="w-full max-w-7xl mx-auto relative z-10 pt-12 sm:pt-14">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-4 sm:mb-6">Týmová zóna</h1>

        <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1 -mx-1 flex-nowrap sm:flex-wrap">
          {DEFAULT_TAB_ORDER.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`shrink-0 px-3 py-2 sm:px-4 rounded-xl font-medium transition-all text-sm sm:text-base ${
                tab === t
                  ? 'bg-blue-500/30 text-foreground border border-blue-400/50'
                  : 'bg-surface text-foreground/70 hover:bg-surface-hover border border-border'
              }`}
            >
              {tabLabel(t)}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-foreground/65">
                Nastavte si pořadí a velikost boxů podle toho, co chcete vidět jako první.
              </p>
              {overviewEditMode ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelOverviewEdit}
                    disabled={savingOverviewLayout}
                    className="px-3 py-1.5 text-sm rounded-lg bg-surface-hover text-foreground border border-border disabled:opacity-60"
                  >
                    Zrušit
                  </button>
                  <button
                    type="button"
                    onClick={saveOverviewLayout}
                    disabled={savingOverviewLayout}
                    className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-60"
                  >
                    {savingOverviewLayout ? 'Ukládám...' : 'Uložit'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setOverviewDraft(sortedOverview);
                    setOverviewEditMode(true);
                  }}
                  className="text-xs sm:text-sm text-foreground/60 hover:text-foreground underline underline-offset-4 decoration-border/70 hover:decoration-foreground/60 transition-colors"
                >
                  Upravit přehled
                </button>
              )}
            </div>

            {overviewEditMode && (
              <div className="glass-card rounded-xl p-3 border border-border">
                <p className="text-sm text-foreground/70 mb-2">Zobrazené boxy</p>
                <div className="flex flex-wrap gap-2">
                  {sortedOverviewDraft.map((item) => (
                    <button
                      key={`toggle-${item.id}`}
                      type="button"
                      onClick={() => handleOverviewToggleVisibility(item.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
                        item.visible
                          ? 'bg-blue-500/20 border-blue-400/40 text-foreground'
                          : 'bg-surface border-border text-foreground/60'
                      }`}
                    >
                      {item.visible ? '✓' : '○'} {overviewCardLabel(item.id)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {dashboardCardsLoading || !initialDataReady ? (
              <OverviewProgressLoader progress={loadingProgress} onNearComplete={() => setDashboardCardsLoading(false)} />
            ) : (
              <Reorder.Group
                axis="y"
                values={visibleOverview}
                onReorder={handleOverviewReorder}
                className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6"
              >
                    {visibleOverview.map((layoutItem) => {
                      if (layoutItem.id === 'lastMatch') {
                        const today = new Date().toISOString().slice(0, 10);
                        const pastMatches = matches.filter((m) => m.date < today).sort((a, b) => b.date.localeCompare(a.date));
                        const lastMatch = pastMatches[0];
                        const nextMatch = matches.filter((m) => m.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
                        if (!lastMatch && !nextMatch) return null;
                        const scoreStr = lastMatch
                          ? (lastMatch.goalsFor != null && lastMatch.goalsAgainst != null
                            ? `${teamName || 'Náš tým'} ${lastMatch.goalsFor} : ${lastMatch.goalsAgainst} ${lastMatch.opponent || 'Soupeř'}`
                            : lastMatch.result || '—')
                          : '';
                        const pom = lastMatch?.playerOfMatch;
                        return (
                          <SortableOverviewCard
                            key={layoutItem.id}
                            item={layoutItem}
                            editMode={overviewEditMode}
                            onToggleVisibility={handleOverviewToggleVisibility}
                            onSizeChange={handleOverviewSizeChange}
                          >
                            <div className="glass-card group relative overflow-visible rounded-2xl p-4 sm:p-6 lg:pr-44 xl:pr-56 border border-amber-500/30 bg-amber-500/5">
                              <div className="relative z-10 flex flex-wrap items-start gap-x-6 gap-y-2">
                                {lastMatch && (
                                  <div className="space-y-1">
                                    <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Poslední zápas</h2>
                                    <p className="text-foreground font-medium">
                                      {formatEventDateTime(lastMatch.date, lastMatch.startTime)} vs {lastMatch.opponent || 'soupeř'}
                                    </p>
                                    <p className="text-[#1f3768] dark:text-accent font-semibold text-lg">{scoreStr}</p>
                                    {pom && (
                                      <p className="text-amber-400 font-medium flex items-center gap-1.5 mt-2">
                                        <span aria-hidden>⭐</span> Hráč utkání: {pom.playerName}
                                      </p>
                                    )}
                                  </div>
                                )}
                                {nextMatch && (
                                  <div className={`space-y-1 ${lastMatch ? 'border-l-2 border-white/25 pl-6' : ''}`}>
                                    <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Příští zápas</h2>
                                    <p className="text-foreground font-medium">
                                      {formatEventDateTime(nextMatch.date, nextMatch.startTime)} vs {nextMatch.opponent || 'soupeř'}
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="hidden lg:block absolute right-[-24px] bottom-0 w-[220px] xl:w-[250px] h-[185px] xl:h-[205px] overflow-hidden pointer-events-none z-20">
                                <img
                                  src="/images/player_image.png"
                                  alt=""
                                  aria-hidden="true"
                                  className="w-full h-[145%] object-cover object-top drop-shadow-[0_14px_28px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out group-hover:scale-[1.08] group-hover:-translate-x-2"
                                />
                              </div>
                            </div>
                          </SortableOverviewCard>
                        );
                      }

                      if (layoutItem.id === 'upcomingEvents') {
                        const today = new Date().toISOString().slice(0, 10);
                        const upcomingEvents = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
                        const upcomingMatches = matches.filter((m) => m.date >= today).sort((a, b) => a.date.localeCompare(b.date));
                        const hasUpcoming = upcomingEvents.length > 0 || upcomingMatches.length > 0;

                        return (
                          <SortableOverviewCard
                            key={layoutItem.id}
                            item={layoutItem}
                            editMode={overviewEditMode}
                            onToggleVisibility={handleOverviewToggleVisibility}
                            onSizeChange={handleOverviewSizeChange}
                          >
                            <div className="glass-card rounded-2xl p-4 sm:p-6">
                              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Následující události</h2>
                              {!hasUpcoming ? (
                                <p className="text-foreground/50 italic">Zatím žádné nadcházející události ani zápasy.</p>
                              ) : (
                                <div className="space-y-4">
                                  {upcomingEvents.length > 0 && (
                                    <div>
                                      {upcomingEvents.slice(0, 5).map((ev) => {
                                        const sum = eventAttendanceSummary[ev.id];
                                        return (
                                          <div
                                            key={ev.id}
                                            className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 px-3 rounded-lg bg-surface border border-border mb-2 gap-2"
                                          >
                                            <div className="min-w-0">
                                              <div className="text-foreground text-sm sm:text-base font-medium truncate" title={`${formatEventDateTime(ev.date, ev.startTime)} – ${EVENT_TYPE_LABELS[ev.eventType] || ev.eventType}`}>
                                                {formatEventDateTime(ev.date, ev.startTime)} – {EVENT_TYPE_LABELS[ev.eventType] || ev.eventType}
                                              </div>
                                              {ev.location && (
                                                <a
                                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.location)}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="block text-foreground/60 text-xs sm:text-sm truncate hover:text-foreground/80 hover:underline"
                                                  title={ev.location}
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  📍 {ev.location}
                                                </a>
                                              )}
                                              {ev.opponent && ev.opponent !== ev.location && (
                                                <div className="text-blue-400 text-sm sm:text-base truncate" title={ev.opponent}>
                                                  ⚽ vs {ev.opponent}
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                              {sum && (
                                                <span className="text-foreground/60 text-xs tabular-nums whitespace-nowrap" title="zúčastní • nezúčastní • neodpověděli">
                                                  {sum.attended}✓ {sum.notAttended}✗ {sum.noResponse}?
                                                </span>
                                              )}
                                              <button
                                                type="button"
                                                onClick={() => openUcastModal(ev)}
                                                className="text-blue-400 hover:text-blue-300 text-sm"
                                                title="Odkaz pro hráče + přehled, kdo se hlásí (do hodiny před událostí)"
                                              >
                                                Účast ano/ne
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {upcomingEvents.length > 5 && (
                                        <button
                                          type="button"
                                          onClick={() => setTab('calendar')}
                                          className="text-foreground/60 hover:text-foreground text-sm mt-2"
                                        >
                                          Zobrazit všech {upcomingEvents.length} událostí →
                                        </button>
                                      )}
                                    </div>
                                  )}
                                  {upcomingMatches.length > 0 && (
                                    <div>
                                      <h3 className="text-foreground/70 text-sm font-medium mb-2">Zápasy</h3>
                                      {(showAllUpcomingMatches ? upcomingMatches : upcomingMatches.slice(0, 3)).map((m) => (
                                        <div
                                          key={m.id}
                                          className="py-2 px-3 rounded-lg bg-surface border border-border mb-2 text-foreground"
                                        >
                                          {formatEventDateTime(m.date, m.startTime)} vs {m.opponent || 'soupeř'}
                                        </div>
                                      ))}
                                      {upcomingMatches.length > 3 && (
                                        <button
                                          type="button"
                                          onClick={() => setShowAllUpcomingMatches(p => !p)}
                                          className="text-foreground/50 hover:text-foreground text-sm mt-1 transition-colors"
                                        >
                                          {showAllUpcomingMatches ? 'Zobrazit méně ↑' : `+ ${upcomingMatches.length - 3} dalších`}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </SortableOverviewCard>
                        );
                      }

                      const withData = attendanceStats.filter((s) => s.trainingCount > 0 || s.matchCount > 0);
                      const avgAttendance = withData.length > 0
                        ? withData.reduce((a, s) => a + s.attendancePct, 0) / withData.length
                        : 0;
                      const withMatches = withData.filter((s) => s.matchCount > 0);
                      const avgScore = withMatches.length > 0
                        ? withMatches.reduce((a, s) => a + s.avgMatchScore, 0) / withMatches.length
                        : 0;
                      const formScore = Math.round((avgAttendance / 100) * 50 + (avgScore / 10) * 50);
                      const recentMatches = matches
                        .filter((m) => m.date <= new Date().toISOString().slice(0, 10))
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .slice(0, 5);
                      const matchesWithScore = recentMatches.filter((m) => m.goalsFor != null && m.goalsAgainst != null);
                      const wins = matchesWithScore.filter((m) => m.goalsFor! > m.goalsAgainst!).length;
                      const draws = matchesWithScore.filter((m) => m.goalsFor === m.goalsAgainst).length;
                      const losses = matchesWithScore.filter((m) => m.goalsFor! < m.goalsAgainst!).length;

                      return (
                        <SortableOverviewCard
                          key={layoutItem.id}
                          item={layoutItem}
                          editMode={overviewEditMode}
                          onToggleVisibility={handleOverviewToggleVisibility}
                          onSizeChange={handleOverviewSizeChange}
                        >
                          <div className="glass-card rounded-2xl p-4 sm:p-6">
                            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">Forma týmu a hráčů</h2>
                            <p className="text-foreground/60 text-sm mb-4">
                              Na základě účasti na tréninzích, hodnocení ze zápasů a výsledků.
                            </p>
                            {attendanceStats.length === 0 ? (
                              <p className="text-foreground/50 italic text-sm">
                                Zatím nemáte dostatek dat. Přidejte tréninky, zaznamenávejte účast a hlasujte po zápasech.
                              </p>
                            ) : (
                              <div className="space-y-6">
                                {withData.length === 0 ? (
                                  <p className="text-foreground/50 italic text-sm">Zatím žádná data pro výpočet formy.</p>
                                ) : (
                                  <div className="space-y-4">
                                    <div>
                                      <h3 className="text-foreground/80 font-medium mb-2 text-sm">Forma týmu</h3>
                                      <div className="flex gap-4 flex-wrap">
                                        <div className="flex-1 min-w-[120px]">
                                          <div className="flex justify-between text-xs mb-1">
                                            <span className="text-foreground/70">Forma</span>
                                            <span className="text-[#1f3768] dark:text-accent font-semibold">{formScore} %</span>
                                          </div>
                                          <div className="h-3 rounded-full bg-surface-hover overflow-hidden">
                                            <div
                                              className="h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-lime-400 rounded-full"
                                              style={{ width: `${Math.min(100, formScore)}%`, animation: 'bar-grow 0.8s ease-out' }}
                                            />
                                          </div>
                                        </div>
                                        {matchesWithScore.length > 0 && (
                                          <div className="text-foreground/70 text-sm">
                                            Poslední zápasy: {wins}V {draws}R {losses}P
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div>
                                      <div className="flex items-center justify-between gap-2 mb-2">
                                        <h3 className="text-foreground/80 font-medium text-sm">Forma hráčů</h3>
                                      </div>
                                      <div className={`space-y-3 ${showAllFormPlayers ? '' : 'max-h-64 overflow-y-auto'}`}>
                                        {attendanceStats
                                          .filter((s) => s.trainingCount > 0 || s.matchCount > 0)
                                          .sort((a, b) => {
                                            const fa = (a.attendancePct / 100) * 50 + (a.avgMatchScore / 10) * 50;
                                            const fb = (b.attendancePct / 100) * 50 + (b.avgMatchScore / 10) * 50;
                                            return fb - fa;
                                          })
                                          .map((s) => {
                                            const formPct = Math.round((s.attendancePct / 100) * 50 + (s.avgMatchScore / 10) * 50);
                                            return (
                                              <div key={s.playerId} className="space-y-1">
                                                <div className="flex justify-between items-center text-sm">
                                                  <span className="text-foreground font-medium">{s.playerName}</span>
                                                  <span className="text-[#1f3768] dark:text-accent tabular-nums">
                                                    {formPct}% (účast {s.attendancePct}%, zápas {s.avgMatchScore}/10)
                                                  </span>
                                                </div>
                                                <div className="h-2 rounded-full bg-surface-hover overflow-hidden">
                                                  <div
                                                    className="h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-lime-400 rounded-full"
                                                    style={{ width: `${Math.min(100, formPct)}%`, animation: 'bar-grow 0.8s ease-out' }}
                                                  />
                                                </div>
                                              </div>
                                            );
                                          })}
                                      </div>
                                      <div className="mt-4 flex justify-end">
                                        <button
                                          type="button"
                                          onClick={() => setShowAllFormPlayers((prev) => !prev)}
                                          className="text-xs px-2.5 py-1 rounded-md border border-border text-foreground/75 hover:text-foreground hover:bg-surface-hover transition-colors"
                                        >
                                          {showAllFormPlayers ? 'Sbalit seznam' : 'Zobrazit všechny hráče'}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </SortableOverviewCard>
                      );
                    })}
              </Reorder.Group>
            )}
          </div>
        )}

        {tab === 'manage' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <div className="glass-card rounded-2xl p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-foreground mb-3">Hráči týmu ({players.length})</h2>

              <>
              <div className="mb-4">
                <label className="block text-foreground/80 text-sm mb-1">Trenér (30&nbsp;% větší vliv na žebříček)</label>
                <Select
                  value={coachPlayerId ?? '__none__'}
                  onValueChange={(value) => setCoach(value === '__none__' ? null : value)}
                  disabled={savingCoach}
                >
                  <SelectTrigger className="w-full max-w-xs rounded-lg glass-input text-foreground focus:ring-2 focus:ring-blue-400 disabled:opacity-50">
                    <SelectValue placeholder="— Bez trenéra" />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Bez trenéra</SelectItem>
                    {players.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.jerseyNumber != null ? `#${p.jerseyNumber} ` : ''}{p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {savingCoach && <span className="text-foreground/50 text-sm ml-2">Ukládám...</span>}
              </div>

              <button
                type="button"
                onClick={() => setShowAddPlayerModal(true)}
                className="w-full mb-4 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Přidat hráče
              </button>
              <ul className="space-y-1">
                {players.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between py-2.5 px-2 -mx-2 border-b border-border cursor-pointer rounded-lg hover:bg-foreground/[0.04] transition-colors"
                    onClick={() => setPlayerDetailModal(p)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-border" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 text-foreground/40 text-xs font-bold">
                          {p.jerseyNumber ?? p.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-foreground truncate">
                        {p.jerseyNumber != null ? `#${p.jerseyNumber} ` : ''}{p.name}
                      </span>
                      {coachPlayerId === p.id && (
                        <span className="text-blue-400 text-xs font-medium shrink-0">(trenér)</span>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-foreground/30 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </li>
                ))}
              </ul>
              {playerJerseyFeedback && (
                <p className={`mt-3 text-xs ${playerJerseyFeedback.startsWith('error:') ? 'text-red-300' : 'text-emerald-300'}`}>
                  {playerJerseyFeedback.replace(/^(success|error):/, '')}
                </p>
              )}
              </>
            </div>

            <div className="glass-card rounded-2xl p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h2 className="text-base sm:text-lg font-semibold text-foreground">Zápasy</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={selectedSeason}
                    onValueChange={(value) => setMatchesSeason(value)}
                  >
                    <SelectTrigger className="h-9 w-[190px] rounded-lg glass-input text-foreground focus:ring-2 focus:ring-blue-400">
                      <SelectValue placeholder="Sezóna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Všechny sezóny</SelectItem>
                      {matchSeasons.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={() => deleteAllMatches('season')}
                    disabled={deletingMatches || filteredMatches.length === 0 || selectedSeason === '__all__'}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/40 text-red-300 hover:bg-red-500/15 disabled:opacity-50"
                    title={selectedSeason === '__all__' ? 'Nejprve vyberte konkrétní sezónu' : 'Smazat všechny zápasy vybrané sezóny'}
                  >
                    {deletingMatches ? 'Mažu...' : 'Smazat sezónu'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAllMatches('all')}
                    disabled={deletingMatches || matches.length === 0}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/40 text-red-300 hover:bg-red-500/15 disabled:opacity-50"
                    title="Smazat všechny zápasy napříč sezónami"
                  >
                    {deletingMatches ? 'Mažu...' : 'Smazat vše'}
                  </button>
                </div>
                {(selectedSeason !== '__all__' || matchSeasons.length > 0) && (
                  <div className="w-full">
                    <p className="text-xs text-foreground/60">
                      Zobrazeno: {selectedSeason === '__all__' ? 'všechny sezóny' : `sezóna ${selectedSeason}`} ({filteredMatches.length} zápasů)
                    </p>
                  </div>
                )}
              </div>
              <form onSubmit={addMatch} className="flex flex-col sm:flex-row gap-2 mb-4 flex-wrap">
                <DatePicker
                  value={newMatchDate}
                  onChange={setNewMatchDate}
                  required
                />
                <TimeInput
                  value={newMatchStartTime}
                  onChange={setNewMatchStartTime}
                  required
                />
                <input
                  type="text"
                  value={newMatchOpponent}
                  onChange={(e) => setNewMatchOpponent(e.target.value)}
                  placeholder="Soupeř (volitelně)"
                  className="flex-1 min-w-0 px-4 py-2 rounded-lg glass-input text-foreground placeholder-white/50"
                />
                <button type="submit" disabled={addingMatch} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium disabled:opacity-50">
                  {addingMatch ? '...' : 'Přidat zápas'}
                </button>
              </form>
              <div className="mb-4 rounded-xl border border-border bg-surface/50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">Import zápasů z rozpisu (.ics)</h3>
                    <span className="text-xs text-foreground/60">Vybere jen zápasy obsahující název klubu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!icsPanelOpen && icsCandidates.length > 0 && (
                      <span className="text-[11px] px-2 py-1 rounded-full border border-blue-400/40 text-blue-300 bg-blue-500/10">
                        Nalezeno {icsCandidates.length}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setIcsPanelOpen((prev) => !prev)}
                      aria-expanded={icsPanelOpen}
                      aria-controls="ics-import-panel"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                    >
                      Nahrát z .ics
                      <span className="text-xs">{icsPanelOpen ? '▲' : '▼'}</span>
                    </button>
                  </div>
                </div>

                {!icsPanelOpen && icsFeedback && (
                  <p className={`mt-2 text-xs ${icsFeedback.startsWith('error:') ? 'text-red-300' : 'text-emerald-300'}`}>
                    {icsFeedback.replace(/^(success|error):/, '')}
                  </p>
                )}

                <div
                  id="ics-import-panel"
                  className={`overflow-hidden transition-all duration-300 ease-out ${
                    icsPanelOpen ? 'max-h-[920px] opacity-100 mt-3 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1 pointer-events-none'
                  }`}
                >
                  <div className="space-y-3">
                    <p className="text-xs text-foreground/70">
                      Jak získat .ics: Přihlaste se do fotbal.cz, otevřete svou soutěž, přejděte na stránku <span className="font-medium">„Rozpis zápasů a výsledků"</span> a dole klikněte na <span className="font-medium">„Export do kalendáře"</span>.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={icsClubFilter}
                        onChange={(e) => setIcsClubFilter(e.target.value)}
                        placeholder="Název klubu v rozpisu (např. FC MyPitch)"
                        className="flex-1 min-w-0 px-3 py-2 rounded-lg glass-input text-foreground placeholder-white/50 text-sm"
                      />
                      <label className="px-3 py-2 rounded-lg bg-surface-hover border border-border text-foreground text-sm cursor-pointer hover:bg-surface">
                        {icsParsing ? 'Načítám...' : 'Vybrat .ics'}
                        <input
                          ref={icsFileInputRef}
                          type="file"
                          accept=".ics,text/calendar"
                          className="hidden"
                          onChange={handleIcsFileChange}
                          disabled={icsParsing}
                        />
                      </label>
                    </div>

                    {icsFeedback && (
                      <p className={`text-xs ${icsFeedback.startsWith('error:') ? 'text-red-300' : 'text-emerald-300'}`}>
                        {icsFeedback.replace(/^(success|error):/, '')}
                      </p>
                    )}

                    {icsPreviewOpen && icsCandidates.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs text-foreground/70">
                            Nalezeno {icsCandidates.length} zápasů, k importu vybráno {icsCandidates.filter((x) => x.selected).length}.
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setAllIcsCandidates(true)}
                              className="text-xs text-foreground/70 hover:text-foreground"
                            >
                              Vybrat vše
                            </button>
                            <button
                              type="button"
                              onClick={() => setAllIcsCandidates(false)}
                              className="text-xs text-foreground/70 hover:text-foreground"
                            >
                              Zrušit výběr
                            </button>
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                          {icsCandidates.map((item) => (
                            <label key={`${item.uid}-${item.date}-${item.startTime}`} className="flex items-start gap-2 px-3 py-2 border-b border-border/60 last:border-b-0 text-sm">
                              <input
                                type="checkbox"
                                checked={item.selected}
                                onChange={() => toggleIcsCandidate(item.uid)}
                                className="mt-0.5"
                              />
                              <span className="text-foreground/85">
                                <span className="font-medium">{formatEventDateTime(item.date, item.startTime)}</span>
                                <span className="text-foreground/60"> vs {item.opponent || 'Soupeř'}</span>
                                <span className="block text-xs text-foreground/50 truncate">{item.summary}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={importSelectedIcsMatches}
                            disabled={icsImporting}
                            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium"
                          >
                            {icsImporting ? 'Importuji...' : 'Importovat vybrané zápasy'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              resetIcsImportSession({ keepFeedback: true });
                              setIcsPanelOpen(false);
                            }}
                            disabled={icsImporting}
                            className="px-3 py-2 rounded-lg border border-border bg-surface hover:bg-surface-hover disabled:opacity-50 text-foreground text-sm font-medium"
                          >
                            Zrušit
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Import z psmf.cz (Hanspaulská liga) */}
              <div className="mb-4 rounded-xl border border-border bg-surface/50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">Import z psmf.cz (Hanspaulská liga)</h3>
                    <span className="text-xs text-foreground/60">Zadejte název svého klubu a načtěte rozpis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!psmfPanelOpen && psmfCandidates.length > 0 && (
                      <span className="text-[11px] px-2 py-1 rounded-full border border-blue-400/40 text-blue-300 bg-blue-500/10">
                        Nalezeno {psmfCandidates.length}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setPsmfPanelOpen((prev) => !prev)}
                      aria-expanded={psmfPanelOpen}
                      aria-controls="psmf-import-panel"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                    >
                      Načíst z psmf.cz
                      <span className="text-xs">{psmfPanelOpen ? '▲' : '▼'}</span>
                    </button>
                  </div>
                </div>

                {!psmfPanelOpen && psmfFeedback && (
                  <p className={`mt-2 text-xs ${psmfFeedback.startsWith('error:') ? 'text-red-300' : 'text-emerald-300'}`}>
                    {psmfFeedback.replace(/^(success|error):/, '')}
                  </p>
                )}

                <div
                  id="psmf-import-panel"
                  className={`overflow-hidden transition-all duration-300 ease-out ${
                    psmfPanelOpen ? 'max-h-[1200px] opacity-100 mt-3 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1 pointer-events-none'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Step 1: Club name search */}
                    {!psmfSelectedTeam && (
                      <>
                        <p className="text-xs text-foreground/70">
                          Zadejte název svého klubu v Hanspaulské lize (např. &quot;Huňáč&quot;, &quot;Dynamo&quot;, &quot;Sokol&quot;).
                          {psmfSearching && ' První hledání může trvat déle (načítá se databáze týmů).'}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={psmfClubName}
                            onChange={(e) => setPsmfClubName(e.target.value)}
                            placeholder="Název klubu..."
                            className="flex-1 min-w-0 px-3 py-2 rounded-lg glass-input text-foreground placeholder-white/50 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handlePsmfSearch();
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={handlePsmfSearch}
                            disabled={psmfSearching}
                            className="px-3 py-2 rounded-lg bg-surface-hover border border-border text-foreground text-sm hover:bg-surface disabled:opacity-50"
                          >
                            {psmfSearching ? 'Hledám...' : 'Hledat tým'}
                          </button>
                        </div>
                      </>
                    )}

                    {/* Search results — pick team */}
                    {psmfSearchResults.length > 1 && !psmfSelectedTeam && (
                      <div className="space-y-1">
                        <p className="text-xs text-foreground/70">Vyberte svůj tým:</p>
                        <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
                          {psmfSearchResults.map((t) => (
                            <button
                              key={t.slug}
                              type="button"
                              onClick={() => handlePsmfSelectTeam(t)}
                              className="w-full flex items-center justify-between px-3 py-2 border-b border-border/60 last:border-b-0 text-sm text-left hover:bg-surface-hover transition-colors"
                            >
                              <span className="font-medium text-foreground">{t.name}</span>
                              <span className="text-[11px] text-foreground/50 ml-2 shrink-0">{t.division}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Selected team indicator */}
                    {psmfSelectedTeam && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-foreground/70">Tým:</span>
                        <span className="font-medium text-foreground">{psmfSelectedTeam.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setPsmfSelectedTeam(null);
                            setPsmfCandidates([]);
                            setPsmfPreviewOpen(false);
                            setPsmfFeedback(null);
                            setPsmfSearchResults([]);
                          }}
                          className="text-xs text-foreground/50 hover:text-foreground underline ml-1"
                        >
                          změnit
                        </button>
                      </div>
                    )}

                    {/* Loading spinner */}
                    {psmfParsing && (
                      <p className="text-xs text-foreground/60">Načítám rozpis zápasů...</p>
                    )}

                    {psmfFeedback && (
                      <p className={`text-xs ${psmfFeedback.startsWith('error:') ? 'text-red-300' : 'text-emerald-300'}`}>
                        {psmfFeedback.replace(/^(success|error):/, '')}
                      </p>
                    )}

                    {/* Step 2: Match candidates */}
                    {psmfPreviewOpen && psmfCandidates.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs text-foreground/70">
                            Nalezeno {psmfCandidates.length} zápasů, k importu vybráno{' '}
                            {psmfCandidates.filter((x) => x.selected).length}.
                          </p>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setAllPsmfCandidates(true)} className="text-xs text-foreground/70 hover:text-foreground">
                              Vybrat vše
                            </button>
                            <button type="button" onClick={() => setAllPsmfCandidates(false)} className="text-xs text-foreground/70 hover:text-foreground">
                              Zrušit výběr
                            </button>
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                          {psmfCandidates.map((item) => (
                            <label key={item.uid} className="flex items-start gap-2 px-3 py-2 border-b border-border/60 last:border-b-0 text-sm">
                              <input
                                type="checkbox"
                                checked={item.selected}
                                onChange={() => togglePsmfCandidate(item.uid)}
                                className="mt-0.5"
                              />
                              <span className="text-foreground/85">
                                <span className="font-medium">{formatEventDateTime(item.date, item.startTime)}</span>
                                <span className="text-foreground/60"> vs {item.opponent || 'Soupeř'}</span>
                                {item.isHome && (
                                  <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300">doma</span>
                                )}
                                {!item.isHome && (
                                  <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-orange-500/20 text-orange-300">venku</span>
                                )}
                                <span className="block text-xs text-foreground/50 truncate">
                                  {item.venueAbbrev}
                                  {item.venueName ? ` – ${item.venueName}` : ''} | Kolo {item.round}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={importSelectedPsmfMatches}
                            disabled={psmfImporting}
                            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium"
                          >
                            {psmfImporting ? 'Importuji...' : 'Importovat vybrané zápasy'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              resetPsmfImportSession({ keepFeedback: true });
                              setPsmfPanelOpen(false);
                            }}
                            disabled={psmfImporting}
                            className="px-3 py-2 rounded-lg border border-border bg-surface hover:bg-surface-hover disabled:opacity-50 text-foreground text-sm font-medium"
                          >
                            Zrušit
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <ul className="space-y-2">
                {filteredMatches.map((m) => {
                  const hasScore = m.goalsFor != null && m.goalsAgainst != null;
                  const scoreText = hasScore ? `${m.goalsFor} : ${m.goalsAgainst}` : null;
                  const ratingInfo = m.matchRating ? MATCH_RATING_LABELS[m.matchRating] : null;
                  return (
                    <li key={m.id} className={`border-b border-border transition-all duration-500 ${recentlyImportedMatchIds.includes(m.id) ? 'match-imported-flash' : ''}`}>
                      <div
                        className="flex justify-between items-center py-2 gap-2 cursor-pointer hover:bg-surface rounded-lg -mx-1 px-1"
                        onClick={() => setMatchPopup(m)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMatchPopup(m); } }}
                      >
                        <span className="text-foreground min-w-0">
                          <span className="block">
                            {formatEventDateTime(m.date, m.startTime)}
                            {m.opponent && ` vs ${m.opponent}`}
                            {scoreText && <span className="ml-2 text-blue-400 font-semibold">{scoreText}</span>}
                          </span>
                          {(m.playerOfMatch || ratingInfo) && (
                            <span className="flex items-center gap-3 mt-0.5 pl-0">
                              {m.playerOfMatch && (
                                <span className="text-amber-400 text-sm">⭐ {m.playerOfMatch.playerName}</span>
                              )}
                              {ratingInfo && (
                                <span className="text-foreground/50 text-sm">{ratingInfo.emoji} {ratingInfo.label}</span>
                              )}
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button type="button" onClick={() => setMatchPopup(m)} className="text-blue-400 hover:text-blue-300 text-sm px-2 py-1">
                            {hasScore ? 'Upravit' : 'Vyplnit skóre'}
                          </button>
                          <button type="button" onClick={() => deleteMatch(m.id)} className="text-red-400 hover:text-red-300 text-sm">
                            Smazat
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        {tab === 'vote' && (
          <form onSubmit={submitVote}>
            <div className="flex flex-col lg:flex-row lg:gap-8 gap-4">
              {/* Left column — info & selects */}
              <div className="lg:w-72 lg:shrink-0 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">Ohodnoť spoluhráče</h2>
                  <p className="text-foreground/60 text-sm">Vyber sebe, zvol zápas a hodnoť od 0 do 10.</p>
                </div>
                <div className="space-y-3">
                  <Select
                    value={voterId || '__none__'}
                    onValueChange={(value) => {
                      setVoterId(value === '__none__' ? '' : value);
                      setShowVoteValidation(false);
                    }}
                  >
                    <SelectTrigger className={`w-full rounded-xl glass-input text-foreground focus:ring-2 focus:ring-blue-400 ${showVoteValidation && !voterId ? 'ring-2 ring-red-500 bg-red-500/20' : ''}`}>
                      <SelectValue placeholder="Kdo hlasuje?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Kdo hlasuje?</SelectItem>
                      {players.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                          {coachPlayerId === p.id ? ' (trenér)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={matchId || '__none__'}
                    onValueChange={(val) => {
                      if (val === '__add_match__') {
                        setMatchId('');
                        setTab('manage');
                      } else if (val === '__none__') {
                        setMatchId('');
                        setShowVoteValidation(false);
                      } else {
                        setMatchId(val);
                        setShowVoteValidation(false);
                      }
                    }}
                  >
                    <SelectTrigger className={`w-full rounded-xl glass-input text-foreground focus:ring-2 focus:ring-blue-400 ${showVoteValidation && !matchId ? 'ring-2 ring-red-500 bg-red-500/20' : ''}`}>
                      <SelectValue placeholder="Za který zápas?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Za který zápas?</SelectItem>
                      {playedMatches.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {formatEventDateTime(m.date, m.startTime)}
                          {m.opponent ? ` vs ${m.opponent}` : ''}
                          {(m.goalsFor != null && m.goalsAgainst != null)
                            ? ` ${m.goalsFor}:${m.goalsAgainst}`
                            : m.result
                              ? ` ${m.result}`
                              : ''}
                        </SelectItem>
                      ))}
                      {playedMatches.length === 0 && (
                        <SelectItem value="__no_played_matches__" disabled>
                          Žádný odehraný zápas s časem
                        </SelectItem>
                      )}
                      <SelectItem value="__add_match__">➕ Přidat zápas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {voteSubmittedSuccess && (
                  <div className="p-3 rounded-xl bg-accent/20 border border-accent/50 flex items-center gap-2">
                    <span className="text-[#1f3768] dark:text-accent-dark text-xl">✓</span>
                    <p className="text-[#1f3768] dark:text-accent-light font-medium text-sm">Hotovo! Tvůj hlas je v systému.</p>
                  </div>
                )}
                {hasVoted === true && matchId && (
                  <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40">
                    <p className="text-amber-200 font-medium text-sm">Už jste pro tento zápas hlasoval.</p>
                    <p className="text-foreground/70 text-xs mt-1">Hodnocení nelze měnit.</p>
                  </div>
                )}
              </div>

              {/* Right column — rating card */}
              <div className="flex-1 min-w-0">
                {(!voterId || !matchId) && hasVoted !== true && (
                  <div className="glass-card rounded-2xl p-8 flex items-center justify-center min-h-[250px] lg:min-h-[350px]">
                    <p className="text-foreground/30 text-sm">Vyber sebe a zápas pro hodnocení</p>
                  </div>
                )}

                {otherPlayers.length > 0 && voterId && matchId && hasVoted === false && (() => {
                  const currentPlayer = otherPlayers[currentPlayerIndex];
                  if (!currentPlayer) return null;
                  const val = scores[currentPlayer.id] ?? 0;
                  const isLast = currentPlayerIndex === otherPlayers.length - 1;
                  const initials = currentPlayer.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                  return (
                    <div className="space-y-6 max-w-md mx-auto">
                      {/* Progress */}
                      <div className="text-center">
                        <span className="text-foreground/40 text-sm">{currentPlayerIndex + 1} / {otherPlayers.length} hráčů</span>
                        <div className="mt-2 h-1 rounded-full bg-white/[0.08]">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${((currentPlayerIndex + 1) / otherPlayers.length) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Player Card */}
                      <div className="glass-card rounded-3xl p-6 sm:p-8 text-center">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-500/10 border-2 border-blue-500/40 flex items-center justify-center mx-auto mb-4 overflow-hidden">
                          {currentPlayer.photoUrl ? (
                            <img src={currentPlayer.photoUrl} alt={currentPlayer.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl font-bold text-blue-400">{initials}</span>
                          )}
                        </div>

                        {/* Name */}
                        <h3 className="text-xl font-bold text-foreground">{currentPlayer.name}</h3>
                        {coachPlayerId === currentPlayer.id && (
                          <span className="text-blue-400 text-xs font-medium">(trenér)</span>
                        )}

                        {/* Big rating number */}
                        <div className="mt-6 mb-2">
                          <span className="text-5xl font-bold text-blue-400 tabular-nums">{val}</span>
                          <span className="text-2xl text-foreground/30 font-light">/10</span>
                        </div>

                        {/* Emoji + label */}
                        <p className="text-foreground/50 text-sm mb-6">
                          <span className="text-2xl mr-1">{RATING_EMOJI[val]}</span> {RATING_LABELS[val]}
                        </p>

                        {/* Slider */}
                        <div className="px-2">
                          <SmoothSnapSlider
                            value={val}
                            onChange={(v) =>
                              setScores((prev) => ({
                                ...prev,
                                [currentPlayer.id]: v,
                              }))
                            }
                          />
                        </div>
                        <p className="text-foreground/30 text-xs mt-2">0 = nebyl nasazen &middot; 10 = nejlepší</p>
                      </div>

                      {/* Navigation */}
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setCurrentPlayerIndex(Math.max(0, currentPlayerIndex - 1))}
                          disabled={currentPlayerIndex === 0}
                          className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface transition-colors"
                        >
                          Zpět
                        </button>
                        {isLast ? (
                          <button
                            type="submit"
                            disabled={!canSubmit || submitting}
                            className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {submitting && <LoadingSpinner size="sm" />}
                            <span>{submitting ? 'Odesílám...' : 'Odeslat hodnocení'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (val === 10) {
                                confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
                              }
                              setCurrentPlayerIndex(currentPlayerIndex + 1);
                            }}
                            className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-medium transition-colors"
                          >
                            Další hráč
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </form>
        )}

        {tab === 'leaderboard' && (
          <div className="glass-card rounded-2xl p-4 sm:p-6 max-w-3xl">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">Žebříček formy</h2>
            <p className="text-foreground/60 text-sm mb-4">
              Průměrné hodnocení od spoluhráčů po zápasech.
            </p>
            {(matchSeasons.length > 0 || matches.length > 0) && (
              <div className="mb-4">
                <label className="block text-foreground/80 text-sm mb-1">Filtrovat podle</label>
                <Select
                  value={leaderboardFilter || '__all__'}
                  onValueChange={(value) => setLeaderboardFilter(value === '__all__' ? '' : value)}
                >
                  <SelectTrigger className="w-full max-w-xs rounded-lg glass-input text-foreground focus:ring-2 focus:ring-blue-400">
                    <SelectValue placeholder="Všechny zápasy (celkový průměr)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Všechny zápasy (celkový průměr)</SelectItem>
                    <SelectGroup>
                      <SelectLabel>Průměr za sezónu</SelectLabel>
                      {matchSeasons.map((s) => (
                        <SelectItem key={s} value={`season:${s}`}>
                          Sezóna {s}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Za konkrétní zápas</SelectLabel>
                      {matches
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((m) => (
                          <SelectItem key={m.id} value={`match:${m.id}`}>
                            {formatEventDateTime(m.date, m.startTime)}
                            {m.opponent ? ` vs ${m.opponent}` : ''}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
            {leaderboard.length === 0 ? (
              <p className="text-foreground/50 italic">Zatím žádná hodnocení.</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, i) => {
                  const badges = getPlayerBadges(entry.playerId, canadianStats, attendanceStats);
                  return (
                    <button
                      key={entry.playerId}
                      type="button"
                      onClick={() => setPlayerCardModal(entry)}
                      className="w-full text-left flex justify-between items-center py-3 px-4 rounded-xl bg-surface border border-border hover:bg-surface-hover transition-colors cursor-pointer"
                    >
                      <span className="text-foreground font-medium flex items-center gap-2 flex-wrap">
                        {i + 1}. {entry.playerName}
                        {badges.length > 0 && (
                          <span className="flex items-center gap-1.5 flex-wrap">
                            {badges.map((bid) => {
                              const b = BADGES.find((x) => x.id === bid)!;
                              return (
                                <span
                                  key={b.id}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-accent/20 border border-accent/40 text-sm"
                                  title={b.title}
                                >
                                  <span aria-hidden>{b.icon}</span>
                                  <span className="text-foreground/90">{b.label}</span>
                                </span>
                              );
                            })}
                          </span>
                        )}
                      </span>
                      <div className="text-right">
                        <span className="text-[#1f3768] dark:text-accent font-semibold">{entry.avgScore} / 10</span>
                        <span className="text-foreground/50 text-sm ml-2">({entry.voteCount} hlasů)</span>
                        <span className="text-foreground/40 ml-1">›</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'canadian' && (
          <div className="glass-card rounded-2xl p-4 sm:p-6 overflow-hidden">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">Kanadské bodování</h2>
            <p className="text-foreground/60 text-sm mb-4">
              Góly a asistence našeho týmu. 1 gól = 1b, 1 asistence = 1b. Seřazeno podle celkového součtu.
            </p>
            {(matchSeasons.length > 0 || matches.length > 0) && (
              <div className="mb-4">
                <label className="block text-foreground/80 text-sm mb-1">Sezóna</label>
                <Select
                  value={canadianFilter || '__all__'}
                  onValueChange={(value) => setCanadianFilter(value === '__all__' ? '' : value)}
                >
                  <SelectTrigger className="w-full max-w-xs rounded-lg glass-input text-foreground focus:ring-2 focus:ring-blue-400">
                    <SelectValue placeholder="Všechny zápasy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Všechny zápasy</SelectItem>
                    {matchSeasons.map((s) => (
                      <SelectItem key={s} value={`season:${s}`}>
                        Sezóna {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {canadianStats.length === 0 ? (
              <p className="text-foreground/50 italic">Zatím žádné góly ani asistence. Zadejte střelce a asistenty u zápasů.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 pr-4 text-foreground/70 font-medium">#</th>
                      <th className="py-2 pr-4 text-foreground/70 font-medium">Hráč</th>
                      <th className="py-2 pr-4 text-foreground/70 font-medium text-center">G</th>
                      <th className="py-2 pr-4 text-foreground/70 font-medium text-center">A</th>
                      <th className="py-2 text-foreground/70 font-medium text-center">Celkem (1b)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {canadianStats.map((entry, i) => (
                      <tr key={entry.playerId} className="border-b border-border">
                        <td className="py-2 pr-4 text-foreground/60">{i + 1}</td>
                        <td className="py-2 pr-4 text-foreground font-medium">{entry.playerName}</td>
                        <td className="py-2 pr-4 text-center text-[#1f3768] dark:text-accent">{entry.goals}</td>
                        <td className="py-2 pr-4 text-center text-amber-400">{entry.assists}</td>
                        <td className="py-2 text-center text-[#1f3768] dark:text-accent-light font-semibold">{entry.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'calendar' && (
          <div className="space-y-4 sm:space-y-6">
            {calendarError && (
              <div className="glass-card rounded-2xl p-4 border border-amber-500/50 bg-amber-500/10">
                <p className="text-amber-200 text-sm">{calendarError}</p>
              </div>
            )}
            <div className="glass-card rounded-2xl p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3">Kalendář událostí</h2>
              <p className="text-foreground/60 text-sm mb-4">
                Přidejte tréninky a zápasy. „Účast ano/ne" = odkaz pro hráče, kteří se do hodiny před událostí sami ohlásí, zda dorazí. „Docházka" = po události finálně zaznamenáte, kdo skutečně přišel (jednorázové odeslání, nelze měnit).
              </p>
              <form onSubmit={addEvent} className="flex flex-col gap-3 mb-6">
                <div className="flex flex-wrap items-center gap-2">
                  <DatePicker
                    value={newEventDate}
                    onChange={(date) => {
                      setNewEventDate(date);
                      const match = matches.find((m) => m.date === date);
                      if (match) {
                        setNewEventType('competitive_match');
                        setNewEventOpponent(match.opponent || '');
                        if (match.startTime) setNewEventStartTime(match.startTime);
                      }
                    }}
                    required
                  />
                  <TimeInput
                    value={newEventStartTime}
                    onChange={setNewEventStartTime}
                    required
                  />
                  <Popover open={eventTypeOpen} onOpenChange={setEventTypeOpen}>
                    <PopoverTrigger asChild>
                      <button type="button" className="h-10 w-[220px] rounded-lg glass-input text-foreground flex items-center justify-between px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                        <span className="truncate">
                          {newEventType === 'custom' && newEventCustomName ? newEventCustomName : EVENT_TYPE_LABELS[newEventType] || newEventType}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[220px] p-1">
                      {(['training', 'friendly_match', 'competitive_match'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => { setNewEventType(t); setNewEventCustomName(''); setEventTypeOpen(false); }}
                          className={`w-full text-left text-sm px-3 py-2 rounded-md transition-colors ${newEventType === t ? 'bg-blue-500/20 text-blue-400' : 'text-foreground hover:bg-white/5'}`}
                        >
                          {EVENT_TYPE_LABELS[t]}
                        </button>
                      ))}
                      <div className="border-t border-white/10 my-1" />
                      <input
                        type="text"
                        value={newEventCustomName}
                        onChange={(e) => { setNewEventCustomName(e.target.value); if (e.target.value.trim()) setNewEventType('custom'); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' && newEventCustomName.trim()) { e.preventDefault(); setNewEventType('custom'); setEventTypeOpen(false); } }}
                        placeholder="Vlastní název..."
                        className="w-full text-sm px-3 py-2 rounded-md bg-white/5 text-foreground placeholder-white/30 outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </PopoverContent>
                  </Popover>
                  <input
                    type="text"
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                    placeholder="Místo *"
                    className="h-10 flex-1 min-w-[140px] px-4 rounded-lg glass-input text-foreground placeholder-white/50"
                    required
                  />
                  {(newEventType === 'friendly_match' || newEventType === 'competitive_match') && (
                    <input
                      type="text"
                      value={newEventOpponent}
                      onChange={(e) => setNewEventOpponent(e.target.value)}
                      placeholder="Soupeř (volitelně)"
                      className="h-10 flex-1 min-w-[120px] px-4 rounded-lg glass-input text-foreground placeholder-white/50"
                    />
                  )}
                  <input
                    type="text"
                    value={newEventNote}
                    onChange={(e) => setNewEventNote(e.target.value)}
                    placeholder="Poznámka (volitelně)"
                    className="h-10 w-full px-4 rounded-lg glass-input text-foreground placeholder-white/50"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button type="submit" disabled={addingEvent} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium disabled:opacity-50 w-fit">
                    {addingEvent ? '...' : 'Přidat událost'}
                  </button>
                  {(newEventDate || newEventStartTime || newEventType !== 'training' || newEventLocation || newEventOpponent || newEventNote || newEventCustomName) && (
                    <button
                      type="button"
                      onClick={() => { setNewEventDate(''); setNewEventStartTime(''); setNewEventType('training'); setNewEventLocation(''); setNewEventOpponent(''); setNewEventNote(''); setNewEventCustomName(''); }}
                      className="px-3 py-2 rounded-lg text-foreground/50 hover:text-foreground/80 hover:bg-white/5 text-sm transition-colors"
                    >
                      Resetovat
                    </button>
                  )}
                </div>
              </form>
              {createdEventLink && (
                <div className="mb-6 p-4 rounded-xl bg-accent/20 border border-accent/40">
                  <p className="text-foreground font-medium mb-2">Odkaz pro potvrzení účasti:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdEventLink}
                      className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-surface-hover text-foreground text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(createdEventLink);
                          toast.success('Odkaz zkopírován');
                        } catch {
                          toast.error('Kopírování se nepovedlo');
                        }
                      }}
                      className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-foreground text-sm shrink-0 transition-colors"
                      title="Kopírovat odkaz"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <a
                      href={createdEventLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shrink-0 transition-colors"
                    >
                      Potvrdit účast
                    </a>
                  </div>
                </div>
              )}
              {(() => {
                const today = new Date().toISOString().slice(0, 10);
                const upcoming = events.filter((ev) => ev.date >= today).sort((a, b) => a.date.localeCompare(b.date));
                const past = events.filter((ev) => ev.date < today).sort((a, b) => b.date.localeCompare(a.date));

                const toByMonth = (list: Event[]) => {
                  const byMonth: Record<string, Event[]> = {};
                  list.forEach((ev) => {
                    const key = new Date(ev.date + 'T12:00:00').toLocaleDateString('cs-CZ', { year: 'numeric', month: 'long' });
                    if (!byMonth[key]) byMonth[key] = [];
                    byMonth[key].push(ev);
                  });
                  return Object.entries(byMonth).sort((a, b) => {
                    const da = new Date(a[1][0].date);
                    const db = new Date(b[1][0].date);
                    return list === upcoming ? da.getTime() - db.getTime() : db.getTime() - da.getTime();
                  });
                };

                const copyAttendanceLink = (ev: Event) => {
                  if (!ev.shareToken) return;
                  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/udalost/${ev.shareToken}`;
                  navigator.clipboard.writeText(url).then(
                    () => toast.success('Odkaz zkopírován'),
                    () => toast.error('Kopírování se nepovedlo')
                  );
                };
                const EventList = ({ evs }: { evs: Event[] }) => (
                  <ul className="space-y-2">
                    {evs.map((ev) => (
                      <li key={ev.id} className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-surface border border-border gap-2">
                        <button
                          type="button"
                          onClick={() => openUcastModal(ev)}
                          className="text-left flex-1"
                        >
                          <div className="text-foreground">
                            <div className="font-medium truncate" title={`${formatEventDateTime(ev.date, ev.startTime)} – ${EVENT_TYPE_LABELS[ev.eventType] || ev.eventType}`}>
                              {formatEventDateTime(ev.date, ev.startTime)} – {EVENT_TYPE_LABELS[ev.eventType] || ev.eventType}
                            </div>
                            {ev.location && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-foreground/60 text-xs sm:text-sm truncate hover:text-foreground/80 hover:underline"
                                title={ev.location}
                                onClick={(e) => e.stopPropagation()}
                              >
                                📍 {ev.location}
                              </a>
                            )}
                            {ev.opponent && ev.opponent !== ev.location && (
                              <div className="text-blue-400 text-sm truncate" title={ev.opponent}>
                                ⚽ vs {ev.opponent}
                              </div>
                            )}
                            {ev.note && (
                              <div className="text-foreground/70 text-xs mt-0.5 truncate" title={ev.note}>{ev.note}</div>
                            )}
                          </div>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openUcastModal(ev)}
                            className="text-blue-400 hover:text-blue-300 text-sm px-2 py-1"
                            title="Odkaz pro hráče + přehled, kdo se hlásí (do hodiny před událostí)"
                          >
                            Účast ano/ne
                          </button>
                          <button
                            type="button"
                            onClick={() => openDochazkaModal(ev)}
                            className="text-[#1f3768] hover:text-[#13244a] dark:text-accent dark:hover:text-accent-light text-sm px-2 py-1 font-medium"
                            title="Po události: finálně zaznamenat, kdo přišel"
                          >
                            Docházka
                          </button>
                          {ev.shareToken && (
                            <button
                              type="button"
                              onClick={() => copyAttendanceLink(ev)}
                              className="text-foreground/70 hover:text-foreground text-sm px-2 py-1"
                              title="Kopírovat odkaz pro potvrzení účasti"
                            >
                              Odkaz
                            </button>
                          )}
                          <button type="button" onClick={() => deleteEvent(ev.id)} className="text-red-400 hover:text-red-300 text-sm">
                            Smazat
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                );

                if (upcoming.length === 0 && past.length === 0) {
                  return <p className="text-foreground/50 italic">Zatím žádné události.</p>;
                }

                const upcomingMonths = toByMonth(upcoming);
                const pastMonths = toByMonth(past);

                return (
                  <div className="space-y-6">
                    {upcoming.length > 0 && (
                      <div>
                        <h3 className="text-foreground/90 font-semibold mb-3">Následující události</h3>
                        <div className="space-y-4">
                          {upcomingMonths.map(([month, evs]) => (
                            <div key={month}>
                              <h4 className="text-foreground/70 font-medium mb-2 text-sm">{month}</h4>
                              <EventList evs={[...evs].sort((a, b) => a.date.localeCompare(b.date))} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {past.length > 0 && (
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowPastEvents(!showPastEvents)}
                          className="flex items-center gap-2 text-foreground/60 hover:text-foreground/80 font-medium mb-2 transition-colors"
                        >
                          <svg className={`w-4 h-4 transition-transform ${showPastEvents ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          Proběhlé události ({past.length})
                        </button>
                        {showPastEvents && (
                          <div className="space-y-4 opacity-90">
                            {pastMonths.map(([month, evs]) => (
                              <div key={month}>
                                <h4 className="text-foreground/50 font-medium mb-2 text-sm">{month}</h4>
                                <EventList evs={[...evs].sort((a, b) => b.date.localeCompare(a.date))} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {attendanceStats.some((s) => s.trainingCount > 0) && (
              <div className="glass-card rounded-2xl p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">Účast a výkonnost hráčů</h2>
                <div className="flex flex-wrap gap-4 text-xs text-foreground/60 mb-4">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-blue-500 inline-block" /> Účast na tréninku</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-emerald-500 inline-block" /> Účast na zápasech</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-orange-500 inline-block" /> Průměrné hodnocení</span>
                </div>
                <div className="space-y-3">
                  {attendanceStats
                    .filter((s) => s.trainingCount > 0 || s.matchCount > 0 || s.matchEventCount > 0)
                    .sort((a, b) => b.attendancePct - a.attendancePct)
                    .map((s) => (
                      <div key={s.playerId} className="space-y-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-foreground font-medium">{s.playerName}</span>
                          <span className="text-foreground/50 text-xs">
                            trénink {s.attendancePct}% · zápas {s.matchAttendancePct}% · hodnocení {s.avgMatchScore}/10
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex gap-2 items-center">
                            <span className="text-foreground/60 text-xs w-16 shrink-0">Trénink</span>
                            <div className="flex-1 h-2.5 rounded-full bg-surface-hover overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${s.attendancePct}%` }}
                              />
                            </div>
                            <span className="text-foreground/50 text-xs w-10 text-right">{s.attendancePct}%</span>
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className="text-foreground/60 text-xs w-16 shrink-0">Zápasy</span>
                            <div className="flex-1 h-2.5 rounded-full bg-surface-hover overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${s.matchAttendancePct}%` }}
                              />
                            </div>
                            <span className="text-foreground/50 text-xs w-10 text-right">{s.matchAttendancePct}%</span>
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className="text-foreground/60 text-xs w-16 shrink-0">Hodnocení</span>
                            <div className="flex-1 h-2.5 rounded-full bg-surface-hover overflow-hidden">
                              <div
                                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                                style={{ width: `${(s.avgMatchScore / 10) * 100}%` }}
                              />
                            </div>
                            <span className="text-foreground/50 text-xs w-10 text-right">{s.avgMatchScore}/10</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'taktika' && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-foreground">Taktické schéma</h2>
              <p className="text-foreground/50 text-xs sm:text-sm">
                Přetáhněte hráče na hřiště (max 11). Tužka: kreslení v zelené, červené nebo tmavě žluté.
              </p>
            </div>
            <TacticsBoard players={players.map((p) => ({ id: p.id, name: p.name, jerseyNumber: p.jerseyNumber }))} />
          </div>
        )}

        {tab === 'fanousci' && (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Hlasování fanoušků – Hráč zápasu</h2>
            <p className="text-foreground/60 text-sm">Výsledky hlasování fanoušků na veřejném týmovém webu.</p>
            {fanVoteLoading ? (
              <div className="flex justify-center py-12"><LoadingSpinner /></div>
            ) : fanVoteData.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center border border-border">
                <div className="text-4xl mb-3 opacity-40">🗳️</div>
                <p className="text-foreground/60 font-medium">Zatím žádné hlasy</p>
                <p className="text-foreground/40 text-sm mt-1">Hlasy se zobrazí po prvním hlasování fanoušků na vašem týmovém webu.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fanVoteData.map((m) => (
                  <div key={m.matchId} className="glass-card rounded-2xl p-4 sm:p-5 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-foreground font-semibold text-sm sm:text-base">
                        {m.opponent ? `vs ${m.opponent}` : 'Zápas'}
                        <span className="text-foreground/50 font-normal ml-2 text-xs">
                          {new Date(m.date + 'T12:00:00').toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </h3>
                      <span className="text-foreground/50 text-xs">{m.totalVotes} {m.totalVotes === 1 ? 'hlas' : m.totalVotes < 5 ? 'hlasy' : 'hlasů'}</span>
                    </div>
                    <FanVoteBarChart results={m.results} totalVotes={m.totalVotes} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {ucastModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm" onClick={() => setUcastModal(null)}>
            <div className="glass-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-border" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Účast – kdo se hlásí
              </h3>
              <p className="text-foreground/70 text-sm mb-2">
                {formatEventDateTime(ucastModal.date, ucastModal.startTime)} – {EVENT_TYPE_LABELS[ucastModal.eventType] || ucastModal.eventType}
              </p>
              {(ucastModal.location || ucastModal.note) && (
                <div className="text-foreground/70 text-sm mb-4 space-y-1">
                  {ucastModal.location && <p>{ucastModal.location}</p>}
                  {ucastModal.note && <p className="italic">Poznámka: {ucastModal.note}</p>}
                </div>
              )}
              {ucastModal.shareToken ? (
                <>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/udalost/${ucastModal.shareToken}`}
                      className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-surface-hover text-foreground text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/udalost/${ucastModal!.shareToken}`;
                        navigator.clipboard.writeText(url).then(() => toast.success('Odkaz zkopírován'), () => toast.error('Kopírování se nepovedlo'));
                      }}
                      className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-foreground text-sm shrink-0 transition-colors"
                      title="Kopírovat odkaz"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    {!isUcastClosed(ucastModal.date, ucastModal.startTime) && !ucastModalFinalized && (
                      <a
                        href={`${typeof window !== 'undefined' ? window.location.origin : ''}/udalost/${ucastModal.shareToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shrink-0 transition-colors"
                      >
                        Potvrdit účast
                      </a>
                    )}
                  </div>
                  {(() => {
                    const confirmed = ucastModalData.filter((x) => x.responded && x.attended);
                    return (
                      <div className="mb-4 rounded-lg bg-surface p-3 border border-border">
                        <p className="text-sm font-medium text-foreground mb-2">Potvrdili účast: {confirmed.length}</p>
                        {confirmed.length > 0 ? (
                          <ul className="space-y-1 text-sm text-foreground/85">
                            {confirmed.map((item) => {
                              const player = players.find((p) => p.id === item.playerId);
                              return (
                                <li key={item.playerId} className="flex items-center gap-2">
                                  <span className="text-[#1f3768] dark:text-accent">✓</span>
                                  <span>{player?.name ?? 'Neznámý hráč'}</span>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="text-sm text-foreground/70">Zatím nikdo nepotvrdil účast.</p>
                        )}
                      </div>
                    );
                  })()}
                </>
              ) : (
                <p className="text-amber-400/90 text-sm mb-4">Událost nemá odkaz. Nejprve uložte událost s odkazem pro účast.</p>
              )}
              {isUcastClosed(ucastModal.date, ucastModal.startTime) && !ucastModalFinalized && (
                <p className="text-amber-400 text-sm mb-4">Odpovědi se uzavírají hodinu před začátkem události. Účast již nelze měnit.</p>
              )}
              {ucastModalFinalized && (
                <p className="text-[#1f3768]/90 dark:text-accent/90 text-sm mb-4">Docházka byla odeslána. Níže finální přehled zúčastněných.</p>
              )}
              <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                {players.map((p) => {
                  const a = ucastModalData.find((x) => x.playerId === p.id);
                  const responded = a?.responded ?? false;
                  const attended = a?.attended ?? false;
                  const reason = a?.absenceReason;
                  const status = !responded ? '?' : attended ? '✓' : '✗';
                  const statusClass = !responded ? 'text-foreground/50' : attended ? 'text-[#1f3768] dark:text-accent' : 'text-amber-400';
                  const label = ucastModalFinalized
                    ? (attended ? 'Přišel' : 'Nepřišel')
                    : !responded
                      ? 'Neodpověděl'
                      : attended
                        ? 'Budu'
                        : `Nebudu${reason ? `: ${reason}` : ''}`;
                  return (
                    <div key={p.id} className="py-2 px-3 rounded-lg bg-surface flex justify-between items-center gap-3 group relative">
                      <span className="text-foreground shrink-0">{p.name}</span>
                      <span className={`${statusClass} font-medium text-sm truncate max-w-[180px]`} title={label}>
                        {status} {label}
                      </span>
                      {reason && (
                        <div className="absolute right-0 top-full mt-1 z-30 hidden group-hover:block px-3 py-2 rounded-lg bg-[#1a1a2e] border border-white/20 shadow-xl text-sm text-foreground max-w-[280px] whitespace-normal">
                          {label}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button type="button" onClick={() => setUcastModal(null)} className="w-full px-4 py-3 rounded-xl bg-surface-hover text-foreground hover:bg-white/20 font-medium">
                Zavřít
              </button>
            </div>
          </div>
        )}

        {attendanceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm" onClick={() => setAttendanceModal(null)}>
            <div className="glass-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-border" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Docházka – finální přehled zúčastněných
              </h3>
              <p className="text-foreground/70 text-sm mb-2">
                {formatEventDateTime(attendanceModal.date, attendanceModal.startTime)} – {EVENT_TYPE_LABELS[attendanceModal.eventType] || attendanceModal.eventType}
              </p>
              {(attendanceModal.location || attendanceModal.note) && (
                <div className="text-foreground/70 text-sm mb-4 space-y-1">
                  {attendanceModal.location && <p>{attendanceModal.location}</p>}
                  {attendanceModal.note && <p className="italic">Poznámka: {attendanceModal.note}</p>}
                </div>
              )}
              {attendanceModalClosed ? (
                <p className="text-amber-400 text-sm mb-4">
                  {attendanceModalFinalized
                    ? 'Docházka byla odeslána a nelze ji měnit.'
                    : 'Docházku lze zadat až 15 minut před začátkem události.'}
                </p>
              ) : (
                <p className="text-foreground/60 text-sm mb-4">Zaklikněte hráče, kteří skutečně přišli. Odeslání je finální a nelze měnit.</p>
              )}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {players.map((p) => {
                  const a = attendanceData.find((x) => x.playerId === p.id);
                  const attended = a?.attended ?? false;
                  const reason = a?.absenceReason;
                  return (
                    <div key={p.id} className="py-2 px-3 rounded-lg hover:bg-surface">
                      <label className={`flex items-center gap-3 ${attendanceModalClosed ? 'cursor-default' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          checked={attended}
                          onChange={() => !attendanceModalClosed && toggleAttendance(p.id)}
                          disabled={attendanceModalClosed}
                          className="w-5 h-5 rounded accent-blue-500 disabled:opacity-70"
                        />
                        <span className="text-foreground">{p.name}</span>
                      </label>
                      {!attended && reason && (
                        <p className="text-foreground/50 text-xs mt-1 ml-8 italic">Důvod: {reason}</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setAttendanceModal(null)} className="flex-1 px-4 py-3 rounded-xl bg-surface-hover text-foreground hover:bg-white/20 font-medium">
                  Zavřít
                </button>
                {!attendanceModalClosed && (
                  <button type="button" onClick={saveAttendance} disabled={attendanceSaving} className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50">
                    {attendanceSaving ? 'Odesílám...' : 'Odeslat docházku'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {playerCardModal && (
          <PlayerCardModal
            entry={playerCardModal}
            canadianStats={canadianStats}
            attendanceStats={attendanceStats}
            onClose={() => setPlayerCardModal(null)}
          />
        )}

        {/* Add Player Modal */}
        {showAddPlayerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (!addPlayerCropMode) { setShowAddPlayerModal(false); clearAddPlayerPhoto(); } }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative glass-card rounded-2xl p-6 w-full max-w-sm shadow-2xl z-10"
            >
              {addPlayerCropMode && addPlayerRawSrc ? (
                <>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Upravit fotku</h3>
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-3">
                    <Cropper
                      image={addPlayerRawSrc}
                      crop={addPlayerCrop}
                      zoom={addPlayerZoom}
                      aspect={1}
                      cropShape="round"
                      onCropChange={setAddPlayerCrop}
                      onZoomChange={setAddPlayerZoom}
                      onCropComplete={(_, croppedPixels) => setAddPlayerCroppedArea(croppedPixels)}
                    />
                  </div>
                  <div className="flex items-center gap-3 mb-4 px-1">
                    <span className="text-foreground/50 text-xs">Zoom</span>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.05}
                      value={addPlayerZoom}
                      onChange={(e) => setAddPlayerZoom(Number(e.target.value))}
                      className="flex-1 accent-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleAddPlayerCropCancel} className="flex-1 px-4 py-2.5 rounded-xl bg-surface-hover text-foreground hover:bg-white/20 font-medium text-sm">
                      Zrušit
                    </button>
                    <button type="button" onClick={handleAddPlayerCropConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm">
                      Použít
                    </button>
                  </div>
                </>
              ) : (
                <>
              <button
                type="button"
                onClick={() => { setShowAddPlayerModal(false); clearAddPlayerPhoto(); }}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-foreground/70 hover:text-foreground transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h3 className="text-lg font-semibold text-foreground mb-4">Přidat hráče</h3>
              <form onSubmit={addPlayer} className="space-y-3">
                {/* Photo */}
                <div className="flex flex-col items-center mb-1">
                  {addPlayerPhotoPreview ? (
                    <div className="relative group">
                      <img src={addPlayerPhotoPreview} alt="Náhled" className="w-20 h-20 rounded-full object-cover border-2 border-white/10" />
                      <button
                        type="button"
                        onClick={clearAddPlayerPhoto}
                        className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white text-xs hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addPlayerFileInputRef.current?.click()}
                      className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-foreground/40 hover:border-white/40 hover:text-foreground/60 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                      </svg>
                      <span className="text-[10px] mt-0.5">Fotka</span>
                    </button>
                  )}
                  <input
                    ref={addPlayerFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAddPlayerPhotoSelect}
                  />
                </div>
                {/* Name */}
                <div>
                  <label className="block text-sm text-foreground/60 mb-1">Jméno hráče</label>
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Jméno a příjmení"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-foreground placeholder-white/40"
                    required
                    autoFocus
                  />
                </div>
                {/* Jersey number */}
                <div>
                  <label className="block text-sm text-foreground/60 mb-1">Číslo dresu</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={newPlayerJerseyNumber}
                    onChange={(e) => setNewPlayerJerseyNumber(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    placeholder="1–99"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-foreground placeholder-white/40"
                    title="Číslo dresu (1-99)"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingPlayer}
                  className="w-full mt-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold disabled:opacity-50 transition-colors"
                >
                  {addingPlayer ? 'Přidávám...' : 'Přidat hráče'}
                </button>
              </form>
                </>
              )}
            </motion.div>
          </div>
        )}

        {playerDetailModal && (
          <PlayerDetailModal
            player={playerDetailModal}
            teamId={teamId!}
            token={token!}
            isCoach={coachPlayerId === playerDetailModal.id}
            onClose={() => setPlayerDetailModal(null)}
            onPlayerUpdated={(p) => {
              setPlayers((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...p } : x)));
              setPlayerDetailModal({ ...playerDetailModal, ...p });
            }}
            onPlayerDeleted={(id) => {
              setPlayers((prev) => prev.filter((x) => x.id !== id));
              setPlayerDetailModal(null);
            }}
          />
        )}
      </MotionPage>
    </div>
  );
}

function PlayerCardModal({
  entry,
  canadianStats,
  attendanceStats,
  onClose,
}: {
  entry: LeaderboardEntry;
  canadianStats: CanadianEntry[];
  attendanceStats: AttendanceStat[];
  onClose: () => void;
}) {
  const badges = getPlayerBadges(entry.playerId, canadianStats, attendanceStats);
  const { nickname, icon } = getPlayerNicknameAndIcon(entry, badges, canadianStats, attendanceStats);
  const canadian = canadianStats.find((c) => c.playerId === entry.playerId);
  const attendance = attendanceStats.find((a) => a.playerId === entry.playerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-border max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <p className="text-2xl text-foreground/80 mb-0.5">
            <span className="mr-2">{icon}</span>
            {nickname}
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
            {entry.playerName}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="py-3 px-4 rounded-xl bg-surface border border-border">
            <p className="text-foreground/50 text-xs uppercase tracking-wider mb-1">Hodnocení</p>
            <p className="text-[#1f3768] dark:text-accent font-bold text-xl">{entry.avgScore} / 10</p>
            <p className="text-foreground/40 text-xs">({entry.voteCount} hlasů)</p>
          </div>
          <div className="py-3 px-4 rounded-xl bg-surface border border-border">
            <p className="text-foreground/50 text-xs uppercase tracking-wider mb-1">Docházka</p>
            <p className="text-[#1f3768] dark:text-accent font-bold text-xl">{attendance ? Math.round(attendance.attendancePct) : 0} %</p>
            <p className="text-foreground/40 text-xs">
              {attendance ? `${attendance.matchCount} zápasů, ${attendance.trainingCount} tréninků` : '–'}
            </p>
          </div>
          <div className="py-3 px-4 rounded-xl bg-surface border border-border">
            <p className="text-foreground/50 text-xs uppercase tracking-wider mb-1">Góly</p>
            <p className="text-[#1f3768] dark:text-accent font-bold text-xl">{canadian?.goals ?? 0}</p>
          </div>
          <div className="py-3 px-4 rounded-xl bg-surface border border-border">
            <p className="text-foreground/50 text-xs uppercase tracking-wider mb-1">Asistence</p>
            <p className="text-[#1f3768] dark:text-accent font-bold text-xl">{canadian?.assists ?? 0}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-6 px-4 py-3 rounded-xl bg-surface-hover text-foreground hover:bg-white/20 font-medium"
        >
          Zavřít
        </button>
      </div>
    </div>
  );
}

function OverviewProgressLoader({ progress, onNearComplete }: { progress: number; onNearComplete?: () => void }) {
  const rawProgress = useMotionValue(0);
  const motionProgress = useSpring(rawProgress, { stiffness: 28, damping: 18, mass: 1 });

  const displayPercent = useTransform(motionProgress, (v) => `${Math.round(Math.min(100, Math.max(0, v)))}%`);
  const barWidth = useTransform(motionProgress, (v) => `${Math.min(100, Math.max(0, v))}%`);
  const thumbLeft = useTransform(motionProgress, (v) => `${Math.min(100, Math.max(0, v))}%`);

  useEffect(() => {
    rawProgress.set(progress);
  }, [progress]);

  // When progress reaches 100, wait until the spring visually crosses 99 before revealing content
  useEffect(() => {
    if (progress < 100) return;
    const unsubscribe = motionProgress.on('change', (v) => {
      if (v >= 99) {
        onNearComplete?.();
        unsubscribe();
      }
    });
    return () => unsubscribe();
  }, [progress]);

  const icons = [
    <svg key="trophy" className="w-7 h-7" fill="none" stroke="#3B82F6" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0019.875 10.875 3.375 3.375 0 0016.5 7.5h0V3.75h-9V7.5h0a3.375 3.375 0 00-3.375 3.375A3.375 3.375 0 007.5 14.25v4.5m9-12.75h-9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14.25v4.5" />
    </svg>,
    <svg key="rocket" className="w-7 h-7" fill="none" stroke="#3B82F6" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>,
    <svg key="star" className="w-7 h-7" fill="none" stroke="#3B82F6" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>,
  ];

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-8">
      {/* Plovoucí ikony */}
      <div className="flex items-center gap-6">
        {icons.map((icon, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: [0, 1, 1, 0.3], y: [20, 0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
          >
            {icon}
          </motion.div>
        ))}
      </div>
      {/* Branding */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          My<span className="text-blue-500">Pitch</span>
        </h2>
        <p className="text-foreground/30 text-xs mt-1">Načítám přehled...</p>
      </div>
      {/* Progress bar + procenta */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-48 relative">
          <div className="h-2 rounded-full bg-foreground/[0.08]" />
          <motion.div
            className="absolute top-0 left-0 h-2 rounded-full"
            style={{ background: 'linear-gradient(90deg, #3B82F6, #6366F1)', width: barWidth }}
          />
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
            style={{
              background: '#3B82F6',
              border: '2px solid rgba(99, 102, 241, 0.8)',
              boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.2), 0 2px 12px rgba(0, 0, 0, 0.3)',
              left: thumbLeft,
            }}
          />
        </div>
        <motion.p className="text-sm font-mono font-semibold text-blue-500 tabular-nums">
          {displayPercent}
        </motion.p>
      </div>
    </div>
  );
}

export default function HodnoceniHracuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
        <GhostHodnoceni />
      </div>
    }>
      <HodnoceniHracuContent />
    </Suspense>
  );
}
