'use client';

/**
 * InterventionDrawer.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Founder-Facing Intervention Inspection & Hypothesis Editor Drawer.
 *
 * Implements the 6 required sections:
 *  1. User Uncertainty (exact user hesitation)
 *  2. What We Deliver (Product capability vs Market Night role)
 *  3. Business Hypothesis (behavioral mechanism)
 *  4. Editable Assumptions (launch month, target coverage, ramp, signed effect, costs)
 *  5. Evidence & Provenance (status, note, what is demonstrated vs unproven)
 *  6. Actions:
 *     - "Set behavioural effect to zero" (preserves implementation costs!)
 *     - "Compare without this intervention" (removes effect AND costs)
 *     - "Inspect working demo" (opens in modal/new tab without losing edits)
 *     - "Restore defaults"
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ExternalLink, RotateCcw, AlertTriangle, ShieldCheck,
  CheckCircle2, Info, ArrowRight, Sliders, DollarSign, Activity, Eye,
} from 'lucide-react';
import {
  TrustIntervention,
  EvidenceStatus,
  deriveCoverageSchedule,
  INITIAL_TRUST_INTERVENTIONS,
} from '../../core/growth/trustFunnelModel';

interface InterventionDrawerProps {
  intervention: TrustIntervention | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateIntervention: (updated: TrustIntervention) => void;
  onOpenDemo: (route: string, title: string) => void;
}

export default function InterventionDrawer({
  intervention,
  isOpen,
  onClose,
  onUpdateIntervention,
  onOpenDemo,
}: InterventionDrawerProps) {
  if (!intervention || !isOpen) return null;

  const initialDefault = INITIAL_TRUST_INTERVENTIONS.find((i) => i.id === intervention.id);

  // Field change handler
  const handleRolloutChange = (key: 'launchMonth' | 'targetCoverage' | 'rampDurationMonths', val: number) => {
    const newRollout = { ...intervention.rollout, [key]: val };
    const newCoverage = deriveCoverageSchedule(newRollout);
    onUpdateIntervention({
      ...intervention,
      rollout: newRollout,
      coverageSchedule: newCoverage,
    });
  };

  const handleEffectChange = (ppEffect: number) => {
    onUpdateIntervention({
      ...intervention,
      assumedPercentagePointEffect: ppEffect,
    });
  };

  const handleCostChange = (key: 'setupCostUsd' | 'monthlyMaintenanceCostUsd', val: number) => {
    onUpdateIntervention({
      ...intervention,
      [key]: Math.max(0, val),
    });
  };

  // Action: Set effect to zero (preserves implementation costs!)
  const handleSetEffectZero = () => {
    onUpdateIntervention({
      ...intervention,
      assumedPercentagePointEffect: 0.00,
    });
  };

  // Action: Compare without intervention (disables intervention + avoids costs)
  const handleToggleWithoutIntervention = () => {
    onUpdateIntervention({
      ...intervention,
      enabled: !intervention.enabled,
    });
  };

  // Action: Restore defaults
  const handleRestoreDefaults = () => {
    if (initialDefault) {
      onUpdateIntervention({ ...initialDefault });
    }
  };

  // Contextual uncertainties by ID
  const UNCERTAINTIES: Record<string, { quote: string; context: string; demonstrated: string; unproven: string }> = {
    'TI-01': {
      quote: '“Will my money be trapped, and will hidden fees cut into my withdrawal?”',
      context: 'Users drop off at the deposit screen due to opaque lock-in fears and uncertain settlement schedules.',
      demonstrated: 'Idempotent deposit processing with webhook deduplication and transparent ledger rules in test environment.',
      unproven: 'Whether transparent withdrawal terms increase net deposit rate or deter users who prefer high risk.',
    },
    'TI-02': {
      quote: '“What is my real loss if the market drops, and what did this trade actually cost in fees?”',
      context: 'Funded users hesitate to place their first live trade due to fear of unexpected leverage liquidation and hidden spreads.',
      demonstrated: 'PreTradeExplainer modal calculates exact notional exposure, itemised fees, and -5%, -10%, -20% adverse drops.',
      unproven: 'Whether seeing stark adverse move loss examples deters reckless users (negative effect) or builds confidence.',
    },
    'TI-03': {
      quote: '“Was my order accepted, and what happens if the network drops before I get confirmation?”',
      context: 'Users churn after experiencing ambiguous execution states, fear of ghost orders, or accidental double submissions.',
      demonstrated: 'TransactionRecoveryPanel auto-detects ACK_LOST_PENDING_RECON and reconciles within ~80ms with zero duplicate fills.',
      unproven: 'Long-term 12-month cohort retention lift under production network latency and high-concurrency order bursts.',
    },
  };

  const uInfo = UNCERTAINTIES[intervention.id] || {
    quote: intervention.description,
    context: intervention.description,
    demonstrated: 'Verified in simulated prototype harness.',
    unproven: 'Live production cohort lift.',
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-xl h-full bg-[var(--bg-surface)] border-l border-[var(--border)] shadow-2xl flex flex-col z-10 overflow-hidden"
        >
          {/* ── Drawer Header ── */}
          <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-elevated)] flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-interactive)] text-[var(--brand)] font-bold border border-[var(--brand-border)]">
                  {intervention.id}
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)]">
                  Target: <strong className="text-[var(--text-primary)]">{intervention.target.replace(/_/g, ' ')}</strong>
                </span>
                {!intervention.enabled && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-900/40 text-red-400 border border-red-800/40 font-bold">
                    DISABLED IN MODEL
                  </span>
                )}
              </div>
              <h2 className="text-[16px] font-bold text-[var(--text-primary)] leading-tight">
                {intervention.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Drawer Body ── */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[12px]">

            {/* 1. USER UNCERTAINTY */}
            <div className="card p-3 bg-[var(--bg-base)] border border-[var(--border)] space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                1. User Uncertainty Addressed
              </div>
              <p className="text-[13px] font-serif italic text-amber-200/90 bg-[var(--brand-dim)] p-2.5 rounded border border-[var(--brand-border)]">
                {uInfo.quote}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                {uInfo.context}
              </p>
            </div>

            {/* 2. WHAT WE DELIVER */}
            <div className="card p-3 bg-[var(--bg-base)] border border-[var(--border)] space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                2. What We Deliver (Product vs Market Night)
              </div>
              <div className="space-y-2">
                <div className="p-2 rounded bg-[var(--bg-elevated)] border-l-2 border-[var(--brand)]">
                  <div className="text-[10px] font-bold text-[var(--brand)] uppercase mb-0.5">In-Product Mechanism (Real Use)</div>
                  <p className="text-[11px] text-[var(--text-primary)] leading-relaxed">
                    {intervention.productMechanism}
                  </p>
                </div>
                <div className="p-2 rounded bg-[var(--bg-elevated)] border-l-2 border-purple-400">
                  <div className="text-[10px] font-bold text-purple-400 uppercase mb-0.5">Market Night Role (Preview & Inspection)</div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    {intervention.marketNightRole}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. BUSINESS HYPOTHESIS */}
            <div className="card p-3 bg-[var(--bg-base)] border border-[var(--border)] space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                3. Business Hypothesis
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                {intervention.description} By addressing hesitation at the{' '}
                <strong className="text-[var(--text-primary)]">{intervention.target.replace(/_/g, ' ')}</strong> stage,
                we hypothesize an assumed conversion shift of{' '}
                <span className="font-mono font-bold text-amber-400">
                  {intervention.assumedPercentagePointEffect >= 0 ? '+' : ''}
                  {(intervention.assumedPercentagePointEffect * 100).toFixed(1)} pp
                </span>.
              </p>
            </div>

            {/* 4. EDITABLE ASSUMPTIONS */}
            <div className="card p-3 bg-[var(--bg-base)] border border-[var(--border)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  4. Editable Assumptions & Rollout Schedule
                </span>
                <span className="text-[9px] text-[var(--text-muted)] font-mono">Updates live model</span>
              </div>

              {/* Assumed Effect Slider / Input */}
              <div className="space-y-1 p-2.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[var(--text-primary)]">Signed Assumed Effect</span>
                  <span className="font-mono font-bold text-[13px] text-amber-400">
                    {intervention.assumedPercentagePointEffect >= 0 ? '+' : ''}
                    {(intervention.assumedPercentagePointEffect * 100).toFixed(1)} pp
                  </span>
                </div>
                <input
                  type="range"
                  min="-0.10"
                  max="0.15"
                  step="0.005"
                  value={intervention.assumedPercentagePointEffect}
                  onChange={(e) => handleEffectChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-[var(--text-muted)] font-mono">
                  <span>-10.0 pp (Deterrent)</span>
                  <span>0.0 pp (No effect)</span>
                  <span>+15.0 pp (Strong lift)</span>
                </div>
              </div>

              {/* Rollout Inputs Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded bg-[var(--bg-elevated)]">
                  <label className="text-[9px] text-[var(--text-muted)] block uppercase font-mono">Launch Month</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={intervention.rollout.launchMonth}
                    onChange={(e) => handleRolloutChange('launchMonth', parseInt(e.target.value) || 1)}
                    className="w-full bg-[var(--bg-interactive)] border border-[var(--border)] rounded px-1.5 py-1 text-[12px] font-mono font-bold text-[var(--text-primary)] mt-1"
                  />
                  <span className="text-[8px] text-[var(--text-muted)]">Zero before M{intervention.rollout.launchMonth}</span>
                </div>

                <div className="p-2 rounded bg-[var(--bg-elevated)]">
                  <label className="text-[9px] text-[var(--text-muted)] block uppercase font-mono">Target Cov.</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    value={Math.round(intervention.rollout.targetCoverage * 100)}
                    onChange={(e) => handleRolloutChange('targetCoverage', (parseFloat(e.target.value) || 0) / 100)}
                    className="w-full bg-[var(--bg-interactive)] border border-[var(--border)] rounded px-1.5 py-1 text-[12px] font-mono font-bold text-[var(--text-primary)] mt-1"
                  />
                  <span className="text-[8px] text-[var(--text-muted)]">Max % covered</span>
                </div>

                <div className="p-2 rounded bg-[var(--bg-elevated)]">
                  <label className="text-[9px] text-[var(--text-muted)] block uppercase font-mono">Ramp (mo)</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={intervention.rollout.rampDurationMonths}
                    onChange={(e) => handleRolloutChange('rampDurationMonths', parseInt(e.target.value) || 1)}
                    className="w-full bg-[var(--bg-interactive)] border border-[var(--border)] rounded px-1.5 py-1 text-[12px] font-mono font-bold text-[var(--text-primary)] mt-1"
                  />
                  <span className="text-[8px] text-[var(--text-muted)]">
                    {intervention.rollout.rampDurationMonths === 1 ? 'Full at launch' : 'Linear ramp'}
                  </span>
                </div>
              </div>

              {/* 12-Month Coverage Schedule Visualiser */}
              <div className="p-2 rounded bg-[var(--bg-interactive)] space-y-1">
                <div className="flex justify-between text-[9px] text-[var(--text-muted)]">
                  <span>12-Month Derived Coverage:</span>
                  <span className="text-amber-400">
                    Launch M{intervention.rollout.launchMonth} has{' '}
                    {intervention.rollout.rampDurationMonths > 1
                      ? `partial coverage (${(intervention.coverageSchedule[intervention.rollout.launchMonth - 1] * 100).toFixed(0)}%)`
                      : `full target coverage (${(intervention.coverageSchedule[intervention.rollout.launchMonth - 1] * 100).toFixed(0)}%)`}
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-1 text-center font-mono text-[8px]">
                  {intervention.coverageSchedule.map((cov, idx) => (
                    <div
                      key={idx}
                      className={`py-1 rounded border transition-colors ${
                        cov > 0
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-black/20 text-[var(--text-muted)] border-transparent'
                      }`}
                    >
                      <div>M{idx + 1}</div>
                      <div className="font-bold">{(cov * 100).toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Costs Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-[var(--bg-elevated)]">
                  <label className="text-[9px] text-[var(--text-muted)] block uppercase font-mono">Setup Cost (USD)</label>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[12px] text-[var(--text-muted)]">$</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={intervention.setupCostUsd}
                      onChange={(e) => handleCostChange('setupCostUsd', parseFloat(e.target.value) || 0)}
                      className="w-full bg-[var(--bg-interactive)] border border-[var(--border)] rounded px-1.5 py-1 text-[12px] font-mono font-bold text-[var(--text-primary)]"
                    />
                  </div>
                  <span className="text-[8px] text-[var(--text-muted)]">Incurred once in M{intervention.rollout.launchMonth}</span>
                </div>

                <div className="p-2 rounded bg-[var(--bg-elevated)]">
                  <label className="text-[9px] text-[var(--text-muted)] block uppercase font-mono">Monthly Maint. (USD)</label>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[12px] text-[var(--text-muted)]">$</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={intervention.monthlyMaintenanceCostUsd}
                      onChange={(e) => handleCostChange('monthlyMaintenanceCostUsd', parseFloat(e.target.value) || 0)}
                      className="w-full bg-[var(--bg-interactive)] border border-[var(--border)] rounded px-1.5 py-1 text-[12px] font-mono font-bold text-[var(--text-primary)]"
                    />
                  </div>
                  <span className="text-[8px] text-[var(--text-muted)]">During active months (M{intervention.rollout.launchMonth}..12)</span>
                </div>
              </div>
            </div>

            {/* 5. EVIDENCE & PROVENANCE */}
            <div className="card p-3 bg-[var(--bg-base)] border border-[var(--border)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  5. Evidence Status & Provenance
                </span>
                <span
                  className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border ${
                    intervention.evidenceStatus === 'DEMO_OBSERVATION'
                      ? 'bg-amber-900/30 text-amber-400 border-amber-800/40'
                      : intervention.evidenceStatus === 'PILOT_OBSERVATION'
                      ? 'bg-green-900/30 text-green-400 border-green-800/40'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {intervention.evidenceStatus}
                </span>
              </div>

              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                {intervention.evidenceNote}
              </p>

              <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                <div className="p-2 rounded bg-green-950/20 border border-green-900/30 text-green-300">
                  <div className="font-bold flex items-center gap-1 mb-0.5">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    What is demonstrated
                  </div>
                  <p className="text-[9px] leading-relaxed text-green-200/80">
                    {uInfo.demonstrated}
                  </p>
                </div>
                <div className="p-2 rounded bg-amber-950/20 border border-amber-900/30 text-amber-300">
                  <div className="font-bold flex items-center gap-1 mb-0.5">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    What remains unproven
                  </div>
                  <p className="text-[9px] leading-relaxed text-amber-200/80">
                    {uInfo.unproven}
                  </p>
                </div>
              </div>

              <div className="text-[9px] text-[var(--text-muted)] italic">
                * Note: Changing evidence status does not alter model numbers. A demo observation is not live cohort proof.
              </div>
            </div>

            {/* 6. ACTIONS */}
            <div className="card p-3 bg-[var(--bg-base)] border border-[var(--border)] space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                6. Interventions & Hypothesis Testing Actions
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Action 1: Set Effect to Zero */}
                <button
                  onClick={handleSetEffectZero}
                  className="p-2.5 rounded bg-[var(--bg-interactive)] hover:bg-[var(--bg-hover)] border border-[var(--border)] text-left transition-colors"
                >
                  <div className="text-[11px] font-bold text-[var(--text-primary)]">Set Effect to 0 pp</div>
                  <div className="text-[9px] text-[var(--text-muted)] mt-0.5">
                    Preserves setup & maint. costs to test if project incurs drag with zero return.
                  </div>
                </button>

                {/* Action 2: Compare without intervention */}
                <button
                  onClick={handleToggleWithoutIntervention}
                  className={`p-2.5 rounded border text-left transition-colors ${
                    !intervention.enabled
                      ? 'bg-green-950/30 border-green-800/50 text-green-300'
                      : 'bg-red-950/30 border-red-800/50 text-red-300'
                  }`}
                >
                  <div className="text-[11px] font-bold">
                    {intervention.enabled ? 'Remove Intervention' : 'Restore to Model'}
                  </div>
                  <div className="text-[9px] opacity-80 mt-0.5">
                    {intervention.enabled
                      ? 'Disables effect AND avoids setup/maint costs under counterfactual.'
                      : 'Re-enables this intervention in the active 12-month model.'}
                  </div>
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {/* Action 3: Inspect working demo */}
                {intervention.demoRoute ? (
                  <button
                    onClick={() => onOpenDemo(intervention.demoRoute!, intervention.name)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-[var(--brand-dim)] text-[var(--brand)] border border-[var(--brand-border)] hover:bg-[rgba(245,158,11,0.2)] text-[11px] font-semibold transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect Working Demo
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex-1 py-2 px-3 rounded bg-[var(--bg-interactive)] text-[var(--text-muted)] text-[11px] font-semibold opacity-50 cursor-not-allowed"
                  >
                    No Demo Route Available
                  </button>
                )}

                {/* Action 4: Restore defaults */}
                <button
                  onClick={handleRestoreDefaults}
                  className="flex items-center gap-1 py-2 px-3 rounded bg-[var(--bg-interactive)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] text-[11px] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore Defaults
                </button>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
