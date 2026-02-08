'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center animated-background">
      <div className="flex flex-col items-center justify-center space-y-8 px-4 relative z-10 w-full max-w-6xl">
        {/* Logo */}
        <div className="relative w-64 h-64 md:w-96 md:h-96 flex items-center justify-center">
          <div className="logo-glitch-container">
            <img
              src="/logo.png"
              alt="Dresy za free logo"
              className="w-full h-full object-contain cursor-pointer"
            />
          </div>
        </div>

        {/* Tlačítka */}
        <div className="flex flex-col items-center space-y-4 w-full max-w-md fade-in-up">
          <Link
            href="/register"
            className="w-full px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white text-xl font-semibold rounded-2xl shadow-[0_0_25px_rgba(59,130,246,0.4)] transform transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(59,130,246,0.6)] text-center modern-button relative overflow-hidden"
          >
            <span className="relative z-10">Chci dresy za free</span>
          </Link>
          
          <Link
            href="/login/team"
            className="w-full px-8 py-4 glass-card text-white text-xl font-semibold rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/40 hover:shadow-[0_0_25px_rgba(59,130,246,0.15)] text-center modern-button relative overflow-hidden"
          >
            <span className="relative z-10">Přihlásit se za klub</span>
          </Link>

          {/* Jak to funguje - rozklikávací */}
          <div className="w-full mt-4">
            <button
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="text-white/60 hover:text-white text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 w-full"
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
              <div className="mt-3 glass-card rounded-2xl p-4 slide-in">
                <p className="text-sm text-white/70 text-center leading-relaxed">
                  Po registraci se vám ozve náš zástupce, který vám celý proces podrobně vysvětlí a pomůže vám s každým krokem.
                </p>
              </div>
            )}
          </div>

          {/* Přihlášení administrátora - malý text */}
          <Link
            href="/login/admin"
            className="text-white/50 hover:text-blue-400 text-sm font-medium mt-4 transition-all duration-200"
          >
            Přihlásit se jako administrátor
          </Link>
        </div>
      </div>
    </div>
  );
}

