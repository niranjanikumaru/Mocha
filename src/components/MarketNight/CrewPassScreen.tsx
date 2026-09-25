'use client';

import { useState } from 'react';
import {
  Award, CheckCircle2, Download, Play, Clock, Send,
  Calendar, Star, FileText, Video, MessageSquare,
  BookOpen, ChevronRight, RotateCcw
} from 'lucide-react';
import { CrewTeam, MarketScenario, MarketNightUser } from '../../types/marketNight';

interface CrewPassScreenProps {
  team: CrewTeam;
  scenario: MarketScenario;
  currentUser: MarketNightUser;
  onSubmitQuestion: (question: string) => void;
  onRsvpNextWeek: () => void;
  onSaveRecap?: () => void;
  onSubmitFeedback?: (costsWereClear: boolean | null, understoodLiquidation: boolean | null, freeText: string) => void;
  onShareInvitation?: () => void;
}

export default function CrewPassScreen({
  team, scenario, currentUser,
  onSubmitQuestion, onRsvpNextWeek, onSaveRecap, onSubmitFeedback, onShareInvitation,
}: CrewPassScreenProps) {
  const [questionText, setQuestionText] = useState('');
  const [rsvpd, setRsvpd] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'PASS' | 'RECAP' | 'FEEDBACK'>('PASS');

  // Feedback state
  const [costsWereClear, setCostsWereClear] = useState<boolean | null>(null);
  const [understoodLiq, setUnderstoodLiq] = useState<boolean | null>(null);
  const [freeText, setFreeText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [recapSaved, setRecapSaved] = useState(false);

  const questionSubmitted = team.benefits.guestQuestion.submitted;
  const canDownloadReport = team.benefits.teamAnalysisReport.isDownloadable;
  const isCompleted = scenario.phase === 'COMPLETED';
  const myDecision = scenario.decisions[currentUser.id];

  function handleQuestionSubmit() {
    if (!questionText.trim()) return;
    onSubmitQuestion(questionText.trim());
  }

  function handleFeedbackSubmit() {
    onSubmitFeedback?.(costsWereClear, understoodLiq, freeText);
    setFeedbackSubmitted(true);
  }

  function handleRsvp() {
    onRsvpNextWeek();
    setRsvpd(true);
  }

  const allMemberAvatars = team.members.map(m => m.avatar);

  return (
    <div className="space-y-4">
      {/* ── Pass card (hero) ── */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--brand)] bg-gradient-to-br from-[var(--bg-surface)] via-[var(--bg-elevated)] to-[var(--bg-surface)] p-6 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
        {/* Glow blobs */}
        <div className="absolute -top-16 -left-16 w-40 h-40 bg-[var(--brand)] opacity-15 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-green-500 opacity-10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--brand-dim)] border-2 border-[var(--brand)] flex items-center justify-center shrink-0">
            <Award className="w-8 h-8 text-[var(--brand)]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-brand text-[10px] uppercase tracking-widest font-bold">
                MARKET NIGHT PASS — {team.isQualified ? 'ACTIVE' : 'PENDING'}
              </span>
            </div>
            <h2 className="font-bold text-[18px] text-[var(--text-primary)]">{team.name}</h2>
            <p className="text-[12px] text-[var(--text-secondary)]">Friday Market Night · {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
            {/* Member avatars */}
            <div className="flex gap-1.5 mt-2">
              {allMemberAvatars.map((av, i) => (
                <span key={i} className="text-xl">{av}</span>
              ))}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-mono text-[11px] text-[var(--text-muted)]">Pass ref</p>
            <p className="font-mono font-bold text-[var(--brand)] text-[12px]">{team.code}</p>
          </div>
        </div>
      </div>

      {/* ── Sub-tabs ── */}
      <div className="flex gap-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-1">
        {([
          { id: 'PASS' as const, label: 'My Pass & Benefits' },
          { id: 'RECAP' as const, label: 'Session Recap' },
          { id: 'FEEDBACK' as const, label: 'Feedback' },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-[12px] font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-[var(--brand-dim)] text-[var(--brand)] border border-[var(--brand-border)]'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── PASS tab ── */}
      {activeTab === 'PASS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Benefit 1: Workshop access */}
            <div className="card-elevated p-5 bg-[var(--bg-surface)] border-[var(--border)] space-y-3 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-[var(--green-dim)] text-[var(--green)] flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className={`badge ${team.benefits.workshopAccess.unlocked ? 'badge-green' : 'badge-muted'} text-[10px]`}>
                  {team.benefits.workshopAccess.unlocked ? 'Available' : 'Locked'}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-[13px] text-[var(--text-primary)]">Crew Workshop Access</h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">Access to the event's interactive market scenario workspace.</p>
              </div>
              <div className="mt-auto pt-2 border-t border-[var(--border-subtle)]">
                {team.benefits.workshopAccess.unlocked ? (
                  <span className="text-[11px] text-[var(--green)] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active this session
                  </span>
                ) : (
                  <span className="text-[11px] text-[var(--text-muted)]">Unlocks on 4th check-in</span>
                )}
              </div>
            </div>

            {/* Benefit 2: Session toolkit */}
            <div className="card-elevated p-5 bg-[var(--bg-surface)] border-[var(--border)] space-y-3 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-[var(--brand-dim)] text-[var(--brand)] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <span className={`badge ${team.benefits.sessionToolkit.unlocked ? (canDownloadReport ? 'badge-green' : 'badge-yellow') : 'badge-muted'} text-[10px]`}>
                  {!team.benefits.sessionToolkit.unlocked ? 'Locked' : canDownloadReport ? 'Available' : 'Available after session'}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-[13px] text-[var(--text-primary)]">Session Toolkit</h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">Scenario notes, a cost checklist and a decision journal.</p>
              </div>
              {team.benefits.sessionToolkit.unlocked && (
                <ul className="text-[10px] text-[var(--text-muted)] space-y-0.5">
                  {team.benefits.sessionToolkit.items.map(item => (
                    <li key={item} className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[var(--brand)] rounded-full shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-auto pt-2 border-t border-[var(--border-subtle)] flex gap-2">
                <button
                  onClick={() => setShowReportPreview(!showReportPreview)}
                  disabled={!canDownloadReport}
                  className="btn btn-ghost btn-sm flex-1 text-[10px]"
                >
                  <FileText className="w-3 h-3" />
                  {showReportPreview ? 'Hide' : 'Preview'}
                </button>
                <button
                  disabled={!canDownloadReport}
                  onClick={() => alert('Downloading Session_Toolkit.pdf (Generated from live session data)')}
                  className="btn btn-brand btn-sm flex-1 text-[10px]"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
            </div>

            {/* Benefit 3: Replay access */}
            <div className="card-elevated p-5 bg-[var(--bg-surface)] border-[var(--border)] space-y-3 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-[var(--yellow-dim)] text-[var(--yellow)] flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <span className={`badge ${team.benefits.replayAccess.unlocked ? 'badge-yellow' : 'badge-muted'} text-[10px]`}>
                  {team.benefits.replayAccess.unlocked ? 'Available after session' : 'Locked'}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-[13px] text-[var(--text-primary)]">Replay Access</h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">Access to the recorded session recap when available after the event.</p>
              </div>
              <div className="mt-auto pt-2 border-t border-[var(--border-subtle)]">
                {team.benefits.replayAccess.unlocked ? (
                  <span className="text-[11px] text-[var(--yellow)] font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Added after event ends
                  </span>
                ) : (
                  <span className="text-[11px] text-[var(--text-muted)]">Unlocks on 4th check-in</span>
                )}
              </div>
            </div>
          </div>

          {/* Report preview */}
          {showReportPreview && canDownloadReport && (
            <div className="card p-5 bg-[var(--bg-elevated)] border-2 border-[var(--brand)] space-y-4 fade-in">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div>
                  <h3 className="font-bold text-[15px] text-[var(--text-primary)]">Mocha Market Night — Team Report · {team.code}</h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">{scenario.title} · {new Date().toLocaleDateString('en-IN')}</p>
                </div>
                <span className="badge badge-brand text-[10px]">Verified Report</span>
              </div>
              <div className="p-3 bg-[var(--bg-surface)] rounded-lg border border-[var(--border)] text-[12px]">
                <h4 className="font-bold text-[var(--text-primary)] mb-1">Executive summary</h4>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {team.benefits.teamAnalysisReport.summaryMetrics?.divergenceNotes || 'Team completed the scenario. Analysis pending.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {team.members.map(m => {
                  const dec = scenario.decisions[m.userId];
                  return (
                    <div key={m.userId} className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px]">
                      <span className="font-bold text-[var(--text-primary)]">{m.name}:</span>{' '}
                      <span className="text-[var(--brand)] font-semibold">{dec?.initialChoice?.replace(/_/g, ' ') || '—'}</span>
                      {dec?.revisedChoice && (
                        <><span className="text-[var(--text-muted)]"> → </span>
                        <span className="text-[var(--green)] font-semibold">{dec.revisedChoice.replace(/_/g, ' ')}</span></>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Guest question */}
          <div className="card p-5 bg-[var(--bg-surface)] border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[var(--brand)]" />
                <h3 className="font-bold text-[13px] text-[var(--text-primary)]">Guest Question Submission</h3>
              </div>
              <span className={`badge ${questionSubmitted ? 'badge-green' : 'badge-brand'} text-[10px]`}>
                {questionSubmitted ? 'Submitted' : '1 per crew'}
              </span>
            </div>
            <p className="text-[12px] text-[var(--text-secondary)]">
              Your crew has earned one question slot for our next live trader session. Curated questions are answered on stream.
            </p>
            {!questionSubmitted ? (
              <div className="space-y-2">
                <textarea
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                  placeholder="e.g. How should retail traders hedge overnight headline risk when funding rates are near parity?"
                  rows={3}
                  className="input-field text-[12px] resize-none"
                />
                <button
                  onClick={handleQuestionSubmit}
                  disabled={!questionText.trim() || !team.benefits.guestQuestion.unlocked}
                  className="btn btn-brand btn-full py-2 text-[12px] font-bold"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit team question</span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-[var(--green-dim)] border border-[var(--green-border)] rounded-lg text-[12px]">
                <CheckCircle2 className="w-4 h-4 text-[var(--green)] inline mr-1.5" />
                <strong className="text-[var(--green)]">Question received.</strong>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1 italic">"{team.benefits.guestQuestion.questionText}"</p>
              </div>
            )}
          </div>

          {/* Next week RSVP */}
          <div className="card p-5 bg-[var(--bg-elevated)] border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--brand)]" />
                <h3 className="font-bold text-[14px] text-[var(--text-primary)]">Keep the crew active: Next Friday's Market Night</h3>
              </div>
              <p className="text-[12px] text-[var(--text-secondary)]">
                Next theme: <strong>"FOMC Rate Decision & Currency Spillover (INR/USD)"</strong>
              </p>
            </div>
            <button
              onClick={handleRsvp}
              disabled={rsvpd}
              className={`btn py-2.5 px-6 font-bold shrink-0 ${rsvpd ? 'btn-green' : 'btn-brand'}`}
            >
              {rsvpd ? <><CheckCircle2 className="w-4 h-4" /><span>RSVP confirmed!</span></> : <><Calendar className="w-4 h-4" /><span>RSVP for next Friday</span></>}
            </button>
          </div>
        </div>
      )}

      {/* ── RECAP tab ── */}
      {activeTab === 'RECAP' && (
        <div className="space-y-4">
          <div className="card p-5 bg-[var(--bg-elevated)] border-[var(--border)] space-y-2">
            <h3 className="font-bold text-[15px] text-[var(--text-primary)]">Your Market Night recap</h3>
            <p className="text-[12px] text-[var(--text-secondary)]">
              You joined <strong className="text-[var(--text-primary)]">{team.name}</strong>, completed the workshop and explored {myDecision ? 'one simulated decision' : 'the session without submitting a trade'}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Your decision */}
            <div className="card p-4 bg-[var(--bg-surface)] border-[var(--border)] space-y-3">
              <h4 className="font-bold text-[12px] uppercase tracking-wider text-[var(--text-muted)]">1. Your decision</h4>
              {myDecision ? (
                <div className="space-y-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Initial choice</span>
                    <span className="font-semibold text-[var(--text-primary)]">{myDecision.initialChoice.replace(/_/g, ' ')}</span>
                  </div>
                  {myDecision.revisedChoice && (
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">After preview</span>
                      <span className={`font-semibold ${myDecision.revisedChoice !== myDecision.initialChoice ? 'text-[var(--brand)]' : 'text-[var(--text-primary)]'}`}>
                        {myDecision.revisedChoice !== myDecision.initialChoice ? 'Changed stance' : 'Held position'}
                      </span>
                    </div>
                  )}
                  {myDecision.simulatedOutcome && (
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Simulated outcome</span>
                      <span className={`font-semibold font-mono ${myDecision.simulatedOutcome === 'PROFIT' ? 'text-[var(--green)]' : myDecision.simulatedOutcome === 'LOSS' ? 'text-[var(--red)]' : 'text-[var(--text-muted)]'}`}>
                        {myDecision.simulatedOutcome}
                        {myDecision.finalPnlSimulated != null && ` · ₹${Math.abs(myDecision.finalPnlSimulated).toLocaleString()}`}
                      </span>
                    </div>
                  )}
                  {myDecision.previewCompleted && (
                    <div className="flex items-center gap-1.5 text-[var(--green)] text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Cost preview completed before confirming
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[12px] text-[var(--text-muted)]">No decision submitted this session.</p>
              )}
            </div>

            {/* 2. Transaction experience */}
            <div className="card p-4 bg-[var(--bg-surface)] border-[var(--border)] space-y-3">
              <h4 className="font-bold text-[12px] uppercase tracking-wider text-[var(--text-muted)]">2. Transaction experience</h4>
              {myDecision?.transactionRef ? (
                <div className="space-y-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Ref</span>
                    <span className="font-mono text-[var(--text-primary)] text-[11px]">{myDecision.transactionRef}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Final status</span>
                    <span className="font-semibold text-[var(--green)]">{myDecision.transactionStatus?.replace(/_/g, ' ')}</span>
                  </div>
                  {myDecision.transactionStatus === 'CONFIRMED' && (
                    <p className="text-[11px] text-[var(--green)]">Order confirmed · No duplicate charge.</p>
                  )}
                </div>
              ) : (
                <p className="text-[12px] text-[var(--text-muted)]">No transaction recorded.</p>
              )}
            </div>

            {/* 3. Actions */}
            <div className="card p-4 bg-[var(--bg-surface)] border-[var(--border)] space-y-3">
              <h4 className="font-bold text-[12px] uppercase tracking-wider text-[var(--text-muted)]">3. Closing actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => { onSaveRecap?.(); setRecapSaved(true); }}
                  disabled={recapSaved}
                  className={`btn btn-full py-2 text-[12px] ${recapSaved ? 'btn-green' : 'btn-ghost'}`}
                >
                  {recapSaved ? <><CheckCircle2 className="w-3.5 h-3.5" />Recap saved</> : <><Download className="w-3.5 h-3.5" />Save my recap</>}
                </button>
                <button onClick={handleRsvp} disabled={rsvpd} className={`btn btn-full py-2 text-[12px] ${rsvpd ? 'btn-green' : 'btn-ghost'}`}>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{rsvpd ? 'Reminder set' : 'Remind me next session'}</span>
                </button>
                <button onClick={onShareInvitation} className="btn btn-ghost btn-full py-2 text-[12px]">
                  <ChevronRight className="w-3.5 h-3.5" />
                  Share an invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FEEDBACK tab ── */}
      {activeTab === 'FEEDBACK' && (
        <div className="space-y-4">
          {!feedbackSubmitted ? (
            <div className="card p-5 bg-[var(--bg-elevated)] border-[var(--border)] space-y-5">
              <h3 className="font-bold text-[15px] text-[var(--text-primary)]">Session feedback</h3>

              {/* Q1 */}
              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">Were the costs clear before you confirmed?</p>
                <div className="flex gap-2">
                  {([{ val: true, label: 'Yes' }, { val: false, label: 'No' }] as const).map(opt => (
                    <button
                      key={String(opt.val)}
                      onClick={() => setCostsWereClear(opt.val)}
                      className={`flex-1 py-2 rounded-lg border text-[12px] font-semibold transition-all ${
                        costsWereClear === opt.val
                          ? 'bg-[var(--brand-dim)] border-[var(--brand)] text-[var(--brand)]'
                          : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)]'
                      }`}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>

              {/* Q2 */}
              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">Did you understand what could cause liquidation?</p>
                <div className="flex gap-2">
                  {([{ val: true, label: 'Yes' }, { val: false, label: 'No' }] as const).map(opt => (
                    <button
                      key={String(opt.val)}
                      onClick={() => setUnderstoodLiq(opt.val)}
                      className={`flex-1 py-2 rounded-lg border text-[12px] font-semibold transition-all ${
                        understoodLiq === opt.val
                          ? 'bg-[var(--brand-dim)] border-[var(--brand)] text-[var(--brand)]'
                          : 'bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)]'
                      }`}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>

              {/* Q3 */}
              <div className="space-y-2">
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">Was anything unexpected or confusing?</p>
                <textarea
                  value={freeText}
                  onChange={e => setFreeText(e.target.value)}
                  placeholder="Optional — helps us improve"
                  rows={3}
                  className="input-field text-[12px] resize-none"
                />
              </div>

              <button
                onClick={handleFeedbackSubmit}
                className="btn btn-brand btn-full py-2.5 font-bold"
              >
                <Star className="w-4 h-4" />
                <span>Submit feedback</span>
              </button>
              <p className="text-[10px] text-[var(--text-muted)] text-center">
                Feedback identifies what to investigate. It does not establish a growth uplift automatically.
              </p>
            </div>
          ) : (
            <div className="card p-6 bg-[var(--green-dim)] border-[var(--green-border)] text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[var(--green)] mx-auto" />
              <h3 className="font-bold text-[15px] text-[var(--text-primary)]">Thank you for your feedback</h3>
              <p className="text-[12px] text-[var(--text-secondary)]">Your response has been recorded. We'll use it to understand what to improve — not to project future conversion.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
