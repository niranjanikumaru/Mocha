'use client';

import { motion } from 'framer-motion';
import { UserAccountBalance } from '../types/trading';
import { TrendingUp, Bell, Settings, WifiOff } from 'lucide-react';
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

      {/* Left — brand */}
      <div className="flex items-center gap-6">
        <motion.div
          className="flex items-center gap-2.5"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className="w-7 h-7 rounded-lg bg-[var(--brand)] flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.5)]">
            <TrendingUp className="w-4 h-4 text-black" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-[15px] tracking-tight text-[var(--text-primary)]">
            Mocha<span className="text-[var(--brand)]">Trade</span>
          </span>
        </motion.div>

        {/* Nav tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {['Positions', 'Orders', 'History', 'Markets'].map((tab, i) => (
            <motion.button
              key={tab}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                i === 0
                  ? 'bg-[var(--bg-interactive)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-interactive)]'
              }`}
            >
              {tab}
            </motion.button>
          ))}
          <motion.a
            href="/market-night"
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold bg-[var(--brand-dim)] text-[var(--brand)] border border-[var(--brand-border)] hover:bg-[rgba(245,158,11,0.2)] transition-all ml-2"
          >
            <GlowPulse color="brand" size={8} />
            <span>Market Night</span>
            <span className="badge badge-brand text-[9px] py-0 px-1 font-mono">CREW PASS</span>
          </motion.a>
        </nav>
      </div>

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
