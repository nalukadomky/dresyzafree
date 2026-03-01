'use client';

import { useState } from 'react';
import type { WebsiteSectionType } from '@/lib/db-website';

const SECTION_LABELS: Record<WebsiteSectionType, string> = {
  hero: 'Úvod',
  team: 'Náš tým',
  events: 'Akce',
  contact: 'Kontakt',
  about: 'O nás',
  gallery: 'Galerie',
  textblock: 'Textové pole',
  'fan-voting': 'Hráč zápasu',
};

const SECTION_ICONS: Record<WebsiteSectionType, string> = {
  hero: '🏠',
  team: '👥',
  events: '📅',
  contact: '📞',
  about: '📝',
  gallery: '🖼️',
  textblock: '📄',
  'fan-voting': '⭐',
};

interface Props {
  type: WebsiteSectionType;
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  children: React.ReactNode;
}

export function EditableSection({ type, isActive, isFirst, isLast, onEdit, onRemove, onMoveUp, onMoveDown, children }: Props) {
  const [hovered, setHovered] = useState(false);
  const showOverlay = hovered || isActive;

  return (
    <div
      className="relative group cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onEdit}
    >
      {/* The actual section content */}
      <div
        className="transition-all duration-200"
        style={{
          outline: isActive
            ? '2px solid #3B82F6'
            : hovered
              ? '2px dashed #93C5FD'
              : '2px solid transparent',
          outlineOffset: '-2px',
          borderRadius: '0px',
        }}
      >
        {children}
      </div>

      {/* Hover/active overlay toolbar */}
      {showOverlay && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
          {/* Move up */}
          {!isFirst && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
              className="p-1.5 bg-white/90 text-slate-600 rounded-lg shadow-lg hover:bg-slate-100 transition-colors border border-slate-200"
              title="Posunout nahoru"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
          {/* Move down */}
          {!isLast && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
              className="p-1.5 bg-white/90 text-slate-600 rounded-lg shadow-lg hover:bg-slate-100 transition-colors border border-slate-200"
              title="Posunout dolů"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          {/* Edit */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Upravit
          </button>
          {/* Remove */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-1.5 bg-white/90 text-red-500 rounded-lg shadow-lg hover:bg-red-50 transition-colors border border-red-200"
            title="Odebrat sekci"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      {/* Section label badge - top left */}
      {showOverlay && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-200 text-xs text-slate-600 font-medium">
          <span>{SECTION_ICONS[type]}</span>
          {SECTION_LABELS[type]}
        </div>
      )}
    </div>
  );
}

export { SECTION_LABELS, SECTION_ICONS };
