'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EMOJIS = [
  { value: 1, emoji: '\ud83d\ude2d', label: 'Špatné' },
  { value: 2, emoji: '\ud83d\ude1f', label: 'Slabé' },
  { value: 3, emoji: '\ud83d\ude10', label: 'Ujde to' },
  { value: 4, emoji: '\ud83d\ude0a', label: 'Dobré' },
  { value: 5, emoji: '\ud83e\udd29', label: 'Super' },
];

const STORAGE_KEYS = {
  submitted: 'mypitch-feedback-submitted',
  dismissed: 'mypitch-feedback-dismissed',
};

type WidgetState = 'minimized' | 'expanded' | 'success';

export default function FeedbackWidget() {
  const [state, setState] = useState<WidgetState>('minimized');
  const [featureRequest, setFeatureRequest] = useState('');
  const [emojiRating, setEmojiRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [teamId, setTeamId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const tid = localStorage.getItem('teamId');
    const tok = localStorage.getItem('token');
    if (tid && tok) {
      setTeamId(tid);
      setToken(tok);
    }
  }, []);

  // Auto-expand after 5s if not recently submitted/dismissed
  useEffect(() => {
    if (!teamId) return;

    const submitted = localStorage.getItem(STORAGE_KEYS.submitted);
    const dismissed = localStorage.getItem(STORAGE_KEYS.dismissed);
    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const ONE_DAY = 24 * 60 * 60 * 1000;

    if (submitted && now - Number(submitted) < SEVEN_DAYS) return;
    if (dismissed && now - Number(dismissed) < ONE_DAY) return;

    const timer = setTimeout(() => setState('expanded'), 5000);
    return () => clearTimeout(timer);
  }, [teamId]);

  const handleMinimize = useCallback(() => {
    setState('minimized');
    localStorage.setItem(STORAGE_KEYS.dismissed, String(Date.now()));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!teamId || !token) return;
    if (!featureRequest.trim() && !emojiRating) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teamId,
          featureRequest: featureRequest.trim() || null,
          emojiRating,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Chyba při odesílání');
      }

      localStorage.setItem(STORAGE_KEYS.submitted, String(Date.now()));
      setState('success');

      setTimeout(() => {
        setState('minimized');
        setFeatureRequest('');
        setEmojiRating(null);
      }, 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se odeslat');
    } finally {
      setSubmitting(false);
    }
  }, [teamId, token, featureRequest, emojiRating]);

  if (!teamId || !token) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9990]">
      <AnimatePresence mode="wait">
        {state === 'minimized' && (
          <motion.button
            key="fab"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={() => setState('expanded')}
            className="group flex items-center h-12 rounded-full shadow-lg hover:shadow-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--glass-border)] backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] px-[2px] hover:px-4 hover:pr-[2px] cursor-pointer"
            title="Zpětná vazba"
          >
            <span className="max-w-0 group-hover:max-w-[140px] overflow-hidden whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] opacity-0 group-hover:opacity-100 text-sm font-medium text-foreground/80 mr-0 group-hover:mr-2">
              Zpětná vazba
            </span>
            <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--accent, #86EF42)' }}>
              <svg className="w-5 h-5 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
              </svg>
            </span>
          </motion.button>
        )}

        {(state === 'expanded' || state === 'success') && (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="glass-card rounded-2xl p-5 w-[340px] max-w-[calc(100vw-2rem)] border border-[var(--glass-border)]"
          >
            {state === 'success' ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">🎉</div>
                <p className="text-foreground font-semibold text-lg">Děkujeme!</p>
                <p className="text-foreground/50 text-sm mt-1">
                  Tvůj názor nám pomáhá MyPitch zlepšovat.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-foreground font-bold text-base">Zpětná vazba</h3>
                  <button
                    onClick={handleMinimize}
                    className="text-foreground/40 hover:text-foreground/70 transition-colors p-1 -mr-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Feature request */}
                <label className="block text-sm text-foreground/60 mb-2">
                  Jaká funkce by se Ti v MyPitch hodila pro Tvůj tým?
                </label>
                <textarea
                  value={featureRequest}
                  onChange={(e) => setFeatureRequest(e.target.value)}
                  placeholder="Napiš nám svůj nápad..."
                  className="glass-input w-full rounded-xl px-4 py-3 text-sm text-foreground resize-none h-24 mb-4"
                  maxLength={500}
                />

                {/* Emoji rating */}
                <label className="block text-sm text-foreground/60 mb-2">
                  Jak se Ti MyPitch líbí?
                </label>
                <div className="flex items-center justify-between gap-1 mb-1">
                  {EMOJIS.map((e) => (
                    <button
                      key={e.value}
                      type="button"
                      onClick={() => setEmojiRating(emojiRating === e.value ? null : e.value)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
                        emojiRating === e.value
                          ? 'bg-[var(--accent)]/20 scale-110 ring-2 ring-[var(--accent)]/50'
                          : 'hover:bg-[var(--surface-hover)] hover:scale-105'
                      }`}
                    >
                      <span className="text-2xl">{e.emoji}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-[10px] text-foreground/30">Špatné</span>
                  <span className="text-[10px] text-foreground/30">Super</span>
                </div>

                {/* Error */}
                {error && (
                  <p className="text-red-400 text-sm mb-3">{error}</p>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || (!featureRequest.trim() && !emojiRating)}
                  className="w-full py-3 rounded-xl font-semibold text-sm text-black transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--accent, #86EF42)' }}
                >
                  {submitting ? 'Odesílám...' : 'Odeslat'}
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
