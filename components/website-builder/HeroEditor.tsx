'use client';

import type { HeroContent } from '@/lib/db-website';
import { ImageUploader } from './ImageUploader';

interface Props {
  content: HeroContent;
  onChange: (c: HeroContent) => void;
  teamId: string;
  teamName: string;
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

const SIZE_OPTIONS = [
  { value: 'sm' as const, label: 'S' },
  { value: 'md' as const, label: 'M' },
  { value: 'lg' as const, label: 'L' },
  { value: 'xl' as const, label: 'XL' },
];

const BG_PRESETS = [
  { color: '', label: 'Bez' },
  { color: '#1E3A5F', label: '' },
  { color: '#0F172A', label: '' },
  { color: '#1E40AF', label: '' },
  { color: '#15803D', label: '' },
  { color: '#7C3AED', label: '' },
  { color: '#DC2626', label: '' },
  { color: '#B45309', label: '' },
];

export function HeroEditor({ content, onChange, teamId, teamName }: Props) {
  return (
    <div className="space-y-4">
      <ToggleRow
        label="Zobrazit logo"
        description="Logo týmu v hlavním banneru"
        checked={content.showLogo !== false}
        onChange={(v) => onChange({ ...content, showLogo: v })}
      />

      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-1">Nadpis</label>
        <input
          type="text"
          value={content.headline}
          onChange={(e) => onChange({ ...content, headline: e.target.value })}
          placeholder={teamName}
          className="w-full glass-input rounded-xl px-4 py-2.5 text-foreground"
        />
        <p className="text-foreground/30 text-xs mt-1">Nechte prázdné pro automatický název týmu</p>
      </div>

      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-1">Podnadpis</label>
        <input
          type="text"
          value={content.subtitle}
          onChange={(e) => onChange({ ...content, subtitle: e.target.value })}
          placeholder="Krátký popisek vašeho týmu..."
          className="w-full glass-input rounded-xl px-4 py-2.5 text-foreground"
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

      {/* Headline size */}
      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-2">Velikost nadpisu</label>
        <div className="flex gap-2">
          {SIZE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ ...content, headlineSize: value })}
              className={`flex-1 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                (content.headlineSize || 'lg') === value
                  ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                  : 'border-border bg-surface text-foreground/50 hover:border-foreground/20'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Background color */}
      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-2">Barva pozadí</label>
        <div className="flex items-center gap-2 flex-wrap">
          {BG_PRESETS.map(({ color, label }) => (
            <button
              key={color || 'none'}
              type="button"
              onClick={() => onChange({ ...content, backgroundColor: color || undefined })}
              className={`w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center text-[10px] ${
                (content.backgroundColor || '') === color
                  ? 'border-blue-500 scale-110'
                  : 'border-border hover:border-foreground/30'
              }`}
              style={{
                background: color || undefined,
              }}
              title={label || color}
            >
              {!color && (
                <svg className="w-4 h-4 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              )}
            </button>
          ))}
          {/* Custom color picker */}
          <div className="relative">
            <input
              type="color"
              value={content.backgroundColor || '#1E3A5F'}
              onChange={(e) => onChange({ ...content, backgroundColor: e.target.value })}
              className="absolute inset-0 opacity-0 w-8 h-8 cursor-pointer"
            />
            <div
              className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center cursor-pointer ${
                content.backgroundColor && !BG_PRESETS.find((p) => p.color === content.backgroundColor)
                  ? 'border-blue-500 scale-110'
                  : 'border-border hover:border-foreground/30'
              }`}
              style={{
                background: content.backgroundColor && !BG_PRESETS.find((p) => p.color === content.backgroundColor)
                  ? content.backgroundColor
                  : undefined,
              }}
            >
              <svg className="w-4 h-4 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-1">Obrázek pozadí</label>
        <ImageUploader
          currentUrl={content.backgroundImage}
          onUpload={(url) => onChange({ ...content, backgroundImage: url })}
          teamId={teamId}
          type="hero-bg"
          label="Nahrát obrázek pozadí"
        />
      </div>
      {content.backgroundImage && (
        <div>
          <label className="block text-foreground/70 text-sm font-medium mb-1">
            Tmavost překryvu ({Math.round((content.backgroundOverlayOpacity || 0.5) * 100)}%)
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={content.backgroundOverlayOpacity ?? 0.5}
            onChange={(e) => onChange({ ...content, backgroundOverlayOpacity: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
