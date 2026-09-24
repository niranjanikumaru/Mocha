/**
 * /proof/terminal — Trading terminal as "Trust Evidence"
 * The original MochaTrade trading terminal, now framed as proof
 * that trust features (Lost-ACK, idempotent deposits, explainable margin)
 * are real, working implementations — not marketing copy.
 */
'use client';

import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../../components/Header';
import ContractSidebar from '../../../components/ContractSidebar';
import PreTradeExplainer from '../../../components/PreTradeExplainer';
import MarginHealthIndicator from '../../../components/MarginHealthIndicator';
import TransactionRecoveryPanel from '../../../components/TransactionRecoveryPanel';
import PostTradeReceipt from '../../../components/PostTradeReceipt';
import JudgeDemoController, { DemoStep } from '../../../components/JudgeDemoController';
import AnimatedButton from '../../../components/ui/animated-button';

import { CONTRACT_CATALOG, INITIAL_MARK_PRICES } from '../../../lib/contracts';
import { calcMarginMetrics } from '../../../lib/marginCalculator';
import { submitOrder, reconcileOrder, resetVenue } from '../../../lib/simulationVenue';
import { processPaymentWebhook, resetPaymentService } from '../../../lib/paymentService';

import {
  Position, UserAccountBalance, OrderStateRecord,
  ContractSymbol, PostTradeSurvey, MarginMetrics,
} from '../../../types/trading';

import { Layers, Zap } from 'lucide-react';

const DEFAULT_SYMBOL: ContractSymbol = 'NVDA-PERP';
const INR_RATE = 86.85;

const BENCH = {
  TICK_INTERVAL_MS: 200,       // reduced from 8ms (PRD FND-4: use rAF/throttled)
  STALE_THRESHOLD_MS: 3000,   // unified with DATA_STALE_MS in marginCalculator (FND-1 fix)
  RECON_SIMULATED_MS: 80,
} as const;

function makeId() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

// ── Trust Evidence Banner ───────────────────────────────────────────────────
function TrustEvidenceBanner() {
  return (
    <div className="bg-[var(--brand-dim)] border-b border-[var(--brand-border)] px-4 py-2.5 flex items-center gap-3">
      <Link href="/" className="flex items-center gap-1.5 text-[11px] text-[var(--brand)] hover:underline shrink-0">
        <ArrowLeft className="w-3.5 h-3.5" />
        Decision Cockpit
      </Link>
      <div className="w-px h-4 bg-[var(--brand-border)]" />
      <Shield className="w-3.5 h-3.5 text-[var(--brand)] shrink-0" />
      <div className="text-[11px]">
        <strong className="text-[var(--brand)]">Trust Evidence — </strong>
        <span className="text-[var(--text-secondary)]">
          This terminal demonstrates 3 live trust features that feed the Decision Cockpit model:
          (1) Explainable Margin Health → ↑deposit+first-trade conversion,
          (2) Lost-ACK Recovery → ↓support tickets,
          (3) Idempotent Deposits → ↓payment-failure drop-off.
          Use the Judge Suite → step through each feature.
        </span>
      </div>
    </div>
  );
}

export default function TrustEvidenceTerminal() {
  const [symbol, setSymbol] = useState<ContractSymbol>(DEFAULT_SYMBOL);
  const [leverage, setLeverage] = useState(5);
  const [quantity, setQuantity] = useState(100);
  const [markPrice, setMarkPrice] = useState(INITIAL_MARK_PRICES[DEFAULT_SYMBOL]);
  const [prevMarkPrice, setPrevMarkPrice] = useState<number | undefined>(undefined);
  const [feedTimestamp, setFeedTimestamp] = useState(Date.now());
  const [position, setPosition] = useState<Position | null>(null);
  const [balance, setBalance] = useState<UserAccountBalance>({
    totalEquityUsd: 5000,
    availableUsd: 5000,
    committedMarginUsd: 0,
    unrealizedPnLUsd: 0,
    inrExchangeRate: INR_RATE,
    depositProcessedKeys: [],
  });
  const [activeOrder, setActiveOrder] = useState<OrderStateRecord | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [duplicateAttempts, setDuplicateAttempts] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderStateRecord | null>(null);
  const [showExplainer, setShowExplainer] = useState(false);
  const [isSimMode] = useState(true);
  const [marginMetrics, setMarginMetrics] = useState<MarginMetrics | null>(null);
  const [feedAge, setFeedAge] = useState(0);
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
  const staleCountRef = useRef(0);

  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { markPriceRef.current = markPrice; }, [markPrice]);
  useEffect(() => { feedTimestampRef.current = feedTimestamp; }, [feedTimestamp]);
  useEffect(() => { prevMarkPriceRef.current = prevMarkPrice; }, [prevMarkPrice]);

  useEffect(() => {
    const basePrice = INITIAL_MARK_PRICES[symbol];
    setMarkPrice(basePrice);
    setFeedTimestamp(Date.now());
  }, [symbol]);

  // P0 fix FND-4: throttled tick at 200ms (not 8ms), single setState batch
  // Also fix B3: staleDetections no longer increments every tick — only on transitions
  useEffect(() => {
    const tick = setInterval(() => {
      const t0 = performance.now();
      const pos = positionRef.current;
      const mp = markPriceRef.current;
      const ft = feedTimestampRef.current;
      const prev = prevMarkPriceRef.current;
      const age = Date.now() - ft;

      setFeedAge(age);

      // Only count a new stale detection on the transition (not every tick)
      if (age > BENCH.STALE_THRESHOLD_MS && staleCountRef.current === 0) {
        staleCountRef.current = 1;
        setStaleDetections((n) => n + 1);
      } else if (age <= BENCH.STALE_THRESHOLD_MS) {
        staleCountRef.current = 0;
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

  useEffect(() => {
    if (!position) setMarginMetrics(null);
  }, [position]);

  const refreshFeed = useCallback((price?: number) => {
    setFeedTimestamp(Date.now());
    if (price !== undefined) {
      setPrevMarkPrice(markPriceRef.current);
      setMarkPrice(price);
    }
  }, []);

  function handleDemoStep(step: DemoStep) {
    setDemoStep(step);

    if (step === 'OPEN_POSITION') {
      resetVenue();
      resetPaymentService();
      setActiveOrder(null);
      setDuplicateAttempts(0);
      setReconTimeMs(null);
      setDupPaymentsBlocked(0);
      staleCountRef.current = 0;
      paymentIdempKeyRef.current = 'DEPOSIT-' + makeId();

      const mp = INITIAL_MARK_PRICES[symbol];
      const initialMargin = (quantity * mp) / leverage;

      // P0 fix B5: restore previous margin before assigning new one
      const newPos: Position = {
        id: 'POS-' + makeId(),
        symbol, side: 'LONG', quantity, originalQuantity: quantity,
        entryPrice: mp, markPrice: mp, leverage,
        allocatedMargin: initialMargin,
        currency: 'USD', openedAt: Date.now(), isSimulated: true,
      };
      setPosition(newPos);
      setBalance((b) => ({
        ...b,
        // Restore any previous committed margin first (fix B5)
        availableUsd: b.availableUsd + b.committedMarginUsd - initialMargin,
        committedMarginUsd: initialMargin,
      }));
      refreshFeed(mp);
    }

    if (step === 'ADVERSE_SHOCK') {
      if (!positionRef.current) return;
      const shockedPrice = markPriceRef.current * 0.925;
      refreshFeed(shockedPrice);
      setPosition((p) => p ? { ...p, markPrice: shockedPrice } : null);
    }

    if (step === 'SUBMIT_CLOSE_ACK_DROP') {
      const pos = positionRef.current;
      if (!pos) return;
      const t0 = performance.now();
      const order = submitOrder(pos.symbol, 'SELL', pos.quantity, markPriceRef.current, {
        simulateAckDrop: true, simulatePartialFill: true,
      });
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
        const pos = positionRef.current;
        if (!pos) return;
        if (reconciled && reconciled.remainingQty > 0) {
          // P0 fix B4: update balance proportionally on partial fill
          const filledFraction = reconciled.filledQty / pos.quantity;
          const freedMargin = pos.allocatedMargin * filledFraction;
          const fillPnl = (reconciled.avgFillPrice - pos.entryPrice) * reconciled.filledQty;
          setPosition((p) => p ? { ...p, quantity: reconciled.remainingQty, allocatedMargin: p.allocatedMargin - freedMargin } : null);
          setBalance((b) => ({
            ...b,
            availableUsd: b.availableUsd + freedMargin + fillPnl,
            committedMarginUsd: b.committedMarginUsd - freedMargin,
          }));
        }
        if (reconciled?.status === 'FILLED' && pos) {
          const pnl = (reconciled.avgFillPrice - pos.entryPrice) * reconciled.filledQty;
          setPosition(null);
          setCompletedOrder(reconciled);
          setShowReceipt(true);
          setBalance((b) => ({
            ...b,
            committedMarginUsd: 0,
            availableUsd: b.availableUsd + pos.allocatedMargin + pnl,
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
    const pos = positionRef.current;
    // P0 fix B2: allow close even without activeOrder
    if (!pos) return;
    if (activeOrder?.status === 'ACK_LOST_PENDING_RECON') {
      setDuplicateAttempts((n) => n + 1);
      return;
    }
    const order = submitOrder(pos.symbol, 'SELL', pos.quantity, markPriceRef.current);
    setActiveOrder(order);
    if (order.status === 'FILLED') {
      const pnl = (order.avgFillPrice - pos.entryPrice) * pos.quantity;
      setBalance((b) => ({
        ...b,
        availableUsd: b.availableUsd + pos.allocatedMargin + pnl,
        committedMarginUsd: 0,
      }));
      setPosition(null);
      setCompletedOrder(order);
      setShowReceipt(true);
    }
  }

  function handleReducePosition() {
    const pos = positionRef.current;
    if (!pos || pos.quantity <= 1) return;
    const reduceQty = Math.ceil(pos.quantity * 0.25);
    const order = submitOrder(pos.symbol, 'SELL', reduceQty, markPriceRef.current);
    setActiveOrder(order);
    if (order.status === 'FILLED' || order.status === 'PARTIALLY_FILLED') {
      const freed = (pos.allocatedMargin / pos.quantity) * order.filledQty;
      setPosition((p) => p ? { ...p, quantity: p.quantity - order.filledQty, allocatedMargin: p.allocatedMargin - freed } : null);
      setBalance((b) => ({ ...b, availableUsd: b.availableUsd + freed, committedMarginUsd: b.committedMarginUsd - freed }));
    }
  }

  const contract = CONTRACT_CATALOG[symbol];

  return (
    <div className="terminal-root">
      <Header balance={balance} feedAge={feedAge} isSimulated={isSimMode} />

      {/* Trust evidence banner injected above the sidebar */}
      <div className="col-span-full">
        <TrustEvidenceBanner />
      </div>

      <ContractSidebar
        selectedSymbol={symbol}
        onSelect={setSymbol}
        position={position}
        balance={balance}
        onOpenExplainer={() => setShowExplainer(true)}
      />

      <main className="terminal-main p-4 space-y-4 bg-[var(--bg-base)] relative overflow-hidden">
        {/* Contract ticker */}
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
                <span className="badge badge-brand">USD Cash-Settled · SIMULATED</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {contract.underlyingName} · Max {contract.maxLeverage}× Leverage · 8h Funding
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span className="stat-label">Mark Price</span>
              <p className="text-[18px] font-mono font-bold text-[var(--text-primary)]">${markPrice.toFixed(2)}</p>
            </div>
            <div>
              <span className="stat-label">Feed age</span>
              <p className={`text-[13px] font-mono font-semibold ${feedAge > 3000 ? 'text-[var(--red)]' : 'text-[var(--green)]'}`}>
                {feedAge > 3000 ? 'STALE' : `${feedAge}ms`}
              </p>
            </div>
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
              <p className="text-[12px] text-[var(--text-secondary)] mt-1">
                Use the Judge Suite → step 01 to open a simulated position and explore trust features.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <AnimatedButton variant="ghost" size="sm" onClick={() => setShowExplainer(true)}>
                Learn Contract Rules
              </AnimatedButton>
              <AnimatedButton variant="primary" size="sm" onClick={() => handleDemoStep('OPEN_POSITION')}>
                <Zap className="w-3.5 h-3.5 mr-1" />Open 5× Simulated Position
              </AnimatedButton>
            </div>
          </div>
        ) : (
          <div className="space-y-4 fade-in">
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

        {(activeOrder || position) && (
          <div className="fade-in">
            <TransactionRecoveryPanel
              order={activeOrder}
              onReconcile={() => handleDemoStep('RECONCILE_PARTIAL')}
              onConfirmClose={handleClosePosition}
              isReconciling={isReconciling}
              duplicateAttempts={duplicateAttempts}
            />
          </div>
        )}
      </main>

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

      {showExplainer && (
        <PreTradeExplainer
          selectedSymbol={symbol}
          onSymbolChange={setSymbol}
          leverage={leverage}
          onLeverageChange={setLeverage}
          quantity={quantity}
          onQuantityChange={setQuantity}
          onOpenSimulation={() => {
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
