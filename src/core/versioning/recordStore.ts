import type {
  TransactionReceipt,
  ContractDefinition,
  OrderSide,
  FeedHealthStatus,
} from '../types/contract';

export interface LessonSimulationRecord {
  lessonId: string;
  lessonTitle: string;
  stepNumber: number;
  explanation: string;
  ruleVersionUsed: string;
  contractId: string;
  calculatedFee: number;
  calculatedInitialMargin: number;
  timestamp: number;
}

export class VersionedRecordStore {
  private receipts: TransactionReceipt[] = [];
  private lessonSimulations: LessonSimulationRecord[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    // Seed initial historical receipts with v1.0.0 rules
    this.seedHistoricalReceipts();
  }

  /**
   * Generates an immutable transaction receipt freezing the exact contract rule snapshot
   */
  public createReceipt(params: {
    contract: ContractDefinition;
    side: OrderSide;
    size: number;
    executionPrice: number;
    leverage: number;
    feedStatus: FeedHealthStatus;
  }): TransactionReceipt {
    const notionalValue = params.size * params.executionPrice;
    const isTaker = true; // market execution
    const feeBps = isTaker ? params.contract.feeSchedule.takerFeeBps : params.contract.feeSchedule.makerFeeBps;
    const feesPaid = notionalValue * (feeBps / 10000);
    const marginCommitted = notionalValue / params.leverage;

    const receiptId = `RCP-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 899 + 100)}`;
    const digestHash = `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    const receipt: TransactionReceipt = {
      receiptId,
      contractId: params.contract.identity.id,
      contractName: params.contract.identity.name,
      timestamp: Date.now(),
      side: params.side,
      size: params.size,
      executionPrice: params.executionPrice,
      notionalValue,
      leverage: params.leverage,
      marginCommitted,
      feesPaid,
      ruleVersionSnapshot: {
        feeSchedule: JSON.parse(JSON.stringify(params.contract.feeSchedule)),
        fundingSchedule: JSON.parse(JSON.stringify(params.contract.fundingSchedule)),
        marginSettings: JSON.parse(JSON.stringify(params.contract.marginSettings)),
      },
      providerSnapshot: {
        providerId: params.contract.priceSource.providerId,
        markPrice: params.executionPrice,
        feedStatusAtExecution: params.feedStatus,
      },
      digestHash,
    };

    // Store at front (latest first)
    this.receipts.unshift(receipt);
    this.notify();
    return receipt;
  }

  public getReceipts(): TransactionReceipt[] {
    // Return deep copy so callers cannot mutate historical receipts
    return JSON.parse(JSON.stringify(this.receipts));
  }

  public getLessonSimulations(): LessonSimulationRecord[] {
    return JSON.parse(JSON.stringify(this.lessonSimulations));
  }

  public addLessonSimulation(lesson: LessonSimulationRecord): void {
    this.lessonSimulations.unshift(lesson);
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  private seedHistoricalReceipts() {
    // Historical transaction minted under v1.0.0 rules
    this.receipts.push({
      receiptId: 'RCP-HIST-V1-001',
      contractId: 'AERO-PERP',
      contractName: 'AeroTech High-Growth Perpetual',
      timestamp: Date.now() - 3600 * 1000 * 24, // 1 day ago
      side: 'buy',
      size: 5.0,
      executionPrice: 138.20,
      notionalValue: 691.00,
      leverage: 10,
      marginCommitted: 69.10,
      feesPaid: 0.3455, // 5 bps taker fee
      ruleVersionSnapshot: {
        feeSchedule: {
          ruleVersion: 'v1.0.0',
          makerFeeBps: 2,
          takerFeeBps: 5,
          settlementFeeBps: 0,
          rebateEligible: true,
        },
        fundingSchedule: {
          ruleVersion: 'v1.0.0',
          intervalHours: 8,
          capRateBps: 75,
          floorRateBps: -75,
          currentRateBps: 12,
          nextFundingTimestamp: Date.now() - 3600 * 1000 * 16,
        },
        marginSettings: {
          mode: 'isolated',
          initialMarginPct: 0.05,
          maintenanceMarginPct: 0.025,
          maxLeverage: 20,
        },
      },
      providerSnapshot: {
        providerId: 'mocha_pyth_oracle',
        markPrice: 138.20,
        feedStatusAtExecution: 'live',
      },
      digestHash: '0x9a8f3b4c1e2d7f805a6b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f',
    });

    // Seed historical lesson simulation
    this.lessonSimulations.push({
      lessonId: 'LESSON-FUNDING-101',
      lessonTitle: 'First-Trade Understanding: How Funding Impacts Carry',
      stepNumber: 1,
      explanation: 'Under v1.0.0 rules, 8-hour funding intervals at 12 bps cost Longs $0.12 per $1000 notional.',
      ruleVersionUsed: 'v1.0.0',
      contractId: 'AERO-PERP',
      calculatedFee: 0.50,
      calculatedInitialMargin: 50.0,
      timestamp: Date.now() - 3600 * 1000 * 12,
    });
  }
}

export const globalRecordStore = new VersionedRecordStore();
