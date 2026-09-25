'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { formatINR, formatINRCompact, formatPct, DECK_NUMBERS } from '../config/deckNumbers';
import { ModelInputs, ModelOutput } from '../core/growth/model';

interface BaselineComparisonProps {
  baselineInputs: ModelInputs;
  proposalInputs: ModelInputs;
  baselineResult: ModelOutput;
  proposalResult: ModelOutput;
  selectedMonth: number;
}

interface Difference {
  category: string;
  items: {
    label: string;
    baseline: string;
    proposal: string;
    changed: boolean;
  }[];
}

export default function BaselineComparison({
  baselineInputs,
  proposalInputs,
  baselineResult,
  proposalResult,
  selectedMonth,
}: BaselineComparisonProps) {
  const [showDifferences, setShowDifferences] = useState(false);

  // Calculate differences
  const differences: Difference[] = [];

  // Pricing differences
  const pricingItems = [];
  if (baselineInputs.pricing.takerFeeBps !== proposalInputs.pricing.takerFeeBps) {
    pricingItems.push({
      label: 'Fee per trade',
      baseline: `${baselineInputs.pricing.takerFeeBps} bps`,
      proposal: `${proposalInputs.pricing.takerFeeBps} bps`,
      changed: true,
    });
  }
  if (baselineInputs.pricing.fxSpreadPct !== proposalInputs.pricing.fxSpreadPct) {
    pricingItems.push({
      label: 'Currency conversion fee',
      baseline: `${baselineInputs.pricing.fxSpreadPct}%`,
      proposal: `${proposalInputs.pricing.fxSpreadPct}%`,
      changed: true,
    });
  }
  if (pricingItems.length > 0) {
    differences.push({ category: 'Pricing', items: pricingItems });
  }

  // Channel differences
  const channelItems = [];
  if (baselineInputs.channel.paidBudgetUsd !== proposalInputs.channel.paidBudgetUsd) {
    channelItems.push({
      label: 'Paid ads budget',
      baseline: formatINRCompact(baselineInputs.channel.paidBudgetUsd * DECK_NUMBERS.exchangeRate) + '/mo',
      proposal: formatINRCompact(proposalInputs.channel.paidBudgetUsd * DECK_NUMBERS.exchangeRate) + '/mo',
      changed: true,
    });
  }
  if (baselineInputs.channel.crewEventsPerMonth !== proposalInputs.channel.crewEventsPerMonth) {
    channelItems.push({
      label: 'Market Night events/month',
      baseline: baselineInputs.channel.crewEventsPerMonth.toString(),
      proposal: proposalInputs.channel.crewEventsPerMonth.toString(),
      changed: true,
    });
  }
  if (channelItems.length > 0) {
    differences.push({ category: 'Acquisition Channels', items: channelItems });
  }

  // Trust interventions
  const trustItems: { label: string; baseline: string; proposal: string; changed: boolean }[] = [];
  baselineInputs.trustLevers.forEach((baseLever, idx) => {
    const propLever = proposalInputs.trustLevers[idx];
    if (baseLever.enabled !== propLever.enabled || baseLever.completeness !== propLever.completeness) {
      trustItems.push({
        label: baseLever.label,
        baseline: baseLever.enabled ? `${formatPct(baseLever.completeness)} active` : 'Disabled',
        proposal: propLever.enabled ? `${formatPct(propLever.completeness)} active` : 'Disabled',
        changed: true,
      });
    }
  });
  if (trustItems.length > 0) {
    differences.push({ category: 'Trust Interventions', items: trustItems });
  }

  // Behavior assumptions
  const behaviorItems: { label: string; baseline: string; proposal: string; changed: boolean }[] = [];
  if (baselineInputs.funnelRetention !== proposalInputs.funnelRetention) {
    behaviorItems.push({
      label: 'Traders who stay each month',
      baseline: formatPct(baselineInputs.funnelRetention),
      proposal: formatPct(proposalInputs.funnelRetention),
      changed: true,
    });
  }
  if (baselineInputs.priceElasticity !== proposalInputs.priceElasticity) {
    behaviorItems.push({
      label: 'Fee sensitivity',
      baseline: baselineInputs.priceElasticity.toFixed(1),
      proposal: proposalInputs.priceElasticity.toFixed(1),
      changed: true,
    });
  }
  if (behaviorItems.length > 0) {
    differences.push({ category: 'Trader Behavior', items: behaviorItems });
  }

  const totalChanges = differences.reduce((sum, d) => sum + d.items.length, 0);

  // Get month snapshots
  const baseSnap = baselineResult.snapshots[selectedMonth - 1];
  const propSnap = proposalResult.snapshots[selectedMonth - 1];

  return (
    <div className="space-y-4">
      {/* Expandable differences */}
      <button
        onClick={() => setShowDifferences(!showDifferences)}
        className="w-full flex items-center justify-between p-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[var(--brand)]" />
          <span className="text-[11px] font-semibold text-[var(--text-primary)]">
            What differs? ({totalChanges} changes)
          </span>
        </div>
        {showDifferences ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showDifferences && (
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          {differences.map((diff, idx) => (
            <div key={diff.category} className={idx > 0 ? 'border-t border-[var(--border)]' : ''}>
              <div className="bg-[var(--bg-surface)] px-3 py-2 border-b border-[var(--border)]">
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  {diff.category}
                </span>
              </div>
              <div className="bg-[var(--bg-base)]">
                {diff.items.map((item) => (
                  <div key={item.label} className="grid grid-cols-3 gap-2 px-3 py-2 border-b border-[var(--border)] last:border-b-0">
                    <div className="text-[10px] text-[var(--text-secondary)]">{item.label}</div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)]">{item.baseline}</div>
                    <div className="text-[10px] font-mono text-[var(--brand)] font-semibold">{item.proposal}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Month comparison */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-4">
        <div className="text-[11px] font-semibold text-[var(--text-primary)] mb-3">
          Month {selectedMonth} Comparison
        </div>

        <div className="space-y-3">
          {/* Active traders */}
          <div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Active Traders</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-[var(--text-secondary)] mb-0.5">Baseline</div>
                <div className="text-[16px] font-mono font-bold text-[var(--text-secondary)]">
                  {baseSnap?.activeUsers.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--brand)] mb-0.5">Proposal</div>
                <div className="text-[16px] font-mono font-bold text-[var(--brand)]">
                  {propSnap?.activeUsers.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-[var(--text-muted)]">
              Change: <strong className={propSnap.activeUsers >= baseSnap.activeUsers ? 'text-[var(--green)]' : 'text-[var(--red)]'}>
                {propSnap.activeUsers >= baseSnap.activeUsers ? '+' : ''}{(propSnap.activeUsers - baseSnap.activeUsers).toLocaleString('en-IN')}
              </strong> ({formatPct((propSnap.activeUsers - baseSnap.activeUsers) / baseSnap.activeUsers)})
            </div>
          </div>

          {/* Monthly volume */}
          <div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Executed Volume</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-[var(--text-secondary)] mb-0.5">Baseline</div>
                <div className="text-[16px] font-mono font-bold text-[var(--text-secondary)]">
                  {formatINRCompact((baseSnap?.volumeUsd ?? 0) * DECK_NUMBERS.exchangeRate)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--brand)] mb-0.5">Proposal</div>
                <div className="text-[16px] font-mono font-bold text-[var(--brand)]">
                  {formatINRCompact((propSnap?.volumeUsd ?? 0) * DECK_NUMBERS.exchangeRate)}
                </div>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-[var(--text-muted)]">
              Change: <strong className={propSnap.volumeUsd >= baseSnap.volumeUsd ? 'text-[var(--green)]' : 'text-[var(--red)]'}>
                {propSnap.volumeUsd >= baseSnap.volumeUsd ? '+' : ''}{formatINRCompact((propSnap.volumeUsd - baseSnap.volumeUsd) * DECK_NUMBERS.exchangeRate)}
              </strong> ({formatPct((propSnap.volumeUsd - baseSnap.volumeUsd) / baseSnap.volumeUsd)})
            </div>
          </div>

          {/* Monthly revenue */}
          <div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Service Revenue</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-[var(--text-secondary)] mb-0.5">Baseline</div>
                <div className="text-[16px] font-mono font-bold text-[var(--text-secondary)]">
                  {formatINRCompact(baseSnap?.totalRevenue)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--brand)] mb-0.5">Proposal</div>
                <div className="text-[16px] font-mono font-bold text-[var(--brand)]">
                  {formatINRCompact(propSnap?.totalRevenue)}
                </div>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-[var(--text-muted)]">
              Change: <strong className={propSnap.totalRevenue >= baseSnap.totalRevenue ? 'text-[var(--green)]' : 'text-[var(--red)]'}>
                {propSnap.totalRevenue >= baseSnap.totalRevenue ? '+' : ''}{formatINRCompact(propSnap.totalRevenue - baseSnap.totalRevenue)}
              </strong> ({formatPct((propSnap.totalRevenue - baseSnap.totalRevenue) / baseSnap.totalRevenue)})
            </div>
          </div>

          {/* Costs */}
          <div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Total Costs</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-[var(--text-secondary)] mb-0.5">Baseline</div>
                <div className="text-[16px] font-mono font-bold text-[var(--text-secondary)]">
                  {formatINRCompact(baseSnap?.totalCost)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--brand)] mb-0.5">Proposal</div>
                <div className="text-[16px] font-mono font-bold text-[var(--brand)]">
                  {formatINRCompact(propSnap?.totalCost)}
                </div>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-[var(--text-muted)]">
              Change: <strong className={propSnap.totalCost <= baseSnap.totalCost ? 'text-[var(--green)]' : 'text-[var(--red)]'}>
                {propSnap.totalCost <= baseSnap.totalCost ? '' : '+'}{formatINRCompact(propSnap.totalCost - baseSnap.totalCost)}
              </strong> (lower is better)
            </div>
          </div>

          {/* Contribution */}
          <div className="pt-3 border-t border-[var(--border)]">
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Net Contribution</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-[var(--text-secondary)] mb-0.5">Baseline</div>
                <div className={`text-[18px] font-mono font-bold ${baseSnap.contribution >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                  {formatINRCompact(baseSnap?.contribution)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--brand)] mb-0.5">Proposal</div>
                <div className={`text-[18px] font-mono font-bold ${propSnap.contribution >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                  {formatINRCompact(propSnap?.contribution)}
                </div>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-[var(--text-muted)]">
              Change: <strong className={propSnap.contribution >= baseSnap.contribution ? 'text-[var(--green)]' : 'text-[var(--red)]'}>
                {propSnap.contribution >= baseSnap.contribution ? '+' : ''}{formatINRCompact(propSnap.contribution - baseSnap.contribution)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Cumulative comparison */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-4">
        <div className="text-[11px] font-semibold text-[var(--text-primary)] mb-3">
          Cumulative Through Month {selectedMonth}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Total Revenue</div>
            <div className="text-[10px] text-[var(--text-secondary)] mb-0.5">Baseline</div>
            <div className="text-[14px] font-mono font-bold text-[var(--text-secondary)] mb-2">
              {formatINRCompact(baselineResult.snapshots.slice(0, selectedMonth).reduce((sum, s) => sum + s.totalRevenue, 0))}
            </div>
            <div className="text-[10px] text-[var(--brand)] mb-0.5">Proposal</div>
            <div className="text-[14px] font-mono font-bold text-[var(--brand)]">
              {formatINRCompact(proposalResult.snapshots.slice(0, selectedMonth).reduce((sum, s) => sum + s.totalRevenue, 0))}
            </div>
          </div>

          <div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Total Contribution</div>
            <div className="text-[10px] text-[var(--text-secondary)] mb-0.5">Baseline</div>
            <div className={`text-[14px] font-mono font-bold mb-2 ${
              baselineResult.snapshots.slice(0, selectedMonth).reduce((sum, s) => sum + s.contribution, 0) >= 0 
                ? 'text-[var(--green)]' 
                : 'text-[var(--red)]'
            }`}>
              {formatINRCompact(baselineResult.snapshots.slice(0, selectedMonth).reduce((sum, s) => sum + s.contribution, 0))}
            </div>
            <div className="text-[10px] text-[var(--brand)] mb-0.5">Proposal</div>
            <div className={`text-[14px] font-mono font-bold ${
              proposalResult.snapshots.slice(0, selectedMonth).reduce((sum, s) => sum + s.contribution, 0) >= 0 
                ? 'text-[var(--green)]' 
                : 'text-[var(--red)]'
            }`}>
              {formatINRCompact(proposalResult.snapshots.slice(0, selectedMonth).reduce((sum, s) => sum + s.contribution, 0))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
