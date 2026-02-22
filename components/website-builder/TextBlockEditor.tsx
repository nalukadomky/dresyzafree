'use client';

import type { TextBlockContent, SectionVariant } from '@/lib/db-website';

interface Props {
  content: TextBlockContent;
  onChange: (c: TextBlockContent) => void;
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

const FONT_SIZES = [
  { value: 'sm' as const, label: 'S' },
  { value: 'md' as const, label: 'M' },
  { value: 'lg' as const, label: 'L' },
  { value: 'xl' as const, label: 'XL' },
];

export function TextBlockEditor({ content, onChange }: Props) {
  return (
    <div className="space-y-4">
      <VariantPicker
        value={content.variant}
        onChange={(v) => onChange({ ...content, variant: v })}
      />

      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-1">Text</label>
        <textarea
          value={content.text}
          onChange={(e) => onChange({ ...content, text: e.target.value })}
          placeholder="Váš text..."
          rows={5}
          className="w-full glass-input rounded-xl px-4 py-2.5 text-foreground resize-none"
        />
      </div>

      {/* Text alignment */}
      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-2">Zarovnání textu</label>
        <div className="flex gap-2">
          {ALIGN_OPTIONS.map(({ value, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ ...content, textAlign: value })}
              className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl border-2 transition-all ${
                (content.textAlign || 'left') === value
                  ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                  : 'border-border bg-surface text-foreground/50 hover:border-foreground/20'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Font size */}
      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-2">Velikost písma</label>
        <div className="flex gap-2">
          {FONT_SIZES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ ...content, fontSize: value })}
              className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                (content.fontSize || 'md') === value
                  ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                  : 'border-border bg-surface text-foreground/50 hover:border-foreground/20'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Line height */}
      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-1">
          Výška řádku ({(content.lineHeight ?? 1.6).toFixed(1)})
        </label>
        <input
          type="range"
          min="1.0"
          max="3.0"
          step="0.1"
          value={content.lineHeight ?? 1.6}
          onChange={(e) => onChange({ ...content, lineHeight: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Letter spacing */}
      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-1">
          Mezery mezi písmeny ({(content.letterSpacing ?? 0).toFixed(1)}px)
        </label>
        <input
          type="range"
          min="0"
          max="5"
          step="0.5"
          value={content.letterSpacing ?? 0}
          onChange={(e) => onChange({ ...content, letterSpacing: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Vertical padding */}
      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-1">
          Vertikální odsazení ({content.paddingY ?? 48}px)
        </label>
        <input
          type="range"
          min="0"
          max="120"
          step="4"
          value={content.paddingY ?? 48}
          onChange={(e) => onChange({ ...content, paddingY: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>
    </div>
  );
}
