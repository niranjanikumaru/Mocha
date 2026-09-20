import React from 'react';
import { 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  WifiOff, 
  AlertTriangle,
  Lock
} from 'lucide-react';
import type { Position, FeedHealthStatus } from '../../core/types/contract';

interface ActivePositionsProps {
  positions: Position[];
  feedStatus: FeedHealthStatus;
  onClosePosition: (id: string) => void;
}

export const ActivePositions: React.FC<ActivePositionsProps> = ({
  positions,
  feedStatus,
  onClosePosition,
}) => {
  const isFeedInterrupted = feedStatus !== 'live';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Briefcase className="h-5 w-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Private Account Positions (Isolated Venue Ledger)</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            Open: {positions.length}
          </span>
        </div>
      </div>

      {isFeedInterrupted && (
        <div className="p-3 bg-amber-950/30 border border-amber-600/40 rounded-lg text-xs text-amber-300 flex items-start space-x-2">
          <WifiOff className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <strong>Price Feed Interrupted:</strong> Real-time mark valuation and liquidation engine are safely suspended. Position collateral remains secure under venue fallback policy.
          </div>
        </div>
      )}

      {positions.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 font-mono">
          No open positions. Use the Trade Preview panel to execute a trade and mint a versioned receipt.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2 px-2">Market</th>
                <th className="py-2 px-2">Side & Size</th>
                <th className="py-2 px-2">Entry Price</th>
                <th className="py-2 px-2">Mark Price</th>
                <th className="py-2 px-2">Margin</th>
                <th className="py-2 px-2">Unrealized PnL</th>
                <th className="py-2 px-2">Liq. Price</th>
                <th className="py-2 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {positions.map((pos) => {
                const isProfit = pos.unrealizedPnl >= 0;
                return (
                  <tr key={pos.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-2 font-sans font-bold text-white">
                      {pos.contractId}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        pos.side === 'buy' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                      }`}>
                        {pos.side} {pos.size} ({pos.leverage}x)
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-200">
                      ${pos.entryPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-slate-200">
                      {isFeedInterrupted ? 'Unavailable' : `$${pos.currentMarkPrice.toFixed(2)}`}
                    </td>
                    <td className="py-3 px-2 text-slate-300">
                      ${pos.marginAllocated.toFixed(2)}
                    </td>
                    <td className="py-3 px-2">
                      {isFeedInterrupted ? (
                        <span className="text-slate-500">Suspended</span>
                      ) : (
                        <span className={`font-bold flex items-center space-x-1 ${
                          isProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          <span>
                            {isProfit ? '+' : ''}${pos.unrealizedPnl.toFixed(2)} ({pos.unrealizedPnlPct.toFixed(1)}%)
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-amber-400 font-semibold">
                      ${pos.liquidationPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => onClosePosition(pos.id)}
                        disabled={isFeedInterrupted}
                        className={`px-2.5 py-1 rounded text-[11px] font-sans transition-colors ${
                          isFeedInterrupted
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-slate-800 hover:bg-rose-950/60 text-slate-200 hover:text-rose-300 border border-slate-700'
                        }`}
                      >
                        Close
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
