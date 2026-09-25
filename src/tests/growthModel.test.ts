/**
 * Growth & Monetization Model Test Suite
 * Tests PRD §6.2 invariants and model determinism.
 */
import { describe, it, expect } from 'vitest';
import { runModel, sweepPricing, sensitivityTornado, DEFAULT_TRUST_LEVERS } from '../core/growth/model';
import { BASELINE_INPUTS, RECOMMENDED_INPUTS } from '../core/growth/scenarios';

describe('Growth Model Engine (PRD §6.2)', () => {
  it('Invariant 1: Funnel counts are non-increasing stage to stage', () => {
    const result = runModel(RECOMMENDED_INPUTS);
    for (const snap of result.snapshots) {
      expect(snap.totalSignups).toBeGreaterThanOrEqual(snap.kycPassed);
      expect(snap.kycPassed).toBeGreaterThanOrEqual(snap.deposited);
      expect(snap.deposited).toBeGreaterThanOrEqual(snap.firstTraded);
    }
  });

  it('Invariant 2: Deterministic execution — same inputs yield identical results', () => {
    const resA = runModel(RECOMMENDED_INPUTS);
    const resB = runModel(RECOMMENDED_INPUTS);
    expect(resA.totalRevenue12m).toBe(resB.totalRevenue12m);
    expect(resA.totalContribution12m).toBe(resB.totalContribution12m);
    expect(resA.peakMAU).toBe(resB.peakMAU);
  });

  it('Invariant 3: Baseline vs Recommended produces thesis-aligned results (Recommended has lower CAC)', () => {
    const base = runModel(BASELINE_INPUTS);
    const rec = runModel(RECOMMENDED_INPUTS);

    const baseLast = base.snapshots[base.snapshots.length - 1];
    const recLast = rec.snapshots[rec.snapshots.length - 1];

    // Crew Pass shifts mix → Blended CAC should be noticeably lower in Recommended
    expect(recLast.blendedCacUsd).toBeLessThan(baseLast.blendedCacUsd);
    // Trust score is higher in Recommended
    expect(recLast.trustScore).toBeGreaterThan(baseLast.trustScore);
  });

  it('Invariant 4: Warning raised when referral K-factor >= 1', () => {
    const explodingInputs = {
      ...RECOMMENDED_INPUTS,
      channel: {
        ...RECOMMENDED_INPUTS.channel,
        invitesPerActiveUser: 2.0,
        inviteConversionRate: 0.6, // K = 1.2
      },
    };
    const result = runModel(explodingInputs);
    expect(result.warnings.some((w) => w.includes('K-factor'))).toBe(true);
  });

  it('Invariant 4: Pricing Optimizer evaluates fee sweep and identifies optimum', () => {
    const points = sweepPricing(RECOMMENDED_INPUTS, [1, 20]);
    expect(points.length).toBeGreaterThan(0);
    const maxContribution = Math.max(...points.map((p) => p.contribution));
    const opt = points.find((p) => p.contribution === maxContribution);
    expect(opt).toBeDefined();
    expect(opt!.feeBps).toBeGreaterThanOrEqual(1);
    expect(opt!.feeBps).toBeLessThanOrEqual(20);
    expect(Number.isFinite(opt!.contribution)).toBe(true);
  });

  it('Sensitivity Tornado returns sorted factors by swing', () => {
    const tornado = sensitivityTornado(RECOMMENDED_INPUTS);
    expect(tornado.length).toBe(8);
    for (let i = 0; i < tornado.length - 1; i++) {
      expect(tornado[i].swing).toBeGreaterThanOrEqual(tornado[i + 1].swing);
    }
  });

  it('Trust levers disabled result in trustScore of 0', () => {
    const disabledInputs = {
      ...RECOMMENDED_INPUTS,
      trustLevers: DEFAULT_TRUST_LEVERS.map((l) => ({ ...l, enabled: false })),
    };
    const res = runModel(disabledInputs);
    expect(res.snapshots[0].trustScore).toBe(0);
  });
});
