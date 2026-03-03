'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GhostHodnoceni, GhostOverviewCards } from '@/components/GhostLoader';
import LoadingSpinner from '@/components/LoadingSpinner';
import TacticsBoard from '@/components/TacticsBoard';
import ThemeToggle from '@/components/ThemeToggle';
import { MotionPage } from '@/components/Motion';
import { Reorder, useDragControls, motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Player {
  id: string;
  teamId: string;
  name: string;
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
  /** Z hodnocení spoluhráčů a trenéra (nejvyšší průměr) */
  playerOfMatch?: { playerId: string; playerName: string } | null;
}

interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  avgScore: number;
  voteCount: number;
}

type EventType = 'training' | 'friendly_match' | 'competitive_match';

interface Event {
  id: string;
  teamId: string;
  date: string;
  eventType: EventType;
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
  avgMatchScore: number;
  trainingCount: number;
  matchCount: number;
}

type Tab = 'dashboard' | 'manage' | 'vote' | 'leaderboard' | 'canadian' | 'calendar' | 'taktika';
type OverviewCardId = 'lastMatch' | 'upcomingEvents' | 'teamForm';
type OverviewCardSize = 'small' | 'wide' | 'full';
type OverviewCardLayoutItem = { id: OverviewCardId; order: number; size: OverviewCardSize; visible: boolean };
type TeamOverviewLayout = { version: 1; cards: OverviewCardLayoutItem[] };

const TAB_ORDER_KEY = 'hodnoceni-tab-order-v1';
const DEFAULT_TAB_ORDER: Tab[] = ['dashboard', 'manage', 'vote', 'leaderboard', 'canadian', 'calendar', 'taktika'];
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
  if (tab === 'vote') return 'Hlasovat';
  if (tab === 'leaderboard') return 'Žebříček';
  if (tab === 'canadian') return 'Kanadské bodování';
  if (tab === 'calendar') return 'Události/docházka';
  return 'Taktika';
}

function normalizeTabOrder(value: unknown): Tab[] {
  if (!Array.isArray(value)) return DEFAULT_TAB_ORDER;
  const isTab = (v: unknown): v is Tab => typeof v === 'string' && DEFAULT_TAB_ORDER.includes(v as Tab);
  const incoming = value.filter(isTab);
  const unique = Array.from(new Set(incoming));
  const missing = DEFAULT_TAB_ORDER.filter((t) => !unique.includes(t));
  return [...unique, ...missing];
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

function ReorderableTabItem({
  tabKey,
  active,
  onSelect,
}: {
  tabKey: Tab;
  active: boolean;
  onSelect: (tab: Tab) => void;
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
      value={tabKey}
      drag="x"
      dragListener={false}
      dragControls={dragControls}
      className="shrink-0"
      whileDrag={{ scale: 1.02, zIndex: 40 }}
    >
      <button
        type="button"
        onClick={() => onSelect(tabKey)}
        onPointerDown={(e) => {
          clearPressTimer();
          pressTimerRef.current = setTimeout(() => {
            dragControls.start(e);
          }, 220);
        }}
        onPointerUp={clearPressTimer}
        onPointerLeave={clearPressTimer}
        onPointerCancel={clearPressTimer}
        className={`shrink-0 px-3 py-2 sm:px-4 rounded-xl font-medium transition-all text-sm sm:text-base touch-none ${
          active
            ? 'bg-blue-500/30 text-foreground border border-blue-400/50'
            : 'bg-surface text-foreground/70 hover:bg-surface-hover border border-border'
        }`}
        title="Podržte a přetáhněte pro změnu pořadí"
      >
        {tabLabel(tabKey)}
      </button>
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

/** Odpovědi na účast se uzavírají den před událostí do půlnoci. */
function isUcastClosed(dateStr: string): boolean {
  const eventDate = new Date(dateStr + 'T12:00:00');
  const deadline = new Date(eventDate);
  deadline.setDate(deadline.getDate() - 1);
  deadline.setHours(0, 0, 0, 0);
  return new Date() >= deadline;
}

function formatMatchScore(m: Match, teamLabel: string, opponentLabel: string): string | null {
  if (m.goalsFor != null && m.goalsAgainst != null) {
    return `${teamLabel} ${m.goalsFor} : ${m.goalsAgainst} ${opponentLabel}`;
  }
  if (m.result) return m.result;
  return null;
}

function MatchResultEdit({
  match,
  teamId,
  token,
  teamLabel,
  opponentLabel,
  playerOfMatch,
  onUpdated,
}: {
  match: Match;
  teamId: string;
  token: string;
  teamLabel: string;
  opponentLabel: string;
  playerOfMatch?: { playerId: string; playerName: string } | null;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [goalsFor, setGoalsFor] = useState(match.goalsFor ?? '');
  const [goalsAgainst, setGoalsAgainst] = useState(match.goalsAgainst ?? '');
  const [saving, setSaving] = useState(false);
  const editRef = useRef<HTMLSpanElement>(null);
  const saveRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const save = async () => {
    const gfRaw = goalsFor === '' ? undefined : Number(goalsFor);
    const gaRaw = goalsAgainst === '' ? undefined : Number(goalsAgainst);
    const gf = gfRaw != null && !Number.isNaN(gfRaw) ? Math.round(gfRaw) : undefined;
    const ga = gaRaw != null && !Number.isNaN(gaRaw) ? Math.round(gaRaw) : undefined;
    if (gf == null && ga == null && (match.goalsFor == null && match.goalsAgainst == null)) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const body: { goalsFor?: number; goalsAgainst?: number } = {};
      if (gf != null) body.goalsFor = gf;
      if (ga != null) body.goalsAgainst = ga;
      const res = await fetch(`/api/teams/${teamId}/matches/${match.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        onUpdated();
        setEditing(false);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err?.error || `Chyba při ukládání (${res.status})`);
      }
    } finally {
      setSaving(false);
    }
  };

  saveRef.current = save;

  useEffect(() => {
    if (!editing) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (editRef.current && !editRef.current.contains(e.target as Node)) {
        saveRef.current();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editing]);

  if (editing) {
    return (
      <span ref={editRef} className="flex items-center gap-2">
        <span className="flex flex-col items-center gap-0.5">
          <span className="text-foreground/70 text-xs">{teamLabel}</span>
          <input
            type="number"
            min={0}
            value={goalsFor}
            onChange={(e) => setGoalsFor(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="0"
            className="w-12 px-2 py-1 rounded glass-input text-foreground text-sm text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            autoFocus
          />
        </span>
        <span className="text-foreground/60 text-lg pt-4">:</span>
        <span className="flex flex-col items-center gap-0.5">
          <span className="text-foreground/70 text-xs">{opponentLabel}</span>
          <input
            type="number"
            min={0}
            value={goalsAgainst}
            onChange={(e) => setGoalsAgainst(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="0"
            className="w-12 px-2 py-1 rounded glass-input text-foreground text-sm text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </span>
        <span className="flex gap-1 pt-4">
          <button type="button" onClick={save} disabled={saving} className="text-green-400 hover:text-green-300 text-xs">
            {saving ? '...' : '✓'}
          </button>
          <button
            type="button"
            onClick={() => {
              setGoalsFor(match.goalsFor ?? '');
              setGoalsAgainst(match.goalsAgainst ?? '');
              setEditing(false);
            }}
            className="text-foreground/60 hover:text-foreground text-xs"
          >
            ✕
          </button>
        </span>
      </span>
    );
  }
  const hasScore = match.goalsFor != null && match.goalsAgainst != null;
  const scoreShort = hasScore ? `${match.goalsFor} : ${match.goalsAgainst}` : null;
  const scoreFull = formatMatchScore(match, teamLabel, opponentLabel);
  return (
    <span className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-blue-400 hover:text-blue-300 text-sm px-3 py-1 rounded hover:bg-surface"
        title={scoreFull ? `${scoreFull} – upravit` : 'Přidat skóre'}
      >
        {scoreShort ?? 'Přidat skóre'}
      </button>
      {playerOfMatch && (
        <span className="text-amber-400 text-sm" title="Hráč utkání (z hodnocení spoluhráčů a trenéra)">
          ⭐ {playerOfMatch.playerName}
        </span>
      )}
    </span>
  );
}

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  training: 'Trénink',
  friendly_match: 'Zápas přátelský',
  competitive_match: 'Zápas mistrovský',
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

/** Pozitivní, motivující emojis – žádné toxické negativní symboly. Nižší skóre = prostor k růstu. */
const RATING_EMOJI: Record<number, string> = {
  0: '—',
  1: '🌱',  // potenciál
  2: '📈',  // zlepšení
  3: '👍',  // solidní
  4: '🙂',  // dobré
  5: '😊',  // pěkná práce
  6: '💪',  // silný výkon
  7: '⭐',  // vynikající
  8: '🔥',  // skvělé
  9: '🚀',  // mimořádné
  10: '🏆', // nejlepší
};

/** Konstruktivní popisky pro tooltip – podporují týmovou atmosféru. */
const RATING_LABELS: Record<number, string> = {
  0: 'Nebyl nasazen',
  1: 'Má potenciál',
  2: 'Na dobré cestě',
  3: 'Solidní výkon',
  4: 'Dobře přispěl',
  5: 'Pěkná práce',
  6: 'Silný výkon',
  7: 'Vynikající',
  8: 'Skvělé',
  9: 'Mimořádné',
  10: 'Nejlepší',
};

type BadgeId = 'střelec' | 'dříč' | 'král_asistencí';

const BADGES: { id: BadgeId; label: string; icon: string; title: string }[] = [
  { id: 'střelec', label: 'Střelec', icon: '⚽', title: 'Nejvíce gólů' },
  { id: 'dříč', label: 'Dříč', icon: '💪', title: 'Nejlepší docházka na tréninky' },
  { id: 'král_asistencí', label: 'Král asistencí', icon: '👑', title: 'Nejvíce asistencí' },
];

/** Přezdívka a ikona podle hodnocení a statistik – pro hráčskou kartu. */
function getPlayerNicknameAndIcon(
  entry: LeaderboardEntry,
  badges: BadgeId[],
  canadianStats: CanadianEntry[],
  _attendanceStats: AttendanceStat[]
): { nickname: string; icon: string } {
  if (badges.includes('střelec')) return { nickname: 'Střelec', icon: '⚽' };
  if (badges.includes('král_asistencí')) return { nickname: 'Král asistencí', icon: '👑' };
  if (badges.includes('dříč')) return { nickname: 'Dříč', icon: '💪' };
  const s = entry.avgScore;
  if (s >= 9) return { nickname: 'Rychlík', icon: '🚀' };
  if (s >= 8) return { nickname: 'Hvězda', icon: '⭐' };
  if (s >= 7) return { nickname: 'Bojovník', icon: '💪' };
  if (s >= 6) return { nickname: 'Solidní', icon: '👍' };
  if (s >= 5) return { nickname: 'Spolehlivý', icon: '🙂' };
  return { nickname: 'Týmový hráč', icon: '🤝' };
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
  const tabParam = searchParams.get('tab');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialDataReady, setInitialDataReady] = useState(false);
  const [dashboardCardsLoading, setDashboardCardsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>(
    tabParam === 'dashboard' || tabParam === 'calendar' || tabParam === 'vote' || tabParam === 'leaderboard' || tabParam === 'canadian' || tabParam === 'taktika'
      ? tabParam as Tab
      : 'dashboard'
  );
  const [tabOrder, setTabOrder] = useState<Tab[]>(DEFAULT_TAB_ORDER);
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
  const [newMatchDate, setNewMatchDate] = useState('');
  const [newMatchStartTime, setNewMatchStartTime] = useState('');
  const [newMatchOpponent, setNewMatchOpponent] = useState('');
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [addingMatch, setAddingMatch] = useState(false);

  const [voterId, setVoterId] = useState('');
  const [matchId, setMatchId] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showVoteValidation, setShowVoteValidation] = useState(false);
  const [hasVoted, setHasVoted] = useState<boolean | null>(null);
  const [voteSubmittedSuccess, setVoteSubmittedSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ playerId: string; playerName: string } | null>(null);
  const [deleteFeedback, setDeleteFeedback] = useState<string | null>(null);
  const [matchesSeason, setMatchesSeason] = useState<string | null>(null);
  const [leaderboardFilter, setLeaderboardFilter] = useState<string>('');
  const [canadianStats, setCanadianStats] = useState<CanadianEntry[]>([]);
  const [canadianFilter, setCanadianFilter] = useState<string>('');
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [matchScorersData, setMatchScorersData] = useState<Record<string, { scorers: { goalOrder: number; playerId: string }[]; assists: { assistOrder: number; playerId: string }[] }>>({});
  const newPlayerInputRef = useRef<HTMLInputElement>(null);
  const [matchScorersSaving, setMatchScorersSaving] = useState<string | null>(null);

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
  const [addingEvent, setAddingEvent] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStat[]>([]);
  const [showAllFormPlayers, setShowAllFormPlayers] = useState(false);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [createdEventLink, setCreatedEventLink] = useState<string | null>(null);
  const [eventAttendanceSummary, setEventAttendanceSummary] = useState<Record<string, { attended: number; notAttended: number; noResponse: number }>>({});

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
  const selectedSeason = matchesSeason ?? matchSeasons[0] ?? getSeasonFromDate(new Date().toISOString().slice(0, 10));
  const filteredMatches = matches.filter((m) => getSeasonFromDate(m.date) === selectedSeason);
  const playedMatches = matches
    .filter((m) => isMatchPlayed(m.date, m.startTime))
    .sort((a, b) => `${b.date} ${b.startTime ?? ''}`.localeCompare(`${a.date} ${a.startTime ?? ''}`));

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'dashboard' || t === 'calendar' || t === 'vote' || t === 'leaderboard' || t === 'canadian' || t === 'taktika') setTab(t as Tab);
  }, [searchParams]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TAB_ORDER_KEY);
      if (!raw) return;
      setTabOrder(normalizeTabOrder(JSON.parse(raw)));
    } catch {
      setTabOrder(DEFAULT_TAB_ORDER);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(TAB_ORDER_KEY, JSON.stringify(tabOrder));
    } catch {
      // ignore storage errors
    }
  }, [tabOrder]);

  useEffect(() => {
    if (!teamId || !token) return;
    let active = true;
    const initLoad = async () => {
      setInitialDataReady(false);
      setDashboardCardsLoading(true);
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
        fetchPlayers(),
        fetchMatches(),
        fetchEvents(),
        fetchAttendanceStats(),
        fetchLeaderboard(),
        teamFetch,
      ]);

      if (!active) return;
      setInitialDataReady(true);
      setDashboardCardsLoading(false);
    };
    initLoad();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, token]);

  useEffect(() => {
    if (!teamId || !token) return;
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, token, leaderboardFilter]);

  useEffect(() => {
    if ((tab !== 'canadian' || !teamId || !token)) return;
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
    if ((tab === 'dashboard' || tab === 'calendar') && teamId && token) {
      fetchEvents();
      fetchAttendanceStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, teamId, token]);

  useEffect(() => {
    if (tab !== 'leaderboard' || !teamId || !token) return;
    fetchAttendanceStats();
    const params = new URLSearchParams();
    if (leaderboardFilter.startsWith('season:')) params.set('season', leaderboardFilter.slice(7));
    fetch(`/api/teams/${teamId}/canadian-scoring${params.toString() ? `?${params}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: { stats?: CanadianEntry[] }) => setCanadianStats(d?.stats || []))
      .catch(() => setCanadianStats([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, teamId, token, leaderboardFilter]);

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

  const fetchPlayers = async () => {
    if (!teamId || !token) return;
    const res = await fetch(`/api/teams/${teamId}/players`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setPlayers(data.players);
    }
  };

  const fetchMatches = async () => {
    if (!teamId || !token) return;
    const res = await fetch(`/api/teams/${teamId}/matches`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setMatches(data.matches);
    }
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
      alert('Datum je povinné');
      return;
    }
    const time = newEventStartTime.trim();
    if (!time || !/^\d{1,2}:\d{2}$/.test(time)) {
      alert('Čas začátku je povinný a musí být ve formátu HH:mm');
      return;
    }
    const location = newEventLocation.trim();
    if (!location) {
      alert('Místo konání je povinné');
      return;
    }
    setAddingEvent(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/events`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          date: newEventDate,
          eventType: newEventType,
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
        await fetchEvents();
        await fetchAttendanceStats();
      } else {
        const d = await res.json();
        const err = d.error || 'Chyba';
        if (err.includes('migrate-event-note') || err.includes('chybí sloupce')) {
          const base = typeof window !== 'undefined' ? window.location.origin : '';
          alert(
            `${err}\n\nRychlé řešení:\n1. supabase.com/dashboard/account/tokens → vygeneruj token\n2. Do .env.local přidej: SUPABASE_ACCESS_TOKEN=sbp_xxx\n3. Restartuj server, navštiv: ${base}/api/admin/migrate-event-note?key=migrate-event-note-2024`
          );
        } else {
          alert(err);
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
    if (!confirm('Finálně odeslat docházku? Zakliknutí hráči skutečně přišli. Po odeslání již nelze měnit.')) return;
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
        alert(d.error || 'Chyba');
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
    if (!confirm('Opravdu smazat událost?')) return;
    const res = await fetch(`/api/teams/${teamId}/events/${eventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await fetchEvents();
      await fetchAttendanceStats();
    }
  };

  const addPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim() || !teamId || !token) return;
    setAddingPlayer(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/players`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ name: newPlayerName.trim() }),
      });
      if (res.ok) {
        setNewPlayerName('');
        await fetchPlayers();
      } else {
        const d = await res.json();
        alert(d.error || 'Chyba');
      }
    } finally {
      setAddingPlayer(false);
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
        alert(d.error || 'Chyba při aktualizaci');
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
      alert('Chybí datum nebo nejste přihlášeni.');
      return;
    }
    const time = newMatchStartTime.trim();
    if (!time || !/^\d{1,2}:\d{2}$/.test(time)) {
      alert('Vyplňte prosím čas začátku zápasu.');
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
        alert(msg);
      }
    } catch (err) {
      alert('Chyba při odesílání: ' + (err instanceof Error ? err.message : 'Neznámá chyba'));
    } finally {
      setAddingMatch(false);
    }
  };

  const deleteMatch = async (matchId: string) => {
    if (!confirm('Opravdu smazat zápas?')) return;
    const res = await fetch(`/api/teams/${teamId}/matches/${matchId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      setExpandedMatchId((prev) => (prev === matchId ? null : prev));
      await fetchMatches();
    }
  };

  const openMatchDetail = async (m: Match) => {
    const goalsCount = m.goalsFor ?? 0;
    if (!matchScorersData[m.id]) {
      const emptyScorers = Array.from({ length: goalsCount }, (_, i) => ({ goalOrder: i + 1, playerId: '' }));
      const emptyAssists = Array.from({ length: goalsCount }, (_, i) => ({ assistOrder: i + 1, playerId: '' }));
      setMatchScorersData((prev) => ({ ...prev, [m.id]: { scorers: emptyScorers, assists: emptyAssists } }));
      const res = await fetch(`/api/teams/${teamId}/matches/${m.id}/scorers`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        const scorers = (d.scorers || []).map((s: { goalOrder: number; playerId: string }) => ({ goalOrder: s.goalOrder, playerId: s.playerId }));
        const assists = (d.assists || []).map((a: { assistOrder: number; playerId: string }) => ({ assistOrder: a.assistOrder, playerId: a.playerId }));
        const mergedScorers = Array.from({ length: goalsCount }, (_, i) => ({
          goalOrder: i + 1,
          playerId: scorers.find((s: { goalOrder: number }) => s.goalOrder === i + 1)?.playerId ?? '',
        }));
        const mergedAssists = Array.from({ length: goalsCount }, (_, i) => ({
          assistOrder: i + 1,
          playerId: assists.find((a: { assistOrder: number }) => a.assistOrder === i + 1)?.playerId ?? '',
        }));
        setMatchScorersData((prev) => ({ ...prev, [m.id]: { scorers: mergedScorers, assists: mergedAssists } }));
      }
    }
    if (matchScorersData[m.id] && goalsCount > 0 && matchScorersData[m.id].scorers.length < goalsCount) {
      setMatchScorersData((prev) => {
        const data = prev[m.id];
        const scorers = [...data.scorers];
        const assists = [...data.assists];
        while (scorers.length < goalsCount) scorers.push({ goalOrder: scorers.length + 1, playerId: '' });
        while (assists.length < goalsCount) assists.push({ assistOrder: assists.length + 1, playerId: '' });
        return { ...prev, [m.id]: { scorers, assists } };
      });
    }
    setExpandedMatchId(m.id);
  };

  const toggleMatchDetail = async (m: Match) => {
    if (expandedMatchId === m.id) {
      setExpandedMatchId(null);
      return;
    }
    await openMatchDetail(m);
  };

  const setMatchScorer = (matchId: string, goalOrder: number, playerId: string) => {
    setMatchScorersData((prev) => {
      const data = prev[matchId];
      if (!data) return prev;
      const scorers = data.scorers.map((s) => (s.goalOrder === goalOrder ? { ...s, playerId } : s));
      return { ...prev, [matchId]: { ...data, scorers } };
    });
  };

  const setMatchAssist = (matchId: string, assistOrder: number, playerId: string) => {
    setMatchScorersData((prev) => {
      const data = prev[matchId];
      if (!data) return prev;
      const assists = data.assists.map((a) => (a.assistOrder === assistOrder ? { ...a, playerId } : a));
      return { ...prev, [matchId]: { ...data, assists } };
    });
  };

  const saveMatchScorers = async (matchId: string) => {
    const data = matchScorersData[matchId];
    if (!data || !teamId || !token) return;
    setMatchScorersSaving(matchId);
    try {
      const scorers = data.scorers.filter((s) => s.playerId).map((s) => ({ goalOrder: s.goalOrder, playerId: s.playerId }));
      const assists = data.assists.filter((a) => a.playerId).map((a) => ({ assistOrder: a.assistOrder, playerId: a.playerId }));
      const res = await fetch(`/api/teams/${teamId}/matches/${matchId}/scorers`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ scorers, assists }),
      });
      if (res.ok) {
        setMatchScorersData((prev) => ({ ...prev, [matchId]: { ...data, scorers, assists } }));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err?.error || 'Chyba při ukládání');
      }
    } finally {
      setMatchScorersSaving(null);
    }
  };

  const otherPlayers = voterId ? players.filter((p) => p.id !== voterId) : [];

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
      alert('Je potřeba zvolit, kdo hlasuje, a vybrat zápas.');
      return;
    }
    if (!canSubmit) return;
    if (
      !confirm(
        'Jste si jistí, že jste ohodnotil všechny hrající hráče? Po odeslání nelze hodnocení měnit.'
      )
    ) {
      return;
    }
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
        alert(d.error || `Chyba při odesílání (${res.status})`);
      }
    } catch (err) {
      console.error('Chyba při odesílání hodnocení:', err);
      alert('Chyba připojení. Zkuste to znovu.');
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
        alert(d?.error || `Nepodařilo se uložit rozložení (${res.status})`);
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
      <div className="min-h-screen animated-background py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
        <GhostHodnoceni />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen animated-background py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8 relative"
      style={teamBackgroundColor ? { background: teamBackgroundColor } : undefined}
    >
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
        <Link
          href="/dashboard"
          className="px-3 py-2 sm:px-4 sm:py-2.5 glass-card text-foreground/90 rounded-xl border border-border hover:bg-surface flex items-center gap-2 text-sm sm:text-base"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Zpět
        </Link>
        <ThemeToggle />
      </div>

      <MotionPage className="w-full max-w-7xl mx-auto relative z-10 pt-12 sm:pt-14">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-4 sm:mb-6">Hodnocení hráčů</h1>

        <Reorder.Group
          axis="x"
          values={tabOrder}
          onReorder={(nextOrder) => setTabOrder(normalizeTabOrder(nextOrder))}
          className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1 -mx-1 flex-nowrap sm:flex-wrap"
        >
          {tabOrder.map((t) => (
            <ReorderableTabItem key={t} tabKey={t} active={tab === t} onSelect={setTab} />
          ))}
        </Reorder.Group>

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
              <GhostOverviewCards />
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
                        if (!lastMatch) return null;
                        const scoreStr =
                          lastMatch.goalsFor != null && lastMatch.goalsAgainst != null
                            ? `${teamName || 'Náš tým'} ${lastMatch.goalsFor} : ${lastMatch.goalsAgainst} ${lastMatch.opponent || 'Soupeř'}`
                            : lastMatch.result || '—';
                        const pom = lastMatch.playerOfMatch;
                        const nextEvent = events
                          .filter(e => e.date >= new Date().toISOString().slice(0, 10) && e.shareToken)
                          .sort((a, b) => a.date.localeCompare(b.date))[0];
                        return (
                          <SortableOverviewCard
                            key={layoutItem.id}
                            item={layoutItem}
                            editMode={overviewEditMode}
                            onToggleVisibility={handleOverviewToggleVisibility}
                            onSizeChange={handleOverviewSizeChange}
                          >
                            <div className="glass-card group relative overflow-visible rounded-2xl p-4 sm:p-6 lg:pr-44 xl:pr-56 border border-amber-500/30 bg-amber-500/5">
                              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Poslední odehraný zápas</h2>
                              <div className="space-y-1 relative z-10">
                                <p className="text-foreground font-medium">
                                  {formatEventDateTime(lastMatch.date, lastMatch.startTime)} vs {lastMatch.opponent || 'soupeř'}
                                </p>
                                <p className="text-[#1f3768] dark:text-accent font-semibold text-lg">{scoreStr}</p>
                                {pom && (
                                  <p className="text-amber-400 font-medium flex items-center gap-1.5 mt-2">
                                    <span aria-hidden>⭐</span> Hráč utkání: {pom.playerName}
                                  </p>
                                )}
                                {nextEvent && (
                                  <a
                                    href={`/udalost/${nextEvent.shareToken}`}
                                    className="liquid-glass-btn relative z-10 inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-2xl text-sm font-semibold no-underline"
                                  >
                                    Potvrdit účast
                                  </a>
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
                                            <span className="text-foreground text-sm sm:text-base min-w-0">
                                              {formatEventDateTime(ev.date, ev.startTime)} – {EVENT_TYPE_LABELS[ev.eventType]}
                                              {ev.location && ` • ${ev.location}`}
                                              {ev.opponent && ev.opponent !== ev.location && ` vs ${ev.opponent}`}
                                            </span>
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
                                                title="Odkaz pro hráče + přehled, kdo se hlásí (do půlnoci před událostí)"
                                              >
                                                Účast
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
                                      {upcomingMatches.slice(0, 3).map((m) => (
                                        <div
                                          key={m.id}
                                          className="py-2 px-3 rounded-lg bg-surface border border-border mb-2 text-foreground"
                                        >
                                          {formatEventDateTime(m.date, m.startTime)} vs {m.opponent || 'soupeř'}
                                        </div>
                                      ))}
                                      {upcomingMatches.length > 3 && (
                                        <p className="text-foreground/50 text-sm mt-1">+ {upcomingMatches.length - 3} dalších</p>
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
                                            <motion.div
                                              className="h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-lime-400 rounded-full"
                                              initial={{ width: 0 }}
                                              animate={{ width: `${Math.min(100, formScore)}%` }}
                                              transition={{ duration: 0.8, ease: "easeOut" }}
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
                                          .map((s, index) => {
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
                                                  <motion.div
                                                    className="h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-lime-400 rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, formPct)}%` }}
                                                    transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.05 }}
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
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-lg font-semibold text-foreground">Hráči týmu ({players.length})</h2>
                <button
                  type="button"
                  onClick={() => {
                    setTimeout(() => newPlayerInputRef.current?.focus(), 50);
                  }}
                  className="shrink-0 px-3 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Přidat hráče
                </button>
              </div>

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
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {savingCoach && <span className="text-foreground/50 text-sm ml-2">Ukládám...</span>}
              </div>

              <form onSubmit={addPlayer} className="flex gap-2 mb-4">
                <input
                  ref={newPlayerInputRef}
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Jméno hráče"
                  className="flex-1 px-4 py-2 rounded-lg glass-input text-foreground placeholder-white/50"
                  required
                />
                <button type="submit" disabled={addingPlayer} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium disabled:opacity-50">
                  {addingPlayer ? '...' : 'Přidat'}
                </button>
              </form>
              <ul className="space-y-2">
                {players.map((p) => (
                  <li key={p.id} className="flex justify-between items-center py-2 border-b border-border gap-2">
                    <span className="text-foreground flex items-center gap-2">
                      {p.name}
                      {coachPlayerId === p.id && (
                        <span className="text-blue-400 text-xs font-medium">(trenér)</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => deletePlayer(p.id, p.name)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Smazat
                    </button>
                  </li>
                ))}
              </ul>
              </>
            </div>

            <div className="glass-card rounded-2xl p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h2 className="text-base sm:text-lg font-semibold text-foreground">Zápasy</h2>
                {matchSeasons.length > 1 && (
                  <div className="flex gap-1">
                    {matchSeasons.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setMatchesSeason(s)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedSeason === s
                            ? 'bg-blue-500/50 text-foreground border border-blue-400/50'
                            : 'bg-surface text-foreground/70 hover:bg-surface-hover border border-border'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <form onSubmit={addMatch} className="flex flex-col sm:flex-row gap-2 mb-4 flex-wrap">
                <input
                  type="date"
                  value={newMatchDate}
                  onChange={(e) => setNewMatchDate(e.target.value)}
                  className="px-4 py-2 rounded-lg glass-input text-foreground min-w-0 sm:min-w-[140px]"
                  required
                />
                <input
                  type="time"
                  value={newMatchStartTime}
                  onChange={(e) => setNewMatchStartTime(e.target.value)}
                  className="px-4 py-2 rounded-lg glass-input text-foreground min-w-0 sm:min-w-[100px]"
                  title="Čas začátku"
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
              <ul className="space-y-2">
                {filteredMatches.map((m) => {
                  const goalsFor = m.goalsFor ?? 0;
                  const isExpanded = expandedMatchId === m.id;
                  const scorersData = matchScorersData[m.id];
                  const hasScore = m.goalsFor != null && m.goalsAgainst != null;
                  const resultDetailText = hasScore
                    ? `${teamName || 'Náš tým'} ${m.goalsFor} : ${m.goalsAgainst} ${m.opponent || 'Soupeř'}`
                    : (!m.goalsFor && !m.goalsAgainst) && m.result
                      ? m.result
                      : null;
                  return (
                    <li key={m.id} className="border-b border-border">
                      <div
                        className="flex justify-between items-center py-2 gap-2 cursor-pointer hover:bg-surface rounded-lg -mx-1 px-1"
                        onClick={() => toggleMatchDetail(m)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            void toggleMatchDetail(m);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <span className="text-foreground min-w-0">
                          <span className="block">
                            <span className="inline-block w-5 text-foreground/60">
                              {isExpanded ? '▼' : '▶'}
                            </span>
                            {formatEventDateTime(m.date, m.startTime)}
                            {m.opponent && ` vs ${m.opponent}`}
                          </span>
                          {resultDetailText && (
                            <span className="block mt-1 text-blue-400 font-semibold whitespace-nowrap pl-5">
                              {resultDetailText}
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => openMatchDetail(m)}
                            className="text-xs text-foreground/70 hover:text-foreground underline underline-offset-2"
                          >
                            Vyplnit skóre
                          </button>
                          <MatchResultEdit
                            match={m}
                            teamId={teamId!}
                            token={token!}
                            teamLabel={teamName || 'Náš tým'}
                            opponentLabel={m.opponent || 'Soupeř'}
                            playerOfMatch={m.playerOfMatch}
                            onUpdated={fetchMatches}
                          />
                          <button
                            type="button"
                            onClick={() => deleteMatch(m.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Smazat
                          </button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="pb-4 pl-6 pr-2 space-y-3" onClick={(e) => e.stopPropagation()}>
                          <p className="text-foreground/70 text-sm font-medium">Skóre zápasu</p>
                          <MatchResultEdit
                            match={m}
                            teamId={teamId!}
                            token={token!}
                            teamLabel={teamName || 'Náš tým'}
                            opponentLabel={m.opponent || 'Soupeř'}
                            playerOfMatch={m.playerOfMatch}
                            onUpdated={fetchMatches}
                          />
                          {goalsFor > 0 && scorersData ? (
                            <>
                              <p className="text-foreground/70 text-sm font-medium">Střelci branek a asistence</p>
                              {scorersData.scorers.map((_, i) => (
                                <div key={i} className="flex flex-wrap items-center gap-2">
                                  <span className="text-foreground/60 text-sm w-20">Branka {i + 1}:</span>
                                  <Select
                                    value={scorersData.scorers[i]?.playerId ?? '__none__'}
                                    onValueChange={(value) => setMatchScorer(m.id, i + 1, value === '__none__' ? '' : value)}
                                  >
                                    <SelectTrigger className="h-8 min-w-[140px] rounded-lg glass-input text-foreground text-sm focus:ring-2 focus:ring-blue-400">
                                      <SelectValue placeholder="— Střelec —" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__none__">— Střelec —</SelectItem>
                                      {players.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <span className="text-foreground/50">+</span>
                                  <Select
                                    value={scorersData.assists[i]?.playerId ?? '__none__'}
                                    onValueChange={(value) => setMatchAssist(m.id, i + 1, value === '__none__' ? '' : value)}
                                  >
                                    <SelectTrigger className="h-8 min-w-[140px] rounded-lg glass-input text-foreground text-sm focus:ring-2 focus:ring-blue-400">
                                      <SelectValue placeholder="— Asistence —" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__none__">— Asistence —</SelectItem>
                                      {players.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => saveMatchScorers(m.id)}
                                disabled={matchScorersSaving === m.id}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
                              >
                                {matchScorersSaving === m.id ? 'Ukládám...' : 'Uložit'}
                              </button>
                            </>
                          ) : (
                            <p className="text-foreground/60 text-sm">
                              Nejprve ulož skóre, pak doplníš střelce a asistence.
                            </p>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        {tab === 'vote' && (
          <div className="glass-card rounded-2xl p-4 sm:p-6 max-w-2xl">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">Podle vyhodnocení ze zápasu vyhodnoť hráče utkání</h2>
              <p className="text-foreground/60 text-sm mb-4">
              Vyberte sebe (hlasujícího), zápas a ohodnoťte spoluhráče škálou 0–10 podle výkonu v utkání (0 = nebyl nasazen, 10 = nejlepší). Nemůžete hodnotit sám sebe. Každý hráč může hlasovat jen jednou – po odeslání nelze měnit.
            </p>
            {voteSubmittedSuccess && (
              <div className="p-4 rounded-xl bg-accent/20 border border-accent/50 mb-4 flex items-center gap-2">
                <span className="text-[#1f3768] dark:text-accent-dark text-xl">✓</span>
                <p className="text-[#1f3768] dark:text-accent-light font-medium">Hodnocení bylo odesláno.</p>
              </div>
            )}
            <form onSubmit={submitVote} className="space-y-4">
              <div>
                <label className="block text-foreground font-medium mb-2">Kdo hlasuje?</label>
                <Select
                  value={voterId || '__none__'}
                  onValueChange={(value) => {
                    setVoterId(value === '__none__' ? '' : value);
                    setShowVoteValidation(false);
                  }}
                >
                  <SelectTrigger className={`w-full rounded-xl glass-input text-foreground focus:ring-2 focus:ring-blue-400 ${showVoteValidation && !voterId ? 'ring-2 ring-red-500 bg-red-500/20' : ''}`}>
                    <SelectValue placeholder="Vyberte sebe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Vyberte sebe</SelectItem>
                    {players.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {coachPlayerId === p.id ? ' (trenér)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-foreground font-medium mb-2">Za který zápas?</label>
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
                    <SelectValue placeholder="Vyberte zápas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Vyberte zápas</SelectItem>
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
              {hasVoted && (
                <div className="p-4 rounded-xl bg-amber-500/20 border border-amber-500/40">
                  <p className="text-amber-200 font-medium">Už jste pro tento zápas hlasoval.</p>
                  <p className="text-foreground/70 text-sm mt-1">Hodnocení nelze měnit.</p>
                </div>
              )}
              {otherPlayers.length > 0 && !hasVoted && (
                <div>
                  <label className="block text-foreground font-medium mb-3">
                    Hodnocení táhlem – hodnotte fair a pozitivně (0 = nebyl nasazen, 10 = nejlepší)
                  </label>
                  <div className="space-y-4">
                    {otherPlayers.map((p) => {
                      const val = scores[p.id] ?? 0;
                      return (
                        <div key={p.id} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-foreground font-medium">
                              {p.name}
                              {coachPlayerId === p.id && (
                                <span className="text-blue-400 text-xs font-medium ml-1">(trenér)</span>
                              )}
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="text-2xl" aria-hidden title={RATING_LABELS[val] ?? ''}>{RATING_EMOJI[val]}</span>
                              <span className="text-blue-400 font-semibold tabular-nums">{val === 0 ? '0 (nehrál)' : `${val}/10`}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg opacity-60" aria-hidden title="0 = nebyl nasazen">—</span>
                            <input
                              type="range"
                              min={0}
                              max={10}
                              step={1}
                              value={val}
                              onChange={(e) =>
                                setScores((prev) => ({
                                  ...prev,
                                  [p.id]: Number(e.target.value),
                                }))
                              }
                              className="flex-1 h-2 rounded-full appearance-none rating-range-modern"
                              style={{
                                background: `linear-gradient(90deg, #7cff5b 0%, #39ff14 ${val * 10}%, rgba(255,255,255,0.14) ${val * 10}%, rgba(255,255,255,0.14) 100%)`,
                              }}
                            />
                            <span className="text-lg" aria-hidden title="10 = nejlepší">🏆</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {!hasVoted && (
                <button
                  type="submit"
                  disabled={!canSubmit || submitting}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting && <LoadingSpinner size="sm" />}
                  <span>{submitting ? 'Odesílám...' : 'Odeslat hodnocení'}</span>
                </button>
              )}
            </form>
          </div>
        )}

        {tab === 'leaderboard' && (
          <div className="glass-card rounded-2xl p-4 sm:p-6 max-w-3xl">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">Žebříček hráčů</h2>
            <p className="text-foreground/60 text-sm mb-4">
              Průměrné hodnocení od spoluhráčů po zápasech. Čím více hlasů, tím reprezentativnější. Odznáčky: Střelec ⚽, Dříč 💪 (docházka), Král asistencí 👑.
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
                Přidejte tréninky a zápasy. „Účast" = odkaz pro hráče, kteří se do půlnoci před událostí sami ohlásí, zda dorazí. „Docházka" = po události finálně zaznamenáte, kdo skutečně přišel (jednorázové odeslání, nelze měnit).
              </p>
              <form onSubmit={addEvent} className="flex flex-col gap-3 mb-6">
                <div className="flex flex-wrap gap-2">
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="px-4 py-2 rounded-lg glass-input text-foreground"
                    required
                  />
                  <input
                    type="time"
                    value={newEventStartTime}
                    onChange={(e) => setNewEventStartTime(e.target.value)}
                    className="px-4 py-2 rounded-lg glass-input text-foreground"
                    title="Čas začátku"
                    required
                  />
                  <Select value={newEventType} onValueChange={(value) => setNewEventType(value as EventType)}>
                    <SelectTrigger className="w-[220px] rounded-lg glass-input text-foreground focus:ring-2 focus:ring-blue-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['training', 'friendly_match', 'competitive_match'] as EventType[]).map((t) => (
                        <SelectItem key={t} value={t}>
                          {EVENT_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    type="text"
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                    placeholder="Místo *"
                    className="flex-1 min-w-[140px] px-4 py-2 rounded-lg glass-input text-foreground placeholder-white/50"
                    required
                  />
                  {newEventType !== 'training' && (
                    <input
                      type="text"
                      value={newEventOpponent}
                      onChange={(e) => setNewEventOpponent(e.target.value)}
                      placeholder="Soupeř (volitelně)"
                      className="flex-1 min-w-[120px] px-4 py-2 rounded-lg glass-input text-foreground placeholder-white/50"
                    />
                  )}
                  <input
                    type="text"
                    value={newEventNote}
                    onChange={(e) => setNewEventNote(e.target.value)}
                    placeholder="Poznámka (volitelně)"
                    className="w-full px-4 py-2 rounded-lg glass-input text-foreground placeholder-white/50"
                  />
                </div>
                <button type="submit" disabled={addingEvent} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium disabled:opacity-50 w-fit">
                  {addingEvent ? '...' : 'Přidat událost'}
                </button>
              </form>
              {createdEventLink && (
                <div className="mb-6 p-4 rounded-xl bg-accent/20 border border-accent/40">
                  <p className="text-foreground font-medium mb-2">Odkaz pro potvrzení účasti (hráči před událostí řeknou, zda přijdou):</p>
                  <div className="flex flex-wrap items-center gap-2">
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
                          alert('Odkaz zkopírován do schránky');
                        } catch {
                          alert('Kopírování se nepovedlo');
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium"
                    >
                      Kopírovat
                    </button>
                    <a
                      href={createdEventLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-surface-hover hover:bg-white/20 rounded-lg text-foreground text-sm font-medium"
                    >
                      Otevřít v novém okně
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
                    () => alert('Odkaz zkopírován'),
                    () => alert('Kopírování se nepovedlo')
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
                          <span className="text-foreground">
                            {formatEventDateTime(ev.date, ev.startTime)} – {EVENT_TYPE_LABELS[ev.eventType]}
                            {ev.location && ` • ${ev.location}`}
                            {ev.opponent && ev.opponent !== ev.location && ` vs ${ev.opponent}`}
                            {ev.note && (
                              <span className="block text-foreground/70 text-sm mt-0.5">{ev.note}</span>
                            )}
                          </span>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openUcastModal(ev)}
                            className="text-blue-400 hover:text-blue-300 text-sm px-2 py-1"
                            title="Odkaz pro hráče + přehled, kdo se hlásí (do půlnoci před událostí)"
                          >
                            Účast
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
                <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">Účast na tréninzích vs výkonnost na zápasech</h2>
                <p className="text-foreground/60 text-sm mb-4">
                  Porovnání % účasti na tréninzích s průměrným hodnocením v zápasech.
                </p>
                <div className="space-y-3">
                  {attendanceStats
                    .filter((s) => s.trainingCount > 0 || s.matchCount > 0)
                    .sort((a, b) => b.attendancePct - a.attendancePct)
                    .map((s) => (
                      <div key={s.playerId} className="space-y-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-foreground font-medium">{s.playerName}</span>
                          <span className="text-foreground/60">
                            účast {s.attendancePct}%
                            {s.trainingCount > 0 ? ` (${Math.round((s.attendancePct / 100) * s.trainingCount)}/${s.trainingCount})` : ''}
                            {' · '}zápas {s.avgMatchScore}/10
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex gap-2 items-center">
                            <span className="text-foreground/75 text-xs w-12">Účast</span>
                            <div className="flex-1 h-4 rounded-full bg-surface-hover overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-lime-400 rounded-full"
                                style={{ width: `${s.attendancePct}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className="text-foreground/75 text-xs w-12">Zápas</span>
                            <div className="flex-1 h-4 rounded-full bg-surface-hover overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-lime-400 rounded-full opacity-90"
                                style={{ width: `${(s.avgMatchScore / 10) * 100}%` }}
                              />
                            </div>
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
            <TacticsBoard players={players.map((p) => ({ id: p.id, name: p.name }))} />
          </div>
        )}

        {ucastModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm" onClick={() => setUcastModal(null)}>
            <div className="glass-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-border" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Účast – kdo se hlásí
              </h3>
              <p className="text-foreground/70 text-sm mb-2">
                {formatEventDateTime(ucastModal.date, ucastModal.startTime)} – {EVENT_TYPE_LABELS[ucastModal.eventType]}
              </p>
              {(ucastModal.location || ucastModal.note) && (
                <div className="text-foreground/70 text-sm mb-4 space-y-1">
                  {ucastModal.location && <p>{ucastModal.location}</p>}
                  {ucastModal.note && <p className="italic">Poznámka: {ucastModal.note}</p>}
                </div>
              )}
              {ucastModal.shareToken ? (
                <>
                  <p className="text-foreground/80 text-sm mb-2">Odkaz pro hráče (ohlásí se do půlnoci před událostí):</p>
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
                        navigator.clipboard.writeText(url).then(() => alert('Odkaz zkopírován'), () => alert('Kopírování se nepovedlo'));
                      }}
                      className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shrink-0"
                    >
                      Kopírovat
                    </button>
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
                  {!isUcastClosed(ucastModal.date) && !ucastModalFinalized && (
                    <div className="mb-4 rounded-lg bg-surface p-3 border border-border space-y-3">
                      <p className="text-sm font-medium text-foreground">Potvrdit účast rovnou</p>
                      <div>
                        <label className="block text-foreground/80 text-xs mb-1">Vyberte své jméno</label>
                        <Select
                          value={quickPlayerId || '__none__'}
                          onValueChange={(value) => {
                            setQuickPlayerId(value === '__none__' ? '' : value);
                            setQuickError(null);
                            setQuickSuccess(null);
                          }}
                        >
                          <SelectTrigger className="w-full rounded-lg glass-input text-foreground focus:ring-2 focus:ring-blue-400">
                            <SelectValue placeholder="— Vyberte —" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">— Vyberte —</SelectItem>
                            {players.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-foreground/80 text-xs mb-1">Budu se účastnit</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-sm text-foreground">
                            <input
                              type="radio"
                              name="quick-attending"
                              checked={quickAttending === true}
                              onChange={() => {
                                setQuickAttending(true);
                                setQuickError(null);
                                setQuickSuccess(null);
                              }}
                              className="w-4 h-4"
                            />
                            Ano
                          </label>
                          <label className="flex items-center gap-2 text-sm text-foreground">
                            <input
                              type="radio"
                              name="quick-attending"
                              checked={quickAttending === false}
                              onChange={() => {
                                setQuickAttending(false);
                                setQuickError(null);
                                setQuickSuccess(null);
                              }}
                              className="w-4 h-4"
                            />
                            Ne
                          </label>
                        </div>
                      </div>
                      {quickAttending === false && (
                        <div>
                          <label className="block text-foreground/80 text-xs mb-1">Důvod nepřítomnosti</label>
                          <textarea
                            value={quickAbsenceReason}
                            onChange={(e) => {
                              setQuickAbsenceReason(e.target.value);
                              setQuickError(null);
                              setQuickSuccess(null);
                            }}
                            placeholder="Např. nemoc, práce, dovolená..."
                            className="w-full min-h-[88px] px-3 py-2 rounded-lg glass-input text-foreground placeholder-white/40 resize-y"
                          />
                        </div>
                      )}
                      {quickError && <p className="text-sm text-red-300">{quickError}</p>}
                      {quickSuccess && <p className="text-sm text-[#1f3768] dark:text-accent">{quickSuccess}</p>}
                      <button
                        type="button"
                        onClick={submitQuickAttendance}
                        disabled={quickSubmitting}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium"
                      >
                        {quickSubmitting ? 'Odesílám...' : 'Potvrdit účast'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-amber-400/90 text-sm mb-4">Událost nemá odkaz. Nejprve uložte událost s odkazem pro účast.</p>
              )}
              {isUcastClosed(ucastModal.date) && !ucastModalFinalized && (
                <p className="text-amber-400 text-sm mb-4">Odpovědi se uzavírají den před událostí do půlnoci. Účast již nelze měnit.</p>
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
                    <div key={p.id} className="py-2 px-3 rounded-lg bg-surface flex justify-between items-center">
                      <span className="text-foreground">{p.name}</span>
                      <span className={`${statusClass} font-medium`} title={label}>
                        {status} {label}
                      </span>
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
                {formatEventDateTime(attendanceModal.date, attendanceModal.startTime)} – {EVENT_TYPE_LABELS[attendanceModal.eventType]}
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

export default function HodnoceniHracuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen animated-background py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8">
        <GhostHodnoceni />
      </div>
    }>
      <HodnoceniHracuContent />
    </Suspense>
  );
}
