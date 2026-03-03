'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import type { GalleryContent } from '@/lib/db-website';

interface Props {
  content: GalleryContent;
  primaryColor: string;
}

export function GallerySection({ content, primaryColor }: Props) {
  const isDark = content.variant === 'dark';
  const columns = content.columns || 3;
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });

  if (!content.images || content.images.length === 0) return null;

  const gridCols =
    columns === 2 ? 'grid-cols-1 sm:grid-cols-2'
    : columns === 4 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <>
      <section
        ref={sectionRef}
        className="py-16 px-6"
        style={{ background: isDark ? '#0F172A' : undefined }}
      >
        <div className="max-w-5xl mx-auto">
          <motion.h2
            className="text-3xl font-bold mb-8 text-center"
            style={{ color: isDark ? '#F8FAFC' : '#1E293B' }}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {content.title || 'Galerie'}
          </motion.h2>

          <div className={`grid ${gridCols} gap-3`}>
            {content.images.map((img, idx) => (
              <motion.button
                key={img.id}
                onClick={() => setLightboxIdx(idx)}
                className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: 0.1 + idx * 0.06, ease: 'easeOut' }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <img
                  src={img.url}
                  alt={img.caption || ''}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {img.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm">{img.caption}</p>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Animated Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxIdx(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Close */}
            <button
              onClick={() => setLightboxIdx(null)}
              className="absolute top-4 right-4 text-white/60 hover:text-white text-3xl z-10"
            >
              ✕
            </button>

            {/* Nav prev */}
            {lightboxIdx > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-4xl z-10"
              >
                ‹
              </button>
            )}

            {/* Image with animation */}
            <AnimatePresence mode="wait">
              <motion.img
                key={lightboxIdx}
                src={content.images[lightboxIdx].url}
                alt={content.images[lightboxIdx].caption || ''}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              />
            </AnimatePresence>

            {/* Nav next */}
            {lightboxIdx < content.images.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-4xl z-10"
              >
                ›
              </button>
            )}

            {/* Caption */}
            {content.images[lightboxIdx].caption && (
              <motion.p
                className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/50 px-4 py-2 rounded-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {content.images[lightboxIdx].caption}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
