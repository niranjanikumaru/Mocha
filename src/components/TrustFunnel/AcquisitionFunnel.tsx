'use client';

/**
 * AcquisitionFunnel.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Interactive 4-stage acquisition funnel showing NEW entrants during the selected month:
 *  1. Unique new prospects (with channel breakdown)
 *  2. Onboarded (KYC / account verification)
 *  3. Funded (initial deposit)
 *  4. First LIVE trade (real-capital activation, distinct from simulated trades)
 *
 * Shows paired bars (Amber Selected vs Blue Comparator), preceding stage conversions,
 * absolute differences (Δ), and clickable intervention badges on transitions.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Users, UserCheck, CreditCard, Zap, ChevronRight,
  TrendingUp, TrendingDown, Info, Shield, HelpCircle, Layers,
} from 'lucide-react';
import {
  TrustFunnelMonthlySnapshot,
  TrustIntervention,
} from '../../core/growth/trustFunnelModel';
import { DropoffStageData } from './DropoffModal';

interface AcquisitionFunnelProps {
  selectedSnapshot: TrustFunnelMonthlySnapshot;
  compareSnapshot: TrustFunnelMonthlySnapshot | null;
  selectedMonth: number;
  interventions: TrustIntervention[];
  onOpenIntervention: (interventionId: string) => void;
  onOpenDropoff: (data: DropoffStageData) => void;
}

export default function AcquisitionFunnel({
  selectedSnapshot,
  compareSnapshot,
  selectedMonth,
  interventions,
  onOpenIntervention,
  onOpenDropoff,
}: AcquisitionFunnelProps) {
  const s = selectedSnapshot;
  const c = compareSnapshot;

  // Interventions for transitions
  const ti01 = interventions.find((i) => i.id === 'TI-01');
  const ti02 = interventions.find((i) => i.id === 'TI-02');

  // Conversions for selected
  const sOnboardRate = s.uniqueNewProspects > 0 ? s.onboardedTraders / s.uniqueNewProspects : 0;
  const sFundRate = s.onboardedTraders > 0 ? s.fundedTraders / s.onboardedTraders : 0;
  const sTradeRate = s.fundedTraders > 0 ? s.firstLiveTraders / s.fundedTraders : 0;

  // Conversions for comparator
  const cOnboardRate = c && c.uniqueNewProspects > 0 ? c.onboardedTraders / c.uniqueNewProspects : 0;
  const cFundRate = c && c.onboardedTraders > 0 ? c.fundedTraders / c.onboardedTraders : 0;
  const cTradeRate = c && c.fundedTraders > 0 ? c.firstLiveTraders / c.fundedTraders : 0;

  // Maximum value for proportional bar scaling
  const maxProspects = Math.max(s.uniqueNewProspects, c?.uniqueNewProspects ?? 1, 1);

  return (
    <div className="space-y-4">
      {/* Funnel Subheader */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Month {selectedMonth} Acquisition Funnel
          </h3>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">
            (New Entrants in Month {selectedMonth} Only)
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
            <span className="text-[var(--text-secondary)] font-medium">Selected Strategy</span>
          </div>
          {c && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
              <span className="text-[var(--text-secondary)] font-medium">Comparator</span>
            </div>
          )}
        </div>
      </div>

      {/* 4 Funnel Stages Grid / Stack */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-stretch">

        {/* ── STAGE 1: UNIQUE NEW PROSPECTS ── */}
        <div className="card p-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
              <span className="flex items-center gap-1 text-[var(--text-primary)]">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                1. New Prospects
              </span>
              <span className="text-[9px] font-mono text-[var(--text-muted)]">Inflow</span>
            </div>

            {/* Paired Counts */}
            <div className="space-y-1.5 mt-2">
              <div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-amber-400 font-bold">Selected</span>
                  <span className="font-mono font-bold text-amber-400">{s.uniqueNewProspects.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-[var(--bg-interactive)] rounded-full overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${(s.uniqueNewProspects / maxProspects) * 100}%` }}
                  />
                </div>
              </div>

              {c && (
                <div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-blue-400 font-bold">Comparator</span>
                    <span className="font-mono font-bold text-blue-400">{c.uniqueNewProspects.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-[var(--bg-interactive)] rounded-full overflow-hidden mt-0.5">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(c.uniqueNewProspects / maxProspects) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Absolute Difference */}
            {c && (
              <div className="text-[10px] text-[var(--text-muted)] font-mono mt-2 pt-1 border-t border-[var(--border-subtle)] flex justify-between">
                <span>Δ Difference</span>
                <span className={s.uniqueNewProspects >= c.uniqueNewProspects ? 'text-amber-400' : 'text-blue-400'}>
                  {s.uniqueNewProspects >= c.uniqueNewProspects ? '+' : ''}
                  {(s.uniqueNewProspects - c.uniqueNewProspects).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Channel Contributions Breakdown */}
          <div className="p-2 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] space-y-1 text-[9px]">
            <div className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[8px] flex justify-between">
              <span>Channel Sources</span>
              <span className="text-amber-400/90 font-mono">Selected Mo {selectedMonth}</span>
            </div>
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>• Market Night New:</span>
              <span className="font-mono text-[var(--text-primary)] font-bold">{s.marketNightNewProspects}</span>
            </div>
            <div className="flex justify-between text-[var(--text-muted)] pl-2 text-[8px]">
              <span>(From {s.eventAttendees} attendees, {s.qualifiedCrews} crews)</span>
              <span>{(s.marketNightNewProspects / Math.max(1, s.eventAttendees) * 100).toFixed(0)}% conv</span>
            </div>
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>• Paid Marketing:</span>
              <span className="font-mono text-[var(--text-primary)]">{s.paidNewProspects}</span>
            </div>
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>• Organic / Waitlist:</span>
              <span className="font-mono text-[var(--text-primary)]">{s.organicNewProspects}</span>
            </div>
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>• Referral Viral (K):</span>
              <span className="font-mono text-[var(--text-primary)]">{s.referralNewProspects}</span>
            </div>
          </div>
        </div>

        {/* ── STAGE 2: ONBOARDED (KYC) ── */}
        <div className="card p-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
              <span className="flex items-center gap-1 text-[var(--text-primary)]">
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                2. Onboarded
              </span>
              <span className="text-[9px] font-mono text-[var(--text-muted)]">KYC</span>
            </div>

            {/* Paired Counts */}
            <div className="space-y-1.5 mt-2">
              <div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-amber-400 font-bold">Selected</span>
                  <span className="font-mono font-bold text-amber-400">{s.onboardedTraders.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-[var(--bg-interactive)] rounded-full overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${(s.onboardedTraders / maxProspects) * 100}%` }}
                  />
                </div>
              </div>

              {c && (
                <div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-blue-400 font-bold">Comparator</span>
                    <span className="font-mono font-bold text-blue-400">{c.onboardedTraders.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-[var(--bg-interactive)] rounded-full overflow-hidden mt-0.5">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(c.onboardedTraders / maxProspects) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Conversion from preceding */}
            <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--text-muted)]">Stage Conversion:</span>
                <span className="font-mono text-amber-400 font-bold">{(sOnboardRate * 100).toFixed(1)}%</span>
              </div>
              {c && (
                <div className="flex justify-between text-[10px]">
                  <span className="text-[var(--text-muted)]">Comparator Conv:</span>
                  <span className="font-mono text-blue-400 font-bold">{(cOnboardRate * 100).toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Dropoff trigger */}
          <button
            onClick={() =>
              onOpenDropoff({
                fromStage: 'New Prospects',
                toStage: 'Onboarded',
                month: selectedMonth,
                enteredCount: s.uniqueNewProspects,
                proceededCount: s.onboardedTraders,
                droppedCount: s.uniqueNewProspects - s.onboardedTraders,
                conversionRate: sOnboardRate,
              })
            }
            className="w-full text-center py-1.5 px-2 rounded bg-[var(--bg-interactive)] hover:bg-[var(--bg-hover)] text-[9px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors flex items-center justify-center gap-1"
          >
            <span>{(s.uniqueNewProspects - s.onboardedTraders).toLocaleString()} not onboarded</span>
            <ChevronRight className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* ── STAGE 3: FUNDED (DEPOSIT) ── */}
        <div className="card p-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg flex flex-col justify-between space-y-3 relative">
          {/* Intervention Badge on Transition Header */}
          {ti01 && (
            <div className="absolute -top-3 left-3 right-3 flex justify-center">
              <button
                onClick={() => onOpenIntervention('TI-01')}
                className="px-2 py-0.5 rounded-full text-[8px] font-bold font-mono tracking-wide bg-amber-950 text-amber-300 border border-amber-500/50 hover:bg-amber-900/60 shadow-md flex items-center gap-1 transition-all"
                title="Click to inspect TI-01 hypothesis"
              >
                <Shield className="w-2.5 h-2.5 text-amber-400" />
                TI-01: Funding Clarity
                <span className="opacity-75">({ti01.evidenceStatus})</span>
              </button>
            </div>
          )}

          <div className="mt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
              <span className="flex items-center gap-1 text-[var(--text-primary)]">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                3. Funded
              </span>
              <span className="text-[9px] font-mono text-[var(--text-muted)]">Deposit</span>
            </div>

            {/* Paired Counts */}
            <div className="space-y-1.5 mt-2">
              <div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-amber-400 font-bold">Selected</span>
                  <span className="font-mono font-bold text-amber-400">{s.fundedTraders.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-[var(--bg-interactive)] rounded-full overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${(s.fundedTraders / maxProspects) * 100}%` }}
                  />
                </div>
              </div>

              {c && (
                <div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-blue-400 font-bold">Comparator</span>
                    <span className="font-mono font-bold text-blue-400">{c.fundedTraders.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-[var(--bg-interactive)] rounded-full overflow-hidden mt-0.5">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(c.fundedTraders / maxProspects) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Conversion from preceding */}
            <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--text-muted)]">Stage Conversion:</span>
                <span className="font-mono text-amber-400 font-bold">{(sFundRate * 100).toFixed(1)}%</span>
              </div>
              {c && (
                <div className="flex justify-between text-[10px]">
                  <span className="text-[var(--text-muted)]">Comparator Conv:</span>
                  <span className="font-mono text-blue-400 font-bold">{(cFundRate * 100).toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Dropoff trigger */}
          <button
            onClick={() =>
              onOpenDropoff({
                fromStage: 'Onboarded',
                toStage: 'Funded',
                month: selectedMonth,
                enteredCount: s.onboardedTraders,
                proceededCount: s.fundedTraders,
                droppedCount: s.onboardedTraders - s.fundedTraders,
                conversionRate: sFundRate,
              })
            }
            className="w-full text-center py-1.5 px-2 rounded bg-[var(--bg-interactive)] hover:bg-[var(--bg-hover)] text-[9px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors flex items-center justify-center gap-1"
          >
            <span>{(s.onboardedTraders - s.fundedTraders).toLocaleString()} dropped before deposit</span>
            <ChevronRight className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* ── STAGE 4: FIRST LIVE TRADE (ACTIVATION) ── */}
        <div className="card p-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg flex flex-col justify-between space-y-3 relative">
          {/* Intervention Badge on Transition Header */}
          {ti02 && (
            <div className="absolute -top-3 left-3 right-3 flex justify-center">
              <button
                onClick={() => onOpenIntervention('TI-02')}
                className="px-2 py-0.5 rounded-full text-[8px] font-bold font-mono tracking-wide bg-amber-950 text-amber-300 border border-amber-500/50 hover:bg-amber-900/60 shadow-md flex items-center gap-1 transition-all"
                title="Click to inspect TI-02 hypothesis"
              >
                <Zap className="w-2.5 h-2.5 text-amber-400" />
                TI-02: Fee &amp; Risk Preview
                <span className="opacity-75">({ti02.evidenceStatus})</span>
              </button>
            </div>
          )}

          <div className="mt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
              <span className="flex items-center gap-1 text-[var(--text-primary)]">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                4. First LIVE Trade
              </span>
              <span className="text-[9px] font-mono text-[var(--text-muted)]">Active</span>
            </div>

            {/* Paired Counts */}
            <div className="space-y-1.5 mt-2">
              <div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-amber-400 font-bold">Selected</span>
                  <span className="font-mono font-bold text-amber-400">{s.firstLiveTraders.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-[var(--bg-interactive)] rounded-full overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${(s.firstLiveTraders / maxProspects) * 100}%` }}
                  />
                </div>
              </div>

              {c && (
                <div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-blue-400 font-bold">Comparator</span>
                    <span className="font-mono font-bold text-blue-400">{c.firstLiveTraders.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-[var(--bg-interactive)] rounded-full overflow-hidden mt-0.5">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(c.firstLiveTraders / maxProspects) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Conversion from preceding */}
            <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-[var(--text-muted)]">Stage Conversion:</span>
                <span className="font-mono text-amber-400 font-bold">{(sTradeRate * 100).toFixed(1)}%</span>
              </div>
              {c && (
                <div className="flex justify-between text-[10px]">
                  <span className="text-[var(--text-muted)]">Comparator Conv:</span>
                  <span className="font-mono text-blue-400 font-bold">{(cTradeRate * 100).toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Dropoff trigger */}
          <button
            onClick={() =>
              onOpenDropoff({
                fromStage: 'Funded',
                toStage: 'First LIVE Trade',
                month: selectedMonth,
                enteredCount: s.fundedTraders,
                proceededCount: s.firstLiveTraders,
                droppedCount: s.fundedTraders - s.firstLiveTraders,
                conversionRate: sTradeRate,
              })
            }
            className="w-full text-center py-1.5 px-2 rounded bg-[var(--bg-interactive)] hover:bg-[var(--bg-hover)] text-[9px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors flex items-center justify-center gap-1"
          >
            <span>{(s.fundedTraders - s.firstLiveTraders).toLocaleString()} funded but unactivated</span>
            <ChevronRight className="w-2.5 h-2.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
