'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FanVotingContent, LastMatchData } from '@/lib/db-website';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  photoUrl?: string;
}

interface VoteResult {
  playerId: string;
  playerName: string;
  voteCount: number;
}

interface Props {
  content: FanVotingContent;
  lastMatch?: LastMatchData;
  players: Player[];
  primaryColor: string;
  teamName?: string;
  slug?: string;
}

const VOTING_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

function getVoterId(): string {
  const KEY = 'mypitch_fan_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('cs-CZ', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
}

function getDeadline(lastMatch: LastMatchData): Date {
  const base = lastMatch.startTime
    ? new Date(`${lastMatch.date}T${lastMatch.startTime}:00`)
    : new Date(`${lastMatch.date}T23:59:59`);
  return new Date(base.getTime() + VOTING_WINDOW_MS);
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function FanVotingSection({ content, lastMatch, players, primaryColor, teamName, slug }: Props) {
  const isDark = content.variant === 'dark';
  const [voterId, setVoterId] = useState<string | null>(null);
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [results, setResults] = useState<VoteResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [changing, setChanging] = useState(false);
  const [pendingPlayer, setPendingPlayer] = useState<Player | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const totalVotes = results.reduce((sum, r) => sum + r.voteCount, 0);
  const votingOpen = timeLeft !== null && timeLeft > 0;

  // Countdown timer
  useEffect(() => {
    if (!lastMatch) return;
    const deadline = getDeadline(lastMatch);
    const update = () => setTimeLeft(deadline.getTime() - Date.now());
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [lastMatch]);

  const fetchState = useCallback(async (vid: string) => {
    if (!slug || !lastMatch) return;
    try {
      const res = await fetch(`/api/t/${slug}/fan-vote?matchId=${lastMatch.id}&voterId=${vid}`);
      if (!res.ok) return;
      const data = await res.json();
      setResults(data.results || []);
      if (data.votedFor) {
        setVotedFor(data.votedFor);
      }
    } catch {
      // silent
    }
  }, [slug, lastMatch]);

  useEffect(() => {
    const vid = getVoterId();
    setVoterId(vid);
    fetchState(vid);
  }, [fetchState]);

  const handleVote = async (playerId: string) => {
    if (!voterId || !slug || !lastMatch || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/t/${slug}/fan-vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: lastMatch.id, playerId, voterIdentifier: voterId }),
      });
      if (!res.ok) return;
      setVotedFor(playerId);
      setShowPlayerList(false);
      setChanging(false);
      setPendingPlayer(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      await fetchState(voterId);
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  const onPlayerClick = (player: Player) => {
    setPendingPlayer(player);
  };

  const confirmVote = () => {
    if (pendingPlayer) handleVote(pendingPlayer.id);
  };

  // Colors
  const bgPage = isDark ? '#0F172A' : '#F8FAFC';
  const bgCard = isDark ? '#1E293B' : '#FFFFFF';
  const textPrimary = isDark ? '#F1F5F9' : '#1E293B';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const textMuted = isDark ? '#64748B' : '#94A3B8';
  const borderColor = isDark ? '#334155' : '#E2E8F0';
  const bgHover = isDark ? '#0F172A' : '#F8FAFC';
  const bgOverlay = isDark ? 'rgba(15,23,42,0.8)' : 'rgba(0,0,0,0.4)';

  // Determine UI state
  const hasVoted = !!votedFor && !changing;
  const showPicker = showPlayerList || changing;

  return (
    <section className="py-16 px-6" style={{ background: bgPage }}>
      <div className="max-w-3xl mx-auto">
        <h2
          className="text-3xl font-bold mb-8 text-center"
          style={{ color: textPrimary }}
        >
          {content.title || 'Hráč utkání podle fanoušků'}
        </h2>

        {/* No match yet */}
        {!lastMatch ? (
          <div
            className="rounded-2xl p-8 text-center shadow-sm"
            style={{ background: bgCard, border: `1px solid ${borderColor}` }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: `${primaryColor}15` }}
            >
              <svg className="w-8 h-8" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <p className="font-medium" style={{ color: textSecondary }}>
              Zatím žádný ohodnocený zápas
            </p>
            <p className="text-sm mt-1" style={{ color: textMuted }}>
              Hlasování se zobrazí automaticky po zaznamenání výsledku zápasu.
            </p>
          </div>
        ) : (
          <>
            {/* Last match card */}
            <div
              className="rounded-2xl p-5 sm:p-6 shadow-sm"
              style={{ background: bgCard, border: `1px solid ${borderColor}` }}
            >
              {/* Match score */}
              <div className="text-center py-3">
                <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: textMuted }}>
                  Poslední zápas
                </p>
                <div className="flex items-center justify-center gap-4 sm:gap-8">
                  <div className="text-center min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: textPrimary }}>
                      {teamName || 'Náš tým'}
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-xl"
                    style={{ background: `${primaryColor}10` }}
                  >
                    <span className="text-3xl sm:text-4xl font-bold tabular-nums" style={{ color: textPrimary }}>
                      {lastMatch.goalsFor}
                    </span>
                    <span className="text-lg font-light" style={{ color: textMuted }}>:</span>
                    <span className="text-3xl sm:text-4xl font-bold tabular-nums" style={{ color: textPrimary }}>
                      {lastMatch.goalsAgainst}
                    </span>
                  </div>
                  <div className="text-center min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: textPrimary }}>
                      {lastMatch.opponent || 'Soupeř'}
                    </p>
                  </div>
                </div>
                <p className="text-xs mt-3" style={{ color: textMuted }}>
                  {formatDate(lastMatch.date)}
                  {lastMatch.startTime && ` · ${lastMatch.startTime}`}
                </p>
              </div>

              {/* Voting section below match card */}
              {slug && players.length > 0 && voterId && (
                <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${borderColor}` }}>

                  {/* Success toast */}
                  {showSuccess && (
                    <div
                      className="mb-4 px-4 py-3 rounded-xl text-sm font-medium text-center"
                      style={{ background: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e40' }}
                    >
                      ✓ Váš hlas byl odeslán!
                    </div>
                  )}

                  {/* Countdown timer */}
                  {timeLeft !== null && (
                    <div className="text-center mb-4">
                      {votingOpen ? (
                        <p className="text-xs font-medium" style={{ color: textMuted }}>
                          <svg className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Hlasování končí za <span style={{ color: primaryColor, fontWeight: 600 }}>{formatCountdown(timeLeft)}</span>
                        </p>
                      ) : (
                        <p className="text-xs font-medium" style={{ color: textMuted }}>
                          Hlasování ukončeno
                        </p>
                      )}
                    </div>
                  )}

                  {/* State: Not voted yet, no player list open */}
                  {!hasVoted && !showPicker && votingOpen && (
                    <div className="text-center">
                      <p className="text-sm mb-4" style={{ color: textSecondary }}>
                        Kdo byl podle vás nejlepší hráč zápasu?
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowPlayerList(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                        style={{ background: primaryColor }}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                        Zvolit hráče utkání
                      </button>
                    </div>
                  )}

                  {/* State: Player list open for picking */}
                  {showPicker && votingOpen && (
                    <div>
                      <p className="text-sm mb-3 font-medium" style={{ color: textSecondary }}>
                        {changing ? 'Vyberte jiného hráče:' : 'Vyberte nejlepšího hráče:'}
                      </p>
                      <div className="space-y-1.5">
                        {players.map((player) => (
                          <button
                            key={player.id}
                            type="button"
                            onClick={() => onPlayerClick(player)}
                            disabled={submitting}
                            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                            style={{
                              background: bgHover,
                              border: `1px solid ${borderColor}`,
                            }}
                          >
                            {player.photoUrl ? (
                              <div
                                className="w-10 h-10 rounded-full bg-cover bg-center shrink-0"
                                style={{
                                  backgroundImage: `url(${player.photoUrl})`,
                                  border: `2px solid ${primaryColor}`,
                                }}
                              />
                            ) : (
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm"
                                style={{
                                  background: primaryColor,
                                  border: `2px solid ${primaryColor}`,
                                }}
                              >
                                {player.jerseyNumber ?? player.name.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 text-left min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: textPrimary }}>
                                {player.name}
                              </p>
                              {player.jerseyNumber != null && (
                                <p className="text-xs" style={{ color: textMuted }}>
                                  #{player.jerseyNumber}
                                </p>
                              )}
                            </div>
                            <svg className="w-4 h-4 shrink-0" style={{ color: textMuted }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setShowPlayerList(false); setChanging(false); setPendingPlayer(null); }}
                        className="mt-3 text-xs font-medium hover:underline"
                        style={{ color: textMuted }}
                      >
                        Zrušit
                      </button>
                    </div>
                  )}

                  {/* State: Voted — show results */}
                  {hasVoted && results.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: primaryColor }}>
                        Průběžné výsledky
                      </p>
                      <div className="space-y-3">
                        {results.map((r, i) => {
                          const pct = totalVotes > 0 ? Math.round((r.voteCount / totalVotes) * 100) : 0;
                          const isWinner = i === 0 && r.voteCount > 0;
                          const isVoted = r.playerId === votedFor;
                          const player = players.find((p) => p.id === r.playerId);
                          return (
                            <div key={r.playerId} className="flex items-center gap-3">
                              {/* Avatar */}
                              {player?.photoUrl ? (
                                <div
                                  className="w-8 h-8 rounded-full bg-cover bg-center shrink-0"
                                  style={{
                                    backgroundImage: `url(${player.photoUrl})`,
                                    border: isWinner ? `2px solid ${primaryColor}` : `1px solid ${borderColor}`,
                                  }}
                                />
                              ) : (
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                                  style={{
                                    background: isWinner ? primaryColor : `${primaryColor}20`,
                                    color: isWinner ? '#FFFFFF' : primaryColor,
                                    border: isWinner ? `2px solid ${primaryColor}` : `1px solid ${borderColor}`,
                                  }}
                                >
                                  {player?.jerseyNumber ?? r.playerName.charAt(0)}
                                </div>
                              )}
                              {/* Bar + info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium flex items-center gap-1.5 truncate" style={{ color: textPrimary }}>
                                    {r.playerName}
                                    {isVoted && (
                                      <span
                                        className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0"
                                        style={{ background: `${primaryColor}20`, color: primaryColor }}
                                      >
                                        VÁŠ HLAS
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-xs tabular-nums shrink-0 ml-2" style={{ color: textMuted }}>
                                    {pct}%
                                  </span>
                                </div>
                                <div className="h-2 rounded-full overflow-hidden" style={{ background: isDark ? '#0F172A' : '#F1F5F9' }}>
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${pct}%`,
                                      background: isWinner ? primaryColor : `${primaryColor}60`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between mt-5">
                        <p className="text-xs" style={{ color: textMuted }}>
                          Celkem hlasů: {totalVotes}
                        </p>
                        {votingOpen && (
                          <button
                            type="button"
                            onClick={() => setChanging(true)}
                            className="text-xs font-medium hover:underline"
                            style={{ color: primaryColor }}
                          >
                            Změnit hlas
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Confirmation popup */}
      {pendingPlayer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: bgOverlay }}
          onClick={() => setPendingPlayer(null)}
        >
          <div
            className="rounded-2xl p-6 max-w-sm w-full shadow-xl"
            style={{ background: bgCard, border: `1px solid ${borderColor}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-5">
              {pendingPlayer.photoUrl ? (
                <div
                  className="w-16 h-16 rounded-full bg-cover bg-center mx-auto mb-3"
                  style={{
                    backgroundImage: `url(${pendingPlayer.photoUrl})`,
                    border: `3px solid ${primaryColor}`,
                  }}
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-xl"
                  style={{ background: primaryColor }}
                >
                  {pendingPlayer.jerseyNumber ?? pendingPlayer.name.charAt(0)}
                </div>
              )}
              <p className="text-base font-semibold" style={{ color: textPrimary }}>
                Hlasovat pro {pendingPlayer.name}?
              </p>
              <p className="text-sm mt-1" style={{ color: textSecondary }}>
                Chcete zvolit tohoto hráče jako hráče utkání?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPendingPlayer(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ background: isDark ? '#0F172A' : '#F1F5F9', color: textSecondary, border: `1px solid ${borderColor}` }}
              >
                Zrušit
              </button>
              <button
                type="button"
                onClick={confirmVote}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{ background: primaryColor }}
              >
                {submitting ? 'Odesílám...' : 'Potvrdit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
