'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  deadline: string; // ISO date string
}

export default function CountdownTimer({ deadline }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const difference = deadlineTime - now;

      if (difference <= 0) {
        return {
          months: 0,
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true,
        };
      }

      // Celkový počet dní
      const totalDays = Math.floor(difference / (1000 * 60 * 60 * 24));
      
      // Měsíce (přibližně 30 dní na měsíc)
      const months = Math.floor(totalDays / 30);
      
      // Zbývající dny
      const remainingDays = totalDays % 30;
      
      // Hodiny, minuty, sekundy
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return {
        months,
        days: remainingDays,
        hours,
        minutes,
        seconds,
        expired: false,
      };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  if (timeLeft.expired) {
    return (
      <div className="text-center">
        <div className="liquid-glass-card p-8 rounded-3xl">
          <p className="text-3xl font-bold text-red-400">Čas vypršel!</p>
        </div>
      </div>
    );
  }

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="liquid-glass-card relative overflow-hidden group">
      {/* Světelný efekt */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Tekutý efekt */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Obsah */}
      <div className="relative z-10 p-4 sm:p-6 md:p-8 text-center">
        <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white mb-2 sm:mb-3 drop-shadow-2xl">
          {String(value).padStart(2, '0')}
        </div>
        <div className="text-[10px] sm:text-xs md:text-sm font-semibold text-white/60 uppercase tracking-widest">
          {label}
        </div>
      </div>

      {/* Spodní světelný pruh */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"></div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
      <TimeUnit value={timeLeft.months} label={timeLeft.months === 1 ? 'Měsíc' : timeLeft.months < 5 ? 'Měsíce' : 'Měsíců'} />
      <TimeUnit value={timeLeft.days} label={timeLeft.days === 1 ? 'Den' : timeLeft.days < 5 ? 'Dny' : 'Dní'} />
      <TimeUnit value={timeLeft.hours} label={timeLeft.hours === 1 ? 'Hodina' : timeLeft.hours < 5 ? 'Hodiny' : 'Hodin'} />
      <TimeUnit value={timeLeft.minutes} label={timeLeft.minutes === 1 ? 'Minuta' : timeLeft.minutes < 5 ? 'Minuty' : 'Minut'} />
      <TimeUnit value={timeLeft.seconds} label={timeLeft.seconds === 1 ? 'Sekunda' : timeLeft.seconds < 5 ? 'Sekundy' : 'Sekund'} />
    </div>
  );
}

