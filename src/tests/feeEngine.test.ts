/**
 * feeEngine.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies the single calculation engine that powers both the customer-facing
 * trade preview and the founder-facing year-one projection. Judges should not
 * be able to find inconsistencies between these two views.
 */

import { describe, it, expect } from 'vitest';
import {
  calcTradeCharges,
  calcProjection,
  comparePlans,
  DEFAULT_FEE_CONFIG,
  PLAN_B_FEE_CONFIG,
  DEFAULT_PROJECTION_INPUTS,
  fmtINR,
  fmtPct,
} from '../lib/feeEngine';
import type { FeeConfig, SavedPlan, DemandMode, SensitivityLevel } from '../types/feeExperiment';

// ── Helpers ──────────────────────────────────────────────────────────────────
function makePlan(
  id: 'A' | 'B',
  config: FeeConfig,
  mode: DemandMode = 'ARITHMETIC_ONLY',
  sensitivity: SensitivityLevel = 'MEDIUM',
  baseConfig?: FeeConfig,
): SavedPlan {
  return {
    id,
    label: `Plan ${id}`,
    config,
    projection: calcProjection(config, DEFAULT_PROJECTION_INPUTS, mode, sensitivity, baseConfig),
    demandMode: mode,
    sensitivity,
  };
}

// ── Trade Charge Breakdown ──────────────────────────────────────────────────

describe('calcTradeCharges', () => {
  it('returns correct breakdown for ₹1,00,000 at 0.020% platform fee', () => {
    const b = calcTradeCharges(DEFAULT_FEE_CONFIG);
    expect(b.platformFee).toBe(20);     // 1,00,000 × 0.00020
    expect(b.venueFee).toBe(45);        // 1,00,000 × 0.00045
    expect(b.creditApplied).toBe(0);    // toggle is off
    expect(b.netPlatformFee).toBe(20);
    expect(b.totalExecutionCharge).toBe(65);
    expect(b.creditCoversAll).toBe(false);
  });

  it('returns correct breakdown for Plan B (0.030%)', () => {
    const b = calcTradeCharges(PLAN_B_FEE_CONFIG);
    expect(b.platformFee).toBe(30);     // 1,00,000 × 0.00030
    expect(b.venueFee).toBe(45);
    expect(b.totalExecutionCharge).toBe(75);
  });

  it('applies credit correctly (credit ≤ platform fee)', () => {
    const config: FeeConfig = { ...DEFAULT_FEE_CONFIG, creditApplied: true };
    const b = calcTradeCharges(config);
    expect(b.platformFee).toBe(20);
    expect(b.creditApplied).toBe(20);   // min(20 cap, 20 fee)
    expect(b.netPlatformFee).toBe(0);
    expect(b.totalExecutionCharge).toBe(45); // only venue
    expect(b.creditCoversAll).toBe(true);
  });

  it('caps credit when cap < platform fee', () => {
    const config: FeeConfig = {
      ...PLAN_B_FEE_CONFIG,
      creditCap: 10,
      creditApplied: true,
    };
    const b = calcTradeCharges(config);
    expect(b.platformFee).toBe(30);
    expect(b.creditApplied).toBe(10);   // capped at 10
    expect(b.netPlatformFee).toBe(20);  // 30 - 10
    expect(b.totalExecutionCharge).toBe(65); // 20 + 45
    expect(b.creditCoversAll).toBe(false);
  });

  it('venue fee is independent of credit', () => {
    const withCredit = calcTradeCharges({ ...DEFAULT_FEE_CONFIG, creditApplied: true });
    const without = calcTradeCharges({ ...DEFAULT_FEE_CONFIG, creditApplied: false });
    expect(withCredit.venueFee).toBe(without.venueFee);
  });
});

// ── Year-One Projection (Arithmetic Only) ───────────────────────────────────

describe('calcProjection — ARITHMETIC_ONLY', () => {
  it('computes gross revenue = volume × platformFeeRate (venue not retained)', () => {
    const p = calcProjection(DEFAULT_FEE_CONFIG, DEFAULT_PROJECTION_INPUTS, 'ARITHMETIC_ONLY', 'MEDIUM');
    const expectedVolume = 5_000 * 12 * 1_00_000; // 60,00,00,00,000 (₹600Cr)
    expect(p.totalVolume).toBe(expectedVolume);
    expect(p.grossServiceRevenue).toBe(+(expectedVolume * 0.00020).toFixed(2));
    expect(p.volumeRetentionPct).toBe(100);
  });

  it('deducts redeemed credits correctly', () => {
    const p = calcProjection(DEFAULT_FEE_CONFIG, DEFAULT_PROJECTION_INPUTS, 'ARITHMETIC_ONLY', 'MEDIUM');
    const expectedCredits = 41 * 48 * 20; // completedCrewsPerEvent × eventsPerYear × creditCap
    expect(p.redeemedCredits).toBe(expectedCredits);
    expect(p.netServiceRevenue).toBe(+(p.grossServiceRevenue - expectedCredits).toFixed(2));
  });

  it('contribution = net revenue − opex − acq cost', () => {
    const p = calcProjection(DEFAULT_FEE_CONFIG, DEFAULT_PROJECTION_INPUTS, 'ARITHMETIC_ONLY', 'MEDIUM');
    const opex = 75_000 * 12;
    const acq = 1_500 * 150;
    expect(p.operatingCost).toBe(opex);
    expect(p.acquisitionCost).toBe(acq);
    expect(p.contribution).toBe(+(p.netServiceRevenue - opex - acq).toFixed(2));
  });
});

// ── Demand Sensitivity ──────────────────────────────────────────────────────

describe('calcProjection — DEMAND_SENSITIVE', () => {
  it('reduces volume when fee increases (MEDIUM elasticity)', () => {
    const p = calcProjection(
      PLAN_B_FEE_CONFIG, DEFAULT_PROJECTION_INPUTS,
      'DEMAND_SENSITIVE', 'MEDIUM', DEFAULT_FEE_CONFIG,
    );
    const baseVolume = DEFAULT_PROJECTION_INPUTS.activeTraders
      * DEFAULT_PROJECTION_INPUTS.avgTradesPerYear
      * DEFAULT_PROJECTION_INPUTS.avgPositionValue;
    expect(p.volumeRetentionPct).toBeLessThan(100);
    expect(p.effectiveVolume).toBeLessThan(baseVolume);
  });

  it('higher sensitivity → more volume loss', () => {
    const low = calcProjection(
      PLAN_B_FEE_CONFIG, DEFAULT_PROJECTION_INPUTS,
      'DEMAND_SENSITIVE', 'LOW', DEFAULT_FEE_CONFIG,
    );
    const high = calcProjection(
      PLAN_B_FEE_CONFIG, DEFAULT_PROJECTION_INPUTS,
      'DEMAND_SENSITIVE', 'HIGH', DEFAULT_FEE_CONFIG,
    );
    expect(high.volumeRetentionPct).toBeLessThan(low.volumeRetentionPct);
  });

  it('no volume drop when fee does not change', () => {
    const p = calcProjection(
      DEFAULT_FEE_CONFIG, DEFAULT_PROJECTION_INPUTS,
      'DEMAND_SENSITIVE', 'HIGH', DEFAULT_FEE_CONFIG,
    );
    expect(p.volumeRetentionPct).toBe(100);
  });
});

// ── Plan Comparison ─────────────────────────────────────────────────────────

describe('comparePlans', () => {
  it('breakeven retention for 0.020% → 0.030% is ~66.7%', () => {
    const planA = makePlan('A', DEFAULT_FEE_CONFIG);
    const planB = makePlan('B', PLAN_B_FEE_CONFIG);
    const cmp = comparePlans(planA, planB);
    expect(cmp.breakevenVolumeRetentionPct).toBeCloseTo(66.7, 1);
  });

  it('reports whether plan B wins on contribution', () => {
    const planA = makePlan('A', DEFAULT_FEE_CONFIG);
    const planB = makePlan('B', PLAN_B_FEE_CONFIG);
    const cmp = comparePlans(planA, planB);
    // Under ARITHMETIC_ONLY (100% retention), Plan B with higher fee wins
    expect(cmp.planBWinsOnContribution).toBe(true);
    expect(cmp.contributionDelta).toBeGreaterThan(0);
  });
});

// ── Formatting ──────────────────────────────────────────────────────────────

describe('fmtINR', () => {
  it('formats crores', () => expect(fmtINR(1_50_00_000)).toBe('₹1.50Cr'));
  it('formats lakhs', () => expect(fmtINR(12_00_000)).toBe('₹12.00L'));
  it('formats thousands', () => expect(fmtINR(9_500)).toBe('₹9.50K'));
  it('formats small values', () => expect(fmtINR(65)).toBe('₹65.00'));
});

describe('fmtPct', () => {
  it('formats rate as percentage', () => expect(fmtPct(0.00020)).toBe('0.020%'));
  it('custom decimal places', () => expect(fmtPct(0.00030, 2)).toBe('0.03%'));
});
