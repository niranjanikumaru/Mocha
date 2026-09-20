'use client';

import { UserAccountBalance } from '../types/trading';
import { TrendingUp, Bell, Settings, Wifi, WifiOff, ChevronDown } from 'lucide-react';

interface HeaderProps {
  balance: UserAccountBalance;
  feedAge: number;
  isSimulated: boolean;
}

export default function Header({ balance, feedAge, isSimulated }: HeaderProps) {
  const isStale = feedAge > 500;

  return (
    <header className="terminal-header flex items-center justify-between px-5 bg-[var(--bg-surface)] border-b border-[var(--border)] z-20">

      {/* Left — brand */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-[var(--brand)] flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-[15px] tracking-tight text-[var(--text-primary)]">MochaTrade</span>
        </div>

        {/* Nav tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {['Positions', 'Orders', 'History', 'Markets'].map((tab, i) => (
            <button key={tab} className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
              i === 0
                ? 'bg-[var(--bg-interactive)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-interactive)]'
            }`}>
              {tab}
            </button>
          ))}
          <a
            href="/market-night"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold bg-[var(--brand-dim)] text-[var(--brand)] border border-[var(--brand-border)] hover:bg-[rgba(245,158,11,0.2)] transition-all ml-2"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" />
            <span>Market Night</span>
            <span className="badge badge-brand text-[9px] py-0 px-1 font-mono">CREW PASS</span>
          </a>
        </nav>
      </div>

      {/* Right — status + balance */}
      <div className="flex items-center gap-4">
        {/* Prototype / sim badge */}
        {isSimulated && (
          <span className="badge badge-brand">Simulation</span>
        )}

        {/* Feed status */}
        <div className="flex items-center gap-1.5">
          {isStale ? (
            <><WifiOff className="w-3.5 h-3.5 text-[var(--red)]" /><span className="text-[11px] text-[var(--red)] font-medium">Feed stale</span></>
          ) : (
            <><div className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" /><span className="text-[11px] text-[var(--text-secondary)]">Live · {feedAge}ms</span></>
          )}
        </div>

        {/* Rate */}
        <span className="hidden lg:inline text-[11px] text-[var(--text-secondary)]">₹{balance.inrExchangeRate.toFixed(2)}/USD</span>

        {/* Balance pill */}
        <div className="flex items-center gap-3 bg-[var(--bg-interactive)] border border-[var(--border)] rounded-lg px-3 py-1.5">
          <div>
            <p className="text-[10px] text-[var(--text-secondary)] leading-none mb-0.5">Available</p>
            <p className="text-[13px] font-semibold text-[var(--text-primary)] price-display leading-none">${balance.availableUsd.toFixed(2)}</p>
          </div>
          <div className="w-px h-6 bg-[var(--border)]" />
          <div>
            <p className="text-[10px] text-[var(--text-secondary)] leading-none mb-0.5">Margin</p>
            <p className="text-[13px] font-semibold text-[var(--brand)] price-display leading-none">${balance.committedMarginUsd.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
