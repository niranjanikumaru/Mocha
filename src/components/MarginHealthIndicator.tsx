'use client';

import { useState } from 'react';
import { MarginMetrics, MarginHealthStatus, Position } from '../types/trading';
import { Shield, ShieldAlert, ShieldOff, WifiOff, TrendingDown, TrendingUp, ChevronDown, ChevronUp, Minus } from 'lucide-react';

interface MarginHealthIndicatorProps {
  metrics: MarginMetrics;
  position: Position;
  onReduce: () => void;
  onClose: () => void;
  onReview: () => void;
}

const STATUS_CONFIG: Record<MarginHealthStatus, {
  label: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
  icon: React.ReactNode;
  barColor: string;
}> = {
  COMFORTABLE_BUFFER: {
    label: 'Comfortable Buffer',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20',
    icon: <Shield className="w-5 h-5 text-emerald-400" />,
    barColor: 'bg-emerald-500',
  },
  REDUCED_BUFFER: {
    label: 'Reduced Buffer',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/20',
    icon: <ShieldAlert className="w-5 h-5 text-amber-400" />,
    barColor: 'bg-amber-500',
  },
  NEAR_LIQUIDATION: {
    label: 'Near Liquidation',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    glow: 'shadow-rose-500/30',
    icon: <ShieldOff className="w-5 h-5 text-rose-400 animate-pulse" />,
    barColor: 'bg-rose-500',
  },
  DATA_STALE: {
    label: 'Price Data Unavailable',
    color: 'text-zinc-400',
    bg: 'bg-zinc-800/60',
    border: 'border-zinc-600',
    glow: '',
    icon: <WifiOff className="w-5 h-5 text-zinc-500" />,
    barColor: 'bg-zinc-600',
  },
};

export default function MarginHealthIndicator({ metrics, position, onReduce, onClose, onReview }: MarginHealthIndicatorProps) {
  const [showExplainer, setShowExplainer] = useState(false);
  const cfg = STATUS_CONFIG[metrics.status];
  const isStale = metrics.status === 'DATA_STALE';

  const bufferDisplayPct = Math.min(100, Math.max(0, metrics.bufferPercentage));
  const pnlPositive = metrics.unrealizedPnL >= 0;

  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} shadow-lg ${cfg.glow} overflow-hidden`}>
      {/* Status header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          {cfg.icon}
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Margin Health</p>
            {isStale ? (
              <p className="text-zinc-400 font-bold text-base mt-0.5">— Unavailable</p>
            ) : (
              <p className={`font-bold text-base mt-0.5 ${cfg.color}`}>{cfg.label}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-zinc-500 text-xs">Buffer Ratio</p>
          {isStale ? (
            <p className="text-zinc-600 font-bold text-xl">—</p>
          ) : (
            <p className={`font-bold text-xl ${cfg.color}`}>{bufferDisplayPct.toFixed(1)}%</p>
          )}
        </div>
      </div>

      {/* Buffer bar */}
      {!isStale && (
        <div className="px-5 pt-3">
          <div className="relative h-2.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${cfg.barColor}`}
              style={{ width: `${bufferDisplayPct}%` }}
            />
            {/* Threshold markers */}
            <div className="absolute top-0 h-full w-px bg-amber-500/60" style={{ left: '15%' }} />
            <div className="absolute top-0 h-full w-px bg-emerald-500/40" style={{ left: '40%' }} />
          </div>
          <div className="flex justify-between text-zinc-600 text-xs mt-1">
            <span>Liquidation</span>
            <span className="text-amber-600">15% reduced</span>
            <span className="text-emerald-600">40% comfortable</span>
          </div>
          <p className="text-zinc-600 text-xs mt-0.5 italic">▲ Sample thresholds for demonstration</p>
        </div>
      )}

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3 px-5 py-4">
        {/* PnL — kept separate from health */}
        <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800">
          <p className="text-zinc-500 text-xs mb-1">Unrealised P&L</p>
          {isStale ? (
            <p className="text-zinc-600 font-bold text-lg">—</p>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                {pnlPositive ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
                <p className={`font-bold text-lg ${pnlPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {pnlPositive ? '+' : ''}${metrics.unrealizedPnL.toFixed(2)}
                </p>
              </div>
              <p className={`text-xs mt-0.5 ${pnlPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {pnlPositive ? '+' : ''}{metrics.unrealizedPnLPercent.toFixed(2)}% on margin
              </p>
              <p className="text-zinc-600 text-xs mt-0.5 italic">P&L ≠ margin safety</p>
            </>
          )}
        </div>

        {/* Equity & Margin */}
        <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800">
          <p className="text-zinc-500 text-xs mb-1">Position Equity</p>
          {isStale ? (
            <p className="text-zinc-600 font-bold text-lg">—</p>
          ) : (
            <>
              <p className="text-white font-bold text-lg">${metrics.equity.toFixed(2)}</p>
              <p className="text-zinc-500 text-xs mt-0.5">Margin: ${metrics.allocatedMargin.toFixed(2)}</p>
              <p className="text-zinc-500 text-xs">Maint. req: ${metrics.maintenanceMargin.toFixed(2)}</p>
            </>
          )}
        </div>

        {/* Liquidation price */}
        <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800">
          <p className="text-zinc-500 text-xs mb-1">Liquidation Price</p>
          {isStale ? (
            <p className="text-zinc-600 font-bold text-lg">—</p>
          ) : (
            <>
              <p className="text-rose-400 font-bold text-lg">${metrics.liquidationPrice.toFixed(2)}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{metrics.distanceToLiquidationPercent.toFixed(1)}% away</p>
              <p className="text-zinc-600 text-xs italic">Stops ≠ guaranteed price</p>
            </>
          )}
        </div>

        {/* Funding fee */}
        <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800">
          <p className="text-zinc-500 text-xs mb-1">Funding Accrued</p>
          <p className="text-amber-400 font-bold text-lg">${metrics.accruedFundingFee.toFixed(4)}</p>
          <p className="text-zinc-500 text-xs mt-0.5">Per 8h period</p>
          <p className="text-zinc-500 text-xs">Notional: ${metrics.notionalValue.toFixed(0)}</p>
        </div>
      </div>

      {/* Why did this change? */}
      <div className="px-5 pb-3">
        <button
          onClick={() => setShowExplainer(!showExplainer)}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          {showExplainer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Why did my buffer change?
        </button>
        {showExplainer && (
          <div className="mt-2 p-3 bg-zinc-900 rounded-xl border border-zinc-700 text-xs text-zinc-300 leading-relaxed">
            {metrics.changeExplanation}
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="px-5 pb-5">
        {metrics.status === 'NEAR_LIQUIDATION' && (
          <div className="mb-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
            ⚠ <strong className="text-rose-400">Risk is high.</strong> Consider reducing your position size first. Adding more margin delays — it does not eliminate — liquidation risk.
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={onReview}
            className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Review Risk
          </button>
          <button
            onClick={onReduce}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-semibold hover:bg-amber-500/25 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
            Reduce Position
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-sm font-semibold hover:bg-rose-500/25 transition-colors"
          >
            Close Position
          </button>
        </div>
      </div>
    </div>
  );
}
