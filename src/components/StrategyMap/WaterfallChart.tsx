'use client';

/**
 * WaterfallChart.tsx
 * Sequential contribution breakdown between a baseline and proposal.
 * Each bar = increment from one intermediate model run.
 * All values come from buildWaterfall() in strategyMap.ts.
 */

import React, { useState } from 'react';
import type { WaterfallResult, WaterfallStep } from '../../core/growth/strategyMap';

function fmtUsd(n: number): string {
  if (!isFinite(n)) return '—';
  const sign = n >= 0 ? '+' : '';
  if (Math.abs(n) >= 1e6) return `${sign}$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1000) return `${sign}$${(n / 1000).toFixed(1)}K`;
  return `${sign}$${n.toFixed(0)}`;
}

function fmtPct(n: number, base: number): string {
  if (base === 0) return 'N/A';
  const pct = (n / Math.abs(base)) * 100;
  if (!isFinite(pct)) return 'N/A';
  return `${n >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

interface BarProps {
  step: WaterfallStep;
  maxAbs: number;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onClick: () => void;
}

function WaterfallBar({ step, maxAbs, isSelected, isFirst, isLast, onClick }: BarProps) {
  const isAnchor = isFirst || isLast;
  const barFrac = maxAbs > 0 ? Math.abs(step.delta) / maxAbs : 0;
  const barW = Math.max(barFrac * 100, 2);
  const isPositive = step.delta >= 0;

  let colour = isPositive ? '#4ade80' : '#f87171';
  if (isAnchor) colour = '#94a3b8';

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border p-3 cursor-pointer transition-all ${
        isSelected
          ? 'border-amber-500/40 bg-amber-500/5'
          : 'border-white/[0.06] hover:border-white/10 hover:bg-white/[0.02]'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-white/80">{step.label}</span>
        <span
          className="text-[11px] font-bold font-mono"
          style={{ color: isAnchor ? '#94a3b8' : colour }}
        >
          {isFirst ? fmtUsd(step.runningTotal) : isLast ? fmtUsd(step.runningTotal) : fmtUsd(step.delta)}
        </span>
      </div>

      {/* Bar */}
      {!isAnchor && (
        <div className="h-3 rounded-full bg-white/[0.04] overflow-hidden mb-1.5">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${barW}%`, background: colour }}
          />
        </div>
      )}

      {isSelected && (
        <div className="mt-2 space-y-1.5">
          <p className="text-[9px] text-white/50 leading-relaxed">{step.explanation}</p>
          {step.changedInputs.length > 0 && (
            <div className="rounded-md bg-white/[0.03] border border-white/[0.06] p-2 space-y-1">
              {step.changedInputs.map((ci, i) => (
                <div key={i} className="flex items-center gap-2 text-[9px] font-mono">
                  <span className="text-white/40 flex-1 truncate">{ci.key}</span>
                  <span className="text-red-400/70">{String(ci.from)}</span>
                  <span className="text-white/30">→</span>
                  <span className="text-green-400/70">{String(ci.to)}</span>
                  {ci.unit && <span className="text-white/25">{ci.unit}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface WaterfallChartProps {
  waterfall: WaterfallResult;
}

export default function WaterfallChart({ waterfall }: WaterfallChartProps) {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  const maxAbs = Math.max(...waterfall.steps.map((s) => Math.abs(s.delta)), 1);
  const baseContrib = waterfall.steps[0].runningTotal;

  function handleBar(i: number) {
    setSelectedStep(selectedStep === i ? null : i);
  }

  const n = waterfall.steps.length;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[12px] font-bold text-white/90">Explain This Delta</h3>
          <p className="text-[9px] text-white/40 mt-0.5">
            Sequential contribution breakdown · Click a bar to see changed inputs
          </p>
        </div>
        <div className="text-right">
          <div className={`text-[14px] font-bold font-mono ${waterfall.totalDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {fmtUsd(waterfall.totalDelta)}
          </div>
          <div className="text-[9px] text-white/40">
            {fmtPct(waterfall.totalDelta, baseContrib)} vs baseline
          </div>
        </div>
      </div>

      {/* Running total line */}
      <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-amber-500 transition-all duration-700"
          style={{ width: '100%' }}
        />
      </div>

      {/* Bars */}
      <div className="space-y-1.5">
        {waterfall.steps.map((step, i) => (
          <WaterfallBar
            key={i}
            step={step}
            maxAbs={maxAbs}
            isSelected={selectedStep === i}
            isFirst={i === 0}
            isLast={i === n - 1}
            onClick={() => handleBar(i)}
          />
        ))}
      </div>

      {/* Reconciliation badge */}
      <div className={`flex items-center gap-2 rounded-lg p-2 text-[9px] font-mono ${
        waterfall.reconciles ? 'bg-green-900/20 border border-green-500/20 text-green-400/70' : 'bg-red-900/20 border border-red-500/20 text-red-400/70'
      }`}>
        {waterfall.reconciles ? '✓' : '⚠'} {waterfall.reconciles ? 'Steps reconcile exactly to total delta.' : 'Warning: steps do not fully reconcile — rounding or interaction.'}
      </div>

      {/* Disclaimer */}
      <p className="text-[8px] text-white/20 leading-relaxed">
        {waterfall.disclaimer}
      </p>
    </div>
  );
}
