'use client';

import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Clock,
  ChevronRight, ArrowRight, BarChart3, DollarSign, Shield, Zap,
  RefreshCw, History, MessageSquare, Eye
} from 'lucide-react';
import { CrewTeam, MarketScenario, MarketNightUser, MemberDecision, PollInfluenceOption } from '../../types/marketNight';

interface EventWorkspaceScreenProps {
  team: CrewTeam;
  scenario: MarketScenario;
  currentUser: MarketNightUser;
  onSubmitDecision: (
    choice: MemberDecision['initialChoice'],
    rationale: string,
    margin?: number,
    leverage?: number,
    previewCompleted?: boolean,
  ) => void;
  onRevealSurprise: () => void;
  onSubmitRevision: (choice: MemberDecision['initialChoice'], rationale: string) => void;
  onCompleteScenario: () => void;
  onGoToRewards: () => void;
  onSubmitPoll?: (influence: PollInfluenceOption) => void;
}

const CHOICE_LABELS: Record<string, string> = {
  LONG_MOMENTUM: 'Explore a long position',
  SHORT_HEDGE:   'Explore a short position',
  DE_RISK_CASH:  'Sit out — too much uncertainty',
  SIT_OUT:       'Sit out',
};

const POLL_OPTS: { id: PollInfluenceOption; label: string }[] = [
  { id: 'MARKET_VIEW',        label: 'Market view' },
  { id: 'POSITION_EXPOSURE',  label: 'Position exposure' },
  { id: 'TRADING_COSTS',      label: 'Trading costs' },
  { id: 'LIQUIDATION_RISK',   label: 'Liquidation risk' },
  { id: 'INSUFFICIENT_INFO',  label: 'Insufficient information' },
];

function TxStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    AWAITING_APPROVAL: { color: 'badge-yellow',  label: 'Awaiting approval', icon: <Clock className="w-3 h-3" /> },
    SUBMITTED:         { color: 'badge-brand',   label: 'Submitted',         icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
    CHECKING_OUTCOME:  { color: 'badge-yellow',  label: 'Checking outcome',  icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
    CONFIRMED:         { color: 'badge-green',   label: 'Confirmed',         icon: <CheckCircle2 className="w-3 h-3" /> },
    REJECTED:          { color: 'badge-red',     label: 'Rejected',          icon: <AlertTriangle className="w-3 h-3" /> },
    UNCERTAIN:         { color: 'badge-yellow',  label: 'Uncertain',         icon: <AlertTriangle className="w-3 h-3" /> },
  };
  const c = cfg[status] || cfg.AWAITING_APPROVAL;
  return (
    <span className={`badge ${c.color} flex items-center gap-1`}>{c.icon}{c.label}</span>
  );
}

export default function EventWorkspaceScreen({
  team, scenario, currentUser,
  onSubmitDecision, onRevealSurprise, onSubmitRevision, onCompleteScenario, onGoToRewards,
  onSubmitPoll,
}: EventWorkspaceScreenProps) {
  const [choice, setChoice] = useState<MemberDecision['initialChoice']>('LONG_MOMENTUM');
  const [rationale, setRationale] = useState('');
  const [margin, setMargin] = useState(5000);
  const [leverage, setLeverage] = useState(2);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDone, setPreviewDone] = useState(false);
  const [revisedChoice, setRevisedChoice] = useState<MemberDecision['initialChoice']>('SHORT_HEDGE');
  const [revisedRationale, setRevisedRationale] = useState('');
  const [showTxHistory, setShowTxHistory] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<PollInfluenceOption | null>(null);
  const [pollSubmitted, setPollSubmitted] = useState(false);

  const myDecision = scenario.decisions[currentUser.id];
  const txRef = myDecision?.transactionRef;
  const txRecord = txRef ? scenario.transactions[txRef] : null;
  const txStatus = myDecision?.transactionStatus;
  const isCompleted = scenario.phase === 'COMPLETED';
  const isSurpriseRevealed = scenario.phase === 'SURPRISE_REVEAL' || scenario.phase === 'REVISION_DEBRIEF' || isCompleted;
  const hasSubmitted = !!myDecision;

  // Calculated preview values
  const totalExposure = margin * leverage;
  const serviceFee = +(totalExposure * 0.001).toFixed(0); // 0.1% simulated fee
  const venueFee = 18; // illustrative flat
  const liqLevel = choice === 'LONG_MOMENTUM'
    ? +(scenario.initialPrice * (1 - 1 / leverage) * 0.97).toFixed(2)
    : +(scenario.initialPrice * (1 + 1 / leverage) * 1.03).toFixed(2);
  const lossAt10Pct = +(margin * leverage * 0.10).toFixed(0);

  function handleSubmit() {
    onSubmitDecision(choice, rationale || 'Based on the scenario analysis.', margin, leverage, previewDone);
    setRationale('');
  }

  function handlePollSubmit() {
    if (!selectedPoll) return;
    onSubmitPoll?.(selectedPoll);
    setPollSubmitted(true);
  }

  return (
    <div className="space-y-4">
      {/* ── Persistent simulation label ── */}
      <div className="flex items-center justify-center gap-2 py-2 px-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="text-[12px] font-bold text-amber-400 uppercase tracking-wider">
          SIMULATED SESSION · NO REAL MONEY · FICTIONAL DATA
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── LEFT: Event context ── */}
        <div className="space-y-4">
          {/* Scenario card */}
          <div className="card p-4 bg-[var(--bg-elevated)] border-[var(--border)] space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[var(--brand)]" />
              <h3 className="font-bold text-[13px] text-[var(--text-primary)] uppercase tracking-wider">Tonight's Scenario</h3>
            </div>
            <div>
              <p className="font-bold text-[14px] text-[var(--text-primary)]">{scenario.title}</p>
              <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">{scenario.ticker} · Simulated instrument</p>
            </div>
            <div className="flex items-center justify-between py-1.5 px-2.5 bg-[var(--bg-interactive)] rounded-lg">
              <span className="text-[11px] text-[var(--text-secondary)]">Reference price</span>
              <span className="font-mono font-bold text-[15px] text-[var(--text-primary)]">
                ${scenario.initialPrice.toFixed(2)}
              </span>
            </div>
            <div className="p-3 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-subtle)] text-[12px] leading-relaxed text-[var(--text-secondary)]">
              {scenario.catalystHeadline}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] italic">
              * This is simulated fictional data. Does not represent a real company or live market feed.
            </div>
          </div>

          {/* Session agenda */}
          <div className="card p-4 bg-[var(--bg-surface)] border-[var(--border)] space-y-2 text-[12px]">
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Session Agenda</h3>
            {[
              { step: '1', label: 'Explore your position', done: hasSubmitted },
              { step: '2', label: 'Surprise event reveal', done: isSurpriseRevealed },
              { step: '3', label: 'Crew debrief & revision', done: isCompleted },
            ].map(s => (
              <div key={s.step} className={`flex items-center gap-2 ${s.done ? 'text-[var(--green)]' : 'text-[var(--text-secondary)]'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${s.done ? 'bg-[var(--green-dim)] border border-[var(--green-border)]' : 'bg-[var(--bg-interactive)] border border-[var(--border)]'}`}>
                  {s.done ? '✓' : s.step}
                </div>
                <span className={s.done ? 'line-through opacity-70' : ''}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CENTRE: Interactive scenario ── */}
        <div className="space-y-4">
          {!hasSubmitted ? (
            <>
              {/* Position choice */}
              <div className="card p-4 bg-[var(--bg-elevated)] border-[var(--border)] space-y-3">
                <h3 className="font-bold text-[13px] text-[var(--text-primary)]">Step 1: Explore a position</h3>
                <div className="space-y-2">
                  {([
                    { id: 'LONG_MOMENTUM',  label: 'Explore a long position', icon: <TrendingUp className="w-4 h-4" />, color: 'text-[var(--green)]' },
                    { id: 'SHORT_HEDGE',    label: 'Explore a short position', icon: <TrendingDown className="w-4 h-4" />, color: 'text-[var(--red)]' },
                    { id: 'SIT_OUT',        label: 'Sit out — too much uncertainty', icon: <Minus className="w-4 h-4" />, color: 'text-[var(--text-muted)]' },
                  ] as const).map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setChoice(opt.id)}
                      className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 transition-all ${
                        choice === opt.id
                          ? 'bg-[var(--bg-interactive)] border-[var(--brand)]'
                          : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--border-accent)]'
                      }`}
                    >
                      <span className={opt.color}>{opt.icon}</span>
                      <span className="text-[12px] font-medium text-[var(--text-primary)]">{opt.label}</span>
                      {choice === opt.id && <CheckCircle2 className="w-4 h-4 text-[var(--brand)] ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulated margin & leverage (only for non sit-out) */}
              {choice !== 'SIT_OUT' && (
                <div className="card p-4 bg-[var(--bg-elevated)] border-[var(--border)] space-y-3">
                  <h3 className="font-bold text-[13px] text-[var(--text-primary)]">Simulated exposure controls</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="stat-label block mb-1">Simulated margin (₹)</label>
                      <input
                        type="number" min={1000} max={50000} step={500}
                        value={margin}
                        onChange={e => setMargin(Number(e.target.value))}
                        className="input-field font-mono"
                      />
                    </div>
                    <div>
                      <label className="stat-label block mb-1">Leverage (demo range 1–5×)</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 5].map(lev => (
                          <button
                            key={lev}
                            onClick={() => setLeverage(lev)}
                            className={`flex-1 py-1.5 rounded border text-[12px] font-mono font-bold transition-all ${
                              leverage === lev ? 'bg-[var(--brand-dim)] border-[var(--brand)] text-[var(--brand)]' : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)]'
                            }`}
                          >{lev}×</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { setShowPreview(true); setPreviewDone(true); }}
                    className="btn btn-ghost btn-full text-[12px]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview exposure and costs</span>
                  </button>

                  {showPreview && (
                    <div className="p-3 bg-[var(--bg-surface)] border border-[var(--brand-border)] rounded-lg space-y-2 text-[12px] fade-in">
                      <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Exposure preview (simulated)</p>
                      {[
                        { label: 'Margin committed', val: `₹${margin.toLocaleString()}` },
                        { label: 'Total position exposure', val: `₹${totalExposure.toLocaleString()}` },
                        { label: 'Simulated platform service fee', val: `₹${serviceFee}` },
                        { label: 'Illustrative venue fee', val: `₹${venueFee}` },
                        { label: 'Est. liquidation level', val: `$${liqLevel}`, note: '(Approx — actual depends on mark price)' },
                        { label: 'Illustrative loss at −10% move', val: `₹${lossAt10Pct}` },
                      ].map(row => (
                        <div key={row.label} className="flex items-start justify-between gap-2">
                          <span className="text-[var(--text-secondary)]">{row.label}{row.note && <span className="text-[var(--text-muted)] ml-1 text-[10px]">{row.note}</span>}</span>
                          <span className="font-mono font-bold text-[var(--text-primary)] shrink-0">{row.val}</span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-[var(--border-subtle)]">
                        {/* Margin buffer */}
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-amber-400 text-[11px] font-semibold">Margin buffer: moderate</span>
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1">A green indicator does not mean the trade is profitable or safe. This is an illustration only.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Rationale */}
              <div className="card p-4 bg-[var(--bg-surface)] border-[var(--border)] space-y-2">
                <label className="stat-label block">Your rationale (optional)</label>
                <textarea
                  value={rationale}
                  onChange={e => setRationale(e.target.value)}
                  placeholder="What influenced your decision?"
                  rows={2}
                  className="input-field text-[12px] resize-none"
                />
                <button
                  onClick={handleSubmit}
                  className="btn btn-brand btn-full py-2.5 font-bold"
                >
                  <Zap className="w-4 h-4" />
                  <span>Confirm simulated decision</span>
                </button>
                <p className="text-[10px] text-[var(--text-muted)] text-center">
                  No real money. No deposit. No leverage increase required.
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Submitted state */}
              <div className="card p-4 bg-[var(--bg-elevated)] border-[var(--border)] space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--green)]" />
                  <h3 className="font-bold text-[13px] text-[var(--text-primary)]">Decision submitted</h3>
                </div>
                <div className="p-3 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-subtle)] space-y-1.5 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Your position</span>
                    <span className="font-bold text-[var(--text-primary)]">{CHOICE_LABELS[myDecision.initialChoice]}</span>
                  </div>
                  {myDecision.simulatedMargin && (
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Simulated margin</span>
                      <span className="font-mono font-bold">₹{myDecision.simulatedMargin.toLocaleString()}</span>
                    </div>
                  )}
                  {myDecision.simulatedLeverage && (
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Leverage</span>
                      <span className="font-mono font-bold">{myDecision.simulatedLeverage}×</span>
                    </div>
                  )}
                </div>

                {/* Transaction tracking panel */}
                {txStatus && txRecord && (
                  <div className={`p-3 rounded-lg border space-y-2 text-[12px] ${
                    txStatus === 'CHECKING_OUTCOME' ? 'bg-amber-500/10 border-amber-500/30' :
                    txStatus === 'CONFIRMED'        ? 'bg-[var(--green-dim)] border-[var(--green-border)]' :
                    'bg-[var(--bg-interactive)] border-[var(--border)]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--text-primary)] text-[11px] uppercase tracking-wider">Transaction tracking</span>
                      <TxStatusBadge status={txStatus} />
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)]">Reference</span>
                      <span className="font-mono text-[var(--text-primary)]">{txRecord.ref}</span>
                    </div>

                    {txStatus === 'CHECKING_OUTCOME' && (
                      <div className="p-2 bg-amber-500/10 rounded border border-amber-500/20 text-[11px] text-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />
                        We have not yet confirmed whether your order was accepted. We're checking its status. Please do not submit it again.
                      </div>
                    )}

                    {txStatus === 'CONFIRMED' && (
                      <div className="p-2 bg-[var(--green-dim)] rounded border border-[var(--green-border)] text-[11px] text-[var(--green)]">
                        <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />
                        Order confirmed. One order was executed. No duplicate charge.
                      </div>
                    )}

                    <button
                      onClick={() => setShowTxHistory(!showTxHistory)}
                      className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-white transition-colors"
                    >
                      <History className="w-3 h-3" />
                      View status history
                    </button>

                    {showTxHistory && (
                      <div className="space-y-1.5 pt-1 border-t border-[var(--border-subtle)]">
                        {txRecord.statusHistory.map((h, i) => (
                          <div key={i} className="flex items-start gap-2 text-[10px]">
                            <span className="text-[var(--text-muted)] font-mono shrink-0">
                              {new Date(h.timestamp).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                            </span>
                            <div>
                              <span className="font-semibold text-[var(--text-secondary)]">{h.status.replace(/_/g, ' ')}</span>
                              {h.note && <p className="text-[var(--text-muted)] mt-0.5">{h.note}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Margin buffer indicator */}
                    {txStatus !== 'AWAITING_APPROVAL' && (
                      <div className="pt-2 border-t border-[var(--border-subtle)]">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <div className={`w-2 h-2 rounded-full ${txStatus === 'CONFIRMED' ? 'bg-[var(--green)]' : 'bg-amber-400'} animate-pulse`} />
                          <span className="font-semibold text-[var(--text-secondary)]">
                            Margin buffer: {txStatus === 'CONFIRMED' ? 'stable' : 'narrowing'}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          {txStatus === 'CONFIRMED'
                            ? 'An adverse price move could reduce the distance to the estimated liquidation level.'
                            : 'An adverse price move has reduced the distance to the estimated liquidation level.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Crew poll */}
                {hasSubmitted && !pollSubmitted && (
                  <div className="p-3 bg-[var(--bg-surface)] rounded-lg border border-[var(--border)] space-y-2">
                    <h4 className="font-bold text-[12px] text-[var(--text-primary)]">What most influenced your decision?</h4>
                    <div className="space-y-1">
                      {POLL_OPTS.map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setSelectedPoll(opt.id)}
                          className={`w-full py-1.5 px-2.5 rounded text-left text-[11px] transition-all border ${
                            selectedPoll === opt.id
                              ? 'bg-[var(--brand-dim)] border-[var(--brand)] text-[var(--brand)]'
                              : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-accent)]'
                          }`}
                        >{opt.label}</button>
                      ))}
                    </div>
                    <button
                      disabled={!selectedPoll}
                      onClick={handlePollSubmit}
                      className="btn btn-ghost btn-full py-1.5 text-[11px]"
                    >Submit poll response</button>
                  </div>
                )}

                {pollSubmitted && scenario.pollResults && Object.keys(scenario.pollResults).length > 0 && (
                  <div className="p-3 bg-[var(--bg-surface)] rounded-lg border border-[var(--border)] space-y-1.5">
                    <h4 className="font-bold text-[12px] text-[var(--text-primary)] flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[var(--brand)]" />
                      Crew poll results (anonymous)
                    </h4>
                    {POLL_OPTS.map(opt => {
                      const count = scenario.pollResults?.[opt.id] || 0;
                      const total = Object.values(scenario.pollResults || {}).reduce((a, b) => a + b, 0);
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={opt.id} className="space-y-0.5">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-[var(--text-secondary)]">{opt.label}</span>
                            <span className="font-mono text-[var(--text-primary)]">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--brand)] rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-[10px] text-[var(--text-muted)] italic">
                      Discussion prompt: "Two crew members changed their decision after seeing the exposure preview. What changed their mind?"
                    </p>
                  </div>
                )}
              </div>

              {/* Surprise reveal */}
              {!isSurpriseRevealed && (
                <div className="card p-4 bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <h3 className="font-bold text-[13px] text-amber-400">Step 2: Surprise event (host reveals)</h3>
                  <p className="text-[12px] text-[var(--text-secondary)]">
                    The host will reveal the surprise event when all crew members have submitted.
                  </p>
                  <button
                    onClick={onRevealSurprise}
                    className="btn btn-brand btn-full py-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Reveal surprise event (host action)</span>
                  </button>
                </div>
              )}

              {isSurpriseRevealed && !isCompleted && (
                <div className="space-y-3">
                  <div className="card p-4 bg-red-500/10 border border-red-500/30 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <h3 className="font-bold text-[13px] text-red-400">SIMULATED event shock</h3>
                    </div>
                    <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{scenario.surpriseEventHeadline}</p>
                    <div className="flex items-center gap-3 pt-1">
                      <div>
                        <p className="text-[10px] text-[var(--text-muted)]">Shock price</p>
                        <p className="font-mono font-bold text-red-400">${scenario.shockPrice}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[var(--text-muted)]">Move</p>
                        <p className="font-mono font-bold text-red-400">
                          −{(((scenario.initialPrice - scenario.shockPrice) / scenario.initialPrice) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Revision form */}
                  <div className="card p-4 bg-[var(--bg-elevated)] border-[var(--border)] space-y-3">
                    <h3 className="font-bold text-[13px] text-[var(--text-primary)]">Step 3: Revise your stance</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {([
                        { id: 'SHORT_HEDGE', label: 'Pivot to short / reduce exposure' },
                        { id: 'DE_RISK_CASH', label: 'De-risk: exit to buffer margin' },
                        { id: 'LONG_MOMENTUM', label: 'Hold / buy the dip (higher risk)' },
                        { id: 'SIT_OUT', label: 'Step aside — insufficient clarity' },
                      ] as const).map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setRevisedChoice(opt.id)}
                          className={`p-3 rounded-lg border text-left text-[12px] transition-all ${
                            revisedChoice === opt.id
                              ? 'bg-[var(--bg-interactive)] border-[var(--brand)]'
                              : 'bg-[var(--bg-surface)] border-[var(--border)]'
                          }`}
                        >{opt.label}</button>
                      ))}
                    </div>
                    <textarea
                      value={revisedRationale}
                      onChange={e => setRevisedRationale(e.target.value)}
                      placeholder="How did the surprise shift your thinking?"
                      rows={2}
                      className="input-field text-[12px] resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => onSubmitRevision(revisedChoice, revisedRationale || 'Adjusted on new information.')} className="btn btn-ghost flex-1 py-2">
                        Save revision
                      </button>
                      <button onClick={onCompleteScenario} className="btn btn-brand flex-1 py-2 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete debrief</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isCompleted && (
                <div className="card p-4 bg-[var(--green-dim)] border-[var(--green-border)] text-center space-y-3">
                  <CheckCircle2 className="w-8 h-8 text-[var(--green)] mx-auto" />
                  <h3 className="font-bold text-[15px] text-[var(--text-primary)]">Debrief complete</h3>
                  <p className="text-[12px] text-[var(--text-secondary)]">Your session toolkit and team report are now ready.</p>
                  <button onClick={onGoToRewards} className="btn btn-brand py-2.5 px-6 font-bold">
                    <span>View your Market Night Pass</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: Crew discussion ── */}
        <div className="space-y-4">
          <div className="card p-4 bg-[var(--bg-elevated)] border-[var(--border)] space-y-3">
            <h3 className="font-bold text-[13px] text-[var(--text-primary)] uppercase tracking-wider">Crew · {team.name}</h3>
            <div className="space-y-2">
              {team.members.map(member => {
                const dec = scenario.decisions[member.userId];
                const isMe = member.userId === currentUser.id;
                return (
                  <div
                    key={member.userId}
                    className={`p-3 rounded-lg border ${isMe ? 'border-[var(--brand-border)] bg-[var(--brand-dim)]' : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]'}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg">{member.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[12px] text-[var(--text-primary)] truncate flex items-center gap-1">
                          {member.name}
                          {isMe && <span className="text-[9px] text-[var(--brand)]">(you)</span>}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono">{member.handle}</p>
                      </div>
                    </div>
                    {dec ? (
                      <div className="text-[11px] space-y-0.5">
                        <div className={`font-semibold ${
                          dec.initialChoice === 'LONG_MOMENTUM' ? 'text-[var(--green)]' :
                          dec.initialChoice === 'SHORT_HEDGE'   ? 'text-[var(--red)]' :
                          'text-[var(--text-muted)]'
                        }`}>
                          {CHOICE_LABELS[dec.initialChoice]}
                        </div>
                        {dec.initialRationale && (
                          <p className="text-[10px] text-[var(--text-secondary)] italic">"{dec.initialRationale}"</p>
                        )}
                        {dec.pollInfluence && (
                          <p className="text-[10px] text-[var(--text-muted)]">
                            Influenced by: {POLL_OPTS.find(p => p.id === dec.pollInfluence)?.label}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[var(--text-muted)] italic">Exploring…</p>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">
              Each participant makes their own decision. A crew does not control another member's account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
