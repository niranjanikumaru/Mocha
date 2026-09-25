'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal, Eye, TrendingUp, ArrowRightLeft,
  Save, BarChart3, Zap, Info, AlertTriangle, ChevronDown,
  Shield, Gift, Calculator, Beaker, FlaskConical, Target,
  ArrowUpRight, ArrowDownRight, Play, RotateCcw, Settings,
} from 'lucide-react';
import SpotlightCard from '../ui/spotlight-card';
import GlowPulse from '../ui/glow-pulse';
import {
  calcTradeCharges,
  calcProjection,
  comparePlans,
  DEFAULT_FEE_CONFIG,
  PLAN_B_FEE_CONFIG,
  DEFAULT_PROJECTION_INPUTS,
  fmtINR,
  fmtPct,
} from '../../lib/feeEngine';
import type {
  FeeConfig,
  TradeChargeBreakdown,
  DemandMode,
  SensitivityLevel,
  ProjectionInputs,
  ProjectionResult,
  SavedPlan,
  PlanComparison,
} from '../../types/feeExperiment';

// ─── Constants ───────────────────────────────────────────────────────────────

const SENSITIVITY_LABELS: Record<SensitivityLevel, { label: string; desc: string }> = {
  LOW:    { label: 'Low',    desc: '1% fee hike → 0.20% volume drop' },
  MEDIUM: { label: 'Medium', desc: '1% fee hike → 0.55% volume drop' },
  HIGH:   { label: 'High',   desc: '1% fee hike → 1.10% volume drop' },
};

// ─── Sub-Components ──────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, badge }: {
  icon: React.ElementType;
  title: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-lg bg-[var(--brand-dim)] border border-[var(--brand-border)] flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-[var(--brand)]" />
      </div>
      <h2 className="text-[15px] font-bold text-[var(--text-primary)] tracking-tight">{title}</h2>
      {badge && <span className="badge badge-brand text-[9px]">{badge}</span>}
    </div>
  );
}

function DataRow({ label, value, valueColor, mono, bold, indent, strikethrough }: {
  label: string;
  value: string;
  valueColor?: string;
  mono?: boolean;
  bold?: boolean;
  indent?: boolean;
  strikethrough?: boolean;
}) {
  return (
    <div className={`data-row ${indent ? 'pl-4' : ''}`}>
      <span className={`text-[12px] ${bold ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
        {label}
      </span>
      <span
        className={`text-[13px] font-semibold ${mono ? 'font-mono' : ''} ${strikethrough ? 'line-through opacity-50' : ''}`}
        style={{ color: valueColor || 'var(--text-primary)' }}
      >
        {value}
      </span>
    </div>
  );
}

function SliderControl({ label, value, min, max, step, onChange, displayValue, sublabel }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  displayValue: string;
  sublabel?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[12px] font-medium text-[var(--text-secondary)]">{label}</span>
          {sublabel && <span className="text-[10px] text-[var(--text-muted)] ml-2">{sublabel}</span>}
        </div>
        <span className="text-[13px] font-bold font-mono text-[var(--brand)]">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

function InfoCallout({ children, type = 'info' }: {
  children: React.ReactNode;
  type?: 'info' | 'warning' | 'success';
}) {
  const styles = {
    info: 'bg-[var(--muted-dim)] border-[var(--muted-border)] text-[var(--text-secondary)]',
    warning: 'bg-[var(--yellow-dim)] border-[var(--yellow-border)] text-[var(--yellow)]',
    success: 'bg-[var(--green-dim)] border-[var(--green-border)] text-[var(--green)]',
  };
  const icons = { info: Info, warning: AlertTriangle, success: Shield };
  const Icon = icons[type];
  return (
    <div className={`flex gap-2 p-3 rounded-lg border text-[11px] leading-relaxed ${styles[type]}`}>
      <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function FeeExperimentPanel() {
  // ── Fee config state ──
  const [platformFeeRate, setPlatformFeeRate] = useState(DEFAULT_FEE_CONFIG.platformFeeRate);
  const [venueFeeRate, setVenueFeeRate] = useState(DEFAULT_FEE_CONFIG.venueFeeRate);
  const [positionValue, setPositionValue] = useState(DEFAULT_FEE_CONFIG.positionValue);
  const [creditCap, setCreditCap] = useState(DEFAULT_FEE_CONFIG.creditCap);
  const [creditApplied, setCreditApplied] = useState(false);

  // ── Projection state ──
  const [projInputs, setProjInputs] = useState<ProjectionInputs>(DEFAULT_PROJECTION_INPUTS);
  const [demandMode, setDemandMode] = useState<DemandMode>('ARITHMETIC_ONLY');
  const [sensitivity, setSensitivity] = useState<SensitivityLevel>('MEDIUM');

  // ── Plan comparison state ──
  const [savedPlanA, setSavedPlanA] = useState<SavedPlan | null>(null);
  const [savedPlanB, setSavedPlanB] = useState<SavedPlan | null>(null);

  // ── Credit tracking: simulate that retrying doesn't redeem twice ──
  const [creditRedeemed, setCreditRedeemed] = useState(false);
  const [creditBalance, setCreditBalance] = useState(20); // illustrative ₹20

  // ── Demo sequence state ──
  const [demoStep, setDemoStep] = useState(0);
  const [demoActive, setDemoActive] = useState(false);

  // ── Derived calculations ──
  // currentConfig reflects the founder's intent (toggle state) — used for projection & plan saving
  const currentConfig: FeeConfig = useMemo(() => ({
    platformFeeRate,
    venueFeeRate,
    positionValue,
    creditCap,
    creditApplied,
  }), [platformFeeRate, venueFeeRate, positionValue, creditCap, creditApplied]);

  // configForCharges guards against exhausted/already-redeemed credit — used for customer preview
  const configForCharges: FeeConfig = useMemo(() => ({
    ...currentConfig,
    creditApplied: creditApplied && creditBalance > 0 && !creditRedeemed,
  }), [currentConfig, creditApplied, creditBalance, creditRedeemed]);

  const tradeCharges: TradeChargeBreakdown = useMemo(
    () => calcTradeCharges(configForCharges),
    [configForCharges]
  );

  const projection: ProjectionResult = useMemo(
    () => calcProjection(currentConfig, projInputs, demandMode, sensitivity, DEFAULT_FEE_CONFIG),
    [currentConfig, projInputs, demandMode, sensitivity]
  );

  const comparison: PlanComparison | null = useMemo(() => {
    if (!savedPlanA || !savedPlanB) return null;
    return comparePlans(savedPlanA, savedPlanB);
  }, [savedPlanA, savedPlanB]);

  // ── Handlers ──
  const handleSimulateExecution = useCallback(() => {
    if (creditApplied && creditBalance > 0 && !creditRedeemed) {
      const used = Math.min(creditCap, tradeCharges.platformFee);
      setCreditBalance(prev => Math.max(0, prev - used));
      setCreditRedeemed(true);
    }
  }, [creditApplied, creditBalance, creditRedeemed, creditCap, tradeCharges.platformFee]);

  const handleResetCredit = useCallback(() => {
    setCreditBalance(20);
    setCreditRedeemed(false);
  }, []);

  const handleSavePlan = useCallback((id: 'A' | 'B') => {
    const plan: SavedPlan = {
      id,
      label: `Plan ${id}`,
      config: { ...currentConfig },
      projection: { ...projection },
      demandMode,
      sensitivity,
    };
    if (id === 'A') setSavedPlanA(plan);
    else setSavedPlanB(plan);
  }, [currentConfig, projection, demandMode, sensitivity]);

  const updateProjInput = useCallback(<K extends keyof ProjectionInputs>(
    key: K, value: ProjectionInputs[K]
  ) => {
    setProjInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  // ── Demo sequence ──
  const demoSteps = [
    { label: 'Open trade preview', action: () => { setPlatformFeeRate(0.00020); setCreditApplied(false); } },
    { label: 'Change platform fee to 0.030%', action: () => { setPlatformFeeRate(0.00030); } },
    { label: 'Apply Market Night credit', action: () => { setCreditApplied(true); handleSimulateExecution(); } },
    { label: 'Enable demand sensitivity', action: () => { setDemandMode('DEMAND_SENSITIVE'); setSensitivity('MEDIUM'); } },
    { label: 'Compare saved plans', action: () => {
      // Save Plan A at 0.020%
      const configA = { ...DEFAULT_FEE_CONFIG };
      const projA = calcProjection(configA, projInputs, demandMode, sensitivity, DEFAULT_FEE_CONFIG);
      setSavedPlanA({ id: 'A', label: 'Plan A', config: configA, projection: projA, demandMode, sensitivity });
      // Save Plan B at 0.030%
      const configB = { ...PLAN_B_FEE_CONFIG };
      const projB = calcProjection(configB, projInputs, demandMode, sensitivity, DEFAULT_FEE_CONFIG);
      setSavedPlanB({ id: 'B', label: 'Plan B', config: configB, projection: projB, demandMode, sensitivity });
    }},
  ];

  const runDemoStep = useCallback(() => {
    if (demoStep < demoSteps.length) {
      demoSteps[demoStep].action();
      setDemoStep(prev => prev + 1);
    }
  }, [demoStep, demoSteps]);

  const resetDemo = useCallback(() => {
    setDemoStep(0);
    setDemoActive(false);
    setPlatformFeeRate(DEFAULT_FEE_CONFIG.platformFeeRate);
    setVenueFeeRate(DEFAULT_FEE_CONFIG.venueFeeRate);
    setPositionValue(DEFAULT_FEE_CONFIG.positionValue);
    setCreditCap(DEFAULT_FEE_CONFIG.creditCap);
    setCreditApplied(false);
    setDemandMode('ARITHMETIC_ONLY');
    setSensitivity('MEDIUM');
    setSavedPlanA(null);
    setSavedPlanB(null);
    handleResetCredit();
    setProjInputs(DEFAULT_PROJECTION_INPUTS);
  }, [handleResetCredit]);

  return (
    <div className="fee-experiment-root">
      {/* ═══ Demo Controller Bar ═══ */}
      <motion.div
        className="fee-demo-bar"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--brand)] flex items-center justify-center shadow-[0_0_16px_rgba(245,158,11,0.4)]">
            <Beaker className="w-4 h-4 text-black" />
          </div>
          <div>
            <h1 className="text-[15px] font-extrabold tracking-tight">
              Fee Experiment
              <span className="text-[var(--brand)] ml-1">Lab</span>
            </h1>
            <p className="text-[10px] text-[var(--text-secondary)]">
              Connect pricing decisions to customer impact and business outcomes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!demoActive ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setDemoActive(true); resetDemo(); setDemoActive(true); }}
              className="btn btn-brand btn-sm gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              60-Second Demo
            </motion.button>
          ) : (
            <>
              <div className="flex items-center gap-1.5 mr-2">
                {demoSteps.map((s, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i < demoStep ? 'bg-[var(--green)] scale-110' :
                      i === demoStep ? 'bg-[var(--brand)] animate-pulse' :
                      'bg-[var(--text-muted)]'
                    }`}
                    title={s.label}
                  />
                ))}
              </div>
              {demoStep < demoSteps.length ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={runDemoStep}
                  className="btn btn-brand btn-sm gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  {demoSteps[demoStep].label}
                </motion.button>
              ) : (
                <span className="badge badge-green">Demo Complete</span>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetDemo}
                className="btn btn-ghost btn-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </motion.button>
            </>
          )}
        </div>
      </motion.div>

      {/* ═══ Main Split Layout ═══ */}
      <div className="fee-split-layout">
        {/* ──── LEFT: Founder Controls ──── */}
        <div className="fee-column fee-column-founder">
          <SectionHeader icon={SlidersHorizontal} title="Founder Controls" badge="ADJUSTABLE" />

          <SpotlightCard className="p-4 mb-4">
            <SliderControl
              label="MochaTrade service fee"
              sublabel="(platform revenue)"
              value={platformFeeRate}
              min={0.00005}
              max={0.00100}
              step={0.00005}
              onChange={setPlatformFeeRate}
              displayValue={fmtPct(platformFeeRate)}
            />
          </SpotlightCard>

          <SpotlightCard className="p-4 mb-4" spotlightColor="rgba(126,126,154,0.06)">
            <SliderControl
              label="Venue execution fee"
              sublabel="(external assumption)"
              value={venueFeeRate}
              min={0.00010}
              max={0.00100}
              step={0.00005}
              onChange={setVenueFeeRate}
              displayValue={fmtPct(venueFeeRate)}
            />
            <InfoCallout type="info">
              The venue fee is an external cost assumption, not a price MochaTrade can freely set.
            </InfoCallout>
          </SpotlightCard>

          <SpotlightCard className="p-4 mb-4">
            <SliderControl
              label="Executed position value"
              value={positionValue}
              min={10000}
              max={1000000}
              step={10000}
              onChange={setPositionValue}
              displayValue={fmtINR(positionValue)}
            />
          </SpotlightCard>

          <SpotlightCard className="p-4 mb-4">
            <SliderControl
              label="Market Night credit cap"
              sublabel="(per transaction)"
              value={creditCap}
              min={0}
              max={100}
              step={5}
              onChange={setCreditCap}
              displayValue={`₹${creditCap}`}
            />
          </SpotlightCard>

          {/* ── Credit Toggle ── */}
          <SpotlightCard className="p-4 mb-4" spotlightColor="rgba(34,197,94,0.06)">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-[var(--green)]" />
                <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                  Apply eligible Market Night service-fee credit
                </span>
              </div>
              <label className="fee-toggle">
                <input
                  type="checkbox"
                  checked={creditApplied}
                  onChange={(e) => {
                    setCreditApplied(e.target.checked);
                    if (!e.target.checked) {
                      setCreditRedeemed(false);
                    }
                  }}
                />
                <span className="fee-toggle-slider" />
              </label>
            </div>
            {creditApplied && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-secondary)]">Available credit balance</span>
                  <span className="font-mono font-semibold text-[var(--green)]">₹{creditBalance.toFixed(2)}</span>
                </div>
                {creditRedeemed && (
                  <InfoCallout type="warning">
                    Credit already redeemed for this simulation. Retrying does not redeem it twice.
                  </InfoCallout>
                )}
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSimulateExecution}
                    disabled={creditRedeemed || creditBalance <= 0}
                    className="btn btn-green btn-sm flex-1"
                  >
                    <Zap className="w-3 h-3" />
                    Simulate Execution
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleResetCredit}
                    className="btn btn-ghost btn-sm"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </motion.button>
                </div>
              </motion.div>
            )}
          </SpotlightCard>
        </div>

        {/* ──── RIGHT: Customer Preview ──── */}
        <div className="fee-column fee-column-customer">
          <SectionHeader icon={Eye} title="Customer Trade Preview" badge="LIVE" />

          <SpotlightCard className="p-0 mb-4 overflow-hidden">
            {/* Header row */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              <div className="flex items-center gap-2">
                <GlowPulse color="brand" size={8} />
                <span className="text-[12px] font-semibold text-[var(--text-primary)]">Execution Charge Breakdown</span>
              </div>
              <span className="badge badge-muted text-[9px]">SIMULATED</span>
            </div>

            {/* Position value */}
            <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
              <DataRow
                label="Executed position value"
                value={fmtINR(positionValue)}
                mono
                bold
              />
            </div>

            {/* Charge lines */}
            <div className="px-4 py-2">
              <DataRow
                label="MochaTrade service fee"
                value={`${fmtPct(platformFeeRate)} → ₹${tradeCharges.platformFee.toFixed(2)}`}
                valueColor="var(--brand)"
                mono
              />
              <DataRow
                label="Venue execution fee"
                value={`${fmtPct(venueFeeRate)} → ₹${tradeCharges.venueFee.toFixed(2)}`}
                mono
              />

              {creditApplied && tradeCharges.creditApplied > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <DataRow
                    label="Credit applied"
                    value={`−₹${tradeCharges.creditApplied.toFixed(2)}`}
                    valueColor="var(--green)"
                    mono
                  />
                  {tradeCharges.creditCoversAll && (
                    <DataRow
                      label="Net platform fee"
                      value={`₹${tradeCharges.netPlatformFee.toFixed(2)}`}
                      valueColor="var(--green)"
                      mono
                    />
                  )}
                </motion.div>
              )}
            </div>

            {/* Total */}
            <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-elevated)]">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-[var(--text-primary)]">
                  {creditApplied && tradeCharges.creditApplied > 0
                    ? 'Execution charge after credit'
                    : 'Execution charge'}
                </span>
                <motion.span
                  key={tradeCharges.totalExecutionCharge}
                  initial={{ scale: 1.15, color: 'var(--brand)' }}
                  animate={{ scale: 1, color: 'var(--text-primary)' }}
                  className="text-[18px] font-extrabold font-mono"
                >
                  ₹{tradeCharges.totalExecutionCharge.toFixed(2)}
                </motion.span>
              </div>
            </div>

            {/* Credit message */}
            <AnimatePresence>
              {creditApplied && tradeCharges.creditCoversAll && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 py-3 bg-[var(--green-dim)] border-t border-[var(--green-border)]"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[var(--green)]" />
                    <span className="text-[12px] font-semibold text-[var(--green)]">
                      Your platform fee is covered for this transaction. Other charges still apply.
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </SpotlightCard>

          {/* Disclaimer */}
          <div className="px-1 mb-6">
            <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
              Charged on executed position value, not deposited margin. Closing incurs another execution charge.
              Funding, spread, slippage and applicable taxes are additional.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Business Consequences ═══ */}
      <div className="fee-section">
        <SectionHeader icon={BarChart3} title="Year-One Projection" badge="SAME ENGINE" />

        {/* Projection Inputs (collapsible) */}
        <ProjectionInputsPanel
          inputs={projInputs}
          onChange={updateProjInput}
        />

        {/* Demand mode selector */}
        <div className="fee-mode-selector mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-4 h-4 text-[var(--text-secondary)]" />
            <span className="text-[12px] font-semibold text-[var(--text-primary)]">Demand model</span>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setDemandMode('ARITHMETIC_ONLY')}
              className={`btn btn-sm flex-1 ${
                demandMode === 'ARITHMETIC_ONLY' ? 'btn-brand' : 'btn-ghost'
              }`}
            >
              Fee arithmetic only
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setDemandMode('DEMAND_SENSITIVE')}
              className={`btn btn-sm flex-1 ${
                demandMode === 'DEMAND_SENSITIVE' ? 'btn-brand' : 'btn-ghost'
              }`}
            >
              Demand sensitivity
            </motion.button>
          </div>
          <div className="mt-2">
            {demandMode === 'ARITHMETIC_ONLY' ? (
              <InfoCallout type="info">
                Volume stays fixed; shows the direct revenue effect of fee changes.
              </InfoCallout>
            ) : (
              <div className="space-y-3">
                <InfoCallout type="warning">
                  Higher total execution fees can reduce volume under an adjustable assumption.
                  All sensitivity levels are <strong>assumed, not measured</strong>. Their purpose is to
                  test the recommendation, not predict behaviour with certainty.
                </InfoCallout>
                <div className="flex gap-2">
                  {(['LOW', 'MEDIUM', 'HIGH'] as SensitivityLevel[]).map(level => (
                    <motion.button
                      key={level}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSensitivity(level)}
                      className={`btn btn-sm flex-1 text-center ${
                        sensitivity === level
                          ? (level === 'LOW' ? 'btn-green' : level === 'MEDIUM' ? 'btn-yellow' : 'btn-red')
                          : 'btn-ghost'
                      }`}
                    >
                      <div>
                        <div className="text-[11px] font-bold">{SENSITIVITY_LABELS[level].label}</div>
                        <div className="text-[9px] opacity-70 font-normal">{SENSITIVITY_LABELS[level].desc}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Projection Results Grid */}
        <div className="fee-projection-grid">
          <ProjectionMetricCard
            label="Year-one executed volume"
            value={fmtINR(projection.effectiveVolume)}
            sublabel={demandMode === 'DEMAND_SENSITIVE' && projection.volumeRetentionPct < 100
              ? `${projection.volumeRetentionPct.toFixed(1)}% of baseline retained`
              : 'Baseline (no demand adjustment)'}
            icon={TrendingUp}
            color="brand"
          />
          <ProjectionMetricCard
            label="Gross platform service revenue"
            value={fmtINR(projection.grossServiceRevenue)}
            sublabel="Volume × platform fee rate (venue not retained)"
            icon={BarChart3}
            color="brand"
          />
          <ProjectionMetricCard
            label="Redeemed credits"
            value={`−${fmtINR(projection.redeemedCredits)}`}
            sublabel={`${projInputs.completedCrewsPerEvent} crews × ${projInputs.eventsPerYear} events × ₹${creditCap}`}
            icon={Gift}
            color="yellow"
          />
          <ProjectionMetricCard
            label="Net service revenue"
            value={fmtINR(projection.netServiceRevenue)}
            sublabel="Gross revenue − redeemed credits"
            icon={Target}
            color={projection.netServiceRevenue > 0 ? 'green' : 'red'}
          />
          <ProjectionMetricCard
            label="Contribution after modeled costs"
            value={fmtINR(projection.contribution)}
            sublabel={`Opex ₹${(projection.operatingCost / 100000).toFixed(1)}L + CAC ₹${(projection.acquisitionCost / 100000).toFixed(1)}L`}
            icon={FlaskConical}
            color={projection.contribution > 0 ? 'green' : 'red'}
            highlight
          />
        </div>
      </div>

      {/* ═══ Plan Comparison ═══ */}
      <div className="fee-section">
        <SectionHeader icon={ArrowRightLeft} title="Plan Comparison" badge="A vs B" />

        <div className="flex gap-3 mb-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSavePlan('A')}
            className={`btn btn-sm flex-1 ${savedPlanA ? 'btn-green' : 'btn-ghost'}`}
          >
            <Save className="w-3.5 h-3.5" />
            {savedPlanA ? `Plan A saved (${fmtPct(savedPlanA.config.platformFeeRate)})` : 'Save as Plan A'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSavePlan('B')}
            className={`btn btn-sm flex-1 ${savedPlanB ? 'btn-yellow' : 'btn-ghost'}`}
          >
            <Save className="w-3.5 h-3.5" />
            {savedPlanB ? `Plan B saved (${fmtPct(savedPlanB.config.platformFeeRate)})` : 'Save as Plan B'}
          </motion.button>
        </div>

        {comparison ? (
          <PlanComparisonDisplay comparison={comparison} />
        ) : (
          <InfoCallout type="info">
            Save two configurations to compare. Adjust the fee, then save as Plan A. Change the fee again and save as Plan B.
          </InfoCallout>
        )}
      </div>
    </div>
  );
}

// ─── Projection Metric Card ──────────────────────────────────────────────────

function ProjectionMetricCard({ label, value, sublabel, icon: Icon, color, highlight }: {
  label: string;
  value: string;
  sublabel: string;
  icon: React.ElementType;
  color: 'brand' | 'green' | 'red' | 'yellow';
  highlight?: boolean;
}) {
  const colorVar = `var(--${color})`;
  const dimVar = `var(--${color}-dim)`;
  const borderVar = `var(--${color}-border)`;

  return (
    <SpotlightCard
      className={`p-4 ${highlight ? 'ring-1' : ''}`}
      spotlightColor={color === 'brand' ? undefined : `rgba(${color === 'green' ? '34,197,94' : color === 'red' ? '239,68,68' : '234,179,8'},0.08)`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[11px] text-[var(--text-secondary)] leading-snug pr-3">{label}</span>
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: dimVar, border: `1px solid ${borderVar}` }}
        >
          <Icon className="w-3 h-3" style={{ color: colorVar }} />
        </div>
      </div>
      <motion.div
        key={value}
        initial={{ y: 4, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-[20px] font-extrabold font-mono tracking-tight mb-1"
        style={{ color: highlight ? colorVar : 'var(--text-primary)' }}
      >
        {value}
      </motion.div>
      <span className="text-[10px] text-[var(--text-muted)] leading-snug">{sublabel}</span>
    </SpotlightCard>
  );
}

// ─── Plan Comparison Display ─────────────────────────────────────────────────

function PlanComparisonDisplay({ comparison }: { comparison: PlanComparison }) {
  const { planA, planB, contributionDelta, volumeDeltaPct, breakevenVolumeRetentionPct, planBWinsOnContribution } = comparison;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Side-by-side comparison table */}
      <div className="fee-comparison-table">
        <div className="fee-comparison-header">
          <div className="fee-comparison-cell fee-comparison-label" />
          <div className="fee-comparison-cell text-center">
            <span className="badge badge-green text-[9px]">Plan A</span>
          </div>
          <div className="fee-comparison-cell text-center">
            <span className="badge badge-yellow text-[9px]">Plan B</span>
          </div>
        </div>
        {[
          { label: 'Platform fee', a: fmtPct(planA.config.platformFeeRate), b: fmtPct(planB.config.platformFeeRate) },
          { label: 'Referral credits', a: `₹${planA.config.creditCap}/txn`, b: `₹${planB.config.creditCap}/txn` },
          { label: 'Demand mode', a: planA.demandMode === 'ARITHMETIC_ONLY' ? 'Arithmetic' : `Sensitive (${planA.sensitivity})`, b: planB.demandMode === 'ARITHMETIC_ONLY' ? 'Arithmetic' : `Sensitive (${planB.sensitivity})` },
          { label: 'Eff. volume', a: fmtINR(planA.projection.effectiveVolume), b: fmtINR(planB.projection.effectiveVolume) },
          { label: 'Gross revenue', a: fmtINR(planA.projection.grossServiceRevenue), b: fmtINR(planB.projection.grossServiceRevenue) },
          { label: 'Net revenue', a: fmtINR(planA.projection.netServiceRevenue), b: fmtINR(planB.projection.netServiceRevenue) },
          { label: 'Contribution', a: fmtINR(planA.projection.contribution), b: fmtINR(planB.projection.contribution) },
        ].map((row, i) => (
          <div key={i} className="fee-comparison-row">
            <div className="fee-comparison-cell fee-comparison-label">{row.label}</div>
            <div className="fee-comparison-cell text-center font-mono text-[12px]">{row.a}</div>
            <div className="fee-comparison-cell text-center font-mono text-[12px]">{row.b}</div>
          </div>
        ))}
      </div>

      {/* Verdict cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SpotlightCard className="p-4" spotlightColor={planBWinsOnContribution ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'}>
          <div className="flex items-center gap-2 mb-2">
            {planBWinsOnContribution
              ? <ArrowUpRight className="w-4 h-4 text-[var(--green)]" />
              : <ArrowDownRight className="w-4 h-4 text-[var(--red)]" />}
            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Contribution delta</span>
          </div>
          <div className={`text-[18px] font-extrabold font-mono ${planBWinsOnContribution ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
            {contributionDelta >= 0 ? '+' : ''}{fmtINR(contributionDelta)}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-1">
            Under these assumptions, Plan B produces {fmtINR(Math.abs(contributionDelta))} {planBWinsOnContribution ? 'more' : 'less'} contribution
            {volumeDeltaPct !== 0 && `, with ${Math.abs(comparison.volumeDeltaPct).toFixed(1)}% ${comparison.volumeDeltaPct < 0 ? 'less' : 'more'} executed volume`}.
          </p>
        </SpotlightCard>

        <SpotlightCard className="p-4" spotlightColor="rgba(245,158,11,0.08)">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-[var(--brand)]" />
            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Breakeven condition</span>
          </div>
          <div className="text-[18px] font-extrabold font-mono text-[var(--brand)]">
            {breakevenVolumeRetentionPct.toFixed(1)}%
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-1">
            The higher fee loses its gross revenue advantage when volume falls by more than{' '}
            <span className="font-semibold text-[var(--text-secondary)]">{(100 - breakevenVolumeRetentionPct).toFixed(1)}%</span>.
            At least {breakevenVolumeRetentionPct.toFixed(1)}% of baseline volume must remain.
          </p>
        </SpotlightCard>
      </div>
    </motion.div>
  );
}

// ─── Projection Inputs Panel (collapsible) ───────────────────────────────────

function ProjectionInputsPanel({ inputs, onChange }: {
  inputs: ProjectionInputs;
  onChange: <K extends keyof ProjectionInputs>(key: K, value: ProjectionInputs[K]) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-4">
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left py-2 px-3 rounded-lg bg-[var(--bg-interactive)] border border-[var(--border)] hover:border-[var(--border-accent)] transition-colors"
      >
        <Settings className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
        <span className="text-[12px] font-medium text-[var(--text-secondary)] flex-1">Projection assumptions</span>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3 p-3 mt-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
              <InputField
                label="Active traders"
                value={inputs.activeTraders}
                onChange={(v) => onChange('activeTraders', v)}
                suffix=""
              />
              <InputField
                label="Avg trades/year"
                value={inputs.avgTradesPerYear}
                onChange={(v) => onChange('avgTradesPerYear', v)}
                suffix=""
              />
              <InputField
                label="Avg position value"
                value={inputs.avgPositionValue}
                onChange={(v) => onChange('avgPositionValue', v)}
                suffix="₹"
                isINR
              />
              <InputField
                label="Completed crews/event"
                value={inputs.completedCrewsPerEvent}
                onChange={(v) => onChange('completedCrewsPerEvent', v)}
                suffix=""
              />
              <InputField
                label="Events/year"
                value={inputs.eventsPerYear}
                onChange={(v) => onChange('eventsPerYear', v)}
                suffix=""
              />
              <InputField
                label="Opex/month"
                value={inputs.operatingCostPerMonth}
                onChange={(v) => onChange('operatingCostPerMonth', v)}
                suffix="₹"
                isINR
              />
              <InputField
                label="CAC/trader"
                value={inputs.acquisitionCostPerTrader}
                onChange={(v) => onChange('acquisitionCostPerTrader', v)}
                suffix="₹"
                isINR
              />
              <InputField
                label="New traders/year"
                value={inputs.newTradersPerYear}
                onChange={(v) => onChange('newTradersPerYear', v)}
                suffix=""
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Simple Input Field ──────────────────────────────────────────────────────

function InputField({ label, value, onChange, suffix, isINR }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix: string;
  isINR?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] text-[var(--text-muted)] font-medium mb-1 block">{label}</label>
      <div className="relative">
        {isINR && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-[var(--text-muted)]">₹</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`input-field text-[12px] font-mono ${isINR ? 'pl-5' : ''}`}
          style={{ padding: '6px 8px', paddingLeft: isINR ? '20px' : '8px' }}
        />
      </div>
    </div>
  );
}
