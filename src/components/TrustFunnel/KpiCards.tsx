'use client';

/**
 * KpiCards.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Four primary founder KPI cards comparing Selected Strategy vs Comparator:
 *  1. Year-One First-Live-Trade Activations (Real Capital Activations)
 *  2. Month-12 Active Traders (Ending Active Stock)
 *  3. Year-One Programme Cost (Explicitly Defined: Hosting + Benefits + Setup + Maint)
 *  4. Year-One Contribution (Net Revenue - Operating & Programme Costs)
 *
 * Shows absolute differences (Δ).
 * Explicitly warns that positive volume or user counts are not automatically economically better.
 * Both scenarios may remain loss-making despite positive deltas.
 */

import React from 'react';
import {
  Zap, Users, DollarSign, PieChart, TrendingUp, TrendingDown,
  Info, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { TrustFunnelModelOutput } from '../../core/growth/trustFunnelModel';

interface KpiCardsProps {
  selectedOutput: TrustFunnelModelOutput;
  compareOutput: TrustFunnelModelOutput | null;
  currencySymbol?: string;
  currencyMultiplier?: number;
}

export default function KpiCards({
  selectedOutput,
  compareOutput,
  currencySymbol = '$',
  currencyMultiplier = 1,
}: KpiCardsProps) {
  const s = selectedOutput.summary;
  const c = compareOutput?.summary ?? null;

  // Format monetary amounts
  const fmtMoney = (usdVal: number) => {
    const val = usdVal * currencyMultiplier;
    if (Math.abs(val) >= 1_000_000) {
      return `${currencySymbol}${(val / 1_000_000).toFixed(2)}M`;
    }
    if (Math.abs(val) >= 1_000) {
      return `${currencySymbol}${(val / 1_000).toFixed(1)}K`;
    }
    return `${currencySymbol}${val.toFixed(0)}`;
  };

  // Programme cost breakdown for selected:
  // Hosting + Attendance Benefits + Setup + Maintenance
  const sProgrammeCostUsd =
    s.costBreakdown12m.marketNightHostingCost +
    s.costBreakdown12m.attendanceBenefitsCost +
    s.costBreakdown12m.productInterventionSetupCost +
    s.costBreakdown12m.productInterventionMaintenanceCost;

  const cProgrammeCostUsd = c
    ? c.costBreakdown12m.marketNightHostingCost +
      c.costBreakdown12m.attendanceBenefitsCost +
      c.costBreakdown12m.productInterventionSetupCost +
      c.costBreakdown12m.productInterventionMaintenanceCost
    : 0;

  // Deltas
  const deltaActivations = c ? s.totalFirstLiveTraders12m - c.totalFirstLiveTraders12m : null;
  const deltaActiveM12 = c ? s.endingActiveTraders - c.endingActiveTraders : null;
  const deltaProgrammeCost = c ? sProgrammeCostUsd - cProgrammeCostUsd : null;
  const deltaContribution = c ? s.netContributionUsd12m - c.netContributionUsd12m : null;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

        {/* ── CARD 1: YEAR-ONE LIVE TRADE ACTIVATIONS ── */}
        <div className="card p-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg space-y-1">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
            <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              1. Live Activations (12M)
            </span>
            <span className="text-[9px] font-mono text-amber-400">REAL CAPITAL</span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="text-[22px] font-mono font-bold text-[var(--text-primary)]">
              {s.totalFirstLiveTraders12m.toLocaleString()}
            </div>
            {c && deltaActivations !== null && (
              <div
                className={`text-[11px] font-mono font-bold flex items-center gap-0.5 ${
                  deltaActivations >= 0 ? 'text-amber-400' : 'text-blue-400'
                }`}
              >
                {deltaActivations >= 0 ? '+' : ''}
                {deltaActivations.toLocaleString()} vs Comp
              </div>
            )}
          </div>

          <div className="flex justify-between text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
            <span>First live trades (not simulated)</span>
            {c && <span className="text-blue-400 font-mono">Comp: {c.totalFirstLiveTraders12m.toLocaleString()}</span>}
          </div>
        </div>

        {/* ── CARD 2: MONTH-12 ACTIVE TRADERS ── */}
        <div className="card p-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg space-y-1">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
            <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              2. Month-12 Active Traders
            </span>
            <span className="text-[9px] font-mono text-[var(--text-muted)]">ENDING STOCK</span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="text-[22px] font-mono font-bold text-[var(--text-primary)]">
              {s.endingActiveTraders.toLocaleString()}
            </div>
            {c && deltaActiveM12 !== null && (
              <div
                className={`text-[11px] font-mono font-bold flex items-center gap-0.5 ${
                  deltaActiveM12 >= 0 ? 'text-amber-400' : 'text-blue-400'
                }`}
              >
                {deltaActiveM12 >= 0 ? '+' : ''}
                {deltaActiveM12.toLocaleString()} vs Comp
              </div>
            )}
          </div>

          <div className="flex justify-between text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
            <span>Peak MAU: {s.peakActiveTraders.toLocaleString()}</span>
            {c && <span className="text-blue-400 font-mono">Comp M12: {c.endingActiveTraders.toLocaleString()}</span>}
          </div>
        </div>

        {/* ── CARD 3: YEAR-ONE PROGRAMME COST ── */}
        <div className="card p-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg space-y-1">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
            <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <PieChart className="w-3.5 h-3.5 text-amber-400" />
              3. Programme Cost (12M)
            </span>
            <span className="text-[9px] font-mono text-amber-400/90">EXPLICIT OPEX</span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="text-[22px] font-mono font-bold text-[var(--text-primary)]">
              {fmtMoney(sProgrammeCostUsd)}
            </div>
            {c && deltaProgrammeCost !== null && (
              <div
                className={`text-[11px] font-mono font-bold flex items-center gap-0.5 ${
                  deltaProgrammeCost <= 0 ? 'text-green-400' : 'text-amber-400'
                }`}
              >
                {deltaProgrammeCost >= 0 ? '+' : ''}
                {fmtMoney(deltaProgrammeCost)} vs Comp
              </div>
            )}
          </div>

          <div className="flex justify-between text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
            <span title="Hosting ($) + Benefits ($) + Setup ($) + Maintenance ($)">
              Events + Benefits + Setup/Maint
            </span>
            {c && <span className="text-blue-400 font-mono">Comp: {fmtMoney(cProgrammeCostUsd)}</span>}
          </div>
        </div>

        {/* ── CARD 4: YEAR-ONE NET CONTRIBUTION ── */}
        <div className="card p-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg space-y-1">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
            <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              4. Net Contribution (12M)
            </span>
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                s.netContributionUsd12m >= 0 ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'
              }`}
            >
              {s.netContributionUsd12m >= 0 ? 'PROFITABLE' : 'NET LOSS'}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div
              className={`text-[22px] font-mono font-bold ${
                s.netContributionUsd12m >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'
              }`}
            >
              {fmtMoney(s.netContributionUsd12m)}
            </div>
            {c && deltaContribution !== null && (
              <div
                className={`text-[11px] font-mono font-bold flex items-center gap-0.5 ${
                  deltaContribution >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {deltaContribution >= 0 ? '+' : ''}
                {fmtMoney(deltaContribution)} Δ
              </div>
            )}
          </div>

          <div className="flex justify-between text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
            <span>
              {s.breakevenMonth ? `Breakeven: Month ${s.breakevenMonth}` : 'No breakeven in 12M'}
            </span>
            {c && (
              <span className="text-blue-400 font-mono">
                Comp: {fmtMoney(c.netContributionUsd12m)}
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Explicit Founder Economic Caution Note */}
      <div className="p-2 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-start gap-2 text-[10px] text-[var(--text-muted)]">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[var(--text-secondary)]">Economic Evaluation Guardrail:</strong> Programme cost is explicitly defined as
          Market Night hosting ({fmtMoney(s.costBreakdown12m.marketNightHostingCost)}) +
          attendance benefits ({fmtMoney(s.costBreakdown12m.attendanceBenefitsCost)}) +
          intervention setup ({fmtMoney(s.costBreakdown12m.productInterventionSetupCost)}) +
          maintenance ({fmtMoney(s.costBreakdown12m.productInterventionMaintenanceCost)}).
          Cash OpEx is separated from fee credits (zero double-deduction). Higher user counts are not inherently economically superior;
          a positive contribution delta (+{deltaContribution !== null ? fmtMoney(deltaContribution) : '$0'}) does not guarantee overall solvency if base fixed costs exceed net trading margin.
        </p>
      </div>
    </div>
  );
}
