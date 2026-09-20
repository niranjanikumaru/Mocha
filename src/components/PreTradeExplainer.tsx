'use client';

import { useState } from 'react';
import { ContractSymbol, ContractDefinition } from '../types/trading';
import { CONTRACT_CATALOG, INITIAL_MARK_PRICES } from '../lib/contracts';
import { calcPreTradeSummary } from '../lib/marginCalculator';
import { AlertTriangle, Info, ChevronDown, ChevronUp, PlayCircle, X, ShieldCheck, Check } from 'lucide-react';

interface PreTradeExplainerProps {
  selectedSymbol: ContractSymbol;
  onSymbolChange: (s: ContractSymbol) => void;
  leverage: number;
  onLeverageChange: (l: number) => void;
  quantity: number;
  onQuantityChange: (q: number) => void;
  onOpenSimulation: () => void;
  onClose: () => void;
}

const SYMBOLS = Object.keys(CONTRACT_CATALOG) as ContractSymbol[];

export default function PreTradeExplainer({
  selectedSymbol, onSymbolChange,
  leverage, onLeverageChange,
  quantity, onQuantityChange,
  onOpenSimulation, onClose,
}: PreTradeExplainerProps) {
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false);
  const [showOwnershipWarning, setShowOwnershipWarning] = useState(true);

  const contract: ContractDefinition = CONTRACT_CATALOG[selectedSymbol];
  const markPrice = INITIAL_MARK_PRICES[selectedSymbol];
  const summary = calcPreTradeSummary(selectedSymbol, markPrice, quantity, leverage);

  const adverseScenarios = [
    { drop: 5, loss: summary.notionalUsd * 0.05 * leverage },
    { drop: 10, loss: summary.notionalUsd * 0.10 * leverage },
    { drop: 20, loss: summary.notionalUsd * 0.20 * leverage },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto card-elevated shadow-2xl border-[var(--border)] bg-[var(--bg-surface)]">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-[var(--bg-surface)] border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-[var(--brand-dim)] flex items-center justify-center text-[var(--brand)]">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[var(--text-primary)]">Contract Rules & Visible Risk</h2>
              <p className="text-[11px] text-[var(--text-secondary)]">{contract.underlyingName} Perpetual ({selectedSymbol})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Symbol + leverage selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="stat-label block mb-1">Contract Market</label>
              <select
                value={selectedSymbol}
                onChange={(e) => onSymbolChange(e.target.value as ContractSymbol)}
                className="input-field"
              >
                {SYMBOLS.map((s) => (
                  <option key={s} value={s}>{CONTRACT_CATALOG[s].underlyingTicker} Perp</option>
                ))}
              </select>
            </div>
            <div>
              <label className="stat-label block mb-1">Quantity (Contracts)</label>
              <input
                type="number" min={1} max={500} value={quantity}
                onChange={(e) => onQuantityChange(Number(e.target.value))}
                className="input-field font-mono"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="stat-label">Leverage</label>
                <span className="text-[12px] font-mono font-bold text-[var(--brand)]">{leverage}×</span>
              </div>
              <input
                type="range" min={1} max={contract.maxLeverage} value={leverage}
                onChange={(e) => onLeverageChange(Number(e.target.value))}
                className="mt-2"
              />
            </div>
          </div>

          {/* Perpetual vs Ownership explainer — Kalshi style comparison */}
          <div className="card p-4 bg-[var(--bg-elevated)] border-[var(--border)] space-y-3">
            <div className="flex items-center gap-2 text-[var(--brand)] font-semibold text-[13px]">
              <Info className="w-4 h-4" />
              <span>Perpetual Futures Contract ≠ Share Ownership</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
              <div className="p-3 rounded-lg bg-[var(--brand-dim)] border border-[var(--brand-border)] space-y-1.5">
                <p className="font-bold text-[var(--brand)] mb-1">Perpetual Contract (MochaTrade)</p>
                <p className="text-[var(--text-secondary)]">• Cash-settled synthetic exposure</p>
                <p className="text-[var(--text-secondary)]">• 8-hour funding rate mechanism</p>
                <p className="text-[var(--text-secondary)]">• Leveraged margin with liquidation threshold</p>
                <p className="text-[var(--text-secondary)]">• No share voting rights or dividends</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-interactive)] border border-[var(--border)] space-y-1.5">
                <p className="font-bold text-[var(--text-primary)] mb-1">Cash Equity Shares</p>
                <p className="text-[var(--text-secondary)]">• Direct fractional ownership</p>
                <p className="text-[var(--text-secondary)]">• No ongoing funding fees</p>
                <p className="text-[var(--text-secondary)]">• Zero liquidation risk from price swings</p>
                <p className="text-[var(--text-secondary)]">• Eligible for corporate dividend actions</p>
              </div>
            </div>
          </div>

          {/* Ownership-goal mismatch warning */}
          {showOwnershipWarning && (
            <div className="p-3 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] rounded-lg flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[var(--red)] shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] text-[var(--red)] leading-snug">
                <strong className="font-bold">Suitability Notice:</strong> If your intention is multi-year passive buy-and-hold investing, perpetual contracts may erode your capital via cumulative funding fees. Perpetual instruments are designed for directional traders and short-term tactical hedging.
              </div>
              <button onClick={() => setShowOwnershipWarning(false)} className="text-[var(--red)] opacity-60 hover:opacity-100">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Cost breakdown */}
          <div className="card p-4 bg-[var(--bg-elevated)] border-[var(--border)]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-[13px] text-[var(--text-primary)]">Cost & Margin Requirements</span>
              <span className="text-[11px] font-mono text-[var(--text-secondary)]">Mark: ${markPrice.toFixed(2)}</span>
            </div>

            <div className="space-y-1.5 text-[12px]">
              <div className="data-row">
                <span className="text-[var(--text-secondary)]">Total Notional Position Value</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">${summary.notionalUsd.toFixed(2)} (₹{summary.notionalInr.toFixed(0)})</span>
              </div>
              <div className="data-row">
                <span className="text-[var(--text-secondary)]">Committed Initial Margin</span>
                <span className="font-mono font-bold text-[var(--brand)]">${summary.initialMarginUsd.toFixed(2)} (₹{summary.initialMarginInr.toFixed(0)})</span>
              </div>

              {/* Collapsible fee details */}
              <button
                onClick={() => setShowFeeBreakdown(!showFeeBreakdown)}
                className="flex items-center gap-1 text-[11px] text-[var(--brand)] hover:underline mt-1 pt-1"
              >
                {showFeeBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showFeeBreakdown ? 'Hide Itemised Fees' : 'View Itemised Fees & Conversion'}
              </button>

              {showFeeBreakdown && (
                <div className="mt-1.5 pl-3 border-l-2 border-[var(--border)] space-y-1 text-[11px] text-[var(--text-secondary)] fade-in">
                  <div className="flex justify-between">
                    <span>Venue Taker Fee ({(contract.takerFeeRate * 100).toFixed(3)}%)</span>
                    <span className="font-mono text-[var(--text-primary)]">${summary.takerFeeUsd.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>INR↔USD Conversion Spread ({(contract.inrUsdConversionSpread * 100).toFixed(2)}%)</span>
                    <span className="font-mono text-[var(--text-primary)]">${summary.conversionFeeUsd.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated 8-Hour Funding Rate</span>
                    <span className="font-mono text-[var(--text-primary)]">${summary.fundingPer8hUsd.toFixed(4)}</span>
                  </div>
                </div>
              )}

              <div className="data-row pt-2 border-t border-[var(--border)] font-semibold text-[13px]">
                <span className="text-[var(--text-primary)]">Total Upfront Capital Required</span>
                <span className="font-mono text-[var(--brand)]">${summary.totalCostUsd.toFixed(2)}</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] flex justify-between pt-0.5">
                <span>Est. Liquidation Price: <strong className="text-[var(--red)] font-mono">${summary.estimatedLiquidationPrice.toFixed(2)}</strong></span>
                <span>Maintenance Margin: {(contract.maintenanceMarginRate * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Adverse price drop simulation */}
          <div className="card p-4 bg-[var(--bg-elevated)] border-[var(--border)]">
            <p className="font-semibold text-[13px] text-[var(--text-primary)] mb-2.5">Adverse Scenario Simulator</p>
            <div className="grid grid-cols-3 gap-2">
              {adverseScenarios.map(({ drop, loss }) => (
                <div key={drop} className="p-2.5 rounded-lg text-center bg-[var(--bg-interactive)] border border-[var(--border)]">
                  <p className="font-mono text-[14px] font-bold text-[var(--red)]">−{drop}% Drop</p>
                  <p className="font-mono text-[13px] font-semibold text-[var(--text-primary)] mt-1">−${loss.toFixed(0)}</p>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">≈ ₹{(loss * 86.85).toFixed(0)}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-2">
              * Calculations based on selected {leverage}× leverage. Stop losses do not guarantee slippage-free execution in high volatility.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onOpenSimulation}
              className="btn btn-brand flex-1 py-2.5 text-[13px]"
            >
              <PlayCircle className="w-4 h-4" />
              Open Simulation Position First
            </button>
            <button
              onClick={onClose}
              className="btn btn-ghost flex-1 py-2.5 text-[13px]"
            >
              I Understand — Proceed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
