'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import LoadingSpinner from '@/components/LoadingSpinner';
import { GhostAuthCard } from '@/components/GhostLoader';
import ThemeToggle from '@/components/ThemeToggle';
import { MotionItem, MotionPage } from '@/components/Motion';

function TeamLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      let data: { error?: string; token?: string; team?: { id: string } } = {};
      try {
        data = await response.json();
      } catch {
        // Server vrátil ne-JSON (např. HTML chybovou stránku)
      }

      if (!response.ok) {
        setError(data.error || `Chyba při přihlášení (${response.status})`);
        setLoading(false);
        return;
      }

      // Uložení tokenu do localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userType', 'team');
        if (data.team) {
          localStorage.setItem('teamId', data.team.id);
        }
      }

      // Přesměrování na dashboard
      router.push('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(
        msg?.includes('fetch') || msg?.includes('Failed')
          ? 'Server neodpovídá. Je localhost spuštěný na správném portu?'
          : 'Chyba při komunikaci se serverem'
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-background flex items-center justify-center py-12 px-4">
      {/* Tlačítko zpět + přepínač motivu */}
      <div className="fixed top-4 left-4 right-4 flex justify-between items-center z-10">
        <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
          <Link
            href="/"
            className="px-4 py-2.5 glass-card text-foreground/90 rounded-xl border border-border transition-all duration-200 hover:bg-surface hover:text-foreground flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Zpět</span>
          </Link>
        </motion.div>
        <ThemeToggle />
      </div>

      <MotionPage className="max-w-md w-full glass-card rounded-2xl p-8 md:p-12 relative z-10">
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground text-center mb-8 tracking-tight">
          Přihlášení za klub
        </h1>

        {success && (
          <motion.div
            className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            Registrace proběhla úspěšně! Nyní se můžete přihlásit.
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Uživatelské jméno nebo e-mail */}
          <div>
            <label className="block text-foreground font-semibold mb-2">
              Uživatelské jméno nebo e-mail
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder-muted-foreground focus:outline-none"
              placeholder="Uživatelské jméno nebo e-mail"
              required
            />
          </div>

          {/* Heslo */}
          <div>
            <label className="block text-foreground font-semibold mb-2">
              Heslo
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder-muted-foreground focus:outline-none"
              placeholder="Heslo"
              required
            />
          </div>

          {error && (
            <motion.div
              className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-red-300 mb-1">Chyba</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-violet-500 hover:bg-violet-600 text-white font-semibold text-lg rounded-2xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 modern-button relative overflow-hidden flex items-center justify-center space-x-2"
            whileHover={loading ? undefined : { y: -1.5, scale: 1.01 }}
            whileTap={loading ? undefined : { scale: 0.98 }}
          >
            {loading && <LoadingSpinner size="sm" />}
            <span className="relative z-10">{loading ? 'Přihlašuji...' : 'Přihlásit se'}</span>
          </motion.button>

          <MotionItem delay={0.06}>
            <div className="text-center space-y-2">
              <Link
                href="/register"
                className="text-foreground/80 hover:text-foreground underline block"
              >
                Nemáte účet? Zaregistrujte se
              </Link>
              <Link
                href="/login/admin"
                className="text-foreground/60 hover:text-foreground text-sm underline block"
              >
                Přihlásit se jako administrátor
              </Link>
            </div>
          </MotionItem>
        </form>
      </MotionPage>
    </div>
  );
}

export default function TeamLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen animated-background flex items-center justify-center">
        <GhostAuthCard />
      </div>
    }>
      <TeamLoginContent />
    </Suspense>
  );
}
