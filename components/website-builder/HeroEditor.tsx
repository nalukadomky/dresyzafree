'use client';

import { useState } from 'react';
import type { HeroContent } from '@/lib/db-website';
import { ImageUploader } from './ImageUploader';
import { PexelsPicker } from './PexelsPicker';

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

const LOGO_SIZE_OPTIONS = [
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
  const [bgPopup, setBgPopup] = useState<null | 'choose' | 'upload' | 'pexels'>(null);

  return (
    <div className="space-y-4">
      <ToggleRow
        label="Zobrazit logo"
        description="Logo týmu v hlavním banneru"
        checked={content.showLogo !== false}
        onChange={(v) => onChange({ ...content, showLogo: v })}
      />

      {content.showLogo !== false && (
        <div>
          <label className="block text-foreground/70 text-sm font-medium mb-2">Tvar loga</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...content, logoShape: 'free' })}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                (content.logoShape || 'free') === 'free'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                  : 'border-border bg-surface text-foreground/50 hover:border-foreground/20'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
              Volný
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...content, logoShape: 'circle' })}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                content.logoShape === 'circle'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                  : 'border-border bg-surface text-foreground/50 hover:border-foreground/20'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="12" cy="12" r="9" />
              </svg>
              Kruh
            </button>
          </div>
        </div>
      )}

      {content.showLogo !== false && content.logoShape === 'circle' && (
        <div className="space-y-3 p-3 rounded-xl bg-surface border border-border">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-foreground/70 text-sm font-medium">Zoom</label>
              <span className="text-foreground/40 text-xs">{(content.logoZoom || 1).toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={content.logoZoom ?? 1}
              onChange={(e) => onChange({ ...content, logoZoom: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-foreground/70 text-sm font-medium">Horizontální posun</label>
              <span className="text-foreground/40 text-xs">{content.logoOffsetX || 0}%</span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              step="1"
              value={content.logoOffsetX ?? 0}
              onChange={(e) => onChange({ ...content, logoOffsetX: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-foreground/70 text-sm font-medium">Vertikální posun</label>
              <span className="text-foreground/40 text-xs">{content.logoOffsetY || 0}%</span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              step="1"
              value={content.logoOffsetY ?? 0}
              onChange={(e) => onChange({ ...content, logoOffsetY: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      )}

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

      {/* Logo size */}
      {content.showLogo !== false && (
        <div>
          <label className="block text-foreground/70 text-sm font-medium mb-2">Velikost loga</label>
          <div className="flex gap-2">
            {LOGO_SIZE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ ...content, logoSize: value })}
                className={`flex-1 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  (content.logoSize || 'md') === value
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                    : 'border-border bg-surface text-foreground/50 hover:border-foreground/20'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Free vertical position */}
      <ToggleRow
        label="Volné pozicování"
        description="Přetáhněte logo a text nahoru/dolů v banneru"
        checked={content.freePosition === true}
        onChange={(v) => onChange({
          ...content,
          freePosition: v,
          ...(v && content.logoPositionY == null ? { logoPositionY: 20 } : {}),
          ...(v && content.textPositionY == null ? { textPositionY: 60 } : {}),
        })}
      />

      {content.freePosition && (
        <div className="space-y-3 p-3 rounded-xl bg-surface border border-border">
          <p className="text-foreground/50 text-xs">
            Přetahujte prvky v náhledu nahoru/dolů, nebo upravte posuvníkem.
          </p>

          {content.showLogo !== false && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-foreground/70 text-sm font-medium">Pozice loga</label>
                <span className="text-foreground/40 text-xs">{content.logoPositionY ?? 20}%</span>
              </div>
              <input type="range" min="5" max="95" step="1" value={content.logoPositionY ?? 20}
                onChange={(e) => onChange({ ...content, logoPositionY: parseInt(e.target.value) })}
                className="w-full" />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-foreground/70 text-sm font-medium">Pozice textu</label>
              <span className="text-foreground/40 text-xs">{content.textPositionY ?? 60}%</span>
            </div>
            <input type="range" min="5" max="95" step="1" value={content.textPositionY ?? 60}
              onChange={(e) => onChange({ ...content, textPositionY: parseInt(e.target.value) })}
              className="w-full" />
          </div>

          <button
            type="button"
            onClick={() => onChange({
              ...content,
              logoPositionY: 20,
              textPositionY: 60,
            })}
            className="w-full px-3 py-2 rounded-xl border border-border text-foreground/50 text-xs hover:text-foreground hover:border-foreground/20 transition-colors"
          >
            Resetovat pozice na výchozí
          </button>
        </div>
      )}

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

      {/* Background image */}
      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-2">Obrázek pozadí</label>

        {/* Current image preview or add button */}
        {content.backgroundImage ? (
          <div className="relative rounded-xl overflow-hidden">
            <img src={content.backgroundImage} alt="Pozadí" className="w-full h-24 object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 hover:bg-black/40 transition-colors group">
              <button
                type="button"
                onClick={() => setBgPopup('choose')}
                className="px-3 py-1.5 rounded-lg bg-white/90 text-gray-800 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                Změnit
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...content, backgroundImage: undefined })}
                className="px-3 py-1.5 rounded-lg bg-red-500/90 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
              >
                Odebrat
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setBgPopup('choose')}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 border-dashed border-border text-foreground/50 text-sm font-medium hover:border-blue-400 hover:text-blue-500 hover:bg-blue-500/5 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            Nahrát obrázek pozadí
          </button>
        )}

        {/* Popup overlay */}
        {bgPopup && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setBgPopup(null)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
              className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Popup header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-foreground font-semibold text-sm">
                  {bgPopup === 'choose' && 'Obrázek pozadí'}
                  {bgPopup === 'upload' && 'Nahrát z počítače'}
                  {bgPopup === 'pexels' && 'Fotobanka Pexels'}
                </h3>
                <button
                  type="button"
                  onClick={() => setBgPopup(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-surface transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4">
                {/* Choose source */}
                {bgPopup === 'choose' && (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setBgPopup('upload')}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border bg-surface hover:border-blue-400 hover:bg-blue-500/5 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-foreground text-sm font-medium group-hover:text-blue-500 transition-colors">Nahrát z počítače</p>
                        <p className="text-foreground/40 text-xs">Vyberte obrázek z vašeho zařízení</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBgPopup('pexels')}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border bg-surface hover:border-blue-400 hover:bg-blue-500/5 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-foreground text-sm font-medium group-hover:text-emerald-500 transition-colors">Hledat ve fotobance Pexels</p>
                        <p className="text-foreground/40 text-xs">Tisíce bezplatných fotografií</p>
                      </div>
                    </button>
                  </div>
                )}

                {/* Upload from computer */}
                {bgPopup === 'upload' && (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setBgPopup('choose')}
                      className="flex items-center gap-1 text-foreground/40 text-xs hover:text-foreground transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                      Zpět
                    </button>
                    <ImageUploader
                      currentUrl={content.backgroundImage}
                      onUpload={(url) => {
                        onChange({ ...content, backgroundImage: url });
                        setBgPopup(null);
                      }}
                      teamId={teamId}
                      type="hero-bg"
                      label="Nahrát obrázek pozadí"
                    />
                  </div>
                )}

                {/* Pexels search */}
                {bgPopup === 'pexels' && (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setBgPopup('choose')}
                      className="flex items-center gap-1 text-foreground/40 text-xs hover:text-foreground transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                      Zpět
                    </button>
                    <PexelsPicker
                      onSelect={(url) => {
                        onChange({ ...content, backgroundImage: url });
                        setBgPopup(null);
                      }}
                      onClose={() => setBgPopup(null)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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
