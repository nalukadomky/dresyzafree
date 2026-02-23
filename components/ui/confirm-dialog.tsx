'use client';

import { useState, useCallback, createContext, useContext, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ────────────────────────────────────────────────────────────

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

// ── Context ──────────────────────────────────────────────────────────

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>');
  return ctx.confirm;
}

// ── Provider ─────────────────────────────────────────────────────────

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<(ConfirmOptions & { id: number }) | null>(null);
  const resolveRef = useRef<((v: boolean) => void) | null>(null);
  const idRef = useRef(0);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setDialog({ ...options, id: ++idRef.current });
    });
  }, []);

  const close = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setDialog(null);
  }, []);

  const variant = dialog?.variant || 'default';

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {dialog && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
              onClick={() => close(false)}
            />
            <motion.div
              key={`dialog-${dialog.id}`}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            >
              <div
                className="w-full max-w-sm rounded-2xl border border-border bg-[var(--glass-bg)] dark:bg-[rgba(8,12,19,0.94)] shadow-2xl p-6"
                style={{ backdropFilter: 'blur(20px) saturate(120%)' }}
              >
                {dialog.title && (
                  <h3 className="text-lg font-bold text-foreground mb-2">{dialog.title}</h3>
                )}
                <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-line">
                  {dialog.message}
                </p>
                <div className="flex items-center justify-end gap-3 mt-6">
                  <button
                    onClick={() => close(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-foreground/60 hover:text-foreground bg-surface hover:bg-surface-hover border border-border transition-colors"
                  >
                    {dialog.cancelLabel || 'Zrušit'}
                  </button>
                  <button
                    onClick={() => close(true)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      variant === 'danger'
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {dialog.confirmLabel || 'Potvrdit'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}
