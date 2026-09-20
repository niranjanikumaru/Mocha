'use client';

import { useState } from 'react';
import { CrewTeam, MarketNightUser } from '../../types/marketNight';
import {
  Users, Copy, Check, QrCode, Shield, CheckCircle2,
  Clock, Lock, Unlock, ArrowRight, AlertTriangle, Sparkles, X
} from 'lucide-react';

interface TeamLobbyScreenProps {
  team: CrewTeam;
  currentUser: MarketNightUser;
  onCheckIn: () => void;
  onEnterWorkspace: () => void;
}

export default function TeamLobbyScreen({
  team,
  currentUser,
  onCheckIn,
  onEnterWorkspace,
}: TeamLobbyScreenProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Counts
  const joinedCount = team.members.length;
  const checkedInCount = team.members.filter((m) => m.checkedIn).length;
  const isFourthNeeded = checkedInCount < 4;
  const currentUserMember = team.members.find((m) => m.userId === currentUser.id);
  const isUserCheckedIn = !!currentUserMember?.checkedIn;

  function copyInviteLink() {
    const link = `https://mochatrade.com/market-night?code=${team.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Team Status Banner */}
      <div className="card-elevated p-6 bg-[var(--bg-surface)] border-[var(--border)] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-brand font-mono font-bold text-[11px]">
                {team.code}
              </span>
              {team.isQualified ? (
                <span className="badge badge-green flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Crew Pass Qualified</span>
                </span>
              ) : (
                <span className="badge badge-yellow flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Awaiting 4th Check-in</span>
                </span>
              )}
            </div>
            <h1 className="text-[22px] font-extrabold text-[var(--text-primary)]">
              {team.name}
            </h1>
            <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
              Captain: {team.members.find((m) => m.isCaptain)?.name || 'Priya Sharma'} · 4-Trader Syndicate
            </p>
          </div>

          {/* Share / Invite pill */}
          <div className="flex items-center gap-2">
            <button
              onClick={copyInviteLink}
              className="btn btn-ghost btn-sm"
              title="Copy link for friends"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[var(--green)]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied!' : 'Copy Invite Link'}</span>
            </button>
            <button
              onClick={() => setShowQr(true)}
              className="btn btn-ghost btn-sm"
              title="Show QR Code"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Code</span>
            </button>
          </div>
        </div>

        {/* Separated Joined vs Checked In Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[var(--border)] text-center">
          <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="stat-label">Roster Joined</span>
            <p className="text-[18px] font-mono font-bold text-[var(--text-primary)] mt-0.5">
              {joinedCount}/4
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">Slots filled</p>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="stat-label">Checked In Attendance</span>
            <p className={`text-[18px] font-mono font-bold mt-0.5 ${checkedInCount === 4 ? 'text-[var(--green)]' : 'text-[var(--brand)]'}`}>
              {checkedInCount}/4
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">Live in lobby</p>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="stat-label">Crew Pass Status</span>
            <p className={`text-[15px] font-bold mt-1 ${team.isQualified ? 'text-[var(--green)]' : 'text-[var(--yellow)]'}`}>
              {team.isQualified ? 'UNLOCKED' : 'LOCKED'}
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">Requires 4/4 check-in</p>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="stat-label">Disconnection Resilient</span>
            <p className="text-[15px] font-bold text-[var(--text-primary)] mt-1">
              {team.disconnectionResilient ? 'ACTIVE' : 'READY'}
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">Benefits persist</p>
          </div>
        </div>
      </div>

      {/* Roster Callout */}
      {isFourthNeeded && (
        <div className="p-3.5 bg-[var(--brand-dim)] border border-[var(--brand-border)] rounded-xl flex items-center justify-between gap-3 text-[12px]">
          <div className="flex items-center gap-2.5 text-[var(--brand)] font-medium">
            <Clock className="w-4 h-4 shrink-0" />
            <span>
              <strong>{checkedInCount}/4 checked in</strong> — Invite your fourth teammate or tap “I’m here” to unlock tonight’s Crew Pass!
            </span>
          </div>
          <span className="badge badge-brand text-[10px] font-mono shrink-0">
            {4 - checkedInCount} MORE NEEDED
          </span>
        </div>
      )}

      {/* 4 Participant Avatar Slots */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-[15px] font-bold text-[var(--text-primary)]">Crew Roster (4 Slots)</h2>
          <span className="text-[11px] text-[var(--text-muted)]">Privacy-first · Public handles only</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((slotIdx) => {
            const member = team.members[slotIdx];
            const isFilled = !!member;

            return (
              <div
                key={slotIdx}
                className={`card p-4 transition-all ${
                  isFilled
                    ? member.checkedIn
                      ? 'bg-[var(--bg-surface)] border-[var(--green-border)] shadow-sm'
                      : 'bg-[var(--bg-elevated)] border-[var(--brand-border)]'
                    : 'bg-[var(--bg-interactive)] border-dashed border-[var(--border)] opacity-60'
                }`}
              >
                {isFilled ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{member.avatar}</span>
                      {member.checkedIn ? (
                        <span className="badge badge-green text-[9px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>CHECKED IN</span>
                        </span>
                      ) : (
                        <span className="badge badge-yellow text-[9px] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>JOINED (WAITING)</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="font-bold text-[13px] text-[var(--text-primary)] flex items-center gap-1.5">
                        <span>{member.name}</span>
                        {member.isCaptain && (
                          <span className="text-[10px] text-[var(--brand)] font-bold">★ Captain</span>
                        )}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono">{member.handle}</p>
                    </div>

                    <div className="pt-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-secondary)] font-mono flex items-center justify-between">
                      <span>Status:</span>
                      <strong className={member.checkedIn ? 'text-[var(--green)]' : 'text-[var(--yellow)]'}>
                        {member.checkedIn ? 'Present' : 'Not checked in yet'}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-2">
                    <div className="w-9 h-9 rounded-full bg-[var(--bg-interactive)] text-[var(--text-muted)] flex items-center justify-center mx-auto text-sm font-mono">
                      #{slotIdx + 1}
                    </div>
                    <p className="text-[12px] font-medium text-[var(--text-secondary)]">Slot Available</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Share code to invite</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Check In Action Bar */}
      <div className="card p-5 bg-[var(--bg-elevated)] border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5 text-center sm:text-left">
          <h3 className="font-bold text-[14px] text-[var(--text-primary)]">
            Your Attendance Verification
          </h3>
          <p className="text-[12px] text-[var(--text-secondary)]">
            Signed in as <strong className="text-[var(--text-primary)]">{currentUser.name}</strong> ({currentUser.handle}).
            Tapping “I’m here” registers your presence atomically.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onCheckIn}
            disabled={isUserCheckedIn}
            className={`btn py-2.5 px-6 text-[13px] font-bold flex-1 sm:flex-initial ${
              isUserCheckedIn ? 'btn-green' : 'btn-brand'
            }`}
          >
            {isUserCheckedIn ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>You’re Checked In!</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>I’m Here (Check In)</span>
              </>
            )}
          </button>

          {team.isQualified && (
            <button
              onClick={onEnterWorkspace}
              className="btn btn-brand py-2.5 px-6 text-[13px] font-bold flex-1 sm:flex-initial"
            >
              <span>Enter Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Benefits Status Card */}
      <div className="card p-5 bg-[var(--bg-surface)] border-[var(--border)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {team.isQualified ? (
              <Unlock className="w-4 h-4 text-[var(--green)]" />
            ) : (
              <Lock className="w-4 h-4 text-[var(--text-muted)]" />
            )}
            <h3 className="font-bold text-[13px] text-[var(--text-primary)] uppercase tracking-wider">
              {team.isQualified ? 'Tonight’s Crew Pass Entitlements (Activated)' : 'Locked Crew Pass Perks (Awaiting 4th Member)'}
            </h3>
          </div>
          <span className={`badge ${team.isQualified ? 'badge-green' : 'badge-muted'}`}>
            {team.isQualified ? 'ALL UNLOCKED' : '3/4 COMPLETE'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
          <div className={`p-3 rounded-lg border ${team.isQualified ? 'bg-[var(--green-dim)] border-[var(--green-border)]' : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)]'}`}>
            <p className="font-bold text-[var(--text-primary)] mb-0.5">Exclusive Scenario</p>
            <p className="text-[11px] text-[var(--text-secondary)]">NVDA Q3 Shock & Geopolitical Freeze</p>
            <p className="text-[10px] text-[var(--brand)] mt-1.5 font-semibold">
              {team.isQualified ? '✓ Ready to launch' : '🔒 Locked until 4th check-in'}
            </p>
          </div>

          <div className={`p-3 rounded-lg border ${team.isQualified ? 'bg-[var(--green-dim)] border-[var(--green-border)]' : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)]'}`}>
            <p className="font-bold text-[var(--text-primary)] mb-0.5">Team Analysis Report</p>
            <p className="text-[11px] text-[var(--text-secondary)]">Downloadable decision & risk matrix</p>
            <p className="text-[10px] text-[var(--green)] mt-1.5 font-semibold">
              {team.isQualified ? '✓ Unlocked (Generated post-event)' : '🔒 Locked'}
            </p>
          </div>

          <div className={`p-3 rounded-lg border ${team.isQualified ? 'bg-[var(--green-dim)] border-[var(--green-border)]' : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)]'}`}>
            <p className="font-bold text-[var(--text-primary)] mb-0.5">Fortnightly Guest Q&A</p>
            <p className="text-[11px] text-[var(--text-secondary)]">1 question submission for live session</p>
            <p className="text-[10px] text-[var(--yellow)] mt-1.5 font-semibold">
              {team.isQualified ? '✓ Ready for team submission' : '🔒 Locked'}
            </p>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm fade-in">
          <div className="relative w-full max-w-sm card-elevated p-6 bg-[var(--bg-surface)] border-[var(--border)] text-center space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[15px] text-[var(--text-primary)]">Invite via QR Code</h3>
              <button onClick={() => setShowQr(false)} className="text-[var(--text-muted)] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Visual SVG QR representation */}
            <div className="p-4 bg-white rounded-xl inline-block mx-auto shadow-md">
              <div className="w-40 h-40 bg-zinc-900 flex flex-col items-center justify-center text-white rounded-lg p-3 text-center">
                <QrCode className="w-16 h-16 text-amber-400 mb-2" />
                <p className="font-mono text-[12px] text-zinc-300 font-bold">{team.code}</p>
                <p className="text-[9px] text-zinc-500">Scan to join crew</p>
              </div>
            </div>
            <p className="text-[12px] text-[var(--text-secondary)]">
              Scan with your camera or share code <strong className="text-[var(--brand)] font-mono">{team.code}</strong>.
            </p>
            <button onClick={() => setShowQr(false)} className="btn btn-brand btn-full">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
