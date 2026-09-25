/**
 * Unit Test Suite for Market Night Trust & Growth Funnel Model Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests:
 *  1. Core Definitions: Funnel sequencing, simulated vs live, cohort retention.
 *  2. Rollout Schedule: Zero before launch, partial vs full in launch month, ramp curve.
 *  3. Costs: 6 non-overlapping buckets, attendance benefits awarded without deposit/trade,
 *     one-time setup in launch month, maintenance in active months.
 *  4. Funnel Formulas: Single intervention clamp, negative & zero effects, combination warning.
 *  5. Provenance: Evidence badge changes do not alter numbers.
 *  6. Founder Economics: Scenario comparison and 12-month spending justification.
 */

import { describe, it, expect } from 'vitest';
import {
  deriveCoverageSchedule,
  computeEffectiveFunnelRate,
  runTrustFunnelModel,
  compareInterventionImpact,
  DEFAULT_TRUST_FUNNEL_INPUTS,
  INITIAL_TRUST_INTERVENTIONS,
  FOUNDER_FUNNEL_SCENARIOS,
  TrustIntervention,
  TrustFunnelModelInputs,
} from '../core/growth/trustFunnelModel';

describe('Market Night Trust & Growth Funnel Model', () => {

  // ─── 1. Rollout Coverage Schedule ───────────────────────────────────────────
  describe('Rollout Schedule Engine', () => {
    it('has zero coverage before launch month', () => {
      const schedule = deriveCoverageSchedule({
        launchMonth: 3,
        targetCoverage: 0.80,
        rampDurationMonths: 2,
      });
      expect(schedule).toHaveLength(12);
      expect(schedule[0]).toBe(0); // Month 1
      expect(schedule[1]).toBe(0); // Month 2
    });

    it('documents and provides partial coverage in launch month when rampDurationMonths > 1', () => {
      // Launch month 3, target 0.80, ramp 2 months -> Month 3 should be 0.80 * (1/2) = 0.40
      const schedule = deriveCoverageSchedule({
        launchMonth: 3,
        targetCoverage: 0.80,
        rampDurationMonths: 2,
      });
      expect(schedule[2]).toBe(0.40); // Month 3 (launch month) has partial coverage
      expect(schedule[3]).toBe(0.80); // Month 4 reaches full target coverage
      expect(schedule[4]).toBe(0.80); // Month 5 stays at target coverage
      expect(schedule[11]).toBe(0.80); // Month 12 stays at target coverage
    });

    it('provides full target coverage in launch month when rampDurationMonths = 1', () => {
      const schedule = deriveCoverageSchedule({
        launchMonth: 1,
        targetCoverage: 0.90,
        rampDurationMonths: 1,
      });
      expect(schedule[0]).toBe(0.90); // Month 1 has full target coverage
      expect(schedule[1]).toBe(0.90);
      expect(schedule[11]).toBe(0.90);
    });

    it('clamps target coverage within [0, 1]', () => {
      const scheduleOver = deriveCoverageSchedule({
        launchMonth: 1,
        targetCoverage: 1.5,
        rampDurationMonths: 1,
      });
      expect(scheduleOver[0]).toBe(1.0);

      const scheduleUnder = deriveCoverageSchedule({
        launchMonth: 1,
        targetCoverage: -0.2,
        rampDurationMonths: 1,
      });
      expect(scheduleUnder[0]).toBe(0);
    });
  });

  // ─── 2. Funnel Formulas & Combination Rule ──────────────────────────────────
  describe('Funnel Rate Computation', () => {
    it('applies single intervention formula correctly: clamp(baseRate + coverage * effect, 0, 1)', () => {
      const singleIntervention: TrustIntervention = {
        ...INITIAL_TRUST_INTERVENTIONS[0],
        target: 'onboarded_to_funded',
        coverageSchedule: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
        assumedPercentagePointEffect: 0.04, // +4pp
        enabled: true,
      };

      const result = computeEffectiveFunnelRate(
        0.40,
        'onboarded_to_funded',
        [singleIntervention],
        1 // Month 1
      );

      // 0.40 + 0.5 * 0.04 = 0.42
      expect(result.effectiveRate).toBeCloseTo(0.42, 4);
      expect(result.warning).toBeUndefined();
    });

    it('handles negative effect correctly (e.g. fee preview or withdrawal terms causing drop-off)', () => {
      const negativeIntervention: TrustIntervention = {
        ...INITIAL_TRUST_INTERVENTIONS[0],
        target: 'onboarded_to_funded',
        coverageSchedule: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
        assumedPercentagePointEffect: -0.05, // -5pp
        enabled: true,
      };

      const result = computeEffectiveFunnelRate(
        0.40,
        'onboarded_to_funded',
        [negativeIntervention],
        1
      );

      // 0.40 + 1.0 * (-0.05) = 0.35
      expect(result.effectiveRate).toBeCloseTo(0.35, 4);
    });

    it('handles zero effect cleanly without distortion', () => {
      const zeroIntervention: TrustIntervention = {
        ...INITIAL_TRUST_INTERVENTIONS[0],
        target: 'onboarded_to_funded',
        coverageSchedule: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
        assumedPercentagePointEffect: 0.00,
        enabled: true,
      };

      const result = computeEffectiveFunnelRate(
        0.40,
        'onboarded_to_funded',
        [zeroIntervention],
        1
      );

      expect(result.effectiveRate).toBeCloseTo(0.40, 4);
    });

    it('clamps rates to 0 when large negative effect exceeds baseRate', () => {
      const extremeNegative: TrustIntervention = {
        ...INITIAL_TRUST_INTERVENTIONS[0],
        target: 'onboarded_to_funded',
        coverageSchedule: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
        assumedPercentagePointEffect: -0.90,
        enabled: true,
      };

      const result = computeEffectiveFunnelRate(
        0.40,
        'onboarded_to_funded',
        [extremeNegative],
        1
      );

      expect(result.effectiveRate).toBe(0);
    });

    it('raises explicit warning when multiple interventions target the same parameter', () => {
      const interventionA: TrustIntervention = {
        ...INITIAL_TRUST_INTERVENTIONS[0],
        id: 'TI-A',
        name: 'Intervention A',
        target: 'onboarded_to_funded',
        coverageSchedule: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        assumedPercentagePointEffect: 0.02,
        enabled: true,
      };
      const interventionB: TrustIntervention = {
        ...INITIAL_TRUST_INTERVENTIONS[0],
        id: 'TI-B',
        name: 'Intervention B',
        target: 'onboarded_to_funded',
        coverageSchedule: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        assumedPercentagePointEffect: 0.03,
        enabled: true,
      };

      const result = computeEffectiveFunnelRate(
        0.40,
        'onboarded_to_funded',
        [interventionA, interventionB],
        1
      );

      // Combined additively: 0.40 + 0.02 + 0.03 = 0.45
      expect(result.effectiveRate).toBeCloseTo(0.45, 4);
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('target');
      expect(result.warning).toContain('Intervention A');
      expect(result.warning).toContain('Intervention B');
    });
  });

  // ─── 3. Core Definitions & Funnel Sequencing ─────────────────────────────────
  describe('Core Funnel Definitions', () => {
    it('distinguishes event attendance from new prospects (simulated != live)', () => {
      const output = runTrustFunnelModel(DEFAULT_TRUST_FUNNEL_INPUTS);
      const snap1 = output.snapshots[0];

      // 4 events * 4 crews * 4 members = 64 event attendees
      expect(snap1.eventAttendees).toBe(64);

      // Only a fraction register and are genuinely new to platform
      expect(snap1.marketNightNewProspects).toBeLessThan(snap1.eventAttendees);
      expect(snap1.marketNightNewProspects).toBeGreaterThan(0);

      // First live traders are strictly real-capital activations, not event attendees
      expect(snap1.firstLiveTraders).toBeLessThan(snap1.eventAttendees);
    });

    it('enforces non-increasing funnel stages: prospects >= onboarded >= funded >= first live trade', () => {
      const output = runTrustFunnelModel(DEFAULT_TRUST_FUNNEL_INPUTS);
      for (const snap of output.snapshots) {
        expect(snap.uniqueNewProspects).toBeGreaterThanOrEqual(snap.onboardedTraders);
        expect(snap.onboardedTraders).toBeGreaterThanOrEqual(snap.fundedTraders);
        expect(snap.fundedTraders).toBeGreaterThanOrEqual(snap.firstLiveTraders);
      }
    });

    it('calculates cohort retention as a recurrence over time, not an annual acquisition total', () => {
      const output = runTrustFunnelModel(DEFAULT_TRUST_FUNNEL_INPUTS);
      const snap1 = output.snapshots[0];
      const snap2 = output.snapshots[1];

      // In Month 1: prior active users = 0, so activeTraders = firstLiveTraders
      expect(snap1.retainedFromPriorMonth).toBe(0);
      expect(snap1.activeTraders).toBe(snap1.firstLiveTraders);

      // In Month 2: activeTraders = retainedFromPriorMonth + firstLiveTraders
      expect(snap2.retainedFromPriorMonth).toBeGreaterThan(0);
      expect(snap2.activeTraders).toBe(snap2.retainedFromPriorMonth + snap2.firstLiveTraders);
    });
  });

  // ─── 4. Cost Separation (6 Strict Buckets) ───────────────────────────────────
  describe('Strict Cost Separation', () => {
    it('separates costs into 6 non-overlapping categories with exact sum reconciliation', () => {
      const output = runTrustFunnelModel(DEFAULT_TRUST_FUNNEL_INPUTS);
      for (const snap of output.snapshots) {
        const c = snap.costs;
        const manualSum =
          c.marketNightHostingCost +
          c.attendanceBenefitsCost +
          c.productInterventionSetupCost +
          c.productInterventionMaintenanceCost +
          c.paidAcquisitionCost +
          c.otherOperatingCosts;

        expect(c.totalMonthlyCost).toBeCloseTo(manualSum, 1);
      }
    });

    it('awards attendance benefits upon qualification without requiring deposit or live trade', () => {
      // Set funding and trading conversion to 0: zero users deposit or trade
      const zeroConversionInputs: TrustFunnelModelInputs = {
        ...DEFAULT_TRUST_FUNNEL_INPUTS,
        baseFunnel: {
          ...DEFAULT_TRUST_FUNNEL_INPUTS.baseFunnel,
          onboardedToFundedRate: 0,
          fundedToFirstTradeRate: 0,
        },
        interventions: [], // no interventions
      };

      const output = runTrustFunnelModel(zeroConversionInputs);
      const snap1 = output.snapshots[0];

      // Funded and first live trade are zero:
      expect(snap1.fundedTraders).toBe(0);
      expect(snap1.firstLiveTraders).toBe(0);

      // Yet attendance benefits are still fully incurred for qualified crew attendees:
      expect(snap1.costs.attendanceBenefitsCost).toBeGreaterThan(0);
    });

    it('incurs product intervention setup cost strictly in the stated launch month', () => {
      const output = runTrustFunnelModel(DEFAULT_TRUST_FUNNEL_INPUTS);

      // TI-02 launches in Month 1 ($800 setup)
      // TI-01 launches in Month 2 ($1200 setup)
      // TI-03 launches in Month 3 ($2500 setup)
      expect(output.snapshots[0].costs.productInterventionSetupCost).toBe(800);
      expect(output.snapshots[1].costs.productInterventionSetupCost).toBe(1200);
      expect(output.snapshots[2].costs.productInterventionSetupCost).toBe(2500);

      // Months 4-12 have zero setup costs:
      for (let m = 3; m < 12; m++) {
        expect(output.snapshots[m].costs.productInterventionSetupCost).toBe(0);
      }
    });

    it('incurs product intervention maintenance cost strictly during active months', () => {
      const output = runTrustFunnelModel(DEFAULT_TRUST_FUNNEL_INPUTS);

      // Month 1: only TI-02 is active ($100)
      expect(output.snapshots[0].costs.productInterventionMaintenanceCost).toBe(100);

      // Month 2: TI-02 ($100) + TI-01 ($150) = $250
      expect(output.snapshots[1].costs.productInterventionMaintenanceCost).toBe(250);

      // Month 3+: TI-02 ($100) + TI-01 ($150) + TI-03 ($250) = $500
      expect(output.snapshots[2].costs.productInterventionMaintenanceCost).toBe(500);
      expect(output.snapshots[11].costs.productInterventionMaintenanceCost).toBe(500);
    });
  });

  // ─── 5. Provenance & Evidence Invariant ──────────────────────────────────────
  describe('Provenance and Evidence Badges', () => {
    it('changing evidence badge does not silently alter numerical outputs', () => {
      const inputsA = DEFAULT_TRUST_FUNNEL_INPUTS;
      const inputsB: TrustFunnelModelInputs = {
        ...DEFAULT_TRUST_FUNNEL_INPUTS,
        interventions: DEFAULT_TRUST_FUNNEL_INPUTS.interventions.map((i) => ({
          ...i,
          evidenceStatus: 'PILOT_OBSERVATION', // Changed badge from ASSUMED to PILOT_OBSERVATION
        })),
      };

      const outA = runTrustFunnelModel(inputsA);
      const outB = runTrustFunnelModel(inputsB);

      // Provenance badge is descriptive only — mathematical results must be 100% identical:
      expect(outA.summary.totalRevenueUsd12m).toBe(outB.summary.totalRevenueUsd12m);
      expect(outA.summary.totalCostUsd12m).toBe(outB.summary.totalCostUsd12m);
      expect(outA.summary.netContributionUsd12m).toBe(outB.summary.netContributionUsd12m);
      expect(outA.summary.endingActiveTraders).toBe(outB.summary.endingActiveTraders);
    });
  });

  // ─── 6. Founder Decision Comparison & Scenarios ──────────────────────────────
  describe('Founder Scenario Evaluation & ROI', () => {
    it('compares scenario with interventions vs without interventions', () => {
      const comparison = compareInterventionImpact(DEFAULT_TRUST_FUNNEL_INPUTS);

      // With positive interventions, incremental live traders and revenue should be positive
      expect(comparison.incrementalFirstLiveTraders).toBeGreaterThan(0);
      expect(comparison.incrementalEndingActiveTraders).toBeGreaterThan(0);
      expect(comparison.incrementalRevenueUsd).toBeGreaterThan(0);
      expect(comparison.totalInterventionCostsUsd).toBeGreaterThan(0);

      // Checks whether the spending is justified over 12 months
      expect(typeof comparison.justifiesSpendingOver12Months).toBe('boolean');
    });

    it('demonstrates when interventions fail to justify spending under pessimistic assumptions', () => {
      const pessimisticScenario = FOUNDER_FUNNEL_SCENARIOS.find(
        (s) => s.id === 'founder_pessimistic_shock'
      )!;

      const comparison = compareInterventionImpact(pessimisticScenario.inputs);

      // Under negative/zero assumed effects, incremental revenue is negative/zero
      // while intervention setup/maintenance costs are still incurred:
      expect(comparison.incrementalRevenueUsd).toBeLessThanOrEqual(0);
      expect(comparison.netIncrementalBenefitUsd).toBeLessThan(0);
      expect(comparison.justifiesSpendingOver12Months).toBe(false);
    });

    it('is completely deterministic — identical inputs yield identical outputs', () => {
      const runA = runTrustFunnelModel(DEFAULT_TRUST_FUNNEL_INPUTS);
      const runB = runTrustFunnelModel(DEFAULT_TRUST_FUNNEL_INPUTS);

      expect(runA.summary.netContributionUsd12m).toBe(runB.summary.netContributionUsd12m);
      expect(runA.summary.totalRevenueUsd12m).toBe(runB.summary.totalRevenueUsd12m);
      expect(runA.summary.endingActiveTraders).toBe(runB.summary.endingActiveTraders);
    });
  });

});
