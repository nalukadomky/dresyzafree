'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import type { ContactContent } from '@/lib/db-website';

interface Props {
  content: ContactContent;
  primaryColor: string;
}

export function ContactSection({ content, primaryColor }: Props) {
  const isDark = content.variant === 'dark';
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const hasPeople = content.people && content.people.length > 0 && content.people.some(p => p.name);
  const hasContent =
    content.address || content.phone || content.email ||
    content.socialLinks?.facebook || content.socialLinks?.instagram || content.socialLinks?.web ||
    hasPeople;

  if (!hasContent) return null;

  return (
    <section
      ref={sectionRef}
      className="py-16 px-6"
      style={{ background: isDark ? '#0F172A' : undefined }}
    >
      <div className="max-w-2xl mx-auto text-center">
        <motion.h2
          className="text-3xl font-bold mb-8"
          style={{ color: isDark ? '#F8FAFC' : '#1E293B' }}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {content.title || 'Kontakt'}
        </motion.h2>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
        >
          {content.address && (
            <div>
              <p
                className="text-sm uppercase tracking-wider mb-1"
                style={{ color: isDark ? '#64748B' : '#94A3B8' }}
              >
                Adresa
              </p>
              <p style={{ color: isDark ? '#E2E8F0' : '#334155' }}>{content.address}</p>
            </div>
          )}

          {(content.phone || content.email) && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {content.phone && (
                <a
                  href={`tel:${content.phone.replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
                  style={{ color: isDark ? '#E2E8F0' : '#334155' }}
                >
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm"
                    style={{ background: isDark ? `${primaryColor}25` : `${primaryColor}15`, color: primaryColor }}
                  >
                    📞
                  </span>
                  {content.phone}
                </a>
              )}
              {content.email && (
                <a
                  href={`mailto:${content.email}`}
                  className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
                  style={{ color: isDark ? '#E2E8F0' : '#334155' }}
                >
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm"
                    style={{ background: isDark ? `${primaryColor}25` : `${primaryColor}15`, color: primaryColor }}
                  >
                    ✉️
                  </span>
                  {content.email}
                </a>
              )}
            </div>
          )}

          {/* Contact people */}
          {hasPeople && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {content.people!.filter(p => p.name).map((person, idx) => (
                <motion.div
                  key={idx}
                  className="rounded-xl p-4 text-left"
                  style={{
                    background: isDark ? '#1E293B' : '#F8FAFC',
                    border: isDark ? '1px solid #334155' : '1px solid #F1F5F9',
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.4, delay: 0.25 + idx * 0.08, ease: 'easeOut' }}
                >
                  <p
                    className="font-semibold text-sm"
                    style={{ color: isDark ? '#F1F5F9' : '#1E293B' }}
                  >
                    {person.name}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: primaryColor }}
                  >
                    {person.role}
                  </p>
                  {(person.phone || person.email) && (
                    <div className="mt-2 space-y-1">
                      {person.phone && (
                        <a
                          href={`tel:${person.phone.replace(/\s/g, '')}`}
                          className="block text-xs hover:opacity-80 transition-opacity"
                          style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                        >
                          📞 {person.phone}
                        </a>
                      )}
                      {person.email && (
                        <a
                          href={`mailto:${person.email}`}
                          className="block text-xs hover:opacity-80 transition-opacity"
                          style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                        >
                          ✉️ {person.email}
                        </a>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Social links */}
          {(content.socialLinks?.facebook || content.socialLinks?.instagram || content.socialLinks?.web) && (
            <motion.div
              className="flex justify-center gap-3 pt-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4, delay: 0.35, ease: 'easeOut' }}
            >
              {content.socialLinks?.facebook && (
                <motion.a
                  href={content.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm"
                  style={{ background: primaryColor }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                >
                  f
                </motion.a>
              )}
              {content.socialLinks?.instagram && (
                <motion.a
                  href={content.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm"
                  style={{ background: primaryColor }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ig
                </motion.a>
              )}
              {content.socialLinks?.web && (
                <motion.a
                  href={content.socialLinks.web}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm"
                  style={{ background: primaryColor }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🌐
                </motion.a>
              )}
            </motion.div>
          )}
        </motion.div>

        {content.mapEmbedUrl && (
          <motion.div
            className="mt-8 rounded-xl overflow-hidden shadow-sm"
            style={{ border: isDark ? '1px solid #334155' : '1px solid #F1F5F9' }}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
          >
            <iframe
              src={content.mapEmbedUrl}
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>
        )}
      </div>
    </section>
  );
}
