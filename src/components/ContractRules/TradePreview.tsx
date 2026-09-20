import React, { useState } from 'react';
import { 
  Zap, 
  Clock, 
  Coins, 
  Percent, 
  HelpCircle, 
  CheckCircle,
  AlertCircle,
  FileCheck2,
  ShieldBan
} from 'lucide-react';
import type { 
  ContractDefinition, 
  OrderCalculationResult, 
  OrderSide, 
  OrderType,
  ProviderQuote 
} from '../../core/types/contract';

interface TradePreviewProps {
  contract: ContractDefinition;
  quote: ProviderQuote;
  calculation: OrderCalculationResult;
  side: OrderSide;
  setSide: (side: OrderSide) => void;
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  size: number;
  setSize: (size: number) => void;
  leverage: number;
  setLeverage: (leverage: number) => void;
  onExecuteTrade: () => void;
}

export const TradePreview: React.FC<TradePreviewProps> = ({
  contract,
  quote,
  calculation,
  side,
  setSide,
  orderType,
  setOrderType,
  size,
  setSize,
  leverage,
  setLeverage,
  onExecuteTrade,
}) => {
  const isFeedLive = quote.status === 'live';
  const maxContractLeverage = contract.marginSettings.maxLeverage;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <span>{contract.identity.name}</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {contract.identity.symbol} ΓÇó {contract.identity.marketType.toUpperCase()}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">Mark Price</span>
          <span className="text-lg font-bold font-mono text-white">
            ${quote.markPrice.toFixed(contract.precision.priceDecimals)}
          </span>
        </div>
      </div>

      {/* Order Entry Controls */}
      <div className="mt-4 space-y-4">
        {/* Side Tabs: Buy / Sell */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSide('buy')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              side === 'buy'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            LONG / BUY
          </button>
          <button
            onClick={() => setSide('sell')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              side === 'sell'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            SHORT / SELL
          </button>
        </div>

        {/* Order Type */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setOrderType('market')}
            className={`flex-1 py-1 rounded-md font-medium transition-all ${
              orderType === 'market' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400'
            }`}
          >
            Market Order (Taker)
          </button>
          <button
            onClick={() => setOrderType('limit')}
            className={`flex-1 py-1 rounded-md font-medium transition-all ${
              orderType === 'limit' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400'
            }`}
          >
            Limit Order (Maker)
          </button>
        </div>

        {/* Size Input */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Position Size ({contract.identity.baseAsset})</span>
            <span className="text-slate-500 font-mono">
              Min: {contract.precision.minOrderSize} | Max: {contract.precision.maxOrderSize}
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              min={contract.precision.minOrderSize}
              max={contract.precision.maxOrderSize}
              step={contract.precision.tickSize}
              value={size}
              onChange={(e) => setSize(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500 transition-colors"
            />
            <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-500">
              {contract.identity.baseAsset}
            </span>
          </div>
        </div>

        {/* Leverage Slider */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Leverage Selection</span>
            <span className="text-amber-400 font-bold font-mono">
              {leverage}x <span className="text-slate-500 font-normal">/ max {maxContractLeverage}x</span>
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={maxContractLeverage}
            value={Math.min(leverage, maxContractLeverage)}
            onChange={(e) => setLeverage(parseInt(e.target.value, 10))}
            className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>1x</span>
            <span>{Math.floor(maxContractLeverage / 2)}x</span>
            <span>{maxContractLeverage}x (Contract Cap)</span>
          </div>
        </div>

        {/* Calculation Preview Box */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <span className="text-slate-400 font-medium flex items-center space-x-1">
              <FileCheck2 className="h-3.5 w-3.5 text-amber-400" />
              <span>Validated Rule Preview</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800/40">
              Rules: {calculation.ruleVersion.feeVersion} / {calculation.ruleVersion.fundingVersion}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Notional Position Value</span>
            <span className="font-mono text-slate-200 font-semibold">
              ${calculation.notionalValue.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Required Initial Margin ({((1/leverage)*100).toFixed(1)}%)</span>
            <span className="font-mono text-white font-bold">
              ${calculation.requiredInitialMargin.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Maintenance Margin ({(contract.marginSettings.maintenanceMarginPct * 100).toFixed(1)}%)</span>
            <span className="font-mono text-slate-300">
              ${calculation.requiredMaintenanceMargin.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">
              Estimated Fee ({orderType === 'market' ? `${contract.feeSchedule.takerFeeBps} bps Taker` : `${contract.feeSchedule.makerFeeBps} bps Maker`})
            </span>
            <span className="font-mono text-slate-300">
              ${calculation.estimatedFee.toFixed(3)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">
              Projected Funding ({contract.fundingSchedule.intervalHours}h @ {(contract.fundingSchedule.currentRateBps / 100).toFixed(3)}%)
            </span>
            <span className={`font-mono ${calculation.projectedFundingCostPerInterval >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {calculation.projectedFundingCostPerInterval >= 0 ? 'Cost: $' : 'Yield: +$'}
              {Math.abs(calculation.projectedFundingCostPerInterval).toFixed(3)}
            </span>
          </div>
        </div>

        {/* Action Button */}
        {isFeedLive ? (
          <button
            onClick={onExecuteTrade}
            disabled={calculation.accountHealthStatus === 'CRITICAL'}
            className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center space-x-2 ${
              calculation.accountHealthStatus === 'CRITICAL'
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : side === 'buy'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>
              {calculation.accountHealthStatus === 'CRITICAL' 
                ? 'EXECUTION BLOCKED (INSUFFICIENT BUFFER)' 
                : `OPEN ${side.toUpperCase()} POSITION`}
            </span>
          </button>
        ) : (
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-center">
            <div className="flex items-center justify-center space-x-2 text-rose-300 text-xs font-bold mb-1">
              <ShieldBan className="h-4 w-4 text-rose-400" />
              <span>TRADING SAFELY HALTED (FEED INTERRUPTED)</span>
            </div>
            <p className="text-[11px] text-rose-300/80">
              Provider price feed heartbeat lost. Execution is disabled to prevent adverse price slippage.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
