'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { OrderStateRecord, OrderExecutionStatus } from '../types/trading';
import { CheckCircle2, Clock, AlertCircle, RefreshCw, XCircle, Loader2, ShieldCheck } from 'lucide-react';
import { BorderBeam } from './ui/border-beam';
import AnimatedButton from './ui/animated-button';
import SpotlightCard from './ui/spotlight-card';
import GlowPulse from './ui/glow-pulse';

interface TransactionRecoveryPanelProps {
  order: OrderStateRecord | null;
  onReconcile: () => void;
  onConfirmClose: () => void;
  isReconciling: boolean;
  duplicateAttempts: number;
}

const STATUS_META: Record<OrderExecutionStatus, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  IDLE:                  { label: 'Idle',                    badgeClass: 'badge-muted',   icon: <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" /> },
  SUBMITTING:            { label: 'Submitting…',             badgeClass: 'badge-yellow',  icon: <Loader2 className="w-3.5 h-3.5 text-[var(--yellow)] animate-spin" /> },
  ACK_LOST_PENDING_RECON:{ label: 'Unresolved — Reconciling',badgeClass: 'badge-red',     icon: <AlertCircle className="w-3.5 h-3.5 text-[var(--red)] animate-pulse" /> },
  PARTIALLY_FILLED:      { label: 'Partially Filled',        badgeClass: 'badge-yellow',  icon: <ShieldCheck className="w-3.5 h-3.5 text-[var(--yellow)]" /> },
  FILLED:                { label: 'Fully Settled',           badgeClass: 'badge-green',   icon: <CheckCircle2 className="w-3.5 h-3.5 text-[var(--green)]" /> },
  CANCELLED:             { label: 'Cancelled',               badgeClass: 'badge-muted',   icon: <XCircle className="w-3.5 h-3.5 text-[var(--text-muted)]" /> },
  REJECTED:              { label: 'Rejected',                badgeClass: 'badge-red',     icon: <XCircle className="w-3.5 h-3.5 text-[var(--red)]" /> },
};

function fmt(ts?: number) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

const statVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.25 } }),
};

export default function TransactionRecoveryPanel({
  order, onReconcile, onConfirmClose, isReconciling, duplicateAttempts,
}: TransactionRecoveryPanelProps) {
  if (!order) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card p-4 text-center text-[12px] text-[var(--text-muted)] bg-[var(--bg-surface)]"
      >
        No active orders. Executed transaction state &amp; audit trail will appear here.
      </motion.div>
    );
  }

  const meta = STATUS_META[order.status];
  const isUnresolved = order.status === 'ACK_LOST_PENDING_RECON';
  const isPartial   = order.status === 'PARTIALLY_FILLED';
  const isFilled    = order.status === 'FILLED';
  const canClose    = !isUnresolved && !isReconciling && !isFilled;

  const spotlightColor = isUnresolved
    ? 'rgba(239,68,68,0.07)'
    : isFilled
    ? 'rgba(34,197,94,0.06)'
    : 'rgba(245,158,11,0.05)';

  return (
    <SpotlightCard className="card-elevated overflow-hidden" spotlightColor={spotlightColor}>
      {/* Red beam on unresolved */}
      {isUnresolved && <BorderBeam colorFrom="#ef4444" colorTo="#f59e0b" duration={3} borderWidth={1.5} />}
      {/* Green beam on filled */}
      {isFilled && <BorderBeam colorFrom="#22c55e" colorTo="#16a34a" duration={6} borderWidth={1} />}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-2.5">
          {meta.icon}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider text-[var(--text-secondary)] uppercase">Execution Ledger</span>
              <span className={`badge ${meta.badgeClass}`}>{meta.label}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isUnresolved && <GlowPulse color="red" size={8} />}
          {isFilled && <GlowPulse color="green" size={8} />}
          <span className="text-[10px] text-[var(--text-muted)] font-mono">REQ #{order.requestId.slice(0, 10)}</span>
        </div>
      </div>

      {/* Unresolved Alert */}
      <AnimatePresence>
        {isUnresolved && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-3 bg-[rgba(239,68,68,0.12)] border-b border-[rgba(239,68,68,0.25)] flex items-start gap-2.5 overflow-hidden"
          >
            <AlertCircle className="w-4 h-4 text-[var(--red)] shrink-0 mt-0.5" />
            <div className="text-[11px] text-[var(--red)] leading-snug space-y-1">
              <p className="font-bold">ACK packet dropped in transit. Outcome unconfirmed.</p>
              <p className="text-[rgba(239,68,68,0.85)]">
                Venue received the order, but your terminal lost connection before the fill acknowledgement. Duplicate orders are locked to avoid inverse exposure.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Partial fill banner */}
      <AnimatePresence>
        {isPartial && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-3 bg-[rgba(234,179,8,0.10)] border-b border-[rgba(234,179,8,0.25)] flex items-start gap-2.5 overflow-hidden"
          >
            <ShieldCheck className="w-4 h-4 text-[var(--yellow)] shrink-0 mt-0.5" />
            <div className="text-[11px] text-[var(--yellow)] leading-snug">
              <strong className="font-semibold">Partial fill confirmed:</strong>{' '}
              {order.filledQty} of {order.requestedQty} closed at ${order.avgFillPrice.toFixed(2)}. Remaining {order.remainingQty} contracts remain live.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Duplicate dedup badge */}
      <AnimatePresence>
        {duplicateAttempts > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2 bg-[var(--bg-interactive)] border-b border-[var(--border)] flex items-center justify-between text-[11px]"
          >
            <span className="flex items-center gap-1.5 text-[var(--green)]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Idempotency Deduplication Engine</span>
            </span>
            <span className="badge badge-green font-mono">{duplicateAttempts} double-clicks blocked</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quantity & Fill Breakdown */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-[var(--bg-surface)]">
        {[
          { label: 'Requested', value: String(order.requestedQty), sub: 'contracts', color: 'text-[var(--text-primary)]' },
          { label: 'Filled',    value: isUnresolved ? '?' : String(order.filledQty), sub: order.avgFillPrice > 0 ? `@ $${order.avgFillPrice.toFixed(2)}` : 'unconfirmed', color: isUnresolved ? 'text-[var(--text-muted)]' : 'text-[var(--green)]' },
          { label: 'Remaining', value: isUnresolved ? '?' : String(order.remainingQty), sub: isUnresolved ? 'awaiting recon' : order.remainingQty > 0 ? 'open exposure' : 'zero', color: order.remainingQty > 0 ? 'text-[var(--brand)]' : 'text-[var(--green)]' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={statVariants}
            initial="hidden"
            animate="visible"
            className="card p-2.5 bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-center"
          >
            <p className="stat-label">{stat.label}</p>
            <p className={`text-[16px] font-mono font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Audit Log Timeline */}
      <div className="px-4 py-3 bg-[var(--bg-surface)] border-t border-[var(--border)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">Verified Audit Trail</span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">{order.auditTrail.length} events logged</span>
        </div>
        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
          {order.auditTrail.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-start gap-2.5 text-[11px]"
            >
              <span className="font-mono text-[10px] text-[var(--text-muted)] shrink-0 mt-0.5">{fmt(entry.timestamp)}</span>
              <div className="flex-1">
                <span className="font-semibold text-[var(--text-primary)] mr-1.5 font-mono text-[10px]">[{entry.stage}]</span>
                <span className="text-[var(--text-secondary)] leading-relaxed">{entry.details}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 bg-[var(--bg-elevated)] border-t border-[var(--border)] flex items-center gap-2">
        {isUnresolved && (
          <AnimatedButton
            variant="primary"
            size="sm"
            onClick={onReconcile}
            disabled={isReconciling}
            className="flex-1"
          >
            {isReconciling ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Querying Venue Ledger…</>
            ) : (
              <><RefreshCw className="w-3.5 h-3.5" /> Reconcile with Venue</>
            )}
          </AnimatedButton>
        )}

        {canClose && (
          <AnimatedButton
            variant="danger"
            size="sm"
            onClick={onConfirmClose}
            className="flex-1"
          >
            Close Remaining ({order.remainingQty})
          </AnimatedButton>
        )}

        {isFilled && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-[var(--green-dim)] text-[var(--green)] text-[12px] font-semibold"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Position Fully Liquidated &amp; Settled</span>
          </motion.div>
        )}
      </div>
    </SpotlightCard>
  );
}
