'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { WebsiteSectionType } from '@/lib/db-website';
import { SECTION_LABELS, SECTION_ICONS } from './EditableSection';

interface Props {
  open: boolean;
  sectionType: WebsiteSectionType | null;
  onClose: () => void;
  children: React.ReactNode;
}

export function SectionDrawer({ open, sectionType, onClose, children }: Props) {
  return (
    <AnimatePresence>
      {open && sectionType && (
        <>
          {/* Backdrop - mobile only */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-background z-50 shadow-2xl border-l border-border flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">{SECTION_ICONS[sectionType]}</span>
                <h2 className="text-base font-semibold text-foreground">
                  {SECTION_LABELS[sectionType]}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-foreground/40 hover:text-foreground hover:bg-surface transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content - scrollable */}
            <div className="flex-1 overflow-y-auto p-5">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
