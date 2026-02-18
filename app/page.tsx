'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center animated-background">
      <div className="flex flex-col items-center justify-center space-y-10 px-4 relative z-10 w-full max-w-xl">
        {/* Logo */}
        <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center">
          <div className="logo-glitch-container">
            <img
              src="/logo.png"
              alt="Dresy za free logo"
              className="w-full h-full object-contain cursor-pointer"
              loading="eager"
            />
          </div>
        </div>

        {/* Nadpis */}
        <div className="text-center space-y-2">
          <p className="text-zinc-400 text-sm sm:text-base">
            Zaregistrujte svůj tým a získejte dresy zdarma
          </p>
        </div>

        {/* Akce */}
        <div className="flex flex-col items-center space-y-4 w-full fade-in-up">
          <Link
            href="/register"
            className="w-full px-6 py-4 bg-violet-500 hover:bg-violet-600 text-white text-base font-medium rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:-translate-y-0.5 text-center modern-button"
            aria-label="Chci dresy za free"
          >
            <span className="relative z-10">Chci dresy za free</span>
          </Link>
          
          <Link
            href="/login/team"
            className="text-zinc-400 hover:text-white text-sm font-medium transition-colors"
            aria-label="Přihlásit se"
          >
            Přihlásit se
          </Link>
        </div>

        {/* Jak to funguje */}
        <div className="w-full pt-4">
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors flex items-center justify-center gap-2 w-full py-2 group"
            aria-expanded={showHowItWorks}
          >
            <span>Jak to funguje?</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${showHowItWorks ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showHowItWorks && (
            <div className="mt-3 glass-card rounded-2xl p-5 slide-in">
              <p className="text-sm text-zinc-400 leading-relaxed text-center">
                Po registraci se vám ozve náš zástupce, který vám celý proces podrobně vysvětlí a pomůže vám s každým krokem.
              </p>
            </div>
          )}
        </div>

        {/* Admin link */}
        <Link
          href="/login/admin"
          className="text-zinc-500 hover:text-zinc-400 text-xs font-medium transition-colors"
        >
          Přihlásit se jako administrátor
        </Link>
      </div>
    </div>
  );
}
