'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CountdownTimer from '@/components/CountdownTimer';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Team {
  id: string;
  teamName: string;
  logo?: string;
  jerseyUrl?: string;
  shortsUrl?: string;
  socksUrl?: string;
  deadline?: string;
  tariffValidUntil?: string;
  backgroundColor?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTeamName, setSettingsTeamName] = useState('');
  const [settingsLogoFile, setSettingsLogoFile] = useState<File | null>(null);
  const [settingsLogoPreview, setSettingsLogoPreview] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const teamId = localStorage.getItem('teamId');

    if (!token || !teamId) {
      router.push('/login/team');
      return;
    }

    fetchTeamData(token, teamId);
  }, [router]);

  const fetchTeamData = async (token: string, teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('teamId');
          localStorage.removeItem('userType');
          router.push('/login/team');
          return;
        }
        throw new Error('Chyba při načítání dat');
      }

      const data = await response.json();
      setTeam(data.team);
    } catch (err) {
      setError('Chyba při načítání dat týmu');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('teamId');
    localStorage.removeItem('userType');
    router.push('/');
  };

  const openSettings = () => {
    setSettingsTeamName(team?.teamName || '');
    setSettingsLogoFile(null);
    setSettingsLogoPreview(null);
    setSettingsOpen(true);
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team?.id) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setSavingSettings(true);
    try {
      let logoPath: string | undefined;
      if (settingsLogoFile) {
        const fd = new FormData();
        fd.append('logo', settingsLogoFile);
        const logoRes = await fetch('/api/upload-logo', { method: 'POST', body: fd });
        const logoData = await logoRes.json();
        if (!logoRes.ok) {
          alert(logoData.error || 'Chyba při nahrávání loga');
          setSavingSettings(false);
          return;
        }
        logoPath = logoData.logoPath;
      }
      const updates: Record<string, string | undefined> = {};
      if (settingsTeamName.trim()) updates.teamName = settingsTeamName.trim();
      if (settingsLogoFile) updates.logo = logoPath;
      if (Object.keys(updates).length === 0) {
        setSettingsOpen(false);
        setSavingSettings(false);
        return;
      }
      const res = await fetch(`/api/teams/${team.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team);
        setSettingsOpen(false);
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || 'Chyba při ukládání');
      }
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen animated-background flex items-center justify-center">
        <div className="glass-card rounded-3xl p-12 flex flex-col items-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-white text-lg font-medium">Načítání dat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen animated-background flex items-center justify-center px-4">
        <div className="glass-card rounded-3xl p-8 max-w-md">
          <div className="flex items-center space-x-3 mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-white">Chyba</h2>
          </div>
          <p className="text-red-200 mb-6">{error}</p>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('teamId');
              localStorage.removeItem('userType');
              router.push('/login/team');
            }}
            className="w-full px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-xl transition-all duration-300"
          >
            Zpět na přihlášení
          </button>
        </div>
      </div>
    );
  }

  const bgStyle = team?.backgroundColor ? { background: team.backgroundColor } : undefined;

  return (
    <div className="min-h-screen animated-background py-12 px-4" style={bgStyle}>
      {/* Tlačítko zpět */}
      <Link
        href="/"
        className="fixed top-4 left-4 px-4 py-2.5 glass-card text-white/90 rounded-xl border border-white/10 transition-all duration-200 hover:bg-white/5 hover:text-white flex items-center gap-2 z-10"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Zpět</span>
      </Link>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center space-x-4">
            {team?.logo && (
              <img
                src={team.logo}
                alt={`${team.teamName} logo`}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-white/30"
                loading="lazy"
              />
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                Vítejte, {team?.teamName}
              </h1>
              {team?.id && (
                <p className="text-white/60 text-xs sm:text-sm mt-1">
                  Vaše ID: <span className="font-mono font-semibold break-all">{team.id}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openSettings}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-300 border border-white/20 w-full sm:w-auto flex items-center gap-2"
              aria-label="Nastavení"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Nastavení
            </button>
            <button
              onClick={handleLogout}
              className="px-6 py-2.5 bg-red-500/90 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-red-500/30 w-full sm:w-auto"
              aria-label="Odhlásit se"
            >
              Odhlásit se
            </button>
          </div>
        </div>

        {/* Modální okno Nastavení */}
        {settingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSettingsOpen(false)}>
            <div className="glass-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-semibold text-white mb-4">Nastavení týmu</h2>
              <form onSubmit={saveSettings} className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm mb-1">Název týmu</label>
                  <input
                    type="text"
                    value={settingsTeamName}
                    onChange={(e) => setSettingsTeamName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-input text-white"
                    placeholder="Např. FC Kája"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-1">Logo týmu</label>
                  <div className="flex items-center gap-4">
                    {(settingsLogoPreview || settingsLogoFile || team?.logo) && (
                      <img
                        src={settingsLogoFile ? URL.createObjectURL(settingsLogoFile) : (settingsLogoPreview || team?.logo || '')}
                        alt="Náhled loga"
                        className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                      />
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          setSettingsLogoFile(f || null);
                          setSettingsLogoPreview(f ? URL.createObjectURL(f) : null);
                        }}
                        className="text-white/80 text-sm file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-violet-500 file:text-white file:font-medium"
                      />
                      <p className="text-white/50 text-xs mt-1">Obrázek max. 5 MB. Aktuální logo zůstane, pokud nenahrajete nové.</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setSettingsOpen(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 font-medium">
                    Zrušit
                  </button>
                  <button type="submit" disabled={savingSettings} className="flex-1 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium disabled:opacity-50">
                    {savingSettings ? 'Ukládám...' : 'Uložit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Hodnocení hráčů */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 mb-6 fade-in-up">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Hodnocení hráčů</h2>
          <p className="text-white/70 mb-4">
            Přidejte hráče, zaznamenávejte zápasy a po každém zápase nechte hráče ohodnotit své spoluhráče v procentech.
            Zaznamenávejte tréninky, evidujte účast a sledujte srovnání účasti na tréninzích s výkonností v zápasech.
          </p>
          <Link
            href="/dashboard/hodnoceni-hracu"
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-medium transition-all"
          >
            Hodnocení zápasů a tréninků
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Časovač - Dodání dresů */}
        {team?.deadline && (
          <div className="glass-card rounded-3xl shadow-2xl p-6 sm:p-8 mb-6 fade-in-up">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Dodání dresů</h2>
            <CountdownTimer deadline={team.deadline} />
          </div>
        )}

        {!team?.deadline && (
          <div className="glass-card rounded-3xl shadow-2xl p-6 sm:p-8 mb-6 fade-in-up">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Dodání dresů</h2>
            <p className="text-white/60 italic text-sm sm:text-base">Dodání dresů zatím nebylo nastaveno správcem</p>
          </div>
        )}

        {/* Časovač - Termín tarifů */}
        {team?.tariffValidUntil && (
          <div className="glass-card rounded-3xl shadow-2xl p-6 sm:p-8 mb-6 fade-in-up">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Dresy do výroby už za:</h2>
            <CountdownTimer deadline={team.tariffValidUntil} />
          </div>
        )}

        {/* Doporučit klub */}
        <div className="glass-card rounded-3xl shadow-2xl p-6 sm:p-8 mb-6 fade-in-up">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Doporučit klub</h2>
          <div className="space-y-4">
            <div className="bg-violet-600/20 border border-violet-400/30 rounded-lg p-4">
              <p className="text-white/90 mb-2">
                <strong className="text-white">Jak doporučit klub:</strong>
              </p>
              <ol className="list-decimal list-inside text-white/80 space-y-1 ml-2">
                <li>Dejte svému známému nebo jinému klubu vaše <strong className="text-white">ID: {team?.id}</strong></li>
                <li>Při registraci na této stránce zadají vaše ID do pole "ID doporučujícího týmu"</li>
                <li>Po úspěšné registraci bude v systému vidět, že jste je doporučili</li>
              </ol>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
              <div className="flex-1">
                <p className="text-white/80 text-sm mb-1">Vaše ID pro doporučení:</p>
                <p className="text-2xl font-mono font-bold text-white">{team?.id}</p>
              </div>
              <button
                onClick={async (e) => {
                  if (team?.id) {
                    try {
                      await navigator.clipboard.writeText(team.id);
                      // Zobrazíme toast notifikaci místo alertu
                      const button = e.currentTarget;
                      const originalText = button.textContent;
                      button.textContent = '✓ Zkopírováno';
                      button.classList.add('bg-green-600');
                      setTimeout(() => {
                        if (button) {
                          button.textContent = originalText;
                          button.classList.remove('bg-green-600');
                        }
                      }, 2000);
                    } catch (err) {
                      console.error('Chyba při kopírování:', err);
                    }
                  }
                }}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-all duration-300 font-semibold hover:scale-105"
              >
                Kopírovat ID
              </button>
            </div>
          </div>
        </div>

        {/* Odkazy na dresy */}
        <div className="glass-card rounded-3xl shadow-2xl p-6 sm:p-8 mb-6 fade-in-up">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Odkazy na dresy</h2>
          <div className="space-y-4">
            {team?.jerseyUrl ? (
              <div>
                <p className="text-white/80 mb-2 font-semibold">Dres:</p>
                <a
                  href={team.jerseyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:text-violet-300 underline break-all"
                >
                  {team.jerseyUrl}
                </a>
              </div>
            ) : (
              <div>
                <p className="text-white/80 mb-2 font-semibold">Dres:</p>
                <p className="text-white/60 italic">Odkaz na dres zatím nebyl nastaven správcem</p>
              </div>
            )}

            {team?.shortsUrl ? (
              <div>
                <p className="text-white/80 mb-2 font-semibold">Trenýrky:</p>
                <a
                  href={team.shortsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:text-violet-300 underline break-all"
                >
                  {team.shortsUrl}
                </a>
              </div>
            ) : (
              <div>
                <p className="text-white/80 mb-2 font-semibold">Trenýrky:</p>
                <p className="text-white/60 italic">Odkaz na trenýrky zatím nebyl nastaven správcem</p>
              </div>
            )}

            {team?.socksUrl ? (
              <div>
                <p className="text-white/80 mb-2 font-semibold">Štrupny:</p>
                <a
                  href={team.socksUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:text-violet-300 underline break-all"
                >
                  {team.socksUrl}
                </a>
              </div>
            ) : (
              <div>
                <p className="text-white/80 mb-2 font-semibold">Štrupny:</p>
                <p className="text-white/60 italic">Odkaz na štrupny zatím nebyl nastaven správcem</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

