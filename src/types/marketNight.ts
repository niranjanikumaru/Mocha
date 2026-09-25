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
  scheduledTime: number;
  checkInWindowStart: number;
  checkInWindowEnd: number;
  status: EventStatus;
  minCrewSize: number;
  hostName: string;
  checkInCode: string;      // 6-char code displayed by host at event
  reservationCount: number;
  hostingCostINR: number;
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
  workshopAccess: {
    unlocked: boolean;
    unlockedAt?: number;
    title: string;
    description: string;
  };
  sessionToolkit: {
    unlocked: boolean;
    unlockedAt?: number;
    isDownloadable: boolean;
    items: string[];
  };
  replayAccess: {
    unlocked: boolean;
    unlockedAt?: number;
    availableAfterSession: boolean;
  };
  // Legacy names kept for backward compat
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
    isDownloadable: boolean;
    summaryMetrics?: {
      consensusScore: number;
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
  code: string;
  name: string;
  captainId: string;
  members: TeamMember[];
  isQualified: boolean;
  qualifiedAt?: number;
  benefits: BenefitBundle;
  disconnectionResilient: boolean;
}

export type ScenarioPhase =
  | 'PRIVATE_DECISION'
  | 'SURPRISE_REVEAL'
  | 'REVISION_DEBRIEF'
  | 'COMPLETED';

export type PollInfluenceOption =
  | 'MARKET_VIEW'
  | 'POSITION_EXPOSURE'
  | 'TRADING_COSTS'
  | 'LIQUIDATION_RISK'
  | 'INSUFFICIENT_INFO';

export type TransactionStatus =
  | 'AWAITING_APPROVAL'
  | 'SUBMITTED'
  | 'CHECKING_OUTCOME'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'UNCERTAIN';

export interface TransactionRecord {
  ref: string;
  status: TransactionStatus;
  statusHistory: { status: TransactionStatus; timestamp: number; note?: string }[];
  confirmedAt?: number;
  rejectedReason?: string;
  isDuplicate: boolean;
}

export interface MemberDecision {
  userId: string;
  userName: string;
  initialChoice: 'LONG_MOMENTUM' | 'SHORT_HEDGE' | 'DE_RISK_CASH' | 'SIT_OUT';
  initialRationale: string;
  simulatedMargin?: number;
  simulatedLeverage?: number;
  previewCompleted?: boolean;
  pollInfluence?: PollInfluenceOption;
  revisedChoice?: 'LONG_MOMENTUM' | 'SHORT_HEDGE' | 'DE_RISK_CASH' | 'SIT_OUT';
  revisedRationale?: string;
  submittedAt: number;
  revisedAt?: number;
  transactionRef?: string;
  transactionStatus?: TransactionStatus;
  simulatedOutcome?: 'PROFIT' | 'LOSS' | 'FLAT';
  finalPnlSimulated?: number;
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
  decisions: Record<string, MemberDecision>;
  transactions: Record<string, TransactionRecord>;
  phase: ScenarioPhase;
  pollResults?: Partial<Record<PollInfluenceOption, number>>;
}

export interface FeedbackRecord {
  userId: string;
  costsWereClear: boolean | null;
  understoodLiquidation: boolean | null;
  confusingAspects: string;
  submittedAt: number;
}

export interface GrowthMetrics {
  // Observed demo telemetry
  reservationCount: number;
  attendeeCount: number;
  completedCrews: number;
  benefitsIssued: number;
  eventCostINR: number;
  previewCompletions: number;
  simulatedDecisions: number;
  unresolvedTransactions: number;
  feedbackResponses: number;
  // Growth loop stats
  invitationsSent: number;
  totalJoined: number;
  checkedInCount: number;
  teamsFormed: number;
  teamsQualified: number;
  inviteToAttendanceRate: number;
  teamCompletionRate: number;
  benefitUsageRate: number;
  repeatAttendanceRsvpRate: number;
  costPerReturningTrader: number;
}

export interface FounderProjectionInputs {
  eventsPerMonth: number;
  capacityPerEvent: number;
  attendanceRate: number;
  newUserSharePct: number;
  newToFirstTradePct: number;
  monthlyRetentionPct: number;
  serviceFeeINR: number;
  eventCostPerSessionINR: number;
  benefitCostPerCrewINR: number;
  paidAcquisitionBudgetINR: number;
  paidCACINR: number;
}
