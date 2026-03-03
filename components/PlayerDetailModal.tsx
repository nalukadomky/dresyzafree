'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { resizeImageFile, getCroppedImage } from '@/lib/image-utils';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Player {
  id: string;
  teamId: string;
  name: string;
  jerseyNumber?: number;
  photoUrl?: string;
}

interface MatchRating {
  matchId: string;
  date: string;
  opponent: string;
  avgScore: number;
  voteCount: number;
}

interface PlayerDetailModalProps {
  player: Player;
  teamId: string;
  token: string;
  isCoach: boolean;
  onClose: () => void;
  onPlayerUpdated: (player: Player) => void;
  onPlayerDeleted: (playerId: string) => void;
}

export default function PlayerDetailModal({
  player,
  teamId,
  token,
  isCoach,
  onClose,
  onPlayerUpdated,
  onPlayerDeleted,
}: PlayerDetailModalProps) {
  const [jerseyNumber, setJerseyNumber] = useState(
    player.jerseyNumber != null ? String(player.jerseyNumber) : ''
  );
  const [savingJersey, setSavingJersey] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(player.photoUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [deletePhotoConfirm, setDeletePhotoConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletingPlayer, setDeletingPlayer] = useState(false);

  // Crop state
  const [cropMode, setCropMode] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Ratings
  const [ratings, setRatings] = useState<MatchRating[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(true);

  // Season stats (goals, assists, cards)
  const [playerStats, setPlayerStats] = useState<{ goals: number; assists: number; yellowCards: number; redCards: number } | null>(null);

  // Current season label (July–June)
  const currentSeason = (() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    return m >= 7 ? `${y}/${String(y + 1).slice(-2)}` : `${y - 1}/${String(y).slice(-2)}`;
  })();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [ratingsRes, statsRes] = await Promise.all([
          fetch(`/api/teams/${teamId}/ratings?playerId=${player.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/teams/${teamId}/canadian-scoring?season=${encodeURIComponent(currentSeason)}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const ratingsData = await ratingsRes.json().catch(() => ({}));
        if (active && ratingsData.playerRatings) setRatings(ratingsData.playerRatings);
        const statsData = await statsRes.json().catch(() => ({}));
        if (active && statsData.stats) {
          const found = (statsData.stats as { playerId: string; goals: number; assists: number; yellowCards: number; redCards: number }[])
            .find((s) => s.playerId === player.id);
          setPlayerStats(found ? { goals: found.goals, assists: found.assists, yellowCards: found.yellowCards, redCards: found.redCards } : { goals: 0, assists: 0, yellowCards: 0, redCards: 0 });
        }
      } catch {
        // silent
      } finally {
        if (active) setLoadingRatings(false);
      }
    })();
    return () => { active = false; };
  }, [player.id, teamId, token, currentSeason]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const headers = () => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  });

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const url = URL.createObjectURL(file);
    setRawImageSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropMode(true);
  };

  const handleCropConfirm = async () => {
    if (!rawImageSrc || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const croppedBlob = await getCroppedImage(rawImageSrc, croppedAreaPixels);
      const resizedBlob = await resizeImageFile(croppedBlob);

      const formData = new FormData();
      formData.append('photo', resizedBlob, 'photo.jpg');

      const res = await fetch(`/api/teams/${teamId}/players/${player.id}/photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.photoUrl) {
        setPhotoPreview(d.photoUrl);
        onPlayerUpdated({ ...player, photoUrl: d.photoUrl });
      }
    } catch {
      // silent
    } finally {
      setUploading(false);
      setCropMode(false);
      if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
      setRawImageSrc(null);
    }
  };

  const handleCropCancel = () => {
    setCropMode(false);
    if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
    setRawImageSrc(null);
  };

  const handleEditExistingPhoto = () => {
    if (!photoPreview) return;
    setRawImageSrc(photoPreview);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropMode(true);
  };

  const handleDeletePhoto = async () => {
    setDeletingPhoto(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/players/${player.id}/photo`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPhotoPreview(null);
        onPlayerUpdated({ ...player, photoUrl: undefined });
      }
    } catch {
      // silent
    } finally {
      setDeletingPhoto(false);
    }
  };

  const handleSaveJersey = async () => {
    setSavingJersey(true);
    try {
      const jn = jerseyNumber.trim() ? Number(jerseyNumber.trim()) : null;
      const res = await fetch(`/api/teams/${teamId}/players/${player.id}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ jerseyNumber: jn }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.player) {
        onPlayerUpdated(d.player);
      }
    } catch {
      // silent
    } finally {
      setSavingJersey(false);
    }
  };

  const handleDeletePlayer = async () => {
    setDeletingPlayer(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/players/${player.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        onPlayerDeleted(player.id);
      }
    } catch {
      // silent
    } finally {
      setDeletingPlayer(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative glass-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-border max-h-[90vh] overflow-y-auto z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {cropMode ? (
            /* ===== CROP MODE ===== */
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Oříznout fotku
              </h3>
              <div className="relative w-full h-64 rounded-xl overflow-hidden bg-black/50">
                <Cropper
                  image={rawImageSrc!}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              {/* Zoom slider */}
              <div className="mt-4 flex items-center gap-3">
                <svg className="w-4 h-4 text-foreground/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
                </svg>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 h-1.5 appearance-none rounded-full bg-foreground/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <svg className="w-4 h-4 text-foreground/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                </svg>
              </div>
              {/* Actions */}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={handleCropCancel}
                  className="flex-1 px-4 py-3 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-foreground font-medium transition-colors"
                >
                  Zrušit
                </button>
                <button
                  onClick={handleCropConfirm}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <LoadingSpinner />
                      Nahrávám...
                    </>
                  ) : (
                    'Použít'
                  )}
                </button>
              </div>
              <button
                onClick={() => { setCropMode(false); fileInputRef.current?.click(); }}
                className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors self-center"
              >
                Nahrát jinou fotku
              </button>
            </div>
          ) : (
            /* ===== NORMAL DETAIL VIEW ===== */
            <div>
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-foreground/10 text-foreground/50 hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Photo circle */}
              <div className="flex flex-col items-center mb-5">
                <div
                  className="relative w-28 h-28 rounded-full overflow-hidden bg-surface border-2 border-border mb-3 cursor-pointer group"
                  onClick={() => photoPreview ? handleEditExistingPhoto() : fileInputRef.current?.click()}
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt={player.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-foreground/20">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                    {photoPreview ? (
                      <>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        <span className="text-white text-[10px] font-medium">Upravit</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                        </svg>
                        <span className="text-white text-[10px] font-medium">Nahrát</span>
                      </>
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {photoPreview && !deletePhotoConfirm && (
                  <button
                    onClick={() => setDeletePhotoConfirm(true)}
                    disabled={deletingPhoto}
                    className="text-red-400 hover:text-red-300 transition-colors text-xs"
                  >
                    Smazat fotku
                  </button>
                )}
                {deletePhotoConfirm && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-foreground/60">Opravdu smazat?</span>
                    <button
                      onClick={() => { setDeletePhotoConfirm(false); handleDeletePhoto(); }}
                      disabled={deletingPhoto}
                      className="text-red-400 hover:text-red-300 transition-colors font-medium"
                    >
                      {deletingPhoto ? 'Mažu...' : 'Ano'}
                    </button>
                    <button
                      onClick={() => setDeletePhotoConfirm(false)}
                      className="text-foreground/50 hover:text-foreground/70 transition-colors"
                    >
                      Ne
                    </button>
                  </div>
                )}
              </div>

              {/* Player name */}
              <h2 className="text-2xl font-bold text-foreground text-center mb-1">
                {player.name}
              </h2>
              {isCoach && (
                <p className="text-blue-400 text-sm text-center mb-1">Trenér</p>
              )}

              {/* Jersey number */}
              <div className="mt-5">
                <label className="block text-foreground/60 text-xs uppercase tracking-wider mb-1.5">
                  Číslo dresu
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={jerseyNumber}
                    onChange={(e) =>
                      setJerseyNumber(e.target.value.replace(/\D/g, '').slice(0, 2))
                    }
                    placeholder="—"
                    className="flex-1 px-4 py-2.5 rounded-xl glass-input text-foreground placeholder-foreground/30 text-center text-lg font-medium"
                  />
                  <button
                    onClick={handleSaveJersey}
                    disabled={savingJersey}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
                  >
                    {savingJersey ? '...' : 'Uložit'}
                  </button>
                </div>
              </div>

              {/* Season stats */}
              <div className="mt-6">
                <label className="block text-foreground/60 text-xs uppercase tracking-wider mb-2">
                  Sezóna {currentSeason}
                </label>
                {playerStats ? (
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { label: 'Góly', value: playerStats.goals, color: 'text-foreground' },
                      { label: 'Asist.', value: playerStats.assists, color: 'text-foreground' },
                      { label: '🟨', value: playerStats.yellowCards, color: playerStats.yellowCards > 0 ? 'text-yellow-400' : 'text-foreground' },
                      { label: '🟥', value: playerStats.redCards, color: playerStats.redCards > 0 ? 'text-red-400' : 'text-foreground' },
                      { label: 'Hodnocení', value: ratings.length > 0 ? (ratings.reduce((s, r) => s + r.avgScore, 0) / ratings.length).toFixed(1) : '—', color: 'text-blue-400' },
                    ].map((stat) => (
                      <div key={stat.label} className="flex flex-col items-center py-2.5 px-1 rounded-xl bg-surface border border-border">
                        <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
                        <span className="text-foreground/40 text-[10px] uppercase tracking-wider mt-0.5">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-center py-3">
                    <LoadingSpinner />
                  </div>
                )}
              </div>

              {/* Ratings section */}
              <div className="mt-6">
                <label className="block text-foreground/60 text-xs uppercase tracking-wider mb-2">
                  Hodnocení ze zápasů
                </label>
                {loadingRatings ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner />
                  </div>
                ) : ratings.length === 0 ? (
                  <p className="text-foreground/30 text-sm text-center py-3">
                    Zatím žádná hodnocení
                  </p>
                ) : (
                  <>
                    {/* Overall average */}
                    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-surface border border-border mb-2">
                      <span className="text-foreground/60 text-sm">Celkový průměr</span>
                      <span className="text-blue-400 font-bold text-lg">
                        {(ratings.reduce((s, r) => s + r.avgScore, 0) / ratings.length).toFixed(1)}
                        <span className="text-foreground/30 text-sm font-normal"> / 10</span>
                      </span>
                    </div>
                    {/* Per-match list */}
                    <ul className="space-y-1 max-h-48 overflow-y-auto">
                      {ratings.map((r) => (
                        <li
                          key={r.matchId}
                          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-foreground/[0.04] transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-foreground text-sm truncate">
                              {r.opponent || 'Zápas'}
                            </p>
                            <p className="text-foreground/30 text-xs">
                              {new Date(r.date).toLocaleDateString('cs-CZ')}
                              <span className="ml-1.5 text-foreground/20">
                                ({r.voteCount} {r.voteCount === 1 ? 'hlas' : r.voteCount < 5 ? 'hlasy' : 'hlasů'})
                              </span>
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-3">
                            <span className={`font-bold text-sm ${
                              r.avgScore >= 8 ? 'text-green-400' :
                              r.avgScore >= 5 ? 'text-blue-400' :
                              r.avgScore >= 3 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {r.avgScore}
                            </span>
                            <span className="text-foreground/20 text-xs">/ 10</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              {/* Separator + Delete player */}
              <div className="border-t border-border mt-6 pt-4">
                {deleteConfirm ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-foreground font-medium transition-colors"
                    >
                      Zrušit
                    </button>
                    <button
                      onClick={handleDeletePlayer}
                      disabled={deletingPlayer}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50"
                    >
                      {deletingPlayer ? 'Mažu...' : 'Ano, smazat'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="w-full text-red-400 hover:text-red-300 text-sm py-2 transition-colors"
                  >
                    Smazat hráče
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
