'use client';

import { motion } from 'framer-motion';
import { UserAccountBalance } from '../types/trading';
import { Bell, Settings, WifiOff } from 'lucide-react';
import GlowPulse from './ui/glow-pulse';
import ShimmerText from './ui/shimmer-text';

interface HeaderProps {
  balance: UserAccountBalance;
  feedAge: number;
  isSimulated: boolean;
}

export default function Header({ balance, feedAge, isSimulated }: HeaderProps) {
  const isStale = feedAge > 500;

  return (
    <header className="terminal-header flex items-center justify-between px-5 bg-[var(--bg-surface)] border-b border-[var(--border)] z-20 relative overflow-hidden">
      {/* Subtle top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--brand)] to-transparent opacity-40" />

      <span className="terminal-status-title">Trading session</span>

      {/* Right — status + balance */}
      <div className="flex items-center gap-4">
        {isSimulated && (
          <span className="badge badge-brand">Simulation</span>
        )}

        {/* Feed status */}
        <div className="flex items-center gap-1.5">
          {isStale ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-[var(--red)]" />
              <span className="text-[11px] text-[var(--red)] font-medium">Feed stale</span>
            </>
          ) : (
            <>
              <GlowPulse color="green" size={8} />
              <ShimmerText className="text-[11px]" duration={3}>
                Live · {feedAge}ms
              </ShimmerText>
            </>
          )}
        </div>

        {/* Rate */}
        <span className="hidden lg:inline text-[11px] text-[var(--text-secondary)]">
          ₹{balance.inrExchangeRate.toFixed(2)}/USD
        </span>

        {/* Balance pill */}
        <motion.div
          className="flex items-center gap-3 bg-[var(--bg-interactive)] border border-[var(--border)] rounded-lg px-3 py-1.5"
          whileHover={{ borderColor: 'var(--border-accent)' }}
        >
          <div>
            <p className="text-[10px] text-[var(--text-secondary)] leading-none mb-0.5">Available</p>
            <p className="text-[13px] font-semibold text-[var(--text-primary)] price-display leading-none">
              ${balance.availableUsd.toFixed(2)}
            </p>
          </div>
          <div className="w-px h-6 bg-[var(--border)]" />
          <div>
            <p className="text-[10px] text-[var(--text-secondary)] leading-none mb-0.5">Margin</p>
            <p className="text-[13px] font-semibold text-[var(--brand)] price-display leading-none">
              ${balance.committedMarginUsd.toFixed(2)}
            </p>
          </div>
        </motion.div>

        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Bell className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 45 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}
