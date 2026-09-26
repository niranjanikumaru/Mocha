import { runTrustFunnelModel, type TrustFunnelModelInputs, type TrustFunnelMonthlySnapshot } from './trustFunnelModel';

export type ComparisonMetric = 'uniqueNewProspects' | 'onboardedTraders' | 'fundedTraders' | 'firstLiveTraders' | 'activeTraders' | 'totalRevenueUsd' | 'contributionUsd';
// Sequential replacement: every step runs the complete history, including retention/referrals.
// These are model-accounting contributions, not measured causal effects or Shapley values.
const groups = [
  ['channel', 'Acquisition & events'], ['baseFunnel', 'Base conversion & retention'],
  ['interventions', 'Trust interventions & rollout'], ['trading', 'Trading & pricing'], ['costs', 'Operating costs'],
] as const;
export function attributeComparison(a: TrustFunnelModelInputs, b: TrustFunnelModelInputs) {
  let cursor = structuredClone(a);
  const base = runTrustFunnelModel(cursor);
  let previous = base;
  const steps = groups.map(([key, label]) => {
    cursor = { ...cursor, [key]: structuredClone(b[key]) };
    const next = runTrustFunnelModel(cursor);
    const step = { key, label, before: previous.snapshots, after: next.snapshots,
      changed: JSON.stringify(a[key]) !== JSON.stringify(b[key]) };
    previous = next;
    return step;
  });
  return { base, target: previous, steps };
}
export function metricValue(snapshot: TrustFunnelMonthlySnapshot, metric: ComparisonMetric) { return snapshot[metric]; }
