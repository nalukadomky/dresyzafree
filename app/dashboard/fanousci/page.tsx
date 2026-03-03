'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MotionPage } from '@/components/Motion';

interface FanVoteSummary {
  matchId: string;
  matchDate: string;
  opponent?: string;
  totalVotes: number;
  topPlayer?: string;
}

export default function FanousciPage() {
  const router = useRouter();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [slug, setSlug] = useState('');
  const [votes, setVotes] = useState<FanVoteSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) { router.push('/login'); return; }
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      setTeamId(payload.id);
      setToken(t);
    } catch { router.push('/login'); }
  }, [router]);

  useEffect(() => {
    if (!teamId || !token) return;
    fetch(`/api/teams/${teamId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        setTeamName(d.team?.teamName || d.team?.teamname || '');
        setSlug(d.team?.websiteSlug || d.team?.website_slug || '');
      })
      .catch(() => {});

    fetch(`/api/teams/${teamId}/fan-votes/summary`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { votes: [] })
      .then(d => setVotes(d.votes || []))
      .catch(() => setVotes([]))
      .finally(() => setLoading(false));
  }, [teamId, token]);

  return (
    <MotionPage>
      <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl hover:bg-surface transition-colors text-foreground/50 hover:text-foreground"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">Fanoušci</h1>
            <p className="text-foreground/50 text-sm mt-0.5">Přehled hlasování fanoušků o hráče utkání</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : votes.length > 0 ? (
          <div className="space-y-3">
            {votes.map((v) => (
              <motion.div
                key={v.matchId}
                className="glass-card rounded-2xl p-5 border border-border"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">
                      {v.opponent ? `vs ${v.opponent}` : 'Zápas'}
                    </p>
                    <p className="text-foreground/50 text-sm">{v.matchDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-500 font-bold">{v.totalVotes} hlasů</p>
                    {v.topPlayer && <p className="text-foreground/50 text-sm">{v.topPlayer}</p>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Empty state */
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 mb-6">
              <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Zatím žádná hlasování</h2>
            <p className="text-foreground/50 max-w-md mx-auto mb-8">
              Hlasování se automaticky spustí po každém zápase. Fanoušci mohou hlasovat na vašem týmovém webu až 48 hodin po zápase.
            </p>
            {slug ? (
              <div className="space-y-3">
                <p className="text-foreground/40 text-sm">Odkaz pro fanoušky:</p>
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border">
                  <span className="text-foreground/70 text-sm font-mono">
                    mypitch.cz/{slug}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(`https://mypitch.cz/${slug}`)}
                    className="text-amber-500 hover:text-amber-400 transition-colors"
                    title="Kopírovat odkaz"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/dashboard/tymovy-web"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors"
              >
                Nastavit týmový web
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </MotionPage>
  );
}
