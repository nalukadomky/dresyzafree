'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

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
      <div className="min-h-screen animated-background flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 text-white text-center">Načítám...</div>
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
      <div className="max-w-lg mx-auto space-y-6">
        {/* Událost */}
        <div className="glass-card rounded-2xl p-6">
          <h1 className="text-xl font-semibold text-white mb-2">
            {new Date(event.date).toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {event.startTime && ` v ${event.startTime}`}
          </h1>
          <p className="text-white/90 font-medium">
            {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
            {event.location && ` • ${event.location}`}
            {event.opponent && ` vs ${event.opponent}`}
          </p>
          {event.note && <p className="text-white/70 text-sm mt-2">{event.note}</p>}
        </div>

        {/* Formulář účasti */}
        <div className="glass-card rounded-2xl p-6">
          {event.attendanceClosed ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-amber-400 font-medium text-lg">Odpovědi byly uzavřeny</p>
                <p className="text-white/70 mt-1 text-sm">
                  Účast se uzavírá den před událostí do půlnoci. Účast již nelze měnit.
                </p>
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Vyberte své jméno</label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-white"
                >
                  <option value="">— Vyberte —</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedPlayerId && currentAttendance ? (
                <div className="rounded-xl bg-white/5 p-4 text-white/90">
                  <p className="font-medium">
                    {currentAttendance.attended ? 'Budete se účastnit.' : `Nebudete se účastnit.${currentAttendance.absenceReason ? ` Důvod: ${currentAttendance.absenceReason}` : ''}`}
                  </p>
                </div>
              ) : selectedPlayerId && (
                <p className="text-white/60 italic">Na tuto událost jste neodpověděli.</p>
              )}
            </div>
          ) : submitted ? (
            <div className="text-center py-6">
              <p className="text-emerald-400 font-medium text-lg">✓ Odezváno</p>
              <p className="text-white/70 mt-1">
                {attending ? 'Budete se účastnit.' : `Nebudete se účastnit.${absenceReason ? ` Důvod: ${absenceReason}` : ''}`}
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-4 px-4 py-2 text-white/80 hover:text-white text-sm underline"
              >
                Změnit odpověď
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">Vyberte své jméno</label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => {
                    setSelectedPlayerId(e.target.value);
                    setAttending(null);
                    setAbsenceReason('');
                    const a = attendance.find((x) => x.playerId === e.target.value);
                    if (a) {
                      setAttending(a.attended);
                      setAbsenceReason(a.absenceReason || '');
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl glass-input text-white"
                  required
                >
                  <option value="">— Vyberte —</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPlayerId && (
                <>
                  <div>
                    <label className="block text-white font-medium mb-2">Budu se účastnit</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="attending"
                          checked={attending === true}
                          onChange={() => setAttending(true)}
                          className="w-4 h-4"
                        />
                        <span className="text-white">Ano</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="attending"
                          checked={attending === false}
                          onChange={() => setAttending(false)}
                          className="w-4 h-4"
                        />
                        <span className="text-white">Ne</span>
                      </label>
                    </div>
                  </div>

                  {attending === false && (
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Důvod nepřítomnosti <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={absenceReason}
                        onChange={(e) => setAbsenceReason(e.target.value)}
                        placeholder="Např. pracovní povinnosti, nemoc, dovolená..."
                        className="w-full px-4 py-3 rounded-xl glass-input text-white placeholder-white/40 min-h-[100px] resize-y"
                        required
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!canSubmit || submitting}
                    className="w-full px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
                  >
                    {submitting ? 'Odesílám...' : 'Odeslat odpověď'}
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
