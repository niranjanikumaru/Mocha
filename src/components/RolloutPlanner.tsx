'use client';

import { useState } from 'react';
import { Calendar, DollarSign, Users, Shield, TrendingUp, CheckCircle2 } from 'lucide-react';
import { formatINR, formatINRCompact } from '../config/deckNumbers';

// Intervention types that can be rolled out
export interface Intervention {
  id: string;
  name: string;
  description: string;
  launchMonth: number;  // 1-12
  coverage: number;     // 0-1, what % of users get this
  rampMonths: number;   // how many months to reach full coverage
  setupCost: number;    // one-time cost (INR)
  monthlyCost: number;  // recurring cost per month (INR)
  // Behavioral effects (beta coefficients)
  betaDeposit: number;
  betaFirstTrade: number;
  betaRetention: number;
  betaTickets: number;
  icon: typeof Calendar;
  color: string;
  proofRoute?: string;
}

export interface MarketNightEvent {
  month: number;
  plannedCount: number;
  fundedCount: number;
  capacity: number;        // max attendees per event
  attendance: number;      // expected attendance rate (0-1)
  newProspectShare: number; // fraction who are new (0-1)
  costPerEvent: number;    // INR
}

interface RolloutPlannerProps {
  selectedMonth: number;
  onMonthSelect: (month: number) => void;
  interventions: Intervention[];
  onInterventionUpdate: (id: string, updates: Partial<Intervention>) => void;
  onInterventionClick: (id: string) => void;
  marketNightEvents: MarketNightEvent[];
  onMarketNightUpdate: (month: number, updates: Partial<MarketNightEvent>) => void;
  budgetConstraint: number; // total monthly budget (INR)
}

export default function RolloutPlanner({
  selectedMonth,
  onMonthSelect,
  interventions,
  onInterventionUpdate,
  onInterventionClick,
  marketNightEvents,
  onMarketNightUpdate,
  budgetConstraint,
}: RolloutPlannerProps) {
  const [expandedIntervention, setExpandedIntervention] = useState<string | null>(null);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // Calculate coverage for each intervention at each month
  const getCoverageAtMonth = (intervention: Intervention, month: number): number => {
    if (month < intervention.launchMonth) return 0;
    if (intervention.rampMonths === 0) return intervention.coverage;
    
    const monthsSinceLaunch = month - intervention.launchMonth;
    if (monthsSinceLaunch >= intervention.rampMonths) return intervention.coverage;
    
    // Linear ramp
    return (intervention.coverage * monthsSinceLaunch) / intervention.rampMonths;
  };

  // Calculate total cost at each month
  const getCostAtMonth = (month: number): number => {
    let totalCost = 0;
    
    // Intervention costs
    interventions.forEach(intervention => {
      // Setup cost only at launch month
      if (month === intervention.launchMonth) {
        totalCost += intervention.setupCost;
      }
      // Monthly cost if launched
      if (month >= intervention.launchMonth) {
        totalCost += intervention.monthlyCost;
      }
    });
    
    // Market Night costs
    const eventData = marketNightEvents.find(e => e.month === month);
    if (eventData) {
      totalCost += eventData.fundedCount * eventData.costPerEvent;
    }
    
    return totalCost;
  };

  const isOverBudget = (month: number): boolean => {
    return getCostAtMonth(month) > budgetConstraint;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[13px] font-bold text-[var(--text-primary)]">12-Month Rollout Plan</h2>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
            Click month to select. Click intervention row to edit launch timing.
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-[var(--text-muted)]">Monthly budget</div>
          <div className="text-[13px] font-mono font-bold text-[var(--text-primary)]">
            {formatINRCompact(budgetConstraint)}
          </div>
        </div>
      </div>

      {/* Month Timeline Header */}
      <div className="overflow-x-auto">
        <div className="inline-flex gap-0 border border-[var(--border)] rounded-lg overflow-hidden min-w-full">
          <div className="w-40 bg-[var(--bg-surface)] border-r border-[var(--border)] shrink-0">
            <div className="h-12 flex items-center px-3">
              <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Intervention
              </span>
            </div>
          </div>
          
          {months.map(month => {
            const isSelected = month === selectedMonth;
            const overBudget = isOverBudget(month);
            
            return (
              <button
                key={month}
                onClick={() => onMonthSelect(month)}
                className={`
                  w-16 shrink-0 border-r border-[var(--border)] transition-colors
                  ${isSelected 
                    ? 'bg-[var(--brand)] text-black' 
                    : 'bg-[var(--bg-base)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                  }
                  ${overBudget && !isSelected ? 'border-t-2 border-t-[var(--red)]' : ''}
                `}
              >
                <div className="h-12 flex flex-col items-center justify-center">
                  <span className={`text-[10px] font-semibold ${isSelected ? 'text-black' : ''}`}>
                    M{month}
                  </span>
                  <span className={`text-[8px] mt-0.5 ${isSelected ? 'text-black/70' : 'text-[var(--text-muted)]'}`}>
                    {formatINRCompact(getCostAtMonth(month))}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Market Night Events Row */}
        <div className="inline-flex gap-0 border-l border-r border-b border-[var(--border)] rounded-b-lg overflow-hidden min-w-full">
          <div className="w-40 bg-[var(--bg-surface)] border-r border-[var(--border)] shrink-0">
            <div className="h-16 flex items-center px-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--brand)]" />
                <div>
                  <div className="text-[11px] font-semibold text-[var(--text-primary)]">Market Night</div>
                  <div className="text-[9px] text-[var(--text-muted)]">Crew Pass events</div>
                </div>
              </div>
            </div>
          </div>
          
          {months.map(month => {
            const eventData = marketNightEvents.find(e => e.month === month) || {
              month,
              plannedCount: 0,
              fundedCount: 0,
              capacity: 12,
              attendance: 0.785,
              newProspectShare: 0.641,
              costPerEvent: 5000,
            };
            
            const hasEvents = eventData.plannedCount > 0;
            const isFunded = eventData.fundedCount > 0;
            
            return (
              <div
                key={month}
                className={`
                  w-16 shrink-0 border-r border-[var(--border)] relative
                  ${hasEvents ? 'bg-[var(--brand-dim)]' : 'bg-[var(--bg-base)]'}
                `}
              >
                <div className="h-16 flex flex-col items-center justify-center p-1">
                  {hasEvents && (
                    <>
                      <div className="text-[14px] font-bold text-[var(--brand)]">
                        {eventData.plannedCount}
                      </div>
                      <div className="text-[8px] text-[var(--text-muted)]">
                        {isFunded ? eventData.fundedCount : 0} funded
                      </div>
                      <div className="text-[7px] text-[var(--text-muted)] leading-tight text-center mt-0.5">
                        {Math.round(eventData.plannedCount * eventData.capacity * eventData.attendance * eventData.newProspectShare)} signups
                      </div>
                    </>
                  )}
                </div>
                {hasEvents && eventData.fundedCount < eventData.plannedCount && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--red)]" 
                    title="Some events not funded" />
                )}
              </div>
            );
          })}
        </div>

        {/* Intervention Rows */}
        {interventions.map(intervention => (
          <div 
            key={intervention.id}
            className="inline-flex gap-0 border-l border-r border-b border-[var(--border)] rounded-b-lg overflow-hidden min-w-full"
          >
            <button
              onClick={() => onInterventionClick(intervention.id)}
              className="w-40 bg-[var(--bg-surface)] border-r border-[var(--border)] shrink-0 hover:bg-[var(--bg-hover)] text-left"
            >
              <div className="h-16 flex items-center px-3">
                <div className="flex items-center gap-2">
                  <intervention.icon className="w-4 h-4" style={{ color: intervention.color }} />
                  <div>
                    <div className="text-[11px] font-semibold text-[var(--text-primary)]">
                      {intervention.name}
                    </div>
                    <div className="text-[9px] text-[var(--text-muted)]">
                      Launch M{intervention.launchMonth}
                    </div>
                  </div>
                </div>
              </div>
            </button>
            
            {months.map(month => {
              const coverage = getCoverageAtMonth(intervention, month);
              const isLaunch = month === intervention.launchMonth;
              const hasSetupCost = isLaunch && intervention.setupCost > 0;
              const hasRecurringCost = month >= intervention.launchMonth && intervention.monthlyCost > 0;
              
              return (
                <div
                  key={month}
                  className={`
                    w-16 shrink-0 border-r border-[var(--border)] relative
                    ${coverage > 0 ? 'bg-gradient-to-b from-transparent to-[var(--bg-hover)]' : 'bg-[var(--bg-base)]'}
                  `}
                >
                  <div className="h-16 flex flex-col items-center justify-center">
                    {/* Launch marker */}
                    {isLaunch && (
                      <div 
                        className="absolute top-1 left-1 w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: intervention.color }}
                        title="Launch month"
                      />
                    )}
                    
                    {/* Coverage bar */}
                    {coverage > 0 && (
                      <div className="w-full px-1">
                        <div 
                          className="h-2 rounded-full"
                          style={{ 
                            width: `${coverage * 100}%`,
                            backgroundColor: intervention.color,
                            opacity: 0.6,
                          }}
                        />
                        <div className="text-[8px] text-center text-[var(--text-muted)] mt-0.5">
                          {Math.round(coverage * 100)}%
                        </div>
                      </div>
                    )}
                    
                    {/* Cost markers */}
                    {hasSetupCost && (
                      <div className="text-[7px] text-[var(--red)] font-bold mt-1">
                        ↓{formatINRCompact(intervention.setupCost)}
                      </div>
                    )}
                    {hasRecurringCost && !hasSetupCost && (
                      <div className="text-[7px] text-[var(--text-muted)] mt-1">
                        {formatINRCompact(intervention.monthlyCost)}/mo
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Budget Alert */}
      {months.some(m => isOverBudget(m)) && (
        <div className="bg-[var(--red-dim)] border border-[var(--red-border)] rounded-lg p-3 flex items-start gap-2">
          <div className="text-[var(--red)] shrink-0">⚠️</div>
          <div className="text-[10px] text-[var(--red)] leading-relaxed">
            <strong>Budget exceeded</strong> in months:{' '}
            {months.filter(isOverBudget).join(', ')}. 
            Reduce event count, delay interventions, or increase budget.
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[9px] text-[var(--text-muted)]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" />
          Launch marker
        </div>
        <div className="flex items-center gap-1">
          <div className="w-8 h-2 rounded-full bg-[var(--brand)]" style={{ opacity: 0.6 }} />
          Coverage ramp
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[var(--red)]">↓₹50K</span>
          Setup cost
        </div>
        <div className="flex items-center gap-1">
          <span>₹5K/mo</span>
          Recurring cost
        </div>
      </div>
    </div>
  );
}
