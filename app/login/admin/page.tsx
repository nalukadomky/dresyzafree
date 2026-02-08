'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    username: 'lasak.design@gmail.com',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Chyba při přihlášení');
        setLoading(false);
        return;
      }

      // Uložení tokenu do localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userType', 'admin');
      }

      // Přesměrování na admin panel
      router.push('/admin');
    } catch (err) {
      setError('Chyba při komunikaci se serverem');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-background flex items-center justify-center py-12 px-4">
      {/* Tlačítko zpět */}
      <Link
        href="/"
        className="fixed top-4 left-4 px-4 py-2 glass-card text-white rounded-xl border border-white/20 transition-all duration-300 hover:scale-105 hover:border-white/40 flex items-center space-x-2 z-10 shadow-lg"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Zpět</span>
      </Link>

      <div className="max-w-md w-full glass-card rounded-3xl shadow-2xl p-8 md:p-12 relative z-10 fade-in-up">
        <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-8">
          Přihlášení administrátora
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Uživatelské jméno */}
          <div>
            <label className="block text-white font-semibold mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-3 rounded-xl glass-input text-white placeholder-white/50 focus:outline-none"
              placeholder="E-mail administrátora"
              required
            />
          </div>

          {/* Heslo */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Heslo
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 rounded-xl glass-input text-white placeholder-white/50 focus:outline-none"
              placeholder="Heslo"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-lg rounded-2xl shadow-[0_0_25px_rgba(59,130,246,0.4)] transform transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(59,130,246,0.6)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 modern-button relative overflow-hidden"
          >
            <span className="relative z-10">{loading ? 'Přihlašuji...' : 'Přihlásit se'}</span>
          </button>

          <div className="text-center">
            <Link
              href="/login/team"
              className="text-white/60 hover:text-white text-sm underline"
            >
              Přihlásit se za klub
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

