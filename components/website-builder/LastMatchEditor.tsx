'use client';

import type { LastMatchContent, SectionVariant } from '@/lib/db-website';

interface Props {
  content: LastMatchContent;
  onChange: (c: LastMatchContent) => void;
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

export function LastMatchEditor({ content, onChange }: Props) {
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
          placeholder="Poslední zápas"
          className="w-full glass-input rounded-xl px-4 py-2.5 text-foreground"
        />
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={content.showScorers}
          onChange={(e) => onChange({ ...content, showScorers: e.target.checked })}
          className="w-4 h-4 rounded accent-blue-500"
        />
        <span className="text-foreground/70 text-sm">Zobrazit střelce</span>
      </label>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={content.showVoting}
          onChange={(e) => onChange({ ...content, showVoting: e.target.checked })}
          className="w-4 h-4 rounded accent-blue-500"
        />
        <span className="text-foreground/70 text-sm">Zobrazit hlasování fanoušků</span>
      </label>
      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <p className="text-blue-400 text-sm">
          Automaticky zobrazuje výsledek posledního zápasu včetně skóre, střelců a hlasování fanoušků.
        </p>
      </div>
    </div>
  );
}
