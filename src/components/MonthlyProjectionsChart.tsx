'use client';

import { formatINRCompact } from '../config/deckNumbers';
import { ModelOutput } from '../core/growth/model';

interface MonthlyProjectionsChartProps {
  baselineResult: ModelOutput;
  proposalResult: ModelOutput;
  selectedMonth: number;
  onMonthSelect: (month: number) => void;
  metric: 'volume' | 'revenue' | 'traders' | 'contribution';
}

export default function MonthlyProjectionsChart({
  baselineResult,
  proposalResult,
  selectedMonth,
  onMonthSelect,
  metric,
}: MonthlyProjectionsChartProps) {
  const getMetricValue = (snapshot: any, metric: string): number => {
    switch (metric) {
      case 'volume': return snapshot.volumeInr;
      case 'revenue': return snapshot.totalRevenue;
      case 'traders': return snapshot.activeUsers;
      case 'contribution': return snapshot.contribution;
      default: return 0;
    }
  };

  const getMetricLabel = (metric: string): string => {
    switch (metric) {
      case 'volume': return 'Executed Volume';
      case 'revenue': return 'Service Revenue';
      case 'traders': return 'Active Traders';
      case 'contribution': return 'Net Contribution';
      default: return '';
    }
  };

  const formatMetricValue = (value: number, metric: string): string => {
    if (metric === 'traders') {
      return value.toLocaleString('en-IN');
    }
    return formatINRCompact(value);
  };

  // Find max values for scaling
  const allValues = [
    ...baselineResult.snapshots.map(s => getMetricValue(s, metric)),
    ...proposalResult.snapshots.map(s => getMetricValue(s, metric)),
  ];
  const maxValue = Math.max(...allValues.map(Math.abs));
  const minValue = metric === 'contribution' ? Math.min(...allValues) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[var(--text-primary)]">
          {getMetricLabel(metric)}
        </span>
        <div className="flex items-center gap-3 text-[9px]">
          <span className="flex items-center gap-1">
            <div className="w-3 h-1.5 rounded bg-[var(--text-secondary)]" />
            Baseline
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-1.5 rounded bg-[var(--brand)]" />
            Proposal
          </span>
        </div>
      </div>

      <div className="relative">
        {/* Zero line for contribution */}
        {metric === 'contribution' && minValue < 0 && (
          <div 
            className="absolute left-0 right-0 border-t border-[var(--border)] z-10"
            style={{ 
              bottom: `${(Math.abs(minValue) / (maxValue - minValue)) * 100}%`,
            }}
          />
        )}

        {/* Chart */}
        <div className="flex items-end gap-0.5 h-32 bg-[var(--bg-base)] rounded-lg p-2">
          {baselineResult.snapshots.map((baseSnap, idx) => {
            const propSnap = proposalResult.snapshots[idx];
            const baseValue = getMetricValue(baseSnap, metric);
            const propValue = getMetricValue(propSnap, metric);
            
            const baseHeight = metric === 'contribution' && minValue < 0
              ? Math.max(2, ((baseValue - minValue) / (maxValue - minValue)) * 100)
              : Math.max(2, (baseValue / maxValue) * 100);
            
            const propHeight = metric === 'contribution' && minValue < 0
              ? Math.max(2, ((propValue - minValue) / (maxValue - minValue)) * 100)
              : Math.max(2, (propValue / maxValue) * 100);
            
            const isSelected = idx + 1 === selectedMonth;
            
            return (
              <button
                key={idx}
                onClick={() => onMonthSelect(idx + 1)}
                className={`
                  flex-1 flex items-end gap-px relative group transition-opacity
                  ${isSelected ? 'opacity-100' : 'opacity-70 hover:opacity-90'}
                `}
                title={`Month ${idx + 1}`}
              >
                {/* Baseline bar */}
                <div 
                  className="flex-1 rounded-t transition-all"
                  style={{ 
                    height: `${baseHeight}%`,
                    backgroundColor: 'var(--text-secondary)',
                  }}
                />
                
                {/* Proposal bar */}
                <div 
                  className="flex-1 rounded-t transition-all"
                  style={{ 
                    height: `${propHeight}%`,
                    backgroundColor: 'var(--brand)',
                  }}
                />

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" />
                )}

                {/* Hover tooltip */}
                <div className="
                  absolute bottom-full left-1/2 -translate-x-1/2 mb-2 
                  bg-[var(--bg-surface)] border border-[var(--border)] rounded px-2 py-1 
                  opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                  whitespace-nowrap text-[9px] z-20
                ">
                  <div className="font-bold mb-0.5">Month {idx + 1}</div>
                  <div className="text-[var(--text-secondary)]">
                    Base: {formatMetricValue(baseValue, metric)}
                  </div>
                  <div className="text-[var(--brand)]">
                    Prop: {formatMetricValue(propValue, metric)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between text-[9px] text-[var(--text-muted)] mt-1 px-2">
          <span>M1</span>
          <span>M6</span>
          <span>M12</span>
        </div>
      </div>

      {/* Selected month details */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-3">
        <div className="text-[10px] text-[var(--text-muted)] mb-2">Month {selectedMonth}</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[9px] text-[var(--text-secondary)] mb-0.5">Baseline</div>
            <div className="text-[14px] font-mono font-bold text-[var(--text-secondary)]">
              {formatMetricValue(getMetricValue(baselineResult.snapshots[selectedMonth - 1], metric), metric)}
            </div>
          </div>
          <div>
            <div className="text-[9px] text-[var(--brand)] mb-0.5">Proposal</div>
            <div className="text-[14px] font-mono font-bold text-[var(--brand)]">
              {formatMetricValue(getMetricValue(proposalResult.snapshots[selectedMonth - 1], metric), metric)}
            </div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)]">
          Difference: <strong className={
            getMetricValue(proposalResult.snapshots[selectedMonth - 1], metric) >= getMetricValue(baselineResult.snapshots[selectedMonth - 1], metric)
              ? 'text-[var(--green)]'
              : 'text-[var(--red)]'
          }>
            {getMetricValue(proposalResult.snapshots[selectedMonth - 1], metric) >= getMetricValue(baselineResult.snapshots[selectedMonth - 1], metric) ? '+' : ''}
            {formatMetricValue(
              getMetricValue(proposalResult.snapshots[selectedMonth - 1], metric) - getMetricValue(baselineResult.snapshots[selectedMonth - 1], metric),
              metric
            )}
          </strong>
        </div>
      </div>
    </div>
  );
}
