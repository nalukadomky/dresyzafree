'use client';

import { useRef, useState } from 'react';

interface Props {
  currentUrl?: string;
  onUpload: (url: string) => void;
  teamId: string;
  type: string;
  label?: string;
  className?: string;
  compact?: boolean;
}

export function ImageUploader({ currentUrl, onUpload, teamId, type, label = 'Nahrát obrázek', className = '', compact = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || '');

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Maximální velikost je 5 MB');
      return;
    }

    // Show local preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const form = new FormData();
      form.append('file', file);
      form.append('type', type);

      const res = await fetch(`/api/teams/${teamId}/website/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setPreview(data.url);
        onUpload(data.url);
      } else {
        alert(data.error || 'Chyba uploadu');
      }
    } catch {
      alert('Chyba uploadu');
    } finally {
      setUploading(false);
    }
  };

  // ── Compact mode (circular avatar) ──────────────────────────────
  if (compact) {
    return (
      <div className={className}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-dashed border-border hover:border-blue-400 transition-colors group shrink-0"
        >
          {preview ? (
            <>
              <img src={preview} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-foreground/30 group-hover:text-blue-400 transition-colors">
              {uploading ? (
                <div className="w-4 h-4 border-2 border-foreground/20 border-t-blue-500 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </div>
          )}
        </button>
      </div>
    );
  }

  // ── Standard mode (full-width rectangle) ────────────────────────
  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {preview ? (
        <div className="relative group">
          <img src={preview} alt="" className="w-full h-32 object-cover rounded-xl border border-border" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-white/20 text-white text-xs rounded-lg hover:bg-white/30"
              disabled={uploading}
            >
              {uploading ? 'Nahrávám...' : 'Změnit'}
            </button>
            <button
              type="button"
              onClick={() => { setPreview(''); onUpload(''); }}
              className="px-3 py-1.5 bg-red-500/30 text-white text-xs rounded-lg hover:bg-red-500/50"
            >
              Odstranit
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 text-foreground/40 hover:border-blue-400 hover:text-blue-400 transition-colors"
        >
          {uploading ? (
            <span className="text-sm">Nahrávám...</span>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs">{label}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
