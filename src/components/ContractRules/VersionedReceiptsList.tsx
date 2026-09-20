import React, { useState } from 'react';
import { 
  FileText, 
  Hash, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  Eye, 
  ShieldCheck,
  GitCommit,
  Lock
} from 'lucide-react';
import type { TransactionReceipt } from '../../core/types/contract';

interface VersionedReceiptsListProps {
  receipts: TransactionReceipt[];
}

export const VersionedReceiptsList: React.FC<VersionedReceiptsListProps> = ({
  receipts,
}) => {
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionReceipt | null>(null);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Versioned Transaction Receipts & Audit Ledger</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Every executed order freezes its exact contract rule snapshot into an immutable cryptographic receipt.
          </p>
        </div>
        <span className="text-xs font-mono px-3 py-1 bg-slate-800 text-slate-300 rounded-lg border border-slate-700">
          Total Minted Receipts: {receipts.length}
        </span>
      </div>

      {/* Receipts Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-medium">
              <th className="py-2.5 px-3">Receipt ID</th>
              <th className="py-2.5 px-3">Contract</th>
              <th className="py-2.5 px-3">Side & Size</th>
              <th className="py-2.5 px-3">Exec Price</th>
              <th className="py-2.5 px-3">Margin Used</th>
              <th className="py-2.5 px-3">Fees Paid</th>
              <th className="py-2.5 px-3">Frozen Rule Version</th>
              <th className="py-2.5 px-3 text-right">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {receipts.map((rcp) => (
              <tr key={rcp.receiptId} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-3">
                  <div className="flex items-center space-x-1.5">
                    <Hash className="h-3.5 w-3.5 text-amber-400" />
                    <span className="font-bold text-white">{rcp.receiptId}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
                    {new Date(rcp.timestamp).toLocaleTimeString()}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className="font-sans font-semibold text-slate-200">{rcp.contractId}</span>
                </td>
                <td className="py-3 px-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    rcp.side === 'buy' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                  }`}>
                    {rcp.side} {rcp.size}
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-200">
                  ${rcp.executionPrice.toFixed(2)}
                </td>
                <td className="py-3 px-3 text-slate-300">
                  ${rcp.marginCommitted.toFixed(2)} ({rcp.leverage}x)
                </td>
                <td className="py-3 px-3 text-slate-300">
                  ${rcp.feesPaid.toFixed(3)}
                </td>
                <td className="py-3 px-3">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                    rcp.ruleVersionSnapshot.fundingSchedule.ruleVersion === 'v1.0.0'
                      ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                      : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/50'
                  }`}>
                    {rcp.ruleVersionSnapshot.fundingSchedule.ruleVersion}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={() => setSelectedReceipt(rcp)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-sans text-[11px] flex items-center space-x-1 ml-auto"
                  >
                    <Eye className="h-3 w-3" />
                    <span>View Snapshot</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Snapshot Inspector Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Frozen Execution Snapshot: {selectedReceipt.receiptId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-3 font-mono">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div><strong>Contract ID:</strong> {selectedReceipt.contractId}</div>
                <div><strong>Execution Price:</strong> ${selectedReceipt.executionPrice.toFixed(2)}</div>
                <div><strong>Notional Value:</strong> ${selectedReceipt.notionalValue.toFixed(2)}</div>
                <div><strong>Fees Paid:</strong> ${selectedReceipt.feesPaid.toFixed(4)}</div>
                <div><strong>Feed Status at Fill:</strong> {selectedReceipt.providerSnapshot.feedStatusAtExecution}</div>
                <div><strong>Digest:</strong> {selectedReceipt.digestHash.slice(0, 16)}...</div>
              </div>

              <div>
                <h4 className="font-sans font-bold text-amber-400 mb-1">
                  Frozen Contract Rule Version: {selectedReceipt.ruleVersionSnapshot.fundingSchedule.ruleVersion}
                </h4>
                <p className="text-[11px] font-sans text-slate-400 mb-2">
                  Even if contract rules are later upgraded to v2.0 or v3.0, this historical receipt strictly preserves the original calculation parameters:
                </p>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] overflow-x-auto text-emerald-400">
                  {JSON.stringify(selectedReceipt.ruleVersionSnapshot, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
