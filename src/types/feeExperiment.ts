// ─── Fee Experiment Types ─────────────────────────────────────────────────────
// Shared between FeeEngine (calculation) and FeeExperimentPanel (UI).
// The same engine produces both the customer-facing trade charge breakdown
// and the founder-facing year-one projection — ensuring no inconsistency.

export interface FeeConfig {
  /** MochaTrade service fee rate — e.g. 0.00020 = 0.020% */
  platformFeeRate: number;
  /** Assumed external venue execution fee — not a price MochaTrade freely sets */
  venueFeeRate: number;
  /** Illustrative executed position value for the trade preview */
  positionValue: number;
  /** Maximum credit a crew pass holder may apply per transaction (₹) */
  creditCap: number;
  /** Whether the user has toggled "Apply Market Night credit" */
  creditApplied: boolean;
}

/** Itemised breakdown shown in the customer trade preview */
export interface TradeChargeBreakdown {
  platformFee: number;          // positionValue × platformFeeRate
  venueFee: number;             // positionValue × venueFeeRate
  creditApplied: number;        // min(creditCap, platformFee) if toggle on, else 0
  netPlatformFee: number;       // platformFee − creditApplied
  totalExecutionCharge: number; // netPlatformFee + venueFee
  creditCoversAll: boolean;     // creditApplied >= platformFee
}

export type DemandMode = 'ARITHMETIC_ONLY' | 'DEMAND_SENSITIVE';
export type SensitivityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

/** Inputs for the year-one projection */
export interface ProjectionInputs {
  activeTraders: number;
  avgTradesPerYear: number;
  avgPositionValue: number;          // ₹
  completedCrewsPerEvent: number;
  eventsPerYear: number;
  operatingCostPerMonth: number;     // ₹
  acquisitionCostPerTrader: number;  // ₹ CAC (blended)
  newTradersPerYear: number;
}

/** Output of the year-one projection calculation */
export interface ProjectionResult {
  totalVolume: number;           // ₹ executed volume
  grossServiceRevenue: number;   // ₹  (platform fee only — venue charges not retained)
  redeemedCredits: number;       // ₹
  netServiceRevenue: number;     // ₹
  operatingCost: number;         // ₹
  acquisitionCost: number;       // ₹
  contribution: number;          // ₹ (can be negative)
  effectiveVolume: number;       // ₹ after demand adjustment
  volumeRetentionPct: number;    // 0–100
}

/** A saved pricing plan for A/B comparison */
export interface SavedPlan {
  id: 'A' | 'B';
  label: string;
  config: FeeConfig;
  projection: ProjectionResult;
  demandMode: DemandMode;
  sensitivity: SensitivityLevel;
}

/** Result of comparing Plan A vs Plan B */
export interface PlanComparison {
  planA: SavedPlan;
  planB: SavedPlan;
  contributionDelta: number;           // planB − planA
  volumeDelta: number;                 // ₹
  volumeDeltaPct: number;             // %
  breakevenVolumeRetentionPct: number; // vol% at which planB gross rev = planA gross rev
  planBWinsOnContribution: boolean;
}
