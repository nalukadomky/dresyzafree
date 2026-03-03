'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import type { TextBlockContent } from '@/lib/db-website';

interface Props {
  content: TextBlockContent;
  primaryColor: string;
}

const FONT_SIZE_MAP: Record<string, string> = {
  sm: '14px',
  md: '16px',
  lg: '20px',
  xl: '24px',
};

export function TextBlockSection({ content }: Props) {
  const isDark = content.variant === 'dark';
  const align = content.textAlign || 'left';
  const fontSize = FONT_SIZE_MAP[content.fontSize || 'md'];
  const lineHeight = content.lineHeight ?? 1.6;
  const letterSpacing = content.letterSpacing ?? 0;
  const paddingY = content.paddingY ?? 48;
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  if (!content.text) return null;

  return (
    <section
      ref={sectionRef}
      style={{
        background: isDark ? '#0F172A' : undefined,
        paddingTop: `${paddingY}px`,
        paddingBottom: `${paddingY}px`,
      }}
      className="px-6"
    >
      <div className="max-w-3xl mx-auto">
        <motion.p
          className="whitespace-pre-line"
          style={{
            color: isDark ? '#CBD5E1' : '#475569',
            textAlign: align,
            fontSize,
            lineHeight,
            letterSpacing: letterSpacing ? `${letterSpacing}px` : undefined,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {content.text}
        </motion.p>
      </div>
    </section>
  );
}
