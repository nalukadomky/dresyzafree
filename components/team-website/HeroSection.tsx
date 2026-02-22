'use client';

import type { HeroContent } from '@/lib/db-website';

interface Props {
  content: HeroContent;
  teamName: string;
  logo?: string;
  primaryColor: string;
}

const SIZE_MAP: Record<string, string> = {
  sm: 'text-2xl sm:text-3xl md:text-4xl',
  md: 'text-3xl sm:text-4xl md:text-5xl',
  lg: 'text-4xl sm:text-5xl md:text-6xl',
  xl: 'text-5xl sm:text-6xl md:text-7xl',
};

export function HeroSection({ content, teamName, logo, primaryColor }: Props) {
  const headline = content.headline || teamName;
  const align = content.textAlign || 'center';
  const sizeClass = SIZE_MAP[content.headlineSize || 'lg'] || SIZE_MAP.lg;
  const showLogo = content.showLogo !== false;

  const hasBg = !!content.backgroundImage;
  const hasCustomBg = !!content.backgroundColor;

  // Determine background
  const sectionBg = hasBg
    ? undefined
    : hasCustomBg
      ? content.backgroundColor
      : `linear-gradient(135deg, ${primaryColor}22 0%, ${primaryColor}08 100%)`;

  // Text colors depend on background darkness
  const textColor = hasBg || hasCustomBg ? '#fff' : '#1E293B';
  const subtitleColor = hasBg || hasCustomBg ? 'rgba(255,255,255,0.85)' : '#64748B';

  // Alignment classes — left/right push to screen edges like homepage
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

  return (
    <section
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

      <div className={`relative z-10 ${alignWrapperClass} py-16 w-full`}>
        {logo && showLogo && (
          <img
            src={logo}
            alt={teamName}
            className={`w-24 h-24 sm:w-32 sm:h-32 object-contain ${logoAlignClass} mb-6 drop-shadow-lg`}
          />
        )}
        <h1
          className={`${sizeClass} font-bold mb-4`}
          style={{ color: textColor }}
        >
          {headline}
        </h1>
        {content.subtitle && (
          <p
            className="text-lg sm:text-xl max-w-xl"
            style={{
              color: subtitleColor,
              ...subtitleMargin,
            }}
          >
            {content.subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
