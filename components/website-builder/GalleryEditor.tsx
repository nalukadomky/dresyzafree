'use client';

import type { GalleryContent, GalleryImage, SectionVariant } from '@/lib/db-website';
import { ImageUploader } from './ImageUploader';

interface Props {
  content: GalleryContent;
  onChange: (c: GalleryContent) => void;
  teamId: string;
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

function ColumnsPicker({ value, onChange }: { value: 2 | 3 | 4 | undefined; onChange: (v: 2 | 3 | 4) => void }) {
  const cols = value || 3;
  return (
    <div>
      <label className="block text-foreground/70 text-sm font-medium mb-2">Počet sloupců</label>
      <div className="flex gap-2">
        {([2, 3, 4] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
              cols === n
                ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                : 'border-border bg-surface text-foreground/50 hover:border-foreground/20'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function GalleryEditor({ content, onChange, teamId }: Props) {
  const addImage = (url: string) => {
    const img: GalleryImage = { id: crypto.randomUUID(), url, caption: '' };
    onChange({ ...content, images: [...content.images, img] });
  };

  const updateImage = (id: string, updates: Partial<GalleryImage>) => {
    onChange({
      ...content,
      images: content.images.map((img) => (img.id === id ? { ...img, ...updates } : img)),
    });
  };

  const removeImage = (id: string) => {
    onChange({ ...content, images: content.images.filter((img) => img.id !== id) });
  };

  return (
    <div className="space-y-4">
      <VariantPicker
        value={content.variant}
        onChange={(v) => onChange({ ...content, variant: v })}
      />
      <ColumnsPicker
        value={content.columns}
        onChange={(v) => onChange({ ...content, columns: v })}
      />

      <div>
        <label className="block text-foreground/70 text-sm font-medium mb-1">Nadpis</label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          placeholder="Galerie"
          className="w-full glass-input rounded-xl px-4 py-2.5 text-foreground"
        />
      </div>

      {/* Images */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-foreground/70 text-sm font-medium">
            Fotky ({content.images.length})
          </label>
        </div>

        <div className="space-y-3">
          {content.images.map((img) => (
            <div key={img.id} className="flex gap-3 items-start p-3 rounded-xl bg-surface">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-foreground/5 shrink-0">
                {img.url ? (
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-foreground/20">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                <input
                  type="text"
                  value={img.caption || ''}
                  onChange={(e) => updateImage(img.id, { caption: e.target.value })}
                  placeholder="Popisek (volitelné)"
                  className="w-full glass-input rounded-lg px-3 py-1.5 text-foreground text-sm"
                />
                <ImageUploader
                  currentUrl={img.url}
                  onUpload={(url) => updateImage(img.id, { url })}
                  teamId={teamId}
                  type={`gallery-${img.id}`}
                  compact
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="text-foreground/20 hover:text-red-400 text-xs p-1 mt-1"
              >
                ✕
              </button>
            </div>
          ))}

          {/* Add image button */}
          <ImageUploader
            onUpload={addImage}
            teamId={teamId}
            type="gallery-new"
            label="Přidat fotku"
          />
        </div>
      </div>
    </div>
  );
}
