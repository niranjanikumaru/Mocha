import {
  MarketNightUser, MarketNightEvent, CrewTeam, BenefitBundle,
  MarketScenario, MemberDecision, GrowthMetrics, TransactionRecord,
  TransactionStatus, PollInfluenceOption, FeedbackRecord,
} from '../types/marketNight';

// ─── Demo Users ──────────────────────────────────────────────────────────────
export const TEST_USERS: MarketNightUser[] = [
  { id: 'usr-01', name: 'Priya Sharma',   handle: '@priya_trader',   avatar: '👩🏽‍💼', email: 'priya@example.com',  role: 'CAPTAIN', isTestAccount: true },
  { id: 'usr-02', name: 'Rohan Verma',    handle: '@rohan_quant',    avatar: '👨🏽‍💻', email: 'rohan@example.com',  role: 'MEMBER',  isTestAccount: true },
  { id: 'usr-03', name: 'Aarav Mehta',    handle: '@aarav_macro',    avatar: '👨🏻‍📊', email: 'aarav@example.com',  role: 'MEMBER',  isTestAccount: true },
  { id: 'usr-04', name: 'Simran Kaur',    handle: '@simran_options', avatar: '👩🏻‍🔬', email: 'simran@example.com', role: 'MEMBER',  isTestAccount: true },
  { id: 'usr-05', name: 'Kunal Sen',      handle: '@kunal_solo',     avatar: '🧑🏽‍💡', email: 'kunal@example.com',  role: 'SOLO',    isTestAccount: true },
];

const now = Date.now();

export const INITIAL_EVENT: MarketNightEvent = {
  id: 'EVT-FRI-0920',
  title: 'Friday Market Night',
  theme: 'What moves US tech?',
  description: 'Explore a market scenario with your crew, understand the exposure and discuss the decisions together.',
  scheduledTime: now + 1000 * 60 * 30,
  checkInWindowStart: now - 1000 * 60 * 15,
  checkInWindowEnd:   now + 1000 * 60 * 120,
  status: 'CHECKIN_OPEN',
  minCrewSize: 4,
  hostName: 'MochaTrade Host',
  checkInCode: 'MOCHA9',   // 6-char code shown by host
  reservationCount: 0,
  hostingCostINR: 4500,
};

export const INITIAL_BENEFITS = (): BenefitBundle => ({
  workshopAccess: {
    unlocked: false,
    title: 'Crew Workshop Access',
    description: 'Access to the event\'s interactive scenario workspace.',
  },
  sessionToolkit: {
    unlocked: false,
    isDownloadable: false,
    items: ['Scenario notes PDF', 'Cost checklist', 'Decision journal template'],
  },
  replayAccess: {
    unlocked: false,
    availableAfterSession: true,
  },
  exclusiveScenario: {
    unlocked: false,
    scenarioId: 'SCENARIO-NVDA-SHOCK',
    title: 'US Tech Earnings — Revenue Beat, Guidance Disappoints',
    description: 'Explore how different position sizes affect your exposure.',
  },
  teamAnalysisReport: {
    unlocked: false,
    isDownloadable: false,
    summaryMetrics: { consensusScore: 0, divergenceNotes: 'Awaiting participation.' },
  },
  guestQuestion: {
    unlocked: false,
    submitted: false,
    disclaimer: 'One curated question per crew per session.',
  },
});

export const INITIAL_SCENARIO = (): MarketScenario => ({
  id: 'SCENARIO-NVDA-SHOCK',
  title: 'Fictional US Technology Co. — Earnings Scenario',
  ticker: 'UTECH-SIM',
  underlyingAsset: 'Simulated US Tech Sector (Fictional)',
  initialPrice: 122.50,
  catalystHeadline: 'Revenue beat expectations by 14%, but full-year guidance disappointed. After-hours price fell 9.2%.',
  surpriseEventHeadline: 'BREAKING (SIMULATED): Regulatory guidance update restricts certain semiconductor exports, widening the after-hours drop.',
  shockPrice: 109.80,
  decisions: {},
  transactions: {},
  phase: 'PRIVATE_DECISION',
  pollResults: {},
});

export const INITIAL_GROWTH_METRICS: GrowthMetrics = {
  reservationCount: 0,
  attendeeCount: 190,
  completedCrews: 41,
  benefitsIssued: 0,
  eventCostINR: 4500,
  previewCompletions: 0,
  simulatedDecisions: 0,
  unresolvedTransactions: 0,
  feedbackResponses: 0,
  invitationsSent: 284,
  totalJoined: 242,
  checkedInCount: 190,
  teamsFormed: 64,
  teamsQualified: 41,
  inviteToAttendanceRate: 78.5,
  teamCompletionRate: 64.1,
  benefitUsageRate: 92.7,
  repeatAttendanceRsvpRate: 66.4,
  costPerReturningTrader: 2.40,
};

// ─── In-memory singleton ──────────────────────────────────────────────────────
class MarketNightStore {
  private event: MarketNightEvent = { ...INITIAL_EVENT };
  private teams: Map<string, CrewTeam> = new Map();
  private userTeamMap: Map<string, string> = new Map();
  private scenario: MarketScenario = INITIAL_SCENARIO();
  private metrics: GrowthMetrics = { ...INITIAL_GROWTH_METRICS };
  private feedbacks: Map<string, FeedbackRecord> = new Map();
  private reservedUsers: Set<string> = new Set();
  private listeners: Set<() => void> = new Set();

  public lastUnlockedAt: number | null = null;
  public celebrationTriggered: boolean = false;

  constructor() {
    this.initDefaultTeam();
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // ─── Getters ────────────────────────────────────────────────────────────────

  public getEvent(): MarketNightEvent { return { ...this.event }; }
  public getScenario(): MarketScenario { return this.scenario; }
  public getMetrics(): GrowthMetrics { return { ...this.metrics }; }
  public getFeedbacks(): FeedbackRecord[] { return [...this.feedbacks.values()]; }
  public isReserved(userId: string): boolean { return this.reservedUsers.has(userId); }

  public getUserTeam(userId: string): CrewTeam | undefined {
    const teamId = this.userTeamMap.get(userId);
    if (!teamId) return undefined;
    return this.teams.get(teamId);
  }

  // ─── Reserve a place ────────────────────────────────────────────────────────

  public reservePlace(userId: string): { success: boolean; error?: string } {
    if (this.reservedUsers.has(userId)) {
      return { success: false, error: 'You already have a reservation.' };
    }
    this.reservedUsers.add(userId);
    this.event.reservationCount++;
    this.metrics.reservationCount++;
    this.notify();
    return { success: true };
  }

  // ─── Create team ────────────────────────────────────────────────────────────

  public createTeam(user: MarketNightUser, name: string): { success: boolean; team?: CrewTeam; error?: string } {
    if (this.userTeamMap.has(user.id)) {
      return { success: false, error: 'You are already in a crew. Leave your current crew first.' };
    }
    const teamId = `TEAM-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
    const code = `CREW-${Math.floor(1000 + Math.random() * 9000)}`;
    const team: CrewTeam = {
      id: teamId,
      code,
      name: name || `${user.name}'s Crew`,
      captainId: user.id,
      members: [{
        userId: user.id,
        name: user.name,
        handle: user.handle,
        avatar: user.avatar,
        isCaptain: true,
        joinedAt: Date.now(),
        checkedIn: false,
      }],
      isQualified: false,
      benefits: INITIAL_BENEFITS(),
      disconnectionResilient: false,
    };
    this.teams.set(teamId, team);
    this.userTeamMap.set(user.id, teamId);
    this.metrics.teamsFormed++;
    this.metrics.invitationsSent++;
    if (!this.reservedUsers.has(user.id)) {
      this.reservedUsers.add(user.id);
      this.event.reservationCount++;
      this.metrics.reservationCount++;
    }
    this.notify();
    return { success: true, team };
  }

  // ─── Join team by invite code ────────────────────────────────────────────────

  public joinTeam(code: string, user: MarketNightUser): { success: boolean; team?: CrewTeam; error?: string } {
    if (this.userTeamMap.has(user.id)) {
      return { success: false, error: 'You are already in a crew for this event.' };
    }
    const team = [...this.teams.values()].find(t => t.code.toLowerCase() === code.toLowerCase());
    if (!team) {
      return { success: false, error: 'Invalid Crew Code. Please check with your captain.' };
    }
    if (team.members.length >= 4) {
      return { success: false, error: 'This crew is full (4/4 members). Ask your captain to start another crew.' };
    }
    if (team.members.some(m => m.userId === user.id)) {
      return { success: false, error: 'You are already in this crew.' };
    }
    team.members.push({
      userId: user.id,
      name: user.name,
      handle: user.handle,
      avatar: user.avatar,
      isCaptain: false,
      joinedAt: Date.now(),
      checkedIn: false,
    });
    this.userTeamMap.set(user.id, team.id);
    this.metrics.totalJoined++;
    if (!this.reservedUsers.has(user.id)) {
      this.reservedUsers.add(user.id);
      this.event.reservationCount++;
      this.metrics.reservationCount++;
    }
    this.notify();
    return { success: true, team };
  }

  // ─── Rename crew (captain only) ──────────────────────────────────────────────

  public renameCrew(teamId: string, userId: string, newName: string): { success: boolean; error?: string } {
    const team = this.teams.get(teamId);
    if (!team) return { success: false, error: 'Crew not found.' };
    if (team.captainId !== userId) return { success: false, error: 'Only the captain can rename the crew.' };
    team.name = newName;
    this.notify();
    return { success: true };
  }

  // ─── Leave crew ──────────────────────────────────────────────────────────────

  public leaveCrew(userId: string): { success: boolean; error?: string } {
    const teamId = this.userTeamMap.get(userId);
    if (!teamId) return { success: false, error: 'You are not in a crew.' };
    const team = this.teams.get(teamId);
    if (!team) return { success: false, error: 'Crew not found.' };
    if (team.isQualified) return { success: false, error: 'Benefits are already unlocked. Leaving does not create another claim opportunity.' };
    team.members = team.members.filter(m => m.userId !== userId);
    this.userTeamMap.delete(userId);
    if (team.members.length === 0) {
      this.teams.delete(teamId);
    } else if (team.captainId === userId && team.members.length > 0) {
      team.captainId = team.members[0].userId;
      team.members[0].isCaptain = true;
    }
    this.notify();
    return { success: true };
  }

  // ─── Check-in with event code ────────────────────────────────────────────────

  public checkInMember(
    teamId: string,
    userId: string,
    enteredCode?: string
  ): { success: boolean; unlockedNow: boolean; checkedInCount: number; error?: string } {
    const team = this.teams.get(teamId);
    if (!team) return { success: false, unlockedNow: false, checkedInCount: 0, error: 'Crew not found.' };

    const curTime = Date.now();
    if (curTime < this.event.checkInWindowStart || curTime > this.event.checkInWindowEnd) {
      return { success: false, unlockedNow: false, checkedInCount: 0, error: 'Check-in window is currently closed.' };
    }

    // Validate event code if provided (case-insensitive, prototype bypass allowed)
    if (enteredCode !== undefined && enteredCode.trim() !== '') {
      const normalised = enteredCode.trim().toUpperCase().replace(/\s/g, '');
      const expected  = this.event.checkInCode.toUpperCase().replace(/\s/g, '');
      if (normalised !== expected) {
        return { success: false, unlockedNow: false, checkedInCount: 0, error: 'Incorrect event code. Check the code displayed by your host.' };
      }
    }

    const member = team.members.find(m => m.userId === userId);
    if (!member) {
      return { success: false, unlockedNow: false, checkedInCount: 0, error: 'You do not belong to this crew.' };
    }

    // Idempotent — checking in twice still counts once
    if (!member.checkedIn) {
      member.checkedIn = true;
      member.checkedInAt = curTime;
      this.metrics.checkedInCount++;
      this.metrics.attendeeCount++;
    }

    const checkedInMembers = team.members.filter(m => m.checkedIn);
    const checkedInCount = checkedInMembers.length;
    let unlockedNow = false;

    if (checkedInCount >= 4 && !team.isQualified) {
      team.isQualified = true;
      team.qualifiedAt = curTime;
      team.disconnectionResilient = true;

      // Unlock all three benefits
      const b = team.benefits;
      b.workshopAccess.unlocked = true;
      b.workshopAccess.unlockedAt = curTime;
      b.sessionToolkit.unlocked = true;
      b.sessionToolkit.unlockedAt = curTime;
      b.sessionToolkit.isDownloadable = true;
      b.replayAccess.unlocked = true;
      b.replayAccess.unlockedAt = curTime;
      // Legacy
      b.exclusiveScenario.unlocked = true;
      b.exclusiveScenario.unlockedAt = curTime;
      b.teamAnalysisReport.unlocked = true;
      b.teamAnalysisReport.unlockedAt = curTime;
      b.guestQuestion.unlocked = true;
      b.guestQuestion.unlockedAt = curTime;

      this.lastUnlockedAt = curTime;
      this.celebrationTriggered = true;
      this.metrics.teamsQualified++;
      this.metrics.completedCrews++;
      this.metrics.benefitsIssued += 3;
      // Benefit cost: ₹500 per crew (illustrative)
      this.metrics.eventCostINR += 500;

      unlockedNow = true;
    }

    this.notify();
    return { success: true, unlockedNow, checkedInCount };
  }

  // ─── Solo matching ───────────────────────────────────────────────────────────

  public matchSoloAttendee(user: MarketNightUser): { success: boolean; team: CrewTeam } {
    if (this.userTeamMap.has(user.id)) {
      const team = this.teams.get(this.userTeamMap.get(user.id)!)!;
      return { success: true, team };
    }
    for (const team of this.teams.values()) {
      if (team.members.length < 4 && !team.members.some(m => m.userId === user.id)) {
        team.members.push({
          userId: user.id, name: user.name, handle: user.handle,
          avatar: user.avatar, isCaptain: false,
          joinedAt: Date.now(), checkedIn: false,
        });
        this.userTeamMap.set(user.id, team.id);
        this.notify();
        return { success: true, team };
      }
    }
    const res = this.createTeam(user, 'Solo Match Crew');
    return { success: true, team: res.team! };
  }

  // ─── Scenario: submit decision ───────────────────────────────────────────────

  public submitPrivateDecision(
    teamId: string,
    userId: string,
    userName: string,
    choice: MemberDecision['initialChoice'],
    rationale: string,
    simulatedMargin?: number,
    simulatedLeverage?: number,
    previewCompleted?: boolean,
  ) {
    this.scenario.decisions[userId] = {
      userId, userName,
      initialChoice: choice,
      initialRationale: rationale,
      simulatedMargin, simulatedLeverage, previewCompleted,
      submittedAt: Date.now(),
    };
    if (previewCompleted) this.metrics.previewCompletions++;
    this.metrics.simulatedDecisions++;

    // Simulate transaction flow for non-sit-out decisions
    if (choice !== 'SIT_OUT') {
      const ref = `TXN-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
      this.scenario.decisions[userId].transactionRef = ref;
      this.scenario.decisions[userId].transactionStatus = 'AWAITING_APPROVAL';

      const txn: TransactionRecord = {
        ref,
        status: 'AWAITING_APPROVAL',
        statusHistory: [{ status: 'AWAITING_APPROVAL', timestamp: Date.now() }],
        isDuplicate: false,
      };
      this.scenario.transactions[ref] = txn;

      // Simulate async progression
      setTimeout(() => {
        txn.status = 'SUBMITTED';
        txn.statusHistory.push({ status: 'SUBMITTED', timestamp: Date.now() });
        this.scenario.decisions[userId].transactionStatus = 'SUBMITTED';
        this.notify();
      }, 1500);

      setTimeout(() => {
        txn.status = 'CHECKING_OUTCOME';
        txn.statusHistory.push({ status: 'CHECKING_OUTCOME', timestamp: Date.now(), note: 'We have not yet confirmed whether your order was accepted. We\'re checking its status. Please do not submit again.' });
        this.scenario.decisions[userId].transactionStatus = 'CHECKING_OUTCOME';
        this.metrics.unresolvedTransactions++;
        this.notify();
      }, 3500);

      setTimeout(() => {
        txn.status = 'CONFIRMED';
        txn.statusHistory.push({ status: 'CONFIRMED', timestamp: Date.now(), note: 'Order confirmed. One order was executed. No duplicate charge.' });
        txn.confirmedAt = Date.now();
        this.scenario.decisions[userId].transactionStatus = 'CONFIRMED';
        if (this.metrics.unresolvedTransactions > 0) this.metrics.unresolvedTransactions--;
        // Set simulated outcome
        const outcomes: Array<'PROFIT' | 'LOSS' | 'FLAT'> = ['PROFIT', 'LOSS', 'LOSS', 'FLAT'];
        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        this.scenario.decisions[userId].simulatedOutcome = outcome;
        this.scenario.decisions[userId].finalPnlSimulated = outcome === 'PROFIT' ? +(Math.random() * 800 + 200).toFixed(0) : outcome === 'LOSS' ? -(Math.random() * 600 + 100).toFixed(0) : 0;
        this.notify();
      }, 6000);
    }

    this.notify();
  }

  // ─── Submit poll influence ───────────────────────────────────────────────────

  public submitPollInfluence(userId: string, influence: PollInfluenceOption) {
    if (this.scenario.decisions[userId]) {
      this.scenario.decisions[userId].pollInfluence = influence;
    }
    if (!this.scenario.pollResults) this.scenario.pollResults = {};
    this.scenario.pollResults[influence] = (this.scenario.pollResults[influence] || 0) + 1;
    this.notify();
  }

  // ─── Reveal surprise event ───────────────────────────────────────────────────

  public revealSurpriseShock() {
    this.scenario.phase = 'SURPRISE_REVEAL';
    this.notify();
  }

  // ─── Submit revision ─────────────────────────────────────────────────────────

  public submitRevision(userId: string, revisedChoice: MemberDecision['initialChoice'], revisedRationale: string) {
    if (this.scenario.decisions[userId]) {
      this.scenario.decisions[userId].revisedChoice = revisedChoice;
      this.scenario.decisions[userId].revisedRationale = revisedRationale;
      this.scenario.decisions[userId].revisedAt = Date.now();
    }
    this.notify();
  }

  // ─── Complete scenario ───────────────────────────────────────────────────────

  public completeScenario(teamId: string) {
    this.scenario.phase = 'COMPLETED';
    const team = this.teams.get(teamId);
    if (team) {
      team.benefits.teamAnalysisReport.isDownloadable = true;
      team.benefits.teamAnalysisReport.summaryMetrics = {
        consensusScore: 72,
        divergenceNotes: 'Two crew members reduced exposure after seeing the preview. Revenue beat influenced initial longs; guidance disappointment drove revisions.',
      };
      team.benefits.sessionToolkit.isDownloadable = true;
    }
    this.notify();
  }

  // ─── Submit guest question ───────────────────────────────────────────────────

  public submitGuestQuestion(teamId: string, questionText: string): { success: boolean; error?: string } {
    const team = this.teams.get(teamId);
    if (!team) return { success: false, error: 'Crew not found.' };
    if (!team.benefits.guestQuestion.unlocked) return { success: false, error: 'Crew Pass must be unlocked to submit a question.' };
    if (team.benefits.guestQuestion.submitted) return { success: false, error: 'Your crew has already submitted its question.' };
    team.benefits.guestQuestion.submitted = true;
    team.benefits.guestQuestion.questionText = questionText;
    team.benefits.guestQuestion.submittedAt = Date.now();
    this.notify();
    return { success: true };
  }

  // ─── Submit feedback ─────────────────────────────────────────────────────────

  public submitFeedback(
    userId: string,
    costsWereClear: boolean | null,
    understoodLiquidation: boolean | null,
    confusingAspects: string,
  ): { success: boolean } {
    this.feedbacks.set(userId, {
      userId,
      costsWereClear,
      understoodLiquidation,
      confusingAspects,
      submittedAt: Date.now(),
    });
    this.metrics.feedbackResponses++;
    this.notify();
    return { success: true };
  }

  // ─── Next-week RSVP ──────────────────────────────────────────────────────────

  public rsvpNextWeek(teamId: string) {
    this.metrics.repeatAttendanceRsvpRate = Math.min(100, this.metrics.repeatAttendanceRsvpRate + 0.5);
    this.notify();
  }

  // ─── Pre-seed demo team ──────────────────────────────────────────────────────

  public initDefaultTeam() {
    const defaultTeamId = 'TEAM-ALPHA';
    const defaultTeam: CrewTeam = {
      id: defaultTeamId,
      code: 'CREW-4821',
      name: 'Midnight Analysts',
      captainId: 'usr-01',
      members: [
        { userId: 'usr-01', name: 'Priya Sharma',  handle: '@priya_trader',   avatar: '👩🏽‍💼', isCaptain: true,  joinedAt: now - 3600000, checkedIn: true,  checkedInAt: now - 600000 },
        { userId: 'usr-02', name: 'Rohan Verma',   handle: '@rohan_quant',    avatar: '👨🏽‍💻', isCaptain: false, joinedAt: now - 3500000, checkedIn: true,  checkedInAt: now - 500000 },
        { userId: 'usr-03', name: 'Aarav Mehta',   handle: '@aarav_macro',    avatar: '👨🏻‍📊', isCaptain: false, joinedAt: now - 3400000, checkedIn: true,  checkedInAt: now - 400000 },
        { userId: 'usr-04', name: 'Simran Kaur',   handle: '@simran_options', avatar: '👩🏻‍🔬', isCaptain: false, joinedAt: now - 3000000, checkedIn: false },
      ],
      isQualified: false,
      benefits: INITIAL_BENEFITS(),
      disconnectionResilient: false,
    };
    this.teams.set(defaultTeamId, defaultTeam);
    ['usr-01', 'usr-02', 'usr-03', 'usr-04'].forEach(id => {
      this.userTeamMap.set(id, defaultTeamId);
      this.reservedUsers.add(id);
    });
    this.event.reservationCount = 4;
    this.metrics.reservationCount = 4;
  }

  // ─── Demo presets ────────────────────────────────────────────────────────────

  public setDemoPreset(preset: '3_CHECKED_IN' | 'UNLOCK_4TH' | 'DISCONNECT_RECONNECT' | 'RESET') {
    if (preset === 'RESET') {
      this.teams.clear();
      this.userTeamMap.clear();
      this.reservedUsers.clear();
      this.scenario = INITIAL_SCENARIO();
      this.metrics = { ...INITIAL_GROWTH_METRICS };
      this.feedbacks.clear();
      this.celebrationTriggered = false;
      this.event = { ...INITIAL_EVENT };
      this.initDefaultTeam();
      this.notify();
      return;
    }

    if (preset === '3_CHECKED_IN') {
      // Reset and re-init so Simran is not checked in
      this.teams.clear();
      this.userTeamMap.clear();
      this.reservedUsers.clear();
      this.initDefaultTeam();
      this.celebrationTriggered = false;
      this.notify();
      return;
    }

    if (preset === 'UNLOCK_4TH') {
      this.checkInMember('TEAM-ALPHA', 'usr-04', this.event.checkInCode);
      return;
    }

    if (preset === 'DISCONNECT_RECONNECT') {
      const team = this.teams.get('TEAM-ALPHA');
      if (team && team.isQualified) {
        team.disconnectionResilient = true;
      }
      this.notify();
      return;
    }
  }
}

export const marketNightEngine = new MarketNightStore();
