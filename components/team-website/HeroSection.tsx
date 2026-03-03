'use client';

import { useRef, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import type { HeroContent } from '@/lib/db-website';

interface Props {
  content: HeroContent;
  teamName: string;
  logo?: string;
  primaryColor: string;
  isEditing?: boolean;
  onContentChange?: (content: HeroContent) => void;
}

const HEADLINE_SIZE_MAP: Record<string, string> = {
  sm: 'text-2xl sm:text-3xl md:text-4xl',
  md: 'text-3xl sm:text-4xl md:text-5xl',
  lg: 'text-4xl sm:text-5xl md:text-6xl',
  xl: 'text-5xl sm:text-6xl md:text-7xl',
};

const LOGO_SIZE_MAP: Record<string, string> = {
  sm: 'w-16 h-16 sm:w-20 sm:h-20',
  md: 'w-24 h-24 sm:w-32 sm:h-32',
  lg: 'w-32 h-32 sm:w-40 sm:h-40',
  xl: 'w-40 h-40 sm:w-48 sm:h-48',
};

function clampPercent(v: number) {
  return Math.round(Math.max(5, Math.min(95, v)));
}

export function HeroSection({ content, teamName, logo, primaryColor, isEditing, onContentChange }: Props) {
  const containerRef = useRef<HTMLElement>(null);
  const animRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(animRef, { once: true, amount: 0.3 });
  const headline = content.headline || teamName;
  const align = content.textAlign || 'center';
  const headlineSizeClass = HEADLINE_SIZE_MAP[content.headlineSize || 'lg'] || HEADLINE_SIZE_MAP.lg;
  const logoSizeClass = LOGO_SIZE_MAP[content.logoSize || 'md'] || LOGO_SIZE_MAP.md;
  const showLogo = content.showLogo !== false;
  const isFree = content.freePosition === true;

  const hasBg = !!content.backgroundImage;
  const hasCustomBg = !!content.backgroundColor;

  const sectionBg = hasBg
    ? undefined
    : hasCustomBg
      ? content.backgroundColor
      : `linear-gradient(135deg, ${primaryColor}22 0%, ${primaryColor}08 100%)`;

  const textColor = hasBg || hasCustomBg ? '#fff' : '#1E293B';
  const subtitleColor = hasBg || hasCustomBg ? 'rgba(255,255,255,0.85)' : '#64748B';

  const alignWrapperClass =
    align === 'left'
      ? 'text-left max-w-7xl pl-8 md:pl-16 lg:pl-24 pr-6'
      : align === 'right'
        ? 'text-right max-w-7xl pr-8 md:pr-16 lg:pr-24 pl-6'
        : 'text-center max-w-3xl mx-auto px-6';

  const logoAlignClass =
    align === 'left' ? 'mr-auto' : align === 'right' ? 'ml-auto' : 'mx-auto';

  const subtitleMargin =
    align === 'center'
      ? { marginLeft: 'auto', marginRight: 'auto' }
      : align === 'right'
        ? { marginLeft: 'auto' }
        : {};

  // Vertical-only drag handler for logo
  const handleLogoDragEnd = useCallback((_: unknown, info: { point: { x: number; y: number } }) => {
    const el = containerRef.current;
    if (!el || !onContentChange) return;
    const rect = el.getBoundingClientRect();
    onContentChange({
      ...content,
      logoPositionY: clampPercent(((info.point.y - rect.top) / rect.height) * 100),
    });
  }, [content, onContentChange]);

  // Vertical-only drag handler for text
  const handleTextDragEnd = useCallback((_: unknown, info: { point: { x: number; y: number } }) => {
    const el = containerRef.current;
    if (!el || !onContentChange) return;
    const rect = el.getBoundingClientRect();
    onContentChange({
      ...content,
      textPositionY: clampPercent(((info.point.y - rect.top) / rect.height) * 100),
    });
  }, [content, onContentChange]);

  // Logo element
  const logoElement = logo && showLogo ? (
    content.logoShape === 'circle' ? (
      <div className={`${logoSizeClass} rounded-full overflow-hidden ${!isFree ? logoAlignClass : logoAlignClass} ${!isFree ? 'mb-6' : ''} drop-shadow-lg`}>
        <img
          src={logo}
          alt={teamName}
          className="w-full h-full object-cover"
          style={{
            transform: `scale(${content.logoZoom || 1}) translate(${content.logoOffsetX || 0}%, ${content.logoOffsetY || 0}%)`,
          }}
        />
      </div>
    ) : (
      <img
        src={logo}
        alt={teamName}
        className={`${logoSizeClass} object-contain ${!isFree ? logoAlignClass : logoAlignClass} ${!isFree ? 'mb-6' : ''} drop-shadow-lg`}
      />
    )
  ) : null;

  // Draggable wrapper style for edit mode
  const dragEditClass = isEditing
    ? 'cursor-grab active:cursor-grabbing rounded-xl hover:outline hover:outline-2 hover:outline-dashed hover:outline-blue-400/50'
    : '';

  return (
    <section
      ref={containerRef}
      className="relative min-h-[60vh] flex items-center overflow-hidden"
      style={{
        background: sectionBg || undefined,
        justifyContent: align === 'right' ? 'flex-end' : align === 'left' ? 'flex-start' : 'center',
      }}
    >
      {hasBg && (
        <>
          <img
            src={content.backgroundImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: content.backgroundOverlayOpacity ?? 0.5 }}
          />
        </>
      )}

      {isFree ? (
        /* ===== FREE VERTICAL POSITION MODE ===== */
        <div className={`relative z-10 ${alignWrapperClass} w-full`} style={{ minHeight: '60vh' }}>
          {/* Logo — vertically draggable */}
          {logoElement && (
            isEditing ? (
              <motion.div
                drag="y"
                dragConstraints={containerRef}
                dragMomentum={false}
                dragElastic={0}
                onDragEnd={handleLogoDragEnd}
                whileDrag={{ scale: 1.05, boxShadow: '0 0 0 3px #3B82F6' }}
                className={`absolute left-0 right-0 z-20 ${dragEditClass}`}
                style={{
                  top: `${content.logoPositionY ?? 20}%`,
                  transform: 'translateY(-50%)',
                }}
                onPointerDownCapture={(e: React.PointerEvent) => e.stopPropagation()}
              >
                {logoElement}
              </motion.div>
            ) : (
              <motion.div
                className="absolute left-0 right-0 z-20"
                style={{
                  top: `${content.logoPositionY ?? 20}%`,
                  transform: 'translateY(-50%)',
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                {logoElement}
              </motion.div>
            )
          )}

          {/* Text — vertically draggable */}
          {isEditing ? (
            <motion.div
              drag="y"
              dragConstraints={containerRef}
              dragMomentum={false}
              dragElastic={0}
              onDragEnd={handleTextDragEnd}
              whileDrag={{ scale: 1.02, boxShadow: '0 0 0 3px #3B82F6' }}
              className={`absolute left-0 right-0 z-10 ${dragEditClass}`}
              style={{
                top: `${content.textPositionY ?? 60}%`,
                transform: 'translateY(-50%)',
              }}
              onPointerDownCapture={(e: React.PointerEvent) => e.stopPropagation()}
            >
              <h1
                className={`${headlineSizeClass} font-bold mb-4`}
                style={{ color: textColor }}
              >
                {headline}
              </h1>
              {content.subtitle && (
                <p
                  className="text-lg sm:text-xl max-w-xl"
                  style={{ color: subtitleColor, ...subtitleMargin }}
                >
                  {content.subtitle}
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              className="absolute left-0 right-0 z-10"
              style={{
                top: `${content.textPositionY ?? 60}%`,
                transform: 'translateY(-50%)',
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            >
              <h1
                className={`${headlineSizeClass} font-bold mb-4`}
                style={{ color: textColor }}
              >
                {headline}
              </h1>
              {content.subtitle && (
                <motion.p
                  className="text-lg sm:text-xl max-w-xl"
                  style={{ color: subtitleColor, ...subtitleMargin }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                >
                  {content.subtitle}
                </motion.p>
              )}
            </motion.div>
          )}
        </div>
      ) : (
        /* ===== CLASSIC FLEXBOX MODE ===== */
        <div ref={animRef} className={`relative z-10 ${alignWrapperClass} py-16 w-full`}>
          {logoElement && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              {logoElement}
            </motion.div>
          )}
          <motion.h1
            className={`${headlineSizeClass} font-bold mb-4`}
            style={{ color: textColor }}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          >
            {headline}
          </motion.h1>
          {content.subtitle && (
            <motion.p
              className="text-lg sm:text-xl max-w-xl"
              style={{ color: subtitleColor, ...subtitleMargin }}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            >
              {content.subtitle}
            </motion.p>
          )}
        </div>
      )}
    </section>
  );
}
