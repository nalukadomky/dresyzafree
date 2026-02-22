'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { GhostEvent } from '@/components/GhostLoader';
import ThemeToggle from '@/components/ThemeToggle';
import { MotionPage } from '@/components/Motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const EVENT_TYPE_LABELS: Record<string, string> = {
  training: 'Trénink',
  friendly_match: 'Zápas přátelský',
  competitive_match: 'Zápas mistrovský',
};

interface EventData {
  id: string;
  date: string;
  eventType: string;
  location?: string;
  opponent?: string;
  startTime?: string;
  note?: string;
  attendanceClosed?: boolean;
}

interface Player {
  id: string;
  name: string;
  photoUrl?: string | null;
}

interface AttendanceEntry {
  playerId: string;
  attended: boolean;
  absenceReason?: string;
}

export default function UdalostPage() {
  const params = useParams();
  const shareToken = params.shareToken as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [attending, setAttending] = useState<boolean | null>(null);
  const [absenceReason, setAbsenceReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!shareToken) return;
    fetch(`/api/udalost/${shareToken}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setEvent(data.event);
        setPlayers(data.players || []);
        setAttendance(data.attendance || []);
      })
      .catch(() => setError('Chyba při načítání'))
      .finally(() => setLoading(false));
  }, [shareToken]);

  const currentAttendance = attendance.find((a) => a.playerId === selectedPlayerId);
  const selectedPlayer = useMemo(() => players.find((p) => p.id === selectedPlayerId), [players, selectedPlayerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId || attending === null) return;
    if (!attending && !absenceReason.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/udalost/${shareToken}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: selectedPlayerId,
          attended: attending,
          absenceReason: attending ? undefined : absenceReason.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSubmitted(true);
        setAttendance((prev) => {
          const rest = prev.filter((a) => a.playerId !== selectedPlayerId);
          return [
            ...rest,
            { playerId: selectedPlayerId, attended: attending!, absenceReason: attending ? undefined : absenceReason.trim() },
          ];
        });
      } else {
        alert(data.error || 'Chyba při odesílání');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = selectedPlayerId && attending !== null && (attending || absenceReason.trim().length > 0);

  if (loading) {
    return (
      <div className="min-h-screen animated-background py-12 px-4 flex items-start justify-center">
        <GhostEvent />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen animated-background flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-red-300 text-lg">{error || 'Událost nenalezena'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-background py-12 px-4">
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <MotionPage className="max-w-lg mx-auto space-y-6">
        {/* Událost */}
        <div className="glass-card rounded-2xl p-6">
          <h1 className="text-xl font-semibold text-foreground mb-2">
            {new Date(event.date).toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {event.startTime && /^\d{1,2}:\d{2}$/.test(event.startTime.trim())
              ? ` v ${event.startTime.trim()}`
              : ', čas neuveden'}
          </h1>
          <p className="text-foreground font-medium">
            {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
            {event.location && ` • ${event.location}`}
            {event.opponent && ` vs ${event.opponent}`}
          </p>
          {event.note && <p className="text-foreground/70 text-sm mt-2">{event.note}</p>}
        </div>

        {/* Formulář účasti */}
        <div className="glass-card rounded-2xl p-6">
          {event.attendanceClosed ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-amber-400 font-medium text-lg">Odpovědi byly uzavřeny</p>
                <p className="text-foreground/70 mt-1 text-sm">
                  Účast se uzavírá hodinu před začátkem události. Účast již nelze měnit.
                </p>
              </div>
              <div>
                <label className="block text-foreground font-medium mb-2">Vyberte své jméno</label>
                <Select value={selectedPlayerId || '__none__'} onValueChange={(value) => setSelectedPlayerId(value === '__none__' ? '' : value)}>
                  <SelectTrigger className="w-full rounded-xl glass-input text-foreground focus:ring-2 focus:ring-blue-400">
                    <SelectValue placeholder="— Vyberte —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Vyberte —</SelectItem>
                    {players.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedPlayerId && currentAttendance ? (
                <div className="rounded-xl bg-surface p-4 text-foreground">
                  <p className="font-medium">
                    {currentAttendance.attended ? 'Budete se účastnit.' : `Nebudete se účastnit.${currentAttendance.absenceReason ? ` Důvod: ${currentAttendance.absenceReason}` : ''}`}
                  </p>
                </div>
              ) : selectedPlayerId && (
                <p className="text-foreground/60 italic">Na tuto událost jste neodpověděli.</p>
              )}
            </div>
          ) : submitted ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 border-2 border-accent mb-4">
                <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-accent font-semibold text-lg">Odesláno</p>
              <p className="text-foreground/70 mt-1">
                {attending ? 'Budete se účastnit.' : `Nebudete se účastnit.${absenceReason ? ` Důvod: ${absenceReason}` : ''}`}
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-4 px-4 py-2 text-foreground/80 hover:text-foreground text-sm underline"
              >
                Změnit odpověď
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-foreground font-medium mb-2">Vyberte své jméno</label>
                <Select
                  value={selectedPlayerId || '__none__'}
                  onValueChange={(value) => {
                    const nextValue = value === '__none__' ? '' : value;
                    setSelectedPlayerId(nextValue);
                    setAttending(null);
                    setAbsenceReason('');
                    const a = attendance.find((x) => x.playerId === nextValue);
                    if (a) {
                      setAttending(a.attended);
                      setAbsenceReason(a.absenceReason || '');
                    }
                  }}
                >
                  <SelectTrigger className="w-full rounded-xl glass-input text-foreground focus:ring-2 focus:ring-blue-400">
                    <SelectValue placeholder="— Vyberte —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Vyberte —</SelectItem>
                    {players.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPlayerId && (
                <>
                  <div>
                    <label className="block text-foreground font-medium mb-2">Budu se účastnit</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="attending"
                          checked={attending === true}
                          onChange={() => setAttending(true)}
                          className="w-4 h-4"
                        />
                        <span className="text-foreground">Ano</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="attending"
                          checked={attending === false}
                          onChange={() => setAttending(false)}
                          className="w-4 h-4"
                        />
                        <span className="text-foreground">Ne</span>
                      </label>
                    </div>
                  </div>

                  {attending === false && (
                    <div>
                      <label className="block text-foreground font-medium mb-2">
                        Důvod nepřítomnosti <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={absenceReason}
                        onChange={(e) => setAbsenceReason(e.target.value)}
                        placeholder="Např. pracovní povinnosti, nemoc, dovolená..."
                        className="w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder-white/40 min-h-[100px] resize-y"
                        required
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!canSubmit || submitting}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
                  >
                    {submitting ? 'Odesílám...' : 'Odeslat odpověď'}
                  </button>
                </>
              )}
            </form>
          )}
        </div>

        {/* Obrázek hráče */}
        <AnimatePresence mode="wait">
          {selectedPlayer?.photoUrl && (
            <motion.div
              key={selectedPlayer.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="glass-card rounded-2xl p-4 flex flex-col items-center"
            >
              <div className="relative w-32 h-32 rounded-full overflow-hidden ring-2 ring-white/20 shadow-lg">
                <img
                  src={selectedPlayer.photoUrl}
                  alt={selectedPlayer.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="mt-3 text-foreground font-medium text-lg">{selectedPlayer.name}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </MotionPage>
    </div>
  );
}
