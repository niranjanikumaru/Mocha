'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '../components/Header';
import ContractSidebar from '../components/ContractSidebar';
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

import { TrendingUp, TrendingDown, Info, ShieldCheck, Zap, ArrowUpRight, ArrowDownRight, Layers, Sliders } from 'lucide-react';

const DEFAULT_SYMBOL: ContractSymbol = 'NVDA-PERP';
const INR_RATE = 86.85;

// Performance benchmark targets
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

  // Sync mark price when symbol changes
  useEffect(() => {
    const basePrice = INITIAL_MARK_PRICES[symbol];
    setMarkPrice(basePrice);
    setFeedTimestamp(Date.now());
  }, [symbol]);

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
      const writeMs = Math.round((performance.now() - t0) * 100) / 100;
      setLedgerWriteMs(writeMs);
      setActiveOrder(order);
      setDuplicateAttempts(0);
    }

    if (step === 'SHOW_UNRESOLVED') {
      if (activeOrder?.status === 'ACK_LOST_PENDING_RECON') {
        setDuplicateAttempts((n) => n + 1);
      }
    }

    if (step === 'RECONCILE_PARTIAL') {
      if (!activeOrder) return;
      const start = performance.now();
      setIsReconciling(true);
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

      const result1 = processPaymentWebhook(payload, balance);
      if (result1.credited) setBalance(result1.balance);

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
  const isPosShocked = prevMarkPrice && markPrice < prevMarkPrice;

  return (
    <div className="terminal-root">
      {/* ── Top Header ───────────────────────────────────────── */}
      <Header balance={balance} feedAge={feedAge} isSimulated={isSimMode} />

      {/* ── Left Sidebar (Markets & Account) ──────────────────── */}
      <ContractSidebar
        selectedSymbol={symbol}
        onSelect={setSymbol}
        position={position}
        balance={balance}
        onOpenExplainer={() => setShowExplainer(true)}
      />

      {/* ── Center Main Panel ─────────────────────────────────── */}
      <main className="terminal-main p-4 space-y-4 bg-[var(--bg-base)]">

        {/* Market Night Crew Pass Promotion Banner */}
        <div className="card p-3 bg-gradient-to-r from-[var(--bg-surface)] via-[var(--bg-interactive)] to-[var(--bg-surface)] border border-[var(--brand-border)] flex flex-wrap items-center justify-between gap-3 text-[12px]">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" />
            <span className="font-bold text-[var(--brand)]">Tonight’s Market Night:</span>
            <span className="text-[var(--text-primary)] font-semibold">“Bring your four. Unlock tonight’s Crew Pass.”</span>
            <span className="text-[var(--text-secondary)] hidden md:inline">— Exclusive scenario, team report & guest AMA.</span>
          </div>
          <a
            href="/market-night"
            className="btn btn-brand btn-sm py-1 px-3 text-[11px] font-bold shrink-0"
          >
            <span>Join with Your Crew</span>
          </a>
        </div>

        {/* Contract Ticker Strip */}
        <div className="card p-3.5 flex flex-wrap items-center justify-between gap-4 bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-dim)] flex items-center justify-center font-bold text-[13px] text-[var(--brand)]">
              {contract.underlyingTicker.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[16px] font-bold text-[var(--text-primary)] tracking-tight">
                  {contract.underlyingTicker} Perpetual
                </h1>
                <span className="badge badge-brand">USD Cash-Settled</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {contract.underlyingName} · Max {contract.maxLeverage}× Leverage · 8h Funding
              </p>
            </div>
          </div>

          {/* Quick price stats */}
          <div className="flex items-center gap-6">
            <div>
              <span className="stat-label">Mark Price</span>
              <p className="text-[18px] font-mono font-bold text-[var(--text-primary)] price-display">
                ${markPrice.toFixed(2)}
              </p>
            </div>
            <div>
              <span className="stat-label">Est. 24h</span>
              <p className="text-[13px] font-mono font-semibold text-[var(--green)] flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +2.4%
              </p>
            </div>
            <div>
              <span className="stat-label">Funding (8h)</span>
              <p className="text-[13px] font-mono font-semibold text-[var(--brand)]">
                0.0100%
              </p>
            </div>
            <button
              onClick={() => setShowExplainer(true)}
              className="btn btn-ghost btn-sm"
            >
              <Info className="w-3.5 h-3.5 text-[var(--brand)]" />
              <span>Contract Rules</span>
            </button>
          </div>
        </div>

        {/* Mini Price & Depth Bar (Kalshi aesthetic) */}
        <div className="card p-3 bg-[var(--bg-surface)] flex items-center justify-between gap-4 text-[12px]">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">Order Book</span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-[var(--green)] font-semibold">${(markPrice - 0.05).toFixed(2)}</span>
              <span className="text-[10px] text-[var(--text-muted)]">Bid</span>
              <span className="text-[var(--text-muted)]">/</span>
              <span className="text-[var(--red)] font-semibold">${(markPrice + 0.05).toFixed(2)}</span>
              <span className="text-[10px] text-[var(--text-muted)]">Ask</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-[var(--text-secondary)] font-mono">
            <span>24h Vol: <strong className="text-[var(--text-primary)]">$14.2M</strong></span>
            <span>Open Interest: <strong className="text-[var(--text-primary)]">8,450 Lots</strong></span>
          </div>
        </div>

        {/* Active Position / Zero State */}
        {!position ? (
          <div className="card p-8 text-center bg-[var(--bg-surface)] border-dashed border-[var(--border)] space-y-3">
            <div className="w-10 h-10 rounded-full bg-[var(--brand-dim)] text-[var(--brand)] flex items-center justify-center mx-auto">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-[14px] text-[var(--text-primary)]">No Active Position on {symbol}</h3>
              <p className="text-[12px] text-[var(--text-secondary)] mt-1 max-w-md mx-auto">
                Explore perpetual exposure with visible margin safety and automated transaction reconciliation.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setShowExplainer(true)}
                className="btn btn-ghost btn-sm"
              >
                Learn Contract Rules
              </button>
              <button
                onClick={() => handleDemoStep('OPEN_POSITION')}
                className="btn btn-brand btn-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                Open 5× Simulated Position
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 fade-in">
            {/* Real-time Explainable Margin-Health Indicator */}
            {marginMetrics && (
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
            )}
          </div>
        )}

        {/* Transaction Recovery Panel (Always accessible when orders occur) */}
        {(activeOrder || position) && (
          <div className="fade-in space-y-1">
            <TransactionRecoveryPanel
              order={activeOrder}
              onReconcile={handleReconcile}
              onConfirmClose={handleClosePosition}
              isReconciling={isReconciling}
              duplicateAttempts={duplicateAttempts}
            />
          </div>
        )}
      </main>

      {/* ── Right Panel (Judge Demo & SLA Benchmarks) ─────────── */}
      <aside className="terminal-panel">
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
      </aside>

      {/* ── Modals ────────────────────────────────────────────── */}
      {showExplainer && (
        <PreTradeExplainer
          selectedSymbol={symbol}
          onSymbolChange={setSymbol}
          leverage={leverage}
          onLeverageChange={setLeverage}
          quantity={quantity}
          onQuantityChange={setQuantity}
          onOpenSimulation={() => {
            setIsSimMode(true);
            setShowExplainer(false);
            handleDemoStep('OPEN_POSITION');
          }}
          onClose={() => setShowExplainer(false)}
        />
      )}

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
