'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import type { LastMatchContent, PublicMatchData } from '@/lib/db-website';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  photoUrl?: string;
}

interface Props {
  content: LastMatchContent;
  lastMatch: PublicMatchData | null;
  players: Player[];
  primaryColor: string;
  slug?: string;
  isPreview?: boolean;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function LastMatchSection({ content, lastMatch, primaryColor, isPreview }: Props) {
  const isDark = content.variant === 'dark';
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  const bgPage = isDark ? '#0F172A' : '#F8FAFC';
  const bgCard = isDark ? '#1E293B' : '#FFFFFF';
  const textPrimary = isDark ? '#F1F5F9' : '#1E293B';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#334155' : '#E2E8F0';

  if (!lastMatch && !isPreview) return null;

  const hasScore = lastMatch && (lastMatch.goalsFor != null && lastMatch.goalsAgainst != null);

  return (
    <section ref={sectionRef} className="py-16 px-6" style={{ background: bgPage }}>
      <div className="max-w-2xl mx-auto">
        <motion.h2
          className="text-3xl font-bold mb-8 text-center"
          style={{ color: textPrimary }}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {content.title || 'Poslední zápas'}
        </motion.h2>

        {!lastMatch ? (
          <motion.div
            className="rounded-2xl p-8 text-center"
            style={{ background: bgCard, border: `1px solid ${borderColor}` }}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="text-4xl mb-3 opacity-40">⚽</div>
            <p className="font-medium" style={{ color: textSecondary }}>
              Zatím žádný zápas
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="rounded-2xl overflow-hidden"
            style={{ background: bgCard, border: `1px solid ${borderColor}` }}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            {/* Score */}
            <div className="p-6 text-center" style={{ borderBottom: `1px solid ${borderColor}` }}>
              <p className="text-sm mb-3" style={{ color: textSecondary }}>
                {formatDate(lastMatch.date)}
              </p>
              {lastMatch.opponent && (
                <p className="text-lg font-semibold mb-2" style={{ color: textPrimary }}>
                  vs {lastMatch.opponent}
                </p>
              )}
              {hasScore ? (
                <div className="text-5xl font-black tracking-tight" style={{ color: primaryColor }}>
                  {lastMatch.goalsFor} : {lastMatch.goalsAgainst}
                </div>
              ) : (
                <p className="text-lg" style={{ color: textSecondary }}>
                  {lastMatch.result || 'Výsledek nezadán'}
                </p>
              )}
            </div>

            {/* Scorers */}
            {content.showScorers && lastMatch.scorers && lastMatch.scorers.length > 0 && (
              <div className="p-5" style={{ borderBottom: `1px solid ${borderColor}` }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textSecondary }}>
                  Střelci
                </p>
                <div className="space-y-1.5">
                  {lastMatch.scorers.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm" style={{ color: textPrimary }}>
                      <span>⚽</span>
                      <span>{s.playerName}</span>
                    </div>
                  ))}
                </div>
                {lastMatch.assists && lastMatch.assists.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: textSecondary }}>
                      Asistence
                    </p>
                    {lastMatch.assists.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm" style={{ color: textPrimary }}>
                        <span>🅰️</span>
                        <span>{a.playerName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fan votes summary */}
            {content.showVoting && lastMatch.fanVotes && lastMatch.fanVotes.length > 0 && (
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textSecondary }}>
                  Hráč utkání podle fanoušků
                </p>
                <div className="space-y-2">
                  {lastMatch.fanVotes.slice(0, 3).map((v, i) => {
                    const pct = lastMatch.totalVotes > 0 ? Math.round((v.voteCount / lastMatch.totalVotes) * 100) : 0;
                    return (
                      <div key={v.playerId} className="flex items-center gap-3">
                        <span className="text-lg font-bold w-6 text-center" style={{ color: i === 0 ? primaryColor : textSecondary }}>
                          {i + 1}.
                        </span>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span style={{ color: textPrimary, fontWeight: i === 0 ? 600 : 400 }}>{v.playerName}</span>
                            <span style={{ color: textSecondary }}>{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? '#334155' : '#E2E8F0' }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: i === 0 ? primaryColor : (isDark ? '#475569' : '#94A3B8') }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {lastMatch.totalVotes > 0 && (
                  <p className="text-xs mt-3 text-center" style={{ color: textSecondary }}>
                    Celkem hlasů: {lastMatch.totalVotes}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
