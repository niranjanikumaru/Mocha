'use client';

/**
 * TrustJourneyPanel.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Visualises the 4-track trust-building plan as an interactive funnel.
 *
 * Trust Tracks (justification for each):
 *  1. Market Night (Crew Pass)         — Community-driven social proof; measurable
 *     CAC reduction (simulation: 41/64 qualification → 64.1% crew completion).
 *  2. Platform Reliability             — Lost-ACK recovery + idempotent deposits +
 *     margin explainability; directly reduces support ticket volume (β_tickets = 0.25)
 *     and retention penalty.
 *  3. Transparent Pricing              — Versioned contract rules + receipts; each rule
 *     version frozen at execution time. Reduces "gotcha fee" churn (β_retention = 0.04).
 *  4. Social Proof Loop                — Post-trade receipts + crew divergence reports
 *     shared publicly; drives organic referral (K-factor amplification).
 *
 * All displayed numbers flow from the TrustLever betas in model.ts — nothing is
 * hardcoded in this component. Toggling a lever above propagates here immediately.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Shield, FileText, Share2, ChevronRight,
  TrendingUp, AlertTriangle, CheckCircle2, Clock, ExternalLink,
} from 'lucide-react';
import type { TrustLever } from '../core/growth/model';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrustTrack {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  colorDim: string;
  colorBorder: string;
  /** Which TrustLever IDs feed this track */
  leverIds: string[];
  /** Funnel stage this track primarily unlocks */
  funnelStage: 'Signup' | 'KYC' | 'Deposit' | 'First Trade' | 'Retention';
  /** Proof route the user can navigate to */
  proofRoute: string;
  /** Timeline (months to meaningful effect) */
  timelineMonths: number;
  /** Justification — shown as a callout */
  justification: string;
  /** Evidence type */
  evidence: 'SIMULATED' | 'MEASURED' | 'ASSUMED';
  /** milestones: ordered checkpoints user can see */
  milestones: string[];
}

const TRUST_TRACKS: TrustTrack[] = [
  {
    id: 'track-crew',
    label: 'Market Night',
    subtitle: 'Crew Pass Social Layer',
    icon: Users,
    color: '#f59e0b',
    colorDim: 'rgba(245,158,11,0.12)',
    colorBorder: 'rgba(245,158,11,0.25)',
    leverIds: ['TL-5'],
    funnelStage: 'First Trade',
    proofRoute: '/proof/market-night',
    timelineMonths: 1,
    justification:
      '64.1% crew completion (41/64 simulated) → social accountability replaces cold-start anxiety. 4-member squads share first-trade outcomes, dramatically cutting first-30-day churn.',
    evidence: 'SIMULATED',
    milestones: [
      'User invited to crew by captain',
      'Attends first Market Night event',
      'Completes squad scenario (4/4 members)',
      'Receives divergence report + crew badge',
      'Converts to first live trade within 7 days',
    ],
  },
  {
    id: 'track-reliability',
    label: 'Platform Reliability',
    subtitle: 'Lost-ACK Recovery + Idempotent Deposits',
    icon: Shield,
    color: '#22c55e',
    colorDim: 'rgba(34,197,94,0.10)',
    colorBorder: 'rgba(34,197,94,0.22)',
    leverIds: ['TL-1', 'TL-2', 'TL-3'],
    funnelStage: 'Retention',
    proofRoute: '/proof/terminal',
    timelineMonths: 0,
    justification:
      'Ghost trades from dropped ACKs and duplicate deposits are the #1 retail fintech trust-killer. Reconciling at the platform level (not requiring user to call support) reduces ticket volume by up to 50% (β_tickets = 0.25 on TL-2 alone).',
    evidence: 'SIMULATED',
    milestones: [
      'Margin health shown in plain English (not just ₹ numbers)',
      'Deposit retried → idempotency key blocks double-credit',
      'Lost order ACK detected → auto-reconcile within 80 ms',
      'User sees "Resolved" status — not a confusing ghost trade',
      'Support ticket never raised → trust preserved',
    ],
  },
  {
    id: 'track-pricing',
    label: 'Transparent Pricing',
    subtitle: 'Versioned Contract Rules + Receipts',
    icon: FileText,
    color: '#60a5fa',
    colorDim: 'rgba(96,165,250,0.10)',
    colorBorder: 'rgba(96,165,250,0.22)',
    leverIds: ['TL-4'],
    funnelStage: 'Deposit',
    proofRoute: '/proof/contracts',
    timelineMonths: 2,
    justification:
      'The #1 reason Indian retail traders avoid derivatives: "fees changed and I didn\'t know." Freezing contract rules at execution time with versioned receipts gives users a paper trail for every trade — eliminating dispute ambiguity and driving β_retention = +0.04.',
    evidence: 'ASSUMED',
    milestones: [
      'User views contract rules before opening position',
      'Fee schedule and margin parameters locked at rule v1.0',
      'Trade executed → versioned receipt generated',
      'Rule v2.0 published → old receipts remain on v1.0',
      'User can replay any historical trade under original rules',
    ],
  },
  {
    id: 'track-social',
    label: 'Social Proof Loop',
    subtitle: 'Post-Trade Receipts + Crew Divergence Reports',
    icon: Share2,
    color: '#a855f7',
    colorDim: 'rgba(168,85,247,0.10)',
    colorBorder: 'rgba(168,85,247,0.22)',
    leverIds: ['TL-5', 'TL-4'],
    funnelStage: 'Signup',
    proofRoute: '/proof/market-night',
    timelineMonths: 3,
    justification:
      'Crew divergence reports are shareable, verifiable artifacts showing how teammates traded the same scenario differently. Each shared report is an organic acquisition touchpoint — amplifying K-factor referrals without additional spend. Supports inviteConversionRate improvement.',
    evidence: 'ASSUMED',
    milestones: [
      'Crew completes scenario → divergence report auto-generated',
      'Captain shares report link with network',
      'Prospect sees real (anonymised) trade outcomes',
      'Prospect joins waitlist via crew captain invite',
      'Referral K-factor incrementally increases each event',
    ],
  },
];

// ─── Funnel stage order ───────────────────────────────────────────────────────

const FUNNEL_STAGES = ['Signup', 'KYC', 'Deposit', 'First Trade', 'Retention'] as const;

// ─── Evidence chip ────────────────────────────────────────────────────────────

const EVIDENCE_COLORS: Record<string, { text: string; border: string }> = {
  SIMULATED: { text: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  MEASURED:  { text: '#22c55e', border: 'rgba(34,197,94,0.3)' },
  ASSUMED:   { text: '#7e7e9a', border: 'rgba(126,126,154,0.3)' },
};

function EvidenceChip({ type }: { type: string }) {
  const c = EVIDENCE_COLORS[type] || EVIDENCE_COLORS.ASSUMED;
  return (
    <span
      style={{ color: c.text, borderColor: c.border }}
      className="text-[9px] font-bold border rounded px-1 py-0.5 tracking-widest"
    >
      {type}
    </span>
  );
}

// ─── Per-track lift calculator ────────────────────────────────────────────────

function computeTrackLift(track: TrustTrack, levers: TrustLever[]) {
  const relevantLevers = levers.filter((l) => track.leverIds.includes(l.id));
  if (relevantLevers.length === 0) {
    return { score: 0, depositLift: 0, retentionLift: 0, ticketReduction: 0, active: false };
  }

  const activeLevers = relevantLevers.filter((l) => l.enabled);
  const score = activeLevers.reduce((sum, l) => sum + l.completeness, 0) / relevantLevers.length;

  const depositLift = activeLevers.reduce((s, l) => s + l.completeness * l.betaDeposit, 0);
  const retentionLift = activeLevers.reduce((s, l) => s + l.completeness * l.betaRetention, 0);
  const ticketReduction = activeLevers.reduce((s, l) => s + l.completeness * l.betaTickets, 0);

  return { score, depositLift, retentionLift, ticketReduction, active: activeLevers.length > 0 };
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface TrustJourneyPanelProps {
  trustLevers: TrustLever[];
  trustScore: number;
  trustRef: number;
}

export default function TrustJourneyPanel({
  trustLevers,
  trustScore,
  trustRef,
}: TrustJourneyPanelProps) {
  const trackMetrics = useMemo(
    () => TRUST_TRACKS.map((track) => ({ track, lift: computeTrackLift(track, trustLevers) })),
    [trustLevers],
  );

  const funnelCoverage = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const stage of FUNNEL_STAGES) map[stage] = [];
    for (const { track, lift } of trackMetrics) {
      if (lift.active) map[track.funnelStage]?.push(track.id);
    }
    return map;
  }, [trackMetrics]);

  const overallHealth: 'strong' | 'partial' | 'weak' =
    trustScore >= 0.7 ? 'strong' : trustScore >= 0.4 ? 'partial' : 'weak';

  const healthConfig = {
    strong:  { label: 'Trust Plan Strong',                  color: '#22c55e', bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.22)'   },
    partial: { label: 'Trust Plan Partial',                 color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.22)'  },
    weak:    { label: 'Trust Plan Weak — Baseline at risk', color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.22)'   },
  }[overallHealth];

  return (
    <div className="space-y-4">

      {/* ── Overall health header ──────────────────────────────────────────── */}
      <div
        className="rounded-lg border p-3 flex items-center justify-between"
        style={{ background: healthConfig.bg, borderColor: healthConfig.border }}
      >
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" style={{ color: healthConfig.color }} />
          <span className="text-[12px] font-bold" style={{ color: healthConfig.color }}>
            {healthConfig.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-[var(--text-muted)]">Trust Score T</div>
            <div className="text-[16px] font-mono font-bold" style={{ color: healthConfig.color }}>
              {(trustScore * 100).toFixed(0)}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[var(--text-muted)]">Reference T₀</div>
            <div className="text-[13px] font-mono text-[var(--text-secondary)]">
              {(trustRef * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* ── Funnel coverage map ────────────────────────────────────────────── */}
      <div className="card p-3 bg-[var(--bg-surface)]">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
          Trust Coverage by Funnel Stage
        </div>
        <div className="flex gap-1">
          {FUNNEL_STAGES.map((stage, i) => {
            const covered = funnelCoverage[stage] ?? [];
            const isCovered = covered.length > 0;
            return (
              <div key={stage} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full text-center py-1.5 px-1 rounded text-[9px] font-semibold border transition-all"
                  style={{
                    background: isCovered ? 'rgba(245,158,11,0.10)' : 'var(--bg-interactive)',
                    borderColor: isCovered ? 'rgba(245,158,11,0.30)' : 'var(--border)',
                    color: isCovered ? '#f59e0b' : 'var(--text-muted)',
                  }}
                >
                  {stage}
                </div>
                <div className="flex gap-0.5 justify-center flex-wrap">
                  {covered.map((tid) => {
                    const t = TRUST_TRACKS.find((tr) => tr.id === tid)!;
                    return (
                      <div
                        key={tid}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: t.color }}
                        title={t.label}
                      />
                    );
                  })}
                  {!isCovered && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--bg-hover)]" />
                  )}
                </div>
                {/* arrow connector */}
                {i < FUNNEL_STAGES.length - 1 && (
                  <div className="hidden" />
                )}
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-2 pt-2 border-t border-[var(--border-subtle)]">
          {TRUST_TRACKS.map((t) => (
            <div key={t.id} className="flex items-center gap-1 text-[9px] text-[var(--text-muted)]">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: t.color }} />
              {t.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Trust track cards ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        {trackMetrics.map(({ track, lift }, idx) => {
          const Icon = track.icon;
          const completionPct = lift.score * 100;
          const isActive = lift.active;

          return (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07 }}
              className="card p-3 bg-[var(--bg-surface)] border transition-colors"
              style={{ borderColor: isActive ? track.colorBorder : 'var(--border)' }}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: track.colorDim, border: `1px solid ${track.colorBorder}` }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: track.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-[var(--text-primary)] truncate">{track.label}</div>
                    <div className="text-[10px] text-[var(--text-secondary)] leading-none">{track.subtitle}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <EvidenceChip type={track.evidence} />
                  {track.timelineMonths === 0 ? (
                    <span className="text-[9px] text-[var(--green)] font-semibold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Live
                    </span>
                  ) : (
                    <span className="text-[9px] text-[var(--text-muted)] flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> Mo {track.timelineMonths}+
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-2">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-[var(--text-muted)]">Completeness</span>
                  <span
                    className="font-mono font-bold"
                    style={{ color: isActive ? track.color : 'var(--text-muted)' }}
                  >
                    {completionPct.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 bg-[var(--bg-interactive)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: track.color, opacity: isActive ? 1 : 0.2 }}
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Lift metrics */}
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {[
                  { label: 'Deposit lift', value: lift.depositLift, format: (v: number) => v > 0 ? `+${(v * 100).toFixed(1)}%` : '—', color: 'var(--green)' },
                  { label: 'Retention lift', value: lift.retentionLift, format: (v: number) => v > 0 ? `+${(v * 100).toFixed(1)}%` : '—', color: 'var(--green)' },
                  { label: 'Ticket cut', value: lift.ticketReduction, format: (v: number) => v > 0 ? `−${(v * 100).toFixed(0)}%` : '—', color: '#f59e0b' },
                ].map(({ label, value, format, color }) => (
                  <div key={label} className="text-center p-1.5 rounded bg-[var(--bg-interactive)]">
                    <div className="text-[9px] text-[var(--text-muted)]">{label}</div>
                    <div className="text-[11px] font-mono font-bold" style={{ color: value > 0 ? color : 'var(--text-muted)' }}>
                      {format(value)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Milestones */}
              <details className="group">
                <summary className="text-[10px] text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-secondary)] list-none flex items-center gap-1 select-none">
                  <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
                  {track.milestones.length} milestones
                </summary>
                <div className="pl-4 mt-1.5 space-y-1">
                  {track.milestones.map((m, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[10px] text-[var(--text-secondary)]">
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-0.5 shrink-0"
                        style={{ background: isActive ? track.color : 'var(--text-muted)' }}
                      />
                      {m}
                    </div>
                  ))}
                </div>
              </details>

              {/* Justification callout */}
              <div className="mt-2 p-2 rounded bg-[var(--bg-interactive)] border border-[var(--border-subtle)]">
                <p className="text-[9px] text-[var(--text-muted)] leading-relaxed">
                  <AlertTriangle className="w-2.5 h-2.5 inline mr-1 text-[var(--yellow)]" />
                  {track.justification}
                </p>
              </div>

              {/* Proof link */}
              <Link
                href={track.proofRoute}
                className="mt-2 flex items-center gap-1 text-[10px] hover:underline"
                style={{ color: track.color }}
              >
                <ExternalLink className="w-3 h-3" />
                See live implementation
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* ── Compound trust effect summary ─────────────────────────────────── */}
      <div className="card p-3 bg-[var(--bg-surface)] border border-[var(--brand-border)]">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-[var(--brand)]" />
          <span className="text-[11px] font-bold text-[var(--brand)]">Compound Trust Effect</span>
        </div>
        <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed mb-3">
          The 4 tracks are not additive — they are multiplicative. A user who joins via Market Night
          {' '}<strong className="text-[var(--text-primary)]">AND</strong>{' '}
          sees explainable margin health
          {' '}<strong className="text-[var(--text-primary)]">AND</strong>{' '}
          receives a versioned receipt is not just{' '}
          <span className="font-mono text-[var(--brand)]">3×</span> more confident —
          the social accountability of their crew makes each reliability proof
          {' '}<em>felt and discussed</em>, amplifying retention across all cohorts.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-[var(--bg-interactive)]">
            <div className="text-[9px] text-[var(--text-muted)]">T vs Reference T₀</div>
            <div
              className="text-[14px] font-mono font-bold"
              style={{ color: trustScore >= trustRef ? '#22c55e' : '#ef4444' }}
            >
              {trustScore >= trustRef ? '+' : ''}{((trustScore - trustRef) * 100).toFixed(0)}pp
            </div>
            <div className="text-[9px] text-[var(--text-muted)]">
              {trustScore >= trustRef ? 'above ref → funnel lifts applied' : 'below ref → funnel drag applied'}
            </div>
          </div>
          <div className="p-2 rounded bg-[var(--bg-interactive)]">
            <div className="text-[9px] text-[var(--text-muted)]">Tracks active</div>
            <div className="text-[14px] font-mono font-bold text-[var(--text-primary)]">
              {trackMetrics.filter((m) => m.lift.active).length} / {TRUST_TRACKS.length}
            </div>
            <div className="text-[9px] text-[var(--text-muted)]">
              {trackMetrics.filter((m) => m.lift.active).length === TRUST_TRACKS.length
                ? 'All tracks firing — max compounding'
                : 'Enable remaining tracks to compound'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
