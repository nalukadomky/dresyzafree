'use client';

import type { AboutContent, SectionVariant } from '@/lib/db-website';

interface Props {
  content: AboutContent;
  onChange: (c: AboutContent) => void;
}

function VariantPicker({ value, onChange }: { value: SectionVariant | undefined; onChange: (v: SectionVariant) => void }) {
  const variant = value || 'light';
  return (
    <div>
      <label className="block text-foreground/70 text-sm font-medium mb-2">Varianta pozadi</label>
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

const ALIGN_OPTIONS = [
  { value: 'left' as const, icon: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" />
    </svg>
  )},
  { value: 'center' as const, icon: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  )},
  { value: 'right' as const, icon: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="9" y1="12" x2="21" y2="12" /><line x1="6" y1="18" x2="21" y2="18" />
    </svg>
  )},
];

export function AboutEditor({ content, onChange }: Props) {
  return (
    <div className="space-y-4">
      <VariantPicker
        value={content.variant}
        onChange={(v) => onChange({ ...content, variant: v })}
      />

      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-1">Nadpis</label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          placeholder="O nas"
          className="w-full glass-input rounded-xl px-4 py-2.5 text-foreground"
        />
      </div>

      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-1">Text</label>
        <textarea
          value={content.text}
          onChange={(e) => onChange({ ...content, text: e.target.value })}
          placeholder="Napiste neco o vasem tymu..."
          rows={4}
          className="w-full glass-input rounded-xl px-4 py-2.5 text-foreground resize-none"
        />
      </div>

      {/* Text alignment */}
      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-2">Zarovnani textu</label>
        <div className="flex gap-2">
          {ALIGN_OPTIONS.map(({ value, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ ...content, textAlign: value })}
              className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl border-2 transition-all ${
                (content.textAlign || 'center') === value
                  ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                  : 'border-border bg-surface text-foreground/50 hover:border-foreground/20'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Line height */}
      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-1">
          Vyska radku ({(content.lineHeight ?? 1.7).toFixed(1)})
        </label>
        <input
          type="range"
          min="1.0"
          max="2.5"
          step="0.1"
          value={content.lineHeight ?? 1.7}
          onChange={(e) => onChange({ ...content, lineHeight: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Letter spacing */}
      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-1">
          Mezery mezi pismeny ({(content.letterSpacing ?? 0).toFixed(2)}px)
        </label>
        <input
          type="range"
          min="0"
          max="3"
          step="0.25"
          value={content.letterSpacing ?? 0}
          onChange={(e) => onChange({ ...content, letterSpacing: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>
    </div>
  );
}
