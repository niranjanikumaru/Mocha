'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  marketNightEngine, TEST_USERS
} from '../../lib/marketNightEngine';
import {
  MarketNightUser, MarketNightEvent, CrewTeam,
  MarketScenario, GrowthMetrics, MemberDecision
} from '../../types/marketNight';

import MarketNightEventPage from '../../components/MarketNight/MarketNightEventPage';
import TeamLobbyScreen from '../../components/MarketNight/TeamLobbyScreen';
import EventWorkspaceScreen from '../../components/MarketNight/EventWorkspaceScreen';
import CrewPassScreen from '../../components/MarketNight/CrewPassScreen';
import MarketNightCelebration from '../../components/MarketNight/MarketNightCelebration';
import MarketNightJudgeDemo from '../../components/MarketNight/MarketNightJudgeDemo';
import RetroGrid from '../../components/ui/retro-grid';
import AuroraBackground from '../../components/ui/aurora-background';

import {
  TrendingUp, ArrowLeft, Users, Sparkles, FileText,
  Award, Clock, CheckCircle2, ChevronRight, Zap, Shield
} from 'lucide-react';

type TabView = 'EVENT_DISCOVERY' | 'TEAM_LOBBY' | 'WORKSPACE' | 'CREW_PASS';

export default function MarketNightPage() {
  // Current user (defaults to Captain Priya)
  const [currentUser, setCurrentUser] = useState<MarketNightUser>(TEST_USERS[0]);

  // Engine states
  const [event, setEvent] = useState<MarketNightEvent>(marketNightEngine.getEvent());
  const [team, setTeam] = useState<CrewTeam | undefined>(marketNightEngine.getUserTeam(currentUser.id));
  const [scenario, setScenario] = useState<MarketScenario>(marketNightEngine.getScenario());
  const [metrics, setMetrics] = useState<GrowthMetrics>(marketNightEngine.getMetrics());

  // Navigation tab
  const [activeTab, setActiveTab] = useState<TabView>('EVENT_DISCOVERY');
  const [showCelebration, setShowCelebration] = useState(false);

  // Sync state on change
  useEffect(() => {
    const unsub = marketNightEngine.subscribe(() => {
      setEvent(marketNightEngine.getEvent());
      setTeam(marketNightEngine.getUserTeam(currentUser.id));
      setScenario(marketNightEngine.getScenario());
      setMetrics(marketNightEngine.getMetrics());

      if (marketNightEngine.celebrationTriggered) {
        setShowCelebration(true);
        marketNightEngine.celebrationTriggered = false;
      }
    });

    return () => { unsub(); };
  }, [currentUser]);

  // When user switches in judge demo
  function handleSelectUser(u: MarketNightUser) {
    setCurrentUser(u);
    const userTeam = marketNightEngine.getUserTeam(u.id);
    setTeam(userTeam);
  }

  // ── Actions ──
  function handleCreateTeam(name: string) {
    const res = marketNightEngine.createTeam(currentUser, name);
    if (res.success && res.team) {
      setTeam(res.team);
      setActiveTab('TEAM_LOBBY');
    } else {
      alert(res.error || 'Failed to create team');
    }
  }

  function handleJoinTeam(code: string) {
    const res = marketNightEngine.joinTeam(code, currentUser);
    if (res.success && res.team) {
      setTeam(res.team);
      setActiveTab('TEAM_LOBBY');
    } else {
      alert(res.error || 'Failed to join team');
    }
  }

  function handleSoloMatch() {
    const res = marketNightEngine.matchSoloAttendee(currentUser);
    if (res.success && res.team) {
      setTeam(res.team);
      setActiveTab('TEAM_LOBBY');
    }
  }

  function handleCheckIn() {
    if (!team) return;
    const res = marketNightEngine.checkInMember(team.id, currentUser.id);
    if (res.unlockedNow) {
      setShowCelebration(true);
    }
  }

  function handleSubmitDecision(choice: MemberDecision['initialChoice'], rationale: string) {
    if (!team) return;
    marketNightEngine.submitPrivateDecision(team.id, currentUser.id, currentUser.name, choice, rationale);
  }

  function handleRevealSurprise() {
    marketNightEngine.revealSurpriseShock();
  }

  function handleSubmitRevision(revisedChoice: MemberDecision['initialChoice'], revisedRationale: string) {
    marketNightEngine.submitRevision(currentUser.id, revisedChoice, revisedRationale);
  }

  function handleCompleteScenario() {
    if (!team) return;
    marketNightEngine.completeScenario(team.id);
    setActiveTab('CREW_PASS');
  }

  function handleSubmitQuestion(question: string) {
    if (!team) return;
    marketNightEngine.submitGuestQuestion(team.id, question);
  }

  function handleRsvpNextWeek() {
    if (!team) return;
    marketNightEngine.rsvpNextWeek(team.id);
  }

  // Demo presets
  function handlePreset3CheckedIn() {
    marketNightEngine.setDemoPreset('3_CHECKED_IN');
    setCurrentUser(TEST_USERS[3]); // Simran (4th member)
    setActiveTab('TEAM_LOBBY');
  }

  function handleUnlock4th() {
    marketNightEngine.setDemoPreset('UNLOCK_4TH');
    setShowCelebration(true);
    setActiveTab('TEAM_LOBBY');
  }

  function handleSimulateDisconnectReconnect() {
    marketNightEngine.setDemoPreset('DISCONNECT_RECONNECT');
    alert('Simulated network disconnect & reload: Crew Pass and all 3 benefits persist intact!');
  }

  function handleReset() {
    marketNightEngine.setDemoPreset('RESET');
    setCurrentUser(TEST_USERS[0]);
    setActiveTab('EVENT_DISCOVERY');
  }

  const isQualified = !!team?.isQualified;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col font-sans relative overflow-x-hidden">
      {/* VengeanceUI Cybernetic Graphics Background */}
      <AuroraBackground />
      <RetroGrid opacity={0.3} cellSize={65} lineColor="rgba(245, 158, 11, 0.12)" />

      {/* ── Top Bar ── */}
      <header className="h-[52px] px-5 bg-[var(--bg-surface)]/80 backdrop-blur-md border-b border-[var(--border)] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Trading Terminal</span>
          </Link>

          <Link
            href="/contract-rules"
            className="hidden sm:flex items-center gap-1.5 text-[12px] text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Contract Rules</span>
          </Link>

          <div className="w-px h-4 bg-[var(--border)] hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[var(--brand)] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[14px] text-[var(--text-primary)]">Mocha Market Night</span>
            <span className="badge badge-brand text-[9px] uppercase tracking-wider">Crew Pass Prototype</span>
          </div>
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-[var(--bg-interactive)] border border-[var(--border)] rounded-lg text-[12px]">
            <span>{currentUser.avatar}</span>
            <span className="font-semibold text-[var(--text-primary)]">{currentUser.name}</span>
            <span className="badge badge-muted text-[9px]">{currentUser.id === 'usr-01' ? 'Captain' : 'Trader'}</span>
          </div>
        </div>
      </header>

      {/* ── Secondary Stage Nav Strip ── */}
      <div className="bg-[var(--bg-elevated)] border-b border-[var(--border)] px-5 py-2 flex flex-wrap items-center justify-between gap-3 text-[12px]">
        <div className="flex items-center gap-1">
          {[
            { id: 'EVENT_DISCOVERY' as const, label: '1. Event Discovery', enabled: true },
            { id: 'TEAM_LOBBY' as const, label: '2. Team Lobby', enabled: !!team },
            { id: 'WORKSPACE' as const, label: '3. Event Workspace', enabled: isQualified },
            { id: 'CREW_PASS' as const, label: '4. Crew Pass & Reports', enabled: isQualified },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.enabled) setActiveTab(tab.id);
              }}
              disabled={!tab.enabled}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[var(--brand-dim)] text-[var(--brand)] border border-[var(--brand-border)]'
                  : tab.enabled
                  ? 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-interactive)]'
                  : 'text-[var(--text-disabled)] cursor-not-allowed opacity-40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick status badge */}
        {team && (
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-[var(--text-muted)]">Crew: <strong>{team.name}</strong></span>
            <span className={`badge ${isQualified ? 'badge-green' : 'badge-yellow'}`}>
              {isQualified ? 'CREW PASS UNLOCKED' : `${team.members.filter((m) => m.checkedIn).length}/4 CHECKED IN`}
            </span>
          </div>
        )}
      </div>

      {/* ── Main Content Container ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6 relative z-10">

        {activeTab === 'EVENT_DISCOVERY' && (
          <MarketNightEventPage
            event={event}
            currentUser={currentUser}
            onCreateTeam={handleCreateTeam}
            onJoinTeam={handleJoinTeam}
            onSoloMatch={handleSoloMatch}
            hasActiveTeam={!!team}
            onGoToLobby={() => setActiveTab('TEAM_LOBBY')}
          />
        )}

        {activeTab === 'TEAM_LOBBY' && team && (
          <TeamLobbyScreen
            team={team}
            currentUser={currentUser}
            onCheckIn={handleCheckIn}
            onEnterWorkspace={() => setActiveTab('WORKSPACE')}
          />
        )}

        {activeTab === 'WORKSPACE' && team && (
          <EventWorkspaceScreen
            team={team}
            scenario={scenario}
            currentUser={currentUser}
            onSubmitDecision={handleSubmitDecision}
            onRevealSurprise={handleRevealSurprise}
            onSubmitRevision={handleSubmitRevision}
            onCompleteScenario={handleCompleteScenario}
            onGoToRewards={() => setActiveTab('CREW_PASS')}
          />
        )}

        {activeTab === 'CREW_PASS' && team && (
          <CrewPassScreen
            team={team}
            scenario={scenario}
            currentUser={currentUser}
            onSubmitQuestion={handleSubmitQuestion}
            onRsvpNextWeek={handleRsvpNextWeek}
          />
        )}

        {/* ── Judge Demo Bar & Growth Mechanism ── */}
        <div className="pt-6 border-t border-[var(--border)]">
          <MarketNightJudgeDemo
            currentUser={currentUser}
            onSelectUser={handleSelectUser}
            metrics={metrics}
            onPreset3CheckedIn={handlePreset3CheckedIn}
            onUnlock4th={handleUnlock4th}
            onSimulateDisconnectReconnect={handleSimulateDisconnectReconnect}
            onReset={handleReset}
          />
        </div>
      </main>

      {/* ── Celebration Modal ── */}
      {showCelebration && team && (
        <MarketNightCelebration
          teamName={team.name}
          onDismiss={() => {
            setShowCelebration(false);
            setActiveTab('WORKSPACE');
          }}
        />
      )}
    </div>
  );
}
