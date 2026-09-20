'use client';

import { UserAccountBalance } from '../types/trading';
import { Wifi, WifiOff, TrendingUp } from 'lucide-react';

interface HeaderProps {
  balance: UserAccountBalance;
  feedAge: number; // ms since last price update
  isSimulated: boolean;
}

export default function Header({ balance, feedAge, isSimulated }: HeaderProps) {
  const isStale = feedAge > 3000;
  const availableInr = balance.availableUsd * balance.inrExchangeRate;
  const committedInr = balance.committedMarginUsd * balance.inrExchangeRate;

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-zinc-950 border-b border-zinc-800">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-black" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">MochaTrade</span>
        </div>
        {isSimulated && (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-400/15 text-amber-400 border border-amber-400/30">
            SIMULATION MODE
          </span>
        )}
        <span className="hidden sm:inline text-xs text-zinc-500 ml-2">
          ⚠ Fictional contract data · Prototype only
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-5">
        {/* Feed freshness */}
        <div className="flex items-center gap-1.5 text-xs">
          {isStale ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-400 font-medium">Feed delayed {(feedAge / 1000).toFixed(0)}s</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-zinc-400">{feedAge}ms ago</span>
            </>
          )}
        </div>

        {/* INR rate */}
        <div className="hidden md:block text-xs text-zinc-500">
          1 USD = ₹{balance.inrExchangeRate.toFixed(2)}
        </div>

        {/* Balance breakdown */}
        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <p className="text-zinc-500">Available</p>
            <p className="text-emerald-400 font-semibold">${balance.availableUsd.toFixed(2)}</p>
            <p className="text-zinc-600">₹{availableInr.toFixed(0)}</p>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="text-right">
            <p className="text-zinc-500">Committed</p>
            <p className="text-amber-400 font-semibold">${balance.committedMarginUsd.toFixed(2)}</p>
            <p className="text-zinc-600">₹{committedInr.toFixed(0)}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
