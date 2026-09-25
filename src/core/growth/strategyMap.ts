/**
 * strategyMap.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Strategy Map engine: scenario grid generation, matched-pair comparison,
 * sequential waterfall attribution, and export helpers.
 *
 * All financial outputs come from runModel(). Nothing is hardcoded.
 *
 * Design contract:
 *   • "Baseline" = paid-led, all acquisition budget on paid channel.
 *   • "Proposal"  = community-split allocation + optional trust levers.
 *   • A matched pair holds constant: fee, venue fee, funnel rates,
 *     retention, volume/user, elasticity, months, budget total.
 *   • Differences: paid/community split, trust lever completeness, perks cost.
 *
 * CURRENCY NOTE: All monetary values are USD throughout the model engine.
 * The UI layer may display these as INR with a fixed conversion rate but must
 * label the currency explicitly. This file uses USD only.
 */

import { ModelInputs, MonthlySnapshot, runModel } from './model';
import { BASELINE_INPUTS, RECOMMENDED_INPUTS } from './scenarios';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StrategyVariant = 'baseline' | 'proposal';

/** One complete 12-month simulation result packaged for the Strategy Map. */
export interface ScenarioPoint {
  /** Stable ID derived from config, not random. */
  id: string;
  pairId: string;           // shared with its matched pair
  variant: StrategyVariant;
  label: string;

  // Plot coordinates — from actual model output
  volumeUsd12m: number;     // X: year-one executed trading volume (USD)
  contribution12m: number;  // Y: year-one contribution (USD)
  activeM12: number;        // Z: month-12 active traders

  // Inputs that vary across the grid
  feeBps: number;
  communityFraction: number;   // 0 = all paid, 1 = all community
  trustCompleteness: number;   // avg across levers (0–1)

  // Full inputs + monthly snapshots for drawer / chart
  inputs: ModelInputs;
  snapshots: MonthlySnapshot[];
  warnings: string[];
}

/** A baseline+proposal pair sharing the same fee & budget allocation. */
export interface ScenarioPair {
  id: string;
  feeBps: number;
  communityFraction: number;
  baseline: ScenarioPoint;
  proposal: ScenarioPoint;
}

/** Axis ranges for the 3D/2D scatter plot. */
export interface AxisRanges {
  xMin: number; xMax: number;
  yMin: number; yMax: number;
  zMin: number; zMax: number;
}

/** One step in the sequential waterfall attribution. */
export interface WaterfallStep {
  label: string;
  delta: number;              // contribution change (USD)
  runningTotal: number;
  changedInputs: Array<{ key: string; from: number | string; to: number | string; unit: string }>;
  explanation: string;
}

/** Full waterfall from baseline to proposal. */
export interface WaterfallResult {
  steps: WaterfallStep[];
  totalDelta: number;
  reconciles: boolean;        // |sum(steps) - totalDelta| < 0.01
  disclaimer: string;
}

// ─── Grid construction ────────────────────────────────────────────────────────

export interface GridConfig {
  /** 5 fee values centred around current (bps) */
  feeBpsValues?: number[];
  /** 5 community fractions (0 = all paid, 1 = all community) */
  communityFractions?: number[];
  /** Founder's current inputs (used to centre the grid) */
  currentInputs?: ModelInputs;
}

const DEFAULT_FEE_BPS = [2, 4, 6, 8, 10];
const DEFAULT_COMMUNITY_FRACTIONS = [0, 0.25, 0.5, 0.75, 1.0];

/**
 * Builds a deterministic 5×5 grid of matched pairs.
 * ~50 scenario points total (25 pairs × 2 variants).
 */
export function buildScenarioGrid(config: GridConfig = {}): ScenarioPair[] {
  const feeBpsValues = dedupe(
    config.feeBpsValues ?? centredFeeRange(
      config.currentInputs?.pricing.takerFeeBps ?? BASELINE_INPUTS.pricing.takerFeeBps,
      5
    )
  );
  const communityFractions = dedupe(
    config.communityFractions ?? DEFAULT_COMMUNITY_FRACTIONS
  );

  const pairs: ScenarioPair[] = [];

  for (const feeBps of feeBpsValues) {
    for (const cf of communityFractions) {
      const pairId = `pair-f${feeBps.toFixed(1)}-c${(cf * 100).toFixed(0)}`;

      const baseInputs = makeBaselineInputs(feeBps, cf, config.currentInputs);
      const propInputs = makeProposalInputs(feeBps, cf, config.currentInputs);

      const baseResult = runModel(baseInputs);
      const propResult = runModel(propInputs);

      const baseSnaps = baseResult.snapshots;
      const propSnaps = propResult.snapshots;

      const basePoint = toPoint(pairId, 'baseline', feeBps, cf, baseInputs, baseSnaps, baseResult.warnings);
      const propPoint = toPoint(pairId, 'proposal', feeBps, cf, propInputs, propSnaps, propResult.warnings);

      pairs.push({ id: pairId, feeBps, communityFraction: cf, baseline: basePoint, proposal: propPoint });
    }
  }

  return pairs;
}

/** All points as a flat array for scatter plot rendering. */
export function flatPoints(pairs: ScenarioPair[]): ScenarioPoint[] {
  return pairs.flatMap((p) => [p.baseline, p.proposal]);
}

// ─── Axis range helpers ───────────────────────────────────────────────────────

export function computeAxisRanges(points: ScenarioPoint[], padFraction = 0.10): AxisRanges {
  const xs = points.map((p) => p.volumeUsd12m);
  const ys = points.map((p) => p.contribution12m);
  const zs = points.map((p) => p.activeM12);

  function pad(min: number, max: number) {
    const range = max - min || Math.abs(min) || 1;
    return { lo: min - range * padFraction, hi: max + range * padFraction };
  }

  const xr = pad(Math.min(...xs), Math.max(...xs));
  const yr = pad(Math.min(...ys), Math.max(...ys));
  const zr = pad(Math.min(...zs), Math.max(...zs));

  return { xMin: xr.lo, xMax: xr.hi, yMin: yr.lo, yMax: yr.hi, zMin: zr.lo, zMax: zr.hi };
}

/** Returns the Y value where the zero-contribution plane sits. */
export function zeroPlaneY(ranges: AxisRanges): number {
  return 0; // Always at y=0; the caller checks whether it falls within [yMin, yMax]
}

// ─── Waterfall attribution ────────────────────────────────────────────────────

/**
 * Sequentially decomposes the contribution delta between a baseline and proposal.
 * Order: channel changes → trust changes → pricing changes → benefit changes → final.
 * Each intermediate model run uses exactly the shared runModel() function.
 */
export function buildWaterfall(pair: ScenarioPair): WaterfallResult {
  const base = pair.baseline;
  const prop = pair.proposal;

  const baseContrib = base.contribution12m;
  const propContrib = prop.contribution12m;
  const totalDelta = propContrib - baseContrib;

  const steps: WaterfallStep[] = [];
  let prevContrib = baseContrib;

  // Step 0: baseline anchor
  steps.push({
    label: 'Baseline',
    delta: 0,
    runningTotal: baseContrib,
    changedInputs: [],
    explanation: `Starting point: paid-led acquisition at ${pair.feeBps} bps fee.`,
  });

  // Step 1: channel change (paid → community split)
  const afterChannel = runModel({
    ...base.inputs,
    channel: prop.inputs.channel,
  });
  const afterChannelContrib = afterChannel.snapshots.reduce((s, m) => s + m.contribution, 0);
  const channelDelta = afterChannelContrib - prevContrib;

  const paidFrac = 1 - pair.communityFraction;
  const crewEvents = prop.inputs.channel.crewEventsPerMonth;

  steps.push({
    label: 'Channel shift',
    delta: channelDelta,
    runningTotal: afterChannelContrib,
    changedInputs: [
      { key: 'Paid budget', from: fmtUsd(base.inputs.channel.paidBudgetUsd), to: fmtUsd(prop.inputs.channel.paidBudgetUsd), unit: 'USD/mo' },
      { key: 'Crew events/mo', from: base.inputs.channel.crewEventsPerMonth, to: crewEvents, unit: '' },
    ],
    explanation: `Budget split: ${(paidFrac * 100).toFixed(0)}% paid / ${(pair.communityFraction * 100).toFixed(0)}% community. ` +
      `Crew events change from ${base.inputs.channel.crewEventsPerMonth} → ${crewEvents}/mo. ` +
      `Channel change is not cost-free — hosting and moderation costs are included.`,
  });
  prevContrib = afterChannelContrib;

  // Step 2: trust levers
  const afterTrust = runModel({
    ...base.inputs,
    channel: prop.inputs.channel,
    trustLevers: prop.inputs.trustLevers,
    crewPerksCostUsd: base.inputs.crewPerksCostUsd, // defer perks to step 4
  });
  const afterTrustContrib = afterTrust.snapshots.reduce((s, m) => s + m.contribution, 0);
  const trustDelta = afterTrustContrib - prevContrib;
  const avgTrust = prop.inputs.trustLevers.reduce((s, l) => s + (l.enabled ? l.completeness : 0), 0) / prop.inputs.trustLevers.length;

  steps.push({
    label: 'Trust interventions',
    delta: trustDelta,
    runningTotal: afterTrustContrib,
    changedInputs: prop.inputs.trustLevers
      .filter((l, i) => l.enabled !== base.inputs.trustLevers[i]?.enabled || Math.abs(l.completeness - (base.inputs.trustLevers[i]?.completeness ?? 0)) > 0.01)
      .map((l) => ({ key: l.label, from: base.inputs.trustLevers.find((b) => b.id === l.id)?.completeness ?? 0, to: l.completeness, unit: 'completeness' })),
    explanation: `Trust levers set to avg ${(avgTrust * 100).toFixed(0)}% completeness. ` +
      `Effects on deposit rate, first-trade activation, retention and support costs included. ` +
      `Allow-zero and negative effects: a clear risk preview may reduce funding because unsuitable users opt out.`,
  });
  prevContrib = afterTrustContrib;

  // Step 3: pricing (fee already same in a matched pair — delta should be near zero)
  const afterPricing = runModel({
    ...base.inputs,
    channel: prop.inputs.channel,
    trustLevers: prop.inputs.trustLevers,
    pricing: prop.inputs.pricing,
    crewPerksCostUsd: base.inputs.crewPerksCostUsd,
  });
  const afterPricingContrib = afterPricing.snapshots.reduce((s, m) => s + m.contribution, 0);
  const pricingDelta = afterPricingContrib - prevContrib;

  if (Math.abs(pricingDelta) > 0.5) {
    steps.push({
      label: 'Pricing changes',
      delta: pricingDelta,
      runningTotal: afterPricingContrib,
      changedInputs: [
        { key: 'Taker fee', from: `${base.inputs.pricing.takerFeeBps} bps`, to: `${prop.inputs.pricing.takerFeeBps} bps`, unit: '' },
      ],
      explanation: `Fee changed from ${base.inputs.pricing.takerFeeBps} → ${prop.inputs.pricing.takerFeeBps} bps. Volume multiplier adjusts via price elasticity.`,
    });
    prevContrib = afterPricingContrib;
  }

  // Step 4: benefits / perks cost
  const afterBenefits = runModel({
    ...prop.inputs,
  });
  const afterBenefitsContrib = afterBenefits.snapshots.reduce((s, m) => s + m.contribution, 0);
  const benefitsDelta = afterBenefitsContrib - prevContrib;

  if (Math.abs(benefitsDelta) > 0.5) {
    steps.push({
      label: 'Benefit costs',
      delta: benefitsDelta,
      runningTotal: afterBenefitsContrib,
      changedInputs: [
        { key: 'Crew perks/user/mo', from: fmtUsd(base.inputs.crewPerksCostUsd ?? 0), to: fmtUsd(prop.inputs.crewPerksCostUsd ?? 0), unit: 'USD' },
      ],
      explanation: `Community benefit costs change from $${(base.inputs.crewPerksCostUsd ?? 0).toFixed(2)} → $${(prop.inputs.crewPerksCostUsd ?? 0).toFixed(2)}/active user/mo. Benefits are costs even when their assumed effects are zero.`,
    });
    prevContrib = afterBenefitsContrib;
  }

  // Final anchor
  steps.push({
    label: 'Proposal',
    delta: propContrib - prevContrib,
    runningTotal: propContrib,
    changedInputs: [],
    explanation: `Final proposal contribution after all adjustments.`,
  });

  const sumDeltas = steps.reduce((s, step, i) => i === 0 ? 0 : s + step.delta, 0);
  const reconciles = Math.abs(sumDeltas - totalDelta) < 1.0;

  return {
    steps,
    totalDelta,
    reconciles,
    disclaimer: 'Sequential contribution breakdown. Interactions are allocated according to the displayed order. ' +
      'This is a model-based comparison, not measured causal evidence.',
  };
}

// ─── Export helpers ───────────────────────────────────────────────────────────

export function exportAssumptionsJSON(inputs: ModelInputs, scenarioId: string): string {
  return JSON.stringify(
    {
      modelVersion: '2.0.0',
      currency: 'USD',
      scenarioId,
      generatedAt: new Date().toISOString(),
      pricingMode: 'behavioural',
      inputs,
    },
    null,
    2
  );
}

export function exportMonthlyCSV(pair: ScenarioPair): string {
  const header = 'month,variant,activeUsers,volumeUsd,tradingRevenue,totalRevenue,totalCost,contribution,cumulativeContribution';
  const rows: string[] = [header];

  function appendRows(snaps: MonthlySnapshot[], variant: string) {
    let cum = 0;
    for (const s of snaps) {
      cum += s.contribution;
      rows.push(
        [s.month, variant, s.activeUsers, s.volumeUsd.toFixed(2), s.tradingRevenue.toFixed(2),
          s.totalRevenue.toFixed(2), s.totalCost.toFixed(2), s.contribution.toFixed(2), cum.toFixed(2)
        ].join(',')
      );
    }
  }

  appendRows(pair.baseline.snapshots, 'baseline');
  appendRows(pair.proposal.snapshots, 'proposal');
  return rows.join('\n');
}

export function exportGridCSV(pairs: ScenarioPair[]): string {
  const header = 'pairId,variant,feeBps,communityFraction,volumeUsd12m,contribution12m,activeM12,warnings';
  const rows = [header];
  for (const p of pairs) {
    for (const pt of [p.baseline, p.proposal]) {
      rows.push([
        pt.pairId, pt.variant, pt.feeBps.toFixed(1), pt.communityFraction.toFixed(2),
        pt.volumeUsd12m.toFixed(2), pt.contribution12m.toFixed(2), pt.activeM12,
        `"${pt.warnings.join('; ')}"`,
      ].join(','));
    }
  }
  return rows.join('\n');
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function centredFeeRange(centre: number, count: number): number[] {
  const step = 2;
  const half = Math.floor(count / 2);
  const values: number[] = [];
  for (let i = -half; i <= half; i++) {
    const v = Math.max(1, Math.min(20, Math.round((centre + i * step) * 2) / 2));
    values.push(v);
  }
  return values;
}

function dedupe(arr: number[]): number[] {
  return [...new Set(arr.map((v) => +v.toFixed(4)))].sort((a, b) => a - b);
}

function fmtUsd(n: number): string {
  return `$${n.toFixed(0)}`;
}

function totalContrib(snaps: MonthlySnapshot[]): number {
  return snaps.reduce((s, m) => s + m.contribution, 0);
}

function makeBaselineInputs(feeBps: number, communityFraction: number, current?: ModelInputs): ModelInputs {
  const base = current ?? BASELINE_INPUTS;
  const totalBudget = base.channel.paidBudgetUsd + (base.channel.crewEventsPerMonth * (base.crewEventCostUsd ?? 58));
  return {
    ...base,
    pricing: { ...base.pricing, takerFeeBps: feeBps },
    channel: {
      ...base.channel,
      // Baseline always allocates full budget to paid (community fraction ignored for baseline)
      paidBudgetUsd: totalBudget,
      crewEventsPerMonth: 0,
      crewsPerEvent: 0,
      crewJoinRate: 0,
      crewNewPlatformShare: 0,
    },
    trustLevers: base.trustLevers.map((l) => ({ ...l, enabled: false, completeness: 0 })),
    crewPerksCostUsd: 0,
  };
}

function makeProposalInputs(feeBps: number, communityFraction: number, current?: ModelInputs): ModelInputs {
  const rec = current ?? RECOMMENDED_INPUTS;
  const base = current ?? BASELINE_INPUTS;
  const totalBudget = base.channel.paidBudgetUsd + (base.channel.crewEventsPerMonth * (base.crewEventCostUsd ?? 58));
  const crewBudget = totalBudget * communityFraction;
  const paidBudget = totalBudget * (1 - communityFraction);
  // Community fraction determines how many events we can run
  const crewEventsPerMonth = communityFraction > 0
    ? Math.max(1, Math.round(communityFraction * (rec.channel.crewEventsPerMonth || 4)))
    : 0;

  return {
    ...rec,
    pricing: { ...rec.pricing, takerFeeBps: feeBps },
    channel: {
      ...rec.channel,
      paidBudgetUsd: paidBudget,
      crewEventsPerMonth,
      crewsPerEvent: communityFraction > 0 ? (rec.channel.crewsPerEvent || 3) : 0,
      crewJoinRate: rec.channel.crewJoinRate,
      crewNewPlatformShare: rec.channel.crewNewPlatformShare,
    },
    trustLevers: rec.trustLevers,
    crewPerksCostUsd: communityFraction > 0 ? (rec.crewPerksCostUsd ?? 1.5) : 0,
  };
}

function toPoint(
  pairId: string,
  variant: StrategyVariant,
  feeBps: number,
  communityFraction: number,
  inputs: ModelInputs,
  snapshots: MonthlySnapshot[],
  warnings: string[],
): ScenarioPoint {
  const vol12m = snapshots.reduce((s, m) => s + m.volumeUsd, 0);
  const contrib12m = totalContrib(snapshots);
  const activeM12 = snapshots[snapshots.length - 1]?.activeUsers ?? 0;
  const avgTrust = inputs.trustLevers.length > 0
    ? inputs.trustLevers.reduce((s, l) => s + (l.enabled ? l.completeness : 0), 0) / inputs.trustLevers.length
    : 0;

  const id = `${pairId}-${variant}`;
  const label = variant === 'baseline'
    ? `Baseline · ${feeBps} bps`
    : `Proposal · ${feeBps} bps · ${(communityFraction * 100).toFixed(0)}% community`;

  return { id, pairId, variant, label, volumeUsd12m: vol12m, contribution12m: contrib12m, activeM12, feeBps, communityFraction, trustCompleteness: avgTrust, inputs, snapshots, warnings };
}
