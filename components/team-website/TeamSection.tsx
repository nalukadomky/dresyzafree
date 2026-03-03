'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import type { TeamMembersContent, TeamMember } from '@/lib/db-website';

interface Props {
  content: TeamMembersContent;
  players: { id: string; name: string; jerseyNumber?: number; photoUrl?: string }[];
  primaryColor: string;
}

function MemberAvatar({ member, primaryColor, size = 'md', isDark }: {
  member: TeamMember;
  primaryColor: string;
  size?: 'sm' | 'md' | 'lg';
  isDark: boolean;
}) {
  const initials = member.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses =
    size === 'lg' ? 'w-28 h-28 sm:w-32 sm:h-32' :
    size === 'sm' ? 'w-14 h-14 sm:w-16 sm:h-16' :
    'w-20 h-20 sm:w-24 sm:h-24';
  const textSize =
    size === 'lg' ? 'text-2xl' :
    size === 'sm' ? 'text-sm' :
    'text-lg';

  return (
    <div
      className={`${sizeClasses} rounded-full overflow-hidden border-2 flex items-center justify-center shrink-0`}
      style={{
        borderColor: `${primaryColor}50`,
        background: member.photoUrl ? undefined : isDark ? `${primaryColor}25` : `${primaryColor}15`,
      }}
    >
      {member.photoUrl ? (
        <img
          src={member.photoUrl}
          alt={member.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <span
          className={`${textSize} font-bold`}
          style={{ color: primaryColor }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}

function ContactIcons({ member, primaryColor }: { member: TeamMember; primaryColor: string }) {
  if (!member.email && !member.phone) return null;

  return (
    <div className="flex items-center gap-2 mt-1.5">
      {member.phone && (
        <a
          href={`tel:${member.phone.replace(/\s/g, '')}`}
          className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
          style={{ background: `${primaryColor}20` }}
          title={member.phone}
        >
          <svg className="w-3 h-3" fill="none" stroke={primaryColor} viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </a>
      )}
      {member.email && (
        <a
          href={`mailto:${member.email}`}
          className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
          style={{ background: `${primaryColor}20` }}
          title={member.email}
        >
          <svg className="w-3 h-3" fill="none" stroke={primaryColor} viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </a>
      )}
    </div>
  );
}

const PER_PAGE = 4;

function GalleryView({ members, primaryColor, isDark }: {
  members: TeamMember[];
  primaryColor: string;
  isDark: boolean;
}) {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const totalPages = Math.ceil(members.length / PER_PAGE);

  const goTo = (p: number) => {
    setDirection(p > page ? 1 : -1);
    setPage(p);
  };

  const goPrev = () => { if (page > 0) goTo(page - 1); };
  const goNext = () => { if (page < totalPages - 1) goTo(page + 1); };

  const pageMembers = members.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <div className="relative">
      {/* Navigation arrows */}
      {page > 0 && (
        <button
          type="button"
          onClick={goPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-6 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm"
          style={{
            background: isDark ? '#1E293B' : '#F1F5F9',
            color: isDark ? '#94A3B8' : '#64748B',
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {page < totalPages - 1 && (
        <button
          type="button"
          onClick={goNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-6 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm"
          style={{
            background: isDark ? '#1E293B' : '#F1F5F9',
            color: isDark ? '#94A3B8' : '#64748B',
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Cards grid — up to 4 horizontal cards */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={page}
          custom={direction}
          initial={{ opacity: 0, x: direction * 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -60 }}
          transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {pageMembers.map((member) => (
            <div
              key={member.id}
              className="flex flex-row items-center gap-4 p-4 rounded-2xl transition-transform hover:scale-[1.02]"
              style={{
                background: isDark ? '#1E293B' : `${primaryColor}08`,
                border: isDark ? '1px solid #334155' : `1px solid ${primaryColor}15`,
              }}
            >
              {/* Avatar with optional number badge */}
              <div className="relative shrink-0">
                <MemberAvatar member={member} primaryColor={primaryColor} size="sm" isDark={isDark} />
                {member.number && (
                  <div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0 rounded-full text-[10px] font-bold text-white shadow-sm leading-4"
                    style={{ background: primaryColor }}
                  >
                    #{member.number}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <h3
                  className="font-semibold text-sm truncate"
                  style={{ color: isDark ? '#F1F5F9' : '#1E293B' }}
                >
                  {member.name}
                </h3>
                {member.role && (
                  <p
                    className="text-xs truncate"
                    style={{ color: isDark ? '#64748B' : '#94A3B8' }}
                  >
                    {member.role}
                  </p>
                )}
                <ContactIcons member={member} primaryColor={primaryColor} />
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Dot indicators */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5 mt-6">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className="rounded-full transition-all"
              style={{
                width: i === page ? 24 : 8,
                height: 8,
                background: i === page ? primaryColor : isDark ? '#475569' : '#CBD5E1',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TeamSection({ content, players, primaryColor }: Props) {
  const isDark = content.variant === 'dark';
  const viewMode = content.viewMode || 'grid';
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });

  // Merge roster players + manual members
  const allMembers: TeamMember[] = [];

  if (content.showFromRoster) {
    for (const p of players) {
      const override = content.members.find((m) => m.id === p.id);
      allMembers.push({
        id: p.id,
        name: p.name,
        role: override?.role || '',
        number: override?.number || (p.jerseyNumber != null ? String(p.jerseyNumber) : undefined),
        photoUrl: override?.photoUrl || p.photoUrl,
        email: override?.email,
        phone: override?.phone,
      });
    }
  }

  // Add manual-only members (not in roster)
  const rosterIds = new Set(players.map((p) => p.id));
  for (const m of content.members) {
    if (!rosterIds.has(m.id)) {
      allMembers.push(m);
    }
  }

  if (allMembers.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="py-16 px-6"
      style={{
        background: isDark ? '#0F172A' : undefined,
      }}
    >
      <div className="max-w-5xl mx-auto">
        <motion.h2
          className="text-3xl font-bold mb-2 text-center"
          style={{ color: isDark ? '#F8FAFC' : '#1E293B' }}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {content.title || 'Náš tým'}
        </motion.h2>
        {content.description && (
          <motion.p
            className="text-center mb-10 max-w-xl mx-auto"
            style={{ color: isDark ? '#94A3B8' : '#64748B' }}
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          >
            {content.description}
          </motion.p>
        )}

        {viewMode === 'gallery' ? (
          <GalleryView members={allMembers} primaryColor={primaryColor} isDark={isDark} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {allMembers.map((member, idx) => {
              const initials = member.name
                .split(' ')
                .map((w) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <motion.div
                  key={member.id}
                  className="text-center rounded-2xl p-4"
                  style={{
                    background: isDark ? '#1E293B' : `${primaryColor}08`,
                    border: isDark ? '1px solid #334155' : `1px solid ${primaryColor}15`,
                  }}
                  initial={{ opacity: 0, y: 25 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 25 }}
                  transition={{ duration: 0.4, delay: 0.15 + idx * 0.05, ease: 'easeOut' }}
                  whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                >
                  {/* Avatar */}
                  <div className="relative mx-auto mb-3">
                    <div
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto overflow-hidden border-2 flex items-center justify-center"
                      style={{
                        borderColor: `${primaryColor}50`,
                        background: member.photoUrl ? undefined : isDark ? `${primaryColor}25` : `${primaryColor}15`,
                      }}
                    >
                      {member.photoUrl ? (
                        <img
                          src={member.photoUrl}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span
                          className="text-lg font-bold"
                          style={{ color: primaryColor }}
                        >
                          {initials}
                        </span>
                      )}
                    </div>
                    {/* Jersey number badge */}
                    {member.number && (
                      <div
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
                        style={{ background: primaryColor }}
                      >
                        #{member.number}
                      </div>
                    )}
                  </div>

                  <h3
                    className="font-semibold text-sm"
                    style={{ color: isDark ? '#F1F5F9' : '#1E293B' }}
                  >
                    {member.name}
                  </h3>
                  {member.role && (
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: isDark ? '#64748B' : '#94A3B8' }}
                    >
                      {member.role}
                    </p>
                  )}

                  <div className="flex items-center justify-center">
                    <ContactIcons member={member} primaryColor={primaryColor} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
