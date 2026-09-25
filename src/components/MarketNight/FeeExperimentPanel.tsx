'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Sliders, ArrowLeftRight, TrendingUp, TrendingDown, Zap,
  BookmarkPlus, GitCompare, AlertTriangle, CheckCircle2,
  Info, ChevronDown, ChevronUp, BarChart3, DollarSign,
  Minus, RefreshCw, FlaskConical,
} from 'lucide-react';

import {
  FeeConfig, DemandMode, SensitivityLevel, SavedPlan, PlanComparison,
} from '../../types/feeExperiment';
import {
  calcTradeCharges, calcProjection, comparePlans,
  DEFAULT_FEE_CONFIG, PLAN_B_FEE_CONFIG,
  DEFAULT_PROJECTION_INPUTS, fmtINR, fmtPct,
} from '../../lib/feeEngine';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pct(rate: number) { return `${(rate * 100).toFixed(3)}%`; }
function inr(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (abs >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`;
  if (abs >= 1_000)       return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}
function inrExact(n: number) { return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`; }

const SENSITIVITY_DESC: Record<SensitivityLevel, string> = {
  LOW:    'Low sensitivity — customers change behaviour slowly',
  MEDIUM: 'Medium sensitivity — moderate fee response',
  HIGH:   'High sensitivity — customers reduce volume sharply',
};

// ─── Subcomponents ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
      {children}
    </p>
  );
}

function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return <span className={`badge ${color} text-[9px]`}>{children}</span>;
}

function FeeInput({
  label, value, min, max, step, onChange, sublabel, isExternal = false,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; sublabel?: string; isExternal?: boolean;
}) {
  const displayPct = (value * 100).toFixed(3);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[var(--text-secondary)] font-medium flex items-center gap-1">
          {label}
          {isExternal && (
            <span className="text-[9px] text-[var(--text-muted)] bg-[var(--bg-elevated)] border border-[var(--border)] rounded px-1 py-0.5 ml-1">
              external assumption
            </span>
          )}
        </span>
        <span className="font-mono text-[12px] font-bold text-[var(--brand)]">{displayPct}%</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        disabled={isExternal}
        className={`w-full h-1.5 rounded-full appearance-none cursor-pointer
          ${isExternal
            ? 'opacity-40 cursor-not-allowed bg-[var(--border)]'
            : 'bg-[var(--bg-interactive)] accent-[var(--brand)]'
          }`}
      />
      {sublabel && (
        <p className="text-[10px] text-[var(--text-muted)]">{sublabel}</p>
      )}
    </div>
  );
}

function ChargeRow({
  label, amount, highlight, dim, credit, strike,
}: {
  label: string; amount: string; highlight?: boolean; dim?: boolean;
  credit?: boolean; strike?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${dim ? 'opacity-50' : ''}`}>
      <span className={`text-[12px] ${highlight ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
        {label}
      </span>
      <span className={`font-mono text-[12px] font-bold ${
        credit ? 'text-[var(--green)]'
        : highlight ? 'text-[var(--text-primary)]'
        : 'text-[var(--text-secondary)]'
      } ${strike ? 'line-through' : ''}`}>
        {amount}
      </span>
    </div>
  );
}

function ProjectionRow({
  label, value, sub, color = 'text-[var(--text-primary)]', topBorder = false,
}: {
  label: string; value: string; sub?: string;
  color?: string; topBorder?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-2 ${topBorder ? 'border-t border-[var(--border)] mt-1' : ''}`}>
      <div>
        <p className="text-[12px] text-[var(--text-secondary)]">{label}</p>
        {sub && <p className="text-[10px] text-[var(--text-muted)]">{sub}</p>}
      </div>
      <span className={`font-mono text-[13px] font-bold ${color}`}>{value}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FeeExperimentPanel() {
  // ── Founder controls ─────────────────────────────────────────────────────
  const [config, setConfig] = useState<FeeConfig>({ ...DEFAULT_FEE_CONFIG });

  // ── Projection mode ──────────────────────────────────────────────────────
  const [demandMode, setDemandMode] = useState<DemandMode>('ARITHMETIC_ONLY');
  const [sensitivity, setSensitivity] = useState<SensitivityLevel>('MEDIUM');

  // ── Saved plans ──────────────────────────────────────────────────────────
  const [planA, setPlanA] = useState<SavedPlan | null>(null);
  const [planB, setPlanB] = useState<SavedPlan | null>(null);
  const [comparison, setComparison] = useState<PlanComparison | null>(null);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [showProjectionInputs, setShowProjectionInputs] = useState(false);
  const [projInputs, setProjInputs] = useState({ ...DEFAULT_PROJECTION_INPUTS });

  // ── Credit redemption simulation ─────────────────────────────────────────
  const [creditBalance, setCreditBalance] = useState(config.creditCap);
  const [creditRedeemed, setCreditRedeemed] = useState(false);

  // ── Derived calculations (live) ──────────────────────────────────────────
  const breakdown = useMemo(() => calcTradeCharges(config), [config]);

  const projection = useMemo(
    () => calcProjection(config, projInputs, demandMode, sensitivity, DEFAULT_FEE_CONFIG),
    [config, projInputs, demandMode, sensitivity],
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const update = useCallback((patch: Partial<FeeConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }));
  }, []);

  function savePlan(slot: 'A' | 'B') {
    const plan: SavedPlan = {
      id: slot,
      label: `Plan ${slot} — ${pct(config.platformFeeRate)} platform fee`,
      config: { ...config },
      projection: { ...projection },
      demandMode,
      sensitivity,
    };
    if (slot === 'A') {
      setPlanA(plan);
      setComparison(null);
    } else {
      setPlanB(plan);
      setComparison(null);
    }
  }

  function runComparison() {
    if (!planA || !planB) return;
    setComparison(comparePlans(planA, planB));
  }

  function loadPlan(plan: SavedPlan) {
    setConfig({ ...plan.config });
    setDemandMode(plan.demandMode);
    setSensitivity(plan.sensitivity);
  }

  function handleCreditToggle(on: boolean) {
    update({ creditApplied: on });
  }

  function simulateConfirmedTransaction() {
    if (!config.creditApplied || creditRedeemed || creditBalance <= 0) return;
    const applied = Math.min(creditBalance, breakdown.platformFee);
    setCreditBalance(prev => Math.max(0, prev - applied));
    setCreditRedeemed(true);
  }

  function resetCredit() {
    setCreditBalance(config.creditCap);
    setCreditRedeemed(false);
    update({ creditApplied: false });
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="w-4 h-4 text-[var(--brand)]" />
            <h2 className="font-bold text-[15px] text-[var(--text-primary)]">Fee Experiment</h2>
            <Tag color="badge-brand">Live</Tag>
          </div>
          <p className="text-[12px] text-[var(--text-secondary)] max-w-lg">
            Change the platform fee and watch the customer preview, credit accounting,
            and year-one projection update simultaneously — from <strong>one calculation engine</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { setConfig({ ...DEFAULT_FEE_CONFIG }); setDemandMode('ARITHMETIC_ONLY'); setSensitivity('MEDIUM'); }}
            className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-white transition-colors px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--border-accent)]"
          >
            <RefreshCw className="w-3 h-3" />Reset
          </button>
        </div>
      </div>

      {/* ══════ ROW 1: Founder Controls + Customer Preview ══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── LEFT: Founder Controls ── */}
        <div className="card-elevated p-4 space-y-5">
          <SectionLabel>Founder controls</SectionLabel>

          {/* Position value */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-secondary)] font-medium">Executed position value</span>
              <span className="font-mono text-[12px] font-bold text-[var(--brand)]">
                {inrExact(config.positionValue)}
              </span>
            </div>
            <input
              type="range"
              min={10_000} max={10_00_000} step={10_000}
              value={config.positionValue}
              onChange={e => update({ positionValue: parseInt(e.target.value) })}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[var(--bg-interactive)] accent-[var(--brand)]"
            />
            <p className="text-[10px] text-[var(--text-muted)]">₹10K – ₹10L range</p>
          </div>

          <div className="h-px bg-[var(--border)]" />

          {/* Platform fee — founder controls this */}
          <FeeInput
            label="MochaTrade service fee"
            value={config.platformFeeRate}
            min={0.00005} max={0.00100} step={0.00005}
            onChange={v => update({ platformFeeRate: v })}
            sublabel={`On ₹1,00,000 position → ${inrExact(1_00_000 * config.platformFeeRate)} charged to customer`}
          />

          {/* Venue fee — external assumption only */}
          <FeeInput
            label="Venue execution fee (assumed)"
            value={config.venueFeeRate}
            min={0.00045} max={0.00045} step={0.00001}
            onChange={() => {}}
            isExternal
            sublabel="External cost — not set by MochaTrade. Shown for transparency."
          />

          <div className="h-px bg-[var(--border)]" />

          {/* Credit cap */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                Market Night credit cap
              </span>
              <span className="font-mono text-[12px] font-bold text-[var(--green)]">
                ₹{config.creditCap}
              </span>
            </div>
            <input
              type="range"
              min={5} max={100} step={5}
              value={config.creditCap}
              onChange={e => {
                const v = parseInt(e.target.value);
                update({ creditCap: v });
                setCreditBalance(v);
                setCreditRedeemed(false);
              }}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[var(--bg-interactive)] accent-[var(--green)]"
            />
            <p className="text-[10px] text-[var(--text-muted)]">
              Max platform-fee credit per crew per transaction. Does not apply to venue fee.
            </p>
          </div>

          {/* Save plan buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => savePlan('A')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[var(--bg-interactive)] border border-[var(--border)] hover:border-[var(--brand)] text-[11px] font-semibold transition-colors"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />Save as Plan A
            </button>
            <button
              onClick={() => savePlan('B')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[var(--bg-interactive)] border border-[var(--border)] hover:border-[var(--brand)] text-[11px] font-semibold transition-colors"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />Save as Plan B
            </button>
          </div>
        </div>

        {/* ── RIGHT: Customer Trade Preview ── */}
        <div className="card-elevated p-4 space-y-4">
          <div className="flex items-center justify-between">
            <SectionLabel>Customer trade preview</SectionLabel>
            <span className="text-[10px] text-[var(--text-muted)]">Updates live as you adjust controls</span>
          </div>

          {/* Position value callout */}
          <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-secondary)]">Executed position value</span>
              <span className="font-mono text-[14px] font-bold text-[var(--text-primary)]">
                {inrExact(config.positionValue)}
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              Charges are on the executed value — not on deposited margin.
            </p>
          </div>

          {/* Charge breakdown */}
          <div className="space-y-0 divide-y divide-[var(--border-subtle)]">
            <ChargeRow
              label="MochaTrade service fee"
              amount={`${pct(config.platformFeeRate)} → ${inrExact(breakdown.platformFee)}`}
              strike={breakdown.creditCoversAll}
            />
            {config.creditApplied && breakdown.creditApplied > 0 && (
              <ChargeRow
                label="Market Night credit applied"
                amount={`−${inrExact(breakdown.creditApplied)}`}
                credit
              />
            )}
            <ChargeRow
              label="Venue execution fee (external)"
              amount={`${pct(config.venueFeeRate)} → ${inrExact(breakdown.venueFee)}`}
            />
            <div className="pt-1">
              <ChargeRow
                label="Execution charge"
                amount={inrExact(breakdown.totalExecutionCharge)}
                highlight
              />
            </div>
          </div>

          {/* Credit cover banner */}
          {breakdown.creditCoversAll && config.creditApplied && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--green-dim)] border border-[var(--green-border)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--green)] mt-0.5 shrink-0" />
              <p className="text-[11px] text-[var(--green)] font-medium">
                Your platform fee is covered for this transaction. Other charges still apply.
              </p>
            </div>
          )}

          {/* Credit toggle */}
          <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                Apply eligible Market Night service-fee credit
              </span>
              <button
                onClick={() => handleCreditToggle(!config.creditApplied)}
                disabled={creditRedeemed}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  config.creditApplied ? 'bg-[var(--green)]' : 'bg-[var(--border)]'
                } ${creditRedeemed ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  config.creditApplied ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-secondary)]">
                Credit balance: <span className="font-mono font-bold text-[var(--green)]">₹{creditBalance}</span>
                {creditRedeemed && <span className="text-[var(--red)] ml-2">(redeemed)</span>}
              </span>
              <button
                onClick={resetCredit}
                className="text-[10px] text-[var(--text-muted)] hover:text-white"
              >
                Reset
              </button>
            </div>
            {config.creditApplied && !creditRedeemed && (
              <button
                onClick={simulateConfirmedTransaction}
                className="mt-2 w-full py-1.5 rounded-lg bg-[var(--green-dim)] border border-[var(--green-border)] text-[11px] font-semibold text-[var(--green)] hover:bg-[rgba(34,197,94,0.18)] transition-colors"
              >
                Simulate confirmed transaction → redeem credit
              </button>
            )}
            {creditRedeemed && (
              <p className="mt-1.5 text-[10px] text-[var(--text-muted)]">
                Credit redeemed on confirmation. A retry will not redeem it again.
              </p>
            )}
          </div>

          {/* Disclaimer */}
          <div className="text-[10px] text-[var(--text-muted)] leading-relaxed border-t border-[var(--border-subtle)] pt-3">
            Charged on executed position value, not deposited margin. Closing incurs another
            execution charge. Funding, spread, slippage and applicable taxes are additional.
          </div>
        </div>
      </div>

      {/* ══════ ROW 2: Demand Mode + Sensitivity ══════ */}
      <div className="card-elevated p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <SectionLabel>Projection mode</SectionLabel>
            <p className="text-[11px] text-[var(--text-secondary)] max-w-md">
              A higher fee mechanically raises revenue per transaction. It does not establish
              that customers will keep trading at the same rate.
            </p>
          </div>
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden shrink-0">
            {(['ARITHMETIC_ONLY', 'DEMAND_SENSITIVE'] as DemandMode[]).map(m => (
              <button
                key={m}
                onClick={() => setDemandMode(m)}
                className={`px-3 py-2 text-[11px] font-semibold transition-colors ${
                  demandMode === m
                    ? 'bg-[var(--brand-dim)] text-[var(--brand)]'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                {m === 'ARITHMETIC_ONLY' ? '⊞ Fee arithmetic only' : '〜 Demand sensitivity'}
              </button>
            ))}
          </div>
        </div>

        {demandMode === 'ARITHMETIC_ONLY' && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <Info className="w-3.5 h-3.5 text-[var(--text-muted)] mt-0.5 shrink-0" />
            <p className="text-[11px] text-[var(--text-secondary)]">
              <strong>Fee arithmetic only:</strong> Volume stays fixed at the assumed baseline.
              Shows the direct revenue effect of changing the fee — no behavioural assumption applied.
            </p>
          </div>
        )}

        {demandMode === 'DEMAND_SENSITIVE' && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--yellow-dim)] border border-[var(--yellow-border)]">
              <AlertTriangle className="w-3.5 h-3.5 text-[var(--yellow)] mt-0.5 shrink-0" />
              <p className="text-[11px] text-[var(--text-secondary)]">
                <strong className="text-[var(--yellow)]">Assumed, not measured.</strong> These scenarios
                test your recommendation against different price-sensitivity assumptions. They do
                not predict actual behaviour. Completing a Market Night does{' '}
                <em>not</em> automatically make users less price-sensitive — that relationship would need evidence.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH'] as SensitivityLevel[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSensitivity(s)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    sensitivity === s
                      ? 'bg-[var(--brand-dim)] border-[var(--brand-border)] text-[var(--brand)]'
                      : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-accent)]'
                  }`}
                >
                  <p className="font-bold text-[11px]">{s.charAt(0) + s.slice(1).toLowerCase()} sensitivity</p>
                  <p className="text-[10px] mt-0.5 opacity-80">{SENSITIVITY_DESC[s]}</p>
                </button>
              ))}
            </div>

            {projection.volumeRetentionPct < 100 && (
              <div className="flex items-center justify-between p-2 rounded bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                <span className="text-[11px] text-[var(--text-secondary)]">Volume retention under these assumptions</span>
                <span className={`font-mono font-bold text-[13px] ${
                  projection.volumeRetentionPct < 80 ? 'text-[var(--red)]'
                  : projection.volumeRetentionPct < 95 ? 'text-[var(--yellow)]'
                  : 'text-[var(--green)]'
                }`}>
                  {projection.volumeRetentionPct.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════ ROW 3: Business Projections ══════ */}
      <div className="card-elevated p-4">
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>Year-one business consequences</SectionLabel>
          <button
            onClick={() => setShowProjectionInputs(v => !v)}
            className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-white transition-colors"
          >
            {showProjectionInputs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Edit assumptions
          </button>
        </div>

        {showProjectionInputs && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'activeTraders', label: 'Active traders', unit: '' },
              { key: 'avgTradesPerYear', label: 'Trades / trader / yr', unit: '' },
              { key: 'avgPositionValue', label: 'Avg position (₹)', unit: '₹' },
              { key: 'eventsPerYear', label: 'Events / year', unit: '' },
              { key: 'completedCrewsPerEvent', label: 'Completed crews / event', unit: '' },
              { key: 'operatingCostPerMonth', label: 'Opex / month (₹)', unit: '₹' },
              { key: 'newTradersPerYear', label: 'New traders / yr', unit: '' },
              { key: 'acquisitionCostPerTrader', label: 'CAC per trader (₹)', unit: '₹' },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-0.5">
                <label className="text-[10px] text-[var(--text-muted)]">{label}</label>
                <input
                  type="number"
                  value={projInputs[key as keyof typeof projInputs]}
                  onChange={e => setProjInputs(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-[var(--bg-interactive)] border border-[var(--border)] rounded px-2 py-1 text-[11px] font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand)]"
                />
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          <div className="divide-y divide-[var(--border-subtle)]">
            <ProjectionRow
              label="Year-one executed volume"
              value={fmtINR(projection.totalVolume)}
              sub={demandMode === 'DEMAND_SENSITIVE' ? `${projection.volumeRetentionPct.toFixed(1)}% of baseline retained` : 'Fixed baseline'}
              color="text-[var(--text-primary)]"
            />
            <ProjectionRow
              label="Gross platform service revenue"
              value={fmtINR(projection.grossServiceRevenue)}
              sub={`${pct(config.platformFeeRate)} × executed volume only`}
              color="text-[var(--brand)]"
            />
            <ProjectionRow
              label="Redeemed credits"
              value={`−${fmtINR(projection.redeemedCredits)}`}
              sub={`${projInputs.completedCrewsPerEvent} crews × ${projInputs.eventsPerYear} events × ₹${config.creditCap}`}
              color="text-[var(--green)]"
            />
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            <ProjectionRow
              label="Net service revenue"
              value={fmtINR(projection.netServiceRevenue)}
              sub="After credits — venue charges not included"
              color="text-[var(--text-primary)]"
            />
            <ProjectionRow
              label="Modelled costs (opex + CAC)"
              value={`−${fmtINR(projection.operatingCost + projection.acquisitionCost)}`}
              sub="₹75K/mo opex + blended CAC"
              color="text-[var(--text-muted)]"
            />
            <ProjectionRow
              label="Contribution"
              value={fmtINR(projection.contribution)}
              color={projection.contribution > 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}
              topBorder
            />
          </div>
        </div>

        {/* Accounting note */}
        <div className="mt-3 flex items-start gap-2 text-[10px] text-[var(--text-muted)]">
          <Info className="w-3 h-3 mt-0.5 shrink-0" />
          <span>
            Venue charges pass through to the venue — they do not appear as retained platform revenue.
            Gross service revenue = executed volume × platform fee rate only.
          </span>
        </div>
      </div>

      {/* ══════ ROW 4: Plan Comparison ══════ */}
      <div className="card-elevated p-4 space-y-4">
        <SectionLabel>Plan A vs Plan B comparison</SectionLabel>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[{ plan: planA, slot: 'A' as const }, { plan: planB, slot: 'B' as const }].map(({ plan, slot }) => (
            <div
              key={slot}
              className={`p-3 rounded-lg border transition-all ${
                plan
                  ? 'bg-[var(--bg-elevated)] border-[var(--border-accent)]'
                  : 'bg-[var(--bg-elevated)] border-[var(--border)] border-dashed'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`font-bold text-[12px] ${plan ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                  Plan {slot}
                </span>
                {plan ? (
                  <button onClick={() => loadPlan(plan)} className="text-[10px] text-[var(--brand)] hover:underline">
                    Load
                  </button>
                ) : (
                  <span className="text-[10px] text-[var(--text-muted)]">Not saved</span>
                )}
              </div>
              {plan ? (
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Platform fee</span>
                    <span className="font-mono font-bold">{pct(plan.config.platformFeeRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Credit cap</span>
                    <span className="font-mono">₹{plan.config.creditCap}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Contribution</span>
                    <span className={`font-mono font-bold ${plan.projection.contribution > 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                      {fmtINR(plan.projection.contribution)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Mode</span>
                    <span className="font-mono text-[10px]">
                      {plan.demandMode === 'DEMAND_SENSITIVE' ? `Demand · ${plan.sensitivity}` : 'Arithmetic'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-[var(--text-muted)]">
                  Adjust controls above and click "Save as Plan {slot}"
                </p>
              )}
            </div>
          ))}
        </div>

        {planA && planB && (
          <button
            onClick={runComparison}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--brand-dim)] border border-[var(--brand-border)] text-[var(--brand)] font-bold text-[12px] hover:bg-[rgba(245,158,11,0.2)] transition-colors"
          >
            <GitCompare className="w-4 h-4" />
            Compare Plan A vs Plan B
          </button>
        )}

        {/* Comparison result */}
        {comparison && (
          <div className="space-y-3 animate-in fade-in">
            <div className="h-px bg-[var(--border)]" />

            {/* Summary sentence */}
            <div className={`p-3 rounded-lg border ${
              comparison.planBWinsOnContribution
                ? 'bg-[var(--green-dim)] border-[var(--green-border)]'
                : 'bg-[var(--red-dim)] border-[var(--red-border)]'
            }`}>
              {comparison.planBWinsOnContribution ? (
                <p className="text-[12px] font-semibold text-[var(--green)]">
                  Under these assumptions, Plan B produces{' '}
                  <strong>{inr(Math.abs(comparison.contributionDelta))}</strong> more contribution
                  {comparison.volumeDeltaPct !== 0 && (
                    <>, with <strong>{Math.abs(comparison.volumeDeltaPct).toFixed(1)}% {comparison.volumeDelta < 0 ? 'less' : 'more'}</strong> executed volume.</>
                  )}
                </p>
              ) : (
                <p className="text-[12px] font-semibold text-[var(--red)]">
                  Under these assumptions, Plan B produces{' '}
                  <strong>{inr(Math.abs(comparison.contributionDelta))}</strong> less contribution.
                </p>
              )}
            </div>

            {/* Breakeven condition */}
            <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[var(--yellow)] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[12px] font-semibold text-[var(--text-primary)] mb-1">
                    Breakeven condition for gross service revenue
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Plan B's higher platform fee ({pct(comparison.planB.config.platformFeeRate)}) loses its
                    gross revenue advantage when executed volume falls below{' '}
                    <strong className="text-[var(--yellow)]">
                      {comparison.breakevenVolumeRetentionPct.toFixed(1)}%
                    </strong>{' '}
                    of the Plan A baseline.
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                    This is the condition to validate: what evidence do you have that volume
                    will hold above {comparison.breakevenVolumeRetentionPct.toFixed(1)}% at the higher fee?
                  </p>
                </div>
              </div>
            </div>

            {/* Comparison table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-1.5 text-[var(--text-muted)] font-normal pr-4">Metric</th>
                    <th className="text-right py-1.5 text-[var(--text-muted)] font-normal pr-4">Plan A</th>
                    <th className="text-right py-1.5 text-[var(--text-muted)] font-normal pr-4">Plan B</th>
                    <th className="text-right py-1.5 text-[var(--text-muted)] font-normal">Δ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {[
                    {
                      label: 'Platform fee rate',
                      a: pct(comparison.planA.config.platformFeeRate),
                      b: pct(comparison.planB.config.platformFeeRate),
                      delta: `+${((comparison.planB.config.platformFeeRate - comparison.planA.config.platformFeeRate) * 100).toFixed(3)}%`,
                      deltaColor: 'text-[var(--yellow)]',
                    },
                    {
                      label: 'Executed volume',
                      a: fmtINR(comparison.planA.projection.effectiveVolume),
                      b: fmtINR(comparison.planB.projection.effectiveVolume),
                      delta: comparison.volumeDeltaPct !== 0 ? `${comparison.volumeDeltaPct.toFixed(1)}%` : '—',
                      deltaColor: comparison.volumeDelta < 0 ? 'text-[var(--red)]' : 'text-[var(--green)]',
                    },
                    {
                      label: 'Gross service revenue',
                      a: fmtINR(comparison.planA.projection.grossServiceRevenue),
                      b: fmtINR(comparison.planB.projection.grossServiceRevenue),
                      delta: fmtINR(comparison.planB.projection.grossServiceRevenue - comparison.planA.projection.grossServiceRevenue),
                      deltaColor: comparison.planB.projection.grossServiceRevenue >= comparison.planA.projection.grossServiceRevenue ? 'text-[var(--green)]' : 'text-[var(--red)]',
                    },
                    {
                      label: 'Redeemed credits',
                      a: fmtINR(comparison.planA.projection.redeemedCredits),
                      b: fmtINR(comparison.planB.projection.redeemedCredits),
                      delta: '—',
                      deltaColor: 'text-[var(--text-muted)]',
                    },
                    {
                      label: 'Net service revenue',
                      a: fmtINR(comparison.planA.projection.netServiceRevenue),
                      b: fmtINR(comparison.planB.projection.netServiceRevenue),
                      delta: fmtINR(comparison.planB.projection.netServiceRevenue - comparison.planA.projection.netServiceRevenue),
                      deltaColor: comparison.planB.projection.netServiceRevenue >= comparison.planA.projection.netServiceRevenue ? 'text-[var(--green)]' : 'text-[var(--red)]',
                    },
                    {
                      label: 'Contribution',
                      a: fmtINR(comparison.planA.projection.contribution),
                      b: fmtINR(comparison.planB.projection.contribution),
                      delta: fmtINR(comparison.contributionDelta),
                      deltaColor: comparison.planBWinsOnContribution ? 'text-[var(--green)]' : 'text-[var(--red)]',
                    },
                  ].map(row => (
                    <tr key={row.label}>
                      <td className="py-1.5 text-[var(--text-secondary)] pr-4">{row.label}</td>
                      <td className="py-1.5 font-mono text-right pr-4">{row.a}</td>
                      <td className="py-1.5 font-mono text-right pr-4">{row.b}</td>
                      <td className={`py-1.5 font-mono text-right font-bold ${row.deltaColor}`}>{row.delta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ══════ 60-Second Demo Sequence Guide ══════ */}
      <div className="card-elevated p-4">
        <SectionLabel>Live demonstration sequence</SectionLabel>
        <ol className="space-y-2">
          {[
            'Open the simulated trade preview — see itemised charges at the current fee.',
            'Change the platform fee slider — the customer preview and gross revenue update instantly.',
            'Toggle the Market Night credit — the customer charge and net revenue both update correctly.',
            'Switch to "Demand sensitivity" mode and increase sensitivity — projected volume falls.',
            'Save two configurations as Plan A and Plan B, then compare — reveal the breakeven condition.',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[12px] text-[var(--text-secondary)]">
              <span className="w-5 h-5 rounded-full bg-[var(--brand-dim)] border border-[var(--brand-border)] text-[var(--brand)] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

    </div>
  );
}
