'use client';

import type { EventsContent, SectionVariant } from '@/lib/db-website';

interface Props {
  content: EventsContent;
  onChange: (c: EventsContent) => void;
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-surface">
      <div>
        <p className="text-foreground text-sm font-medium">{label}</p>
        <p className="text-foreground/40 text-xs">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-blue-500' : 'bg-foreground/20'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
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

export function EventsEditor({ content, onChange }: Props) {
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
          placeholder="Nadcházející akce"
          className="w-full glass-input rounded-xl px-4 py-2.5 text-foreground"
        />
      </div>
      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-1">
          Maximální počet zobrazených akcí
        </label>
        <input
          type="number"
          min="1"
          max="20"
          value={content.maxEvents}
          onChange={(e) => onChange({ ...content, maxEvents: parseInt(e.target.value) || 5 })}
          className="w-24 glass-input rounded-xl px-4 py-2.5 text-foreground"
        />
      </div>
      <div className="space-y-2">
        <ToggleRow
          label="Zobrazovat tréninky"
          description="Tréninky zadané v aplikaci"
          checked={content.showTrainings}
          onChange={(v) => onChange({ ...content, showTrainings: v })}
        />
        <ToggleRow
          label="Zobrazovat zápasy"
          description="Přátelské i soutěžní zápasy"
          checked={content.showMatches}
          onChange={(v) => onChange({ ...content, showMatches: v })}
        />
      </div>
      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <p className="text-blue-400 text-sm">
          Akce se automaticky propisují z vaší aplikace. Stačí přidávat události v sekci „Události/docházka".
        </p>
      </div>
    </div>
  );
}
