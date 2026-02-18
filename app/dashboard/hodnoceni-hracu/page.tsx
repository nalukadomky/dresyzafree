'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

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
}

interface AttendanceStat {
  playerId: string;
  playerName: string;
  attendancePct: number;
  avgMatchScore: number;
  trainingCount: number;
  matchCount: number;
}

type Tab = 'dashboard' | 'manage' | 'vote' | 'leaderboard' | 'calendar';

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
  onUpdated,
}: {
  match: Match;
  teamId: string;
  token: string;
  teamLabel: string;
  opponentLabel: string;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [goalsFor, setGoalsFor] = useState(match.goalsFor ?? '');
  const [goalsAgainst, setGoalsAgainst] = useState(match.goalsAgainst ?? '');
  const [saving, setSaving] = useState(false);
  const editRef = useRef<HTMLSpanElement>(null);
  const saveRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const save = async () => {
    const gf = goalsFor === '' ? undefined : Number(goalsFor);
    const ga = goalsAgainst === '' ? undefined : Number(goalsAgainst);
    if ((gf == null && ga == null) && (match.goalsFor == null && match.goalsAgainst == null)) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/matches/${match.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalsFor: gf, goalsAgainst: ga }),
      });
      if (res.ok) {
        onUpdated();
        setEditing(false);
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
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="text-violet-400 hover:text-violet-300 text-sm px-3 py-1 rounded hover:bg-white/5"
      title={scoreFull ? `${scoreFull} – upravit` : 'Přidat skóre'}
    >
      {scoreShort ?? 'Přidat skóre'}
    </button>
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
    tabParam === 'dashboard' || tabParam === 'calendar' || tabParam === 'vote' || tabParam === 'leaderboard'
      ? tabParam
      : 'dashboard'
  );

  const [teamName, setTeamName] = useState('');
  const [teamBackgroundColor, setTeamBackgroundColor] = useState<string | undefined>();
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
  const [deleteConfirm, setDeleteConfirm] = useState<{ playerId: string; playerName: string } | null>(null);
  const [deleteFeedback, setDeleteFeedback] = useState<string | null>(null);
  const [matchesSeason, setMatchesSeason] = useState<string | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [attendanceModal, setAttendanceModal] = useState<Event | null>(null);
  const [attendanceData, setAttendanceData] = useState<{ playerId: string; attended: boolean }[]>([]);
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
    if (t === 'dashboard' || t === 'calendar' || t === 'vote' || t === 'leaderboard') setTab(t as Tab);
  }, [searchParams]);

  useEffect(() => {
    if (!teamId || !token) return;
    fetchPlayers();
    fetchMatches();
    fetchLeaderboard();
    fetchEvents();
    fetch(`/api/teams/${teamId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok && r.json())
      .then((d) => {
        if (d?.team) {
          if (d.team.teamName) setTeamName(d.team.teamName);
          setTeamBackgroundColor(d.team.backgroundColor);
        }
      })
      .catch(() => {});
  }, [teamId, token]);

  useEffect(() => {
    if ((tab === 'dashboard' || tab === 'calendar') && teamId && token) {
      fetchEvents();
      fetchAttendanceStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, teamId, token]);

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
    const res = await fetch(`/api/teams/${teamId}/ratings`, { headers: { Authorization: `Bearer ${token}` } });
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
    const res = await fetch(`/api/teams/${teamId}/events/${ev.id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      const current = (data.attendance || []) as { playerId: string; attended: boolean }[];
      const byPlayer = Object.fromEntries(current.map((a) => [a.playerId, a.attended]));
      setAttendanceData(
        players.map((p) => ({ playerId: p.id, attended: byPlayer[p.id] ?? false }))
      );
    } else {
      setAttendanceData(players.map((p) => ({ playerId: p.id, attended: false })));
    }
  };

  const saveAttendance = async () => {
    if (!attendanceModal || !teamId || !token) return;
    setAttendanceSaving(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/events/${attendanceModal.id}/attendance`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ attendance: attendanceData }),
      });
      if (res.ok) {
        setAttendanceModal(null);
        fetchAttendanceStats();
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
      prev.map((a) => (a.playerId === playerId ? { ...a, attended: !a.attended } : a))
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
      setDeleteFeedback('success:Hráč byl odstraněn.');
      setTimeout(() => setDeleteFeedback(null), 3000);
    } else {
      setDeleteFeedback('error:Chyba při mazání hráče.');
      setTimeout(() => setDeleteFeedback(null), 3000);
    }
  };

  const addMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatchDate || !teamId || !token) return;
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
      if (res.ok) {
        setNewMatchDate('');
        setNewMatchStartTime('');
        setNewMatchOpponent('');
        await fetchMatches();
      } else {
        const d = await res.json();
        alert(d.error || 'Chyba');
      }
    } finally {
      setAddingMatch(false);
    }
  };

  const deleteMatch = async (matchId: string) => {
    if (!confirm('Opravdu smazat zápas?')) return;
    const res = await fetch(`/api/teams/${teamId}/matches/${matchId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) await fetchMatches();
  };

  const otherPlayers = voterId ? players.filter((p) => p.id !== voterId) : [];
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
  const canSubmit = voterId && matchId && otherPlayers.length > 0 && allRated;

  const submitVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !token) return;
    if (!voterId || !matchId) {
      setShowVoteValidation(true);
      alert('Je potřeba zvolit, kdo hlasuje, a vybrat zápas.');
      return;
    }
    if (!canSubmit) return;
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
        fetchLeaderboard();
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
      className="min-h-screen animated-background py-12 px-4 relative"
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
        className="fixed top-4 left-4 px-4 py-2.5 glass-card text-white/90 rounded-xl border border-white/10 hover:bg-white/5 flex items-center gap-2 z-10"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Zpět
      </Link>

      <div className="max-w-2xl mx-auto relative z-10">
        <h1 className="text-2xl font-semibold text-white mb-6">Hodnocení hráčů</h1>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(['dashboard', 'manage', 'vote', 'leaderboard', 'calendar'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                tab === t
                  ? 'bg-violet-500/30 text-white border border-violet-400/50'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
              }`}
            >
              {t === 'dashboard' && 'Přehled'}
              {t === 'manage' && 'Hráči a zápasy'}
              {t === 'vote' && 'Hlasovat'}
              {t === 'leaderboard' && 'Žebříček'}
              {t === 'calendar' && 'Události'}
            </button>
          ))}
        </div>

        {tab === 'dashboard' && (
          <div className="space-y-6">
            {/* Následující události */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Následující události</h2>
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
                        {upcomingEvents.slice(0, 5).map((ev) => (
                          <div
                            key={ev.id}
                            className="flex justify-between items-center py-2 px-3 rounded-lg bg-white/5 border border-white/10 mb-2"
                          >
                            <span className="text-white">
                              {new Date(ev.date).toLocaleDateString('cs-CZ')}
                              {ev.startTime ? ` ${ev.startTime}` : ''} – {EVENT_TYPE_LABELS[ev.eventType]}
                              {ev.location && ` • ${ev.location}`}
                              {ev.opponent && ev.opponent !== ev.location && ` vs ${ev.opponent}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => openAttendanceModal(ev)}
                              className="text-violet-400 hover:text-violet-300 text-sm"
                            >
                              Účast
                            </button>
                          </div>
                        ))}
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
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-2">Forma týmu a hráčů</h2>
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
                    const wins = recentMatches.filter(
                      (m) => m.goalsFor != null && m.goalsAgainst != null && m.goalsFor > m.goalsAgainst
                    ).length;
                    const draws = recentMatches.filter(
                      (m) => m.goalsFor != null && m.goalsAgainst != null && m.goalsFor === m.goalsAgainst
                    ).length;
                    const losses = recentMatches.filter(
                      (m) => m.goalsFor != null && m.goalsAgainst != null && m.goalsFor < m.goalsAgainst
                    ).length;

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
                            {recentMatches.length > 0 && (
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
          <div className="glass-card rounded-2xl p-6 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Hráči týmu</h2>
              <form onSubmit={addPlayer} className="flex gap-2 mb-4">
                <input
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
                  <li key={p.id} className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-white">{p.name}</span>
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
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h2 className="text-lg font-semibold text-white">Zápasy</h2>
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
              <form onSubmit={addMatch} className="flex flex-col sm:flex-row gap-2 mb-4">
                <input
                  type="date"
                  value={newMatchDate}
                  onChange={(e) => setNewMatchDate(e.target.value)}
                  className="px-4 py-2 rounded-lg glass-input text-white"
                  required
                />
                <input
                  type="time"
                  value={newMatchStartTime}
                  onChange={(e) => setNewMatchStartTime(e.target.value)}
                  className="px-4 py-2 rounded-lg glass-input text-white"
                  title="Čas začátku"
                />
                <input
                  type="text"
                  value={newMatchOpponent}
                  onChange={(e) => setNewMatchOpponent(e.target.value)}
                  placeholder="Soupeř (volitelně)"
                  className="flex-1 px-4 py-2 rounded-lg glass-input text-white placeholder-white/50"
                />
                <button type="submit" disabled={addingMatch} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-medium disabled:opacity-50">
                  {addingMatch ? '...' : 'Přidat zápas'}
                </button>
              </form>
              <ul className="space-y-2">
                {filteredMatches.map((m) => (
                  <li key={m.id} className="flex justify-between items-center py-2 border-b border-white/10 gap-2">
                    <span className="text-white">
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
                    <div className="flex items-center gap-1">
                      <MatchResultEdit
                        match={m}
                        teamId={teamId!}
                        token={token!}
                        teamLabel={teamName || 'Náš tým'}
                        opponentLabel={m.opponent || 'Soupeř'}
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
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === 'vote' && (
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Ohodnotit hráče po zápase</h2>
            <p className="text-white/60 text-sm mb-4">
              Vyberte sebe (hlasujícího), zápas a ohodnoťte spoluhráče škálou 0–10 (0 = nebyl nasazen, 10 = nejlepší). Nemůžete hodnotit sám sebe.
            </p>
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
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Za který zápas?</label>
                <select
                  value={matchId}
                  onChange={(e) => {
                    setMatchId(e.target.value);
                    setShowVoteValidation(false);
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
                </select>
              </div>
              {otherPlayers.length > 0 && (
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
                            <span className="text-white font-medium">{p.name}</span>
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
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="w-full py-3 bg-violet-500 hover:bg-violet-600 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && <LoadingSpinner size="sm" />}
                <span>{submitting ? 'Odesílám...' : 'Odeslat hodnocení'}</span>
              </button>
            </form>
          </div>
        )}

        {tab === 'leaderboard' && (
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Žebříček hráčů</h2>
            <p className="text-white/60 text-sm mb-4">
              Průměrné hodnocení od spoluhráčů po zápasech. Čím více hlasů, tím reprezentativnější.
            </p>
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

        {tab === 'calendar' && (
          <div className="space-y-6">
            {calendarError && (
              <div className="glass-card rounded-2xl p-4 border border-amber-500/50 bg-amber-500/10">
                <p className="text-amber-200 text-sm">{calendarError}</p>
              </div>
            )}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-3">Kalendář událostí</h2>
              <p className="text-white/60 text-sm mb-4">
                Přidejte tréninky a zápasy (přátelské/mistrovské). Kliknutím na událost zaznamenáte účast hráčů.
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
                        <button type="button" onClick={() => deleteEvent(ev.id)} className="text-red-400 hover:text-red-300 text-sm shrink-0">
                          Smazat
                        </button>
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
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-2">Účast na tréninzích vs výkonnost na zápasech</h2>
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

        {attendanceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setAttendanceModal(null)}>
            <div className="glass-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-white mb-2">
                Účast – {new Date(attendanceModal.date).toLocaleDateString('cs-CZ')}
                {attendanceModal.startTime ? ` ${attendanceModal.startTime}` : ''} {EVENT_TYPE_LABELS[attendanceModal.eventType]}
              </h3>
              {(attendanceModal.location || attendanceModal.note) && (
                <div className="text-white/70 text-sm mb-4 space-y-1">
                  {attendanceModal.location && <p>{attendanceModal.location}</p>}
                  {attendanceModal.note && <p className="italic">Poznámka: {attendanceModal.note}</p>}
                </div>
              )}
              <p className="text-white/60 text-sm mb-4">Zaklikněte hráče, kteří se zúčastnili:</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {players.map((p) => {
                  const a = attendanceData.find((x) => x.playerId === p.id);
                  const attended = a?.attended ?? false;
                  return (
                    <label key={p.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attended}
                        onChange={() => toggleAttendance(p.id)}
                        className="w-5 h-5 rounded accent-violet-500"
                      />
                      <span className="text-white">{p.name}</span>
                    </label>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setAttendanceModal(null)} className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 font-medium">
                  Zavřít
                </button>
                <button type="button" onClick={saveAttendance} disabled={attendanceSaving} className="flex-1 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium disabled:opacity-50">
                  {attendanceSaving ? 'Ukládám...' : 'Uložit účast'}
                </button>
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
