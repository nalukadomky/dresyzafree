'use client';

import { useState, useRef, useCallback } from 'react';

interface PexelsPhoto {
  id: number;
  src: { medium: string; large2x: string };
  photographer: string;
  photographer_url: string;
  url: string;
  alt: string;
}

interface Props {
  onSelect: (url: string) => void;
  onClose: () => void;
}

const PEXELS_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY || '';

export function PexelsPicker({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback(async (q: string) => {
    if (!q.trim() || !PEXELS_KEY) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=30&orientation=landscape&locale=cs-CZ`,
        { headers: { Authorization: PEXELS_KEY } }
      );
      const data = await res.json();
      setPhotos(data.photos || []);
    } catch {
      setPhotos([]);
    }
    setLoading(false);
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 500);
  };

  if (!PEXELS_KEY) {
    return (
      <div className="p-4 rounded-xl bg-surface border border-border text-center">
        <p className="text-foreground/40 text-sm">
          Pexels API klíč není nastaven. Přidejte <code className="text-foreground/60">NEXT_PUBLIC_PEXELS_API_KEY</code> do <code className="text-foreground/60">.env.local</code>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search(query)}
            placeholder="Hledat fotky (např. fotbal, stadion, sport...)"
            className="w-full glass-input rounded-xl pl-9 pr-4 py-2.5 text-foreground text-sm"
            autoFocus
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 rounded-xl text-foreground/40 hover:text-foreground text-sm transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Results grid */}
      {!loading && photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 max-h-[420px] overflow-y-auto rounded-xl">
          {photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => onSelect(photo.src.large2x)}
              className="group relative rounded-lg overflow-hidden aspect-[16/10] hover:ring-2 hover:ring-blue-500 transition-all"
            >
              <img
                src={photo.src.medium}
                alt={photo.alt || 'Pexels photo'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="absolute bottom-1 left-1.5 right-1.5 text-[10px] text-white/80 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {photo.photographer}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && searched && photos.length === 0 && (
        <div className="text-center py-8">
          <p className="text-foreground/40 text-sm">Žádné výsledky pro &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {/* Initial state */}
      {!loading && !searched && (
        <div className="text-center py-6">
          <div className="text-3xl mb-2 opacity-30">📷</div>
          <p className="text-foreground/40 text-sm">Zadejte hledaný výraz pro vyhledání fotek</p>
        </div>
      )}

      {/* Attribution */}
      <p className="text-foreground/20 text-[10px] text-center">
        Fotky z{' '}
        <a
          href="https://www.pexels.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground/40"
        >
          Pexels
        </a>
      </p>
    </div>
  );
}
