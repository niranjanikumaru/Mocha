import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  WifiOff, 
  HelpCircle,
  Activity,
  HeartPulse
} from 'lucide-react';
import type { OrderCalculationResult, ProviderQuote } from '../../core/types/contract';

interface MarginHealthCardProps {
  calculation: OrderCalculationResult;
  quote: ProviderQuote;
  accountEquity: number;
}

export const MarginHealthCard: React.FC<MarginHealthCardProps> = ({
  calculation,
  quote,
  accountEquity,
}) => {
  const isInterrupted = quote.status !== 'live';

  // Determine health presentation
  let badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  let badgeIcon = <ShieldCheck className="h-4 w-4 text-emerald-400" />;
  let barColor = 'bg-emerald-500';
  let bufferPct = 85;

  if (isInterrupted) {
    badgeColor = 'bg-slate-700/50 text-slate-300 border-slate-600 border-dashed';
    badgeIcon = <WifiOff className="h-4 w-4 text-amber-400" />;
    barColor = 'bg-slate-700';
    bufferPct = 0;
  } else if (calculation.accountHealthStatus === 'CRITICAL') {
    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
    badgeIcon = <AlertOctagon className="h-4 w-4 text-rose-400" />;
    barColor = 'bg-rose-500';
    bufferPct = 15;
  } else if (calculation.accountHealthStatus === 'WARNING') {
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    badgeIcon = <AlertTriangle className="h-4 w-4 text-amber-400" />;
    barColor = 'bg-amber-500';
    bufferPct = 50;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <HeartPulse className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white tracking-wide">Margin Health & Risk Monitor</h3>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono border flex items-center space-x-1.5 ${badgeColor}`}>
            {badgeIcon}
            <span className="font-bold">{isInterrupted ? 'UNAVAILABLE' : calculation.accountHealthStatus}</span>
          </span>
        </div>

        {/* Diagnostic Message */}
        <div className={`p-3 rounded-lg border text-xs mb-4 ${
          isInterrupted
            ? 'bg-amber-950/20 border-amber-700/40 text-amber-200'
            : calculation.accountHealthStatus === 'CRITICAL'
            ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
            : calculation.accountHealthStatus === 'WARNING'
            ? 'bg-amber-950/20 border-amber-700/40 text-amber-200'
            : 'bg-slate-800/60 border-slate-700/50 text-slate-300'
        }`}>
          <div className="flex items-start space-x-2">
            <Activity className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-medium">{calculation.healthExplanation}</p>
              {isInterrupted && (
                <p className="text-[11px] text-amber-300/80 mt-1">
                  <strong>Trust Recovery Protocol:</strong> Order submission is paused until provider oracle reconnects and verifies fresh block timestamps (&lt;15s latency).
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Visual Safety Buffer Bar */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Maintenance Buffer</span>
            <span className="font-mono text-slate-200">
              {isInterrupted ? 'N/A (Feed Frozen)' : `${calculation.distanceToLiquidationPct.toFixed(1)}% to Liq`}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${barColor}`} 
              style={{ width: `${isInterrupted ? 0 : Math.min(100, Math.max(5, calculation.distanceToLiquidationPct * 2))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Numerical breakdown */}
      <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-800">
        <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Est. Liquidation Price</span>
          <span className="font-mono font-bold text-amber-300 text-sm">
            {isInterrupted ? 'ΓÇö' : `$${calculation.estimatedLiquidationPrice.toFixed(2)}`}
          </span>
        </div>
        <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Account Equity</span>
          <span className="font-mono font-bold text-slate-200 text-sm">
            ${accountEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
};
