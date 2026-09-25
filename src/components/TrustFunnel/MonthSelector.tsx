'use client';

/**
 * MonthSelector.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * 12-month selector allowing founders to navigate across months 1 to 12.
 * Clearly emphasizes that the acquisition funnel displays NEW entrants during
 * the selected month, preventing conflation of annual totals with monthly progression.
 */

import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthSelectorProps {
  selectedMonth: number;
  onSelectMonth: (month: number) => void;
  maxMonths?: number;
}

export default function MonthSelector({
  selectedMonth,
  onSelectMonth,
  maxMonths = 12,
}: MonthSelectorProps) {
  const months = Array.from({ length: maxMonths }, (_, i) => i + 1);

  return (
    <div className="card p-2.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg flex flex-wrap items-center justify-between gap-3">
      {/* Label and Clarification */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-[var(--bg-interactive)] flex items-center justify-center text-amber-400">
          <Calendar className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-[var(--text-primary)]">
            Projection Month Timeline
          </span>
          <span className="text-[10px] text-[var(--text-muted)] block sm:inline sm:ml-2">
            Funnel shows <strong className="text-amber-400 font-semibold">new entrants in Month {selectedMonth}</strong> (distinct from 12-month totals).
          </span>
        </div>
      </div>

      {/* Month Pills and Step Buttons */}
      <div className="flex items-center gap-1 overflow-x-auto py-0.5">
        <button
          onClick={() => onSelectMonth(Math.max(1, selectedMonth - 1))}
          disabled={selectedMonth <= 1}
          className="p-1 rounded bg-[var(--bg-interactive)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
          title="Previous month"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {months.map((m) => (
          <button
            key={m}
            onClick={() => onSelectMonth(m)}
            className={`min-w-7 h-7 px-1.5 rounded text-[10px] font-mono font-bold transition-all ${
              m === selectedMonth
                ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.35)] scale-105'
                : 'bg-[var(--bg-interactive)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            M{m}
          </button>
        ))}

        <button
          onClick={() => onSelectMonth(Math.min(maxMonths, selectedMonth + 1))}
          disabled={selectedMonth >= maxMonths}
          className="p-1 rounded bg-[var(--bg-interactive)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
          title="Next month"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
