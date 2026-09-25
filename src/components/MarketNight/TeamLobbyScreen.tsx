'use client';

import { useState } from 'react';
import {
  Users, Copy, QrCode, Check, CheckCircle2, Clock, Lock, Unlock,
  X, ArrowRight, UserPlus, Share2, Edit3, LogOut, AlertCircle
} from 'lucide-react';
import { CrewTeam, MarketNightUser } from '../../types/marketNight';

interface TeamLobbyScreenProps {
  team: CrewTeam;
  currentUser: MarketNightUser;
  onCheckIn: (code: string) => void;
  onEnterWorkspace: () => void;
  onRenameCrew?: (name: string) => void;
  onLeaveCrew?: () => void;
}

export default function TeamLobbyScreen({
  team, currentUser, onCheckIn, onEnterWorkspace, onRenameCrew, onLeaveCrew,
}: TeamLobbyScreenProps) {
  const [checkInCode, setCheckInCode] = useState('');
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [renameInput, setRenameInput] = useState(team.name);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const slots = Array.from({ length: 4 }, (_, i) => team.members[i] ?? null);
  const checkedInCount = team.members.filter(m => m.checkedIn).length;
  const myMember = team.members.find(m => m.userId === currentUser.id);
  const isUserCheckedIn = myMember?.checkedIn ?? false;
  const isCaptain = team.captainId === currentUser.id;

  const inviteText = `Join my crew for Mocha Market Night.\nFriday, 8:30 PM IST. Complete our four-person crew and check in to unlock the session benefits. No trading required.\n\nCrew code: ${team.code}`;

  function handleCopy() {
    navigator.clipboard.writeText(inviteText).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCheckIn() {
    if (!checkInCode.trim()) {
      setCheckInError('Please enter the event code displayed by your host.');
      return;
    }
    setCheckInError(null);
    // Pass code up — parent calls engine
    onCheckIn(checkInCode.trim());
    setCheckInSuccess(true);
    setCheckInCode('');
  }

  function handleRename() {
    if (renameInput.trim()) {
      onRenameCrew?.(renameInput.trim());
    }
    setShowRename(false);
  }

  return (
    <div className="space-y-5">
      {/* ── Crew header ── */}
      <div className="card p-5 bg-[var(--bg-elevated)] border-[var(--border)] space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Users className="w-4 h-4 text-[var(--brand)]" />
              <h2 className="font-bold text-[16px] text-[var(--text-primary)]">Your crew: {team.name}</h2>
              {isCaptain && (
                <button onClick={() => setShowRename(true)} className="text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-[12px] text-[var(--text-secondary)]">
              {team.members.length < 4
                ? `${team.members.length} of 4 places filled · Invite ${4 - team.members.length} more ${4 - team.members.length === 1 ? 'person' : 'people'} to complete your crew.`
                : 'Crew is full · 4 of 4 places filled.'
              }
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono font-bold text-[var(--brand)] text-[13px]">{team.code}</p>
            <p className="text-[10px] text-[var(--text-muted)]">Invite code</p>
          </div>
        </div>

        {/* Dual progress bars */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-[var(--text-muted)] uppercase tracking-wider font-semibold">Crew formation</span>
              <span className="font-mono font-bold text-[var(--text-primary)]">{team.members.length}/4</span>
            </div>
            <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--brand)] rounded-full transition-all" style={{ width: `${(team.members.length / 4) * 100}%` }} />
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">Joined the crew</p>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-[var(--text-muted)] uppercase tracking-wider font-semibold">Event attendance</span>
              <span className="font-mono font-bold text-[checkedInCount >= 4 ? 'text-[var(--green)]' : 'text-[var(--text-primary)]']">{checkedInCount}/4</span>
            </div>
            <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${checkedInCount >= 4 ? 'bg-[var(--green)]' : 'bg-amber-400'}`} style={{ width: `${(checkedInCount / 4) * 100}%` }} />
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">Checked in · Joining ≠ attending</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Member cards ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {slots.map((member, slotIdx) => (
              <div
                key={slotIdx}
                className={`card p-4 transition-all ${
                  member
                    ? member.checkedIn
                      ? 'bg-[var(--green-dim)] border-[var(--green-border)]'
                      : 'bg-[var(--bg-elevated)] border-[var(--border)]'
                    : 'bg-[var(--bg-surface)] border-dashed border-[var(--border-subtle)]'
                }`}
              >
                {member ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{member.avatar}</span>
                      {member.checkedIn ? (
                        <span className="badge badge-green flex items-center gap-1 text-[9px]">
                          <CheckCircle2 className="w-3 h-3" />
                          Checked in
                        </span>
                      ) : (
                        <span className="badge badge-yellow flex items-center gap-1 text-[9px]">
                          <Clock className="w-3 h-3" />
                          Joined
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-[13px] text-[var(--text-primary)] flex items-center gap-1.5">
                        {member.name}
                        {member.isCaptain && <span className="text-[9px] text-[var(--brand)] font-bold">★ Host</span>}
                        {member.userId === currentUser.id && <span className="text-[9px] text-[var(--text-muted)]">(you)</span>}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] font-mono">{member.handle}</p>
                    </div>
                    <div className="pt-2 border-t border-[var(--border-subtle)] text-[10px] flex items-center justify-between">
                      <span className="text-[var(--text-muted)]">Status</span>
                      <span className={`font-semibold ${member.checkedIn ? 'text-[var(--green)]' : 'text-[var(--yellow)]'}`}>
                        {member.checkedIn
                          ? `Checked in · ${member.checkedInAt ? new Date(member.checkedInAt).toLocaleTimeString('en-IN', { timeStyle: 'short' }) : ''}`
                          : 'Joined · Check-in opens at 8:15 PM'
                        }
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-2">
                    <div className="w-9 h-9 rounded-full bg-[var(--bg-interactive)] border-2 border-dashed border-[var(--border)] flex items-center justify-center mx-auto">
                      <UserPlus className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>
                    <p className="text-[12px] font-medium text-[var(--text-secondary)]">Invite a friend</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Share code to fill slot {slotIdx + 1}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Crew actions */}
          <div className="flex flex-wrap gap-2">
            <button onClick={handleCopy} className="btn btn-ghost btn-sm flex-1">
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy invite link'}</span>
            </button>
            <button onClick={() => { navigator.share?.({ text: inviteText }).catch(() => {}); }} className="btn btn-ghost btn-sm flex-1">
              <Share2 className="w-3.5 h-3.5" />
              <span>Share invitation</span>
            </button>
            <button onClick={() => setShowQr(true)} className="btn btn-ghost btn-sm flex-1">
              <QrCode className="w-3.5 h-3.5" />
              <span>QR code</span>
            </button>
            {!isCaptain && (
              <button onClick={() => setShowLeaveConfirm(true)} className="btn btn-ghost btn-sm text-red-400 hover:text-red-300">
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave crew</span>
              </button>
            )}
          </div>

          {/* Invitation preview */}
          <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg text-[11px] text-[var(--text-secondary)] leading-relaxed italic">
            "{inviteText}"
          </div>
        </div>

        {/* ── RIGHT: Check-in + benefits ── */}
        <div className="space-y-4">
          {/* Check-in card */}
          {!team.isQualified && (
            <div className="card p-4 bg-[var(--bg-elevated)] border-[var(--border)] space-y-3">
              <div className="flex items-center gap-2">
                {isUserCheckedIn
                  ? <CheckCircle2 className="w-4 h-4 text-[var(--green)]" />
                  : <Clock className="w-4 h-4 text-[var(--brand)]" />
                }
                <h3 className="font-bold text-[13px] text-[var(--text-primary)]">
                  {isUserCheckedIn ? 'You\'re checked in!' : 'Your crew is ready. Check in to activate tonight\'s pass.'}
                </h3>
              </div>

              {!isUserCheckedIn ? (
                <>
                  <div className="p-2.5 bg-[var(--bg-surface)] rounded border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)]">
                    <p className="font-semibold text-[var(--text-primary)] mb-0.5">Event: {team.name}</p>
                    <p>Check-in open: 8:15 PM IST</p>
                    <p>Check-in closes: 9:15 PM IST</p>
                  </div>
                  <div>
                    <label className="stat-label block mb-1.5">Enter event code</label>
                    <input
                      type="text"
                      value={checkInCode}
                      onChange={e => { setCheckInCode(e.target.value.toUpperCase()); setCheckInError(null); }}
                      placeholder="e.g. MOCHA9"
                      className="input-field font-mono uppercase tracking-widest text-center text-[14px]"
                      maxLength={8}
                    />
                    {checkInError && (
                      <p className="text-[11px] text-[var(--red)] flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {checkInError}
                      </p>
                    )}
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Use the code displayed by your session host.</p>
                  </div>
                  <button onClick={handleCheckIn} className="btn btn-brand btn-full py-2.5 font-bold">
                    <Check className="w-4 h-4" />
                    <span>Check in</span>
                  </button>
                </>
              ) : (
                <div className="p-3 bg-[var(--green-dim)] border border-[var(--green-border)] rounded-lg text-center space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-[var(--green)] mx-auto" />
                  <p className="text-[12px] font-bold text-[var(--green)]">Checked in · {new Date().toLocaleTimeString('en-IN', { timeStyle: 'short' })}</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {4 - checkedInCount > 0
                      ? `Waiting for ${4 - checkedInCount} more crew member${4 - checkedInCount !== 1 ? 's' : ''} to check in.`
                      : 'All crew members checked in!'
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Completion banner */}
          {team.isQualified && (
            <div className="card p-4 bg-[var(--green-dim)] border-[var(--green-border)] space-y-3 text-center">
              <CheckCircle2 className="w-8 h-8 text-[var(--green)] mx-auto" />
              <h3 className="font-bold text-[14px] text-[var(--text-primary)]">
                Crew complete. Your Market Night benefits are unlocked.
              </h3>
              <button onClick={onEnterWorkspace} className="btn btn-brand btn-full py-2.5 font-bold">
                <span>Enter the workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Benefits status */}
          <div className="card p-4 bg-[var(--bg-surface)] border-[var(--border)] space-y-3">
            <div className="flex items-center gap-2">
              {team.isQualified ? <Unlock className="w-4 h-4 text-[var(--green)]" /> : <Lock className="w-4 h-4 text-[var(--text-muted)]" />}
              <h3 className="font-bold text-[12px] uppercase tracking-wider text-[var(--text-primary)]">
                {team.isQualified ? 'Benefits unlocked' : 'Benefits unlock on 4th check-in'}
              </h3>
            </div>
            {[
              { label: 'Crew workshop access', desc: 'Interactive scenario workspace' },
              { label: 'Session toolkit',      desc: 'Scenario notes, cost checklist, decision journal' },
              { label: 'Replay access',        desc: 'Session recording (available after event)' },
            ].map(b => (
              <div key={b.label} className={`flex items-start gap-2 text-[11px] ${team.isQualified ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${team.isQualified ? 'text-[var(--green)]' : 'text-[var(--border-accent)]'}`} />
                <div>
                  <p className="font-semibold">{b.label}</p>
                  <p className="text-[10px] opacity-70">{b.desc}</p>
                </div>
              </div>
            ))}
            <p className="text-[10px] text-[var(--text-muted)]">
              Free to attend. Four checked-in crew members unlock the event benefits. No deposit or trade required.
            </p>
          </div>
        </div>
      </div>

      {/* QR modal */}
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm fade-in">
          <div className="relative w-full max-w-sm card-elevated p-6 bg-[var(--bg-surface)] border-[var(--border)] text-center space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[15px] text-[var(--text-primary)]">Invite via QR Code</h3>
              <button onClick={() => setShowQr(false)}><X className="w-4 h-4 text-[var(--text-muted)]" /></button>
            </div>
            <div className="p-4 bg-white rounded-xl inline-block mx-auto">
              <div className="w-40 h-40 bg-zinc-900 flex flex-col items-center justify-center text-white rounded-lg p-3 text-center">
                <QrCode className="w-16 h-16 text-amber-400 mb-2" />
                <p className="font-mono text-[12px] text-zinc-300 font-bold">{team.code}</p>
                <p className="text-[9px] text-zinc-500">Scan to join crew</p>
              </div>
            </div>
            <p className="text-[12px] text-[var(--text-secondary)]">
              Share code <strong className="text-[var(--brand)] font-mono">{team.code}</strong> or scan this QR.
            </p>
            <button onClick={() => setShowQr(false)} className="btn btn-brand btn-full">Done</button>
          </div>
        </div>
      )}

      {/* Rename modal */}
      {showRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm fade-in">
          <div className="relative w-full max-w-sm card-elevated p-6 bg-[var(--bg-surface)] border-[var(--border)] space-y-4">
            <h3 className="font-bold text-[15px] text-[var(--text-primary)]">Rename crew</h3>
            <input
              type="text"
              value={renameInput}
              onChange={e => setRenameInput(e.target.value)}
              className="input-field"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={handleRename} className="btn btn-brand flex-1">Save</button>
              <button onClick={() => setShowRename(false)} className="btn btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Leave confirm */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm fade-in">
          <div className="relative w-full max-w-sm card-elevated p-6 bg-[var(--bg-surface)] border-[var(--border)] space-y-4">
            <h3 className="font-bold text-[15px] text-[var(--text-primary)]">Leave crew?</h3>
            <p className="text-[12px] text-[var(--text-secondary)]">
              {team.isQualified
                ? 'Benefits are already unlocked. Leaving does not create another claim opportunity.'
                : 'You will lose your spot in this crew. You can join a different one using another invite code.'
              }
            </p>
            <div className="flex gap-2">
              <button onClick={() => { onLeaveCrew?.(); setShowLeaveConfirm(false); }} className="btn flex-1 py-2 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors">
                Leave crew
              </button>
              <button onClick={() => setShowLeaveConfirm(false)} className="btn btn-ghost flex-1">Stay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
