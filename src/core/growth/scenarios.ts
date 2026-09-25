/**
 * MochaTrade Growth Model — Preset Scenarios
 * Baseline (paid-led, opaque) vs Recommended (Crew Pass + trust)
 * Per PRD §6.3 GRO-5
 * 
 * All values updated to INR per Round 1 deck numbers
 */

import { ModelInputs, DEFAULT_TRUST_LEVERS, TrustLever } from './model';
import { DECK_NUMBERS } from '../../config/deckNumbers';

function disabledLevers(): TrustLever[] {
  return DEFAULT_TRUST_LEVERS.map((l) => ({ ...l, enabled: false, completeness: 0 }));
}

function fullLevers(): TrustLever[] {
  return DEFAULT_TRUST_LEVERS.map((l) => ({ ...l, enabled: true, completeness: l.completeness }));
}

export const BASELINE_INPUTS: ModelInputs = {
  channel: {
    paidBudgetInr: 100000,           // ₹100K/month paid budget (baseline = heavy paid spend)
    paidCostPerSignup: DECK_NUMBERS.cac.paidMid,  // ₹1,350 midpoint
    crewEventsPerMonth: 0,          // baseline = zero crew pass
    crewsPerEvent: 0,
    crewMembersPerCrew: 4,
    crewJoinRate: 0,
    crewNewPlatformShare: 0,
    organicBaseMonthly: 50,
    organicGrowthRate: 0.03,
    invitesPerActiveUser: 0.3,
    inviteConversionRate: 0.05,
  },
  pricing: {
    takerFeeBps: DECK_NUMBERS.pricing.takerFeeBaselineBps,  // 10 bps = higher opaque fee
    makerFeeBps: -2,
    fxSpreadPct: DECK_NUMBERS.pricing.fxSpreadPct,
    depositVolumeFractionOfNotional: 0.1,
  },
  trustLevers: disabledLevers(),
  trustRef: 0.5,
  priceElasticity: 0.7,
  trustElasticityDampening: 0.3,
  baseVolumePerActiveInr: 150000,   // ₹1.5L/month per active trader
  refFeeBps: DECK_NUMBERS.pricing.takerFeeRecommendedBps,
  funnelKyc: 0.65,
  funnelDeposit: 0.45,
  funnelFirstTrade: 0.55,
  funnelRetention: 0.40,
  supportTicketRatePerActivePerMonth: 0.15,
  supportCostPerTicketInr: DECK_NUMBERS.supportCostPerTicket,
  crewEventCostInr: DECK_NUMBERS.crewEventCost,
  crewPerksCostInr: 0,
  months: 12,
};

export const RECOMMENDED_INPUTS: ModelInputs = {
  channel: {
    paidBudgetInr: 40000,            // ₹40K/month (60% shifted to Crew Pass)
    paidCostPerSignup: DECK_NUMBERS.cac.paidMid,  // ₹1,350 midpoint
    crewEventsPerMonth: 4,          // weekly Market Nights
    crewsPerEvent: 3,               // 3 crews per event
    crewMembersPerCrew: 4,
    crewJoinRate: 0.641,            // SIMULATED — repo: 41/64 qualification rate
    crewNewPlatformShare: 0.785,    // SIMULATED — repo: invite→attendance 78.5%
    organicBaseMonthly: 50,
    organicGrowthRate: 0.05,        // faster organic due to trust signals
    invitesPerActiveUser: 0.8,
    inviteConversionRate: 0.12,
  },
  pricing: {
    takerFeeBps: DECK_NUMBERS.pricing.takerFeeRecommendedBps,  // 2 bps = Round 1 deck 0.02%
    makerFeeBps: -DECK_NUMBERS.pricing.rebateStructure.amountBps,  // -2 bps rebate
    fxSpreadPct: DECK_NUMBERS.pricing.fxSpreadPct,
    depositVolumeFractionOfNotional: 0.1,
  },
  trustLevers: fullLevers(),
  trustRef: 0.5,
  priceElasticity: 0.7,
  trustElasticityDampening: 0.3,
  baseVolumePerActiveInr: 150000,   // ₹1.5L/month per active trader
  refFeeBps: DECK_NUMBERS.pricing.takerFeeRecommendedBps,
  funnelKyc: 0.65,
  funnelDeposit: 0.45,
  funnelFirstTrade: 0.55,
  funnelRetention: 0.40,
  supportTicketRatePerActivePerMonth: 0.15,
  supportCostPerTicketInr: DECK_NUMBERS.supportCostPerTicket,
  crewEventCostInr: DECK_NUMBERS.crewEventCost,
  crewPerksCostInr: 100,           // ₹100/month crew perks per active crew user
  months: 12,
};

// Stress test: trust levers have no effect (θ=0, all betas suppressed)
export const STRESS_TEST_INPUTS: ModelInputs = {
  ...RECOMMENDED_INPUTS,
  trustLevers: RECOMMENDED_INPUTS.trustLevers.map((l) => ({
    ...l,
    betaKyc: 0, betaDeposit: 0, betaFirstTrade: 0, betaRetention: 0, betaTickets: 0,
  })),
  trustElasticityDampening: 0,
  channel: {
    ...RECOMMENDED_INPUTS.channel,
    crewJoinRate: 0.35,             // pessimistic: lower crew conversion
  },
};

export interface Scenario {
  id: string;
  name: string;
  description: string;
  inputs: ModelInputs;
  isPreset: boolean;
  color: string;
}

export const PRESET_SCENARIOS: Scenario[] = [
  {
    id: 'baseline',
    name: 'Baseline',
    description: 'Paid-led acquisition, no trust investments, opaque pricing. What happens without our Round 1 recommendation.',
    inputs: BASELINE_INPUTS,
    isPreset: true,
    color: '#7e7e9a',
  },
  {
    id: 'recommended',
    name: 'Recommended ✓',
    description: 'Round 1 thesis: shift 60% budget to Crew Pass, activate all trust levers, lower fee to 5 bps. Trust reduces churn and fee sensitivity.',
    inputs: RECOMMENDED_INPUTS,
    isPreset: true,
    color: '#f59e0b',
  },
  {
    id: 'stress',
    name: 'Honest Stress',
    description: 'Trust levers have zero effect, crew conversion halves. Shows when Baseline wins. Intellectual honesty check.',
    inputs: STRESS_TEST_INPUTS,
    isPreset: true,
    color: '#ef4444',
  },
];
