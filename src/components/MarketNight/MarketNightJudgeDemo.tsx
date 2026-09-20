'use client';

import { MarketNightUser, GrowthMetrics } from '../../types/marketNight';
import { TEST_USERS } from '../../lib/marketNightEngine';
import {
  Users, Zap, ShieldCheck, RefreshCw, Award, TrendingUp,
  DollarSign, Repeat, CheckCircle2, ChevronRight, BarChart3
} from 'lucide-react';

interface MarketNightJudgeDemoProps {
  currentUser: MarketNightUser;
  onSelectUser: (u: MarketNightUser) => void;
  metrics: GrowthMetrics;
  onPreset3CheckedIn: () => void;
  onUnlock4th: () => void;
  onSimulateDisconnectReconnect: () => void;
  onReset: () => void;
}

export default function MarketNightJudgeDemo({
  currentUser,
  onSelectUser,
  metrics,
  onPreset3CheckedIn,
  onUnlock4th,
  onSimulateDisconnectReconnect,
  onReset,
}: MarketNightJudgeDemoProps) {
  return (
    <div className="card-elevated p-4 bg-[var(--bg-surface)] border-[var(--brand-border)] space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[var(--brand)]" />
          <span className="font-bold text-[13px] text-[var(--text-primary)] uppercase tracking-wider">
            Judge Demo Suite & Growth Engine
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-brand text-[10px]">Crew Pass Engine</span>
          <button
            onClick={onReset}
            className="text-[11px] text-[var(--text-muted)] hover:text-white transition-colors"
          >
            Reset Demo
          </button>
        </div>
      </div>

      {/* User Switcher Pill Bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="section-label px-0">Simulated Account Switcher (Multi-Screen Test)</span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">Current: {currentUser.name}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {TEST_USERS.map((u) => {
            const isSelected = u.id === currentUser.id;
            return (
              <button
                key={u.id}
                onClick={() => onSelectUser(u)}
                className={`p-2 rounded-lg border text-left transition-all text-[11px] ${
                  isSelected
                    ? 'bg-[var(--brand-dim)] border-[var(--brand)] text-[var(--brand)] font-bold'
                    : 'bg-[var(--bg-elevated)] border-[var(--border)] hover:bg-[var(--bg-interactive)] text-[var(--text-secondary)]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>{u.avatar}</span>
                  <span className="truncate">{u.name.split(' ')[0]}</span>
                </div>
                <p className="text-[9px] opacity-70 mt-0.5 truncate font-mono">
                  {u.id === 'usr-01' ? '★ Captain' : u.id === 'usr-04' ? '⚡ 4th Slot' : u.role}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4-Step Guided Judge Demonstration */}
      <div>
        <span className="section-label px-0 mb-1.5 block">One-Click Demonstration Steps</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={onPreset3CheckedIn}
            className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--brand)] text-left transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[12px] text-[var(--text-primary)]">1. Stage: 3 Checked In</span>
              <span className="badge badge-yellow text-[9px]">3/4 READY</span>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1 leading-snug">
              Sets up Priya, Rohan & Aarav checked in. Simran waiting.
            </p>
          </button>

          <button
            onClick={onUnlock4th}
            className="p-2.5 rounded-lg bg-[var(--brand-dim)] border border-[var(--brand)] text-left transition-colors hover:bg-[rgba(245,158,11,0.2)]"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[12px] text-[var(--brand)]">2. 4th Check-in (Unlock!)</span>
              <span className="badge badge-brand text-[9px]">BOOM!</span>
            </div>
            <p className="text-[10px] text-[var(--text-primary)] mt-1 leading-snug">
              Simran taps “I’m here” ➔ Atomic 4/4 grant & celebration!
            </p>
          </button>

          <button
            onClick={onSimulateDisconnectReconnect}
            className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--green)] text-left transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[12px] text-[var(--text-primary)]">3. Disconnect & Reconnect</span>
              <span className="badge badge-green text-[9px]">RESILIENT</span>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1 leading-snug">
              Verifies zero penalty: Crew Pass stays unlocked.
            </p>
          </button>
        </div>
      </div>

      {/* Growth Engine Metrics Bar */}
      <div className="p-3.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5 text-[var(--brand)]" />
            <span>Organic Growth & Viral Loop Metrics</span>
          </div>
          <span className="text-[10px] text-[var(--green)] font-mono font-bold">
            91.4% Net Referral Lift
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px]">
          <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <span className="stat-label">Invite ➔ Attend</span>
            <p className="font-mono font-bold text-[var(--green)] text-[14px]">
              {metrics.inviteToAttendanceRate}%
            </p>
            <p className="text-[9px] text-[var(--text-muted)]">Attendance conversion</p>
          </div>

          <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <span className="stat-label">Team Completion</span>
            <p className="font-mono font-bold text-[var(--brand)] text-[14px]">
              {metrics.teamCompletionRate}%
            </p>
            <p className="text-[9px] text-[var(--text-muted)]">Reached 4/4 check-in</p>
          </div>

          <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <span className="stat-label">Benefit Usage</span>
            <p className="font-mono font-bold text-[var(--green)] text-[14px]">
              {metrics.benefitUsageRate}%
            </p>
            <p className="text-[9px] text-[var(--text-muted)]">Scenario + Report</p>
          </div>

          <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <span className="stat-label">Next-Week RSVP</span>
            <p className="font-mono font-bold text-[var(--brand)] text-[14px]">
              {metrics.repeatAttendanceRsvpRate}%
            </p>
            <p className="text-[9px] text-[var(--text-muted)]">Repeat attendance</p>
          </div>

          <div className="p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] col-span-2 sm:col-span-1">
            <span className="stat-label">Cost / Returning Trader</span>
            <p className="font-mono font-bold text-[var(--green)] text-[14px]">
              ${metrics.costPerReturningTrader.toFixed(2)}
            </p>
            <p className="text-[9px] text-[var(--text-muted)]">vs. $28.00 traditional CAC</p>
          </div>
        </div>

        <p className="text-[10px] text-[var(--text-muted)] pt-1 italic text-center sm:text-left">
          Strategic Premise: “Give people a useful reason to bring friends, then give the group an experience worth returning for.”
        </p>
      </div>
    </div>
  );
}
