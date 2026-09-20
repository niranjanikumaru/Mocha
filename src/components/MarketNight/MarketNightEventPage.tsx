'use client';

import { useState } from 'react';
import { MarketNightEvent, BenefitBundle, MarketNightUser } from '../../types/marketNight';
import {
  Users, Sparkles, FileText, HelpCircle, Shield, Clock, ArrowRight,
  UserPlus, Compass, CheckCircle2, AlertCircle, Info, Zap
} from 'lucide-react';

interface MarketNightEventPageProps {
  event: MarketNightEvent;
  currentUser: MarketNightUser;
  onCreateTeam: (name: string) => void;
  onJoinTeam: (code: string) => void;
  onSoloMatch: () => void;
  hasActiveTeam: boolean;
  onGoToLobby: () => void;
}

export default function MarketNightEventPage({
  event,
  currentUser,
  onCreateTeam,
  onJoinTeam,
  onSoloMatch,
  hasActiveTeam,
  onGoToLobby,
}: MarketNightEventPageProps) {
  const [teamNameInput, setTeamNameInput] = useState('');
  const [teamCodeInput, setTeamCodeInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Time formatting
  const eventTimeStr = new Date(event.scheduledTime).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZoneName: 'short'
  });

  return (
    <div className="space-y-6 fade-in">
      {/* Hero Offer Banner */}
      <div className="card-elevated p-6 sm:p-8 bg-gradient-to-br from-[var(--bg-surface)] via-[var(--bg-elevated)] to-[var(--bg-interactive)] border-[var(--border)] relative overflow-hidden">
        {/* Glow pill */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--brand)] opacity-10 blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-brand flex items-center gap-1.5 py-1 px-2.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Mocha Market Night</span>
            </span>
            <span className="badge badge-green flex items-center gap-1.5 py-1 px-2.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Check-in Window Open</span>
            </span>
            <span className="text-[11px] text-[var(--text-secondary)] font-mono">
              Starts tonight @ {eventTimeStr}
            </span>
          </div>

          <h1 className="text-[26px] sm:text-[34px] font-extrabold text-[var(--text-primary)] tracking-tight leading-tight">
            Bring your four. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand)] to-amber-200">
              Unlock tonight’s Crew Pass.
            </span>
          </h1>

          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed max-w-2xl">
            Gather three fellow traders for tonight’s simulated earnings turbulence. Every qualifying team of four unlocks the same free benefit bundle — <strong>no deposits, no live trading, and no winner requirements</strong>.
          </p>

          {/* CTAs */}
          <div className="pt-3 flex flex-wrap items-center gap-3">
            {hasActiveTeam ? (
              <button
                onClick={onGoToLobby}
                className="btn btn-brand py-3 px-6 text-[14px] font-bold"
              >
                <span>View Your Team Lobby</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-brand py-3 px-6 text-[14px] font-bold"
                >
                  <Users className="w-4 h-4" />
                  <span>Create a Crew</span>
                </button>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="btn btn-ghost py-3 px-5 text-[14px]"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Join with Code</span>
                </button>
                <button
                  onClick={onSoloMatch}
                  className="btn btn-ghost py-3 px-5 text-[14px] text-[var(--brand)] border-[var(--brand-border)]"
                >
                  <Compass className="w-4 h-4" />
                  <span>Solo? Find Teammates</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3 Free Benefits Showcase */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-[16px] font-bold text-[var(--text-primary)]">The Crew Pass Benefits</h2>
            <p className="text-[12px] text-[var(--text-secondary)]">Unlocked automatically when all four members check in during the event window</p>
          </div>
          <span className="badge badge-brand text-[10px]">100% Free Bundle</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Benefit 1 */}
          <div className="card-elevated p-5 space-y-3 bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--brand-border)] transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[var(--brand-dim)] text-[var(--brand)] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[14px] text-[var(--text-primary)]">1. Exclusive Market Scenario</h3>
              <p className="text-[12px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                An additional interactive volatility challenge revealed live tonight: Navigate sudden aftermarket swings with asymmetric options pricing.
              </p>
            </div>
            <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--brand)] font-medium">
              ★ Makes completing the team immediately rewarding
            </div>
          </div>

          {/* Benefit 2 */}
          <div className="card-elevated p-5 space-y-3 bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--brand-border)] transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[var(--green-dim)] text-[var(--green)] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[14px] text-[var(--text-primary)]">2. Team Analysis Report</h3>
              <p className="text-[12px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                A downloadable, printable comparison matrix analyzing initial risk stances, group consensus scores, and revised reasoning.
              </p>
            </div>
            <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--green)] font-medium">
              ★ Creates something structured to keep and share
            </div>
          </div>

          {/* Benefit 3 */}
          <div className="card-elevated p-5 space-y-3 bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--brand-border)] transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[var(--yellow-dim)] text-[var(--yellow)] flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[14px] text-[var(--text-primary)]">3. Guest Question Submission</h3>
              <p className="text-[12px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                Submit one curated team question for our fortnightly Wall Street guest session. Selected questions are answered live on stream.
              </p>
            </div>
            <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--yellow)] font-medium">
              ★ Direct access to the fortnightly expert programme
            </div>
          </div>
        </div>
      </div>

      {/* Qualification Rules Card */}
      <div className="card p-5 bg-[var(--bg-elevated)] border-[var(--border)] space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[var(--brand)]" />
          <h3 className="font-bold text-[13px] text-[var(--text-primary)] uppercase tracking-wider">
            Precise Qualification Criteria
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--green)] shrink-0 mt-0.5" />
            <p className="text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">4 distinct signed-in accounts:</strong> Must check in during the event window. Reserving a slot does not count as attendance.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--green)] shrink-0 mt-0.5" />
            <p className="text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">1 team per account:</strong> A participant can qualify with only one crew per Friday event.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--green)] shrink-0 mt-0.5" />
            <p className="text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">Disconnection resilience:</strong> Once qualified, the team keeps its benefits even if someone briefly disconnects.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--green)] shrink-0 mt-0.5" />
            <p className="text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">Inclusive access:</strong> Teams with fewer than 4 members still access the main event. Completed crews receive additional perks.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] flex items-center justify-between">
          <span>* Unused rewards do not convert to cash, margin or trading credit. Non-financial educational prototype.</span>
          <span>Window closes: 45m after start</span>
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm fade-in">
          <div className="relative w-full max-w-md card-elevated p-6 bg-[var(--bg-surface)] border-[var(--border)] space-y-4">
            <h3 className="font-bold text-[16px] text-[var(--text-primary)]">Name Your Crew</h3>
            <p className="text-[12px] text-[var(--text-secondary)]">
              As Captain, you’ll receive an invite code and shareable link to fill the remaining 3 participant slots.
            </p>
            <div>
              <label className="stat-label block mb-1">Crew Name</label>
              <input
                type="text"
                value={teamNameInput}
                onChange={(e) => setTeamNameInput(e.target.value)}
                placeholder="e.g. Delta Force Syndicate"
                className="input-field"
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  onCreateTeam(teamNameInput.trim() || `${currentUser.name}’s Crew`);
                  setShowCreateModal(false);
                }}
                className="btn btn-brand flex-1"
              >
                Create Crew (4 Slots)
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Team Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm fade-in">
          <div className="relative w-full max-w-md card-elevated p-6 bg-[var(--bg-surface)] border-[var(--border)] space-y-4">
            <h3 className="font-bold text-[16px] text-[var(--text-primary)]">Enter Crew Invite Code</h3>
            <p className="text-[12px] text-[var(--text-secondary)]">
              Ask your captain for their 4-digit code (e.g. CREW-4821).
            </p>
            <div>
              <label className="stat-label block mb-1">Invite Code</label>
              <input
                type="text"
                value={teamCodeInput}
                onChange={(e) => {
                  setTeamCodeInput(e.target.value);
                  setJoinError(null);
                }}
                placeholder="CREW-4821"
                className="input-field uppercase font-mono"
                autoFocus
              />
              {joinError && (
                <p className="text-[11px] text-[var(--red)] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {joinError}
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  if (!teamCodeInput.trim()) {
                    setJoinError('Please enter a valid code');
                    return;
                  }
                  onJoinTeam(teamCodeInput.trim());
                  setShowJoinModal(false);
                }}
                className="btn btn-brand flex-1"
              >
                Join Crew
              </button>
              <button
                onClick={() => setShowJoinModal(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
