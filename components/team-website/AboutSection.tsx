'use client';

import type { AboutContent } from '@/lib/db-website';

interface Props {
  content: AboutContent;
  primaryColor: string;
}

export function AboutSection({ content, primaryColor }: Props) {
  const isDark = content.variant === 'dark';
  const align = content.textAlign || 'center';
  const lineHeight = content.lineHeight ?? 1.7;
  const letterSpacing = content.letterSpacing ?? 0;

  return (
    <section
      className="py-16 px-6"
      style={{
        background: isDark ? '#0F172A' : undefined,
      }}
    >
      <div className="max-w-3xl mx-auto">
        <h2
          className="text-3xl font-bold mb-6 text-center"
          style={{ color: isDark ? '#F8FAFC' : '#1E293B' }}
        >
          {content.title || 'O nas'}
        </h2>
        {content.text && (
          <p
            className="whitespace-pre-line"
            style={{
              color: isDark ? '#94A3B8' : '#64748B',
              textAlign: align,
              lineHeight,
              letterSpacing: letterSpacing ? `${letterSpacing}px` : undefined,
            }}
          >
            {content.text}
          </p>
        )}
      </div>
    </section>
  );
}
