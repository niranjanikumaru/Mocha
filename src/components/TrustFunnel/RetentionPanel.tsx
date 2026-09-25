'use client';

/**
 * RetentionPanel.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Separate Retention Panel implementing cohort recurrence:
 *  A_m = A_(m-1) * r(m) + firstLiveTraders_m
 *
 * Shows:
 *  - Prior-month active users
 *  - Retained users this month
 *  - New first live traders this month
 *  - Total active users this month
 *  - Effective monthly retention assumption (with TI-03 badge if active)
 *  - Accurate aggregate cohort recurrence inspection table
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Users, UserPlus, RefreshCw, Shield,
  ArrowRight, Info, CheckCircle2, ChevronRight,
} from 'lucide-react';
import {
  TrustFunnelMonthlySnapshot,
  TrustIntervention,
} from '../../core/growth/trustFunnelModel';

interface RetentionPanelProps {
  selectedSnapshot: TrustFunnelMonthlySnapshot;
  compareSnapshot: TrustFunnelMonthlySnapshot | null;
  allSelectedSnapshots: TrustFunnelMonthlySnapshot[];
  selectedMonth: number;
  interventions: TrustIntervention[];
  onOpenIntervention: (interventionId: string) => void;
}

export default function RetentionPanel({
  selectedSnapshot,
  compareSnapshot,
  allSelectedSnapshots,
  selectedMonth,
  interventions,
  onOpenIntervention,
}: RetentionPanelProps) {
  const s = selectedSnapshot;
  const c = compareSnapshot;

  const [showRecurrenceTable, setShowRecurrenceTable] = useState(false);

  const ti03 = interventions.find((i) => i.id === 'TI-03');

  return (
    <div className="card p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-400" />
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Month {selectedMonth} Retention &amp; Cohort Recurrence
          </h3>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">
            (Active Stock = Retained Prior + New Activations)
          </span>
        </div>

        {/* TI-03 Intervention Badge */}
        {ti03 && (
          <button
            onClick={() => onOpenIntervention('TI-03')}
            className="px-2.5 py-1 rounded-full text-[9px] font-bold font-mono tracking-wide bg-green-950/60 text-green-300 border border-green-500/40 hover:bg-green-900/60 shadow-xs flex items-center gap-1.5 transition-all"
            title="Click to inspect TI-03 hypothesis"
          >
            <Shield className="w-3 h-3 text-green-400" />
            TI-03: Transaction Tracking &amp; Recovery
            <span className="opacity-75">({ti03.evidenceStatus})</span>
          </button>
        )}
      </div>

      {/* Recurrence Equation Visualiser */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
        {/* Step A: Prior Month Active */}
        <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)]">
          <div className="text-[9px] text-[var(--text-muted)] uppercase font-mono mb-1">
            Prior Month Active (M{Math.max(0, selectedMonth - 1)})
          </div>
          <div className="text-[18px] font-mono font-bold text-[var(--text-secondary)]">
            {(selectedMonth === 1 ? 0 : s.retainedFromPriorMonth / Math.max(0.01, s.effectiveRetentionRate)).toFixed(0)}
          </div>
          {c && selectedMonth > 1 && (
            <div className="text-[9px] text-blue-400 font-mono mt-1">
              Comp: {(c.retainedFromPriorMonth / Math.max(0.01, c.effectiveRetentionRate)).toFixed(0)}
            </div>
          )}
        </div>

        {/* Step B: Retained Users This Month */}
        <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] relative">
          <div className="text-[9px] text-[var(--text-muted)] uppercase font-mono mb-1">
            Retained This Month
          </div>
          <div className="text-[18px] font-mono font-bold text-green-400">
            {s.retainedFromPriorMonth.toLocaleString()}
          </div>
          <div className="text-[9px] text-green-400/80 font-mono mt-0.5">
            r = {(s.effectiveRetentionRate * 100).toFixed(1)}% / mo
          </div>
          {c && (
            <div className="text-[9px] text-blue-400 font-mono mt-0.5">
              Comp: {c.retainedFromPriorMonth.toLocaleString()} (r = {(c.effectiveRetentionRate * 100).toFixed(1)}%)
            </div>
          )}
        </div>

        {/* Step C: New Live Traders This Month */}
        <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)]">
          <div className="text-[9px] text-[var(--text-muted)] uppercase font-mono mb-1">
            + New Inflow Activations
          </div>
          <div className="text-[18px] font-mono font-bold text-amber-400">
            +{s.firstLiveTraders.toLocaleString()}
          </div>
          <div className="text-[9px] text-[var(--text-muted)] mt-0.5">From Stage 4 Funnel</div>
          {c && (
            <div className="text-[9px] text-blue-400 font-mono mt-0.5">
              Comp: +{c.firstLiveTraders.toLocaleString()}
            </div>
          )}
        </div>

        {/* Step D: Total Active Traders (Stock) */}
        <div className="p-3 rounded-lg bg-[var(--bg-interactive)] border border-[var(--brand-border)]">
          <div className="text-[9px] text-[var(--brand)] uppercase font-mono font-bold mb-1">
            = Total Active Stock (M{selectedMonth})
          </div>
          <div className="text-[20px] font-mono font-bold text-[var(--text-primary)]">
            {s.activeTraders.toLocaleString()}
          </div>
          {c && (
            <div className="text-[10px] font-mono mt-0.5 flex justify-center gap-1.5">
              <span className="text-blue-400">Comp: {c.activeTraders.toLocaleString()}</span>
              <span className={s.activeTraders >= c.activeTraders ? 'text-amber-400' : 'text-blue-400'}>
                ({s.activeTraders >= c.activeTraders ? '+' : ''}
                {(s.activeTraders - c.activeTraders).toLocaleString()})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Cohort Recurrence Explanation Note */}
      <div className="p-2.5 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-start justify-between gap-3 text-[11px]">
        <div className="space-y-0.5">
          <span className="font-bold text-[var(--text-primary)] flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            Accurate Aggregate Recurrence Model
          </span>
          <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
            Active traders in Month {selectedMonth} ($A_{selectedMonth} = {s.activeTraders.toLocaleString()}$) are derived strictly from
            prior cohort retention ($A_{Math.max(0, selectedMonth - 1)} \times r = {s.retainedFromPriorMonth.toLocaleString()}$) plus newly activated first live traders ($+{s.firstLiveTraders.toLocaleString()}$).
            Retention is a recurring cohort survival calculation over time, never an annual sum.
          </p>
        </div>

        <button
          onClick={() => setShowRecurrenceTable(!showRecurrenceTable)}
          className="btn btn-sm bg-[var(--bg-interactive)] hover:bg-[var(--bg-hover)] text-[10px] font-mono px-2 py-1 text-[var(--text-secondary)] shrink-0 flex items-center gap-1"
        >
          {showRecurrenceTable ? 'Hide Table' : 'Inspect Recurrence Table'}
          <ChevronRight className={`w-3 h-3 transition-transform ${showRecurrenceTable ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Recurrence History Table */}
      {showRecurrenceTable && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="overflow-x-auto pt-2 border-t border-[var(--border-subtle)]"
        >
          <table className="w-full text-left font-mono text-[10px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                <th className="py-1 px-2">Month</th>
                <th className="py-1 px-2">Retention (r)</th>
                <th className="py-1 px-2">Retained From Prior</th>
                <th className="py-1 px-2">New Activations</th>
                <th className="py-1 px-2 font-bold text-[var(--text-primary)]">Active Traders (A_m)</th>
                <th className="py-1 px-2">Trading Volume (USD)</th>
              </tr>
            </thead>
            <tbody>
              {allSelectedSnapshots.map((snap) => (
                <tr
                  key={snap.month}
                  className={`border-b border-[var(--border-subtle)] ${
                    snap.month === selectedMonth ? 'bg-amber-500/10 font-bold text-amber-300' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  <td className="py-1 px-2">Month {snap.month}</td>
                  <td className="py-1 px-2">{(snap.effectiveRetentionRate * 100).toFixed(1)}%</td>
                  <td className="py-1 px-2">{snap.retainedFromPriorMonth.toLocaleString()}</td>
                  <td className="py-1 px-2">+{snap.firstLiveTraders.toLocaleString()}</td>
                  <td className="py-1 px-2 font-bold text-[var(--text-primary)]">{snap.activeTraders.toLocaleString()}</td>
                  <td className="py-1 px-2">${snap.tradingVolumeUsd.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
