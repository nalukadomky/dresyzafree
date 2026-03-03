'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import CountdownTimer from '@/components/CountdownTimer';
import { GhostDashboard } from '@/components/GhostLoader';
import ThemeToggle from '@/components/ThemeToggle';
import { MotionItem, MotionPage } from '@/components/Motion';

interface Team {
  id: string;
  teamName: string;
  contactPerson: string;
  phone: string;
  email: string;
  username: string;
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
  const [settingsContactPerson, setSettingsContactPerson] = useState('');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [settingsEmail, setSettingsEmail] = useState('');
  const [settingsErrors, setSettingsErrors] = useState<Record<string, string>>({});
  const [passwordOld, setPasswordOld] = useState('');
  const [passwordNew, setPasswordNew] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordSectionOpen, setPasswordSectionOpen] = useState(false);
  const [jerseyLeadOpen, setJerseyLeadOpen] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

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
    setSettingsContactPerson(team?.contactPerson || '');
    setSettingsPhone(team?.phone || '');
    setSettingsEmail(team?.email || '');
    setSettingsLogoFile(null);
    setSettingsLogoPreview(null);
    setSettingsErrors({});
    setPasswordOld('');
    setPasswordNew('');
    setPasswordConfirm('');
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordSectionOpen(false);
    setSettingsOpen(true);
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team?.id) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    // Validace
    const errors: Record<string, string> = {};
    if (!settingsContactPerson.trim()) errors.contactPerson = 'Kontaktní osoba je povinná';
    if (!settingsPhone.trim()) {
      errors.phone = 'Telefon je povinný';
    } else if (!/^[\d\s\+\-\(\)]+$/.test(settingsPhone)) {
      errors.phone = 'Telefon obsahuje neplatné znaky';
    }
    if (!settingsEmail.trim()) {
      errors.email = 'E-mail je povinný';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settingsEmail)) {
      errors.email = 'Neplatný formát e-mailu';
    }
    if (Object.keys(errors).length > 0) {
      setSettingsErrors(errors);
      return;
    }
    setSettingsErrors({});

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
      updates.contactPerson = settingsContactPerson.trim();
      updates.phone = settingsPhone.trim();
      updates.email = settingsEmail.trim();

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

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team?.id) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordOld) { setPasswordError('Zadejte současné heslo'); return; }
    if (!passwordNew || passwordNew.length < 6) { setPasswordError('Nové heslo musí mít alespoň 6 znaků'); return; }
    if (passwordNew !== passwordConfirm) { setPasswordError('Hesla se neshodují'); return; }

    setSavingPassword(true);
    try {
      const res = await fetch(`/api/teams/${team.id}/change-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: passwordOld, newPassword: passwordNew }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess('Heslo bylo úspěšně změněno');
        setPasswordOld('');
        setPasswordNew('');
        setPasswordConfirm('');
      } else {
        setPasswordError(data.error || 'Chyba při změně hesla');
      }
    } catch {
      setPasswordError('Chyba při komunikaci se serverem');
    } finally {
      setSavingPassword(false);
    }
  };

  const submitJerseyLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadPhone.trim() || !leadEmail.trim()) {
      alert('Vyplňte prosím jméno, telefon a e-mail.');
      return;
    }
    setLeadSubmitted(true);
    setLeadName('');
    setLeadPhone('');
    setLeadEmail('');
  };

  const copyId = async () => {
    if (!team?.id) return;
    try {
      await navigator.clipboard.writeText(team.id);
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 2000);
    } catch (err) {
      console.error('Chyba při kopírování:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-start justify-center">
        <GhostDashboard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-8 max-w-md">
          <div className="flex items-center space-x-3 mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-foreground">Chyba</h2>
          </div>
          <p className="text-foreground/70 text-sm mb-6">{error}</p>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('teamId');
              localStorage.removeItem('userType');
              router.push('/login/team');
            }}
            className="w-full px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-sm"
          >
            Zpět na přihlášení
          </button>
        </div>
      </div>
    );
  }

  const bgStyle = team?.backgroundColor ? { background: team.backgroundColor } : undefined;

  const jerseyLinks = [
    { label: 'Dres', url: team?.jerseyUrl },
    { label: 'Trenýrky', url: team?.shortsUrl },
    { label: 'Štulpny', url: team?.socksUrl },
  ];
  const hasAnyJerseyLink = jerseyLinks.some((l) => l.url);

  return (
    <div className="min-h-screen py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8" style={bgStyle}>
      {/* Top bar */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1">
        <motion.button
          type="button"
          onClick={openSettings}
          className="p-2 rounded-lg text-foreground/50 hover:text-foreground hover:bg-white/10 transition-colors"
          aria-label="Nastavení"
          whileTap={{ scale: 0.95 }}
          title="Nastavení"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </motion.button>
        <motion.button
          onClick={handleLogout}
          className="p-2 rounded-lg text-foreground/50 hover:text-foreground hover:bg-white/10 transition-colors"
          aria-label="Odhlásit se"
          whileTap={{ scale: 0.95 }}
          title="Odhlásit se"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </motion.button>
        <ThemeToggle />
      </div>

      <MotionPage className="w-full max-w-4xl mx-auto relative z-10 pt-8 sm:pt-10">
        {/* Header — pozdrav + logo */}
        <div className="flex items-center gap-4 mb-6">
          {team?.logo && (
            <img
              src={team.logo}
              alt={`${team.teamName} logo`}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white/10"
              loading="lazy"
            />
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Vítejte, {team?.teamName}
            </h1>
            <p className="text-foreground/40 text-xs mt-0.5 font-mono">{team?.id}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Týmová zóna + Týmový web + Fanoušci — karty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MotionItem delay={0.02}>
              <Link href="/dashboard/hodnoceni-hracu" className="block h-full">
                <motion.div
                  className="relative overflow-hidden rounded-2xl p-8 sm:p-10 group cursor-pointer h-full min-h-[340px] sm:min-h-[400px]"
                  style={{
                    background: 'linear-gradient(135deg, #86EF42 0%, #65d630 40%, #4ade80 100%)',
                  }}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className="flex flex-col justify-between h-full relative z-10">
                    <div>
                      <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-[0.9] tracking-tight mb-3">
                        Týmová<br />zóna
                      </h2>
                      <p className="text-gray-800/70 text-sm sm:text-base">
                        Správa hráčů, zápasů, tréninků, hodnocení a taktiky
                      </p>
                    </div>
                    <div className="flex justify-end mt-4">
                      <svg className="w-5 h-5 text-gray-900/40 group-hover:text-gray-900/70 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </MotionItem>

            {/* Desktop — plně klikatelná karta */}
            <MotionItem delay={0.04} className="hidden sm:block">
              <Link href="/dashboard/tymovy-web" className="block h-full">
                <motion.div
                  className="relative overflow-hidden rounded-2xl p-8 sm:p-10 group cursor-pointer h-full min-h-[340px] sm:min-h-[400px]"
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 40%, #6366F1 100%)',
                  }}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className="flex flex-col justify-between h-full relative z-10">
                    <div>
                      <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[0.9] tracking-tight mb-3">
                        Týmový<br />web
                      </h2>
                      <p className="text-white/70 text-sm sm:text-base">
                        Vytvořte si jednoduchou webovku pro váš tým
                      </p>
                    </div>
                    <div className="flex justify-end mt-4">
                      <svg className="w-5 h-5 text-white/40 group-hover:text-white/70 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </MotionItem>
            {/* Mobil — neaktivní karta */}
            <MotionItem delay={0.04} className="sm:hidden">
              <div
                className="relative overflow-hidden rounded-2xl p-8 h-full min-h-[340px] opacity-50 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 40%, #6366F1 100%)',
                }}
              >
                <div className="flex flex-col justify-between h-full relative z-10">
                  <div>
                    <h2 className="text-4xl font-black text-white leading-[0.9] tracking-tight mb-3">
                      Týmový<br />web
                    </h2>
                    <p className="text-white/70 text-sm">
                      Vytvořte si jednoduchou webovku pro váš tým
                    </p>
                  </div>
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 text-white/80 text-xs font-medium">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a9 9 0 01-18 0V5.25" />
                      </svg>
                      Dostupné na počítači
                    </span>
                  </div>
                </div>
              </div>
            </MotionItem>

            {/* Fanoušci */}
            <MotionItem delay={0.06} className="sm:col-span-2">
              <Link href="/dashboard/fanousci" className="block">
                <motion.div
                  className="relative overflow-hidden rounded-2xl p-6 sm:p-8 group cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 40%, #F97316 100%)',
                  }}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight mb-1">
                        Fanoušci
                      </h2>
                      <p className="text-white/70 text-sm">
                        Hlasování fanoušků o hráče utkání
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-white/40 group-hover:text-white/70 group-hover:translate-x-1 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.div>
              </Link>
            </MotionItem>
          </div>

          {/* Časovač - Dodání dresů */}
          {team?.deadline && (
            <MotionItem delay={0.04}>
              <div className="glass-card rounded-2xl p-5 sm:p-6 border border-border">
                <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3">Dodání dresů</h2>
                <CountdownTimer deadline={team.deadline} />
              </div>
            </MotionItem>
          )}

          {/* Časovač - Termín tarifů */}
          {team?.tariffValidUntil && (
            <MotionItem delay={0.06}>
              <div className="glass-card rounded-2xl p-5 sm:p-6 border border-border">
                <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3">Dresy do výroby už za:</h2>
                <CountdownTimer deadline={team.tariffValidUntil} />
              </div>
            </MotionItem>
          )}

          {/* Dresy za free — lead formulář */}
          {!team?.deadline && (
            <MotionItem delay={0.04}>
              <div className="glass-card rounded-2xl p-5 sm:p-6 border border-border">
                <button
                  type="button"
                  onClick={() => setJerseyLeadOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between text-left"
                  aria-expanded={jerseyLeadOpen}
                >
                  <h2 className="text-base sm:text-lg font-semibold text-foreground">Dresy za free</h2>
                  <svg
                    className={`w-4 h-4 text-foreground/40 transition-transform ${jerseyLeadOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {jerseyLeadOpen && (
                  <div className="mt-4 space-y-3">
                    <p className="text-foreground/60 text-sm leading-relaxed">
                      Vyplňte kontaktní údaje a následně se vám ozve náš obchodní zástupce.
                    </p>

                    {leadSubmitted && (
                      <div className="rounded-lg px-3 py-2.5 bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                        Děkujeme, údaje jsme přijali. Brzy se vám ozveme.
                      </div>
                    )}

                    <form onSubmit={submitJerseyLead} className="space-y-2.5">
                      <input
                        type="text"
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        placeholder="Jméno"
                        className="w-full h-10 px-4 rounded-lg glass-input text-foreground text-sm"
                      />
                      <input
                        type="tel"
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.target.value)}
                        placeholder="Telefonní číslo"
                        className="w-full h-10 px-4 rounded-lg glass-input text-foreground text-sm"
                      />
                      <input
                        type="email"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        placeholder="E-mail"
                        className="w-full h-10 px-4 rounded-lg glass-input text-foreground text-sm"
                      />
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                      >
                        Odeslat kontakt
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </MotionItem>
          )}

          {/* Doporučit klub */}
          <MotionItem delay={0.08}>
            <div className="glass-card rounded-2xl p-5 sm:p-6 border border-border">
              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3">Doporučit klub</h2>
              <p className="text-foreground/50 text-sm mb-3 leading-relaxed">
                Dejte jinému klubu vaše ID. Při registraci ho zadají do pole &ldquo;ID doporučujícího týmu&rdquo;.
              </p>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-lg font-mono font-bold text-foreground flex-1 min-w-0 truncate">{team?.id}</span>
                <button
                  type="button"
                  onClick={copyId}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    idCopied
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-white/10 hover:bg-white/15 text-foreground/70 hover:text-foreground border border-white/10'
                  }`}
                >
                  {idCopied ? 'Zkopírováno' : 'Kopírovat'}
                </button>
              </div>
            </div>
          </MotionItem>

          {/* Odkazy na dresy */}
          {hasAnyJerseyLink && (
            <MotionItem delay={0.1}>
              <div className="glass-card rounded-2xl p-5 sm:p-6 border border-border">
                <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3">Odkazy na dresy</h2>
                <div className="space-y-2.5">
                  {jerseyLinks.map((link) => (
                    <div key={link.label} className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0">
                      <span className="text-foreground/60 text-sm shrink-0">{link.label}</span>
                      {link.url ? (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm truncate min-w-0 transition-colors"
                        >
                          {link.url}
                        </a>
                      ) : (
                        <span className="text-foreground/30 text-sm italic">Nenastaveno</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </MotionItem>
          )}
        </div>
      </MotionPage>

      {/* Modální okno Nastavení */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm" onClick={() => setSettingsOpen(false)}>
          <motion.div
            className="glass-card rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">Nastavení týmu</h2>
            <form onSubmit={saveSettings} className="space-y-4">
              <div>
                <label className="block text-foreground/60 text-sm mb-1">Název týmu</label>
                <input
                  type="text"
                  value={settingsTeamName}
                  onChange={(e) => setSettingsTeamName(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg glass-input text-foreground text-sm"
                  placeholder="Např. FC Kája"
                />
              </div>
              <div>
                <label className="block text-foreground/60 text-sm mb-1">Logo týmu</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => document.getElementById('settings-logo-input')?.click()}
                    className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 hover:border-blue-500/50 transition-colors group flex-shrink-0 cursor-pointer"
                  >
                    {(settingsLogoFile || settingsLogoPreview || team?.logo) ? (
                      <img
                        src={settingsLogoFile ? URL.createObjectURL(settingsLogoFile) : (settingsLogoPreview || team?.logo || '')}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <svg className="w-6 h-6 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                  </button>
                  <input
                    id="settings-logo-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      setSettingsLogoFile(f || null);
                      setSettingsLogoPreview(f ? URL.createObjectURL(f) : null);
                    }}
                  />
                  <p className="text-foreground/40 text-xs">Klikni na logo pro změnu<br />Max. 5 MB</p>
                </div>
              </div>
              <div>
                <label className="block text-foreground/60 text-sm mb-1">Kontaktní osoba</label>
                <input
                  type="text"
                  value={settingsContactPerson}
                  onChange={(e) => { setSettingsContactPerson(e.target.value); setSettingsErrors(p => { const n = { ...p }; delete n.contactPerson; return n; }); }}
                  className={`w-full h-10 px-4 rounded-lg glass-input text-foreground text-sm ${settingsErrors.contactPerson ? 'border-2 border-red-500 bg-red-500/10' : ''}`}
                  placeholder="Jméno kontaktní osoby"
                />
                {settingsErrors.contactPerson && <p className="text-red-400 text-xs mt-1">{settingsErrors.contactPerson}</p>}
              </div>
              <div>
                <label className="block text-foreground/60 text-sm mb-1">Telefon</label>
                <input
                  type="tel"
                  value={settingsPhone}
                  onChange={(e) => { setSettingsPhone(e.target.value); setSettingsErrors(p => { const n = { ...p }; delete n.phone; return n; }); }}
                  className={`w-full h-10 px-4 rounded-lg glass-input text-foreground text-sm ${settingsErrors.phone ? 'border-2 border-red-500 bg-red-500/10' : ''}`}
                  placeholder="+420 123 456 789"
                />
                {settingsErrors.phone && <p className="text-red-400 text-xs mt-1">{settingsErrors.phone}</p>}
              </div>
              <div>
                <label className="block text-foreground/60 text-sm mb-1">E-mail</label>
                <input
                  type="email"
                  value={settingsEmail}
                  onChange={(e) => { setSettingsEmail(e.target.value); setSettingsErrors(p => { const n = { ...p }; delete n.email; return n; }); }}
                  className={`w-full h-10 px-4 rounded-lg glass-input text-foreground text-sm ${settingsErrors.email ? 'border-2 border-red-500 bg-red-500/10' : ''}`}
                  placeholder="vas@email.cz"
                />
                {settingsErrors.email && <p className="text-red-400 text-xs mt-1">{settingsErrors.email}</p>}
              </div>
              <div>
                <label className="block text-foreground/60 text-sm mb-1">Přihlašovací jméno</label>
                <input
                  type="text"
                  value={team?.username || ''}
                  disabled
                  className="w-full h-10 px-4 rounded-lg glass-input text-foreground text-sm opacity-60 cursor-not-allowed"
                />
                <p className="text-foreground/40 text-xs mt-1">Přihlašovací jméno nelze změnit</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setSettingsOpen(false)} className="flex-1 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-foreground text-sm font-medium transition-colors">
                  Zrušit
                </button>
                <button type="submit" disabled={savingSettings} className="flex-1 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50 transition-colors">
                  {savingSettings ? 'Ukládám...' : 'Uložit'}
                </button>
              </div>
            </form>

            {/* Změna hesla */}
            <div className="border-t border-border mt-5 pt-4">
              <button
                type="button"
                onClick={() => setPasswordSectionOpen(!passwordSectionOpen)}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                Změnit heslo
              </button>
              {passwordSectionOpen && (
                <form onSubmit={changePassword} className="space-y-3 mt-3">
                  <div>
                    <label className="block text-foreground/60 text-xs mb-1">Současné heslo</label>
                    <input
                      type="password"
                      value={passwordOld}
                      onChange={(e) => { setPasswordOld(e.target.value); setPasswordError(''); }}
                      className="w-full h-10 px-4 rounded-lg glass-input text-foreground text-sm"
                      placeholder="Zadejte současné heslo"
                      autoComplete="current-password"
                    />
                  </div>
                  <div>
                    <label className="block text-foreground/60 text-xs mb-1">Nové heslo</label>
                    <input
                      type="password"
                      value={passwordNew}
                      onChange={(e) => { setPasswordNew(e.target.value); setPasswordError(''); }}
                      className="w-full h-10 px-4 rounded-lg glass-input text-foreground text-sm"
                      placeholder="Minimálně 6 znaků"
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label className="block text-foreground/60 text-xs mb-1">Potvrzení nového hesla</label>
                    <input
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => { setPasswordConfirm(e.target.value); setPasswordError(''); }}
                      className="w-full h-10 px-4 rounded-lg glass-input text-foreground text-sm"
                      placeholder="Zadejte nové heslo znovu"
                      autoComplete="new-password"
                    />
                  </div>
                  {passwordError && <p className="text-red-400 text-sm">{passwordError}</p>}
                  {passwordSuccess && <p className="text-green-400 text-sm">{passwordSuccess}</p>}
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="w-full h-10 rounded-lg bg-white/5 hover:bg-white/10 text-foreground text-sm font-medium disabled:opacity-50 transition-colors border border-border"
                  >
                  {savingPassword ? 'Měním heslo...' : 'Změnit heslo'}
                </button>
              </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
