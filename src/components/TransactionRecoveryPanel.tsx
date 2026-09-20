'use client';

import { OrderStateRecord, OrderExecutionStatus } from '../types/trading';
import { CheckCircle2, Clock, AlertCircle, RefreshCw, XCircle, Loader2, ShieldCheck } from 'lucide-react';

interface TransactionRecoveryPanelProps {
  order: OrderStateRecord | null;
  onReconcile: () => void;
  onConfirmClose: () => void;
  isReconciling: boolean;
  duplicateAttempts: number;
}

const STATUS_META: Record<OrderExecutionStatus, { label: string; color: string; icon: React.ReactNode }> = {
  IDLE: { label: 'No Active Order', color: 'text-zinc-400', icon: <Clock className="w-4 h-4 text-zinc-500" /> },
  SUBMITTING: { label: 'Submitting to Venue…', color: 'text-amber-400', icon: <Loader2 className="w-4 h-4 text-amber-400 animate-spin" /> },
  ACK_LOST_PENDING_RECON: { label: 'Unresolved — Awaiting Reconciliation', color: 'text-rose-400', icon: <AlertCircle className="w-4 h-4 text-rose-400 animate-pulse" /> },
  PARTIALLY_FILLED: { label: 'Partially Filled', color: 'text-amber-400', icon: <ShieldCheck className="w-4 h-4 text-amber-400" /> },
  FILLED: { label: 'Fully Filled', color: 'text-emerald-400', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
  CANCELLED: { label: 'Cancelled', color: 'text-zinc-400', icon: <XCircle className="w-4 h-4 text-zinc-500" /> },
  REJECTED: { label: 'Rejected by Venue', color: 'text-rose-400', icon: <XCircle className="w-4 h-4 text-rose-400" /> },
};

function fmt(ts?: number) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export default function TransactionRecoveryPanel({
  order, onReconcile, onConfirmClose, isReconciling, duplicateAttempts,
}: TransactionRecoveryPanelProps) {
  if (!order) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 text-center text-zinc-600 text-sm">
        No active order. Submit a close to begin tracking.
      </div>
    );
  }

  const meta = STATUS_META[order.status];
  const isUnresolved = order.status === 'ACK_LOST_PENDING_RECON';
  const isPartial = order.status === 'PARTIALLY_FILLED';
  const isFilled = order.status === 'FILLED';
  const canClose = !isUnresolved && !isReconciling && !isFilled;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          {meta.icon}
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Order Status</p>
            <p className={`font-bold text-sm mt-0.5 ${meta.color}`}>{meta.label}</p>
          </div>
        </div>
        <div className="text-right text-xs text-zinc-600">
          <p>Request ID</p>
          <p className="text-zinc-400 font-mono">{order.requestId.slice(0, 16)}…</p>
        </div>
      </div>

      {/* Unresolved warning banner */}
      {isUnresolved && (
        <div className="mx-4 mt-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-300 space-y-1">
              <p className="font-semibold text-rose-400">Order outcome is unconfirmed</p>
              <p>The venue may have filled this order, but the acknowledgement was not received. Do not submit another close order — it may result in an opposite position.</p>
              <p className="text-rose-500">Reconcile with the venue first to retrieve the verified fill state.</p>
            </div>
          </div>
        </div>
      )}

      {/* Fill summary */}
      <div className="grid grid-cols-3 gap-3 px-5 py-4">
        <div className="bg-zinc-800/60 rounded-xl p-3 border border-zinc-700">
          <p className="text-zinc-500 text-xs mb-1">Requested Qty</p>
          <p className="text-white font-bold text-xl">{order.requestedQty}</p>
          <p className="text-zinc-500 text-xs">contracts</p>
        </div>
        <div className="bg-zinc-800/60 rounded-xl p-3 border border-zinc-700">
          <p className="text-zinc-500 text-xs mb-1">Filled Qty</p>
          <p className={`font-bold text-xl ${isUnresolved ? 'text-zinc-600' : 'text-emerald-400'}`}>
            {isUnresolved ? '?' : order.filledQty}
          </p>
          {!isUnresolved && order.avgFillPrice > 0 && (
            <p className="text-zinc-500 text-xs">@ ${order.avgFillPrice.toFixed(2)}</p>
          )}
        </div>
        <div className="bg-zinc-800/60 rounded-xl p-3 border border-zinc-700">
          <p className="text-zinc-500 text-xs mb-1">Remaining Exposure</p>
          <p className={`font-bold text-xl ${order.remainingQty > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {isUnresolved ? '?' : order.remainingQty}
          </p>
          <p className="text-zinc-500 text-xs">{isUnresolved ? 'pending recon' : 'contracts live'}</p>
        </div>
      </div>

      {/* Partial fill note */}
      {isPartial && (
        <div className="mx-4 mb-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
          <strong className="text-amber-400">Partial fill:</strong> {order.filledQty} of {order.requestedQty} contracts were closed at ${order.avgFillPrice.toFixed(2)}. You still have {order.remainingQty} contracts open. Review before submitting another order.
        </div>
      )}

      {/* Duplicate protection */}
      {duplicateAttempts > 0 && (
        <div className="mx-4 mb-3 p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span><strong className="text-emerald-400">{duplicateAttempts}</strong> duplicate submission{duplicateAttempts > 1 ? 's' : ''} blocked. The same idempotency key prevents double-execution.</span>
        </div>
      )}

      {/* Audit trail */}
      <div className="px-5 pb-3">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Verified Audit Trail</p>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {order.auditTrail.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 text-xs">
              <div className="shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-zinc-600 mt-0.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-600">{fmt(entry.timestamp)}</span>
                  <span className="text-amber-400/80 font-medium">{entry.stage}</span>
                </div>
                <p className="text-zinc-400 leading-relaxed">{entry.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timestamps */}
      <div className="flex items-center gap-4 px-5 pb-3 text-xs text-zinc-600">
        <span>Sent: {fmt(order.timestampSent)}</span>
        <span>Acked: {fmt(order.timestampAcked)}</span>
        <span>Venue: {fmt(order.lastVenueTimestamp)}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-5 pb-5">
        {isUnresolved && (
          <button
            onClick={onReconcile}
            disabled={isReconciling}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-semibold hover:bg-amber-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isReconciling
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Reconciling…</>
              : <><RefreshCw className="w-4 h-4" /> Reconcile with Venue</>}
          </button>
        )}
        {canClose && (
          <button
            onClick={onConfirmClose}
            className="flex-1 py-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 font-semibold hover:bg-rose-500/25 transition-colors"
          >
            Confirm Close Remaining
          </button>
        )}
        {isFilled && (
          <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Fully Settled
          </div>
        )}
      </div>
    </div>
  );
}
