/**
 * MochaTrade Growth & Monetization Model Engine
 * Pure TypeScript — no React, no side effects, deterministic.
 * Per PRD §6.2 — Track 2 (Growth & Monetization)
 *
 * All numbers are DERIVED from inputs. Nothing is hardcoded in outputs.
 */

export type Provenance = 'MEASURED' | 'SIMULATED' | 'ASSUMED' | 'DERIVED';

export interface AssumptionEntry {
  id: string;
  label: string;
  value: number;
  unit: string;
  range: [number, number];
  provenance: Provenance;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  source: string;
}

export interface TrustLever {
  id: string;
  label: string;
  description: string;
  /** 0..1 completeness — user drags this */
  completeness: number;
  enabled: boolean;
  /** beta coefficient for each funnel stage effect */
  betaKyc: number;
  betaDeposit: number;
  betaFirstTrade: number;
  betaRetention: number;
  /** ticket reduction coefficient */
  betaTickets: number;
  proofRoute: string;
}

export interface ChannelInputs {
  paidBudgetUsd: number;          // monthly paid marketing spend
  paidCostPerSignup: number;      // CPA on paid channel
  crewEventsPerMonth: number;     // Market Night events per month
  crewsPerEvent: number;          // avg crews per event
  crewMembersPerCrew: number;     // always 4
  crewJoinRate: number;           // fraction who join platform (0..1)
  crewNewPlatformShare: number;   // fraction who are new to platform (0..1)
  organicBaseMonthly: number;     // organic signups month-0
  organicGrowthRate: number;      // monthly growth rate (0..1)
  invitesPerActiveUser: number;   // referral invites per MAU
  inviteConversionRate: number;   // fraction who convert (0..1)
}

export interface PricingInputs {
  takerFeeBps: number;            // taker fee in basis points (e.g. 5)
  makerFeeBps: number;            // maker fee in bps (negative = rebate)
  fxSpreadPct: number;            // FX conversion spread %
  depositVolumeFractionOfNotional: number; // fraction of notional that's a new deposit
}

export interface ModelInputs {
  channel: ChannelInputs;
  pricing: PricingInputs;
  trustLevers: TrustLever[];
  /** T_ref: trust baseline score (0..1) for "no effect" */
  trustRef: number;
  /** price elasticity of volume */
  priceElasticity: number;
  /** trust's dampening of price elasticity (0..1) */
  trustElasticityDampening: number;
  /** base monthly volume per active user (USD) */
  baseVolumePerActiveUsd: number;
  /** reference fee at which V0 was calibrated (bps) */
  refFeeBps: number;
  /** funnel conversion rates (baseline, before trust) */
  funnelKyc: number;
  funnelDeposit: number;
  funnelFirstTrade: number;
  funnelRetention: number;
  /** support cost */
  supportTicketRatePerActivePerMonth: number;
  supportCostPerTicketUsd: number;
  /** event cost (food, venue etc) per event */
  crewEventCostUsd: number;
  /** crew pass perks cost per active crew trader per month */
  crewPerksCostUsd: number;
  /** months to project */
  months: number;
}

export interface MonthlySnapshot {
  month: number;
  // Inflows
  paidSignups: number;
  crewSignups: number;
  organicSignups: number;
  referralSignups: number;
  totalSignups: number;
  // Funnel
  kycPassed: number;
  deposited: number;
  firstTraded: number;
  // Stock
  activeUsers: number;
  // Economics
  volumeUsd: number;
  tradingRevenue: number;
  fxRevenue: number;
  totalRevenue: number;
  totalCost: number;
  contribution: number;
  // KPIs
  blendedCacUsd: number;
  paidCacUsd: number;
  crewCacUsd: number;
  ltv: number;
  ltvCacRatio: number;
  paybackMonths: number;
  // Trust
  trustScore: number;
}

export interface ModelOutput {
  snapshots: MonthlySnapshot[];
  breakevenMonth: number | null;
  totalRevenue12m: number;
  totalContribution12m: number;
  peakMAU: number;
  assumptions: AssumptionEntry[];
  warnings: string[];
}

// ─── Default assumptions ledger ──────────────────────────────────────────────

export function buildAssumptionLedger(inputs: ModelInputs): AssumptionEntry[] {
  const { channel, pricing, trustLevers } = inputs;
  return [
    {
      id: 'A-01',
      label: 'Taker fee rate',
      value: pricing.takerFeeBps,
      unit: 'bps',
      range: [1, 20],
      provenance: 'ASSUMED',
      confidence: 'MEDIUM',
      source: 'Round 1 recommendation: competitive positioning vs Dhan/Zerodha',
    },
    {
      id: 'A-02',
      label: 'FX spread',
      value: pricing.fxSpreadPct,
      unit: '%',
      range: [0.1, 0.5],
      provenance: 'SIMULATED',
      confidence: 'HIGH',
      source: 'repo: lib/contracts.ts inrUsdConversionSpread = 0.0025',
    },
    {
      id: 'A-03',
      label: 'Crew join rate (Market Night → platform signup)',
      value: channel.crewJoinRate * 100,
      unit: '%',
      range: [20, 80],
      provenance: 'SIMULATED',
      confidence: 'MEDIUM',
      source: 'repo: marketNightEngine.ts qualification 41/64 = 64.1%',
    },
    {
      id: 'A-04',
      label: 'Invite → attendance rate',
      value: channel.crewNewPlatformShare * 100,
      unit: '%',
      range: [40, 95],
      provenance: 'SIMULATED',
      confidence: 'MEDIUM',
      source: 'repo: marketNightEngine inviteToAttendanceRate = 78.5%',
    },
    {
      id: 'A-05',
      label: 'Organic signups (month 0)',
      value: channel.organicBaseMonthly,
      unit: 'users/mo',
      range: [10, 500],
      provenance: 'ASSUMED',
      confidence: 'LOW',
      source: 'Round 1 estimate; replace with real traffic data',
    },
    {
      id: 'A-06',
      label: 'Price elasticity of volume (ε)',
      value: inputs.priceElasticity,
      unit: '',
      range: [0.3, 2.0],
      provenance: 'ASSUMED',
      confidence: 'LOW',
      source: 'Academic: retail derivatives elasticity 0.5–1.2; assumed 0.7',
    },
    {
      id: 'A-07',
      label: 'Base volume per active user',
      value: inputs.baseVolumePerActiveUsd,
      unit: 'USD/mo',
      range: [500, 10000],
      provenance: 'ASSUMED',
      confidence: 'LOW',
      source: 'Round 1 estimate; replace with cohort data from beta',
    },
    {
      id: 'A-08',
      label: 'KYC conversion rate',
      value: inputs.funnelKyc * 100,
      unit: '%',
      range: [30, 90],
      provenance: 'ASSUMED',
      confidence: 'MEDIUM',
      source: 'Industry: Indian fintech KYC funnel 55–75%; assumed 65%',
    },
    {
      id: 'A-09',
      label: 'Deposit conversion rate (post-KYC)',
      value: inputs.funnelDeposit * 100,
      unit: '%',
      range: [20, 80],
      provenance: 'ASSUMED',
      confidence: 'MEDIUM',
      source: 'Industry: 40–60%; trust levers should improve this',
    },
    {
      id: 'A-10',
      label: 'Monthly retention rate (M1)',
      value: inputs.funnelRetention * 100,
      unit: '%',
      range: [20, 80],
      provenance: 'ASSUMED',
      confidence: 'LOW',
      source: 'Derivatives apps: 35–55%; trust expected to improve',
    },
    {
      id: 'A-11',
      label: 'Support ticket rate per active user/mo',
      value: inputs.supportTicketRatePerActivePerMonth,
      unit: 'tickets/user/mo',
      range: [0.02, 0.5],
      provenance: 'ASSUMED',
      confidence: 'LOW',
      source: 'Estimated 0.15; Lost-ACK recovery should reduce this',
    },
    {
      id: 'A-12',
      label: 'Support cost per ticket',
      value: inputs.supportCostPerTicketUsd,
      unit: 'USD',
      range: [1, 20],
      provenance: 'ASSUMED',
      confidence: 'MEDIUM',
      source: 'India ops: ~₹300–400 per ticket ≈ \$3.5–4.5 USD',
    },
    {
      id: 'A-13',
      label: 'Crew event cost',
      value: inputs.crewEventCostUsd,
      unit: 'USD/event',
      range: [50, 500],
      provenance: 'ASSUMED',
      confidence: 'MEDIUM',
      source: 'Round 1: virtual event ≈ ₹5000 (\$58); in-person higher',
    },
    {
      id: 'A-14',
      label: 'Trust dampening on price elasticity (θ)',
      value: inputs.trustElasticityDampening,
      unit: '',
      range: [0, 0.5],
      provenance: 'ASSUMED',
      confidence: 'LOW',
      source: 'Key thesis driver — higher trust → less fee sensitivity',
    },
    {
      id: 'A-15',
      label: 'Invites per active user / month',
      value: channel.invitesPerActiveUser,
      unit: '',
      range: [0, 3],
      provenance: 'ASSUMED',
      confidence: 'LOW',
      source: 'Round 1: social trading platforms avg 0.5–1.5',
    },
  ];
}

// ─── Default trust levers (from existing repo features) ──────────────────────

export const DEFAULT_TRUST_LEVERS: TrustLever[] = [
  {
    id: 'TL-1',
    label: 'Explainable Margin Health',
    description: 'Plain-English why your buffer changed — reduces confusion-driven exits',
    completeness: 1.0,
    enabled: true,
    betaKyc: 0,
    betaDeposit: 0.04,
    betaFirstTrade: 0.06,
    betaRetention: 0.05,
    betaTickets: 0.10,
    proofRoute: '/proof/terminal',
  },
  {
    id: 'TL-2',
    label: 'Lost-ACK Recovery',
    description: 'Reconcile dropped order ACKs rather than blind resubmission — prevents ghost trades',
    completeness: 1.0,
    enabled: true,
    betaKyc: 0,
    betaDeposit: 0,
    betaFirstTrade: 0.03,
    betaRetention: 0.08,
    betaTickets: 0.25,
    proofRoute: '/proof/terminal',
  },
  {
    id: 'TL-3',
    label: 'Idempotent Deposits',
    description: 'Webhook deduplication prevents double-credit on payment retries',
    completeness: 1.0,
    enabled: true,
    betaKyc: 0,
    betaDeposit: 0.05,
    betaFirstTrade: 0.02,
    betaRetention: 0.03,
    betaTickets: 0.15,
    proofRoute: '/proof/terminal',
  },
  {
    id: 'TL-4',
    label: 'Versioned Contract Rules + Receipts',
    description: 'Every trade rule version captured; dispute resolution traceable',
    completeness: 0.5,
    enabled: true,
    betaKyc: 0,
    betaDeposit: 0.02,
    betaFirstTrade: 0.02,
    betaRetention: 0.04,
    betaTickets: 0.12,
    proofRoute: '/proof/contracts',
  },
  {
    id: 'TL-5',
    label: 'Crew Pass Social Layer',
    description: 'Team accountability and shared learning loop — reduces first-30-day churn',
    completeness: 0.7,
    enabled: true,
    betaKyc: 0,
    betaDeposit: 0.03,
    betaFirstTrade: 0.04,
    betaRetention: 0.10,
    betaTickets: 0.05,
    proofRoute: '/proof/market-night',
  },
];

// ─── Model computation ────────────────────────────────────────────────────────

export function runModel(inputs: ModelInputs): ModelOutput {
  const {
    channel, pricing, trustLevers, trustRef,
    priceElasticity, trustElasticityDampening,
    baseVolumePerActiveUsd, refFeeBps,
    funnelKyc, funnelDeposit, funnelFirstTrade, funnelRetention,
    supportTicketRatePerActivePerMonth, supportCostPerTicketUsd,
    crewEventCostUsd, months,
  } = inputs;

  const warnings: string[] = [];
  const snapshots: MonthlySnapshot[] = [];

  // ── Trust score T ∈ [0,1] ──────────────────────────────────────────────────
  const weights = trustLevers.map(() => 1 / trustLevers.length);
  const trustScore = trustLevers.reduce((sum, lever, i) => {
    return sum + weights[i] * (lever.enabled ? lever.completeness : 0);
  }, 0);

  // ── K-factor (referral viral coefficient) ─────────────────────────────────
  const K = channel.invitesPerActiveUser * channel.inviteConversionRate;
  if (K >= 1) {
    warnings.push(`⚠ K-factor = ${K.toFixed(2)} ≥ 1 — referral loop implies unbounded growth. Reduce invites/conv or this model will explode.`);
  }

  // ── Trust-adjusted funnel rates ───────────────────────────────────────────
  function trustAdjust(baseRate: number, beta: number): number {
    const adjusted = baseRate * (1 + beta * (trustScore - trustRef));
    return Math.min(0.98, Math.max(0, adjusted));
  }

  const avgBetaKyc = trustLevers.reduce((s, l) => s + (l.enabled ? l.completeness * l.betaKyc : 0), 0);
  const avgBetaDeposit = trustLevers.reduce((s, l) => s + (l.enabled ? l.completeness * l.betaDeposit : 0), 0);
  const avgBetaFirstTrade = trustLevers.reduce((s, l) => s + (l.enabled ? l.completeness * l.betaFirstTrade : 0), 0);
  const avgBetaRetention = trustLevers.reduce((s, l) => s + (l.enabled ? l.completeness * l.betaRetention : 0), 0);
  const avgBetaTickets = trustLevers.reduce((s, l) => s + (l.enabled ? l.completeness * l.betaTickets : 0), 0);

  const adjKyc = trustAdjust(funnelKyc, avgBetaKyc);
  const adjDeposit = trustAdjust(funnelDeposit, avgBetaDeposit);
  // PRD §6.1: "price must also hit activation and retention... needs an interior optimum"
  // Guard: clamp feeRatio so zero fee never produces NaN from Math.pow(0, -ε).
  // Zero trading revenue is already ensured by the revenue formula: volume × 0 bps = 0.
  const rawFeeRatio = refFeeBps > 0 ? pricing.takerFeeBps / refFeeBps : 1;
  const feeRatio = Math.max(0.01, rawFeeRatio); // floor at 1% of reference fee
  // High fees deter first-trade activation:
  const feeActivationPenalty = feeRatio > 1 ? Math.min(0.8, 0.25 * (feeRatio - 1)) : 0;
  const adjFirstTrade = Math.max(0.05, trustAdjust(funnelFirstTrade, avgBetaFirstTrade) * (1 - feeActivationPenalty));
  
  // PRD §6.2: r' = r · (1 + β_r·(T - T_ref)) · (1 - ε_r·(f/f_ref - 1)⁺)
  // Higher fees increase churn non-linearly:
  const feeRetentionPenalty = feeRatio > 1 ? Math.min(0.9, 0.35 * Math.pow(feeRatio - 1, 1.2)) : 0;
  const adjRetention = Math.max(0.05, Math.min(0.95, trustAdjust(funnelRetention, avgBetaRetention) * (1 - feeRetentionPenalty)));

  // ── Price elasticity (trust dampens sensitivity) ──────────────────────────
  const effectiveElasticity = priceElasticity * (1 - trustElasticityDampening * trustScore);
  const volumeMultiplier = Number.isFinite(Math.pow(feeRatio, -effectiveElasticity))
    ? Math.pow(feeRatio, -effectiveElasticity) : 1;

  // ── LTV (steady-state) ────────────────────────────────────────────────────
  // When takerFeeBps = 0, arpu = 0 and LTV = 0 — valid, no NaN.
  const arpu = baseVolumePerActiveUsd * volumeMultiplier * (pricing.takerFeeBps / 10000);
  const ltv = adjRetention < 1 ? arpu / (1 - adjRetention) : arpu * 12;

  let activeUsers = 0;
  let cumulativeContribution = 0;
  let breakevenMonth: number | null = null;

  for (let m = 1; m <= months; m++) {
    // ── Inflows ──────────────────────────────────────────────────────────────
    const paidSignups = channel.paidBudgetUsd / channel.paidCostPerSignup;
    const crewSignups = channel.crewEventsPerMonth * channel.crewsPerEvent *
      channel.crewMembersPerCrew * channel.crewJoinRate * channel.crewNewPlatformShare;
    const organicSignups = channel.organicBaseMonthly * Math.pow(1 + channel.organicGrowthRate, m - 1);
    const referralSignups = Math.min(K * activeUsers, activeUsers * 0.5); // cap at 50% of existing
    const totalSignups = paidSignups + crewSignups + organicSignups + (K < 1 ? referralSignups : 0);

    // ── Funnel ────────────────────────────────────────────────────────────────
    const kycPassed = totalSignups * adjKyc;
    const deposited = kycPassed * adjDeposit;
    const firstTraded = deposited * adjFirstTrade;

    // ── Stock (cohort retention) ──────────────────────────────────────────────
    activeUsers = activeUsers * adjRetention + firstTraded;

    // ── Volume & Revenue ──────────────────────────────────────────────────────
    const volumeUsd = activeUsers * baseVolumePerActiveUsd * volumeMultiplier;
    const tradingRevenue = volumeUsd * (pricing.takerFeeBps / 10000);
    const fxRevenue = deposited * 500 * (pricing.fxSpreadPct / 100); // estimated deposit size \$500
    const totalRevenue = tradingRevenue + fxRevenue;

    // ── Costs ─────────────────────────────────────────────────────────────────
    const ticketReduction = avgBetaTickets * trustScore;
    const effectiveTicketRate = supportTicketRatePerActivePerMonth * (1 - ticketReduction);
    const supportCost = activeUsers * effectiveTicketRate * supportCostPerTicketUsd;
    const eventCost = channel.crewEventsPerMonth * crewEventCostUsd;
    const crewPerksCost = activeUsers * (inputs.crewPerksCostUsd || 0);
    const totalCost = channel.paidBudgetUsd + eventCost + crewPerksCost + supportCost;

    const contribution = totalRevenue - totalCost;
    cumulativeContribution += contribution;

    if (!breakevenMonth && cumulativeContribution >= 0) {
      breakevenMonth = m;
    }

    // ── CAC (derived) ─────────────────────────────────────────────────────────
    const paidCac = paidSignups > 0 ? channel.paidBudgetUsd / paidSignups : Infinity;
    const crewCost = eventCost + crewPerksCost;
    const crewCac = crewSignups > 0 ? crewCost / crewSignups : Infinity;
    const blendedCac = totalSignups > 0 ? (channel.paidBudgetUsd + crewCost) / totalSignups : Infinity;

    const ltvCacRatio = blendedCac > 0 && blendedCac < Infinity ? ltv / blendedCac : 0;
    const paybackMonths = arpu > 0 && blendedCac < Infinity ? blendedCac / arpu : 999;

    snapshots.push({
      month: m,
      paidSignups: Math.round(paidSignups),
      crewSignups: Math.round(crewSignups),
      organicSignups: Math.round(organicSignups),
      referralSignups: Math.round(referralSignups),
      totalSignups: Math.round(totalSignups),
      kycPassed: Math.round(kycPassed),
      deposited: Math.round(deposited),
      firstTraded: Math.round(firstTraded),
      activeUsers: Math.round(activeUsers),
      volumeUsd,
      tradingRevenue,
      fxRevenue,
      totalRevenue,
      totalCost,
      contribution,
      blendedCacUsd: blendedCac < Infinity ? blendedCac : 0,
      paidCacUsd: paidCac < Infinity ? paidCac : 0,
      crewCacUsd: crewCac < Infinity ? crewCac : 0,
      ltv,
      ltvCacRatio,
      paybackMonths: paybackMonths > 120 ? 120 : paybackMonths,
      trustScore,
    });
  }

  const totalRevenue12m = snapshots.reduce((s, m) => s + m.totalRevenue, 0);
  const totalContribution12m = snapshots.reduce((s, m) => s + m.contribution, 0);
  const peakMAU = Math.max(...snapshots.map((m) => m.activeUsers));

  return {
    snapshots,
    breakevenMonth,
    totalRevenue12m,
    totalContribution12m,
    peakMAU,
    assumptions: buildAssumptionLedger(inputs),
    warnings,
  };
}

// ─── Pricing optimizer sweep ──────────────────────────────────────────────────

export interface PricingOptPoint {
  feeBps: number;
  revenue: number;
  contribution: number;
}

export function sweepPricing(inputs: ModelInputs, feeRange: [number, number] = [1, 20]): PricingOptPoint[] {
  const points: PricingOptPoint[] = [];
  for (let bps = feeRange[0]; bps <= feeRange[1]; bps += 0.5) {
    const result = runModel({ ...inputs, pricing: { ...inputs.pricing, takerFeeBps: bps } });
    points.push({
      feeBps: bps,
      revenue: result.totalRevenue12m,
      contribution: result.totalContribution12m,
    });
  }
  return points;
}

// ─── Sensitivity analysis (tornado) ──────────────────────────────────────────

export interface SensitivityPoint {
  assumptionId: string;
  label: string;
  low: number;
  high: number;
  lowContrib: number;
  highContrib: number;
  swing: number;
}

export function sensitivityTornado(inputs: ModelInputs): SensitivityPoint[] {
  const levers: Array<{ id: string; label: string; key: string; path: string[]; factor: number }> = [
    { id: 'A-10', label: 'Retention rate', key: 'funnelRetention', path: [], factor: 0.2 },
    { id: 'A-07', label: 'Volume per user', key: 'baseVolumePerActiveUsd', path: [], factor: 0.3 },
    { id: 'A-06', label: 'Price elasticity ε', key: 'priceElasticity', path: [], factor: 0.3 },
    { id: 'A-01', label: 'Taker fee (bps)', key: 'takerFeeBps', path: ['pricing'], factor: 0.4 },
    { id: 'A-09', label: 'Deposit conversion', key: 'funnelDeposit', path: [], factor: 0.25 },
    { id: 'A-03', label: 'Crew join rate', key: 'crewJoinRate', path: ['channel'], factor: 0.3 },
    { id: 'A-14', label: 'Trust dampening θ', key: 'trustElasticityDampening', path: [], factor: 0.5 },
    { id: 'A-11', label: 'Support ticket rate', key: 'supportTicketRatePerActivePerMonth', path: [], factor: 0.5 },
  ];

  return levers.map(({ id, label, key, path, factor }) => {
    function modify(inp: ModelInputs, mult: number): ModelInputs {
      const cloned = JSON.parse(JSON.stringify(inp)) as ModelInputs;
      if (path.length === 0) {
        (cloned as unknown as Record<string, number>)[key] *= mult;
      } else {
        const section = path[0] as keyof ModelInputs;
        ((cloned[section] as unknown) as Record<string, number>)[key] *= mult;
      }
      return cloned;
    }
    const lowResult = runModel(modify(inputs, 1 - factor));
    const highResult = runModel(modify(inputs, 1 + factor));
    return {
      assumptionId: id,
      label,
      low: factor,
      high: factor,
      lowContrib: lowResult.totalContribution12m,
      highContrib: highResult.totalContribution12m,
      swing: Math.abs(highResult.totalContribution12m - lowResult.totalContribution12m),
    };
  }).sort((a, b) => b.swing - a.swing);
}

// ─── Market Night Trust & Growth Funnel (Re-export) ──────────────────────────
export * from './trustFunnelModel';

