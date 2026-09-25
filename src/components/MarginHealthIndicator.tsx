'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MarginMetrics, MarginHealthStatus, Position } from '../types/trading';
import { Shield, ShieldAlert, ShieldOff, WifiOff, TrendingDown, TrendingUp, ChevronDown, ChevronUp, Minus, AlertOctagon, Info } from 'lucide-react';
import { BorderBeam } from './ui/border-beam';
import NumberTicker from './ui/number-ticker';
import SpotlightCard from './ui/spotlight-card';

interface MarginHealthIndicatorProps {
  metrics: MarginMetrics;
  position: Position;
  onReduce: () => void;
  onClose: () => void;
  onReview: () => void;
}

const STATUS_CONFIG: Record<MarginHealthStatus, {
  label: string;
  badgeClass: string;
  color: string;
  barColor: string;
  icon: React.ReactNode;
}> = {
  COMFORTABLE_BUFFER: {
    label: 'Comfortable Buffer',
    badgeClass: 'badge-green',
    color: 'text-[var(--green)]',
    barColor: 'bg-[var(--green)]',
    icon: <Shield className="w-4 h-4 text-[var(--green)]" />,
  },
  REDUCED_BUFFER: {
    label: 'Reduced Buffer',
    badgeClass: 'badge-yellow',
    color: 'text-[var(--yellow)]',
    barColor: 'bg-[var(--yellow)]',
    icon: <ShieldAlert className="w-4 h-4 text-[var(--yellow)]" />,
  },
  NEAR_LIQUIDATION: {
    label: 'Near Liquidation',
    badgeClass: 'badge-red',
    color: 'text-[var(--red)]',
    barColor: 'bg-[var(--red)]',
    icon: <ShieldOff className="w-4 h-4 text-[var(--red)] animate-pulse" />,
  },
  DATA_STALE: {
    label: 'Price Data Stale',
    badgeClass: 'badge-muted',
    color: 'text-[var(--text-secondary)]',
    barColor: 'bg-[var(--text-muted)]',
    icon: <WifiOff className="w-4 h-4 text-[var(--text-secondary)]" />,
  },
};

export default function MarginHealthIndicator({ metrics, position, onReduce, onClose, onReview }: MarginHealthIndicatorProps) {
  const [showExplainer, setShowExplainer] = useState(false);
  const cfg = STATUS_CONFIG[metrics.status];
  const isStale = metrics.status === 'DATA_STALE';

  const bufferDisplayPct = Math.min(100, Math.max(0, metrics.bufferPercentage));
  const pnlPositive = metrics.unrealizedPnL >= 0;

  return (
    <SpotlightCard className="card-elevated overflow-hidden" spotlightColor={metrics.status === 'NEAR_LIQUIDATION' ? 'rgba(239,68,68,0.07)' : metrics.status === 'REDUCED_BUFFER' ? 'rgba(234,179,8,0.07)' : 'rgba(34,197,94,0.05)'}>
      {(metrics.status === 'NEAR_LIQUIDATION') && (
        <BorderBeam colorFrom="#ef4444" colorTo="#f59e0b" duration={4} borderWidth={1.5} />
      )}
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-2.5">
          {cfg.icon}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Margin Health Buffer</span>
              <span className={`badge ${cfg.badgeClass}`}>{cfg.label}</span>
            </div>
          </div>
        </div>
        <div className="text-right flex items-center gap-2">
          <span className="text-[11px] text-[var(--text-secondary)]">Buffer Ratio</span>
          <span className={`text-[15px] font-mono font-bold ${cfg.color}`}>
            {isStale ? '—' : `${bufferDisplayPct.toFixed(1)}%`}
          </span>
        </div>
      </div>

      {/* Buffer ratio progress track */}
      {!isStale && (
        <div className="px-4 pt-3 pb-2 bg-[var(--bg-surface)]">
          <div className="health-track">
            <motion.div
              className={`health-fill ${cfg.barColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${bufferDisplayPct}%` }}
              transition={{ type: 'spring', stiffness: 80, damping: 18 }}
            />
            {/* Guide markers */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-[var(--red)] opacity-60" style={{ left: '15%' }} title="15% Liquidation trigger" />
            <div className="absolute top-0 bottom-0 w-0.5 bg-[var(--yellow)] opacity-50" style={{ left: '40%' }} title="40% Reduced buffer threshold" />
          </div>
          <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1.5 font-mono">
            <span className="text-[var(--red)]">0% Liquidation</span>
            <span className="text-[var(--yellow)]">15% Reduced</span>
            <span className="text-[var(--green)]">40% Comfortable</span>
            <span>100% Safe</span>
          </div>
        </div>
      )}

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-[var(--bg-surface)]">
        {/* Unrealised P&L */}
        <div className="card p-2.5 bg-[var(--bg-elevated)] border-[var(--border-subtle)]">
          <span className="stat-label flex items-center justify-between">
            <span>Unrealised P&L</span>
            <span className="text-[9px] text-[var(--text-muted)]">P&L ≠ Margin</span>
          </span>
          {isStale ? (
            <p className="stat-value text-[var(--text-muted)] mt-1">—</p>
          ) : (
            <div className="mt-1">
              <div className="flex items-center gap-1">
                {pnlPositive ? (
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--green)] shrink-0" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-[var(--red)] shrink-0" />
                )}
                <span className={`text-[15px] font-mono font-bold ${pnlPositive ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                  {pnlPositive ? '+' : ''}${metrics.unrealizedPnL.toFixed(2)}
                </span>
              </div>
              <p className={`text-[10px] font-mono mt-0.5 ${pnlPositive ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                {pnlPositive ? '+' : ''}{metrics.unrealizedPnLPercent.toFixed(1)}% on margin
              </p>
            </div>
          )}
        </div>

        {/* Position Equity */}
        <div className="card p-2.5 bg-[var(--bg-elevated)] border-[var(--border-subtle)]">
          <span className="stat-label">Position Equity</span>
          {isStale ? (
            <p className="stat-value text-[var(--text-muted)] mt-1">—</p>
          ) : (
            <div className="mt-1">
              <p className="text-[15px] font-mono font-bold text-[var(--text-primary)]">
                ${metrics.equity.toFixed(2)}
              </p>
              <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">
                Maint: ${metrics.maintenanceMargin.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Liquidation Price */}
        <div className="card p-2.5 bg-[var(--bg-elevated)] border-[var(--border-subtle)]">
          <span className="stat-label flex items-center justify-between">
            <span>Est. Liq Price</span>
            <span className="text-[9px] text-[var(--red)] font-semibold">{metrics.distanceToLiquidationPercent.toFixed(1)}% away</span>
          </span>
          {isStale ? (
            <p className="stat-value text-[var(--text-muted)] mt-1">—</p>
          ) : (
            <div className="mt-1">
              <p className="text-[15px] font-mono font-bold text-[var(--red)]">
                ${metrics.liquidationPrice.toFixed(2)}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                Stops ≠ guaranteed fill
              </p>
            </div>
          )}
        </div>

        {/* Accrued Funding */}
        <div className="card p-2.5 bg-[var(--bg-elevated)] border-[var(--border-subtle)]">
          <span className="stat-label flex items-center justify-between">
            <span>Funding (8h)</span>
            <span className="text-[9px] text-[var(--brand)] font-mono">0.01%</span>
          </span>
          <div className="mt-1">
            <p className="text-[15px] font-mono font-bold text-[var(--brand)]">
              ${metrics.accruedFundingFee.toFixed(4)}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">
              Notional: ${metrics.notionalValue.toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      {/* Why did this change collapse */}
      <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--bg-interactive)]">
        <button
          onClick={() => setShowExplainer(!showExplainer)}
          className="w-full flex items-center justify-between text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-1"
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[var(--brand)]" />
            <span>Why did my margin buffer change?</span>
          </span>
          {showExplainer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showExplainer && (
          <div className="mt-2 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[12px] text-[var(--text-secondary)] leading-relaxed fade-in">
            {metrics.changeExplanation}
          </div>
        )}
      </div>

      {/* Near liquidation callout banner */}
      {metrics.status === 'NEAR_LIQUIDATION' && (
        <div className="px-4 py-3 bg-[rgba(239,68,68,0.12)] border-t border-[rgba(239,68,68,0.3)] flex items-start gap-2.5">
          <AlertOctagon className="w-4 h-4 text-[var(--red)] shrink-0 mt-0.5" />
          <div className="text-[11px] text-[var(--red)] leading-snug">
            <strong className="font-semibold">Urgent: Liquidation Buffer Critical.</strong> Margin equity has dropped below required maintenance safety. Reduce your position to free margin, or close the contract.
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="p-3 bg-[var(--bg-elevated)] border-t border-[var(--border)] flex items-center gap-2">
        <button
          onClick={onReview}
          className="btn btn-ghost btn-sm flex-1"
        >
          Contract Rules
        </button>
        <button
          onClick={onReduce}
          className="btn btn-yellow btn-sm flex-1"
        >
          <Minus className="w-3 h-3" />
          De-Risk 25%
        </button>
        <button
          onClick={onClose}
          className="btn btn-red btn-sm flex-1"
        >
          Market Close
        </button>
      </div>
    </SpotlightCard>
  );
}
