/**
 * MochaTrade Contract Catalogue & Calculation Engine Types
 * Based on Prototype Brief: Scalability through Validated Contract Rules
 */

export type MarketType = 'perpetual' | 'dated_futures' | 'spot_margin';
export type MarginModeType = 'isolated' | 'cross';
export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit';

export interface InstrumentIdentity {
  id: string;              // e.g. 'AERO-PERP'
  symbol: string;          // e.g. 'AERO/USD-PERP'
  name: string;            // e.g. 'AeroTech Volatility Perpetual'
  marketType: MarketType;
  baseAsset: string;       // e.g. 'AERO'
  quoteAsset: string;      // e.g. 'USD'
  description: string;
}

export interface PriceSource {
  providerId: string;      // e.g. 'pyth_network' | 'chainlink_direct'
  feedSymbol: string;      // e.g. 'AERO/USD'
  maxHeartbeatSec: number; // e.g. 15
  fallbackPolicy: 'halt_trading' | 'use_twap' | 'manual_settlement';
}

export interface ContractPrecision {
  priceDecimals: number;   // e.g. 2
  sizeDecimals: number;    // e.g. 4
  tickSize: number;        // e.g. 0.01
  minOrderSize: number;    // e.g. 0.1
  maxOrderSize: number;    // e.g. 100000
}

export interface FeeSchedule {
  ruleVersion: string;     // e.g. 'v1.0.0'
  makerFeeBps: number;     // basis points, e.g. 2 = 0.02%
  takerFeeBps: number;     // basis points, e.g. 5 = 0.05%
  settlementFeeBps: number;
  rebateEligible: boolean;
}

export interface FundingSchedule {
  ruleVersion: string;     // e.g. 'v1.0.0'
  intervalHours: number;   // e.g. 8 or 4
  capRateBps: number;      // max funding cap in bps, e.g. 50 (0.5%)
  floorRateBps: number;    // min funding floor in bps, e.g. -50 (-0.5%)
  currentRateBps: number;  // current active funding rate in bps
  nextFundingTimestamp: number;
}

export interface MarginSettings {
  mode: MarginModeType;
  initialMarginPct: number;      // e.g. 0.05 for 20x max leverage
  maintenanceMarginPct: number;  // e.g. 0.025 (must be strictly < initialMarginPct)
  maxLeverage: number;           // e.g. 20
}

export interface SupportedActions {
  canOpenLong: boolean;
  canOpenShort: boolean;
  canMarket: boolean;
  canLimit: boolean;
  canStopLoss: boolean;
}

export interface ContractDefinition {
  identity: InstrumentIdentity;
  priceSource: PriceSource;
  precision: ContractPrecision;
  feeSchedule: FeeSchedule;
  fundingSchedule: FundingSchedule;
  marginSettings: MarginSettings;
  supportedActions: SupportedActions;
  status: 'active' | 'draft' | 'deprecated';
  lastValidatedAt: string;
}

export type FeedHealthStatus = 'live' | 'degraded' | 'interrupted';

export interface ProviderQuote {
  providerId: string;
  symbol: string;
  bid: number;
  ask: number;
  markPrice: number;
  lastUpdated: number;
  status: FeedHealthStatus;
  statusReason?: string;
}

export interface OrderPreviewRequest {
  contractId: string;
  side: OrderSide;
  type: OrderType;
  size: number;
  limitPrice?: number;
  leverage: number;
}

export interface OrderCalculationResult {
  contractId: string;
  ruleVersion: {
    feeVersion: string;
    fundingVersion: string;
  };
  entryPrice: number;
  size: number;
  notionalValue: number;
  requiredInitialMargin: number;
  requiredMaintenanceMargin: number;
  leverage: number;
  estimatedFee: number;
  feeType: 'taker' | 'maker';
  projectedFundingCostPerInterval: number;
  estimatedLiquidationPrice: number;
  distanceToLiquidationPct: number;
  accountHealthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'UNAVAILABLE';
  healthExplanation: string;
}

export interface TransactionReceipt {
  receiptId: string;
  contractId: string;
  contractName: string;
  timestamp: number;
  side: OrderSide;
  size: number;
  executionPrice: number;
  notionalValue: number;
  leverage: number;
  marginCommitted: number;
  feesPaid: number;
  ruleVersionSnapshot: {
    feeSchedule: FeeSchedule;
    fundingSchedule: FundingSchedule;
    marginSettings: MarginSettings;
  };
  providerSnapshot: {
    providerId: string;
    markPrice: number;
    feedStatusAtExecution: FeedHealthStatus;
  };
  digestHash: string;
}

export interface Position {
  id: string;
  contractId: string;
  side: OrderSide;
  size: number;
  entryPrice: number;
  currentMarkPrice: number;
  leverage: number;
  marginAllocated: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  liquidationPrice: number;
  fundingAccrued: number;
  marginHealthRatio: number; // Equity / Maintenance Margin
}
