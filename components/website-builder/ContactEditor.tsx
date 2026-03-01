'use client';

import type { ContactContent, ContactPerson, SectionVariant } from '@/lib/db-website';

interface Props {
  content: ContactContent;
  onChange: (c: ContactContent) => void;
}

function VariantPicker({ value, onChange }: { value: SectionVariant | undefined; onChange: (v: SectionVariant) => void }) {
  const variant = value || 'light';
  return (
    <div>
      <label className="block text-foreground/70 text-sm font-medium mb-2">Varianta pozadí</label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange('light')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
            variant === 'light'
              ? 'border-blue-500 bg-blue-500/10 text-blue-500'
              : 'border-border bg-surface text-foreground/50 hover:border-foreground/20'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white border border-slate-200 shrink-0" />
          Light
        </button>
        <button
          type="button"
          onClick={() => onChange('dark')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
            variant === 'dark'
              ? 'border-blue-500 bg-blue-500/10 text-blue-500'
              : 'border-border bg-surface text-foreground/50 hover:border-foreground/20'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-600 shrink-0" />
          Dark
        </button>
      </div>
    </div>
  );
}

export function ContactEditor({ content, onChange }: Props) {
  return (
    <div className="space-y-4">
      <VariantPicker
        value={content.variant}
        onChange={(v) => onChange({ ...content, variant: v })}
      />
      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-1">Nadpis sekce</label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          placeholder="Kontakt"
          className="w-full glass-input rounded-xl px-4 py-2.5 text-foreground"
        />
      </div>
      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-1">Adresa</label>
        <input
          type="text"
          value={content.address}
          onChange={(e) => onChange({ ...content, address: e.target.value })}
          placeholder="Sportovní 123, Praha 4"
          className="w-full glass-input rounded-xl px-4 py-2.5 text-foreground"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-foreground/70 text-sm font-medium mb-1">Telefon</label>
          <input
            type="tel"
            value={content.phone}
            onChange={(e) => onChange({ ...content, phone: e.target.value })}
            placeholder="+420 123 456 789"
            className="w-full glass-input rounded-xl px-4 py-2.5 text-foreground"
          />
        </div>
        <div>
          <label className="block text-foreground/70 text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={content.email}
            onChange={(e) => onChange({ ...content, email: e.target.value })}
            placeholder="info@vas-tym.cz"
            className="w-full glass-input rounded-xl px-4 py-2.5 text-foreground"
          />
        </div>
      </div>
      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-2">Sociální sítě</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-foreground/30 text-sm w-6 text-center">f</span>
            <input
              type="url"
              value={content.socialLinks?.facebook || ''}
              onChange={(e) => onChange({
                ...content,
                socialLinks: { ...content.socialLinks, facebook: e.target.value },
              })}
              placeholder="https://facebook.com/..."
              className="flex-1 glass-input rounded-lg px-3 py-2 text-foreground text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-foreground/30 text-sm w-6 text-center">ig</span>
            <input
              type="url"
              value={content.socialLinks?.instagram || ''}
              onChange={(e) => onChange({
                ...content,
                socialLinks: { ...content.socialLinks, instagram: e.target.value },
              })}
              placeholder="https://instagram.com/..."
              className="flex-1 glass-input rounded-lg px-3 py-2 text-foreground text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-foreground/30 text-sm w-6 text-center">🌐</span>
            <input
              type="url"
              value={content.socialLinks?.web || ''}
              onChange={(e) => onChange({
                ...content,
                socialLinks: { ...content.socialLinks, web: e.target.value },
              })}
              placeholder="https://www.vas-tym.cz"
              className="flex-1 glass-input rounded-lg px-3 py-2 text-foreground text-sm"
            />
          </div>
        </div>
      </div>

      {/* Kontaktní osoby */}
      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-2">Kontaktní osoby</label>
        <div className="space-y-3">
          {(content.people || []).map((person, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-surface border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-foreground/50 text-xs font-medium">Osoba {idx + 1}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = [...(content.people || [])];
                    next.splice(idx, 1);
                    onChange({ ...content, people: next });
                  }}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  Odebrat
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={person.name}
                  onChange={(e) => {
                    const next = [...(content.people || [])];
                    next[idx] = { ...next[idx], name: e.target.value };
                    onChange({ ...content, people: next });
                  }}
                  placeholder="Jméno"
                  className="glass-input rounded-lg px-3 py-2 text-foreground text-sm"
                />
                <input
                  type="text"
                  value={person.role}
                  onChange={(e) => {
                    const next = [...(content.people || [])];
                    next[idx] = { ...next[idx], role: e.target.value };
                    onChange({ ...content, people: next });
                  }}
                  placeholder="Funkce (např. Trenér)"
                  className="glass-input rounded-lg px-3 py-2 text-foreground text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="tel"
                  value={person.phone || ''}
                  onChange={(e) => {
                    const next = [...(content.people || [])];
                    next[idx] = { ...next[idx], phone: e.target.value };
                    onChange({ ...content, people: next });
                  }}
                  placeholder="Telefon (volitelné)"
                  className="glass-input rounded-lg px-3 py-2 text-foreground text-sm"
                />
                <input
                  type="email"
                  value={person.email || ''}
                  onChange={(e) => {
                    const next = [...(content.people || [])];
                    next[idx] = { ...next[idx], email: e.target.value };
                    onChange({ ...content, people: next });
                  }}
                  placeholder="Email (volitelné)"
                  className="glass-input rounded-lg px-3 py-2 text-foreground text-sm"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const next = [...(content.people || []), { name: '', role: '' }];
              onChange({ ...content, people: next });
            }}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-border text-foreground/40 hover:text-blue-500 hover:border-blue-400 text-sm font-medium transition-colors"
          >
            + Přidat osobu
          </button>
        </div>
      </div>
    </div>
  );
}
