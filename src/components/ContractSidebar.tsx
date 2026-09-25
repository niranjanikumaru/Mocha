'use client';

import { motion } from 'framer-motion';
import { CONTRACT_CATALOG, INITIAL_MARK_PRICES } from '../lib/contracts';
import { ContractSymbol, Position, UserAccountBalance } from '../types/trading';
import { TrendingUp, TrendingDown, Plus } from 'lucide-react';
import AnimatedButton from './ui/animated-button';
import GlowPulse from './ui/glow-pulse';

interface ContractSidebarProps {
  selectedSymbol: ContractSymbol;
  onSelect: (s: ContractSymbol) => void;
  position: Position | null;
  balance: UserAccountBalance;
  onOpenExplainer: () => void;
}

const SYMBOLS = Object.keys(CONTRACT_CATALOG) as ContractSymbol[];

const MOCK_CHANGE: Record<ContractSymbol, number> = {
  'NVDA-PERP': 2.34,
  'AAPL-PERP': -0.87,
  'TSLA-PERP': 4.12,
  'MSFT-PERP': 0.55,
  'GOOGL-PERP': -1.23,
};

export default function ContractSidebar({
  selectedSymbol, onSelect, position, balance, onOpenExplainer,
}: ContractSidebarProps) {
  return (
    <aside className="terminal-sidebar flex flex-col bg-[var(--bg-surface)]">

      {/* Contract list */}
      <div className="py-3">
        <p className="section-label">Markets</p>
        <div className="mt-1">
          {SYMBOLS.map((sym, idx) => {
            const contract = CONTRACT_CATALOG[sym];
            const price = INITIAL_MARK_PRICES[sym];
            const change = MOCK_CHANGE[sym];
            const isSelected = sym === selectedSymbol;
            const isPos = change >= 0;

            return (
              <motion.button
                key={sym}
                onClick={() => onSelect(sym)}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                whileHover={{ x: 2, backgroundColor: 'var(--bg-elevated)' }}
                className={`w-full flex items-center justify-between px-3 py-2.5 transition-colors ${
                  isSelected
                    ? 'bg-[var(--bg-interactive)] border-r-2 border-r-[var(--brand)]'
                    : ''
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isSelected ? 'bg-[var(--brand-dim)] text-[var(--brand)]' : 'bg-[var(--bg-interactive)] text-[var(--text-secondary)]'
                  }`}>
                    {contract.underlyingTicker.slice(0, 2)}
                  </div>
                  <div className="text-left">
                    <p className={`text-[13px] font-semibold leading-none ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                      {contract.underlyingTicker}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Perpetual</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-mono font-semibold text-[var(--text-primary)]">${price.toFixed(2)}</p>
                  <p className={`text-[10px] font-medium mt-0.5 ${isPos ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                    {isPos ? '+' : ''}{change.toFixed(2)}%
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="divider mx-3" />

      {/* Open position summary */}
      {position ? (
        <motion.div
          className="py-3"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <p className="section-label">Open Position</p>
          <div className="mx-3 mt-2 card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[var(--text-secondary)]">{position.symbol}</span>
              <div className="flex items-center gap-1.5">
                <GlowPulse color={position.side === 'LONG' ? 'green' : 'red'} size={7} />
                <span className={`badge ${position.side === 'LONG' ? 'badge-green' : 'badge-red'}`}>{position.side}</span>
              </div>
            </div>
            <div className="data-row">
              <span className="stat-label">Qty</span>
              <span className="stat-value price-display">{position.quantity}</span>
            </div>
            <div className="data-row">
              <span className="stat-label">Entry</span>
              <span className="stat-value price-display">${position.entryPrice.toFixed(2)}</span>
            </div>
            <div className="data-row">
              <span className="stat-label">Leverage</span>
              <span className="text-[var(--brand)] font-bold text-[13px]">{position.leverage}×</span>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="py-3">
          <p className="section-label">Position</p>
          <div className="mx-3 mt-2">
            <p className="text-[11px] text-[var(--text-muted)] mb-2">No open position</p>
            <AnimatedButton
              variant="ghost"
              size="sm"
              onClick={onOpenExplainer}
              className="w-full justify-start"
            >
              <Plus className="w-3.5 h-3.5" /> New Position
            </AnimatedButton>
          </div>
        </div>
      )}

      <div className="divider mx-3" />

      {/* Account */}
      <div className="py-3">
        <p className="section-label">Account</p>
        <div className="px-3 mt-2 space-y-2">
          {[
            ['Total Equity', `$${balance.totalEquityUsd.toFixed(2)}`],
            ['Available', `$${balance.availableUsd.toFixed(2)}`],
            ['Committed', `$${balance.committedMarginUsd.toFixed(2)}`],
            ['INR equiv.', `₹${(balance.availableUsd * balance.inrExchangeRate).toFixed(0)}`],
          ].map(([k, v]) => (
            <motion.div
              key={k}
              className="flex items-center justify-between"
              whileHover={{ x: 2 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <span className="text-[11px] text-[var(--text-secondary)]">{k}</span>
              <span className="text-[12px] font-mono font-semibold text-[var(--text-primary)]">{v}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-auto px-3 pb-3 pt-2 text-[10px] text-[var(--text-muted)] leading-relaxed border-t border-[var(--border-subtle)]">
        ⚠ Fictional sample data. Prototype only. Not a real venue.
      </div>
    </aside>
  );
}
