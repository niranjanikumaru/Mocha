/**
 * Market Night Trust & Growth Funnel Model Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Founder-Facing Model for Evaluating:
 *  1. Where Market Night and product trust interventions affect the customer journey.
 *  2. What those interventions cost across distinct, non-overlapping categories.
 *  3. Which behavioral improvements are assumptions vs observed evidence.
 *  4. Whether those improvements economically justify spending over 12 months.
 *
 * Core Principles:
 *  - Distinguishes event attendance, new prospects, onboarding, funding,
 *    first LIVE trade, and retained active traders. (Simulated != Live).
 *  - Retention is a cohort recurrence calculation over time.
 *  - Explicit, editable intervention hypotheses with 12-month rollout schedules.
 *  - NO all-purpose Trust Score.
 *  - NO automated pricing elasticity manipulation.
 *  - NO overlapping double-counted retention boosts between event demo and product capability.
 *  - Costs strictly separated into 6 distinct categories.
 *  - Provenance badges are descriptive only — changing a badge does not alter numbers.
 */

// ─── Core Types ───────────────────────────────────────────────────────────────

export type FunnelTargetParameter =
  | 'prospect_to_onboarded'    // Target: Unique prospects → Onboarded (KYC / verification)
  | 'onboarded_to_funded'      // Target: Onboarded → Funded (initial deposit)
  | 'funded_to_first_trade'    // Target: Funded → First LIVE trade (real-capital activation)
  | 'monthly_active_retention';// Target: Monthly active cohort retention rate

export type EvidenceStatus =
  | 'ASSUMED'
  | 'DEMO_OBSERVATION'
  | 'PILOT_OBSERVATION';

export interface EvidenceMetadata {
  status: EvidenceStatus;
  note: string;
  observationPeriod?: string;
  population?: string;
  metricDefinition?: string;
}

export interface RolloutConfig {
  /** 1-indexed month in which the intervention begins rollout (1..12) */
  launchMonth: number;
  /** Maximum operational coverage achieved after ramp [0..1] */
  targetCoverage: number;
  /**
   * Number of months over which coverage ramps linearly (>= 1).
   * - If rampDurationMonths = 1: launch month achieves full targetCoverage.
   * - If rampDurationMonths = R > 1: launch month has partial coverage:
   *   targetCoverage * (1 / R), ramping to targetCoverage at month (launchMonth + R - 1).
   */
  rampDurationMonths: number;
}

export interface TrustIntervention {
  /** Stable ID, e.g. 'TI-01' */
  id: string;
  name: string;
  /** Description of the uncertainty or hesitation addressed */
  description: string;
  /** Target funnel stage or retention parameter */
  target: FunnelTargetParameter;
  /** In-product mechanism delivering this capability during real live trading */
  productMechanism: string;
  /** Market Night's supporting role (inspection, hands-on preview, squad debrief) */
  marketNightRole: string;
  /** Rollout configuration */
  rollout: RolloutConfig;
  /**
   * Explicit monthly coverage schedule for 12 months (1-indexed month access).
   * Length is always 12, each element ∈ [0, 1].
   */
  coverageSchedule: number[];
  /** Signed assumed percentage point effect (e.g. +0.04 for +4pp, -0.02 for -2pp, 0 for 0pp) */
  assumedPercentagePointEffect: number;
  /** One-time setup / engineering / design cost incurred in launchMonth (USD) */
  setupCostUsd: number;
  /** Monthly delivery / maintenance / infrastructure cost during active months (USD) */
  monthlyMaintenanceCostUsd: number;
  /** Evidence status badge */
  evidenceStatus: EvidenceStatus;
  /** Human-readable explanation of provenance */
  evidenceNote: string;
  /** Detailed metadata required for DEMO_OBSERVATION and PILOT_OBSERVATION */
  evidenceMetadata?: EvidenceMetadata;
  /** Working demo route in the repository, if available */
  demoRoute?: string;
  /** Toggle switch to enable or disable this intervention */
  enabled: boolean;
}

// ─── Rollout Coverage Calculation ─────────────────────────────────────────────

/**
 * Derives a predictable 12-month coverage schedule [m_1, ..., m_12] from RolloutConfig.
 *
 * Exact logic:
 * - For month m < launchMonth:
 *     coverage(m) = 0.
 * - For month m >= launchMonth:
 *     If rampDurationMonths <= 1:
 *       coverage(m) = targetCoverage (full target coverage in launch month).
 *     If rampDurationMonths = R > 1:
 *       elapsed = m - launchMonth + 1 (1 in launch month).
 *       coverage(m) = targetCoverage * min(1, elapsed / R).
 *       Notice at m = launchMonth (elapsed = 1), coverage = targetCoverage * (1 / R) (partial coverage).
 *       Full target coverage is reached at month launchMonth + R - 1.
 * - All values clamped to [0, 1].
 */
export function deriveCoverageSchedule(rollout: RolloutConfig, totalMonths: number = 12): number[] {
  const schedule: number[] = [];
  const { launchMonth, targetCoverage, rampDurationMonths } = rollout;
  const clampedTarget = Math.max(0, Math.min(1, targetCoverage));
  const ramp = Math.max(1, Math.round(rampDurationMonths));

  for (let m = 1; m <= totalMonths; m++) {
    if (m < launchMonth) {
      schedule.push(0);
    } else {
      const elapsed = m - launchMonth + 1;
      const factor = Math.min(1, elapsed / ramp);
      const val = Math.round(clampedTarget * factor * 1000) / 1000;
      schedule.push(Math.max(0, Math.min(1, val)));
    }
  }
  return schedule;
}

// ─── Initial Trust Interventions ──────────────────────────────────────────────

export const INITIAL_TRUST_INTERVENTIONS: TrustIntervention[] = [
  {
    id: 'TI-01',
    name: 'Funding and withdrawal clarity',
    description:
      'Addresses deposit lock-in anxiety and fear of opaque withdrawal fees/processing delays before commitment.',
    target: 'onboarded_to_funded',
    productMechanism:
      'Explain transparent costs, pending funds lifecycle, fee deductions, regulatory reserve conditions, and expected processing times before and during deposit flow.',
    marketNightRole:
      'Squad orientation walkthrough of account funding terms and deposit clearing guarantees in zero-stakes simulator.',
    rollout: {
      launchMonth: 2,
      targetCoverage: 0.85,
      rampDurationMonths: 2,
    },
    coverageSchedule: deriveCoverageSchedule({
      launchMonth: 2,
      targetCoverage: 0.85,
      rampDurationMonths: 2,
    }),
    assumedPercentagePointEffect: 0.04, // +4 percentage points
    setupCostUsd: 1200,
    monthlyMaintenanceCostUsd: 150,
    evidenceStatus: 'ASSUMED',
    evidenceNote:
      'Sample assumption: Clear deposit terms reduce hesitation at the payment step; explicit withdrawal conditions may also cause selective opt-out.',
    demoRoute: '/proof/terminal',
    enabled: true,
  },
  {
    id: 'TI-02',
    name: 'Fee and exposure preview',
    description:
      'Addresses retail fear of unexpected transaction slippage, hidden spread cuts, and catastrophic adverse move liquidation.',
    target: 'funded_to_first_trade',
    productMechanism:
      'Show exact notional exposure, itemised exchange/brokerage charges, and adverse-move loss examples (-5%, -10%, -20%) prior to order approval.',
    marketNightRole:
      'Squads test simulated shock scenarios (-9.2% to -20%) and review fee breakdowns together in EventWorkspaceScreen before risking live capital.',
    rollout: {
      launchMonth: 1,
      targetCoverage: 0.90,
      rampDurationMonths: 1, // Full target coverage in launch month
    },
    coverageSchedule: deriveCoverageSchedule({
      launchMonth: 1,
      targetCoverage: 0.90,
      rampDurationMonths: 1,
    }),
    assumedPercentagePointEffect: 0.05, // +5 percentage points
    setupCostUsd: 800,
    monthlyMaintenanceCostUsd: 100,
    evidenceStatus: 'DEMO_OBSERVATION',
    evidenceNote:
      'PreTradeExplainer modal in /proof/terminal demonstrates 100% itemised cost clarity; live conversion uplift is assumed pending production pilot telemetry.',
    evidenceMetadata: {
      status: 'DEMO_OBSERVATION',
      note: 'PreTradeExplainer component implemented in test harness with adverse shock calculations.',
      observationPeriod: 'Prototype benchmark suite',
      population: 'Synthetic test scenarios (AERO-PERP, NVDA-PERP)',
      metricDefinition: 'Pre-trade summary display time < 5ms with exact itemised fee breakdown.',
    },
    demoRoute: '/proof/terminal',
    enabled: true,
  },
  {
    id: 'TI-03',
    name: 'Transaction tracking and recovery',
    description:
      'Addresses trust destruction caused by dropped ACKs, unresolved pending states, and accidental duplicate submissions.',
    target: 'monthly_active_retention',
    productMechanism:
      'Show verified order states, automatically detect lost ACKs into ACK_LOST_PENDING_RECON, reconcile within 80ms via simulated venue, and provide dispute-grade audit receipts.',
    marketNightRole:
      'Host demonstrates network drop / order recovery scenario live so attendees witness deterministic resolution without ghost fills.',
    rollout: {
      launchMonth: 3,
      targetCoverage: 0.80,
      rampDurationMonths: 2,
    },
    coverageSchedule: deriveCoverageSchedule({
      launchMonth: 3,
      targetCoverage: 0.80,
      rampDurationMonths: 2,
    }),
    assumedPercentagePointEffect: 0.03, // +3 percentage points
    setupCostUsd: 2500,
    monthlyMaintenanceCostUsd: 250,
    evidenceStatus: 'DEMO_OBSERVATION',
    evidenceNote:
      'TransactionRecoveryPanel reconciles simulated dropped ACKs within ~80ms in test environment; real cohort retention impact is assumed pending production telemetry.',
    evidenceMetadata: {
      status: 'DEMO_OBSERVATION',
      note: 'Venue simulator handles ACK_LOST_PENDING_RECON with zero duplicate fills.',
      observationPeriod: 'Prototype test harness',
      population: 'Simulated network disconnect runs',
      metricDefinition: 'Sub-100ms reconciliation with idempotency key deduplication.',
    },
    demoRoute: '/proof/terminal',
    enabled: true,
  },
];

// ─── Funnel Rate Computation with Explicit Combination Rule ───────────────────

export interface RateCalculationDetail {
  effectiveRate: number;
  baseRate: number;
  totalPercentagePointEffect: number;
  activeInterventions: {
    id: string;
    name: string;
    coverage: number;
    effectContribution: number;
  }[];
  warning?: string;
}

/**
 * Computes the effective conversion or retention rate for month m (1-indexed).
 *
 * Single intervention formula:
 *   effectiveRate(m) = clamp(baseRate + coverage(m) * assumedPercentagePointEffect, 0, 1)
 *
 * Multiple interventions targeting the same parameter:
 *   Combination rule: ADDITIVE_CLAMPED.
 *   effectiveRate(m) = clamp(baseRate + sum_i(coverage_i(m) * effect_i), 0, 1)
 *   Explicit warning is attached if > 1 active interventions target the same parameter.
 */
export function computeEffectiveFunnelRate(
  baseRate: number,
  target: FunnelTargetParameter,
  interventions: TrustIntervention[],
  month: number // 1..12
): RateCalculationDetail {
  const active = interventions.filter(
    (i) => i.enabled && i.target === target && (i.coverageSchedule[month - 1] ?? 0) > 0
  );

  if (active.length === 0) {
    return {
      effectiveRate: Math.max(0, Math.min(1, baseRate)),
      baseRate,
      totalPercentagePointEffect: 0,
      activeInterventions: [],
    };
  }

  let totalPercentagePointEffect = 0;
  const activeDetails = active.map((i) => {
    const cov = i.coverageSchedule[month - 1] ?? 0;
    const effectContribution = cov * i.assumedPercentagePointEffect;
    totalPercentagePointEffect += effectContribution;
    return {
      id: i.id,
      name: i.name,
      coverage: cov,
      effectContribution,
    };
  });

  const effectiveRate = Math.max(0, Math.min(1, baseRate + totalPercentagePointEffect));
  let warning: string | undefined;

  if (active.length > 1) {
    const names = active.map((a) => `"${a.name}"`).join(', ');
    warning = `Warning: ${active.length} interventions (${names}) target '${target}' in month ${month}. Effects are combined additively and clamped to [0, 1]. Verify that behavioral assumptions do not double-count overlapping user intent.`;
  }

  return {
    effectiveRate,
    baseRate,
    totalPercentagePointEffect,
    activeInterventions: activeDetails,
    warning,
  };
}

// ─── Cost Breakdown Model ─────────────────────────────────────────────────────

export interface MonthlyCostBreakdown {
  /** Cost for venue, audio/video, host and moderation per Market Night event */
  marketNightHostingCost: number;
  /**
   * Attendance benefits (toolkit, replay, exclusive scenario) awarded upon crew qualification.
   * Awarded upon attendance/qualification; does NOT require a deposit or live trade.
   * Uses 4-person crew policy consistently.
   */
  attendanceBenefitsCost: number;
  /** One-time setup/engineering costs for interventions launching in this month */
  productInterventionSetupCost: number;
  /** Ongoing maintenance and delivery costs for active interventions in this month */
  productInterventionMaintenanceCost: number;
  /** Paid acquisition marketing spend */
  paidAcquisitionCost: number;
  /** Customer support and operational costs */
  otherOperatingCosts: number;
  /** Total sum across all 6 non-overlapping categories */
  totalMonthlyCost: number;
}

// ─── Monthly Snapshot & Model Structures ──────────────────────────────────────

export interface TrustFunnelMonthlySnapshot {
  month: number;

  // ── Step 0: Event Attendance vs Prospects ─────────────────────────────────
  /** Total attendees at Market Night events this month (crews * 4 members) */
  eventAttendees: number;
  /** Number of qualified 4-person crews */
  qualifiedCrews: number;

  // ── Step 1: Unique New Prospects Entering the Funnel ─────────────────────
  /** Genuinely new prospects from Market Night (not existing platform users) */
  marketNightNewProspects: number;
  /** Prospects acquired via paid marketing */
  paidNewProspects: number;
  /** Organic prospects */
  organicNewProspects: number;
  /** Referral prospects from viral loop */
  referralNewProspects: number;
  /** Total unique new prospects entering the acquisition funnel */
  uniqueNewProspects: number;

  // ── Step 2: Product Onboarding (KYC / Account Verification) ───────────────
  effectiveOnboardingRate: number;
  onboardedTraders: number;

  // ── Step 3: Funding (Initial Real-Money Deposit) ───────────────────────────
  effectiveFundingRate: number;
  fundedTraders: number;

  // ── Step 4: First LIVE Trade Activation (NOT Simulated) ───────────────────
  effectiveFirstLiveTradeRate: number;
  firstLiveTraders: number;

  // ── Step 5: Cohort Retention Over Time (Stock) ────────────────────────────
  effectiveRetentionRate: number;
  retainedFromPriorMonth: number;
  activeTraders: number;

  // ── Step 6: Economics & Revenue ───────────────────────────────────────────
  tradingVolumeUsd: number;
  tradingRevenueUsd: number;
  fxRevenueUsd: number;
  totalRevenueUsd: number;

  // ── Step 7: Costs Separated into 6 Non-Overlapping Categories ────────────
  costs: MonthlyCostBreakdown;
  contributionUsd: number;
  cumulativeContributionUsd: number;

  // ── Active Warnings ───────────────────────────────────────────────────────
  warnings: string[];
}

export interface TrustFunnelModelInputs {
  // Channel & Event parameters
  channel: {
    paidBudgetUsd: number;
    paidCostPerProspect: number;
    crewEventsPerMonth: number;
    /** Optional 12-month array of Market Night events per month [m1, m2, ..., m12] */
    monthlyEventsSchedule?: number[];
    crewsPerEvent: number;
    crewMembersPerCrew: number;      // always 4
    crewJoinRate: number;            // fraction of attendees who register (0..1)
    crewNewPlatformShare: number;    // fraction of joiners who are genuinely new (0..1)
    crewQualificationRate: number;   // fraction of crews where all 4 members complete (0..1)
    organicBaseMonthly: number;
    organicGrowthRate: number;
    invitesPerActiveUser: number;
    inviteConversionRate: number;
  };

  // Base Funnel Rates (before intervention effects)
  baseFunnel: {
    prospectToOnboardedRate: number; // default e.g. 0.70
    onboardedToFundedRate: number;   // default e.g. 0.40
    fundedToFirstTradeRate: number;  // default e.g. 0.50
    monthlyActiveRetentionRate: number; // default e.g. 0.75
  };

  // Trading & Monetization parameters
  trading: {
    takerFeeBps: number;             // e.g. 5 bps
    baseMonthlyVolumePerTraderUsd: number; // e.g. $10,000
    avgInitialDepositUsd: number;    // e.g. $500
    fxSpreadPct: number;             // e.g. 0.5%
  };

  // Operational & Event Costs
  costs: {
    hostingCostPerEventUsd: number;       // venue, moderation, host
    attendanceBenefitCostPerCrewUsd: number; // toolkit, replay, scenario per qualified crew
    supportTicketRatePerActivePerMonth: number;
    supportCostPerTicketUsd: number;
  };

  // Interventions List
  interventions: TrustIntervention[];

  // Duration
  projectionMonths: number; // default 12
}

export interface InterventionRoiSummary {
  interventionId: string;
  name: string;
  target: FunnelTargetParameter;
  totalSetupCostUsd: number;
  totalMaintenanceCostUsd: number;
  totalCostUsd: number;
  launchMonth: number;
  targetCoverage: number;
  assumedEffectPp: number;
}

export interface TrustFunnelModelOutput {
  snapshots: TrustFunnelMonthlySnapshot[];
  summary: {
    totalEventAttendees12m: number;
    totalUniqueProspects12m: number;
    totalOnboarded12m: number;
    totalFunded12m: number;
    totalFirstLiveTraders12m: number;
    peakActiveTraders: number;
    endingActiveTraders: number;
    totalVolumeUsd12m: number;
    totalRevenueUsd12m: number;
    totalCostUsd12m: number;
    costBreakdown12m: MonthlyCostBreakdown;
    netContributionUsd12m: number;
    breakevenMonth: number | null;
  };
  interventionRoi: InterventionRoiSummary[];
  allWarnings: string[];
}

// ─── Default Founder Inputs ───────────────────────────────────────────────────

export const DEFAULT_TRUST_FUNNEL_INPUTS: TrustFunnelModelInputs = {
  channel: {
    paidBudgetUsd: 3000,
    paidCostPerProspect: 15, // $15 per prospect
    crewEventsPerMonth: 4,
    crewsPerEvent: 4,        // 4 squads = 16 attendees per event
    crewMembersPerCrew: 4,   // 4-person crew policy
    crewJoinRate: 0.85,      // 85% register
    crewNewPlatformShare: 0.70, // 70% are genuinely new prospects
    crewQualificationRate: 0.65, // 65% crews qualify for attendance benefits
    organicBaseMonthly: 100,
    organicGrowthRate: 0.05,
    invitesPerActiveUser: 0.3,
    inviteConversionRate: 0.2, // K = 0.06 < 1 (sustainable)
  },
  baseFunnel: {
    prospectToOnboardedRate: 0.70,
    onboardedToFundedRate: 0.40,
    fundedToFirstTradeRate: 0.50,
    monthlyActiveRetentionRate: 0.75,
  },
  trading: {
    takerFeeBps: 5,
    baseMonthlyVolumePerTraderUsd: 10000,
    avgInitialDepositUsd: 500,
    fxSpreadPct: 0.5,
  },
  costs: {
    hostingCostPerEventUsd: 100,
    attendanceBenefitCostPerCrewUsd: 15, // $15 per qualified crew (4 members)
    supportTicketRatePerActivePerMonth: 0.08,
    supportCostPerTicketUsd: 12,
  },
  interventions: INITIAL_TRUST_INTERVENTIONS,
  projectionMonths: 12,
};

// ─── Model Execution Engine ───────────────────────────────────────────────────

/**
 * Runs the 12-month Market Night Trust & Growth Funnel simulation.
 * Pure TypeScript, deterministic, zero side-effects.
 */
export function runTrustFunnelModel(inputs: TrustFunnelModelInputs = DEFAULT_TRUST_FUNNEL_INPUTS): TrustFunnelModelOutput {
  const {
    channel, baseFunnel, trading, costs,
    interventions, projectionMonths = 12,
  } = inputs;

  const snapshots: TrustFunnelMonthlySnapshot[] = [];
  const allWarnings: string[] = [];

  // Referral viral coefficient K
  const K = channel.invitesPerActiveUser * channel.inviteConversionRate;
  if (K >= 1) {
    allWarnings.push(
      `Warning: Referral K-factor (${K.toFixed(2)}) >= 1.0 implies unbounded organic viral expansion. Capping monthly referral inflow.`
    );
  }

  let priorActiveTraders = 0;
  let cumulativeContribution = 0;
  let breakevenMonth: number | null = null;

  for (let m = 1; m <= projectionMonths; m++) {
    const monthWarnings: string[] = [];

    // ── Step 0: Event Attendance ─────────────────────────────────────────────
    const monthlyEvents = channel.monthlyEventsSchedule
      ? (channel.monthlyEventsSchedule[m - 1] ?? channel.crewEventsPerMonth)
      : channel.crewEventsPerMonth;
    const crewsCount = monthlyEvents * channel.crewsPerEvent;
    const eventAttendees = crewsCount * channel.crewMembersPerCrew; // exactly 4 per crew
    const qualifiedCrews = Math.round(crewsCount * channel.crewQualificationRate);

    // ── Step 1: Unique New Prospects Entering Funnel ─────────────────────────
    // Genuinely new prospects from Market Night:
    const marketNightNewProspects =
      eventAttendees * channel.crewJoinRate * channel.crewNewPlatformShare;

    // Paid channel prospects:
    const paidNewProspects = channel.paidCostPerProspect > 0
      ? channel.paidBudgetUsd / channel.paidCostPerProspect
      : 0;

    // Organic prospects:
    const organicNewProspects =
      channel.organicBaseMonthly * Math.pow(1 + channel.organicGrowthRate, m - 1);

    // Referral prospects:
    const referralNewProspects = Math.min(
      K * priorActiveTraders,
      priorActiveTraders * 0.5
    );

    const uniqueNewProspects =
      marketNightNewProspects + paidNewProspects + organicNewProspects + referralNewProspects;

    // ── Step 2: Product Onboarding (KYC) ─────────────────────────────────────
    const onboardingDetail = computeEffectiveFunnelRate(
      baseFunnel.prospectToOnboardedRate,
      'prospect_to_onboarded',
      interventions,
      m
    );
    if (onboardingDetail.warning) monthWarnings.push(onboardingDetail.warning);
    const effectiveOnboardingRate = onboardingDetail.effectiveRate;
    const onboardedTraders = uniqueNewProspects * effectiveOnboardingRate;

    // ── Step 3: Funding (Deposit) ─────────────────────────────────────────────
    const fundingDetail = computeEffectiveFunnelRate(
      baseFunnel.onboardedToFundedRate,
      'onboarded_to_funded',
      interventions,
      m
    );
    if (fundingDetail.warning) monthWarnings.push(fundingDetail.warning);
    const effectiveFundingRate = fundingDetail.effectiveRate;
    const fundedTraders = onboardedTraders * effectiveFundingRate;

    // ── Step 4: First LIVE Trade Activation (NOT Simulated) ───────────────────
    const tradeDetail = computeEffectiveFunnelRate(
      baseFunnel.fundedToFirstTradeRate,
      'funded_to_first_trade',
      interventions,
      m
    );
    if (tradeDetail.warning) monthWarnings.push(tradeDetail.warning);
    const effectiveFirstLiveTradeRate = tradeDetail.effectiveRate;
    const firstLiveTraders = fundedTraders * effectiveFirstLiveTradeRate;

    // ── Step 5: Cohort Retention Over Time (Stock Recurrence) ─────────────────
    const retentionDetail = computeEffectiveFunnelRate(
      baseFunnel.monthlyActiveRetentionRate,
      'monthly_active_retention',
      interventions,
      m
    );
    if (retentionDetail.warning) monthWarnings.push(retentionDetail.warning);
    const effectiveRetentionRate = retentionDetail.effectiveRate;
    const retainedFromPriorMonth = priorActiveTraders * effectiveRetentionRate;
    const activeTraders = retainedFromPriorMonth + firstLiveTraders;

    // Update prior for next month
    priorActiveTraders = activeTraders;

    // ── Step 6: Trading Volume & Revenue ─────────────────────────────────────
    const tradingVolumeUsd = activeTraders * trading.baseMonthlyVolumePerTraderUsd;
    const tradingRevenueUsd = tradingVolumeUsd * (trading.takerFeeBps / 10000);
    const fxRevenueUsd = fundedTraders * trading.avgInitialDepositUsd * (trading.fxSpreadPct / 100);
    const totalRevenueUsd = tradingRevenueUsd + fxRevenueUsd;

    // ── Step 7: Costs Separated into 6 Non-Overlapping Categories ────────────
    // 1. Hosting / Moderation:
    const marketNightHostingCost = monthlyEvents * costs.hostingCostPerEventUsd;

    // 2. Attendance Benefits (awarded on qualification, NO deposit/trade required):
    const attendanceBenefitsCost = qualifiedCrews * costs.attendanceBenefitCostPerCrewUsd;

    // 3. Product Intervention Setup Cost (incurred only in intervention launchMonth):
    let productInterventionSetupCost = 0;
    // 4. Product Intervention Maintenance Cost (incurred only when active):
    let productInterventionMaintenanceCost = 0;

    for (const intervention of interventions) {
      if (!intervention.enabled) continue;
      // Setup cost in launch month only:
      if (m === intervention.rollout.launchMonth) {
        productInterventionSetupCost += intervention.setupCostUsd;
      }
      // Ongoing maintenance during active months:
      if (m >= intervention.rollout.launchMonth) {
        productInterventionMaintenanceCost += intervention.monthlyMaintenanceCostUsd;
      }
    }

    // 5. Paid Acquisition Cost:
    const paidAcquisitionCost = channel.paidBudgetUsd;

    // 6. Other Operating Costs (Customer Support):
    const otherOperatingCosts =
      activeTraders * costs.supportTicketRatePerActivePerMonth * costs.supportCostPerTicketUsd;

    const totalMonthlyCost =
      marketNightHostingCost +
      attendanceBenefitsCost +
      productInterventionSetupCost +
      productInterventionMaintenanceCost +
      paidAcquisitionCost +
      otherOperatingCosts;

    const contributionUsd = totalRevenueUsd - totalMonthlyCost;
    cumulativeContribution += contributionUsd;

    if (!breakevenMonth && cumulativeContribution >= 0) {
      breakevenMonth = m;
    }

    for (const w of monthWarnings) {
      if (!allWarnings.includes(w)) allWarnings.push(w);
    }

    snapshots.push({
      month: m,
      eventAttendees: Math.round(eventAttendees),
      qualifiedCrews,
      marketNightNewProspects: Math.round(marketNightNewProspects),
      paidNewProspects: Math.round(paidNewProspects),
      organicNewProspects: Math.round(organicNewProspects),
      referralNewProspects: Math.round(referralNewProspects),
      uniqueNewProspects: Math.round(uniqueNewProspects),
      effectiveOnboardingRate,
      onboardedTraders: Math.round(onboardedTraders),
      effectiveFundingRate,
      fundedTraders: Math.round(fundedTraders),
      effectiveFirstLiveTradeRate,
      firstLiveTraders: Math.round(firstLiveTraders),
      effectiveRetentionRate,
      retainedFromPriorMonth: Math.round(retainedFromPriorMonth),
      activeTraders: Math.round(activeTraders),
      tradingVolumeUsd: Math.round(tradingVolumeUsd),
      tradingRevenueUsd: Math.round(tradingRevenueUsd * 100) / 100,
      fxRevenueUsd: Math.round(fxRevenueUsd * 100) / 100,
      totalRevenueUsd: Math.round(totalRevenueUsd * 100) / 100,
      costs: {
        marketNightHostingCost: Math.round(marketNightHostingCost),
        attendanceBenefitsCost: Math.round(attendanceBenefitsCost),
        productInterventionSetupCost: Math.round(productInterventionSetupCost),
        productInterventionMaintenanceCost: Math.round(productInterventionMaintenanceCost),
        paidAcquisitionCost: Math.round(paidAcquisitionCost),
        otherOperatingCosts: Math.round(otherOperatingCosts * 100) / 100,
        totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
      },
      contributionUsd: Math.round(contributionUsd * 100) / 100,
      cumulativeContributionUsd: Math.round(cumulativeContribution * 100) / 100,
      warnings: monthWarnings,
    });
  }

  // ── 12-Month Totals & Aggregations ──────────────────────────────────────────
  const costBreakdown12m: MonthlyCostBreakdown = {
    marketNightHostingCost: snapshots.reduce((s, m) => s + m.costs.marketNightHostingCost, 0),
    attendanceBenefitsCost: snapshots.reduce((s, m) => s + m.costs.attendanceBenefitsCost, 0),
    productInterventionSetupCost: snapshots.reduce((s, m) => s + m.costs.productInterventionSetupCost, 0),
    productInterventionMaintenanceCost: snapshots.reduce((s, m) => s + m.costs.productInterventionMaintenanceCost, 0),
    paidAcquisitionCost: snapshots.reduce((s, m) => s + m.costs.paidAcquisitionCost, 0),
    otherOperatingCosts: Math.round(snapshots.reduce((s, m) => s + m.costs.otherOperatingCosts, 0) * 100) / 100,
    totalMonthlyCost: Math.round(snapshots.reduce((s, m) => s + m.costs.totalMonthlyCost, 0) * 100) / 100,
  };

  const interventionRoi: InterventionRoiSummary[] = interventions.map((i) => {
    const activeMonths = Math.max(0, projectionMonths - i.rollout.launchMonth + 1);
    const totalSetup = i.enabled ? i.setupCostUsd : 0;
    const totalMaint = i.enabled ? i.monthlyMaintenanceCostUsd * activeMonths : 0;
    return {
      interventionId: i.id,
      name: i.name,
      target: i.target,
      totalSetupCostUsd: totalSetup,
      totalMaintenanceCostUsd: totalMaint,
      totalCostUsd: totalSetup + totalMaint,
      launchMonth: i.rollout.launchMonth,
      targetCoverage: i.rollout.targetCoverage,
      assumedEffectPp: i.assumedPercentagePointEffect,
    };
  });

  return {
    snapshots,
    summary: {
      totalEventAttendees12m: snapshots.reduce((s, m) => s + m.eventAttendees, 0),
      totalUniqueProspects12m: snapshots.reduce((s, m) => s + m.uniqueNewProspects, 0),
      totalOnboarded12m: snapshots.reduce((s, m) => s + m.onboardedTraders, 0),
      totalFunded12m: snapshots.reduce((s, m) => s + m.fundedTraders, 0),
      totalFirstLiveTraders12m: snapshots.reduce((s, m) => s + m.firstLiveTraders, 0),
      peakActiveTraders: Math.max(...snapshots.map((m) => m.activeTraders)),
      endingActiveTraders: snapshots[snapshots.length - 1]?.activeTraders ?? 0,
      totalVolumeUsd12m: snapshots.reduce((s, m) => s + m.tradingVolumeUsd, 0),
      totalRevenueUsd12m: Math.round(snapshots.reduce((s, m) => s + m.totalRevenueUsd, 0) * 100) / 100,
      totalCostUsd12m: costBreakdown12m.totalMonthlyCost,
      costBreakdown12m,
      netContributionUsd12m: Math.round(snapshots.reduce((s, m) => s + m.contributionUsd, 0) * 100) / 100,
      breakevenMonth,
    },
    interventionRoi,
    allWarnings,
  };
}

// ─── Scenario Comparison Helper for Founders ──────────────────────────────────

export interface ScenarioInterventionComparison {
  baselineWithoutInterventions: TrustFunnelModelOutput;
  withInterventions: TrustFunnelModelOutput;
  incrementalFirstLiveTraders: number;
  incrementalEndingActiveTraders: number;
  incrementalRevenueUsd: number;
  totalInterventionCostsUsd: number;
  netIncrementalBenefitUsd: number;
  justifiesSpendingOver12Months: boolean;
}

/**
 * Compares a scenario with interventions enabled vs disabled.
 * Answers the key founder question:
 * "Do the assumed improvements justify the setup and maintenance costs over twelve months?"
 */
export function compareInterventionImpact(inputs: TrustFunnelModelInputs): ScenarioInterventionComparison {
  // Scenario A: Without interventions (all disabled)
  const inputsWithout: TrustFunnelModelInputs = {
    ...inputs,
    interventions: inputs.interventions.map((i) => ({ ...i, enabled: false })),
  };
  const baselineWithoutInterventions = runTrustFunnelModel(inputsWithout);

  // Scenario B: With current interventions
  const withInterventions = runTrustFunnelModel(inputs);

  const baseSummary = baselineWithoutInterventions.summary;
  const withSummary = withInterventions.summary;

  const incrementalFirstLiveTraders =
    withSummary.totalFirstLiveTraders12m - baseSummary.totalFirstLiveTraders12m;
  const incrementalEndingActiveTraders =
    withSummary.endingActiveTraders - baseSummary.endingActiveTraders;
  const incrementalRevenueUsd =
    Math.round((withSummary.totalRevenueUsd12m - baseSummary.totalRevenueUsd12m) * 100) / 100;

  const totalInterventionCostsUsd =
    withSummary.costBreakdown12m.productInterventionSetupCost +
    withSummary.costBreakdown12m.productInterventionMaintenanceCost;

  const netIncrementalBenefitUsd =
    Math.round((withSummary.netContributionUsd12m - baseSummary.netContributionUsd12m) * 100) / 100;

  const justifiesSpendingOver12Months = netIncrementalBenefitUsd > 0;

  return {
    baselineWithoutInterventions,
    withInterventions,
    incrementalFirstLiveTraders,
    incrementalEndingActiveTraders,
    incrementalRevenueUsd,
    totalInterventionCostsUsd,
    netIncrementalBenefitUsd,
    justifiesSpendingOver12Months,
  };
}

// ─── Preset Founder Scenarios ─────────────────────────────────────────────────

export interface FounderFunnelScenario {
  id: string;
  name: string;
  badge: string;
  description: string;
  inputs: TrustFunnelModelInputs;
}

export const FOUNDER_FUNNEL_SCENARIOS: FounderFunnelScenario[] = [
  {
    id: 'founder_recommended',
    name: 'Recommended: Market Night + Trust Interventions',
    badge: 'RECOMMENDED',
    description:
      'Market Night (4 events/mo) combined with all 3 progressive trust interventions rolling out across months 1-3. Tests positive adoption assumptions.',
    inputs: DEFAULT_TRUST_FUNNEL_INPUTS,
  },
  {
    id: 'founder_market_night_only',
    name: 'Market Night Only (No Product Trust Interventions)',
    badge: 'EVENT ONLY',
    description:
      'Market Night community channel is active, but zero in-product trust mechanisms are launched. Demonstrates customer drop-off when live product lacks the transparency seen at events.',
    inputs: {
      ...DEFAULT_TRUST_FUNNEL_INPUTS,
      interventions: DEFAULT_TRUST_FUNNEL_INPUTS.interventions.map((i) => ({
        ...i,
        enabled: false,
      })),
    },
  },
  {
    id: 'founder_paid_baseline',
    name: 'Status Quo: Paid Marketing Only (No Market Night, No Trust)',
    badge: 'STATUS QUO',
    description:
      'All acquisition is paid ads and cold organic traffic. Zero Market Night events and zero trust interventions. Baseline for measuring incremental ROI.',
    inputs: {
      ...DEFAULT_TRUST_FUNNEL_INPUTS,
      channel: {
        ...DEFAULT_TRUST_FUNNEL_INPUTS.channel,
        crewEventsPerMonth: 0,
        paidBudgetUsd: 5000,
      },
      interventions: DEFAULT_TRUST_FUNNEL_INPUTS.interventions.map((i) => ({
        ...i,
        enabled: false,
      })),
    },
  },
  {
    id: 'founder_pessimistic_shock',
    name: 'Stress Test: Friction & Selective Drop-off',
    badge: 'HONEST STRESS',
    description:
      'Tests negative/zero effects: fee preview deters users (-2pp), deposit clarity reveals minimum balance friction (-1pp), and transaction recovery yields 0pp. Tests whether spending is justified under pessimistic behavioral response.',
    inputs: {
      ...DEFAULT_TRUST_FUNNEL_INPUTS,
      channel: {
        ...DEFAULT_TRUST_FUNNEL_INPUTS.channel,
        crewJoinRate: 0.50,
        crewQualificationRate: 0.40,
      },
      interventions: DEFAULT_TRUST_FUNNEL_INPUTS.interventions.map((i) => {
        if (i.id === 'TI-01') return { ...i, assumedPercentagePointEffect: -0.01 }; // -1pp
        if (i.id === 'TI-02') return { ...i, assumedPercentagePointEffect: -0.02 }; // -2pp
        if (i.id === 'TI-03') return { ...i, assumedPercentagePointEffect: 0.00 };  // 0pp
        return i;
      }),
    },
  },
];

// ─── Dual Comparison for Interventions (Zero Benefit vs Not Implemented) ──────

export interface InterventionDualComparison {
  interventionId: string;
  name: string;
  currentEffectPp: number;
  currentSetupCost: number;
  currentMaintenanceCost12m: number;
  totalInterventionCost: number;

  // Option A: Delivered, but zero behavioural benefit (costs preserved)
  zeroBenefit: {
    contributionDeltaUsd: number;
    firstTradersDelta: number;
    activeTradersDelta: number;
    revenueDeltaUsd: number;
    costDeltaUsd: number;
  };

  // Option B: Not implemented (removes effect AND avoids costs)
  notImplemented: {
    contributionDeltaUsd: number;
    firstTradersDelta: number;
    activeTradersDelta: number;
    revenueDeltaUsd: number;
    costDeltaUsd: number;
  };
}

/**
 * Computes both comparisons for a specific intervention:
 *  A. Delivered, but zero behavioural benefit (tests: "the idea did not improve retention")
 *  B. Not implemented (tests: "we did not spend money implementing it")
 */
export function computeInterventionDualComparison(
  inputs: TrustFunnelModelInputs,
  interventionId: string
): InterventionDualComparison | null {
  const target = inputs.interventions.find((i) => i.id === interventionId);
  if (!target) return null;

  const currentRun = runTrustFunnelModel(inputs);
  const curSummary = currentRun.summary;

  // Run A: Zero benefit (effect = 0, costs preserved)
  const zeroInputs: TrustFunnelModelInputs = {
    ...inputs,
    interventions: inputs.interventions.map((i) =>
      i.id === interventionId ? { ...i, assumedPercentagePointEffect: 0.00 } : i
    ),
  };
  const zeroRun = runTrustFunnelModel(zeroInputs);
  const zeroSummary = zeroRun.summary;

  // Run B: Not implemented (enabled = false, costs avoided)
  const notImplInputs: TrustFunnelModelInputs = {
    ...inputs,
    interventions: inputs.interventions.map((i) =>
      i.id === interventionId ? { ...i, enabled: false } : i
    ),
  };
  const notImplRun = runTrustFunnelModel(notImplInputs);
  const notImplSummary = notImplRun.summary;

  const activeMonths = Math.max(0, 12 - target.rollout.launchMonth + 1);
  const setupCost = target.setupCostUsd;
  const maintCost = target.monthlyMaintenanceCostUsd * activeMonths;

  return {
    interventionId,
    name: target.name,
    currentEffectPp: target.assumedPercentagePointEffect,
    currentSetupCost: setupCost,
    currentMaintenanceCost12m: maintCost,
    totalInterventionCost: setupCost + maintCost,
    zeroBenefit: {
      contributionDeltaUsd: Math.round((zeroSummary.netContributionUsd12m - curSummary.netContributionUsd12m) * 100) / 100,
      firstTradersDelta: zeroSummary.totalFirstLiveTraders12m - curSummary.totalFirstLiveTraders12m,
      activeTradersDelta: zeroSummary.endingActiveTraders - curSummary.endingActiveTraders,
      revenueDeltaUsd: Math.round((zeroSummary.totalRevenueUsd12m - curSummary.totalRevenueUsd12m) * 100) / 100,
      costDeltaUsd: Math.round((zeroSummary.totalCostUsd12m - curSummary.totalCostUsd12m) * 100) / 100,
    },
    notImplemented: {
      contributionDeltaUsd: Math.round((notImplSummary.netContributionUsd12m - curSummary.netContributionUsd12m) * 100) / 100,
      firstTradersDelta: notImplSummary.totalFirstLiveTraders12m - curSummary.totalFirstLiveTraders12m,
      activeTradersDelta: notImplSummary.endingActiveTraders - curSummary.endingActiveTraders,
      revenueDeltaUsd: Math.round((notImplSummary.totalRevenueUsd12m - curSummary.totalRevenueUsd12m) * 100) / 100,
      costDeltaUsd: Math.round((notImplSummary.totalCostUsd12m - curSummary.totalCostUsd12m) * 100) / 100,
    },
  };
}

// ─── Break-Even Effect Threshold Search ───────────────────────────────────────

export interface BreakEvenSearchResult {
  interventionId: string;
  found: boolean;
  breakEvenEffectPp: number | null;
  minBoundPp: number;
  maxBoundPp: number;
  message: string;
}

/**
 * Searches for the minimum assumed percentage point effect required for an
 * intervention to break even against its implementation and maintenance costs.
 *
 * Searches bounded range [minBound, maxBound] in steps of 0.001 (0.1pp).
 * Returns null if no solution exists in this range.
 */
export function findBreakEvenEffect(
  inputs: TrustFunnelModelInputs,
  interventionId: string,
  minBound: number = -0.05,
  maxBound: number = 0.20,
  step: number = 0.001
): BreakEvenSearchResult {
  const target = inputs.interventions.find((i) => i.id === interventionId);
  if (!target) {
    return {
      interventionId,
      found: false,
      breakEvenEffectPp: null,
      minBoundPp: minBound * 100,
      maxBoundPp: maxBound * 100,
      message: 'Intervention not found in inputs.',
    };
  }

  // Base comparison without this intervention
  const withoutInputs: TrustFunnelModelInputs = {
    ...inputs,
    interventions: inputs.interventions.map((i) =>
      i.id === interventionId ? { ...i, enabled: false } : i
    ),
  };
  const baseContrib = runTrustFunnelModel(withoutInputs).summary.netContributionUsd12m;

  let bestPp: number | null = null;

  // Monotonic/linear search through valid bounds
  for (let eff = minBound; eff <= maxBound; eff += step) {
    const testInputs: TrustFunnelModelInputs = {
      ...inputs,
      interventions: inputs.interventions.map((i) =>
        i.id === interventionId ? { ...i, enabled: true, assumedPercentagePointEffect: Math.round(eff * 1000) / 1000 } : i
      ),
    };
    const testContrib = runTrustFunnelModel(testInputs).summary.netContributionUsd12m;
    if (testContrib >= baseContrib) {
      bestPp = Math.round(eff * 1000) / 1000;
      break;
    }
  }

  if (bestPp !== null) {
    return {
      interventionId,
      found: true,
      breakEvenEffectPp: bestPp,
      minBoundPp: Math.round(minBound * 100),
      maxBoundPp: Math.round(maxBound * 100),
      message: `Conditional break-even threshold: +${(bestPp * 100).toFixed(1)} pp. At or above this assumed effect, incremental revenue covers setup and maintenance costs.`,
    };
  }

  return {
    interventionId,
    found: false,
    breakEvenEffectPp: null,
    minBoundPp: Math.round(minBound * 100),
    maxBoundPp: Math.round(maxBound * 100),
    message: `No break-even threshold found within the range [${(minBound * 100).toFixed(0)}%, ${(maxBound * 100).toFixed(0)}%]. Programme costs exceed revenue lift across this entire span.`,
  };
}

// ─── CSV Export Helper ────────────────────────────────────────────────────────

/**
 * Exports baseline and proposal monthly snapshots as CSV string.
 */
export function exportMonthlyOutputsCsv(
  selectedOutput: TrustFunnelModelOutput,
  compareOutput: TrustFunnelModelOutput | null,
  currency: string = 'USD'
): string {
  const headers = [
    'Month',
    'Selected_Prospects',
    'Selected_Onboarded',
    'Selected_Funded',
    'Selected_FirstLiveTraders',
    'Selected_ActiveTraders',
    `Selected_Volume_${currency}`,
    `Selected_Revenue_${currency}`,
    `Selected_Cost_${currency}`,
    `Selected_Contribution_${currency}`,
    `Selected_CumulativeContribution_${currency}`,
    'Compare_FirstLiveTraders',
    'Compare_ActiveTraders',
    `Compare_Revenue_${currency}`,
    `Compare_Cost_${currency}`,
    `Compare_Contribution_${currency}`,
  ];

  const rows: string[] = [headers.join(',')];

  for (let m = 0; m < selectedOutput.snapshots.length; m++) {
    const s = selectedOutput.snapshots[m];
    const c = compareOutput?.snapshots[m];

    rows.push([
      s.month,
      s.uniqueNewProspects,
      s.onboardedTraders,
      s.fundedTraders,
      s.firstLiveTraders,
      s.activeTraders,
      s.tradingVolumeUsd,
      s.totalRevenueUsd,
      s.costs.totalMonthlyCost,
      s.contributionUsd,
      s.cumulativeContributionUsd,
      c ? c.firstLiveTraders : '',
      c ? c.activeTraders : '',
      c ? c.totalRevenueUsd : '',
      c ? c.costs.totalMonthlyCost : '',
      c ? c.contributionUsd : '',
    ].join(','));
  }

  return rows.join('\n');
}


