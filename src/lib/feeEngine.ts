/**
 * feeEngine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single calculation engine for:
 *   1. Customer-facing trade charge breakdown (calcTradeCharges)
 *   2. Founder-facing year-one projection    (calcProjection)
 *   3. Plan A vs Plan B comparison           (comparePlans)
 *
 * Using one engine for both ensures that what the customer pays and what the
 * founder earns are numerically consistent.
 *
 * IMPORTANT accounting rule:
 *   Venue charges are NOT retained platform revenue.
 *   Gross service revenue = executed volume × platformFeeRate only.
 */

import {
  FeeConfig, TradeChargeBreakdown,
  DemandMode, SensitivityLevel,
  ProjectionInputs, ProjectionResult,
  SavedPlan, PlanComparison,
} from '../types/feeExperiment';

// ─── Demand elasticity assumptions ──────────────────────────────────────────
// % volume drop per 1% increase in total execution fee rate.
// These are assumed, not measured. Labelled explicitly in the UI.
const ELASTICITY: Record<SensitivityLevel, number> = {
  LOW:    0.20,   // mild response: 1% fee hike → 0.20% volume drop
  MEDIUM: 0.55,   // moderate response
  HIGH:   1.10,   // strong response: 1% fee hike → 1.10% volume drop
};

// ─── Default projection inputs ───────────────────────────────────────────────
export const DEFAULT_PROJECTION_INPUTS: ProjectionInputs = {
  activeTraders:             5_000,
  avgTradesPerYear:          12,
  avgPositionValue:          1_00_000,    // ₹1,00,000
  completedCrewsPerEvent:    41,          // matches existing engine baseline
  eventsPerYear:             48,          // ~weekly
  operatingCostPerMonth:     75_000,      // ₹75k/month opex
  acquisitionCostPerTrader:  150,         // ₹150 blended CAC (with Market Night)
  newTradersPerYear:         1_500,
};

// ─── Default fee configs ─────────────────────────────────────────────────────
export const DEFAULT_FEE_CONFIG: FeeConfig = {
  platformFeeRate: 0.00020,   // 0.020%
  venueFeeRate:    0.00045,   // 0.045% — external assumption
  positionValue:   1_00_000,  // ₹1,00,000
  creditCap:       20,        // ₹20 Market Night credit
  creditApplied:   false,
};

export const PLAN_B_FEE_CONFIG: FeeConfig = {
  ...DEFAULT_FEE_CONFIG,
  platformFeeRate: 0.00030,   // 0.030%
};

// ─── Core calculations ───────────────────────────────────────────────────────

/**
 * Itemised breakdown for the customer-facing trade preview.
 * Driven by FeeConfig only — no projection assumptions needed.
 */
export function calcTradeCharges(config: FeeConfig): TradeChargeBreakdown {
  const platformFee = +(config.positionValue * config.platformFeeRate).toFixed(2);
  const venueFee    = +(config.positionValue * config.venueFeeRate).toFixed(2);
  const creditApplied = config.creditApplied
    ? +Math.min(config.creditCap, platformFee).toFixed(2)
    : 0;
  const netPlatformFee      = +(platformFee - creditApplied).toFixed(2);
  const totalExecutionCharge = +(netPlatformFee + venueFee).toFixed(2);

  return {
    platformFee,
    venueFee,
    creditApplied,
    netPlatformFee,
    totalExecutionCharge,
    creditCoversAll: creditApplied >= platformFee,
  };
}

/**
 * Year-one projection used in the founder dashboard.
 * Uses the same platformFeeRate from FeeConfig — no separate coefficient.
 *
 * @param config        The fee configuration being evaluated.
 * @param inputs        Projection assumptions (traders, trades, costs…).
 * @param mode          ARITHMETIC_ONLY or DEMAND_SENSITIVE.
 * @param sensitivity   Only used when mode === DEMAND_SENSITIVE.
 * @param baseConfig    Required when mode === DEMAND_SENSITIVE — baseline for fee delta.
 */
export function calcProjection(
  config: FeeConfig,
  inputs: ProjectionInputs,
  mode: DemandMode,
  sensitivity: SensitivityLevel,
  baseConfig?: FeeConfig,
): ProjectionResult {
  const baseVolume = inputs.activeTraders * inputs.avgTradesPerYear * inputs.avgPositionValue;
  let effectiveVolume    = baseVolume;
  let volumeRetentionPct = 100;

  if (mode === 'DEMAND_SENSITIVE' && baseConfig) {
    const baseTotalRate = baseConfig.platformFeeRate + baseConfig.venueFeeRate;
    const newTotalRate  = config.platformFeeRate + config.venueFeeRate;
    if (baseTotalRate > 0) {
      const feeIncreasePct = ((newTotalRate - baseTotalRate) / baseTotalRate) * 100;
      const elasticity = ELASTICITY[sensitivity];
      const volumeDropPct = Math.max(0, feeIncreasePct * elasticity);
      volumeRetentionPct = Math.max(0, 100 - volumeDropPct);
      effectiveVolume = baseVolume * (volumeRetentionPct / 100);
    }
  }

  // Platform service revenue — venue fee is NOT retained by MochaTrade
  const grossServiceRevenue = +(effectiveVolume * config.platformFeeRate).toFixed(2);

  // Credits redeemed: one credit per completed crew per event, capped at creditCap
  const redeemedCredits = +(
    inputs.completedCrewsPerEvent * inputs.eventsPerYear * config.creditCap
  ).toFixed(2);

  const netServiceRevenue = +Math.max(0, grossServiceRevenue - redeemedCredits).toFixed(2);
  const operatingCost     = +(inputs.operatingCostPerMonth * 12).toFixed(2);
  const acquisitionCost   = +(inputs.newTradersPerYear * inputs.acquisitionCostPerTrader).toFixed(2);
  const contribution      = +(netServiceRevenue - operatingCost - acquisitionCost).toFixed(2);

  return {
    totalVolume:          +effectiveVolume.toFixed(2),
    grossServiceRevenue,
    redeemedCredits,
    netServiceRevenue,
    operatingCost,
    acquisitionCost,
    contribution,
    effectiveVolume:      +effectiveVolume.toFixed(2),
    volumeRetentionPct:   +volumeRetentionPct.toFixed(1),
  };
}

/**
 * Compares two saved plans and surfaces the breakeven condition.
 *
 * Breakeven volume retention = the % of baseline volume at which Plan B's
 * gross service revenue equals Plan A's gross service revenue.
 *
 * Derivation (gross revenue only):
 *   planA.rate × vol = planB.rate × vol × x/100
 *   x = (planA.rate / planB.rate) × 100
 *
 * Below this retention %, the higher fee loses its gross revenue advantage.
 * Full contribution comparison must account for credits and costs as well.
 */
export function comparePlans(planA: SavedPlan, planB: SavedPlan): PlanComparison {
  const contributionDelta = +(planB.projection.contribution - planA.projection.contribution).toFixed(2);
  const volumeDelta       = +(planB.projection.effectiveVolume - planA.projection.effectiveVolume).toFixed(2);
  const volumeDeltaPct    = planA.projection.effectiveVolume > 0
    ? +((volumeDelta / planA.projection.effectiveVolume) * 100).toFixed(1)
    : 0;

  const breakevenVolumeRetentionPct = planB.config.platformFeeRate > 0
    ? +((planA.config.platformFeeRate / planB.config.platformFeeRate) * 100).toFixed(1)
    : 100;

  return {
    planA,
    planB,
    contributionDelta,
    volumeDelta,
    volumeDeltaPct,
    breakevenVolumeRetentionPct,
    planBWinsOnContribution: contributionDelta > 0,
  };
}

/** Format a number as Indian Rupee (₹) with lakhs/crores labelling */
export function fmtINR(n: number): string {
  if (Math.abs(n) >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`;
  if (Math.abs(n) >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)}L`;
  if (Math.abs(n) >= 1_000)       return `₹${(n / 1_000).toFixed(2)}K`;
  return `₹${n.toFixed(2)}`;
}

export function fmtPct(n: number, dp = 3): string {
  return `${(n * 100).toFixed(dp)}%`;
}
