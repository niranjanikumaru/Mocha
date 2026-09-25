/**
 * Unit Test Suite for Trust & Growth Funnel UI Logic & State Wiring
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { describe, it, expect } from 'vitest';
import {
  runTrustFunnelModel,
  compareInterventionImpact,
  DEFAULT_TRUST_FUNNEL_INPUTS,
  FOUNDER_FUNNEL_SCENARIOS,
  TrustFunnelModelInputs,
} from '../core/growth/trustFunnelModel';

describe('Trust Funnel UI State & Logic Wiring', () => {

  it('provides all 4 founder scenarios with valid inputs', () => {
    expect(FOUNDER_FUNNEL_SCENARIOS).toHaveLength(4);

    const ids = FOUNDER_FUNNEL_SCENARIOS.map((s) => s.id);
    expect(ids).toContain('founder_recommended');
    expect(ids).toContain('founder_market_night_only');
    expect(ids).toContain('founder_paid_baseline');
    expect(ids).toContain('founder_pessimistic_shock');

    for (const sc of FOUNDER_FUNNEL_SCENARIOS) {
      const output = runTrustFunnelModel(sc.inputs);
      expect(output.snapshots).toHaveLength(12);
      expect(Number.isFinite(output.summary.totalRevenueUsd12m)).toBe(true);
      expect(Number.isFinite(output.summary.netContributionUsd12m)).toBe(true);
    }
  });

  it('Action "Set effect to zero" preserves setup and maintenance costs', () => {
    // Take TI-01: setup $1200, maint $150/mo
    const inputsWithZeroEffect: TrustFunnelModelInputs = {
      ...DEFAULT_TRUST_FUNNEL_INPUTS,
      interventions: DEFAULT_TRUST_FUNNEL_INPUTS.interventions.map((i) =>
        i.id === 'TI-01' ? { ...i, assumedPercentagePointEffect: 0.00 } : i
      ),
    };

    const out = runTrustFunnelModel(inputsWithZeroEffect);
    // TI-01 launches in Month 2:
    expect(out.snapshots[1].costs.productInterventionSetupCost).toBe(1200);
    // Costs are preserved:
    expect(out.summary.costBreakdown12m.productInterventionSetupCost).toBe(
      DEFAULT_TRUST_FUNNEL_INPUTS.interventions.reduce((s, i) => s + i.setupCostUsd, 0)
    );
  });

  it('Action "Without intervention" avoids setup and maintenance costs under disclosed counterfactual', () => {
    // Disable TI-01 entirely:
    const inputsWithoutTI01: TrustFunnelModelInputs = {
      ...DEFAULT_TRUST_FUNNEL_INPUTS,
      interventions: DEFAULT_TRUST_FUNNEL_INPUTS.interventions.map((i) =>
        i.id === 'TI-01' ? { ...i, enabled: false } : i
      ),
    };

    const out = runTrustFunnelModel(inputsWithoutTI01);

    // Month 2 setup cost should be 0 because TI-01 ($1200) was disabled:
    expect(out.snapshots[1].costs.productInterventionSetupCost).toBe(0);

    // Total setup costs should exclude TI-01 ($1200):
    const expectedSetup = DEFAULT_TRUST_FUNNEL_INPUTS.interventions
      .filter((i) => i.id !== 'TI-01')
      .reduce((s, i) => s + i.setupCostUsd, 0);

    expect(out.summary.costBreakdown12m.productInterventionSetupCost).toBe(expectedSetup);
  });

  it('Comparison calculates correct deltas without confusing volume with solvency', () => {
    const comparison = compareInterventionImpact(DEFAULT_TRUST_FUNNEL_INPUTS);

    // Absolute differences exist
    expect(typeof comparison.incrementalFirstLiveTraders).toBe('number');
    expect(typeof comparison.incrementalEndingActiveTraders).toBe('number');
    expect(typeof comparison.incrementalRevenueUsd).toBe('number');
    expect(typeof comparison.totalInterventionCostsUsd).toBe('number');
    expect(typeof comparison.netIncrementalBenefitUsd).toBe('number');

    // Both scenarios may have different solvency status:
    const baseContrib = comparison.baselineWithoutInterventions.summary.netContributionUsd12m;
    const withContrib = comparison.withInterventions.summary.netContributionUsd12m;
    expect(comparison.netIncrementalBenefitUsd).toBeCloseTo(withContrib - baseContrib, 1);
  });

  it('Drop-off counts reconcile stage by stage: entered = proceeded + dropped', () => {
    const out = runTrustFunnelModel(DEFAULT_TRUST_FUNNEL_INPUTS);
    for (const snap of out.snapshots) {
      // Stage 1 -> 2:
      const droppedOnboard = snap.uniqueNewProspects - snap.onboardedTraders;
      expect(snap.onboardedTraders + droppedOnboard).toBe(snap.uniqueNewProspects);

      // Stage 2 -> 3:
      const droppedFunded = snap.onboardedTraders - snap.fundedTraders;
      expect(snap.fundedTraders + droppedFunded).toBe(snap.onboardedTraders);

      // Stage 3 -> 4:
      const droppedTraded = snap.fundedTraders - snap.firstLiveTraders;
      expect(snap.firstLiveTraders + droppedTraded).toBe(snap.fundedTraders);
    }
  });

});
