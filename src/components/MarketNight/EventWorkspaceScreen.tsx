'use client';

import { useState } from 'react';
import { MarketScenario, CrewTeam, MarketNightUser, MemberDecision } from '../../types/marketNight';
import {
  TrendingUp, TrendingDown, Shield, AlertTriangle, Eye, EyeOff,
  CheckCircle2, ArrowRight, MessageSquare, Sparkles, Sliders, RefreshCw
} from 'lucide-react';

interface EventWorkspaceScreenProps {
  team: CrewTeam;
  scenario: MarketScenario;
  currentUser: MarketNightUser;
  onSubmitDecision: (choice: MemberDecision['initialChoice'], rationale: string) => void;
  onRevealSurprise: () => void;
  onSubmitRevision: (revisedChoice: MemberDecision['initialChoice'], revisedRationale: string) => void;
  onCompleteScenario: () => void;
  onGoToRewards: () => void;
}

export default function EventWorkspaceScreen({
  team,
  scenario,
  currentUser,
  onSubmitDecision,
  onRevealSurprise,
  onSubmitRevision,
  onCompleteScenario,
  onGoToRewards,
}: EventWorkspaceScreenProps) {
  const [selectedChoice, setSelectedChoice] = useState<MemberDecision['initialChoice']>('LONG_MOMENTUM');
  const [rationale, setRationale] = useState('');
  const [revisedChoice, setRevisedChoice] = useState<MemberDecision['initialChoice']>('SHORT_HEDGE');
  const [revisedRationale, setRevisedRationale] = useState('');

  const myDecision = scenario.decisions[currentUser.id];
  const hasSubmittedPrivate = !!myDecision;
  const isSurprisePhase = scenario.phase === 'SURPRISE_REVEAL' || scenario.phase === 'REVISION_DEBRIEF' || scenario.phase === 'COMPLETED';
  const isCompleted = scenario.phase === 'COMPLETED';

  // Total decisions submitted in team
  const submittedCount = Object.keys(scenario.decisions).length;

  return (
    <div className="space-y-6 fade-in">
      {/* Scenario Header Card */}
      <div className="card-elevated p-6 bg-[var(--bg-surface)] border-[var(--border)] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-brand text-[10px]">EXCLUSIVE SCENARIO</span>
              <span className="badge badge-muted font-mono text-[10px]">{scenario.ticker}</span>
              <span className="text-[11px] text-[var(--text-secondary)]">Phase: {scenario.phase.replace('_', ' ')}</span>
            </div>
            <h1 className="text-[22px] font-extrabold text-[var(--text-primary)]">
              {scenario.title}
            </h1>
            <p className="text-[12px] text-[var(--text-secondary)] mt-1 max-w-2xl">
              {scenario.catalystHeadline}
            </p>
          </div>

          <div className="text-right p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl shrink-0">
            <span className="stat-label">Initial Mark Price</span>
            <p className="text-[20px] font-mono font-bold text-[var(--text-primary)] price-display">
              ${scenario.initialPrice.toFixed(2)}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] font-mono">Pre-Announcement</p>
          </div>
        </div>

        {/* Phase Indicator Steps */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-[var(--border)] text-center text-[11px]">
          <div className={`p-2 rounded-lg border ${!isSurprisePhase ? 'bg-[var(--brand-dim)] border-[var(--brand)] text-[var(--brand)] font-bold' : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]'}`}>
            1. Private Stance (Hidden)
          </div>
          <div className={`p-2 rounded-lg border ${scenario.phase === 'SURPRISE_REVEAL' ? 'bg-[var(--red-dim)] border-[var(--red)] text-[var(--red)] font-bold' : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]'}`}>
            2. Surprise Market Shock
          </div>
          <div className={`p-2 rounded-lg border ${scenario.phase === 'REVISION_DEBRIEF' || isCompleted ? 'bg-[var(--green-dim)] border-[var(--green)] text-[var(--green)] font-bold' : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]'}`}>
            3. Group Revision & Matrix
          </div>
        </div>
      </div>

      {/* PHASE 1: Private Decision (Hidden from Peers) */}
      {!isSurprisePhase && (
        <div className="card p-6 bg-[var(--bg-elevated)] border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-[var(--brand)]" />
              <h2 className="font-bold text-[15px] text-[var(--text-primary)]">
                Step 1: Your Independent Hypothesis (Kept Secret)
              </h2>
            </div>
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              {submittedCount}/4 teammates submitted
            </span>
          </div>

          <p className="text-[12px] text-[var(--text-secondary)]">
            How would you allocate perpetual futures exposure heading into after-hours commentary? Your teammates cannot see your choice until the surprise is revealed.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'LONG_MOMENTUM' as const,
                title: 'Aggressive Long (5×)',
                desc: 'Capitalize on the 18% revenue beat and bullish data center guidance.',
                icon: <TrendingUp className="w-4 h-4 text-[var(--green)]" />,
              },
              {
                id: 'SHORT_HEDGE' as const,
                title: 'Protective Short Hedge',
                desc: 'Hedge against geopolitical export risks and crowded long positioning.',
                icon: <TrendingDown className="w-4 h-4 text-[var(--red)]" />,
              },
              {
                id: 'DE_RISK_CASH' as const,
                title: 'De-Risk / Reduce 75%',
                desc: 'Lower margin committed to zero out unexpected overnight gap risk.',
                icon: <Shield className="w-4 h-4 text-[var(--brand)]" />,
              },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedChoice(opt.id)}
                disabled={hasSubmittedPrivate}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedChoice === opt.id
                    ? 'bg-[var(--bg-interactive)] border-[var(--brand)] shadow-sm'
                    : 'bg-[var(--bg-surface)] border-[var(--border)] hover:bg-[var(--bg-hover)]'
                } ${hasSubmittedPrivate ? 'opacity-80' : ''}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {opt.icon}
                    <span className="font-bold text-[13px] text-[var(--text-primary)]">{opt.title}</span>
                  </div>
                  {selectedChoice === opt.id && <CheckCircle2 className="w-4 h-4 text-[var(--brand)]" />}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-normal">{opt.desc}</p>
              </button>
            ))}
          </div>

          <div>
            <label className="stat-label block mb-1">Your Trading Thesis & Risk Rationale</label>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              disabled={hasSubmittedPrivate}
              placeholder="Explain why you chose this position and how you'd manage margin buffer if volatility spikes..."
              rows={3}
              className="input-field text-[12px] resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {!hasSubmittedPrivate ? (
              <button
                onClick={() => onSubmitDecision(selectedChoice, rationale || 'Targeting earnings momentum')}
                className="btn btn-brand py-2.5 px-6 font-bold text-[13px]"
              >
                Lock In Private Stance
              </button>
            ) : (
              <div className="flex items-center gap-2 text-[var(--green)] text-[12px] font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Your private stance is recorded!</span>
              </div>
            )}

            {/* Captain can trigger surprise shock when ready */}
            <button
              onClick={onRevealSurprise}
              className="btn btn-red py-2.5 px-5 text-[13px] font-bold"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Trigger Surprise Market Shock!</span>
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2 & 3: Surprise Event Revealed */}
      {isSurprisePhase && (
        <div className="space-y-6">
          {/* Breaking News Shock Card */}
          <div className="p-5 bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.35)] rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--red)]">
                <AlertTriangle className="w-5 h-5 animate-pulse shrink-0" />
                <span className="font-extrabold text-[14px] uppercase tracking-wider">
                  Live Catalyst Unveiled
                </span>
              </div>
              <span className="badge badge-red font-mono font-bold text-[11px]">
                −10.4% DRAWDOWN
              </span>
            </div>

            <h3 className="text-[17px] font-extrabold text-[var(--text-primary)]">
              {scenario.surpriseEventHeadline}
            </h3>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-[12px]">
              <div>
                <span className="text-[var(--text-muted)]">Shock Mark Price:</span>
                <span className="font-mono font-bold text-[var(--red)] ml-1.5 text-[15px]">
                  ${scenario.shockPrice.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Mark-to-Market Impact:</span>
                <span className="font-mono font-bold text-[var(--red)] ml-1.5">
                  −$12.70 / share
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Estimated Margin Health:</span>
                <span className="badge badge-yellow ml-1.5">Near Reduced Buffer (28%)</span>
              </div>
            </div>
          </div>

          {/* Side-by-Side Team Decision Matrix */}
          <div className="card p-5 bg-[var(--bg-surface)] border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[var(--green)]" />
                <h3 className="font-bold text-[14px] text-[var(--text-primary)] uppercase tracking-wider">
                  Step 2: Team Stance Reveal (Unveiled)
                </h3>
              </div>
              <span className="text-[11px] text-[var(--text-secondary)]">All 4 member choices revealed</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {team.members.map((member) => {
                const dec = scenario.decisions[member.userId];
                const choiceLabel = dec?.initialChoice === 'LONG_MOMENTUM'
                  ? 'Aggressive Long'
                  : dec?.initialChoice === 'SHORT_HEDGE'
                  ? 'Short Hedge'
                  : dec?.initialChoice === 'DE_RISK_CASH'
                  ? 'De-Risk 75%'
                  : 'Long (Default)';

                return (
                  <div key={member.userId} className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2 text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{member.avatar}</span>
                      <div>
                        <p className="font-bold text-[var(--text-primary)] leading-none">{member.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono">{member.handle}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--border-subtle)]">
                      <span className="stat-label block">Initial Stance</span>
                      <span className={`font-bold font-mono text-[12px] ${
                        choiceLabel.includes('Long') ? 'text-[var(--green)]' : choiceLabel.includes('Short') ? 'text-[var(--red)]' : 'text-[var(--brand)]'
                      }`}>
                        {choiceLabel}
                      </span>
                    </div>

                    <p className="text-[11px] text-[var(--text-secondary)] italic leading-relaxed">
                      “{dec?.initialRationale || 'Anticipated earnings expansion.'}”
                    </p>

                    {dec?.revisedChoice && (
                      <div className="pt-2 border-t border-[var(--border-subtle)]">
                        <span className="stat-label block text-[var(--brand)]">Revised Decision:</span>
                        <span className="font-bold font-mono text-[11px] text-[var(--text-primary)]">
                          {dec.revisedChoice.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 3: Revision Form */}
          {!isCompleted ? (
            <div className="card p-5 bg-[var(--bg-elevated)] border-[var(--border)] space-y-4">
              <h3 className="font-bold text-[14px] text-[var(--text-primary)] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[var(--brand)]" />
                <span>Step 3: Revise Your Stance & Consensus Debrief</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'SHORT_HEDGE' as const, title: 'Pivot to Short Hedge', desc: 'Lock in protective downside.' },
                  { id: 'DE_RISK_CASH' as const, title: 'De-Risk to Buffer Margin', desc: 'Exit exposure until regulatory dust settles.' },
                  { id: 'LONG_MOMENTUM' as const, title: 'Buy the Dip (High Risk)', desc: 'Add margin to hold position for rebound.' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setRevisedChoice(opt.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      revisedChoice === opt.id
                        ? 'bg-[var(--bg-interactive)] border-[var(--brand)]'
                        : 'bg-[var(--bg-surface)] border-[var(--border)]'
                    }`}
                  >
                    <p className="font-bold text-[12px] text-[var(--text-primary)]">{opt.title}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>

              <div>
                <label className="stat-label block mb-1">Debrief Reflection & Post-Mortem</label>
                <textarea
                  value={revisedRationale}
                  onChange={(e) => setRevisedRationale(e.target.value)}
                  placeholder="How did the surprise shock shift your risk calculations? What did your teammates observe?"
                  rows={2}
                  className="input-field text-[12px] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => onSubmitRevision(revisedChoice, revisedRationale || 'Shifted to protective hedging.')}
                  className="btn btn-ghost flex-1 py-2.5"
                >
                  Save My Revision
                </button>
                <button
                  onClick={onCompleteScenario}
                  className="btn btn-brand flex-1 py-2.5 font-bold"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finalise Team Debrief & Generate Report</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-5 bg-[var(--bg-elevated)] border-[var(--green-border)] text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[var(--green-dim)] text-[var(--green)] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[15px] text-[var(--text-primary)]">
                Scenario Debrief Complete!
              </h3>
              <p className="text-[12px] text-[var(--text-secondary)] max-w-md mx-auto">
                Your team has completed the simulation. Your <strong>Team Analysis Report</strong> is now compiled and ready for download.
              </p>
              <div className="pt-2">
                <button
                  onClick={onGoToRewards}
                  className="btn btn-brand py-2.5 px-6 font-bold"
                >
                  <span>View Crew Pass & Download Report</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
