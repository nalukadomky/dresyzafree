'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
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
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  return (
    <section
      ref={sectionRef}
      className="py-16 px-6"
      style={{
        background: isDark ? '#0F172A' : undefined,
      }}
    >
      <div className="max-w-3xl mx-auto">
        <motion.h2
          className="text-3xl font-bold mb-6 text-center"
          style={{ color: isDark ? '#F8FAFC' : '#1E293B' }}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {content.title || 'O nas'}
        </motion.h2>
        {content.text && (
          <motion.p
            className="whitespace-pre-line"
            style={{
              color: isDark ? '#94A3B8' : '#64748B',
              textAlign: align,
              lineHeight,
              letterSpacing: letterSpacing ? `${letterSpacing}px` : undefined,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          >
            {content.text}
          </motion.p>
        )}
      </div>
    </section>
  );
}
