'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, ChevronDown, ChevronUp,
  Shield, Zap, Users, BarChart3, Target, AlertTriangle,
  ArrowRight, Info, ExternalLink, RotateCcw, Plus, Calendar,
} from 'lucide-react';

import {
  runModel, sweepPricing, sensitivityTornado,
  ModelInputs, DEFAULT_TRUST_LEVERS, TrustLever,
} from '../core/growth/model';
import {
  PRESET_SCENARIOS, BASELINE_INPUTS, RECOMMENDED_INPUTS, Scenario,
} from '../core/growth/scenarios';
import { formatINR, formatINRCompact, formatPct, PROVENANCE_COLORS, Provenance } from '../config/deckNumbers';
import RolloutPlanner, { Intervention, MarketNightEvent } from '../components/RolloutPlanner';
import BaselineComparison from '../components/BaselineComparison';
import MonthlyProjectionsChart from '../components/MonthlyProjectionsChart';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 0) {
  if (!isFinite(n) || isNaN(n)) return '—';
  return n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

type ProvenanceBadge = { label: string; color: string };
const PROVENANCE: Record<string, ProvenanceBadge> = {
  MEASURED: { label: 'MEASURED', color: PROVENANCE_COLORS.MEASURED },
  SIMULATED: { label: 'SIMULATED', color: PROVENANCE_COLORS.SIMULATED },
  ASSUMED: { label: 'ASSUMED', color: PROVENANCE_COLORS.ASSUMED },
  DERIVED: { label: 'DERIVED', color: PROVENANCE_COLORS.DERIVED },
};

function ProvenanceChip({ type }: { type: string }) {
  const b = PROVENANCE[type] || PROVENANCE.ASSUMED;
  return (
    <span style={{ color: b.color, borderColor: b.color + '44' }}
      className="text-[9px] font-bold border rounded px-1 py-0.5 tracking-widest">
      {b.label}
    </span>
  );
}

function KpiCard({ label, value, sub, positive, provenance, explanation }: {
  label: string; value: string; sub?: string;
  positive?: boolean | null; provenance?: string; explanation?: string;
}) {
  return (
    <div className="card p-3 bg-[var(--bg-surface)] space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">{label}</span>
        {provenance && <ProvenanceChip type={provenance} />}
      </div>
      <p className={`text-[18px] font-mono font-bold ${positive === true ? 'text-[var(--green)]' : positive === false ? 'text-[var(--red)]' : 'text-[var(--text-primary)]'}`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-[var(--text-muted)]">{sub}</p>}
      {explanation && (
        <p className="text-[9px] text-[var(--text-muted)] italic leading-relaxed pt-1 border-t border-[var(--border)]">
          💡 {explanation}
        </p>
      )}
    </div>
  );
}

export default function DecisionCockpit() {
  const [mounted, setMounted] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([...PRESET_SCENARIOS]);
  const [activeScenarioId, setActiveScenarioId] = useState('recommended');
  const [compareScenarioId, setCompareScenarioId] = useState<string | null>('baseline');
  const [showLedger, setShowLedger] = useState(false);
  const [showSensitivity, setShowSensitivity] = useState(false);
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [showJudgeMode, setShowJudgeMode] = useState(true);
  const [judgeModeStep, setJudgeModeStep] = useState(0);

  // Rollout Planner State
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [showRolloutView, setShowRolloutView] = useState(false);
  const [rolloutMetric, setRolloutMetric] = useState<'volume' | 'revenue' | 'traders' | 'contribution'>('revenue');
  
  // Default interventions based on trust levers
  const [interventions, setInterventions] = useState<Intervention[]>([
    {
      id: 'fit-check',
      name: 'Funding/Withdrawal Clarity',
      description: 'Pre-trade eligibility checks and clear withdrawal rules',
      launchMonth: 1,
      coverage: 1.0,
      rampMonths: 0,
      setupCost: 0,
      monthlyCost: 0,
      betaDeposit: 0.03,
      betaFirstTrade: 0.02,
      betaRetention: 0.01,
      betaTickets: -0.15,
      icon: Shield,
      color: '#10b981',
      proofRoute: '/proof/contracts',
    },
    {
      id: 'trade-preview',
      name: 'Fee/Exposure Preview',
      description: 'Show exact fee and exposure before confirming trade',
      launchMonth: 1,
      coverage: 1.0,
      rampMonths: 0,
      setupCost: 0,
      monthlyCost: 0,
      betaDeposit: 0.02,
      betaFirstTrade: 0.08,
      betaRetention: 0.03,
      betaTickets: -0.1,
      icon: Zap,
      color: '#3b82f6',
      proofRoute: '/proof/terminal',
    },
    {
      id: 'transaction-recovery',
      name: 'Transaction Recovery',
      description: 'Help users recover from mistakes',
      launchMonth: 3,
      coverage: 0.8,
      rampMonths: 2,
      setupCost: 15000,
      monthlyCost: 2500,
      betaDeposit: 0,
      betaFirstTrade: 0,
      betaRetention: 0.05,
      betaTickets: -0.2,
      icon: AlertTriangle,
      color: '#f59e0b',
      proofRoute: '/proof/terminal',
    },
  ]);

  const [marketNightEvents, setMarketNightEvents] = useState<MarketNightEvent[]>(
    Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      plannedCount: 4,
      fundedCount: 4,
      capacity: 48,
      attendance: 0.75,
      newProspectShare: 0.85,
      costPerEvent: 3500,
    }))
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId)!;
  const compareScenario = compareScenarioId ? scenarios.find((s) => s.id === compareScenarioId) : null;

  const result = useMemo(() => runModel(activeScenario.inputs), [activeScenario.inputs]);
  const compareResult = useMemo(
    () => (compareScenario ? runModel(compareScenario.inputs) : null),
    [compareScenario]
  );

  const lastSnap = result.snapshots[result.snapshots.length - 1];
  const compareLastSnap = compareResult?.snapshots[compareResult.snapshots.length - 1];

  // Handler for intervention updates
  const handleInterventionUpdate = useCallback((id: string, updates: Partial<Intervention>) => {
    setInterventions(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, []);

  // Handler for market night updates
  const handleMarketNightUpdate = useCallback((month: number, updates: Partial<MarketNightEvent>) => {
    setMarketNightEvents(prev => prev.map(e => e.month === month ? { ...e, ...updates } : e));
  }, []);

  // Handler for intervention click (placeholder for future drawer)
  const handleInterventionClick = useCallback((id: string) => {
    console.log('Intervention clicked:', id);
    // TODO: Open intervention editing drawer
  }, []);

  const optimizerData = useMemo(() => {
    if (!showOptimizer) return [];
    return sweepPricing(activeScenario.inputs);
  }, [showOptimizer, activeScenario.inputs]);

  const optPoint = optimizerData.length
    ? optimizerData.reduce((best, p) => (p.contribution > best.contribution ? p : best))
    : null;

  const tornadoData = useMemo(() => {
    if (!showSensitivity) return [];
    return sensitivityTornado(activeScenario.inputs);
  }, [showSensitivity, activeScenario.inputs]);

  const trustLevers = activeScenario.inputs.trustLevers;

  function updateLever(id: string, patch: Partial<TrustLever>) {
    setScenarios((prev) =>
      prev.map((s) =>
        s.id !== activeScenarioId ? s : {
          ...s,
          inputs: {
            ...s.inputs,
            trustLevers: s.inputs.trustLevers.map((l) =>
              l.id === id ? { ...l, ...patch } : l
            ),
          },
        }
      )
    );
  }

  function updateInput(path: string, value: number) {
    setScenarios((prev) =>
      prev.map((s) => {
        if (s.id !== activeScenarioId) return s;
        const newInputs = JSON.parse(JSON.stringify(s.inputs)) as ModelInputs;
        if (path.includes('.')) {
          const [section, key] = path.split('.');
          const sec = (newInputs as unknown as Record<string, Record<string, number>>)[section];
          if (sec) sec[key] = value;
        } else {
          (newInputs as unknown as Record<string, number>)[path] = value;
        }
        return { ...s, inputs: newInputs };
      })
    );
  }

  function cloneScenario() {
    const id = 'custom-' + Date.now();
    setScenarios((prev) => [
      ...prev,
      { ...activeScenario, id, name: activeScenario.name + ' (Copy)', isPreset: false, color: '#60a5fa' },
    ]);
    setActiveScenarioId(id);
  }

  const judgeModeSteps = [
    { title: '① Thesis', desc: 'Our Round 1 recommendation: Crew Pass + trust → lower CAC, higher retention, fee-insensitive users.' },
    { title: '② Compare', desc: 'Switch active tab to "Baseline". The Recommended scenario cuts blended CAC by ~70% via Crew Pass channel.' },
    { title: '③ Trust → Numbers', desc: 'Toggle a trust lever off. Watch retention drop in the funnel. Click "See it work" to view the live implementation.' },
    { title: '④ Price it', desc: 'Open the Pricing Optimiser. See how higher trust shifts the optimal fee rightward.' },
    { title: '⑤ Break it', desc: 'Switch to "Honest Stress" scenario tab. Trust levers fail → see when Baseline wins.' },
  ];

  const inp = activeScenario.inputs;

  const decision = useMemo(() => {
    if (!lastSnap) return null;
    const feeBps = inp.pricing.takerFeeBps;
    const crewEvents = inp.channel.crewEventsPerMonth;
    const ltvCac = lastSnap.ltvCacRatio;
    const breakeven = result.breakevenMonth;
    const parts: string[] = [];
    if (feeBps <= 6) parts.push(`Set taker fee at ${feeBps} bps — competitive vs Dhan/Zerodha futures spread.`);
    else parts.push(`Consider reducing taker fee below 8 bps — current ${feeBps} bps suppresses volume via price elasticity.`);
    if (crewEvents >= 3) parts.push(`Run ${crewEvents} Market Night events/month — crew CAC ${formatINR(lastSnap.crewCacInr, 0)} vs paid ${formatINR(lastSnap.paidCacInr, 0)}.`);
    else parts.push(`Increase Crew Pass cadence — paid channel is carrying all acquisition cost.`);
    if (ltvCac > 3) parts.push(`LTV:CAC ${fmt(ltvCac, 1)}× is healthy. Growth is economically sustainable.`);
    else parts.push(`⚠ LTV:CAC ${fmt(ltvCac, 1)}× below 3× threshold — cut paid spend or improve retention first.`);
    if (breakeven && breakeven <= 9) parts.push(`Contribution breakeven at month ${breakeven} — viable within pre-seed runway.`);
    else parts.push(`Breakeven not reached in 12 months — reduce event spend or increase conversion rates.`);
    return parts;
  }, [inp, lastSnap, result.breakevenMonth]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex items-center justify-center">
        <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
          <div className="w-4 h-4 rounded-full border-2 border-[var(--brand)] border-t-transparent animate-spin" />
          Loading Decision Cockpit...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">

      {/* ── Top Bar ──────────────────────────────────────────────────────────── */}
      <header className="h-12 border-b border-[var(--border)] flex items-center px-4 gap-4 bg-[var(--bg-surface)] sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[var(--brand)] flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5 text-black" />
          </div>
          <span className="font-bold text-[13px]">MochaTrade</span>
          <span className="text-[var(--text-muted)] text-[11px]">/ Decision Cockpit</span>
        </div>
        <div className="flex-1" />
        <nav className="hidden md:flex items-center gap-1 text-[11px]">
          <Link href="/proof/terminal" className="px-2 py-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1">
            <Shield className="w-3 h-3" /> Trust Evidence
          </Link>
          <Link href="/proof/market-night" className="px-2 py-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1">
            <Users className="w-3 h-3" /> Market Night
          </Link>
          <Link href="/proof/contracts" className="px-2 py-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1">
            <Zap className="w-3 h-3" /> Contract Rules
          </Link>
        </nav>
        <button
          onClick={() => setShowJudgeMode(!showJudgeMode)}
          className="btn btn-sm border border-[var(--brand-border)] text-[var(--brand)] hover:bg-[var(--brand-dim)] text-[11px] px-2 py-1"
        >
          {showJudgeMode ? 'Exit' : '▶'} Judge Mode
        </button>
      </header>

      {/* ── Judge Mode Guide Bar ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showJudgeMode && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="border-b border-[var(--brand-border)] bg-[var(--brand-dim)] px-4 py-2 flex items-center gap-4"
          >
            <span className="text-[11px] font-bold text-[var(--brand)] shrink-0">JUDGE MODE</span>
            <div className="flex items-center gap-2 overflow-x-auto">
              {judgeModeSteps.map((step, i) => (
                <button key={i} onClick={() => setJudgeModeStep(i)}
                  className={`text-[10px] px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors ${i === judgeModeStep
                    ? 'bg-[var(--brand)] text-black border-[var(--brand)] font-bold'
                    : 'border-[var(--brand-border)] text-[var(--text-secondary)] hover:text-[var(--brand)]'
                    }`}>
                  {step.title}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] shrink-0 max-w-xs hidden md:block">
              {judgeModeSteps[judgeModeStep].desc}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Thesis Banner ──────────────────────────────────────────────────── */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 flex items-start gap-3">
        <span className="text-[var(--brand)] text-[9px] font-bold uppercase tracking-widest mt-0.5 shrink-0">Round 1 Thesis</span>
        <p className="text-[11px] text-[var(--text-secondary)]">
          Shift MochaTrade from paid-acquisition-led to a{' '}
          <strong className="text-[var(--text-primary)]">trust-first, community-viral growth engine</strong>
          {' '}— lower CAC via Crew Pass, higher retention via explainable trust features, fee-insensitive users via demonstrated platform reliability.
        </p>
      </div>

      {/* ── ONE-SCREEN STORY (STEP 1) ─────────────────────────────────────── */}
      {compareResult && compareLastSnap && (
        <div className="border-b-2 border-[var(--brand-border)] bg-gradient-to-r from-[var(--brand-dim)] to-[var(--bg-surface)] px-4 py-4">
          {/* Live Story Sentence */}
          <div className="mb-4">
            <p className="text-[14px] leading-relaxed text-[var(--text-primary)]">
              <span className="font-bold text-[var(--brand)]">With the recommended plan,</span>{' '}
              Year-1 active traders go from{' '}
              <span className="font-mono font-bold text-[var(--text-secondary)]">{fmt(compareLastSnap.activeUsers)}</span>{' '}
              to{' '}
              <span className="font-mono font-bold text-[var(--brand)]">{fmt(lastSnap.activeUsers)}</span>
              {lastSnap.activeUsers >= compareLastSnap.activeUsers && (
                <span className="text-[var(--green)] font-semibold"> (+{fmt(lastSnap.activeUsers - compareLastSnap.activeUsers)})</span>
              )}
              {' '}and profit from{' '}
              <span className="font-mono font-bold text-[var(--text-secondary)]">{formatINRCompact(compareResult.totalContribution12m)}</span>{' '}
              to{' '}
              <span className="font-mono font-bold text-[var(--brand)]">{formatINRCompact(result.totalContribution12m)}</span>
              {result.totalContribution12m >= compareResult.totalContribution12m ? (
                <span className="text-[var(--green)] font-semibold"> (+{formatINRCompact(result.totalContribution12m - compareResult.totalContribution12m)})</span>
              ) : (
                <span className="text-[var(--red)] font-semibold"> ({formatINRCompact(result.totalContribution12m - compareResult.totalContribution12m)})</span>
              )}
              {' '}because{' '}
              <span className="text-[var(--text-primary)]">
                Crew Pass cuts customer cost from {formatINR(compareLastSnap.blendedCacInr, 0)} to {formatINR(lastSnap.blendedCacInr, 0)} 
                {' '}while trust features keep them trading longer.
              </span>
            </p>
          </div>

          {/* 3 Headline Numbers: Side-by-Side Comparison */}
          <div className="grid grid-cols-3 gap-4">
            {/* Active Traders */}
            <div className="bg-[var(--bg-surface)] rounded-lg p-4 border border-[var(--border)]">
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Active Traders (Year 1)</div>
              <div className="flex items-end justify-between gap-3">
                <div className="flex-1">
                  <div className="text-[10px] text-[var(--text-secondary)] mb-1">Baseline</div>
                  <div className="text-[20px] font-mono font-bold text-[var(--text-secondary)]">{fmt(compareLastSnap.activeUsers)}</div>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-[var(--brand)]" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] text-[var(--brand)] mb-1">Recommended</div>
                  <div className="text-[20px] font-mono font-bold text-[var(--brand)]">{fmt(lastSnap.activeUsers)}</div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1">
                {lastSnap.activeUsers >= compareLastSnap.activeUsers ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-[var(--green)]" />
                    <span className="text-[11px] font-semibold text-[var(--green)]">
                      +{fmt(lastSnap.activeUsers - compareLastSnap.activeUsers)} ({formatPct((lastSnap.activeUsers - compareLastSnap.activeUsers) / compareLastSnap.activeUsers)})
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-[var(--red)]" />
                    <span className="text-[11px] font-semibold text-[var(--red)]">
                      {fmt(lastSnap.activeUsers - compareLastSnap.activeUsers)} ({formatPct((lastSnap.activeUsers - compareLastSnap.activeUsers) / compareLastSnap.activeUsers)})
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-[var(--bg-surface)] rounded-lg p-4 border border-[var(--border)]">
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-2">12-Month Revenue</div>
              <div className="flex items-end justify-between gap-3">
                <div className="flex-1">
                  <div className="text-[10px] text-[var(--text-secondary)] mb-1">Baseline</div>
                  <div className="text-[20px] font-mono font-bold text-[var(--text-secondary)]">{formatINRCompact(compareResult.totalRevenue12m)}</div>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-[var(--brand)]" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] text-[var(--brand)] mb-1">Recommended</div>
                  <div className="text-[20px] font-mono font-bold text-[var(--brand)]">{formatINRCompact(result.totalRevenue12m)}</div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1">
                {result.totalRevenue12m >= compareResult.totalRevenue12m ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-[var(--green)]" />
                    <span className="text-[11px] font-semibold text-[var(--green)]">
                      +{formatINRCompact(result.totalRevenue12m - compareResult.totalRevenue12m)} ({formatPct((result.totalRevenue12m - compareResult.totalRevenue12m) / compareResult.totalRevenue12m)})
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-[var(--red)]" />
                    <span className="text-[11px] font-semibold text-[var(--red)]">
                      {formatINRCompact(result.totalRevenue12m - compareResult.totalRevenue12m)} ({formatPct((result.totalRevenue12m - compareResult.totalRevenue12m) / compareResult.totalRevenue12m)})
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Profit (Contribution) */}
            <div className="bg-[var(--bg-surface)] rounded-lg p-4 border border-[var(--border)]">
              <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider mb-2">12-Month Profit</div>
              <div className="flex items-end justify-between gap-3">
                <div className="flex-1">
                  <div className="text-[10px] text-[var(--text-secondary)] mb-1">Baseline</div>
                  <div className={`text-[20px] font-mono font-bold ${compareResult.totalContribution12m >= 0 ? 'text-[var(--text-secondary)]' : 'text-[var(--red)]'}`}>
                    {formatINRCompact(compareResult.totalContribution12m)}
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-[var(--brand)]" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] text-[var(--brand)] mb-1">Recommended</div>
                  <div className={`text-[20px] font-mono font-bold ${result.totalContribution12m >= 0 ? 'text-[var(--brand)]' : 'text-[var(--red)]'}`}>
                    {formatINRCompact(result.totalContribution12m)}
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1">
                {result.totalContribution12m >= compareResult.totalContribution12m ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-[var(--green)]" />
                    <span className="text-[11px] font-semibold text-[var(--green)]">
                      +{formatINRCompact(result.totalContribution12m - compareResult.totalContribution12m)}
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-[var(--red)]" />
                    <span className="text-[11px] font-semibold text-[var(--red)]">
                      {formatINRCompact(result.totalContribution12m - compareResult.totalContribution12m)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Scenario Tabs ─────────────────────────────────────────────────── */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 flex items-center gap-0 overflow-x-auto">
        {scenarios.map((s) => (
          <button key={s.id} onClick={() => setActiveScenarioId(s.id)}
            className={`px-3 py-2.5 text-[11px] font-semibold border-b-2 transition-colors whitespace-nowrap`}
            style={{
              borderBottomColor: s.id === activeScenarioId ? s.color : 'transparent',
              color: s.id === activeScenarioId ? s.color : 'var(--text-secondary)',
            }}>
            {s.name}
          </button>
        ))}
        <button onClick={cloneScenario}
          className="px-3 py-2.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--brand)] flex items-center gap-1">
          <Plus className="w-3 h-3" /> New
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setShowRolloutView(!showRolloutView)}
          className={`px-3 py-2 text-[10px] font-semibold rounded mr-3 flex items-center gap-1.5 transition-colors ${
            showRolloutView
              ? 'bg-[var(--brand)] text-black'
              : 'bg-[var(--bg-interactive)] text-[var(--text-secondary)] hover:text-[var(--brand)]'
          }`}>
          <Calendar className="w-3 h-3" />
          {showRolloutView ? 'Hide' : 'Show'} 12-Month Rollout
        </button>
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] pr-2">
          <span className="hidden sm:inline">Compare vs:</span>
          <select value={compareScenarioId || ''} onChange={(e) => setCompareScenarioId(e.target.value || null)}
            className="bg-[var(--bg-interactive)] border border-[var(--border)] rounded px-2 py-1 text-[10px] text-[var(--text-secondary)]">
            <option value="">None</option>
            {scenarios.filter((s) => s.id !== activeScenarioId).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Warnings ───────────────────────────────────────────────────────── */}
      {result.warnings.map((w, i) => (
        <div key={i} className="bg-[var(--red-dim)] border-b border-[var(--red-border)] px-4 py-2 flex items-center gap-2 text-[11px] text-[var(--red)]">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{w}
        </div>
      ))}

      {/* ── Scenario description strip ─────────────────────────────────────── */}
      <div className="border-b border-[var(--border)] px-4 py-2 bg-[var(--bg-base)] flex items-center gap-3">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: activeScenario.color }} />
        <p className="text-[11px] text-[var(--text-muted)]">{activeScenario.description}</p>
      </div>

      {/* ── Main 3-column layout ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] min-h-[calc(100vh-200px)]">

        {/* ── LEFT: Inputs ─────────────────────────────────────────────────── */}
        <div className="border-r border-[var(--border)] p-4 space-y-5 overflow-y-auto">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Inputs</div>

          {/* Pricing */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1">
              Pricing
            </h3>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] items-center gap-2">
                <span className="flex items-center gap-1">
                  Fee per trade
                  <span className="text-[9px] text-[var(--text-muted)] cursor-help" title="On ₹50,000 trade: 2 bps = ₹10, 5 bps = ₹25, 10 bps = ₹50">
                    ⓘ
                  </span>
                </span>
                <span className="font-mono text-[var(--brand)]">{inp.pricing.takerFeeBps} bps</span>
              </div>
              <div className="text-[9px] text-[var(--text-muted)] leading-relaxed">
                Lower fee = more traders stay, but less money per trade. 
                At <strong>{inp.pricing.takerFeeBps} bps</strong> on ₹50,000 trade = <strong>{formatINR(50000 * inp.pricing.takerFeeBps / 10000, 0)}</strong>
              </div>
              <input type="range" min={1} max={20} step={0.5} value={inp.pricing.takerFeeBps}
                onChange={(e) => updateInput('pricing.takerFeeBps', +e.target.value)}
                className="w-full accent-amber-500" />
              <div className="flex justify-between text-[9px] text-[var(--text-muted)]">
                <span>1 bps (₹5)</span><ProvenanceChip type="ASSUMED" /><span>20 bps (₹100)</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] items-center gap-2">
                <span className="flex items-center gap-1">
                  Currency conversion fee
                  <span className="text-[9px] text-[var(--text-muted)] cursor-help" title="When depositing INR that gets converted to USD for trading">
                    ⓘ
                  </span>
                </span>
                <span className="font-mono text-[var(--brand)]">{inp.pricing.fxSpreadPct}%</span>
              </div>
              <div className="text-[9px] text-[var(--text-muted)]">
                On ₹10,000 deposit = {formatINR(10000 * inp.pricing.fxSpreadPct / 100, 0)} fee
              </div>
              <input type="range" min={0.1} max={0.5} step={0.05} value={inp.pricing.fxSpreadPct}
                onChange={(e) => updateInput('pricing.fxSpreadPct', +e.target.value)}
                className="w-full accent-amber-500" />
              <ProvenanceChip type="SIMULATED" />
            </div>
          </div>

          {/* Channels */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold text-[var(--text-secondary)]">How We Get Traders</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] items-center gap-2">
                <span className="flex items-center gap-1">
                  Paid ads budget
                  <span className="text-[9px] text-[var(--text-muted)] cursor-help" title="Google/Facebook ads, influencer sponsorships">
                    ⓘ
                  </span>
                </span>
                <span className="font-mono text-[var(--brand)]">{formatINRCompact(inp.channel.paidBudgetInr)}/mo</span>
              </div>
              <div className="text-[9px] text-[var(--text-muted)]">
                At ₹{inp.channel.paidCostPerSignup.toLocaleString('en-IN')} per signup = {fmt(inp.channel.paidBudgetInr / inp.channel.paidCostPerSignup, 0)} new traders/month
              </div>
              <input type="range" min={0} max={200000} step={5000} value={inp.channel.paidBudgetInr}
                onChange={(e) => updateInput('channel.paidBudgetInr', +e.target.value)}
                className="w-full accent-amber-500" />
              <ProvenanceChip type="ASSUMED" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] items-center gap-2">
                <span className="flex items-center gap-1">
                  Market Night events/month
                  <span className="text-[9px] text-[var(--text-muted)] cursor-help" title="Team-based trading events where 4 people learn together">
                    ⓘ
                  </span>
                </span>
                <span className="font-mono text-[var(--brand)]">{inp.channel.crewEventsPerMonth}</span>
              </div>
              <div className="text-[9px] text-[var(--text-muted)]">
                Each event = {inp.channel.crewsPerEvent} crews × 4 people = {inp.channel.crewsPerEvent * 4} invites
              </div>
              <input type="range" min={0} max={16} step={1} value={inp.channel.crewEventsPerMonth}
                onChange={(e) => updateInput('channel.crewEventsPerMonth', +e.target.value)}
                className="w-full accent-amber-500" />
              <ProvenanceChip type="ASSUMED" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span>Crews per event</span>
                <span className="font-mono text-[var(--brand)]">{inp.channel.crewsPerEvent}</span>
              </div>
              <input type="range" min={0} max={20} step={1} value={inp.channel.crewsPerEvent}
                onChange={(e) => updateInput('channel.crewsPerEvent', +e.target.value)}
                className="w-full accent-amber-500" />
              <ProvenanceChip type="ASSUMED" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] items-center gap-2">
                <span className="flex items-center gap-1">
                  Event → signup rate
                  <span className="text-[9px] text-[var(--text-muted)] cursor-help" title="How many event attendees actually join the platform">
                    ⓘ
                  </span>
                </span>
                <span className="font-mono text-[var(--brand)]">{formatPct(inp.channel.crewJoinRate)}</span>
              </div>
              <div className="text-[9px] text-[var(--text-muted)]">
                Out of 12 people at event, {fmt(12 * inp.channel.crewJoinRate, 0)} join
              </div>
              <input type="range" min={0.1} max={0.95} step={0.01} value={inp.channel.crewJoinRate}
                onChange={(e) => updateInput('channel.crewJoinRate', +e.target.value)}
                className="w-full accent-amber-500" />
              <ProvenanceChip type="SIMULATED" />
            </div>
          </div>

          {/* Volume & Funnel */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-semibold text-[var(--text-secondary)]">Trader Behavior</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] items-center gap-2">
                <span className="flex items-center gap-1">
                  Trading volume per person
                  <span className="text-[9px] text-[var(--text-muted)] cursor-help" title="Total rupee value of trades each active trader makes per month">
                    ⓘ
                  </span>
                </span>
                <span className="font-mono text-[var(--brand)]">{formatINRCompact(inp.baseVolumePerActiveInr)}/mo</span>
              </div>
              <div className="text-[9px] text-[var(--text-muted)]">
                More volume = more fees collected. At {inp.pricing.takerFeeBps} bps = {formatINR(inp.baseVolumePerActiveInr * inp.pricing.takerFeeBps / 10000, 0)}/trader/month
              </div>
              <input type="range" min={50000} max={500000} step={10000} value={inp.baseVolumePerActiveInr}
                onChange={(e) => updateInput('baseVolumePerActiveInr', +e.target.value)}
                className="w-full accent-amber-500" />
              <ProvenanceChip type="ASSUMED" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] items-center gap-2">
                <span className="flex items-center gap-1">
                  Traders who stay each month
                  <span className="text-[9px] text-[var(--text-muted)] cursor-help" title="If 100 traders this month, how many still trade next month?">
                    ⓘ
                  </span>
                </span>
                <span className="font-mono text-[var(--brand)]">{formatPct(inp.funnelRetention)}</span>
              </div>
              <div className="text-[9px] text-[var(--text-muted)]">
                Out of 100 traders, {fmt(100 * inp.funnelRetention, 0)} come back next month
              </div>
              <input type="range" min={0.1} max={0.9} step={0.01} value={inp.funnelRetention}
                onChange={(e) => updateInput('funnelRetention', +e.target.value)}
                className="w-full accent-amber-500" />
              <ProvenanceChip type="ASSUMED" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] items-center gap-2">
                <span className="flex items-center gap-1">
                  Fee sensitivity
                  <span className="text-[9px] text-[var(--text-muted)] cursor-help" title="How much traders reduce volume when fees go up. Higher = more sensitive">
                    ⓘ
                  </span>
                </span>
                <span className="font-mono text-[var(--brand)]">{inp.priceElasticity.toFixed(1)}</span>
              </div>
              <div className="text-[9px] text-[var(--text-muted)]">
                {inp.priceElasticity < 0.5 ? 'Not sensitive - traders trade the same even with higher fees' : 
                 inp.priceElasticity < 1 ? 'Somewhat sensitive - some reduce trading when fees rise' :
                 'Very sensitive - traders cut way back when fees rise'}
              </div>
              <input type="range" min={0.2} max={2.0} step={0.1} value={inp.priceElasticity}
                onChange={(e) => updateInput('priceElasticity', +e.target.value)}
                className="w-full accent-amber-500" />
              <ProvenanceChip type="ASSUMED" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] items-center gap-2">
                <span className="flex items-center gap-1">
                  Trust protection effect
                  <span className="text-[9px] text-[var(--text-muted)] cursor-help" title="How much trust features reduce fee sensitivity. Higher = trust makes users less price-conscious">
                    ⓘ
                  </span>
                </span>
                <span className="font-mono text-[var(--brand)]">{inp.trustElasticityDampening.toFixed(2)}</span>
              </div>
              <div className="text-[9px] text-[var(--text-muted)] leading-relaxed">
                When traders trust the platform, they care less about fees. 
                {inp.trustElasticityDampening > 0.3 ? ' Strong effect!' : inp.trustElasticityDampening > 0.15 ? ' Moderate effect.' : ' Weak effect.'}
              </div>
              <input type="range" min={0} max={0.5} step={0.01} value={inp.trustElasticityDampening}
                onChange={(e) => updateInput('trustElasticityDampening', +e.target.value)}
                className="w-full accent-amber-500" />
              <ProvenanceChip type="ASSUMED" />
            </div>
          </div>

          <button onClick={() => setScenarios([...PRESET_SCENARIOS])}
            className="w-full text-[10px] text-[var(--text-muted)] hover:text-[var(--brand)] flex items-center justify-center gap-1 py-1">
            <RotateCcw className="w-3 h-3" /> Reset all to presets
          </button>
        </div>

        {/* ── CENTER: Projection ───────────────────────────────────────────── */}
        <div className="p-4 space-y-4 overflow-y-auto">

          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard 
              label="Cost to get 1 trader"
              value={formatINR(lastSnap?.blendedCacInr || 0, 0)}
              sub={compareLastSnap ? `vs ${formatINR(compareLastSnap.blendedCacInr, 0)} (${compareScenario?.name})` : undefined}
              positive={compareLastSnap ? (lastSnap.blendedCacInr < compareLastSnap.blendedCacInr) : null}
              provenance="DERIVED"
              explanation="Lower is better. Mix of paid ads + Market Night events + referrals." 
            />
            <KpiCard 
              label="Does each trader earn back their cost?"
              value={(() => {
                const ratio = lastSnap?.ltvCacRatio || 0;
                const emoji = ratio < 1 ? '🔴' : ratio < 3 ? '🟡' : '🟢';
                return `${emoji} ${fmt(ratio, 1)}×`;
              })()}
              sub={compareLastSnap ? `baseline: ${fmt(compareLastSnap.ltvCacRatio, 1)}×` : undefined}
              positive={compareLastSnap ? (lastSnap.ltvCacRatio > compareLastSnap.ltvCacRatio) : null}
              provenance="DERIVED"
              explanation={
                lastSnap?.ltvCacRatio < 1 ? "🔴 Under 1× = losing money on each trader" :
                lastSnap?.ltvCacRatio < 3 ? "🟡 1-3× = barely profitable, risky" :
                "🟢 Over 3× = healthy, each trader earns back 3x+ their cost"
              }
            />
            <KpiCard 
              label="12-month revenue"
              value={formatINRCompact(result.totalRevenue12m)}
              sub={compareResult ? `vs ${formatINRCompact(compareResult.totalRevenue12m)}` : undefined}
              positive={compareResult ? (result.totalRevenue12m > compareResult.totalRevenue12m) : null}
              provenance="DERIVED"
              explanation="Trading fees + currency conversion fees from all traders."
            />
            <KpiCard 
              label="When do we break even?"
              value={result.breakevenMonth ? `Month ${result.breakevenMonth}` : '> 12 mo'}
              positive={result.breakevenMonth !== null && result.breakevenMonth <= 9}
              provenance="DERIVED"
              explanation="When total profit becomes positive (revenue > costs)."
            />
          </div>

          {/* Revenue chart */}
          <div className="card p-4 bg-[var(--bg-surface)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold">12-Month Revenue Projection <ProvenanceChip type="DERIVED" /></span>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-1.5 rounded" style={{ background: activeScenario.color }} />
                  {activeScenario.name}
                </span>
                {compareScenario && (
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-1.5 rounded opacity-50" style={{ background: compareScenario.color }} />
                    {compareScenario.name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-end gap-0.5 h-28">
              {result.snapshots.map((snap, i) => {
                const maxRev = Math.max(...result.snapshots.map((s) => s.totalRevenue),
                  ...(compareResult?.snapshots.map((s) => s.totalRevenue) || []), 1);
                const h = Math.max(2, (snap.totalRevenue / maxRev) * 100);
                const compSnap = compareResult?.snapshots[i];
                const ch = compSnap ? Math.max(2, (compSnap.totalRevenue / maxRev) * 100) : 0;
                return (
                  <div key={i} className="flex-1 flex items-end gap-0.5">
                    {compareScenario && compSnap && (
                      <div className="flex-1 rounded-t opacity-40" style={{ height: `${ch}%`, background: compareScenario.color }} />
                    )}
                    <div className="flex-1 rounded-t" style={{ height: `${h}%`, background: activeScenario.color }} />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[9px] text-[var(--text-muted)] mt-1">
              <span>Mo 1</span><span>Mo 6</span><span>Mo 12</span>
            </div>
          </div>

          {/* Funnel bars */}
          <div className="card p-4 bg-[var(--bg-surface)]">
            <div className="text-[11px] font-semibold mb-3">
              Month 12 Funnel <ProvenanceChip type="DERIVED" />
            </div>
            {([
              ['Signups', lastSnap?.totalSignups || 0, compareLastSnap?.totalSignups],
              ['KYC Passed', lastSnap?.kycPassed || 0, compareLastSnap?.kycPassed],
              ['Deposited', lastSnap?.deposited || 0, compareLastSnap?.deposited],
              ['First Trade', lastSnap?.firstTraded || 0, compareLastSnap?.firstTraded],
              ['Active (M12)', lastSnap?.activeUsers || 0, compareLastSnap?.activeUsers],
            ] as [string, number, number | undefined][]).map(([label, val, cVal]) => {
              const max = lastSnap?.totalSignups || 1;
              const colors: Record<string, string> = {
                'Signups': '#60a5fa', 'KYC Passed': '#f59e0b', 'Deposited': '#f59e0b',
                'First Trade': '#22c55e', 'Active (M12)': '#22c55e',
              };
              return (
                <div key={label} className="flex items-center gap-2 mb-2">
                  <div className="w-20 text-[10px] text-[var(--text-secondary)] text-right">{label}</div>
                  <div className="flex-1 h-4 bg-[var(--bg-interactive)] rounded-sm overflow-hidden relative">
                    {cVal !== undefined && (
                      <div className="absolute inset-y-0 left-0 rounded-sm opacity-30"
                        style={{ width: `${(cVal / max) * 100}%`, background: compareScenario?.color || '#7e7e9a' }} />
                    )}
                    <div className="absolute inset-y-0 left-0 rounded-sm"
                      style={{ width: `${(val / max) * 100}%`, background: colors[label] || '#60a5fa', opacity: 0.8 }} />
                  </div>
                  <div className="w-12 text-[10px] font-mono text-right">{fmt(val)}</div>
                  {cVal !== undefined && (
                    <div className={`w-12 text-[10px] font-mono text-right ${val >= cVal ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                      {val >= cVal ? '+' : ''}{fmt(val - cVal)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Channel mix */}
          <div className="card p-4 bg-[var(--bg-surface)]">
            <div className="text-[11px] font-semibold mb-3">Acquisition Mix — Month 12 <ProvenanceChip type="DERIVED" /></div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Paid', val: lastSnap?.paidSignups || 0, color: '#7e7e9a' },
                { label: 'Crew Pass', val: lastSnap?.crewSignups || 0, color: '#f59e0b' },
                { label: 'Organic', val: lastSnap?.organicSignups || 0, color: '#22c55e' },
                { label: 'Referral', val: lastSnap?.referralSignups || 0, color: '#60a5fa' },
              ].map(({ label, val, color }) => (
                <div key={label} className="text-center">
                  <p className="text-[20px] font-mono font-bold" style={{ color }}>{fmt(val)}</p>
                  <p className="text-[9px] text-[var(--text-muted)]">{label}</p>
                  <p className="text-[9px] text-[var(--text-muted)]">
                    {lastSnap?.totalSignups ? formatPct(val / lastSnap.totalSignups) : '0%'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Optimizer */}
          <div className="card bg-[var(--bg-surface)]">
            <button onClick={() => setShowOptimizer(!showOptimizer)}
              className="w-full flex items-center justify-between p-4 text-[11px] font-semibold hover:bg-[var(--bg-hover)]">
              <span className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[var(--brand)]" /> 
                What fee makes the most money?
                <span className="text-[9px] text-[var(--text-muted)] cursor-help" title="Tests every fee from 1-20 bps to find the most profitable">
                  ⓘ
                </span>
              </span>
              {showOptimizer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showOptimizer && (
              <div className="px-4 pb-4 space-y-3 border-t border-[var(--border)]">
                <p className="text-[10px] text-[var(--text-muted)] pt-2">
                  Tests every fee 1–20 bps while keeping everything else the same. 
                  <strong className="text-[var(--green)]"> Green = makes most profit.</strong>
                  {' '}<strong className="text-[var(--brand)]">Orange = current setting.</strong>
                </p>
                {optPoint && (
                  <div className="flex gap-6">
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)]">Optimal fee</p>
                      <p className="text-[20px] font-mono font-bold text-[var(--green)]">{optPoint.feeBps} bps</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)]">Max 12-mo contribution</p>
                      <p className="text-[20px] font-mono font-bold text-[var(--green)]">{formatINRCompact(optPoint.contribution)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)]">Current fee</p>
                      <p className="text-[20px] font-mono font-bold text-[var(--brand)]">{inp.pricing.takerFeeBps} bps</p>
                    </div>
                  </div>
                )}
                <div className="flex items-end gap-px h-20">
                  {optimizerData.map((p) => {
                    const maxC = Math.max(...optimizerData.map((x) => x.contribution));
                    const minC = Math.min(...optimizerData.map((x) => x.contribution));
                    const range = maxC - minC || 1;
                    const h = Math.max(2, ((p.contribution - minC) / range) * 100);
                    const isOpt = p.feeBps === optPoint?.feeBps;
                    const isCurr = Math.abs(p.feeBps - inp.pricing.takerFeeBps) < 0.3;
                    return (
                      <div key={p.feeBps} className="flex-1 rounded-t"
                        style={{ height: `${h}%`, background: isOpt ? '#22c55e' : isCurr ? '#f59e0b' : '#252535' }}
                        title={`${p.feeBps} bps → ${formatINRCompact(p.contribution)}`} />
                    );
                  })}
                </div>
                <div className="flex justify-between text-[9px] text-[var(--text-muted)]">
                  <span>1 bps</span>
                  <span className="text-[var(--green)]">▲ optimal</span>
                  <span className="text-[var(--brand)]">■ current</span>
                  <span>20 bps</span>
                </div>
                <ProvenanceChip type="DERIVED" />
              </div>
            )}
          </div>

          {/* Sensitivity Tornado */}
          <div className="card bg-[var(--bg-surface)]">
            <button onClick={() => setShowSensitivity(!showSensitivity)}
              className="w-full flex items-center justify-between p-4 text-[11px] font-semibold hover:bg-[var(--bg-hover)]">
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--brand)]" /> 
                What could hurt us most? (top 8 risks)
                <span className="text-[9px] text-[var(--text-muted)] cursor-help" title="Shows which assumptions have the biggest impact on profit if they're wrong">
                  ⓘ
                </span>
              </span>
              {showSensitivity ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showSensitivity && (
              <div className="px-4 pb-4 space-y-2 border-t border-[var(--border)]">
                <p className="text-[10px] text-[var(--text-muted)] pt-2">
                  If each assumption changes by ±20-50%, how much does year-end profit swing? 
                  <strong> Widest bar = biggest risk.</strong>
                </p>
                {tornadoData.map((t) => (
                  <div key={t.assumptionId} className="space-y-0.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-[var(--text-secondary)]">{t.label} <span className="text-[var(--text-muted)]">({t.assumptionId})</span></span>
                      <span className="text-[var(--text-muted)] font-mono">{formatINRCompact(t.swing)}</span>
                    </div>
                    <div className="h-3 bg-[var(--bg-interactive)] rounded overflow-hidden flex">
                      <div className="flex-1 flex items-center justify-end pr-px">
                        <div className="h-full bg-[var(--red)] opacity-70 rounded-l"
                          style={{ width: `${Math.min(100, (t.swing / (tornadoData[0]?.swing || 1)) * 50)}%` }} />
                      </div>
                      <div className="flex-1 flex items-center justify-start pl-px">
                        <div className="h-full bg-[var(--green)] opacity-70 rounded-r"
                          style={{ width: `${Math.min(100, (t.swing / (tornadoData[0]?.swing || 1)) * 50)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
                <ProvenanceChip type="DERIVED" />
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Trust Ladder + Decision ───────────────────────────────── */}
        <div className="border-l border-[var(--border)] p-4 space-y-4 overflow-y-auto">

          {/* Trust score header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Trust Ladder</span>
              <span className="text-[15px] font-mono font-bold text-[var(--brand)]">
                T = {formatPct(lastSnap?.trustScore || 0)}
              </span>
            </div>
            <div className="h-2 bg-[var(--bg-interactive)] rounded overflow-hidden">
              <div className="h-full bg-[var(--brand)] rounded transition-all duration-300"
                style={{ width: `${(lastSnap?.trustScore || 0) * 100}%` }} />
            </div>
            <p className="text-[9px] text-[var(--text-muted)]">
              Each lever feeds into T → adjusts funnel conversions + support cost.{' '}
              Toggle off to see the number drop.
            </p>
          </div>

          {/* Trust levers */}
          <div className="space-y-2">
            {trustLevers.map((lever) => (
              <div key={lever.id}
                className={`card p-3 border transition-all ${lever.enabled
                  ? 'border-[var(--brand-border)] bg-[var(--brand-dim)]'
                  : 'border-[var(--border)] bg-[var(--bg-surface)] opacity-60'
                  }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold truncate">{lever.label}</div>
                    <div className="text-[9px] text-[var(--text-muted)] mt-0.5 leading-relaxed">{lever.description}</div>
                  </div>
                  <button
                    onClick={() => updateLever(lever.id, { enabled: !lever.enabled })}
                    className={`shrink-0 w-9 h-5 rounded-full relative transition-colors ${lever.enabled ? 'bg-[var(--brand)]' : 'bg-[var(--bg-interactive)]'}`}
                    aria-label={`Toggle ${lever.label}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${lever.enabled ? 'left-5' : 'left-1'}`} />
                  </button>
                </div>

                {lever.enabled && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-[var(--text-muted)]">Completeness</span>
                      <span className="font-mono text-[var(--brand)]">{formatPct(lever.completeness)}</span>
                    </div>
                    <input type="range" min={0} max={1} step={0.05} value={lever.completeness}
                      onChange={(e) => updateLever(lever.id, { completeness: +e.target.value })}
                      className="w-full accent-amber-500" />
                    <div className="flex flex-wrap gap-x-3 text-[9px] text-[var(--text-muted)]">
                      {lever.betaDeposit > 0 && <span>↑{formatPct(lever.betaDeposit)} deposit</span>}
                      {lever.betaFirstTrade > 0 && <span>↑{formatPct(lever.betaFirstTrade)} first trade</span>}
                      {lever.betaRetention > 0 && <span>↑{formatPct(lever.betaRetention)} retention</span>}
                      {lever.betaTickets > 0 && <span>↓{formatPct(lever.betaTickets)} tickets</span>}
                    </div>
                  </div>
                )}

                <Link href={lever.proofRoute}
                  className="mt-2 flex items-center gap-1 text-[10px] text-[var(--brand)] hover:underline">
                  <ExternalLink className="w-3 h-3" /> See it work
                </Link>
              </div>
            ))}
          </div>

          {/* Decision panel */}
          <div className="card p-4 border border-[var(--brand-border)] bg-[var(--brand-dim)] space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-[var(--brand)]" />
              <span className="text-[11px] font-bold text-[var(--brand)]">Decision</span>
            </div>
            {decision?.map((d, i) => (
              <p key={i} className="text-[11px] text-[var(--text-secondary)] flex items-start gap-1.5">
                <ArrowRight className="w-3 h-3 mt-0.5 text-[var(--brand)] shrink-0" />
                {d}
              </p>
            ))}
            <div className="pt-2 border-t border-[var(--brand-border)] mt-2">
              <p className="text-[9px] text-[var(--text-muted)] font-bold mb-1">What would change this call:</p>
              <ul className="text-[9px] text-[var(--text-muted)] space-y-0.5">
                <li>• Crew qualification &lt;35% → paid becomes cheaper channel</li>
                <li>• Retention &lt;30% → LTV:CAC collapses even at low CAC</li>
                <li>• Trust betas wrong → run Honest Stress scenario</li>
                <li>• Breakeven &gt; 18mo → raise bridge or cut event cadence</li>
              </ul>
            </div>
          </div>

          {/* Assumption Ledger */}
          <button onClick={() => setShowLedger(!showLedger)}
            className="w-full text-[10px] text-[var(--text-secondary)] hover:text-[var(--brand)] flex items-center gap-2 py-1 border border-[var(--border)] rounded px-3">
            <Info className="w-3 h-3" />
            {showLedger ? 'Hide' : 'Show'} Assumption Ledger ({result.assumptions.length} entries)
            {showLedger ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
          </button>

          <AnimatePresence>
            {showLedger && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {result.assumptions.map((a) => (
                  <div key={a.id} className="card p-2.5 bg-[var(--bg-surface)] space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-[var(--text-muted)]">{a.id}</span>
                      <ProvenanceChip type={a.provenance} />
                    </div>
                    <div className="text-[10px] font-semibold">{a.label}</div>
                    <div className="text-[10px] text-[var(--brand)] font-mono">{a.value} {a.unit}</div>
                    <div className="text-[9px] text-[var(--text-muted)]">{a.source}</div>
                    <div className="text-[9px] text-[var(--text-muted)]">
                      Range: [{a.range[0]}, {a.range[1]}] · Confidence: {a.confidence}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── 12-MONTH ROLLOUT PLANNER ──────────────────────────────────────── */}
      <AnimatePresence>
        {showRolloutView && compareResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t-4 border-[var(--brand-border)] bg-[var(--bg-base)]"
          >
            <div className="p-4 space-y-4">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--brand)]" />
                    12-Month Rollout & Projections
                  </h2>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">
                    Plan intervention launches, track monthly projections, and compare baseline vs proposal
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--text-muted)]">Chart Metric:</span>
                  <select
                    value={rolloutMetric}
                    onChange={(e) => setRolloutMetric(e.target.value as typeof rolloutMetric)}
                    className="bg-[var(--bg-interactive)] border border-[var(--border)] rounded px-2 py-1 text-[10px] text-[var(--text-secondary)]"
                  >
                    <option value="volume">Executed Volume</option>
                    <option value="revenue">Service Revenue</option>
                    <option value="traders">Active Traders</option>
                    <option value="contribution">Net Contribution</option>
                  </select>
                </div>
              </div>

              {/* Rollout Timeline */}
              <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border)] p-4">
                <RolloutPlanner
                  selectedMonth={selectedMonth}
                  onMonthSelect={setSelectedMonth}
                  interventions={interventions}
                  onInterventionUpdate={handleInterventionUpdate}
                  onInterventionClick={handleInterventionClick}
                  marketNightEvents={marketNightEvents}
                  onMarketNightUpdate={handleMarketNightUpdate}
                  budgetConstraint={200000}
                />
              </div>

              {/* Monthly Projections Chart */}
              <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border)] p-4">
                <MonthlyProjectionsChart
                  baselineResult={compareResult}
                  proposalResult={result}
                  selectedMonth={selectedMonth}
                  onMonthSelect={setSelectedMonth}
                  metric={rolloutMetric}
                />
              </div>

              {/* Baseline Comparison */}
              <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border)] p-4">
                <BaselineComparison
                  baselineInputs={compareScenario!.inputs}
                  proposalInputs={activeScenario.inputs}
                  baselineResult={compareResult}
                  proposalResult={result}
                  selectedMonth={selectedMonth}
                />
              </div>

              {/* Founder Decision Panel for Rollout */}
              <div className="card p-4 border-2 border-[var(--brand-border)] bg-[var(--brand-dim)] space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-[var(--brand)]" />
                  <span className="text-[12px] font-bold text-[var(--brand)]">Rollout Decision Analysis</span>
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    <ArrowRight className="w-3 h-3 inline mr-1 text-[var(--brand)]" />
                    Under the selected assumptions, launching{' '}
                    <strong>{interventions.filter(i => i.launchMonth <= 12).length} interventions</strong> over 12 months
                    changes year-one contribution by{' '}
                    <strong className={result.totalContribution12m - compareResult.totalContribution12m >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}>
                      {formatINRCompact(result.totalContribution12m - compareResult.totalContribution12m)}
                    </strong>
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    <ArrowRight className="w-3 h-3 inline mr-1 text-[var(--brand)]" />
                    Total intervention costs: {formatINRCompact(interventions.reduce((sum, i) => sum + i.setupCost + (i.monthlyCost * 12), 0))}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    <ArrowRight className="w-3 h-3 inline mr-1 text-[var(--brand)]" />
                    Selected Month {selectedMonth}: {fmt(result.snapshots[selectedMonth - 1]?.activeUsers || 0)} active traders,{' '}
                    {formatINRCompact(result.snapshots[selectedMonth - 1]?.contribution || 0)} net contribution
                  </p>
                </div>
                <div className="pt-2 border-t border-[var(--brand-border)]">
                  <p className="text-[9px] text-[var(--text-muted)] font-bold mb-1">What to test:</p>
                  <ul className="text-[9px] text-[var(--text-muted)] space-y-0.5">
                    <li>• Try launching interventions earlier/later to see impact on breakeven timing</li>
                    <li>• Test "zero behavioral effect" by setting all beta coefficients to 0</li>
                    <li>• Compare full rollout vs launching only 1-2 high-impact interventions</li>
                    <li>• Check budget constraints - red months indicate over-budget</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
