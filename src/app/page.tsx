'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '../components/Header';
import PreTradeExplainer from '../components/PreTradeExplainer';
import MarginHealthIndicator from '../components/MarginHealthIndicator';
import TransactionRecoveryPanel from '../components/TransactionRecoveryPanel';
import PostTradeReceipt from '../components/PostTradeReceipt';
import JudgeDemoController, { DemoStep } from '../components/JudgeDemoController';

import { CONTRACT_CATALOG, INITIAL_MARK_PRICES } from '../lib/contracts';
import { calcMarginMetrics } from '../lib/marginCalculator';
import { submitOrder, reconcileOrder, resetVenue } from '../lib/simulationVenue';
import { processPaymentWebhook, resetPaymentService } from '../lib/paymentService';

import {
  Position, UserAccountBalance, OrderStateRecord,
  ContractSymbol, PostTradeSurvey, MarginMetrics,
} from '../types/trading';

const DEFAULT_SYMBOL: ContractSymbol = 'NVDA-PERP';
const INR_RATE = 86.85;

// ── Performance benchmark targets ─────────────────────────────────────────
const BENCH = {
  TICK_INTERVAL_MS: 8,        // margin recalculation: < 10 ms target
  STALE_THRESHOLD_MS: 500,    // stale data masking: < 500 ms target
  RECON_SIMULATED_MS: 80,     // reconciliation: < 100 ms target
} as const;

function makeId() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export default function TradingTerminal() {
  // ── Config state ───────────────────────────────────────────────
  const [symbol, setSymbol] = useState<ContractSymbol>(DEFAULT_SYMBOL);
  const [leverage, setLeverage] = useState(5);
  const [quantity, setQuantity] = useState(100);

  // ── Market data ────────────────────────────────────────────────
  const [markPrice, setMarkPrice] = useState(INITIAL_MARK_PRICES[DEFAULT_SYMBOL]);
  const [prevMarkPrice, setPrevMarkPrice] = useState<number | undefined>(undefined);
  const [feedTimestamp, setFeedTimestamp] = useState(Date.now());
  const feedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Position & account ─────────────────────────────────────────
  const [position, setPosition] = useState<Position | null>(null);
  const [balance, setBalance] = useState<UserAccountBalance>({
    totalEquityUsd: 5000,
    availableUsd: 5000,
    committedMarginUsd: 0,
    unrealizedPnLUsd: 0,
    inrExchangeRate: INR_RATE,
    depositProcessedKeys: [],
  });

  // ── Order state ────────────────────────────────────────────────
  const [activeOrder, setActiveOrder] = useState<OrderStateRecord | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [duplicateAttempts, setDuplicateAttempts] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderStateRecord | null>(null);

  // ── UI state ───────────────────────────────────────────────────
  const [showExplainer, setShowExplainer] = useState(false);
  const [isSimMode, setIsSimMode] = useState(true);
  const [marginMetrics, setMarginMetrics] = useState<MarginMetrics | null>(null);
  const [feedAge, setFeedAge] = useState(0);

  // ── Demo controller ────────────────────────────────────────────
  const [demoStep, setDemoStep] = useState<DemoStep>('IDLE');
  const [reconTimeMs, setReconTimeMs] = useState<number | null>(null);
  const [dupPaymentsBlocked, setDupPaymentsBlocked] = useState(0);
  const [staleDetections, setStaleDetections] = useState(0);
  const [ledgerWriteMs, setLedgerWriteMs] = useState<number | null>(null);
  const [lastTickMs, setLastTickMs] = useState<number | null>(null);
  const paymentIdempKeyRef = useRef<string>('');
  const positionRef = useRef<Position | null>(null);
  const markPriceRef = useRef(markPrice);
  const feedTimestampRef = useRef(feedTimestamp);
  const prevMarkPriceRef = useRef<number | undefined>(undefined);

  // Keep refs in sync
  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { markPriceRef.current = markPrice; }, [markPrice]);
  useEffect(() => { feedTimestampRef.current = feedTimestamp; }, [feedTimestamp]);
  useEffect(() => { prevMarkPriceRef.current = prevMarkPrice; }, [prevMarkPrice]);

  // ── High-frequency margin tick loop (< 10ms target) ─────────────
  useEffect(() => {
    const tick = setInterval(() => {
      const t0 = performance.now();
      const pos = positionRef.current;
      const mp = markPriceRef.current;
      const ft = feedTimestampRef.current;
      const prev = prevMarkPriceRef.current;
      const age = Date.now() - ft;

      setFeedAge(age);

      // Stale detection: mask health within 500ms of missed heartbeat
      if (age > BENCH.STALE_THRESHOLD_MS) {
        setStaleDetections((n) => n + 1);
      }

      if (pos) {
        const m = calcMarginMetrics(pos, mp, ft, prev, INR_RATE);
        setMarginMetrics(m);
      }

      const elapsed = performance.now() - t0;
      setLastTickMs(Math.round(elapsed * 100) / 100);
    }, BENCH.TICK_INTERVAL_MS);
    return () => clearInterval(tick);
  }, []);

  // ── Reset margin metrics when position clears ─────────────────
  useEffect(() => {
    if (!position) setMarginMetrics(null);
  }, [position]);

  // ── Helper: refresh feed timestamp ────────────────────────────
  const refreshFeed = useCallback((price?: number) => {
    setFeedTimestamp(Date.now());
    if (price !== undefined) {
      setPrevMarkPrice(markPrice);
      setMarkPrice(price);
    }
  }, [markPrice]);

  // ── Demo step handler ─────────────────────────────────────────
  function handleDemoStep(step: DemoStep) {
    setDemoStep(step);

    if (step === 'OPEN_POSITION') {
      resetVenue();
      resetPaymentService();
      setActiveOrder(null);
      setDuplicateAttempts(0);
      setReconTimeMs(null);
      setDupPaymentsBlocked(0);
      paymentIdempKeyRef.current = 'DEPOSIT-' + makeId();

      const mp = INITIAL_MARK_PRICES[symbol];
      const initialMargin = (quantity * mp) / leverage;
      const newPos: Position = {
        id: 'POS-' + makeId(),
        symbol,
        side: 'LONG',
        quantity,
        originalQuantity: quantity,
        entryPrice: mp,
        markPrice: mp,
        leverage,
        allocatedMargin: initialMargin,
        currency: 'USD',
        openedAt: Date.now(),
        isSimulated: true,
      };
      setPosition(newPos);
      setBalance((b) => ({
        ...b,
        availableUsd: b.availableUsd - initialMargin,
        committedMarginUsd: initialMargin,
      }));
      refreshFeed(mp);
    }

    if (step === 'ADVERSE_SHOCK') {
      if (!position) return;
      const shockedPrice = markPrice * 0.925; // −7.5%
      refreshFeed(shockedPrice);
      if (position) {
        setPosition((p) => p ? { ...p, markPrice: shockedPrice } : null);
      }
    }

    if (step === 'SUBMIT_CLOSE_ACK_DROP') {
      if (!position) return;
      const t0 = performance.now();
      const order = submitOrder(position.symbol, 'SELL', position.quantity, markPrice, { simulateAckDrop: true, simulatePartialFill: true });
      // Ledger write latency: time to commit request ID + timestamp + qty
      const writeMs = Math.round((performance.now() - t0) * 100) / 100;
      setLedgerWriteMs(writeMs);
      setActiveOrder(order);
      setDuplicateAttempts(0);
    }

    if (step === 'SHOW_UNRESOLVED') {
      // try a duplicate click — should be blocked
      if (activeOrder?.status === 'ACK_LOST_PENDING_RECON') {
        setDuplicateAttempts((n) => n + 1);
      }
    }

    if (step === 'RECONCILE_PARTIAL') {
      if (!activeOrder) return;
      const start = performance.now();
      setIsReconciling(true);
      // Sub-100ms reconciliation target: 80ms simulated network round-trip
      setTimeout(() => {
        const reconciled = reconcileOrder(activeOrder.requestId);
        const elapsed = Math.round(performance.now() - start);
        setActiveOrder(reconciled ? { ...reconciled } : activeOrder);
        setIsReconciling(false);
        setReconTimeMs(elapsed);
        if (reconciled && reconciled.remainingQty > 0 && position) {
          setPosition((p) => p ? { ...p, quantity: reconciled.remainingQty } : null);
        }
        if (reconciled?.status === 'FILLED' && position) {
          setPosition(null);
          setCompletedOrder(reconciled);
          setShowReceipt(true);
          setBalance((b) => ({
            ...b,
            committedMarginUsd: 0,
            availableUsd: b.availableUsd + position.allocatedMargin + (reconciled.filledQty * reconciled.avgFillPrice - reconciled.filledQty * position.entryPrice),
          }));
        }
      }, BENCH.RECON_SIMULATED_MS);
    }

    if (step === 'DUPLICATE_PAYMENT') {
      const key = paymentIdempKeyRef.current || 'DEPOSIT-DEMO01';
      const payload = {
        paymentId: 'PAY-' + makeId(),
        idempotencyKey: key,
        amountInr: 50000,
        amountUsd: 50000 / INR_RATE,
        senderName: 'Demo Trader',
        bankRef: 'NEFT-' + makeId(),
        timestamp: Date.now(),
      };

      // First payment
      const result1 = processPaymentWebhook(payload, balance);
      if (result1.credited) setBalance(result1.balance);

      // Duplicate replay
      const result2 = processPaymentWebhook({ ...payload, paymentId: 'PAY-' + makeId() }, result1.balance);
      if (result2.deduped) setDupPaymentsBlocked((n) => n + 1);
    }
  }

  function handleClosePosition() {
    if (!position || !activeOrder || activeOrder.status === 'ACK_LOST_PENDING_RECON') return;
    const order = submitOrder(position.symbol, 'SELL', position.quantity, markPrice);
    setActiveOrder(order);
    if (order.status === 'FILLED') {
      const pnl = (order.avgFillPrice - position.entryPrice) * position.quantity;
      setBalance((b) => ({
        ...b,
        availableUsd: b.availableUsd + position.allocatedMargin + pnl,
        committedMarginUsd: 0,
      }));
      setPosition(null);
      setCompletedOrder(order);
      setShowReceipt(true);
    }
  }

  function handleReducePosition() {
    if (!position || position.quantity <= 1) return;
    const reduceQty = Math.ceil(position.quantity * 0.25);
    const order = submitOrder(position.symbol, 'SELL', reduceQty, markPrice);
    setActiveOrder(order);
    if (order.status === 'FILLED' || order.status === 'PARTIALLY_FILLED') {
      const freed = (position.allocatedMargin / position.quantity) * order.filledQty;
      setPosition((p) => p ? { ...p, quantity: p.quantity - order.filledQty, allocatedMargin: p.allocatedMargin - freed } : null);
      setBalance((b) => ({ ...b, availableUsd: b.availableUsd + freed, committedMarginUsd: b.committedMarginUsd - freed }));
    }
  }

  function handleReconcile() {
    if (!activeOrder) return;
    handleDemoStep('RECONCILE_PARTIAL');
  }

  const contract = CONTRACT_CATALOG[symbol];

  return (
    <div className="min-h-screen trading-bg text-zinc-100">
      {/* Header */}
      <Header balance={balance} feedAge={feedAge} isSimulated={isSimMode} />

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">

        {/* Left: Position terminal */}
        <div className="space-y-5">

          {/* Position selector bar */}
          <div className="glass-card rounded-2xl p-5 slide-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-white font-bold text-xl">Position Screen</h1>
                <p className="text-zinc-500 text-xs mt-0.5">
                  {contract.underlyingName} · Perpetual Futures · {isSimMode ? 'Simulation' : 'Live'}
                </p>
              </div>
              <button
                onClick={() => setShowExplainer(true)}
                className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold hover:bg-amber-500/20 transition-colors"
              >
                Understand This Contract
              </button>
            </div>

            {/* Contract explainer row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                ['Contract', `${symbol}`],
                ['Leverage', `${leverage}×`],
                ['Mark Price', `$${markPrice.toFixed(2)}`],
                ['Maintenance Margin', `${(contract.maintenanceMarginRate * 100).toFixed(0)}%`],
              ].map(([k, v]) => (
                <div key={k} className="bg-zinc-800/60 rounded-xl px-3 py-2 border border-zinc-700">
                  <p className="text-zinc-500">{k}</p>
                  <p className="text-white font-semibold mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            <p className="text-zinc-600 text-xs mt-2 italic">
              ⚠ All prices are fictional sample data for prototype demonstration. Not a real trading venue.
            </p>
          </div>

          {/* Open position button (when no position) */}
          {!position && (
            <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center gap-4 border-dashed border-zinc-700 slide-up">
              <p className="text-zinc-500 text-sm">No open position. Use the demo controller or open manually.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExplainer(true)}
                  className="px-5 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800 transition-colors"
                >
                  Learn First
                </button>
                <button
                  onClick={() => handleDemoStep('OPEN_POSITION')}
                  className="px-5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-semibold text-sm hover:bg-amber-500/25 transition-colors"
                >
                  Open Simulation Position
                </button>
              </div>
            </div>
          )}

          {/* Active position display */}
          {position && marginMetrics && (
            <div className="slide-up">
              <MarginHealthIndicator
                metrics={marginMetrics}
                position={position}
                onReduce={handleReducePosition}
                onClose={() => {
                  if (activeOrder?.status === 'ACK_LOST_PENDING_RECON') {
                    setDuplicateAttempts((n) => n + 1);
                  } else {
                    handleClosePosition();
                  }
                }}
                onReview={() => setShowExplainer(true)}
              />
            </div>
          )}

          {/* Transaction recovery */}
          {(activeOrder || position) && (
            <div className="slide-up">
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2 font-medium px-1">Transaction Recovery</p>
              <TransactionRecoveryPanel
                order={activeOrder}
                onReconcile={handleReconcile}
                onConfirmClose={handleClosePosition}
                isReconciling={isReconciling}
                duplicateAttempts={duplicateAttempts}
              />
            </div>
          )}
        </div>

        {/* Right: Judge Demo Controller */}
        <div className="space-y-5">
          <JudgeDemoController
            currentStep={demoStep}
            metrics={{
              reconciliationMs: reconTimeMs,
              duplicatesBlocked: dupPaymentsBlocked,
              staleDataDetections: staleDetections,
              ledgerWriteMs,
              lastTickMs,
            }}
            onStep={handleDemoStep}
          />

          {/* Account summary */}
          <div className="glass-card rounded-2xl p-4 border border-zinc-800">
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-3 font-medium">Account Summary</p>
            <div className="space-y-2 text-sm">
              {[
                ['Total Equity', `$${balance.totalEquityUsd.toFixed(2)}`],
                ['Available', `$${balance.availableUsd.toFixed(2)}`],
                ['Committed Margin', `$${balance.committedMarginUsd.toFixed(2)}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-zinc-400">{k}</span>
                  <span className="text-white font-medium">{v}</span>
                </div>
              ))}
              <div className="border-t border-zinc-800 pt-2 text-xs text-zinc-500 flex justify-between">
                <span>Available (INR est.)</span>
                <span className="text-zinc-300">₹{(balance.availableUsd * INR_RATE).toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pre-trade explainer modal */}
      {showExplainer && (
        <PreTradeExplainer
          selectedSymbol={symbol}
          onSymbolChange={setSymbol}
          leverage={leverage}
          onLeverageChange={setLeverage}
          quantity={quantity}
          onQuantityChange={setQuantity}
          onOpenSimulation={() => { setIsSimMode(true); setShowExplainer(false); handleDemoStep('OPEN_POSITION'); }}
          onClose={() => setShowExplainer(false)}
        />
      )}

      {/* Post-trade receipt modal */}
      {showReceipt && completedOrder && (
        <PostTradeReceipt
          order={completedOrder}
          balance={balance}
          onSurveySubmit={(survey: PostTradeSurvey) => {
            console.log('Survey submitted:', survey);
            setShowReceipt(false);
          }}
          onDismiss={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}
