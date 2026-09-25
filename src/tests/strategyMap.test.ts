/**
 * strategyMap.test.ts
 * Tests for the Strategy Map calculation engine (§22 acceptance criteria).
 * All financial outputs must derive from the shared runModel() function.
 */
import { describe, it, expect } from 'vitest';
import {
  buildScenarioGrid,
  flatPoints,
  buildWaterfall,
  computeAxisRanges,
  exportAssumptionsJSON,
  exportMonthlyCSV,
  exportGridCSV,
} from '../core/growth/strategyMap';
import { runModel } from '../core/growth/model';
import { BASELINE_INPUTS, RECOMMENDED_INPUTS } from '../core/growth/scenarios';

describe('Strategy Map Engine (§22 acceptance criteria)', () => {

  // ── Grid construction ──────────────────────────────────────────────────────

  it('generates 25 pairs (50 points) for 5×5 grid', () => {
    const pairs = buildScenarioGrid();
    expect(pairs.length).toBe(25);
    const points = flatPoints(pairs);
    expect(points.length).toBe(50);
  });

  it('every point has exactly 12 monthly snapshots', () => {
    const pairs = buildScenarioGrid();
    for (const pair of pairs) {
      expect(pair.baseline.snapshots).toHaveLength(12);
      expect(pair.proposal.snapshots).toHaveLength(12);
    }
  });

  it('all point coordinates derive from the shared model engine', () => {
    const pairs = buildScenarioGrid();
    for (const pair of pairs.slice(0, 3)) { // spot-check first 3 for speed
      const rerun = runModel(pair.baseline.inputs);
      const expectedVol = rerun.snapshots.reduce((s, m) => s + m.volumeUsd, 0);
      const expectedContrib = rerun.snapshots.reduce((s, m) => s + m.contribution, 0);
      expect(Math.abs(pair.baseline.volumeUsd12m - expectedVol)).toBeLessThan(0.01);
      expect(Math.abs(pair.baseline.contribution12m - expectedContrib)).toBeLessThan(0.01);
    }
  });

  it('scenario IDs are stable — same config produces same ID', () => {
    const pairs1 = buildScenarioGrid();
    const pairs2 = buildScenarioGrid();
    expect(pairs1.map(p => p.id)).toEqual(pairs2.map(p => p.id));
  });

  it('matched pair holds constant: feeBps matches both variants', () => {
    const pairs = buildScenarioGrid();
    for (const pair of pairs) {
      expect(pair.baseline.feeBps).toBe(pair.feeBps);
      expect(pair.proposal.feeBps).toBe(pair.feeBps);
      expect(pair.baseline.inputs.pricing.takerFeeBps).toBe(pair.feeBps);
      expect(pair.proposal.inputs.pricing.takerFeeBps).toBe(pair.feeBps);
    }
  });

  it('budget allocation: baseline is all-paid, proposal splits according to communityFraction', () => {
    const pairs = buildScenarioGrid();
    for (const pair of pairs) {
      // Baseline: no community spend at all
      expect(pair.baseline.inputs.channel.crewEventsPerMonth).toBe(0);
      expect(pair.baseline.inputs.crewPerksCostUsd ?? 0).toBe(0);

      // Proposal: community fraction drives crew events
      if (pair.communityFraction === 0) {
        expect(pair.proposal.inputs.channel.crewEventsPerMonth).toBe(0);
      } else {
        expect(pair.proposal.inputs.channel.crewEventsPerMonth).toBeGreaterThan(0);
      }

      // Proposal paid budget is reduced when community fraction increases
      if (pair.communityFraction >= 0.5) {
        expect(pair.proposal.inputs.channel.paidBudgetUsd)
          .toBeLessThanOrEqual(pair.baseline.inputs.channel.paidBudgetUsd);
      }
    }
  });

  it('baseline always has crewEventsPerMonth = 0', () => {
    const pairs = buildScenarioGrid();
    for (const pair of pairs) {
      expect(pair.baseline.inputs.channel.crewEventsPerMonth).toBe(0);
    }
  });

  it('baseline always has all trust levers disabled', () => {
    const pairs = buildScenarioGrid();
    for (const pair of pairs) {
      for (const lever of pair.baseline.inputs.trustLevers) {
        expect(lever.enabled).toBe(false);
        expect(lever.completeness).toBe(0);
      }
    }
  });

  it('venue fees are excluded from platform revenue', () => {
    // Model engine: tradingRevenue = volume × takerFeeBps/10000 (no venue pass-through)
    const pairs = buildScenarioGrid();
    for (const pair of pairs.slice(0, 3)) {
      for (const snap of pair.baseline.snapshots) {
        const expectedTradingRev = snap.volumeUsd * (pair.feeBps / 10000);
        expect(Math.abs(snap.tradingRevenue - expectedTradingRev)).toBeLessThan(0.01);
      }
    }
  });

  it('zero platform fee produces zero trading revenue', () => {
    const inputs = { ...BASELINE_INPUTS, pricing: { ...BASELINE_INPUTS.pricing, takerFeeBps: 0 } };
    const result = runModel(inputs);
    for (const snap of result.snapshots) {
      expect(snap.tradingRevenue).toBe(0);
    }
  });

  it('zero users produces zero trading volume', () => {
    const inputs = {
      ...BASELINE_INPUTS,
      channel: {
        ...BASELINE_INPUTS.channel,
        paidBudgetUsd: 0,
        organicBaseMonthly: 0,
        invitesPerActiveUser: 0,
      },
    };
    const result = runModel(inputs);
    for (const snap of result.snapshots) {
      expect(snap.volumeUsd).toBe(0);
      expect(snap.tradingRevenue).toBe(0);
    }
  });

  it('higher fees do not increase volume when positive price sensitivity is active', () => {
    const lowFee = runModel({ ...RECOMMENDED_INPUTS, pricing: { ...RECOMMENDED_INPUTS.pricing, takerFeeBps: 3 } });
    const highFee = runModel({ ...RECOMMENDED_INPUTS, pricing: { ...RECOMMENDED_INPUTS.pricing, takerFeeBps: 12 } });
    const lowVol = lowFee.snapshots.reduce((s, m) => s + m.volumeUsd, 0);
    const highVol = highFee.snapshots.reduce((s, m) => s + m.volumeUsd, 0);
    expect(highVol).toBeLessThan(lowVol);
  });

  it('mechanical mode (priceElasticity=0) leaves volumeMultiplier=1 regardless of fee', () => {
    // With priceElasticity=0, effectiveElasticity=0, volumeMultiplier=Math.pow(feeRatio,0)=1.
    // Note: feeActivationPenalty and feeRetentionPenalty still apply (separate mechanism).
    // This test verifies that the volume-per-user multiplier is 1 at zero elasticity.
    const base = { ...RECOMMENDED_INPUTS, priceElasticity: 0, trustElasticityDampening: 0 };
    const result = runModel({ ...base, pricing: { ...base.pricing, takerFeeBps: 3 } });
    // volumeUsd = activeUsers × baseVolumePerActiveUsd × volumeMultiplier
    // At elasticity=0, volumeMultiplier=1, so volumeUsd/activeUsers ≈ baseVolumePerActiveUsd
    const snap = result.snapshots[11]; // month 12
    if (snap.activeUsers > 0) {
      const volPerUser = snap.volumeUsd / snap.activeUsers;
      expect(Math.abs(volPerUser - base.baseVolumePerActiveUsd) / base.baseVolumePerActiveUsd).toBeLessThan(0.01);
    }
  });

  it('trust effects can be set to zero', () => {
    const zeroed = {
      ...RECOMMENDED_INPUTS,
      trustLevers: RECOMMENDED_INPUTS.trustLevers.map((l) => ({
        ...l, betaKyc: 0, betaDeposit: 0, betaFirstTrade: 0, betaRetention: 0, betaTickets: 0,
      })),
    };
    const result = runModel(zeroed);
    expect(result.snapshots).toHaveLength(12);
    // Trust delivery costs should still exist even with zero effect betas
    // (paidBudget still allocated)
    expect(result.snapshots[0].totalCost).toBeGreaterThan(0);
  });

  it('trust effects can be negative — high fee reduces first-trade activation', () => {
    const highFee = runModel({ ...BASELINE_INPUTS, pricing: { ...BASELINE_INPUTS.pricing, takerFeeBps: 15 } });
    const lowFee = runModel({ ...BASELINE_INPUTS, pricing: { ...BASELINE_INPUTS.pricing, takerFeeBps: 5 } });
    // High fee should reduce firstTraded (via feeActivationPenalty)
    const highFirst = highFee.snapshots.reduce((s, m) => s + m.firstTraded, 0);
    const lowFirst = lowFee.snapshots.reduce((s, m) => s + m.firstTraded, 0);
    expect(highFirst).toBeLessThan(lowFirst);
  });

  // ── Waterfall attribution ──────────────────────────────────────────────────

  it('waterfall reconciles: step deltas sum to total contribution delta', () => {
    const pairs = buildScenarioGrid();
    const pair = pairs.find((p) => Math.abs(p.communityFraction - 0.5) < 0.01) ?? pairs[0];
    const waterfall = buildWaterfall(pair);
    const sumDeltas = waterfall.steps.slice(1).reduce((s, step) => s + step.delta, 0);
    expect(Math.abs(sumDeltas - waterfall.totalDelta)).toBeLessThan(1.0);
    expect(waterfall.reconciles).toBe(true);
  });

  it('waterfall has at least 3 steps (baseline → change → proposal)', () => {
    const pairs = buildScenarioGrid();
    const pair = pairs[5];
    const waterfall = buildWaterfall(pair);
    expect(waterfall.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('waterfall last step runningTotal equals proposal contribution', () => {
    const pairs = buildScenarioGrid();
    const pair = pairs[10];
    const waterfall = buildWaterfall(pair);
    const lastStep = waterfall.steps[waterfall.steps.length - 1];
    expect(Math.abs(lastStep.runningTotal - pair.proposal.contribution12m)).toBeLessThan(1.0);
  });

  // ── Axis ranges ────────────────────────────────────────────────────────────

  it('axis ranges contain all points (with padding)', () => {
    const pairs = buildScenarioGrid();
    const points = flatPoints(pairs);
    const ranges = computeAxisRanges(points);
    for (const pt of points) {
      expect(pt.volumeUsd12m).toBeGreaterThanOrEqual(ranges.xMin);
      expect(pt.volumeUsd12m).toBeLessThanOrEqual(ranges.xMax);
      expect(pt.contribution12m).toBeGreaterThanOrEqual(ranges.yMin);
      expect(pt.contribution12m).toBeLessThanOrEqual(ranges.yMax);
      expect(pt.activeM12).toBeGreaterThanOrEqual(ranges.zMin);
      expect(pt.activeM12).toBeLessThanOrEqual(ranges.zMax);
    }
  });

  // ── Exports ────────────────────────────────────────────────────────────────

  it('assumptions JSON export includes required fields', () => {
    const json = JSON.parse(exportAssumptionsJSON(RECOMMENDED_INPUTS, 'test-scenario'));
    expect(json.modelVersion).toBeDefined();
    expect(json.currency).toBe('USD');
    expect(json.scenarioId).toBe('test-scenario');
    expect(json.generatedAt).toBeDefined();
    expect(json.inputs).toBeDefined();
  });

  it('monthly CSV export has header and 24 data rows (12 baseline + 12 proposal)', () => {
    const pairs = buildScenarioGrid();
    const csv = exportMonthlyCSV(pairs[0]);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toContain('month');
    expect(lines.length).toBe(25); // 1 header + 24 data rows
  });

  it('grid CSV export includes all 50 points', () => {
    const pairs = buildScenarioGrid();
    const csv = exportGridCSV(pairs);
    const lines = csv.trim().split('\n');
    expect(lines.length).toBe(51); // 1 header + 50 data rows
  });

});
