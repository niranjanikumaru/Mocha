'use client';

/**
 * DropoffModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Inspects drop-off between funnel stages for the selected month.
 *
 * Categorises drop-off honestly into:
 *  - Operational friction (e.g. payment gateway timeout, bank OTP delay)
 *  - Informed opt-out (e.g. user reviewed leverage risk/costs and responsibly decided against trading)
 *  - Unknown non-completion
 *
 * Clearly labelled as DEMO DATA / ILLUSTRATIVE to avoid fabricating empirical telemetry.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2, HelpCircle, ArrowRight } from 'lucide-react';

export interface DropoffStageData {
  fromStage: string;
  toStage: string;
  month: number;
  enteredCount: number;
  proceededCount: number;
  droppedCount: number;
  conversionRate: number;
}

interface DropoffModalProps {
  data: DropoffStageData | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenIntervention?: (interventionId: string) => void;
}

export default function DropoffModal({
  data,
  isOpen,
  onClose,
  onOpenIntervention,
}: DropoffModalProps) {
  if (!data || !isOpen) return null;

  const { fromStage, toStage, month, enteredCount, proceededCount, droppedCount, conversionRate } = data;

  // Illustrative dropoff breakdown based on stage transition
  const getBreakdown = () => {
    if (fromStage.includes('Prospects') || toStage.includes('Onboarded')) {
      return {
        friction: Math.round(droppedCount * 0.45),
        frictionReasons: ['Document scan blur / KYC camera failure', 'Aadhaar OTP mobile carrier delay'],
        optOut: Math.round(droppedCount * 0.25),
        optOutReasons: ['Hesitant about providing PAN/tax ID', 'Changed mind on derivatives trading'],
        unknown: Math.round(droppedCount * 0.30),
        associatedIntervention: null,
      };
    }
    if (fromStage.includes('Onboarded') || toStage.includes('Funded')) {
      return {
        friction: Math.round(droppedCount * 0.40),
        frictionReasons: ['UPI transaction bank timeout', 'Netbanking session expiry'],
        optOut: Math.round(droppedCount * 0.35),
        optOutReasons: ['Fear of withdrawal lock-in', 'Minimum deposit requirement higher than expected'],
        unknown: Math.round(droppedCount * 0.25),
        associatedIntervention: 'TI-01',
      };
    }
    // Funded -> First Live Trade
    return {
      friction: Math.round(droppedCount * 0.20),
      frictionReasons: ['Order ticket entry confusion', 'Mobile interface layout lag'],
      optOut: Math.round(droppedCount * 0.55),
      optOutReasons: ['Saw adverse market move and decided not to risk capital', 'Fee schedule review caused hesitation'],
      unknown: Math.round(droppedCount * 0.25),
      associatedIntervention: 'TI-02',
    };
  };

  const b = getBreakdown();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-4 bg-[var(--bg-elevated)] border-b border-[var(--border)] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  DEMO DATA · ILLUSTRATIVE
                </span>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">Month {month} Transition</span>
              </div>
              <h3 className="text-[15px] font-bold text-[var(--text-primary)] mt-1">
                Drop-off Analysis: {fromStage} → {toStage}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4 text-[12px]">

            {/* Numerical Stage Transition */}
            <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)]">
              <div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase">Entered {fromStage}</div>
                <div className="text-[16px] font-mono font-bold text-[var(--text-primary)]">{enteredCount.toLocaleString()}</div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="text-[10px] text-amber-400 font-bold">{(conversionRate * 100).toFixed(1)}% proceed</div>
                <div className="w-full h-1 bg-[var(--bg-interactive)] rounded mt-1 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded" style={{ width: `${Math.min(100, conversionRate * 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--red)] uppercase">Did Not Proceed</div>
                <div className="text-[16px] font-mono font-bold text-[var(--red)]">{droppedCount.toLocaleString()}</div>
              </div>
            </div>

            {/* Categorised Reasons */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
                <span>Drop-off Categorisation</span>
                <span className="text-[9px] text-[var(--text-muted)] font-normal italic">
                  Distinguishes friction vs informed opt-out
                </span>
              </div>

              {/* 1. Operational Friction */}
              <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border-l-2 border-red-500 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-red-400">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Operational Friction (System / Process)
                  </span>
                  <span className="font-mono">{b.friction.toLocaleString()} users</span>
                </div>
                <ul className="text-[10px] text-[var(--text-secondary)] list-disc list-inside space-y-0.5 pt-1">
                  {b.frictionReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              {/* 2. Informed Opt-Out */}
              <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border-l-2 border-amber-500 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Informed Opt-out (User Discretion)
                  </span>
                  <span className="font-mono">{b.optOut.toLocaleString()} users</span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Users who reviewed conditions and responsibly chose not to commit:
                </p>
                <ul className="text-[10px] text-[var(--text-secondary)] list-disc list-inside space-y-0.5">
                  {b.optOutReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              {/* 3. Unknown Non-completion */}
              <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border-l-2 border-zinc-600 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Unknown Reason (Abandonment)
                  </span>
                  <span className="font-mono">{b.unknown.toLocaleString()} users</span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Session closed or abandoned without explicit error or survey feedback.
                </p>
              </div>
            </div>

            {/* Associated Intervention Link */}
            {b.associatedIntervention && onOpenIntervention && (
              <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Addressed by intervention <strong className="text-[var(--brand)]">{b.associatedIntervention}</strong>
                </span>
                <button
                  onClick={() => {
                    onClose();
                    onOpenIntervention(b.associatedIntervention!);
                  }}
                  className="btn btn-sm bg-[var(--brand-dim)] text-[var(--brand)] border border-[var(--brand-border)] hover:bg-[rgba(245,158,11,0.2)] text-[11px] px-2.5 py-1 flex items-center gap-1"
                >
                  Inspect {b.associatedIntervention} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
