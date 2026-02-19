'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import TacticsBoard from '@/components/TacticsBoard';

interface Player {
  id: string;
  teamId: string;
  name: string;
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
          <span className="text-white/70 text-xs">{teamLabel}</span>
          <input
            type="number"
            min={0}
            value={goalsFor}
            onChange={(e) => setGoalsFor(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="0"
            className="w-12 px-2 py-1 rounded glass-input text-white text-sm text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            autoFocus
          />
        </span>
        <span className="text-white/60 text-lg pt-4">:</span>
        <span className="flex flex-col items-center gap-0.5">
          <span className="text-white/70 text-xs">{opponentLabel}</span>
          <input
            type="number"
            min={0}
            value={goalsAgainst}
            onChange={(e) => setGoalsAgainst(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="0"
            className="w-12 px-2 py-1 rounded glass-input text-white text-sm text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
            className="text-white/60 hover:text-white text-xs"
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
        className="text-violet-400 hover:text-violet-300 text-sm px-3 py-1 rounded hover:bg-white/5"
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

const RATING_EMOJI: Record<number, string> = {
  0: '—',
  1: '😞',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
  6: '👍',
  7: '💪',
  8: '⭐',
  9: '🔥',
  10: '🚀',
};

function HodnoceniHracuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>(
    tabParam === 'dashboard' || tabParam === 'calendar' || tabParam === 'vote' || tabParam === 'leaderboard' || tabParam === 'canadian' || tabParam === 'taktika'
      ? tabParam as Tab
      : 'dashboard'
  );

  const [teamName, setTeamName] = useState('');
  const [teamBackgroundColor, setTeamBackgroundColor] = useState<string | undefined>();
  const [coachPlayerId, setCoachPlayerId] = useState<string | null>(null);
  const [savingCoach, setSavingCoach] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

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
  const [playersListExpanded, setPlayersListExpanded] = useState(false);
  const newPlayerInputRef = useRef<HTMLInputElement>(null);
  const [matchScorersSaving, setMatchScorersSaving] = useState<string | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
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

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'dashboard' || t === 'calendar' || t === 'vote' || t === 'leaderboard' || t === 'canadian' || t === 'taktika') setTab(t as Tab);
  }, [searchParams]);

  useEffect(() => {
    if (!teamId || !token) return;
    fetchPlayers();
    fetchMatches();
    fetchEvents();
    fetch(`/api/teams/${teamId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok && r.json())
      .then((d) => {
        if (d?.team) {
          if (d.team.teamName) setTeamName(d.team.teamName);
          setTeamBackgroundColor(d.team.backgroundColor);
          setCoachPlayerId(d.team.coachPlayerId ?? null);
        }
      })
      .catch(() => {});
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
    if (!newEventDate || !teamId || !token) return;
    setAddingEvent(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/events`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          date: newEventDate,
          eventType: newEventType,
          location: newEventLocation.trim() || undefined,
          opponent: (newEventType !== 'training' ? newEventOpponent : undefined)?.trim() || undefined,
          startTime: newEventStartTime.trim() || undefined,
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

  const openAttendanceModal = async (ev: Event) => {
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
    setAddingMatch(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/matches`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          date: newMatchDate,
          opponent: newMatchOpponent.trim() || undefined,
          startTime: newMatchStartTime.trim() || undefined,
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

  const toggleMatchExpand = async (m: Match) => {
    if (expandedMatchId === m.id) {
      setExpandedMatchId(null);
      return;
    }
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
        const d = await res.json();
        alert(d.error || 'Chyba');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !teamId) {
    return (
      <div className="min-h-screen animated-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="glass-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-2">Odstranit hráče</h3>
            <p className="text-white/80 mb-6">
              Opravdu odstranit hráče „{deleteConfirm.playerName}"?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-5 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors font-medium whitespace-nowrap"
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
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl text-white font-medium shadow-lg border border-white/20 whitespace-nowrap ${
            deleteFeedback.startsWith('success:') ? 'bg-green-600/95' : 'bg-red-600/95'
          }`}
        >
          {deleteFeedback.replace(/^(success|error):/, '')}
        </div>
      )}

      <Link
        href="/dashboard"
        className="fixed top-3 left-3 sm:top-4 sm:left-4 px-3 py-2 sm:px-4 sm:py-2.5 glass-card text-white/90 rounded-xl border border-white/10 hover:bg-white/5 flex items-center gap-2 z-10 text-sm sm:text-base"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Zpět
      </Link>

      <div className="w-full max-w-7xl mx-auto relative z-10 pt-12 sm:pt-14">
        <h1 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">Hodnocení hráčů</h1>

        <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1 -mx-1 flex-nowrap sm:flex-wrap">
          {(['dashboard', 'manage', 'vote', 'leaderboard', 'canadian', 'calendar', 'taktika'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 px-3 py-2 sm:px-4 rounded-xl font-medium transition-all text-sm sm:text-base ${
                tab === t
                  ? 'bg-violet-500/30 text-white border border-violet-400/50'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
              }`}
            >
              {t === 'dashboard' && 'Přehled'}
              {t === 'manage' && 'Hráči a zápasy'}
              {t === 'vote' && 'Hlasovat'}
              {t === 'leaderboard' && 'Žebříček'}
              {t === 'canadian' && 'Kanadské bodování'}
              {t === 'calendar' && 'Události/docházka'}
              {t === 'taktika' && 'Taktika'}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {/* Poslední odehraný zápas */}
            {(() => {
              const today = new Date().toISOString().slice(0, 10);
              const pastMatches = matches.filter((m) => m.date < today).sort((a, b) => b.date.localeCompare(a.date));
              const lastMatch = pastMatches[0];
              if (!lastMatch) return null;
              const scoreStr =
                lastMatch.goalsFor != null && lastMatch.goalsAgainst != null
                  ? `${teamName || 'Náš tým'} ${lastMatch.goalsFor} : ${lastMatch.goalsAgainst} ${lastMatch.opponent || 'Soupeř'}`
                  : lastMatch.result || '—';
              const pom = lastMatch.playerOfMatch;
              return (
                <div className="glass-card rounded-2xl p-4 sm:p-6 border border-amber-500/30 bg-amber-500/5 col-span-full">
                  <h2 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">Poslední odehraný zápas</h2>
                  <div className="space-y-1">
                    <p className="text-white font-medium">
                      {new Date(lastMatch.date).toLocaleDateString('cs-CZ')}
                      {lastMatch.startTime ? ` ${lastMatch.startTime}` : ''} vs {lastMatch.opponent || 'soupeř'}
                    </p>
                    <p className="text-violet-400 font-semibold text-lg">{scoreStr}</p>
                    {pom && (
                      <p className="text-amber-400 font-medium flex items-center gap-1.5 mt-2">
                        <span aria-hidden>⭐</span> Hráč utkání: {pom.playerName}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Následující události */}
            <div className="glass-card rounded-2xl p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Následující události</h2>
              {(() => {
                const today = new Date().toISOString().slice(0, 10);
                const upcomingEvents = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
                const upcomingMatches = matches.filter((m) => m.date >= today).sort((a, b) => a.date.localeCompare(b.date));
                const hasUpcoming = upcomingEvents.length > 0 || upcomingMatches.length > 0;

                if (!hasUpcoming) {
                  return <p className="text-white/50 italic">Zatím žádné nadcházející události ani zápasy.</p>;
                }

                return (
                  <div className="space-y-4">
                    {upcomingEvents.length > 0 && (
                      <div>
                        {upcomingEvents.slice(0, 5).map((ev) => {
                          const sum = eventAttendanceSummary[ev.id];
                          return (
                            <div
                              key={ev.id}
                              className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 px-3 rounded-lg bg-white/5 border border-white/10 mb-2 gap-2"
                            >
                              <span className="text-white text-sm sm:text-base min-w-0">
                                {new Date(ev.date).toLocaleDateString('cs-CZ')}
                                {ev.startTime ? ` ${ev.startTime}` : ''} – {EVENT_TYPE_LABELS[ev.eventType]}
                                {ev.location && ` • ${ev.location}`}
                                {ev.opponent && ev.opponent !== ev.location && ` vs ${ev.opponent}`}
                              </span>
                              <div className="flex items-center gap-3 shrink-0">
                                {sum && (
                                  <span className="text-white/60 text-xs tabular-nums whitespace-nowrap" title="zúčastní • nezúčastní • neodpověděli">
                                    {sum.attended}✓ {sum.notAttended}✗ {sum.noResponse}?
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openAttendanceModal(ev)}
                                  className="text-violet-400 hover:text-violet-300 text-sm"
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
                            className="text-white/60 hover:text-white text-sm mt-2"
                          >
                            Zobrazit všech {upcomingEvents.length} událostí →
                          </button>
                        )}
                      </div>
                    )}
                    {upcomingMatches.length > 0 && (
                      <div>
                        <h3 className="text-white/70 text-sm font-medium mb-2">Zápasy</h3>
                        {upcomingMatches.slice(0, 3).map((m) => (
                          <div
                            key={m.id}
                            className="py-2 px-3 rounded-lg bg-white/5 border border-white/10 mb-2 text-white"
                          >
                            {new Date(m.date).toLocaleDateString('cs-CZ')}
                            {m.startTime ? ` ${m.startTime}` : ''} vs {m.opponent || 'soupeř'}
                          </div>
                        ))}
                        {upcomingMatches.length > 3 && (
                          <p className="text-white/50 text-sm mt-1">+ {upcomingMatches.length - 3} dalších</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Graf formy */}
            <div className="glass-card rounded-2xl p-4 sm:p-6 lg:col-span-2 xl:col-span-2">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-2">Forma týmu a hráčů</h2>
              <p className="text-white/60 text-sm mb-4">
                Na základě účasti na tréninzích, hodnocení ze zápasů a výsledků.
              </p>
              {attendanceStats.length === 0 ? (
                <p className="text-white/50 italic text-sm">
                  Zatím nemáte dostatek dat. Přidejte tréninky, zaznamenávejte účast a hlasujte po zápasech.
                </p>
              ) : (
                <div className="space-y-6">
                  {/* Tým – průměr */}
                  {(() => {
                    const withData = attendanceStats.filter((s) => s.trainingCount > 0 || s.matchCount > 0);
                    if (withData.length === 0)
                      return (
                        <p className="text-white/50 italic text-sm">Zatím žádná data pro výpočet formy.</p>
                      );
                    const avgAttendance =
                      withData.reduce((a, s) => a + s.attendancePct, 0) / withData.length;
                    const withMatches = withData.filter((s) => s.matchCount > 0);
                    const avgScore =
                      withMatches.length > 0
                        ? withMatches.reduce((a, s) => a + s.avgMatchScore, 0) / withMatches.length
                        : 0;
                    const formScore = Math.round(
                      (avgAttendance / 100) * 50 + (avgScore / 10) * 50
                    );

                    const recentMatches = matches
                      .filter((m) => m.date <= new Date().toISOString().slice(0, 10))
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .slice(0, 5);
                    const matchesWithScore = recentMatches.filter(
                      (m) => m.goalsFor != null && m.goalsAgainst != null
                    );
                    const wins = matchesWithScore.filter((m) => m.goalsFor! > m.goalsAgainst!).length;
                    const draws = matchesWithScore.filter((m) => m.goalsFor === m.goalsAgainst).length;
                    const losses = matchesWithScore.filter((m) => m.goalsFor! < m.goalsAgainst!).length;

                    return (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-white/80 font-medium mb-2 text-sm">Forma týmu</h3>
                          <div className="flex gap-4 flex-wrap">
                            <div className="flex-1 min-w-[120px]">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-white/70">Forma</span>
                                <span className="text-violet-400 font-semibold">{formScore} %</span>
                              </div>
                              <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full transition-all"
                                  style={{ width: `${Math.min(100, formScore)}%` }}
                                />
                              </div>
                            </div>
                            {matchesWithScore.length > 0 && (
                              <div className="text-white/70 text-sm">
                                Poslední zápasy: {wins}V {draws}R {losses}P
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Jednotliví hráči */}
                        <div>
                          <h3 className="text-white/80 font-medium mb-2 text-sm">Forma hráčů</h3>
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {attendanceStats
                              .filter((s) => s.trainingCount > 0 || s.matchCount > 0)
                              .sort((a, b) => {
                                const fa = (a.attendancePct / 100) * 50 + (a.avgMatchScore / 10) * 50;
                                const fb = (b.attendancePct / 100) * 50 + (b.avgMatchScore / 10) * 50;
                                return fb - fa;
                              })
                              .map((s) => {
                                const formPct = Math.round(
                                  (s.attendancePct / 100) * 50 + (s.avgMatchScore / 10) * 50
                                );
                                return (
                                  <div key={s.playerId} className="space-y-1">
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-white font-medium">{s.playerName}</span>
                                      <span className="text-violet-400 tabular-nums">
                                        {formPct}% (účast {s.attendancePct}%, zápas {s.avgMatchScore}/10)
                                      </span>
                                    </div>
                                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                      <div
                                        className="h-full bg-violet-500/80 rounded-full transition-all"
                                        style={{ width: `${Math.min(100, formPct)}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'manage' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <div className="glass-card rounded-2xl p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setPlayersListExpanded((prev) => !prev)}
                  className="flex items-center gap-2 text-left group"
                >
                  <span className="inline-block w-5 text-white/60">{playersListExpanded ? '▼' : '▶'}</span>
                  <h2 className="text-lg font-semibold text-white group-hover:text-white/90">
                    Hráči týmu
                    {!playersListExpanded && <span className="font-normal text-white/60 ml-1">({players.length})</span>}
                  </h2>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlayersListExpanded(true);
                    setTimeout(() => newPlayerInputRef.current?.focus(), 50);
                  }}
                  className="shrink-0 px-3 py-1.5 text-sm rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium"
                >
                  Přidat hráče
                </button>
              </div>

              {playersListExpanded && (
              <>
              <div className="mb-4">
                <label className="block text-white/80 text-sm mb-1">Trenér (30&nbsp;% větší vliv na žebříček)</label>
                <select
                  value={coachPlayerId ?? ''}
                  onChange={(e) => setCoach(e.target.value || null)}
                  disabled={savingCoach}
                  className="px-4 py-2 rounded-lg glass-input text-white w-full max-w-xs disabled:opacity-50"
                >
                  <option value="">— Bez trenéra</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {savingCoach && <span className="text-white/50 text-sm ml-2">Ukládám...</span>}
              </div>

              <form onSubmit={addPlayer} className="flex gap-2 mb-4">
                <input
                  ref={newPlayerInputRef}
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Jméno hráče"
                  className="flex-1 px-4 py-2 rounded-lg glass-input text-white placeholder-white/50"
                  required
                />
                <button type="submit" disabled={addingPlayer} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-medium disabled:opacity-50">
                  {addingPlayer ? '...' : 'Přidat'}
                </button>
              </form>
              <ul className="space-y-2">
                {players.map((p) => (
                  <li key={p.id} className="flex justify-between items-center py-2 border-b border-white/10 gap-2">
                    <span className="text-white flex items-center gap-2">
                      {p.name}
                      {coachPlayerId === p.id && (
                        <span className="text-violet-400 text-xs font-medium">(trenér)</span>
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
              )}
            </div>

            <div className="glass-card rounded-2xl p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h2 className="text-base sm:text-lg font-semibold text-white">Zápasy</h2>
                {matchSeasons.length > 1 && (
                  <div className="flex gap-1">
                    {matchSeasons.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setMatchesSeason(s)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedSeason === s
                            ? 'bg-violet-500/50 text-white border border-violet-400/50'
                            : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
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
                  className="px-4 py-2 rounded-lg glass-input text-white min-w-0 sm:min-w-[140px]"
                  required
                />
                <input
                  type="time"
                  value={newMatchStartTime}
                  onChange={(e) => setNewMatchStartTime(e.target.value)}
                  className="px-4 py-2 rounded-lg glass-input text-white min-w-0 sm:min-w-[100px]"
                  title="Čas začátku"
                />
                <input
                  type="text"
                  value={newMatchOpponent}
                  onChange={(e) => setNewMatchOpponent(e.target.value)}
                  placeholder="Soupeř (volitelně)"
                  className="flex-1 min-w-0 px-4 py-2 rounded-lg glass-input text-white placeholder-white/50"
                />
                <button type="submit" disabled={addingMatch} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-medium disabled:opacity-50">
                  {addingMatch ? '...' : 'Přidat zápas'}
                </button>
              </form>
              <ul className="space-y-2">
                {filteredMatches.map((m) => {
                  const goalsFor = m.goalsFor ?? 0;
                  const isExpanded = expandedMatchId === m.id;
                  const scorersData = matchScorersData[m.id];
                  const canExpand = goalsFor > 0;
                  return (
                    <li key={m.id} className="border-b border-white/10">
                      <div
                        className={`flex justify-between items-center py-2 gap-2 ${canExpand ? 'cursor-pointer hover:bg-white/5 rounded-lg -mx-1 px-1' : ''}`}
                        onClick={() => canExpand && toggleMatchExpand(m)}
                        onKeyDown={(e) => canExpand && (e.key === 'Enter' || e.key === ' ') && e.preventDefault()}
                        role={canExpand ? 'button' : undefined}
                        tabIndex={canExpand ? 0 : undefined}
                      >
                        <span className="text-white">
                          {canExpand && (
                            <span className="inline-block w-5 text-white/60">
                              {isExpanded ? '▼' : '▶'}
                            </span>
                          )}
                          {new Date(m.date).toLocaleDateString('cs-CZ')}
                          {m.startTime ? ` ${m.startTime}` : ''}
                          {m.opponent && ` vs ${m.opponent}`}
                          {(m.goalsFor != null && m.goalsAgainst != null) && (
                            <span className="text-violet-400 font-semibold ml-2">
                              ({teamName || 'Náš tým'} {m.goalsFor} : {m.goalsAgainst} {m.opponent || 'Soupeř'})
                            </span>
                          )}
                          {(!m.goalsFor && !m.goalsAgainst) && m.result && (
                            <span className="text-violet-400 font-semibold ml-2">({m.result})</span>
                          )}
                        </span>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
                      {isExpanded && canExpand && scorersData && (
                        <div className="pb-4 pl-6 pr-2 space-y-3" onClick={(e) => e.stopPropagation()}>
                          <p className="text-white/70 text-sm font-medium">Střelci branek a asistence</p>
                          {scorersData.scorers.map((_, i) => (
                            <div key={i} className="flex flex-wrap items-center gap-2">
                              <span className="text-white/60 text-sm w-20">Branka {i + 1}:</span>
                              <select
                                value={scorersData.scorers[i]?.playerId ?? ''}
                                onChange={(e) => setMatchScorer(m.id, i + 1, e.target.value)}
                                className="px-3 py-1.5 rounded-lg glass-input text-white text-sm min-w-[140px]"
                              >
                                <option value="">— Střelec —</option>
                                {players.map((p) => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                              <span className="text-white/50">+</span>
                              <select
                                value={scorersData.assists[i]?.playerId ?? ''}
                                onChange={(e) => setMatchAssist(m.id, i + 1, e.target.value)}
                                className="px-3 py-1.5 rounded-lg glass-input text-white text-sm min-w-[140px]"
                              >
                                <option value="">— Asistence —</option>
                                {players.map((p) => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => saveMatchScorers(m.id)}
                            disabled={matchScorersSaving === m.id}
                            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
                          >
                            {matchScorersSaving === m.id ? 'Ukládám...' : 'Uložit'}
                          </button>
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
            <h2 className="text-base sm:text-lg font-semibold text-white mb-4">Podle vyhodnocení ze zápasu vyhodnoť hráče utkání</h2>
              <p className="text-white/60 text-sm mb-4">
              Vyberte sebe (hlasujícího), zápas a ohodnoťte spoluhráče škálou 0–10 podle výkonu v utkání (0 = nebyl nasazen, 10 = nejlepší). Nemůžete hodnotit sám sebe. Každý hráč může hlasovat jen jednou – po odeslání nelze měnit.
            </p>
            {voteSubmittedSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-400/50 mb-4 flex items-center gap-2">
                <span className="text-emerald-400 text-xl">✓</span>
                <p className="text-emerald-200 font-medium">Hodnocení bylo odesláno.</p>
              </div>
            )}
            <form onSubmit={submitVote} className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Kdo hlasuje?</label>
                <select
                  value={voterId}
                  onChange={(e) => {
                    setVoterId(e.target.value);
                    setShowVoteValidation(false);
                  }}
                  className={`w-full px-4 py-3 rounded-xl glass-input text-white ${showVoteValidation && !voterId ? 'ring-2 ring-red-500 bg-red-500/20' : ''}`}
                  required
                >
                  <option value="">Vyberte sebe</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {coachPlayerId === p.id ? ' (trenér)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Za který zápas?</label>
                <select
                  value={matchId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__add_match__') {
                      setMatchId('');
                      setTab('manage');
                    } else {
                      setMatchId(val);
                      setShowVoteValidation(false);
                    }
                  }}
                  className={`w-full px-4 py-3 rounded-xl glass-input text-white ${showVoteValidation && !matchId ? 'ring-2 ring-red-500 bg-red-500/20' : ''}`}
                  required
                >
                  <option value="">Vyberte zápas</option>
                  {matches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {new Date(m.date).toLocaleDateString('cs-CZ')}
                      {m.startTime ? ` ${m.startTime}` : ''}
                      {m.opponent ? ` vs ${m.opponent}` : ''}
                      {(m.goalsFor != null && m.goalsAgainst != null)
                        ? ` ${m.goalsFor}:${m.goalsAgainst}`
                        : m.result
                          ? ` ${m.result}`
                          : ''}
                    </option>
                  ))}
                  <option value="__add_match__">➕ Přidat zápas</option>
                </select>
              </div>
              {hasVoted && (
                <div className="p-4 rounded-xl bg-amber-500/20 border border-amber-500/40">
                  <p className="text-amber-200 font-medium">Už jste pro tento zápas hlasoval.</p>
                  <p className="text-white/70 text-sm mt-1">Hodnocení nelze měnit.</p>
                </div>
              )}
              {otherPlayers.length > 0 && !hasVoted && (
                <div>
                  <label className="block text-white font-medium mb-3">
                    Hodnocení táhlem (0 = nebyl nasazen, 10 = nejlepší)
                  </label>
                  <div className="space-y-4">
                    {otherPlayers.map((p) => {
                      const val = scores[p.id] ?? 0;
                      return (
                        <div key={p.id} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-white font-medium">
                              {p.name}
                              {coachPlayerId === p.id && (
                                <span className="text-violet-400 text-xs font-medium ml-1">(trenér)</span>
                              )}
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="text-2xl" aria-hidden>{RATING_EMOJI[val]}</span>
                              <span className="text-violet-400 font-semibold tabular-nums">{val === 0 ? '0 (nehrál)' : `${val}/10`}</span>
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
                              className="flex-1 h-3 rounded-full accent-violet-500 bg-white/10"
                            />
                            <span className="text-lg" aria-hidden>🚀</span>
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
                  className="w-full py-3 bg-violet-500 hover:bg-violet-600 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            <h2 className="text-base sm:text-lg font-semibold text-white mb-4">Žebříček hráčů</h2>
            <p className="text-white/60 text-sm mb-4">
              Průměrné hodnocení od spoluhráčů po zápasech. Čím více hlasů, tím reprezentativnější.
            </p>
            {(matchSeasons.length > 0 || matches.length > 0) && (
              <div className="mb-4">
                <label className="block text-white/80 text-sm mb-1">Filtrovat podle</label>
                <select
                  value={leaderboardFilter}
                  onChange={(e) => setLeaderboardFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg glass-input text-white w-full max-w-xs"
                >
                  <option value="">Všechny zápasy (celkový průměr)</option>
                  <optgroup label="Průměr za sezónu">
                    {matchSeasons.map((s) => (
                      <option key={s} value={`season:${s}`}>
                        Sezóna {s}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Za konkrétní zápas">
                    {matches
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((m) => (
                        <option key={m.id} value={`match:${m.id}`}>
                          {new Date(m.date).toLocaleDateString('cs-CZ')}
                          {m.opponent ? ` vs ${m.opponent}` : ''}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>
            )}
            {leaderboard.length === 0 ? (
              <p className="text-white/50 italic">Zatím žádná hodnocení.</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, i) => (
                  <div
                    key={entry.playerId}
                    className="flex justify-between items-center py-3 px-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <span className="text-white font-medium">
                      {i + 1}. {entry.playerName}
                    </span>
                    <div className="text-right">
                      <span className="text-violet-400 font-semibold">{entry.avgScore} / 10</span>
                      <span className="text-white/50 text-sm ml-2">({entry.voteCount} hlasů)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'canadian' && (
          <div className="glass-card rounded-2xl p-4 sm:p-6 overflow-hidden">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-4">Kanadské bodování</h2>
            <p className="text-white/60 text-sm mb-4">
              Góly a asistence našeho týmu. 1 gól = 1b, 1 asistence = 1b. Seřazeno podle celkového součtu.
            </p>
            {(matchSeasons.length > 0 || matches.length > 0) && (
              <div className="mb-4">
                <label className="block text-white/80 text-sm mb-1">Sezóna</label>
                <select
                  value={canadianFilter}
                  onChange={(e) => setCanadianFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg glass-input text-white w-full max-w-xs"
                >
                  <option value="">Všechny zápasy</option>
                  {matchSeasons.map((s) => (
                    <option key={s} value={`season:${s}`}>
                      Sezóna {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {canadianStats.length === 0 ? (
              <p className="text-white/50 italic">Zatím žádné góly ani asistence. Zadejte střelce a asistenty u zápasů.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="py-2 pr-4 text-white/70 font-medium">#</th>
                      <th className="py-2 pr-4 text-white/70 font-medium">Hráč</th>
                      <th className="py-2 pr-4 text-white/70 font-medium text-center">G</th>
                      <th className="py-2 pr-4 text-white/70 font-medium text-center">A</th>
                      <th className="py-2 text-white/70 font-medium text-center">Celkem (1b)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {canadianStats.map((entry, i) => (
                      <tr key={entry.playerId} className="border-b border-white/10">
                        <td className="py-2 pr-4 text-white/60">{i + 1}</td>
                        <td className="py-2 pr-4 text-white font-medium">{entry.playerName}</td>
                        <td className="py-2 pr-4 text-center text-violet-400">{entry.goals}</td>
                        <td className="py-2 pr-4 text-center text-amber-400">{entry.assists}</td>
                        <td className="py-2 text-center text-violet-300 font-semibold">{entry.total}</td>
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
              <h2 className="text-base sm:text-lg font-semibold text-white mb-3">Kalendář událostí</h2>
              <p className="text-white/60 text-sm mb-4">
                Přidejte tréninky a zápasy. „Odkaz“ = hráči potvrdí účast před událostí. „Docházka“ = po uskutečnění události finálně zaznamenáte, kdo skutečně přišel (jednorázové odeslání, nelze měnit).
              </p>
              <form onSubmit={addEvent} className="flex flex-col gap-3 mb-6">
                <div className="flex flex-wrap gap-2">
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="px-4 py-2 rounded-lg glass-input text-white"
                    required
                  />
                  <input
                    type="time"
                    value={newEventStartTime}
                    onChange={(e) => setNewEventStartTime(e.target.value)}
                    className="px-4 py-2 rounded-lg glass-input text-white"
                    title="Čas začátku"
                  />
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value as EventType)}
                    className="px-4 py-2 rounded-lg glass-input text-white"
                  >
                    {(['training', 'friendly_match', 'competitive_match'] as EventType[]).map((t) => (
                      <option key={t} value={t}>
                        {EVENT_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                    placeholder="Místo (volitelně)"
                    className="flex-1 min-w-[140px] px-4 py-2 rounded-lg glass-input text-white placeholder-white/50"
                  />
                  {newEventType !== 'training' && (
                    <input
                      type="text"
                      value={newEventOpponent}
                      onChange={(e) => setNewEventOpponent(e.target.value)}
                      placeholder="Soupeř (volitelně)"
                      className="flex-1 min-w-[120px] px-4 py-2 rounded-lg glass-input text-white placeholder-white/50"
                    />
                  )}
                  <input
                    type="text"
                    value={newEventNote}
                    onChange={(e) => setNewEventNote(e.target.value)}
                    placeholder="Poznámka (volitelně)"
                    className="w-full px-4 py-2 rounded-lg glass-input text-white placeholder-white/50"
                  />
                </div>
                <button type="submit" disabled={addingEvent} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-medium disabled:opacity-50 w-fit">
                  {addingEvent ? '...' : 'Přidat událost'}
                </button>
              </form>
              {createdEventLink && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-400/30">
                  <p className="text-white font-medium mb-2">Odkaz pro potvrzení účasti (hráči před událostí řeknou, zda přijdou):</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdEventLink}
                      className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white/10 text-white text-sm font-mono"
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
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white text-sm font-medium"
                    >
                      Kopírovat
                    </button>
                    <a
                      href={createdEventLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium"
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
                      <li key={ev.id} className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/5 border border-white/10 gap-2">
                        <button
                          type="button"
                          onClick={() => openAttendanceModal(ev)}
                          className="text-left flex-1"
                        >
                          <span className="text-white">
                            {new Date(ev.date).toLocaleDateString('cs-CZ')}
                            {ev.startTime ? ` ${ev.startTime}` : ''} – {EVENT_TYPE_LABELS[ev.eventType]}
                            {ev.location && ` • ${ev.location}`}
                            {ev.opponent && ev.opponent !== ev.location && ` vs ${ev.opponent}`}
                            {ev.note && (
                              <span className="block text-white/70 text-sm mt-0.5">{ev.note}</span>
                            )}
                          </span>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openAttendanceModal(ev)}
                            className="text-emerald-400 hover:text-emerald-300 text-sm px-2 py-1 font-medium"
                            title="Po události: finálně zaznamenat, kdo přišel"
                          >
                            Docházka
                          </button>
                          {ev.shareToken && (
                            <button
                              type="button"
                              onClick={() => copyAttendanceLink(ev)}
                              className="text-violet-400 hover:text-violet-300 text-sm px-2 py-1"
                              title="Kopírovat odkaz pro potvrzení účasti (hráči před událostí)"
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
                  return <p className="text-white/50 italic">Zatím žádné události.</p>;
                }

                const upcomingMonths = toByMonth(upcoming);
                const pastMonths = toByMonth(past);

                return (
                  <div className="space-y-6">
                    {upcoming.length > 0 && (
                      <div>
                        <h3 className="text-white/90 font-semibold mb-3">Následující události</h3>
                        <div className="space-y-4">
                          {upcomingMonths.map(([month, evs]) => (
                            <div key={month}>
                              <h4 className="text-white/70 font-medium mb-2 text-sm">{month}</h4>
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
                          className="flex items-center gap-2 text-white/60 hover:text-white/80 font-medium mb-2 transition-colors"
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
                                <h4 className="text-white/50 font-medium mb-2 text-sm">{month}</h4>
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
                <h2 className="text-base sm:text-lg font-semibold text-white mb-2">Účast na tréninzích vs výkonnost na zápasech</h2>
                <p className="text-white/60 text-sm mb-4">
                  Porovnání % účasti na tréninzích s průměrným hodnocením v zápasech.
                </p>
                <div className="space-y-3">
                  {attendanceStats
                    .filter((s) => s.trainingCount > 0 || s.matchCount > 0)
                    .sort((a, b) => b.attendancePct - a.attendancePct)
                    .map((s) => (
                      <div key={s.playerId} className="space-y-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white font-medium">{s.playerName}</span>
                          <span className="text-white/60">
                            účast {s.attendancePct}%
                            {s.trainingCount > 0 ? ` (${Math.round((s.attendancePct / 100) * s.trainingCount)}/${s.trainingCount})` : ''}
                            {' · '}zápas {s.avgMatchScore}/10
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex gap-2 items-center">
                            <span className="text-emerald-400/80 text-xs w-12">Účast</span>
                            <div className="flex-1 h-4 rounded-full bg-white/10 overflow-hidden">
                              <div className="h-full bg-emerald-500/70 rounded-full" style={{ width: `${s.attendancePct}%` }} />
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className="text-violet-400/80 text-xs w-12">Zápas</span>
                            <div className="flex-1 h-4 rounded-full bg-white/10 overflow-hidden">
                              <div className="h-full bg-violet-500/70 rounded-full" style={{ width: `${(s.avgMatchScore / 10) * 100}%` }} />
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
              <h2 className="text-base sm:text-lg font-semibold text-white">Taktické schéma</h2>
              <p className="text-white/50 text-xs sm:text-sm">
                Přetáhněte hráče na hřiště (max 11). Tužka: kreslení v zelené, červené nebo tmavě žluté.
              </p>
            </div>
            <TacticsBoard players={players.map((p) => ({ id: p.id, name: p.name }))} />
          </div>
        )}

        {attendanceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setAttendanceModal(null)}>
            <div className="glass-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-white mb-2">
                Docházka – finální přehled zúčastněných
              </h3>
              <p className="text-white/70 text-sm mb-2">
                {new Date(attendanceModal.date).toLocaleDateString('cs-CZ')}
                {attendanceModal.startTime ? ` ${attendanceModal.startTime}` : ''} – {EVENT_TYPE_LABELS[attendanceModal.eventType]}
              </p>
              {(attendanceModal.location || attendanceModal.note) && (
                <div className="text-white/70 text-sm mb-4 space-y-1">
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
                <p className="text-white/60 text-sm mb-4">Zaklikněte hráče, kteří skutečně přišli. Odeslání je finální a nelze měnit.</p>
              )}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {players.map((p) => {
                  const a = attendanceData.find((x) => x.playerId === p.id);
                  const attended = a?.attended ?? false;
                  const reason = a?.absenceReason;
                  return (
                    <div key={p.id} className="py-2 px-3 rounded-lg hover:bg-white/5">
                      <label className={`flex items-center gap-3 ${attendanceModalClosed ? 'cursor-default' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          checked={attended}
                          onChange={() => !attendanceModalClosed && toggleAttendance(p.id)}
                          disabled={attendanceModalClosed}
                          className="w-5 h-5 rounded accent-violet-500 disabled:opacity-70"
                        />
                        <span className="text-white">{p.name}</span>
                      </label>
                      {!attended && reason && (
                        <p className="text-white/50 text-xs mt-1 ml-8 italic">Důvod: {reason}</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setAttendanceModal(null)} className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 font-medium">
                  Zavřít
                </button>
                {!attendanceModalClosed && (
                  <button type="button" onClick={saveAttendance} disabled={attendanceSaving} className="flex-1 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium disabled:opacity-50">
                    {attendanceSaving ? 'Odesílám...' : 'Odeslat docházku'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HodnoceniHracuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen animated-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <HodnoceniHracuContent />
    </Suspense>
  );
}
