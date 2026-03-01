'use client';

import type { EventsContent } from '@/lib/db-website';

interface EventData {
  id: string;
  date: string;
  eventType: string;
  location?: string;
  opponent?: string;
  startTime?: string;
  note?: string;
}

interface Props {
  content: EventsContent;
  events: EventData[];
  primaryColor: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  training: 'Trénink',
  friendly_match: 'Přátelský zápas',
  competitive_match: 'Soutěžní zápas',
};

const EVENT_TYPE_ICONS: Record<string, string> = {
  training: '🏋️',
  friendly_match: '⚽',
  competitive_match: '🏆',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('cs-CZ', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
}

export function EventsSection({ content, events, primaryColor }: Props) {
  const isDark = content.variant === 'dark';
  const filtered = events
    .filter((e) => {
      if (e.eventType === 'training' && !content.showTrainings) return false;
      if ((e.eventType === 'friendly_match' || e.eventType === 'competitive_match') && !content.showMatches) return false;
      return true;
    })
    .slice(0, content.maxEvents || 5);

  return (
    <section
      className="py-16 px-6"
      style={{ background: isDark ? '#0F172A' : '#F8FAFC' }}
    >
      <div className="max-w-3xl mx-auto">
        <h2
          className="text-3xl font-bold mb-8 text-center"
          style={{ color: isDark ? '#F8FAFC' : '#1E293B' }}
        >
          {content.title || 'Nadcházející akce'}
        </h2>

        {filtered.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center"
            style={{
              background: isDark ? '#1E293B' : '#FFFFFF',
              border: isDark ? '1px solid #334155' : '1px solid #F1F5F9',
            }}
          >
            <div className="text-4xl mb-3 opacity-40">📅</div>
            <p
              className="font-medium"
              style={{ color: isDark ? '#94A3B8' : '#64748B' }}
            >
              Žádné nadcházející akce
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: isDark ? '#64748B' : '#94A3B8' }}
            >
              Nové události se zde zobrazí automaticky po jejich naplánování.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((event) => (
              <div
                key={event.id}
                className="rounded-xl p-4 sm:p-5 shadow-sm flex items-start gap-4"
                style={{
                  background: isDark ? '#1E293B' : '#FFFFFF',
                  border: isDark ? '1px solid #334155' : '1px solid #F1F5F9',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl"
                  style={{ background: isDark ? `${primaryColor}25` : `${primaryColor}15` }}
                >
                  {EVENT_TYPE_ICONS[event.eventType] || '📅'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p
                        className="font-semibold"
                        style={{ color: isDark ? '#F1F5F9' : '#1E293B' }}
                      >
                        {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                        {event.opponent && (
                          <span style={{ color: isDark ? '#94A3B8' : '#64748B' }} className="font-normal"> vs {event.opponent}</span>
                        )}
                      </p>
                      <p
                        className="text-sm mt-0.5"
                        style={{ color: isDark ? '#64748B' : '#94A3B8' }}
                      >
                        {formatDate(event.date)}
                        {event.startTime && ` · ${event.startTime}`}
                      </p>
                    </div>
                  </div>
                  {event.location && (
                    <p className="text-xs mt-1" style={{ color: isDark ? '#64748B' : '#94A3B8' }}>
                      📍 {event.location}
                    </p>
                  )}
                  {event.note && (
                    <p className="text-sm mt-1" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                      {event.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
