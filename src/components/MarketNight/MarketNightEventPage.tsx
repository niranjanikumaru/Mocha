'use client';

import { useState, useEffect } from 'react';
import {
  Calendar, Clock, Users, ChevronRight, CheckCircle2, Shield,
  Play, Star, Zap, HelpCircle, FileText, BookOpen, AlertCircle, ArrowRight
} from 'lucide-react';
import { MarketNightEvent, MarketNightUser, EventStatus } from '../../types/marketNight';
import SpotlightCard from '../ui/spotlight-card';

interface MarketNightEventPageProps {
  event: MarketNightEvent;
  currentUser: MarketNightUser;
  onCreateTeam: (name: string) => void;
  onJoinTeam: (code: string) => void;
  onSoloMatch: () => void;
  hasActiveTeam: boolean;
  onGoToLobby: () => void;
  isReserved?: boolean;
  onReserve?: () => void;
}

const STATUS_CONFIG: Record<EventStatus, { label: string; color: string; badge: string; desc: string }> = {
  UPCOMING:      { label: 'Upcoming',      color: 'text-[var(--text-muted)]',  badge: 'badge-muted',   desc: 'Event has not started yet.' },
  CHECKIN_OPEN:  { label: 'Check-in open', color: 'text-amber-400',             badge: 'badge-brand',   desc: 'Check-in window is now open.' },
  LIVE_SCENARIO: { label: 'Live now',      color: 'text-[var(--green)]',        badge: 'badge-green',   desc: 'The session scenario is running.' },
  DEBRIEF:       { label: 'Debrief',       color: 'text-[var(--brand)]',        badge: 'badge-brand',   desc: 'Teams are in the debrief phase.' },
  COMPLETED:     { label: 'Ended',         color: 'text-[var(--text-muted)]',   badge: 'badge-muted',   desc: 'This event has concluded.' },
};

function Countdown({ target }: { target: number }) {
  const [diff, setDiff] = useState(target - Date.now());
  useEffect(() => {
    const t = setInterval(() => setDiff(target - Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (diff <= 0) return <span className="font-mono text-[var(--green)] font-bold">Starting now</span>;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return (
    <span className="font-mono font-bold text-[var(--brand)]">
      {h > 0 && `${h}h `}{m}m {s}s
    </span>
  );
}

export default function MarketNightEventPage({
  event, currentUser, onCreateTeam, onJoinTeam, onSoloMatch,
  hasActiveTeam, onGoToLobby, isReserved = false, onReserve,
}: MarketNightEventPageProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [teamCodeInput, setTeamCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [localReserved, setLocalReserved] = useState(isReserved);

  const statusCfg = STATUS_CONFIG[event.status];
  const eventDate = new Date(event.scheduledTime);

  function handleReserve() {
    onReserve?.();
    setLocalReserved(true);
  }

  return (
    <div className="space-y-5">
      {/* ── Event banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-gradient-to-br from-[#0f0f1a] via-[var(--bg-elevated)] to-[#0f0f1a] p-6">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row gap-5">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`badge ${statusCfg.badge} text-[10px] uppercase tracking-wider`}>{statusCfg.label}</span>
              <span className="badge badge-muted text-[10px]">Community event</span>
              <span className="badge badge-muted text-[10px]">Proposed demo schedule</span>
            </div>
            <div>
              <h1 className="font-extrabold text-[24px] sm:text-[28px] text-[var(--text-primary)] leading-tight tracking-tight">
                {event.title}
              </h1>
              <p className="text-[var(--brand)] font-bold text-[16px] mt-1">{event.theme}</p>
            </div>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed max-w-xl">
              {event.description}
            </p>
            <div className="flex items-center gap-4 text-[12px] text-[var(--text-secondary)] flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--brand)]" />
                {eventDate.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--brand)]" />
                8:30–9:30 PM IST · Demo schedule
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[var(--brand)]" />
                Host: {event.hostName}
              </span>
            </div>
          </div>

          {/* Right panel: countdown + places */}
          <div className="w-full sm:w-56 shrink-0 space-y-3">
            <div className="p-3.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl space-y-2 text-[12px]">
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                {event.status === 'UPCOMING' ? 'Starts in' : event.status === 'CHECKIN_OPEN' ? 'Check-in open' : 'Event status'}
              </p>
              {event.status === 'UPCOMING' && <Countdown target={event.scheduledTime} />}
              {event.status === 'CHECKIN_OPEN' && (
                <span className="font-mono font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  Check-in open now
                </span>
              )}
              {event.status === 'LIVE_SCENARIO' && (
                <span className="font-mono font-bold text-[var(--green)] flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[var(--green)] rounded-full animate-pulse" />
                  Session running live
                </span>
              )}
              {(event.status === 'DEBRIEF' || event.status === 'COMPLETED') && (
                <span className={`font-mono font-bold ${statusCfg.color}`}>{statusCfg.label}</span>
              )}
              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <p className="text-[10px] text-[var(--text-muted)]">Reservations</p>
                <p className="font-mono font-bold text-[var(--text-primary)]">{event.reservationCount} places reserved</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Demo participants only</p>
              </div>
            </div>

            {/* CTA */}
            {!hasActiveTeam ? (
              <div className="space-y-2">
                {!localReserved ? (
                  <button onClick={handleReserve} className="btn btn-brand btn-full py-2.5 font-bold text-[13px]">
                    <Zap className="w-4 h-4" />
                    Reserve my place
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button onClick={() => setShowCreateModal(true)} className="btn btn-brand btn-full py-2.5 font-bold text-[13px]">
                      <Users className="w-4 h-4" />
                      Open my crew
                    </button>
                    <button onClick={() => setShowJoinModal(true)} className="btn btn-ghost btn-full py-2 text-[12px]">
                      Join a crew
                    </button>
                    <button onClick={onSoloMatch} className="btn btn-ghost btn-full py-2 text-[12px]">
                      Solo matchmaking
                    </button>
                  </div>
                )}
                {!localReserved && (
                  <button onClick={() => setShowHowItWorks(!showHowItWorks)} className="btn btn-ghost btn-full py-2 text-[12px]">
                    See how it works
                  </button>
                )}
                <p className="text-[10px] text-center text-[var(--text-muted)] leading-relaxed">
                  Free to attend. Four checked-in crew members unlock the event benefits. No deposit or trade required.
                </p>
              </div>
            ) : (
              <button onClick={onGoToLobby} className="btn btn-brand btn-full py-2.5 font-bold text-[13px]">
                <ArrowRight className="w-4 h-4" />
                Open my crew
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── How it works ── */}
      {showHowItWorks && (
        <div className="card p-5 bg-[var(--bg-elevated)] border-[var(--border)] space-y-4 fade-in">
          <h3 className="font-bold text-[14px] text-[var(--text-primary)]">How Market Night works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              { step: '1', label: 'Reserve', desc: 'Claim your place in the event.' },
              { step: '2', label: 'Assemble crew', desc: 'Form a four-person crew using an invite code.' },
              { step: '3', label: 'Check in', desc: 'All four members use the host code to check in live.' },
              { step: '4', label: 'Unlock & explore', desc: 'Benefits unlock. Explore the simulated scenario together.' },
            ].map(s => (
              <div key={s.step} className="p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl">
                <div className="w-6 h-6 rounded-full bg-[var(--brand-dim)] border border-[var(--brand-border)] flex items-center justify-center text-[11px] font-bold text-[var(--brand)] mb-2">{s.step}</div>
                <p className="font-bold text-[12px] text-[var(--text-primary)]">{s.label}</p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{s.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            Your crew. One market night. Understand the trade before you make it.
          </p>
        </div>
      )}

      {/* ── Main layout: Agenda + Benefits + Rules ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Agenda */}
        <div className="card p-5 bg-[var(--bg-elevated)] border-[var(--border)] space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--brand)]" />
            <h2 className="font-bold text-[13px] uppercase tracking-wider text-[var(--text-primary)]">Agenda</h2>
          </div>
          <div className="space-y-2.5 text-[12px]">
            {[
              { time: '8:15 PM', label: 'Check-in window opens', note: 'Use host code to register attendance' },
              { time: '8:30 PM', label: 'Session begins', note: 'Scenario briefing and context' },
              { time: '8:40 PM', label: 'Explore your position', note: 'Private decision phase' },
              { time: '8:55 PM', label: 'Surprise event reveal', note: 'Host reveals scenario shock' },
              { time: '9:05 PM', label: 'Crew debrief', note: 'Revisions and crew discussion' },
              { time: '9:15 PM', label: 'Check-in window closes', note: '' },
              { time: '9:20 PM', label: 'Recap and Q&A', note: 'Guest question submissions' },
              { time: '9:30 PM', label: 'Session ends', note: 'Replay available after' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <span className="font-mono text-[10px] text-[var(--text-muted)] w-14 shrink-0 pt-0.5">{item.time}</span>
                <div>
                  <p className="text-[var(--text-primary)] font-medium">{item.label}</p>
                  {item.note && <p className="text-[10px] text-[var(--text-muted)]">{item.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Star className="w-4 h-4 text-[var(--brand)]" />
            <h2 className="font-bold text-[13px] uppercase tracking-wider text-[var(--text-primary)]">Session benefits</h2>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] px-1">Unlocked when all four crew members check in. No deposit or trade required.</p>
          {[
            {
              icon: <BookOpen className="w-5 h-5" />,
              bg: 'bg-[var(--green-dim)]',
              color: 'text-[var(--green)]',
              title: 'Crew workshop access',
              desc: 'Access to the event\'s interactive market scenario.',
              note: '✓ Enables the full scenario experience',
            },
            {
              icon: <FileText className="w-5 h-5" />,
              bg: 'bg-[var(--brand-dim)]',
              color: 'text-[var(--brand)]',
              title: 'Session toolkit',
              desc: 'Scenario notes, a cost checklist and a decision journal.',
              note: '✓ Download/open buttons activate after debrief',
            },
            {
              icon: <Play className="w-5 h-5" />,
              bg: 'bg-[var(--yellow-dim)]',
              color: 'text-[var(--yellow)]',
              title: 'Replay access',
              desc: 'Session recording added after the event ends.',
              note: '✓ Available after event',
            },
          ].map(b => (
            <SpotlightCard key={b.title} className="card p-4 bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--brand-border)] transition-colors space-y-2">
              <div className={`w-9 h-9 rounded-lg ${b.bg} ${b.color} flex items-center justify-center`}>{b.icon}</div>
              <div>
                <h3 className="font-bold text-[13px] text-[var(--text-primary)]">{b.title}</h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">{b.desc}</p>
              </div>
              <p className="text-[10px] text-[var(--green)] font-medium border-t border-[var(--border-subtle)] pt-1.5">{b.note}</p>
            </SpotlightCard>
          ))}
        </div>

        {/* Rules */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Shield className="w-4 h-4 text-[var(--brand)]" />
            <h2 className="font-bold text-[13px] uppercase tracking-wider text-[var(--text-primary)]">Participation rules</h2>
          </div>
          <div className="card p-4 bg-[var(--bg-elevated)] border-[var(--border)] space-y-3 text-[12px]">
            {[
              { title: '4 distinct accounts must check in',    desc: 'Reserving a place does not count as attendance. Check-in during the event window is required.' },
              { title: '1 crew per account per event',          desc: 'A participant can only qualify with one crew per Friday session.' },
              { title: 'Check-in is safe to repeat',            desc: 'One person counts once. Invalid or expired codes explain what happened.' },
              { title: 'Benefits unlock once per eligible account', desc: 'Leaving after benefits unlock does not create another claim opportunity.' },
              { title: 'Incomplete crews can still attend',     desc: 'Four check-ins unlock benefits, but partial crews can access the main session.' },
              { title: 'No deposit or trade required',          desc: 'All trading is simulated. No real money is involved in this prototype.' },
            ].map(r => (
              <div key={r.title} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--green)] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{r.title}</p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Previous session recap */}
          <div className="card p-4 bg-[var(--bg-surface)] border-[var(--border)] space-y-2">
            <h3 className="font-bold text-[12px] text-[var(--text-primary)]">Previous session recap</h3>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Last week: <strong>FOMC surprise and INR volatility.</strong> 41 crews completed the session. 75% consensus on reducing leverage exposure after the rate surprise reveal.
            </p>
            <p className="text-[10px] text-[var(--text-muted)] italic">Demo summary — not real market data or actual trading outcomes.</p>
          </div>
        </div>
      </div>

      {/* Create Crew Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm fade-in">
          <div className="relative w-full max-w-md card-elevated p-6 bg-[var(--bg-surface)] border-[var(--border)] space-y-4">
            <h3 className="font-bold text-[16px] text-[var(--text-primary)]">Name your crew</h3>
            <p className="text-[12px] text-[var(--text-secondary)]">As captain, you'll receive an invite code to share with 3 friends.</p>
            <div>
              <label className="stat-label block mb-1.5">Crew name</label>
              <input
                type="text"
                value={teamNameInput}
                onChange={e => setTeamNameInput(e.target.value)}
                placeholder="e.g. Midnight Analysts"
                className="input-field"
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { onCreateTeam(teamNameInput.trim() || `${currentUser.name}'s Crew`); setShowCreateModal(false); }}
                className="btn btn-brand flex-1"
              >
                Create crew (4 slots)
              </button>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Join Crew Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm fade-in">
          <div className="relative w-full max-w-md card-elevated p-6 bg-[var(--bg-surface)] border-[var(--border)] space-y-4">
            <h3 className="font-bold text-[16px] text-[var(--text-primary)]">Enter crew invite code</h3>
            <p className="text-[12px] text-[var(--text-secondary)]">Ask your captain for their code (e.g. CREW-4821).</p>
            <div>
              <label className="stat-label block mb-1.5">Invite code</label>
              <input
                type="text"
                value={teamCodeInput}
                onChange={e => { setTeamCodeInput(e.target.value); setJoinError(null); }}
                placeholder="CREW-4821"
                className="input-field uppercase font-mono"
                autoFocus
              />
              {joinError && (
                <p className="text-[11px] text-[var(--red)] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />{joinError}
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  if (!teamCodeInput.trim()) { setJoinError('Please enter a valid code'); return; }
                  onJoinTeam(teamCodeInput.trim());
                  setShowJoinModal(false);
                }}
                className="btn btn-brand flex-1"
              >Join crew</button>
              <button onClick={() => setShowJoinModal(false)} className="btn btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
