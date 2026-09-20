'use client';

import { useState } from 'react';
import { CrewTeam, MarketScenario, MarketNightUser } from '../../types/marketNight';
import {
  Award, Download, MessageSquare, CheckCircle2, FileText,
  Calendar, Shield, Sparkles, Send, ArrowRight, Printer
} from 'lucide-react';

interface CrewPassScreenProps {
  team: CrewTeam;
  scenario: MarketScenario;
  currentUser: MarketNightUser;
  onSubmitQuestion: (question: string) => void;
  onRsvpNextWeek: () => void;
}

export default function CrewPassScreen({
  team,
  scenario,
  currentUser,
  onSubmitQuestion,
  onRsvpNextWeek,
}: CrewPassScreenProps) {
  const [questionText, setQuestionText] = useState('');
  const [questionSubmitted, setQuestionSubmitted] = useState(team.benefits.guestQuestion.submitted);
  const [rsvpd, setRsvpd] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);

  const canDownloadReport = team.benefits.teamAnalysisReport.isDownloadable || scenario.phase === 'COMPLETED';

  function handleQuestionSubmit() {
    if (!questionText.trim()) return;
    onSubmitQuestion(questionText.trim());
    setQuestionSubmitted(true);
  }

  function handleRsvp() {
    onRsvpNextWeek();
    setRsvpd(true);
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Official Gold Crew Pass Card */}
      <div className="card-elevated p-6 bg-gradient-to-br from-[var(--bg-surface)] via-[var(--bg-elevated)] to-[#1c180e] border-2 border-[var(--brand)] rounded-2xl relative overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.2)]">
        {/* Glow emblem */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand)] opacity-10 blur-3xl rounded-full pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[var(--brand-dim)] border border-[var(--brand)] flex items-center justify-center text-[var(--brand)]">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="badge badge-brand text-[10px] font-mono font-bold">OFFICIAL CREW PASS</span>
                <span className="badge badge-green text-[10px]">VERIFIED & UNLOCKED</span>
              </div>
              <h1 className="text-[22px] font-extrabold text-[var(--text-primary)] mt-0.5">
                {team.name}
              </h1>
              <p className="text-[12px] text-[var(--text-secondary)] font-mono">
                Pass ID: CP-{team.code} · Issued: Friday Mocha Market Night
              </p>
            </div>
          </div>

          <div className="text-right sm:text-right">
            <span className="stat-label">Syndicate Size</span>
            <p className="text-[18px] font-mono font-bold text-[var(--green)]">
              4/4 Verified Traders
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">Zero Disconnection Penalty</p>
          </div>
        </div>

        {/* Crew Roster Grid on Pass */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-[var(--border)]">
          {team.members.map((m) => (
            <div key={m.userId} className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center gap-2 text-[11px]">
              <span className="text-base">{m.avatar}</span>
              <div className="truncate">
                <p className="font-bold text-[var(--text-primary)] truncate">{m.name}</p>
                <p className="text-[10px] text-[var(--green)] font-mono">Checked In ✓</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* REWARD 1: Download Team Analysis Report */}
        <div className="card-elevated p-5 bg-[var(--bg-surface)] border-[var(--border)] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--green-dim)] text-[var(--green)] flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[14px] text-[var(--text-primary)]">Team Analysis Report</h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">Decision matrix & consensus debrief</p>
                </div>
              </div>
              <span className={`badge ${canDownloadReport ? 'badge-green' : 'badge-yellow'}`}>
                {canDownloadReport ? 'READY TO DOWNLOAD' : 'GENERATING…'}
              </span>
            </div>

            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
              A structured post-mortem comparing every member’s pre-shock thesis against the surprise announcement, tracking consensus divergence and risk adjustments.
            </p>

            <div className="p-3 mt-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Team Consensus Score:</span>
                <span className="font-mono font-bold text-[var(--green)]">75% Protective Alignment</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Primary Risk Factor:</span>
                <span className="font-mono text-[var(--text-primary)]">Export Guidance Gap Risk</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Report Format:</span>
                <span className="font-mono text-[var(--brand)]">PDF Summary & Data Export</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              onClick={() => setShowReportPreview(!showReportPreview)}
              className="btn btn-ghost btn-sm flex-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{showReportPreview ? 'Hide Report Preview' : 'Preview Full Report'}</span>
            </button>
            <button
              onClick={() => {
                alert('Downloading Team_Analysis_Report_CREW_PASS.pdf (Generated from live session data)');
              }}
              disabled={!canDownloadReport}
              className="btn btn-brand btn-sm flex-1 font-bold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report</span>
            </button>
          </div>
        </div>

        {/* REWARD 2: Fortnightly Guest Question Submission */}
        <div className="card-elevated p-5 bg-[var(--bg-surface)] border-[var(--border)] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--brand-dim)] text-[var(--brand)] flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[14px] text-[var(--text-primary)]">Guest Question Submission</h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">Direct access to fortnightly trader session</p>
                </div>
              </div>
              <span className={`badge ${questionSubmitted ? 'badge-green' : 'badge-brand'}`}>
                {questionSubmitted ? 'SUBMITTED' : '1 PER CREW'}
              </span>
            </div>

            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
              Your crew has earned one verified question submission for next Thursday’s live trader AMA.
              <em className="text-[var(--text-muted)] block mt-1">
                * Note: Only selected curated questions will be answered live on stream due to broadcast time limits.
              </em>
            </p>

            {!questionSubmitted ? (
              <div className="mt-3 space-y-2">
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="e.g. How should retail perpetual traders hedge weekend headline risk when funding rates are near parity?"
                  rows={3}
                  className="input-field text-[12px] resize-none"
                />
              </div>
            ) : (
              <div className="p-3 mt-3 rounded-lg bg-[var(--green-dim)] border border-[var(--green-border)] text-[12px] space-y-1">
                <p className="font-bold text-[var(--green)] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Question Received for Fortnightly Broadcast</span>
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] italic">
                  “{team.benefits.guestQuestion.questionText || questionText || 'How to hedge weekend headline risk...'}”
                </p>
              </div>
            )}
          </div>

          <div className="pt-2">
            {!questionSubmitted ? (
              <button
                onClick={handleQuestionSubmit}
                disabled={!questionText.trim()}
                className="btn btn-brand btn-full py-2 text-[13px] font-bold"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Team Question</span>
              </button>
            ) : (
              <button disabled className="btn btn-ghost btn-full py-2 text-[12px] opacity-60">
                Question Locked & Enqueued
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Report Preview Modal / Drawer */}
      {showReportPreview && (
        <div className="card p-6 bg-[var(--bg-elevated)] border-2 border-[var(--brand)] space-y-4 fade-in">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div>
              <h3 className="font-bold text-[16px] text-[var(--text-primary)]">
                Mocha Market Night — Team Analysis Report #{team.code}
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Subject: {scenario.title} ({scenario.ticker}) · Timestamp: {new Date().toLocaleDateString('en-IN')}
              </p>
            </div>
            <span className="badge badge-brand">Audit-Verified Report</span>
          </div>

          <div className="space-y-3 text-[12px]">
            <div className="p-3 bg-[var(--bg-surface)] rounded-lg border border-[var(--border)]">
              <h4 className="font-bold text-[var(--text-primary)] mb-1">Executive Summary</h4>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                During the earnings shock, team {team.name} demonstrated high situational awareness. Initial bias toward Long Momentum was re-evaluated post-export restriction notice, with 75% of the syndicate choosing to reduce exposure to protect margin health buffer from reaching liquidation thresholds.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-[var(--text-primary)]">Member Roster Decision Ledger</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {team.members.map((m) => {
                  const dec = scenario.decisions[m.userId];
                  return (
                    <div key={m.userId} className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px]">
                      <span className="font-bold text-[var(--text-primary)]">{m.name}:</span>{' '}
                      <span className="text-[var(--brand)] font-semibold">{dec?.initialChoice || 'LONG_MOMENTUM'}</span>{' '}
                      <span className="text-[var(--text-muted)]">➔</span>{' '}
                      <span className="text-[var(--green)] font-semibold">{dec?.revisedChoice || 'SHORT_HEDGE'}</span>
                      <p className="text-[10px] text-[var(--text-secondary)] italic mt-0.5">
                        “{dec?.revisedRationale || 'Adjusted leverage buffer.'}”
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Week RSVP Callout */}
      <div className="card p-5 bg-[var(--bg-elevated)] border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <Calendar className="w-4 h-4 text-[var(--brand)]" />
            <h3 className="font-bold text-[14px] text-[var(--text-primary)]">
              Keep the Syndicate Active: Next Friday’s Market Night
            </h3>
          </div>
          <p className="text-[12px] text-[var(--text-secondary)]">
            Next Theme: <strong>“FOMC Rate Decision & Currency Spillover (INR/USD)”</strong>. Reserve your 4-seat slot early.
          </p>
        </div>

        <button
          onClick={handleRsvp}
          disabled={rsvpd}
          className={`btn py-2.5 px-6 text-[13px] font-bold ${rsvpd ? 'btn-green' : 'btn-brand'}`}
        >
          {rsvpd ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>RSVP Confirmed for Next Week!</span>
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4" />
              <span>RSVP Crew for Next Friday</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
