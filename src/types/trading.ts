export type ContractSymbol = 'NVDA-PERP' | 'AAPL-PERP' | 'TSLA-PERP' | 'MSFT-PERP' | 'GOOGL-PERP';

export interface ContractDefinition {
  symbol: ContractSymbol;
  underlyingName: string;
  underlyingTicker: string;
  contractType: 'PERPETUAL_INVERSE_OR_LINEAR';
  description: string;
  multiplier: number; // usually 1 contract = 1 share equivalent
  tickSize: number;
  maxLeverage: number;
  maintenanceMarginRate: number; // e.g. 0.05 for 5%
  baseFundingRate8h: number; // e.g. +0.0001 (0.01%)
  takerFeeRate: number; // e.g. 0.0005 (0.05%)
  inrUsdConversionSpread: number; // e.g. 0.0025 (0.25%)
}

export type MarginHealthStatus = 
  | 'COMFORTABLE_BUFFER' 
  | 'REDUCED_BUFFER' 
  | 'NEAR_LIQUIDATION' 
  | 'DATA_STALE';

export interface MarginMetrics {
  equity: number; // USD
  allocatedMargin: number; // USD Initial margin
  maintenanceMargin: number; // USD
  liquidationPrice: number; // USD
  bufferRatio: number; // (Equity - MM) / IM
  bufferPercentage: number; // e.g. 48.5%
  status: MarginHealthStatus;
  statusLabel: string;
  unrealizedPnL: number; // USD
  unrealizedPnLPercent: number; // %
  accruedFundingFee: number; // USD
  notionalValue: number; // USD (Position Size * Mark Price)
  leverage: number;
  changeExplanation: string;
  distanceToLiquidationPercent: number;
}

export interface AdverseScenarioResult {
  priceDropPercent: number;
  simulatedMarkPrice: number;
  projectedEquity: number;
  projectedBufferRatio: number;
  projectedStatus: MarginHealthStatus;
  lossUsd: number;
  lossInr: number;
}

export type OrderSide = 'BUY' | 'SELL';
export type PositionSide = 'LONG' | 'SHORT';

export type OrderExecutionStatus = 
  | 'IDLE'
  | 'SUBMITTING'
  | 'ACK_LOST_PENDING_RECON'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELLED'
  | 'REJECTED';

export interface OrderStateRecord {
  requestId: string;
  idempotencyKey: string;
  symbol: ContractSymbol;
  side: OrderSide;
  orderType: 'MARKET' | 'LIMIT';
  requestedQty: number;
  filledQty: number;
  remainingQty: number;
  avgFillPrice: number;
  status: OrderExecutionStatus;
  timestampSent: number;
  timestampAcked?: number;
  lastVenueTimestamp?: number;
  isSimulatedFailure: boolean;
  failureReason?: string;
  venueOrderId?: string;
  auditTrail: AuditLogEntry[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  stage: string;
  details: string;
  payload?: Record<string, unknown>;
}

export interface Position {
  id: string;
  symbol: ContractSymbol;
  side: PositionSide;
  quantity: number; // open contracts
  originalQuantity: number;
  entryPrice: number; // USD
  markPrice: number; // USD
  leverage: number;
  allocatedMargin: number; // USD
  currency: 'USD';
  openedAt: number;
  isSimulated: boolean;
}

export interface UserAccountBalance {
  totalEquityUsd: number;
  availableUsd: number;
  committedMarginUsd: number;
  unrealizedPnLUsd: number;
  inrExchangeRate: number; // e.g. 86.85
  depositProcessedKeys: string[];
}

export interface PaymentWebhookPayload {
  paymentId: string;
  idempotencyKey: string;
  amountInr: number;
  amountUsd: number;
  senderName: string;
  bankRef: string;
  timestamp: number;
}

export interface PostTradeSurvey {
  rating: 'CONFIDENT' | 'CLEAR' | 'SURPRISED' | 'CONFUSED';
  surpriseNotes: string;
  category: 'MARGIN_BUFFER' | 'EXECUTION_LATENCY' | 'FEES' | 'RECONCILIATION' | 'OTHER';
  supportTicketCreated: boolean;
  ticketId?: string;
}
