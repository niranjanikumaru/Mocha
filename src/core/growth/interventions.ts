/**
 * Intervention Rollout Logic
 * Converts intervention schedules into month-by-month trust lever effects
 */

import { TrustLever } from './model';
import { Intervention } from '../../components/RolloutPlanner';

/**
 * Calculate the effective coverage for an intervention in a given month
 * Takes into account launch month and ramp duration
 */
export function getInterventionCoverage(
  intervention: Intervention,
  currentMonth: number
): number {
  if (currentMonth < intervention.launchMonth) {
    // Not launched yet
    return 0;
  }

  if (intervention.rampMonths === 0) {
    // Instant rollout
    return intervention.coverage;
  }

  const monthsSinceLaunch = currentMonth - intervention.launchMonth + 1;
  
  if (monthsSinceLaunch >= intervention.rampMonths) {
    // Fully ramped
    return intervention.coverage;
  }

  // Linear ramp: month 1 = coverage/rampMonths, month 2 = 2*coverage/rampMonths, etc.
  const rampProgress = monthsSinceLaunch / intervention.rampMonths;
  return intervention.coverage * rampProgress;
}

/**
 * Calculate the total monthly cost for an intervention in a given month
 */
export function getInterventionCost(
  intervention: Intervention,
  currentMonth: number
): { setup: number; recurring: number; total: number } {
  if (currentMonth < intervention.launchMonth) {
    return { setup: 0, recurring: 0, total: 0 };
  }

  const setup = currentMonth === intervention.launchMonth ? intervention.setupCost : 0;
  const recurring = intervention.monthlyCost;
  
  return { setup, recurring, total: setup + recurring };
}

/**
 * Apply intervention effects to a baseline trust lever
 * This merges intervention beta coefficients with the base trust lever
 */
export function applyInterventionToLever(
  baseLever: TrustLever,
  intervention: Intervention,
  effectiveCoverage: number
): TrustLever {
  if (effectiveCoverage === 0) {
    // No effect yet
    return baseLever;
  }

  // Interventions add to the beta coefficients, weighted by coverage
  return {
    ...baseLever,
    betaKyc: baseLever.betaKyc,  // interventions don't affect KYC in current model
    betaDeposit: baseLever.betaDeposit + (intervention.betaDeposit * effectiveCoverage),
    betaFirstTrade: baseLever.betaFirstTrade + (intervention.betaFirstTrade * effectiveCoverage),
    betaRetention: baseLever.betaRetention + (intervention.betaRetention * effectiveCoverage),
    betaTickets: baseLever.betaTickets + (intervention.betaTickets * effectiveCoverage),
  };
}

/**
 * Create a trust lever from an intervention
 * Used when an intervention doesn't map to an existing lever
 */
export function interventionToTrustLever(
  intervention: Intervention,
  effectiveCoverage: number
): TrustLever {
  return {
    id: intervention.id,
    label: intervention.name,
    description: intervention.description,
    completeness: effectiveCoverage,  // coverage acts as completeness
    enabled: effectiveCoverage > 0,
    betaKyc: 0,  // interventions typically don't affect KYC
    betaDeposit: intervention.betaDeposit * effectiveCoverage,
    betaFirstTrade: intervention.betaFirstTrade * effectiveCoverage,
    betaRetention: intervention.betaRetention * effectiveCoverage,
    betaTickets: intervention.betaTickets * effectiveCoverage,
    proofRoute: intervention.proofRoute || '/proof/contracts',
  };
}

/**
 * Generate month-specific model inputs with interventions applied
 * This is the main function to use when running monthly projections
 */
export function applyInterventionsToMonth(
  baseInputs: any,  // ModelInputs but avoiding circular import
  interventions: Intervention[],
  currentMonth: number
): any {
  // Deep clone to avoid mutating the original
  const monthInputs = JSON.parse(JSON.stringify(baseInputs));

  // Calculate total intervention costs for this month
  let totalSetupCost = 0;
  let totalRecurringCost = 0;

  interventions.forEach(intervention => {
    const costs = getInterventionCost(intervention, currentMonth);
    totalSetupCost += costs.setup;
    totalRecurringCost += costs.recurring;
  });

  // Apply intervention effects to trust levers
  // Strategy: Match interventions to existing levers by ID, or add new ones
  const leverMap = new Map<string, TrustLever>();
  
  // Start with base levers
  monthInputs.trustLevers.forEach((lever: TrustLever) => {
    leverMap.set(lever.id, { ...lever });
  });

  // Apply interventions
  interventions.forEach(intervention => {
    const coverage = getInterventionCoverage(intervention, currentMonth);
    
    if (coverage > 0) {
      const existingLever = leverMap.get(intervention.id);
      
      if (existingLever) {
        // Enhance existing lever with intervention effects
        const enhanced = applyInterventionToLever(existingLever, intervention, coverage);
        leverMap.set(intervention.id, enhanced);
      } else {
        // Create new lever from intervention
        const newLever = interventionToTrustLever(intervention, coverage);
        leverMap.set(intervention.id, newLever);
      }
    }
  });

  // Convert map back to array
  monthInputs.trustLevers = Array.from(leverMap.values());

  // Store intervention costs for later use in cost calculations
  // (The model will need to be updated to use these)
  monthInputs._interventionCosts = {
    setup: totalSetupCost,
    recurring: totalRecurringCost,
    total: totalSetupCost + totalRecurringCost,
  };

  return monthInputs;
}

/**
 * Get summary of interventions active in a given month
 */
export interface InterventionSummary {
  month: number;
  activeInterventions: string[];
  totalCoverage: number;
  setupCost: number;
  recurringCost: number;
  totalCost: number;
}

export function getInterventionSummary(
  interventions: Intervention[],
  month: number
): InterventionSummary {
  const active: string[] = [];
  let totalCoverage = 0;
  let setupCost = 0;
  let recurringCost = 0;

  interventions.forEach(intervention => {
    const coverage = getInterventionCoverage(intervention, month);
    if (coverage > 0) {
      active.push(intervention.name);
      totalCoverage += coverage;
    }

    const costs = getInterventionCost(intervention, month);
    setupCost += costs.setup;
    recurringCost += costs.recurring;
  });

  return {
    month,
    activeInterventions: active,
    totalCoverage: Math.min(1, totalCoverage),
    setupCost,
    recurringCost,
    totalCost: setupCost + recurringCost,
  };
}
