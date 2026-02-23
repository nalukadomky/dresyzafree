'use client';

import type { ContactContent } from '@/lib/db-website';

interface Props {
  content: ContactContent;
  primaryColor: string;
}

export function ContactSection({ content, primaryColor }: Props) {
  const isDark = content.variant === 'dark';
  const hasContent =
    content.address || content.phone || content.email ||
    content.socialLinks?.facebook || content.socialLinks?.instagram || content.socialLinks?.web;

  if (!hasContent) return null;

  return (
    <section
      className="py-16 px-6"
      style={{ background: isDark ? '#0F172A' : undefined }}
    >
      <div className="max-w-2xl mx-auto text-center">
        <h2
          className="text-3xl font-bold mb-8"
          style={{ color: isDark ? '#F8FAFC' : '#1E293B' }}
        >
          {content.title || 'Kontakt'}
        </h2>

        <div className="space-y-4">
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

          {/* Social links */}
          {(content.socialLinks?.facebook || content.socialLinks?.instagram || content.socialLinks?.web) && (
            <div className="flex justify-center gap-3 pt-4">
              {content.socialLinks?.facebook && (
                <a
                  href={content.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm hover:scale-110 transition-transform"
                  style={{ background: primaryColor }}
                >
                  f
                </a>
              )}
              {content.socialLinks?.instagram && (
                <a
                  href={content.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm hover:scale-110 transition-transform"
                  style={{ background: primaryColor }}
                >
                  ig
                </a>
              )}
              {content.socialLinks?.web && (
                <a
                  href={content.socialLinks.web}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm hover:scale-110 transition-transform"
                  style={{ background: primaryColor }}
                >
                  🌐
                </a>
              )}
            </div>
          )}
        </div>

        {content.mapEmbedUrl && (
          <div
            className="mt-8 rounded-xl overflow-hidden shadow-sm"
            style={{ border: isDark ? '1px solid #334155' : '1px solid #F1F5F9' }}
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
          </div>
        )}
      </div>
    </section>
  );
}
