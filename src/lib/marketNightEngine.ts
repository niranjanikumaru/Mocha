import {
  MarketNightUser, MarketNightEvent, CrewTeam, BenefitBundle,
  MarketScenario, MemberDecision, GrowthMetrics
} from '../types/marketNight';

export const TEST_USERS: MarketNightUser[] = [
  {
    id: 'usr-01',
    name: 'Priya Sharma',
    handle: '@priya_trader',
    avatar: '👩🏽‍💼',
    email: 'priya@example.com',
    role: 'CAPTAIN',
    isTestAccount: true,
  },
  {
    id: 'usr-02',
    name: 'Rohan Verma',
    handle: '@rohan_quant',
    avatar: '👨🏽‍💻',
    email: 'rohan@example.com',
    role: 'MEMBER',
    isTestAccount: true,
  },
  {
    id: 'usr-03',
    name: 'Aarav Mehta',
    handle: '@aarav_macro',
    avatar: '👨🏽‍💼',
    email: 'aarav@example.com',
    role: 'MEMBER',
    isTestAccount: true,
  },
  {
    id: 'usr-04',
    name: 'Simran Kaur',
    handle: '@simran_options',
    avatar: '👩🏽‍🎨',
    email: 'simran@example.com',
    role: 'MEMBER',
    isTestAccount: true,
  },
  {
    id: 'usr-05',
    name: 'Kunal Sen (Solo)',
    handle: '@kunal_solo',
    avatar: '🧑🏽‍🎓',
    email: 'kunal@example.com',
    role: 'SOLO',
    isTestAccount: true,
  },
];

// Initial mock event scheduled for tonight
const now = Date.now();
export const INITIAL_EVENT: MarketNightEvent = {
  id: 'EVT-FRI-0920',
  title: "Friday's Mocha Market Night",
  theme: 'US Tech Earnings & Overnight Volatility Shock',
  description: 'Team up with 4 traders to stress-test your risk hypotheses during after-hours market turbulence.',
  scheduledTime: now + 1000 * 60 * 30, // 30 minutes from now
  checkInWindowStart: now - 1000 * 60 * 15, // Window is open now for prototype
  checkInWindowEnd: now + 1000 * 60 * 120, // Closes in 2 hours
  status: 'CHECKIN_OPEN',
  minCrewSize: 4,
};

export const INITIAL_BENEFITS: BenefitBundle = {
  exclusiveScenario: {
    unlocked: false,
    scenarioId: 'SCENARIO-NVDA-SHOCK',
    title: 'NVIDIA Q3 Earnings Surprise & AI Chip Export Freeze',
    description: 'An exclusive multi-phase simulation revealed live: Navigate sudden 12% aftermarket swings with asymmetric options pricing.',
  },
  teamAnalysisReport: {
    unlocked: false,
    isDownloadable: false,
    summaryMetrics: {
      consensusScore: 0,
      divergenceNotes: 'Awaiting team participation and revisions.',
    },
  },
  guestQuestion: {
    unlocked: false,
    submitted: false,
    disclaimer: 'Each completed team may submit one curated question for our fortnightly Wall Street guest session. Selected questions will be answered live on stream.',
  },
};

export const INITIAL_SCENARIO: MarketScenario = {
  id: 'SCENARIO-NVDA-SHOCK',
  title: 'NVDA After-Hours Earnings + Geopolitical Export Freeze',
  ticker: 'NVDA-PERP',
  underlyingAsset: 'NVIDIA Corp.',
  initialPrice: 122.50,
  catalystHeadline: 'Q3 Revenue beats estimates by 18%, but after-hours remarks flag potential tightening on Asian enterprise shipments.',
  surpriseEventHeadline: 'BREAKING: Regulatory Bureau issues immediate export restriction guidelines for high-bandwidth AI hardware.',
  shockPrice: 109.80, // −10.4% drop
  phase: 'PRIVATE_DECISION',
  decisions: {},
};

export const INITIAL_GROWTH_METRICS: GrowthMetrics = {
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

// ── In-memory state singleton for robust prototype simulation ──
class MarketNightStore {
  private event: MarketNightEvent = { ...INITIAL_EVENT };
  private teams: Map<string, CrewTeam> = new Map();
  private userTeamMap: Map<string, string> = new Map(); // userId -> teamId (1 team per user rule)
  private scenario: MarketScenario = { ...INITIAL_SCENARIO };
  private metrics: GrowthMetrics = { ...INITIAL_GROWTH_METRICS };
  private listeners: Set<() => void> = new Set();
  public lastUnlockedAt: number | null = null;
  public celebrationTriggered: boolean = false;

  constructor() {
    this.initDefaultTeam();
  }

  // Pre-seed the demo team "Alpha Quant Crew" with 3 members checked in
  public initDefaultTeam() {
    const defaultTeamId = 'TEAM-ALPHA';
    const defaultTeam: CrewTeam = {
      id: defaultTeamId,
      code: 'CREW-4821',
      name: 'Alpha Quant Crew',
      captainId: 'usr-01',
      members: [
        {
          userId: 'usr-01',
          name: 'Priya Sharma',
          handle: '@priya_trader',
          avatar: '👩🏽‍💼',
          isCaptain: true,
          joinedAt: now - 3600000,
          checkedIn: true,
          checkedInAt: now - 600000,
        },
        {
          userId: 'usr-02',
          name: 'Rohan Verma',
          handle: '@rohan_quant',
          avatar: '👨🏽‍💻',
          isCaptain: false,
          joinedAt: now - 3500000,
          checkedIn: true,
          checkedInAt: now - 500000,
        },
        {
          userId: 'usr-03',
          name: 'Aarav Mehta',
          handle: '@aarav_macro',
          avatar: '👨🏽‍💼',
          isCaptain: false,
          joinedAt: now - 3400000,
          checkedIn: true,
          checkedInAt: now - 400000,
        },
        {
          userId: 'usr-04',
          name: 'Simran Kaur',
          handle: '@simran_options',
          avatar: '👩🏽‍🎨',
          isCaptain: false,
          joinedAt: now - 3000000,
          checkedIn: false, // 4th member joined but NOT checked in yet! Perfect for demo!
        },
      ],
      isQualified: false,
      disconnectionResilient: false,
      benefits: {
        exclusiveScenario: { ...INITIAL_BENEFITS.exclusiveScenario },
        teamAnalysisReport: { ...INITIAL_BENEFITS.teamAnalysisReport },
        guestQuestion: { ...INITIAL_BENEFITS.guestQuestion },
      },
    };

    this.teams.set(defaultTeamId, defaultTeam);
    this.userTeamMap.set('usr-01', defaultTeamId);
    this.userTeamMap.set('usr-02', defaultTeamId);
    this.userTeamMap.set('usr-03', defaultTeamId);
    this.userTeamMap.set('usr-04', defaultTeamId);
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => { this.listeners.delete(cb); };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public getEvent(): MarketNightEvent {
    return { ...this.event };
  }

  public getTeam(teamId: string): CrewTeam | undefined {
    return this.teams.get(teamId);
  }

  public getTeamByCode(code: string): CrewTeam | undefined {
    for (const team of this.teams.values()) {
      if (team.code.toUpperCase() === code.trim().toUpperCase()) {
        return team;
      }
    }
    return undefined;
  }

  public getUserTeam(userId: string): CrewTeam | undefined {
    const teamId = this.userTeamMap.get(userId);
    return teamId ? this.teams.get(teamId) : undefined;
  }

  public getScenario(): MarketScenario {
    return { ...this.scenario };
  }

  public getMetrics(): GrowthMetrics {
    return { ...this.metrics };
  }

  // ── 1. Create a Team ──
  public createTeam(captain: MarketNightUser, teamName: string): { success: boolean; team?: CrewTeam; error?: string } {
    if (this.userTeamMap.has(captain.id)) {
      return { success: false, error: 'You are already in a team for this event. One team per user allowed.' };
    }

    const teamId = 'TEAM-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    const code = 'CREW-' + Math.floor(1000 + Math.random() * 9000);
    const newTeam: CrewTeam = {
      id: teamId,
      code,
      name: teamName || `${captain.name}'s Crew`,
      captainId: captain.id,
      members: [
        {
          userId: captain.id,
          name: captain.name,
          handle: captain.handle,
          avatar: captain.avatar,
          isCaptain: true,
          joinedAt: Date.now(),
          checkedIn: false,
        },
      ],
      isQualified: false,
      disconnectionResilient: false,
      benefits: {
        exclusiveScenario: { ...INITIAL_BENEFITS.exclusiveScenario },
        teamAnalysisReport: { ...INITIAL_BENEFITS.teamAnalysisReport },
        guestQuestion: { ...INITIAL_BENEFITS.guestQuestion },
      },
    };

    this.teams.set(teamId, newTeam);
    this.userTeamMap.set(captain.id, teamId);
    this.metrics.teamsFormed += 1;
    this.metrics.totalJoined += 1;
    this.notify();
    return { success: true, team: newTeam };
  }

  // ── 2. Join a Team ──
  public joinTeam(code: string, user: MarketNightUser): { success: boolean; team?: CrewTeam; error?: string } {
    if (this.userTeamMap.has(user.id)) {
      const existingTeam = this.teams.get(this.userTeamMap.get(user.id)!);
      if (existingTeam && existingTeam.code === code.toUpperCase()) {
        return { success: true, team: existingTeam }; // Already in this team
      }
      return { success: false, error: 'One account can qualify with only one team per event.' };
    }

    const team = this.getTeamByCode(code);
    if (!team) {
      return { success: false, error: 'Invalid Crew Code. Please check the 4-digit code.' };
    }

    if (team.members.length >= 4) {
      return { success: false, error: 'This Crew is already full (4/4 members).' };
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
    this.metrics.totalJoined += 1;
    this.notify();
    return { success: true, team };
  }

  // ── 3. Check In (Atomic 4th Check-in Unlocks Crew Pass) ──
  public checkInMember(teamId: string, userId: string): {
    success: boolean;
    unlockedNow: boolean;
    checkedInCount: number;
    error?: string;
  } {
    const team = this.teams.get(teamId);
    if (!team) return { success: false, unlockedNow: false, checkedInCount: 0, error: 'Team not found' };

    // Confirm check-in window is open
    const curTime = Date.now();
    if (curTime < this.event.checkInWindowStart || curTime > this.event.checkInWindowEnd) {
      return { success: false, unlockedNow: false, checkedInCount: 0, error: 'Check-in window is currently closed.' };
    }

    // Confirm account belongs to team
    const member = team.members.find((m) => m.userId === userId);
    if (!member) {
      return { success: false, unlockedNow: false, checkedInCount: 0, error: 'User does not belong to this team.' };
    }

    // Idempotency: If already checked in, don't duplicate
    if (member.checkedIn) {
      const checkedInCount = team.members.filter((m) => m.checkedIn).length;
      return { success: true, unlockedNow: false, checkedInCount };
    }

    // Mark checked in
    member.checkedIn = true;
    member.checkedInAt = curTime;
    this.metrics.checkedInCount += 1;

    // Count distinct checked in members
    const checkedInMembers = team.members.filter((m) => m.checkedIn);
    const checkedInCount = checkedInMembers.length;

    let unlockedNow = false;

    // ATOMIC 4TH CHECK-IN RULE:
    // If exactly 4 distinct signed-in accounts checked in, grant the Crew Pass bundle once!
    if (checkedInCount >= 4 && !team.isQualified) {
      team.isQualified = true;
      team.qualifiedAt = curTime;
      team.disconnectionResilient = true; // Benefits persist even after brief disconnects

      // Unlock all 3 free benefits
      team.benefits.exclusiveScenario.unlocked = true;
      team.benefits.exclusiveScenario.unlockedAt = curTime;

      team.benefits.teamAnalysisReport.unlocked = true;
      team.benefits.teamAnalysisReport.unlockedAt = curTime;

      team.benefits.guestQuestion.unlocked = true;
      team.benefits.guestQuestion.unlockedAt = curTime;

      this.lastUnlockedAt = curTime;
      this.celebrationTriggered = true;
      this.metrics.teamsQualified += 1;
      unlockedNow = true;
    }

    this.notify();
    return { success: true, unlockedNow, checkedInCount };
  }

  // ── 4. Solo Teammate Matching Queue ──
  public matchSoloAttendee(user: MarketNightUser): { success: boolean; team: CrewTeam } {
    // Find an open team with < 4 members
    for (const team of this.teams.values()) {
      if (team.members.length < 4) {
        team.members.push({
          userId: user.id,
          name: user.name,
          handle: user.handle,
          avatar: user.avatar,
          isCaptain: false,
          joinedAt: Date.now(),
          checkedIn: true, // Auto check-in when matched
          checkedInAt: Date.now(),
        });
        this.userTeamMap.set(user.id, team.id);
        this.notify();
        return { success: true, team };
      }
    }

    // If no team available, create a "Solo Matched Crew"
    const createRes = this.createTeam(user, 'Velocity Syndicate');
    const team = createRes.team!;
    team.members[0].checkedIn = true;
    team.members[0].checkedInAt = Date.now();
    this.notify();
    return { success: true, team };
  }

  // ── 5. Scenario Decision Phase ──
  public submitPrivateDecision(
    teamId: string,
    userId: string,
    userName: string,
    choice: MemberDecision['initialChoice'],
    rationale: string
  ) {
    this.scenario.decisions[userId] = {
      userId,
      userName,
      initialChoice: choice,
      initialRationale: rationale,
      submittedAt: Date.now(),
    };
    this.notify();
  }

  public revealSurpriseShock() {
    this.scenario.phase = 'SURPRISE_REVEAL';
    this.notify();
  }

  public submitRevision(
    userId: string,
    revisedChoice: MemberDecision['initialChoice'],
    revisedRationale: string
  ) {
    if (this.scenario.decisions[userId]) {
      this.scenario.decisions[userId].revisedChoice = revisedChoice;
      this.scenario.decisions[userId].revisedRationale = revisedRationale;
      this.scenario.decisions[userId].revisedAt = Date.now();
    }
    this.notify();
  }

  public completeScenario(teamId: string) {
    this.scenario.phase = 'COMPLETED';
    const team = this.teams.get(teamId);
    if (team) {
      // Unlocked report becomes downloadable now
      team.benefits.teamAnalysisReport.isDownloadable = true;
      team.benefits.teamAnalysisReport.summaryMetrics = {
        consensusScore: 75,
        divergenceNotes: 'Strong consensus on protective hedging during the surprise export restriction announcement.',
      };
    }
    this.notify();
  }

  // ── 6. Guest Question Submission ──
  public submitGuestQuestion(teamId: string, questionText: string): { success: boolean; error?: string } {
    const team = this.teams.get(teamId);
    if (!team) return { success: false, error: 'Team not found' };
    if (!team.benefits.guestQuestion.unlocked) {
      return { success: false, error: 'Crew Pass must be unlocked to submit a question.' };
    }
    if (team.benefits.guestQuestion.submitted) {
      return { success: false, error: 'Your team has already submitted your 1 allocated question.' };
    }

    team.benefits.guestQuestion.submitted = true;
    team.benefits.guestQuestion.questionText = questionText;
    team.benefits.guestQuestion.submittedAt = Date.now();
    this.notify();
    return { success: true };
  }

  // ── 7. Next-Event RSVP ──
  public rsvpNextWeek(teamId: string) {
    this.metrics.repeatAttendanceRsvpRate = Math.min(100, this.metrics.repeatAttendanceRsvpRate + 0.5);
    this.notify();
  }

  // ── 8. Judge Demo Presets ──
  public setDemoPreset(preset: '3_CHECKED_IN' | 'UNLOCK_4TH' | 'DISCONNECT_RECONNECT' | 'RESET') {
    if (preset === 'RESET') {
      this.teams.clear();
      this.userTeamMap.clear();
      this.initDefaultTeam();
      this.scenario = { ...INITIAL_SCENARIO, decisions: {} };
      this.celebrationTriggered = false;
      this.notify();
      return;
    }

    if (preset === '3_CHECKED_IN') {
      this.initDefaultTeam();
      const team = this.teams.get('TEAM-ALPHA');
      if (team) {
        team.isQualified = false;
        team.members[3].checkedIn = false; // Simran NOT checked in
        team.benefits.exclusiveScenario.unlocked = false;
        team.benefits.teamAnalysisReport.unlocked = false;
        team.benefits.guestQuestion.unlocked = false;
      }
      this.celebrationTriggered = false;
      this.notify();
      return;
    }

    if (preset === 'UNLOCK_4TH') {
      this.checkInMember('TEAM-ALPHA', 'usr-04'); // Simran checks in!
      return;
    }

    if (preset === 'DISCONNECT_RECONNECT') {
      // Simulates a user reconnecting after qualification
      const team = this.teams.get('TEAM-ALPHA');
      if (team && team.isQualified) {
        // Keeps benefits intact
        team.disconnectionResilient = true;
      }
      this.notify();
      return;
    }
  }
}

// Export singleton instance
export const marketNightEngine = new MarketNightStore();
