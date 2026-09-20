'use client';

import { useState } from 'react';
import { OrderStateRecord, UserAccountBalance, PostTradeSurvey } from '../types/trading';
import { CheckCircle2, Download, MessageSquare, X } from 'lucide-react';

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
  MARGIN_BUFFER: 'Margin & Buffer',
  EXECUTION_LATENCY: 'Execution Speed',
  FEES: 'Fees & Costs',
  RECONCILIATION: 'Order Recovery',
  OTHER: 'Other',
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

  const pnlUsd = order.avgFillPrice > 0 ? order.filledQty * order.avgFillPrice : 0;
  const withdrawalSimInr = balance.availableUsd * balance.inrExchangeRate;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-white font-bold text-base">Transaction Receipt</h2>
              <p className="text-zinc-500 text-xs">Verified execution summary</p>
            </div>
          </div>
          <button onClick={onDismiss} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Execution details */}
          <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4 space-y-2 text-sm">
            {[
              ['Contract', order.symbol],
              ['Side', order.side],
              ['Requested Qty', `${order.requestedQty} contracts`],
              ['Filled Qty', `${order.filledQty} contracts`],
              ['Avg Fill Price', order.avgFillPrice > 0 ? `$${order.avgFillPrice.toFixed(2)}` : '—'],
              ['Remaining Exposure', `${order.remainingQty} contracts`],
              ['Order Submitted', fmt(order.timestampSent)],
              ['Venue Confirmed', fmt(order.timestampAcked)],
              ['Request ID', order.requestId],
              ['Idempotency Key', order.idempotencyKey],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-zinc-400">{label}</span>
                <span className={`text-white font-medium font-mono text-xs truncate ml-2 max-w-[55%] text-right ${
                  label === 'Remaining Exposure' && order.remainingQty > 0 ? 'text-amber-400' : ''
                }`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Balance snapshot */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-3">
              <p className="text-zinc-500 text-xs mb-1">Available Funds</p>
              <p className="text-emerald-400 font-bold text-lg">${balance.availableUsd.toFixed(2)}</p>
              <p className="text-zinc-600 text-xs">₹{(balance.availableUsd * balance.inrExchangeRate).toFixed(0)} est.</p>
            </div>
            <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-3">
              <p className="text-zinc-500 text-xs mb-1">Committed Margin</p>
              <p className="text-amber-400 font-bold text-lg">${balance.committedMarginUsd.toFixed(2)}</p>
              <p className="text-zinc-600 text-xs">₹{(balance.committedMarginUsd * balance.inrExchangeRate).toFixed(0)} est.</p>
            </div>
          </div>

          {/* Simulated withdrawal tracker */}
          <div className="bg-zinc-800/40 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-400">
            <div className="flex items-center gap-2 mb-1.5">
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span className="font-medium text-zinc-300">Simulated INR Withdrawal Track</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between"><span>Available for withdrawal</span><span className="text-emerald-400">₹{withdrawalSimInr.toFixed(0)}</span></div>
              <div className="flex justify-between"><span>Est. settlement time</span><span className="text-zinc-300">T+1 (next business day)</span></div>
              <div className="flex justify-between"><span>Exchange rate used</span><span className="text-zinc-300">₹{balance.inrExchangeRate.toFixed(2)}/USD</span></div>
            </div>
            <p className="text-zinc-600 mt-1.5 italic">Simulated only — not a real banking operation.</p>
          </div>

          {/* Feedback */}
          {!showSurvey ? (
            <button
              onClick={() => setShowSurvey(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              What surprised you? (Optional feedback)
            </button>
          ) : (
            <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-4 space-y-3">
              <p className="text-white font-semibold text-sm">What was your experience?</p>
              <div className="grid grid-cols-4 gap-2">
                {(['CONFIDENT', 'CLEAR', 'SURPRISED', 'CONFUSED'] as PostTradeSurvey['rating'][]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRating(r)}
                    className={`py-1.5 text-xs rounded-lg border transition-colors ${
                      rating === r
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : 'border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                    }`}
                  >{r}</button>
                ))}
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PostTradeSurvey['category'])}
                className="w-full bg-zinc-900 border border-zinc-700 text-sm text-zinc-300 rounded-lg px-3 py-2"
              >
                {SURVEY_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe what surprised you or confused you..."
                className="w-full bg-zinc-900 border border-zinc-700 text-sm text-zinc-300 rounded-lg px-3 py-2 h-16 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                onClick={handleSubmit}
                className="w-full py-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-semibold hover:bg-amber-500/25 transition-colors"
              >
                Submit Feedback
              </button>
              {(rating === 'CONFUSED' || rating === 'SURPRISED') && (
                <p className="text-xs text-zinc-500">A support ticket will be auto-created for your response.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
