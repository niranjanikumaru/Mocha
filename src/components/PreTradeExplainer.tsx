'use client';

import { useState } from 'react';
import { ContractSymbol, ContractDefinition } from '../types/trading';
import { CONTRACT_CATALOG, INITIAL_MARK_PRICES } from '../lib/contracts';
import { calcPreTradeSummary } from '../lib/marginCalculator';
import { AlertTriangle, Info, ChevronDown, ChevronUp, PlayCircle, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800 rounded-t-2xl">
          <div>
            <h2 className="text-white font-bold text-lg">Understand Before You Trade</h2>
            <p className="text-zinc-400 text-xs mt-0.5">MochaTrade Perpetual Futures · Fictional sample data</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Symbol + leverage selector */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-xs text-zinc-500 mb-1 block">Contract</label>
              <select
                value={selectedSymbol}
                onChange={(e) => onSymbolChange(e.target.value as ContractSymbol)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {SYMBOLS.map((s) => (
                  <option key={s} value={s}>{CONTRACT_CATALOG[s].underlyingTicker} Perp</option>
                ))}
              </select>
            </div>
            <div className="col-span-1">
              <label className="text-xs text-zinc-500 mb-1 block">Quantity (contracts)</label>
              <input
                type="number" min={1} max={500} value={quantity}
                onChange={(e) => onQuantityChange(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="col-span-1">
              <label className="text-xs text-zinc-500 mb-1 block">Leverage ({leverage}x)</label>
              <input
                type="range" min={1} max={contract.maxLeverage} value={leverage}
                onChange={(e) => onLeverageChange(Number(e.target.value))}
                className="w-full mt-2 accent-amber-500"
              />
            </div>
          </div>

          {/* Perpetual vs Ownership explainer */}
          <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <Info className="w-4 h-4" />
              Perpetual Futures ≠ Share Ownership
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                ['Perpetual Contract (This)', 'Synthetic price exposure only', 'Funding fees paid every 8 hours', 'No voting rights or dividends', 'Leveraged · liquidation possible', 'Close any time · no expiry'],
                ['Owning Shares', 'Own a piece of the company', 'No funding fees', 'Voting rights & dividends', 'No liquidation risk', 'Must sell on exchange to exit'],
              ].map(([title, ...items], i) => (
                <div key={i} className={`rounded-lg p-3 space-y-1.5 ${i === 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-zinc-700/40 border border-zinc-700'}`}>
                  <p className={`font-semibold mb-2 ${i === 0 ? 'text-amber-400' : 'text-zinc-300'}`}>{title}</p>
                  {items.map((item, j) => (
                    <p key={j} className="text-zinc-400 flex items-start gap-1.5">
                      <span className={i === 0 ? 'text-amber-500' : 'text-zinc-600'}>•</span> {item}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Ownership-goal mismatch warning */}
          {showOwnershipWarning && (
            <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
              <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <div className="flex-1 text-xs text-rose-300">
                <strong className="text-rose-400">Goal mismatch check:</strong> If your goal is long-term investment in {contract.underlyingName}, a perpetual contract may not be suitable — you will pay funding fees over time and face liquidation risk. This instrument is designed for short-to-medium term directional exposure.
              </div>
              <button onClick={() => setShowOwnershipWarning(false)} className="text-rose-500 hover:text-rose-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Cost summary */}
          <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-semibold text-sm">Position Cost Summary</p>
              <p className="text-zinc-500 text-xs">Mark price: ${markPrice.toFixed(2)} (fictional sample)</p>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ['Total Notional Exposure', `$${summary.notionalUsd.toFixed(2)}`, `₹${summary.notionalInr.toFixed(0)}`],
                ['Required Initial Margin', `$${summary.initialMarginUsd.toFixed(2)}`, `₹${summary.initialMarginInr.toFixed(0)}`],
              ].map(([label, usd, inr]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-zinc-400">{label}</span>
                  <div className="text-right">
                    <span className="text-white font-medium">{usd}</span>
                    <span className="text-zinc-500 text-xs ml-2">{inr}</span>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setShowFeeBreakdown(!showFeeBreakdown)}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 mt-1"
              >
                {showFeeBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showFeeBreakdown ? 'Hide' : 'Show'} fee breakdown
              </button>
              {showFeeBreakdown && (
                <div className="mt-2 pl-3 border-l border-zinc-700 space-y-1.5 text-xs text-zinc-400">
                  <div className="flex justify-between"><span>Taker fee ({(contract.takerFeeRate * 100).toFixed(3)}%)</span><span className="text-white">${summary.takerFeeUsd.toFixed(4)}</span></div>
                  <div className="flex justify-between"><span>INR→USD conversion spread ({(contract.inrUsdConversionSpread * 100).toFixed(2)}%)</span><span className="text-white">${summary.conversionFeeUsd.toFixed(4)}</span></div>
                  <div className="flex justify-between"><span>Funding per 8h (est.)</span><span className="text-white">${summary.fundingPer8hUsd.toFixed(4)}</span></div>
                </div>
              )}
              <div className="pt-2 mt-1 border-t border-zinc-700 flex items-center justify-between font-semibold">
                <span className="text-white">Total upfront cost</span>
                <span className="text-amber-400">${summary.totalCostUsd.toFixed(2)}</span>
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                Est. liquidation at: <span className="text-rose-400 font-medium">${summary.estimatedLiquidationPrice.toFixed(2)}</span> · Maintenance margin: {(contract.maintenanceMarginRate * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Adverse scenarios */}
          <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4">
            <p className="text-white font-semibold text-sm mb-3">If the price moves against you (fictional sample)</p>
            <div className="grid grid-cols-3 gap-2">
              {adverseScenarios.map(({ drop, loss }) => (
                <div key={drop} className={`rounded-lg p-3 text-center border ${drop === 5 ? 'border-amber-500/30 bg-amber-500/5' : drop === 10 ? 'border-orange-500/30 bg-orange-500/5' : 'border-rose-500/30 bg-rose-500/5'}`}>
                  <p className={`text-lg font-bold ${drop === 5 ? 'text-amber-400' : drop === 10 ? 'text-orange-400' : 'text-rose-400'}`}>−{drop}%</p>
                  <p className="text-white text-sm font-semibold mt-1">${loss.toFixed(0)}</p>
                  <p className="text-zinc-500 text-xs">₹{(loss * 86.85).toFixed(0)} loss</p>
                </div>
              ))}
            </div>
            <p className="text-zinc-600 text-xs mt-2">⚠ Sample calculation only. Stop orders do not guarantee an execution price.</p>
          </div>

          {/* CTA */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onOpenSimulation}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold hover:bg-amber-500/20 transition-colors"
            >
              <PlayCircle className="w-4 h-4" />
              Try Simulation First (Recommended)
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-semibold transition-colors"
            >
              I Understand — Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
