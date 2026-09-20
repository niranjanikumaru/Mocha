export type UserRole = 'CAPTAIN' | 'MEMBER' | 'SOLO';

export interface MarketNightUser {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  email: string;
  role: UserRole;
  isTestAccount: boolean;
}

export type EventStatus = 'UPCOMING' | 'CHECKIN_OPEN' | 'LIVE_SCENARIO' | 'DEBRIEF' | 'COMPLETED';

export interface MarketNightEvent {
  id: string;
  title: string;
  theme: string;
  description: string;
  scheduledTime: number;          // Timestamp of event start
  checkInWindowStart: number;     // Window opens 15m before
  checkInWindowEnd: number;       // Window closes 45m after start
  status: EventStatus;
  minCrewSize: number;            // 4 members
}

export interface TeamMember {
  userId: string;
  name: string;
  handle: string;
  avatar: string;
  isCaptain: boolean;
  joinedAt: number;
  checkedIn: boolean;
  checkedInAt?: number;
}

export interface BenefitBundle {
  exclusiveScenario: {
    unlocked: boolean;
    unlockedAt?: number;
    scenarioId: string;
    title: string;
    description: string;
  };
  teamAnalysisReport: {
    unlocked: boolean;
    unlockedAt?: number;
    isDownloadable: boolean;     // Available after scenario completion
    summaryMetrics?: {
      consensusScore: number;     // e.g. 75%
      divergenceNotes: string;
    };
  };
  guestQuestion: {
    unlocked: boolean;
    unlockedAt?: number;
    submitted: boolean;
    questionText?: string;
    submittedAt?: number;
    disclaimer: string;
  };
}

export interface CrewTeam {
  id: string;
  code: string;                  // e.g. 'CREW-8492'
  name: string;
  captainId: string;
  members: TeamMember[];
  isQualified: boolean;          // Exactly 4 distinct checked in
  qualifiedAt?: number;
  benefits: BenefitBundle;
  disconnectionResilient: boolean; // Once qualified, remains true
}

export type ScenarioPhase = 'PRIVATE_DECISION' | 'SURPRISE_REVEAL' | 'REVISION_DEBRIEF' | 'COMPLETED';

export interface MemberDecision {
  userId: string;
  userName: string;
  initialChoice: 'LONG_MOMENTUM' | 'SHORT_HEDGE' | 'DE_RISK_CASH';
  initialRationale: string;
  revisedChoice?: 'LONG_MOMENTUM' | 'SHORT_HEDGE' | 'DE_RISK_CASH';
  revisedRationale?: string;
  submittedAt: number;
  revisedAt?: number;
}

export interface MarketScenario {
  id: string;
  title: string;
  ticker: string;
  underlyingAsset: string;
  initialPrice: number;
  catalystHeadline: string;
  surpriseEventHeadline: string;
  shockPrice: number;
  decisions: Record<string, MemberDecision>; // Keyed by userId
  phase: ScenarioPhase;
}

export interface GrowthMetrics {
  invitationsSent: number;
  totalJoined: number;
  checkedInCount: number;
  teamsFormed: number;
  teamsQualified: number;
  inviteToAttendanceRate: number; // e.g. 78.4%
  teamCompletionRate: number;      // e.g. 68.2%
  benefitUsageRate: number;        // e.g. 91.5%
  repeatAttendanceRsvpRate: number;// e.g. 64.0%
  costPerReturningTrader: number;  // $2.40 vs $28.00 traditional CAC
}
