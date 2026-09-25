'use client';

/**
 * DemoModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Embeds working proof demonstrations (such as /proof/terminal) directly inside
 * a modal so founders can inspect the working implementation without losing
 * scenario edits. Also provides a button to open in a new tab.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, ShieldCheck } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  demoRoute: string | null;
  demoTitle: string;
}

export default function DemoModal({
  isOpen,
  onClose,
  demoRoute,
  demoTitle,
}: DemoModalProps) {
  if (!isOpen || !demoRoute) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-5xl h-[88vh] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xl flex flex-col z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="p-3 bg-[var(--bg-elevated)] border-b border-[var(--border)] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-[var(--brand-dim)] flex items-center justify-center text-[var(--brand)] border border-[var(--brand-border)]">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-[var(--text-primary)] leading-none">
                  Live Proof Demonstration: {demoTitle}
                </h3>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">Route: {demoRoute}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={demoRoute}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm bg-[var(--bg-interactive)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] text-[11px] px-2 py-1 flex items-center gap-1"
              >
                Open in New Tab <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={onClose}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Iframe embedding the actual working demo route */}
          <div className="flex-1 bg-[var(--bg-base)] relative overflow-hidden">
            <iframe
              src={demoRoute}
              title={`Demo: ${demoTitle}`}
              className="w-full h-full border-0"
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
