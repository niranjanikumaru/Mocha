'use client';

import { useState } from 'react';
import {
  BarChart3, TrendingUp, Users, DollarSign, Zap, AlertTriangle,
  MessageSquare, CheckCircle2, Activity, Eye, ChevronRight,
  Sliders, Info
} from 'lucide-react';
import { GrowthMetrics, FounderProjectionInputs } from '../../types/marketNight';

interface FounderDashboardProps {
  metrics: GrowthMetrics;
  eventCostINR?: number;
  onUseEventInputs?: () => void;
  defaultProjection?: Partial<FounderProjectionInputs>;
}

const DEFAULT_INPUTS: FounderProjectionInputs = {
  eventsPerMonth: 4,
  capacityPerEvent: 80,
  attendanceRate: 70,
  newUserSharePct: 40,
  newToFirstTradePct: 12,
  monthlyRetentionPct: 65,
  serviceFeeINR: 350,
  eventCostPerSessionINR: 4500,
  benefitCostPerCrewINR: 500,
  paidAcquisitionBudgetINR: 50000,
  paidCACINR: 2800,
};

function Metric({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl space-y-0.5">
      <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">{label}</p>
      <p className={`font-mono font-bold text-[16px] ${color || 'text-[var(--text-primary)]'}`}>{value}</p>
      {sub && <p className="text-[9px] text-[var(--text-muted)]">{sub}</p>}
    </div>
  );
}

function SliderInput({ label, value, min, max, step, unit, onChange, note }: {
  label: string; value: number; min: number; max: number; step: number; unit?: string;
  onChange: (v: number) => void; note?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[12px]">
        <label className="text-[var(--text-secondary)] font-medium">{label}</label>
        <span className="font-mono font-bold text-[var(--text-primary)]">{unit === '₹' ? `₹${value.toLocaleString()}` : `${value}${unit || ''}`}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full bg-[var(--bg-interactive)] accent-amber-400"
      />
      {note && <p className="text-[9px] text-[var(--text-muted)]">{note}</p>}
    </div>
  );
}

export default function FounderDashboard({ metrics, onUseEventInputs, defaultProjection }: FounderDashboardProps) {
  const [activeTab, setActiveTab] = useState<'OBSERVED' | 'PROJECTION'>('OBSERVED');
  const [inputs, setInputs] = useState<FounderProjectionInputs>({ ...DEFAULT_INPUTS, ...defaultProjection });
  const [transferConfirm, setTransferConfirm] = useState(false);

  function set(key: keyof FounderProjectionInputs, v: number) {
    setInputs(prev => ({ ...prev, [key]: v }));
  }

  // ── Projection calculations ──
  const attendeesPerMonth = inputs.eventsPerMonth * inputs.capacityPerEvent * (inputs.attendanceRate / 100);
  const newUsersPerMonth  = attendeesPerMonth * (inputs.newUserSharePct / 100);
  const newTradersPerMonth = newUsersPerMonth * (inputs.newToFirstTradePct / 100);
  const revenuePerMonthINR = newTradersPerMonth * inputs.serviceFeeINR;

  const crewsPerEvent = Math.floor((inputs.capacityPerEvent * (inputs.attendanceRate / 100)) / 4);
  const eventCostTotal = inputs.eventsPerMonth * (inputs.eventCostPerSessionINR + crewsPerEvent * inputs.benefitCostPerCrewINR);
  const marketNightCAC = newTradersPerMonth > 0 ? Math.round(eventCostTotal / newTradersPerMonth) : 0;

  const paidTradersPerMonth = Math.floor(inputs.paidAcquisitionBudgetINR / inputs.paidCACINR);
  const paidRevenuePerMonth = paidTradersPerMonth * inputs.serviceFeeINR;

  // Year-one totals
  const mnTotalTraders  = Math.round(newTradersPerMonth * 12 * (inputs.monthlyRetentionPct / 100));
  const paidTotalTraders = Math.round(paidTradersPerMonth * 12 * (inputs.monthlyRetentionPct / 100));

  return (
    <div className="card-elevated p-5 bg-[var(--bg-surface)] border-[var(--brand-border)] space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[var(--brand)]" />
          <span className="font-bold text-[13px] text-[var(--text-primary)] uppercase tracking-wider">Founder Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-muted text-[10px]">DEMO TELEMETRY</span>
          <span className="text-[10px] text-[var(--text-muted)]">Not real customer evidence</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-1">
        <button
          onClick={() => setActiveTab('OBSERVED')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-[12px] font-semibold transition-all ${activeTab === 'OBSERVED' ? 'bg-[var(--brand-dim)] text-[var(--brand)] border border-[var(--brand-border)]' : 'text-[var(--text-secondary)] hover:text-white'}`}
        >
          A. This event — observed demo activity
        </button>
        <button
          onClick={() => setActiveTab('PROJECTION')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-[12px] font-semibold transition-all ${activeTab === 'PROJECTION' ? 'bg-[var(--brand-dim)] text-[var(--brand)] border border-[var(--brand-border)]' : 'text-[var(--text-secondary)] hover:text-white'}`}
        >
          B. Year-one strategy — assumed projection
        </button>
      </div>

      {/* ── TAB A: Observed activity ── */}
      {activeTab === 'OBSERVED' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[var(--brand)]" />
            <h3 className="font-bold text-[12px] uppercase tracking-wider text-[var(--text-primary)]">Event telemetry (demo session)</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <Metric label="Reservations"     value={String(metrics.reservationCount)}    sub="Unique accounts"                  color="text-[var(--brand)]" />
            <Metric label="Attendees"         value={String(metrics.attendeeCount)}       sub="Valid check-ins"                  color="text-[var(--green)]" />
            <Metric label="Completed crews"   value={String(metrics.completedCrews)}      sub="4/4 checked in"                   color="text-[var(--brand)]" />
            <Metric label="Benefits issued"   value={String(metrics.benefitsIssued)}      sub="Unlock records"                   color="text-[var(--green)]" />
            <Metric label="Event cost"        value={`₹${metrics.eventCostINR.toLocaleString()}`} sub="Hosting + benefit cost"  color="text-[var(--yellow)]" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Metric label="Preview completions"    value={String(metrics.previewCompletions)}    sub="Trade previews opened" />
            <Metric label="Simulated decisions"    value={String(metrics.simulatedDecisions)}    sub="NOT real volume" color="text-[var(--text-muted)]" />
            <Metric label="Unresolved txns"        value={String(metrics.unresolvedTransactions)} sub="Unknown outcomes"      color={metrics.unresolvedTransactions > 0 ? 'text-[var(--yellow)]' : 'text-[var(--text-primary)]'} />
            <Metric label="Feedback responses"     value={String(metrics.feedbackResponses)}     sub="Submitted surveys" />
          </div>

          {/* Growth loop metrics */}
          <div className="border-t border-[var(--border)] pt-3">
            <div className="flex items-center gap-1.5 mb-2.5">
              <BarChart3 className="w-3.5 h-3.5 text-[var(--brand)]" />
              <span className="font-bold text-[11px] uppercase tracking-wider text-[var(--text-primary)]">Organic growth loop metrics</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <Metric label="Invite → attend"      value={`${metrics.inviteToAttendanceRate}%`}  sub="Attendance conversion"  color="text-[var(--green)]" />
              <Metric label="Crew completion"      value={`${metrics.teamCompletionRate}%`}       sub="Reached 4/4"            color="text-[var(--brand)]" />
              <Metric label="Benefit usage"        value={`${metrics.benefitUsageRate}%`}         sub="Scenario + Report"      color="text-[var(--green)]" />
              <Metric label="Next-week RSVP"       value={`${metrics.repeatAttendanceRsvpRate}%`} sub="Repeat attendance"      color="text-[var(--brand)]" />
              <Metric label="Cost / return trader" value={`₹${metrics.costPerReturningTrader * 83}`} sub="vs ₹2,324 traditional" color="text-[var(--green)]" />
            </div>
          </div>

          <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl flex gap-2 text-[11px] text-[var(--text-muted)]">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
            <span>Simulated decisions are clearly labelled and never counted as live volume. Conversion and retention remain assumed unless actual longitudinal evidence exists.</span>
          </div>

          <button
            onClick={() => { setTransferConfirm(true); setActiveTab('PROJECTION'); }}
            className="btn btn-ghost text-[12px] w-full sm:w-auto"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            Use this event's attendance and cost as planning inputs
          </button>
        </div>
      )}

      {/* ── TAB B: Year-one projection ── */}
      {activeTab === 'PROJECTION' && (
        <div className="space-y-4">
          {transferConfirm && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] space-y-1.5">
              <p className="font-bold text-amber-400 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Review before accepting transfer</p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-0.5">
                <li>Event cost: ₹{metrics.eventCostINR.toLocaleString()} will be used as <code className="font-mono">eventCostPerSession</code></li>
                <li>Attendance rate based on <strong>{metrics.attendeeCount}</strong> observed check-ins (demo, not real customers)</li>
                <li>Conversion and retention remain <strong>your assumed inputs</strong> — not derived from this demo</li>
              </ul>
              <div className="flex gap-2 pt-1">
                <button onClick={() => { set('eventCostPerSessionINR', metrics.eventCostINR); setTransferConfirm(false); }} className="btn btn-brand btn-sm">Accept transfer</button>
                <button onClick={() => setTransferConfirm(false)} className="btn btn-ghost btn-sm">Keep current</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Controls */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-[var(--brand)]" />
                <h3 className="font-bold text-[12px] uppercase tracking-wider text-[var(--text-primary)]">Adjust assumptions</h3>
              </div>

              <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Event cadence</p>
                <SliderInput label="Events per month"  value={inputs.eventsPerMonth} min={1} max={12} step={1} unit="/mo" onChange={v => set('eventsPerMonth', v)} />
                <SliderInput label="Capacity per event" value={inputs.capacityPerEvent} min={20} max={500} step={10} unit=" seats" onChange={v => set('capacityPerEvent', v)} />
                <SliderInput label="Attendance rate"   value={inputs.attendanceRate} min={10} max={100} step={5} unit="%" onChange={v => set('attendanceRate', v)} />
              </div>

              <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Conversion funnel (assumed)</p>
                <SliderInput label="Share genuinely new to MochaTrade" value={inputs.newUserSharePct} min={5} max={80} step={5} unit="%" onChange={v => set('newUserSharePct', v)} note="Conversion remains assumed — not established from this demo." />
                <SliderInput label="New prospect → first live trade"  value={inputs.newToFirstTradePct} min={1} max={40} step={1} unit="%" onChange={v => set('newToFirstTradePct', v)} />
                <SliderInput label="Monthly retention"                value={inputs.monthlyRetentionPct} min={10} max={95} step={5} unit="%" onChange={v => set('monthlyRetentionPct', v)} />
              </div>

              <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">Economics</p>
                <SliderInput label="Service fee per trader"       value={inputs.serviceFeeINR} min={50} max={2000} step={50} unit="₹" onChange={v => set('serviceFeeINR', v)} />
                <SliderInput label="Event cost per session"       value={inputs.eventCostPerSessionINR} min={1000} max={50000} step={500} unit="₹" onChange={v => set('eventCostPerSessionINR', v)} />
                <SliderInput label="Benefit cost per crew"        value={inputs.benefitCostPerCrewINR} min={0} max={2000} step={100} unit="₹" onChange={v => set('benefitCostPerCrewINR', v)} />
                <SliderInput label="Paid acquisition budget/mo"  value={inputs.paidAcquisitionBudgetINR} min={0} max={500000} step={5000} unit="₹" onChange={v => set('paidAcquisitionBudgetINR', v)} />
                <SliderInput label="Paid CAC (assumed)"          value={inputs.paidCACINR} min={500} max={10000} step={250} unit="₹" onChange={v => set('paidCACINR', v)} />
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-[var(--green)]" />
                <h3 className="font-bold text-[12px] uppercase tracking-wider text-[var(--text-primary)]">Year-one comparison (assumed)</h3>
              </div>

              {/* Market Night channel */}
              <div className="p-4 bg-[var(--brand-dim)] border border-[var(--brand-border)] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[13px] text-[var(--brand)]">Market Night channel</span>
                  <span className="badge badge-brand text-[10px]">ASSUMED</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Metric label="Attendees/mo"      value={Math.round(attendeesPerMonth).toLocaleString()}  sub="Across all events" />
                  <Metric label="New traders/mo"    value={Math.round(newTradersPerMonth).toLocaleString()}  sub="Assumed conversion" />
                  <Metric label="Revenue est./mo"   value={`₹${Math.round(revenuePerMonthINR).toLocaleString()}`} sub="Service fee only" color="text-[var(--green)]" />
                  <Metric label="Event cost/mo"     value={`₹${Math.round(eventCostTotal).toLocaleString()}`} sub="Session + benefit" color="text-[var(--yellow)]" />
                </div>
                <div className="flex justify-between text-[12px] pt-2 border-t border-[var(--brand-border)]">
                  <span className="text-[var(--text-secondary)]">Market Night CAC (assumed)</span>
                  <span className="font-mono font-bold text-[var(--brand)]">₹{marketNightCAC.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[var(--text-secondary)]">Retained traders year-one</span>
                  <span className="font-mono font-bold text-[var(--green)]">{mnTotalTraders.toLocaleString()}</span>
                </div>
              </div>

              {/* Paid channel */}
              <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[13px] text-[var(--text-primary)]">Paid acquisition (comparison)</span>
                  <span className="badge badge-muted text-[10px]">ASSUMED</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Metric label="Paid traders/mo"  value={paidTradersPerMonth.toLocaleString()} sub="Budget ÷ CAC" />
                  <Metric label="Revenue est./mo"  value={`₹${Math.round(paidRevenuePerMonth).toLocaleString()}`} sub="Service fee" color="text-[var(--green)]" />
                  <Metric label="Paid CAC"         value={`₹${inputs.paidCACINR.toLocaleString()}`} sub="Your assumed input" color="text-[var(--yellow)]" />
                  <Metric label="Budget/mo"        value={`₹${inputs.paidAcquisitionBudgetINR.toLocaleString()}`} sub="Paid spend" />
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[var(--text-secondary)]">Retained traders year-one</span>
                  <span className="font-mono font-bold">{paidTotalTraders.toLocaleString()}</span>
                </div>
              </div>

              {/* Caveat */}
              <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl text-[10px] text-[var(--text-muted)] space-y-1.5">
                <p className="font-bold text-[var(--text-secondary)] flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-400" /> Important caveats</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Conversion and retention are assumed inputs — not established from demo data</li>
                  <li>Simulated decisions are never counted as live trading volume</li>
                  <li>Market Night CAC only becomes meaningful with actual longitudinal cohort data</li>
                  <li>Do not present boosted margin or insured stop-losses as attendance benefits</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
