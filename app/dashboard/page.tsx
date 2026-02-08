'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CountdownTimer from '@/components/CountdownTimer';

interface Team {
  id: string;
  teamName: string;
  logo?: string;
  jerseyUrl?: string;
  shortsUrl?: string;
  socksUrl?: string;
  deadline?: string;
  tariffValidUntil?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const teamId = localStorage.getItem('teamId');

    if (!token || !teamId) {
      router.push('/login');
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
          router.push('/login');
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

  if (loading) {
    return (
      <div className="min-h-screen animated-background flex items-center justify-center">
        <div className="text-white text-xl">Načítání...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen animated-background flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-background py-12 px-4">
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

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            {team?.logo && (
              <img
                src={team.logo}
                alt={`${team.teamName} logo`}
                className="w-16 h-16 rounded-full object-cover border-4 border-white/30"
              />
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Vítejte, {team?.teamName}
              </h1>
              {team?.id && (
                <p className="text-white/60 text-sm mt-1">
                  Vaše ID: <span className="font-mono font-semibold">{team.id}</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 bg-red-500/90 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-red-500/30"
          >
            Odhlásit se
          </button>
        </div>

        {/* Časovač - Dodání dresů */}
        {team?.deadline && (
          <div className="glass-card rounded-3xl shadow-2xl p-8 mb-6 fade-in-up">
            <h2 className="text-2xl font-bold text-white mb-6">Dodání dresů</h2>
            <CountdownTimer deadline={team.deadline} />
          </div>
        )}

        {!team?.deadline && (
          <div className="glass-card rounded-3xl shadow-2xl p-8 mb-6 fade-in-up">
            <h2 className="text-2xl font-bold text-white mb-4">Dodání dresů</h2>
            <p className="text-white/60 italic">Dodání dresů zatím nebylo nastaveno správcem</p>
          </div>
        )}

        {/* Časovač - Termín tarifů */}
        {team?.tariffValidUntil && (
          <div className="glass-card rounded-3xl shadow-2xl p-8 mb-6 fade-in-up">
            <h2 className="text-2xl font-bold text-white mb-6">Dresy do výroby už za:</h2>
            <CountdownTimer deadline={team.tariffValidUntil} />
          </div>
        )}

        {/* Doporučit klub */}
        <div className="glass-card rounded-3xl shadow-2xl p-8 mb-6 fade-in-up">
          <h2 className="text-2xl font-bold text-white mb-4">Doporučit klub</h2>
          <div className="space-y-4">
            <div className="bg-blue-600/20 border border-blue-400/30 rounded-lg p-4">
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
                onClick={() => {
                  if (team?.id) {
                    navigator.clipboard.writeText(team.id);
                    alert('ID bylo zkopírováno do schránky!');
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
              >
                Kopírovat ID
              </button>
            </div>
          </div>
        </div>

        {/* Odkazy na dresy */}
        <div className="glass-card rounded-3xl shadow-2xl p-8 mb-6 fade-in-up">
          <h2 className="text-2xl font-bold text-white mb-4">Odkazy na dresy</h2>
          <div className="space-y-4">
            {team?.jerseyUrl ? (
              <div>
                <p className="text-white/80 mb-2 font-semibold">Dres:</p>
                <a
                  href={team.jerseyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline break-all"
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
                  className="text-blue-400 hover:text-blue-300 underline break-all"
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
                  className="text-blue-400 hover:text-blue-300 underline break-all"
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

