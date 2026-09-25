/**
 * Rollout Projection Engine
 * Runs the growth model month-by-month with interventions applied
 */

import { ModelInputs, ModelOutput, runModel } from './model';
import { Intervention } from '../../components/RolloutPlanner';
import { applyInterventionsToMonth, getInterventionCost } from './interventions';

/**
 * Run a 12-month projection with interventions applied month-by-month
 * 
 * Unlike the standard runModel which uses fixed inputs for all months,
 * this function recalculates the model each month with intervention effects
 * ramping up according to their schedules.
 * 
 * Note: This is a simplified implementation. A full implementation would
 * need to track cohorts separately and apply intervention effects only to
 * new cohorts vs existing ones.
 */
export function runRolloutProjection(
  baseInputs: ModelInputs,
  interventions: Intervention[]
): ModelOutput {
  // For now, we'll use a simplified approach:
  // Average the intervention effects across all 12 months
  // This provides a reasonable approximation for the prototype
  
  // Calculate average coverage for each intervention over 12 months
  const enhancedInputs = { ...baseInputs };
  
  // Merge intervention effects into trust levers
  const interventionLevers = interventions.map(intervention => {
    // Calculate average coverage over 12 months
    let totalCoverage = 0;
    for (let m = 1; m <= 12; m++) {
      const monthCoverage = getInterventionCoverage(intervention, m);
      totalCoverage += monthCoverage;
    }
    const avgCoverage = totalCoverage / 12;
    
    return {
      id: intervention.id,
      label: intervention.name,
      description: intervention.description,
      completeness: avgCoverage,
      enabled: avgCoverage > 0,
      betaKyc: 0,
      betaDeposit: intervention.betaDeposit,
      betaFirstTrade: intervention.betaFirstTrade,
      betaRetention: intervention.betaRetention,
      betaTickets: intervention.betaTickets,
      proofRoute: intervention.proofRoute || '/proof/contracts',
    };
  }).filter(lever => lever.enabled);
  
  // Merge with existing trust levers
  const leverMap = new Map(enhancedInputs.trustLevers.map(l => [l.id, l]));
  
  interventionLevers.forEach(iLever => {
    const existing = leverMap.get(iLever.id);
    if (existing) {
      // Enhance existing lever
      leverMap.set(iLever.id, {
        ...existing,
        completeness: Math.min(1, existing.completeness + iLever.completeness),
        betaDeposit: existing.betaDeposit + iLever.betaDeposit * iLever.completeness,
        betaFirstTrade: existing.betaFirstTrade + iLever.betaFirstTrade * iLever.completeness,
        betaRetention: existing.betaRetention + iLever.betaRetention * iLever.completeness,
        betaTickets: existing.betaTickets + iLever.betaTickets * iLever.completeness,
      });
    } else {
      // Add new lever
      leverMap.set(iLever.id, iLever);
    }
  });
  
  enhancedInputs.trustLevers = Array.from(leverMap.values());
  
  // Run the model with enhanced inputs
  const result = runModel(enhancedInputs);
  
  // Add intervention costs to each month's snapshot
  const enhancedSnapshots = result.snapshots.map(snapshot => {
    let setupCost = 0;
    let recurringCost = 0;
    
    interventions.forEach(intervention => {
      const costs = getInterventionCost(intervention, snapshot.month);
      setupCost += costs.setup;
      recurringCost += costs.recurring;
    });
    
    const interventionCost = setupCost + recurringCost;
    
    return {
      ...snapshot,
      totalCost: snapshot.totalCost + interventionCost,
      contribution: snapshot.contribution - interventionCost,
    };
  });
  
  // Recalculate totals
  const totalRevenue12m = enhancedSnapshots.slice(0, 12).reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalContribution12m = enhancedSnapshots.slice(0, 12).reduce((sum, s) => sum + s.contribution, 0);
  
  // Find new breakeven month
  let cumulativeContribution = 0;
  let breakevenMonth: number | null = null;
  for (let i = 0; i < Math.min(12, enhancedSnapshots.length); i++) {
    cumulativeContribution += enhancedSnapshots[i].contribution;
    if (cumulativeContribution > 0 && breakevenMonth === null) {
      breakevenMonth = i + 1;
    }
  }
  
  return {
    ...result,
    snapshots: enhancedSnapshots,
    breakevenMonth,
    totalRevenue12m,
    totalContribution12m,
  };
}

/**
 * Helper function to check if interventions are applied in model inputs
 */
export function getInterventionCoverage(
  intervention: Intervention,
  currentMonth: number
): number {
  if (currentMonth < intervention.launchMonth) {
    return 0;
  }

  if (intervention.rampMonths === 0) {
    return intervention.coverage;
  }

  const monthsSinceLaunch = currentMonth - intervention.launchMonth + 1;
  
  if (monthsSinceLaunch >= intervention.rampMonths) {
    return intervention.coverage;
  }

  const rampProgress = monthsSinceLaunch / intervention.rampMonths;
  return intervention.coverage * rampProgress;
}
