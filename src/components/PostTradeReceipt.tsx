'use client';

import { useState } from 'react';
import { OrderStateRecord, UserAccountBalance, PostTradeSurvey } from '../types/trading';
import { CheckCircle2, Download, MessageSquare, X, ShieldCheck, ArrowRight } from 'lucide-react';

interface PostTradeReceiptProps {
  order: OrderStateRecord;
  balance: UserAccountBalance;
  onSurveySubmit: (survey: PostTradeSurvey) => void;
  onDismiss: () => void;
}

const SURVEY_CATEGORIES: PostTradeSurvey['category'][] = [
  'MARGIN_BUFFER', 'EXECUTION_LATENCY', 'FEES', 'RECONCILIATION', 'OTHER'
];

const CATEGORY_LABELS: Record<PostTradeSurvey['category'], string> = {
  MARGIN_BUFFER: 'Margin & Health Buffer',
  EXECUTION_LATENCY: 'Execution Latency',
  FEES: 'Fees & Funding Costs',
  RECONCILIATION: 'Recovery & Partial Fills',
  OTHER: 'General Feedback',
};

function fmt(ts?: number) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' });
}

export default function PostTradeReceipt({ order, balance, onSurveySubmit, onDismiss }: PostTradeReceiptProps) {
  const [showSurvey, setShowSurvey] = useState(false);
  const [rating, setRating] = useState<PostTradeSurvey['rating']>('CLEAR');
  const [category, setCategory] = useState<PostTradeSurvey['category']>('MARGIN_BUFFER');
  const [notes, setNotes] = useState('');

  function handleSubmit() {
    const survey: PostTradeSurvey = {
      rating, category, surpriseNotes: notes,
      supportTicketCreated: rating === 'CONFUSED' || rating === 'SURPRISED',
      ticketId: (rating === 'CONFUSED' || rating === 'SURPRISED')
        ? 'TKT-' + Math.random().toString(36).slice(2, 8).toUpperCase()
        : undefined,
    };
    onSurveySubmit(survey);
    setShowSurvey(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm fade-in">
      <div className="relative w-full max-w-lg card-elevated shadow-2xl border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[var(--green-dim)] flex items-center justify-center text-[var(--green)]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[var(--text-primary)]">Execution Receipt</h2>
              <p className="text-[11px] text-[var(--text-secondary)]">Settled Trade Record & Verified Outcome</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Order execution summary table */}
          <div className="card p-3.5 bg-[var(--bg-elevated)] border-[var(--border)] space-y-1.5 text-[12px]">
            {[
              ['Contract', order.symbol],
              ['Side', order.side],
              ['Filled Volume', `${order.filledQty} of ${order.requestedQty} contracts`],
              ['Avg Fill Price', order.avgFillPrice > 0 ? `$${order.avgFillPrice.toFixed(2)}` : '—'],
              ['Remaining Live', `${order.remainingQty} contracts`],
              ['Venue Time', fmt(order.timestampAcked)],
              ['Deduplication Key', order.idempotencyKey],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-0.5">
                <span className="text-[var(--text-secondary)]">{label}</span>
                <span className="font-mono font-semibold text-[var(--text-primary)] truncate max-w-[60%] text-right">{value}</span>
              </div>
            ))}
          </div>

          {/* Account snapshot */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="card p-3 bg-[var(--bg-elevated)] border-[var(--border)]">
              <span className="stat-label">Available Balance</span>
              <p className="text-[16px] font-mono font-bold text-[var(--green)] mt-0.5">
                ${balance.availableUsd.toFixed(2)}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] font-mono">
                ≈ ₹{(balance.availableUsd * balance.inrExchangeRate).toFixed(0)}
              </p>
            </div>
            <div className="card p-3 bg-[var(--bg-elevated)] border-[var(--border)]">
              <span className="stat-label">Committed Margin</span>
              <p className="text-[16px] font-mono font-bold text-[var(--brand)] mt-0.5">
                ${balance.committedMarginUsd.toFixed(2)}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                {order.remainingQty > 0 ? 'Residual position active' : 'Zero margin locked'}
              </p>
            </div>
          </div>

          {/* Feedback survey trigger */}
          {!showSurvey ? (
            <button
              onClick={() => setShowSurvey(true)}
              className="btn btn-ghost btn-sm btn-full"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[var(--brand)]" />
              <span>Did this trade execute as you expected? (Survey)</span>
            </button>
          ) : (
            <div className="card p-3.5 bg-[var(--bg-interactive)] border-[var(--border)] space-y-3 fade-in">
              <p className="font-semibold text-[12px] text-[var(--text-primary)]">Post-Execution Clarity Check</p>

              <div>
                <span className="stat-label block mb-1">Clarity Rating</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['CLEAR', 'SURPRISED', 'CONFUSED'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRating(r)}
                      className={`py-1.5 rounded text-[11px] font-bold border transition-all ${
                        rating === r
                          ? 'bg-[var(--brand-dim)] border-[var(--brand)] text-[var(--brand)]'
                          : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {r === 'CLEAR' ? 'Clear' : r === 'SURPRISED' ? 'Surprised' : 'Confused'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="stat-label block mb-1">Topic</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PostTradeSurvey['category'])}
                  className="input-field text-[12px]"
                >
                  {SURVEY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>

              <div>
                <span className="stat-label block mb-1">Feedback / Unexpected outcomes</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tell us if fees, margin requirements or latency differed from expectations..."
                  rows={2}
                  className="input-field text-[12px] resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button onClick={handleSubmit} className="btn btn-brand btn-sm flex-1">
                  Submit Feedback
                </button>
                <button onClick={() => setShowSurvey(false)} className="btn btn-ghost btn-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Dismiss CTA */}
          <button onClick={onDismiss} className="btn btn-brand btn-full py-2.5 text-[13px]">
            Return to Trading Terminal
          </button>
        </div>
      </div>
    </div>
  );
}
