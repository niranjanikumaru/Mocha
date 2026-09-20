import type {
  ContractDefinition,
  OrderCalculationResult,
  OrderPreviewRequest,
  FeedHealthStatus,
} from '../types/contract';

export interface AccountContext {
  equity: number;
  availableBalance: number;
}

export class PerpetualCalculator {
  /**
   * Calculates detailed order costs, margins, liquidation price and health for preview.
   */
  public static calculateOrderPreview(
    contract: ContractDefinition,
    request: OrderPreviewRequest,
    currentMarkPrice: number,
    feedStatus: FeedHealthStatus,
    account: AccountContext
  ): OrderCalculationResult {
    const entryPrice = request.type === 'limit' && request.limitPrice ? request.limitPrice : currentMarkPrice;
    const notionalValue = request.size * entryPrice;

    // Constrain leverage to contract limits
    const leverage = Math.min(Math.max(1, request.leverage), contract.marginSettings.maxLeverage);
    const initialMarginPct = 1 / leverage;
    const maintenanceMarginPct = contract.marginSettings.maintenanceMarginPct;

    const requiredInitialMargin = notionalValue * initialMarginPct;
    const requiredMaintenanceMargin = notionalValue * maintenanceMarginPct;

    // Fees calculation
    const isTaker = request.type === 'market';
    const feeBps = isTaker ? contract.feeSchedule.takerFeeBps : contract.feeSchedule.makerFeeBps;
    const estimatedFee = notionalValue * (feeBps / 10000);

    // Funding projection for one funding cycle
    // Rate in bps: 10 bps = 0.10% = 0.001
    const fundingRateFraction = contract.fundingSchedule.currentRateBps / 10000;
    // Long pays when rate > 0; Short pays when rate < 0
    const fundingMultiplier = request.side === 'buy' ? fundingRateFraction : -fundingRateFraction;
    const projectedFundingCostPerInterval = notionalValue * fundingMultiplier;

    // Liquidation Price calculation:
    // Long: entryPrice * (1 - initialMarginPct + maintenanceMarginPct)
    // Short: entryPrice * (1 + initialMarginPct - maintenanceMarginPct)
    let estimatedLiquidationPrice: number;
    let distanceToLiquidationPct: number;

    if (request.side === 'buy') {
      estimatedLiquidationPrice = entryPrice * (1 - initialMarginPct + maintenanceMarginPct);
      distanceToLiquidationPct = entryPrice > 0 ? ((entryPrice - estimatedLiquidationPrice) / entryPrice) * 100 : 0;
    } else {
      estimatedLiquidationPrice = entryPrice * (1 + initialMarginPct - maintenanceMarginPct);
      distanceToLiquidationPct = entryPrice > 0 ? ((estimatedLiquidationPrice - entryPrice) / entryPrice) * 100 : 0;
    }

    // Health Evaluation
    let accountHealthStatus: OrderCalculationResult['accountHealthStatus'] = 'HEALTHY';
    let healthExplanation = 'Position margin well above maintenance threshold.';

    if (feedStatus !== 'live') {
      accountHealthStatus = 'UNAVAILABLE';
      healthExplanation = 'Price feed interrupted. Health metrics unavailable to preserve safety.';
    } else {
      const simulatedEquityAfterOrder = account.equity - estimatedFee;
      const totalMarginNeeded = requiredMaintenanceMargin;
      const healthRatio = totalMarginNeeded > 0 ? simulatedEquityAfterOrder / totalMarginNeeded : 10;

      if (requiredInitialMargin > account.availableBalance) {
        accountHealthStatus = 'CRITICAL';
        healthExplanation = `Insufficient available balance: Requires $${requiredInitialMargin.toFixed(2)} IM, have $${account.availableBalance.toFixed(2)}.`;
      } else if (healthRatio < 1.25) {
        accountHealthStatus = 'CRITICAL';
        healthExplanation = 'Immediate liquidation risk: Resulting margin buffer is under 25%.';
      } else if (healthRatio < 2.0) {
        accountHealthStatus = 'WARNING';
        healthExplanation = 'Elevated risk: High leverage reduces maintenance buffer.';
      } else {
        accountHealthStatus = 'HEALTHY';
        healthExplanation = `Comfortable safety buffer: Maintenance ratio is ${(healthRatio * 100).toFixed(0)}%.`;
      }
    }

    return {
      contractId: contract.identity.id,
      ruleVersion: {
        feeVersion: contract.feeSchedule.ruleVersion,
        fundingVersion: contract.fundingSchedule.ruleVersion,
      },
      entryPrice,
      size: request.size,
      notionalValue,
      requiredInitialMargin,
      requiredMaintenanceMargin,
      leverage,
      estimatedFee,
      feeType: isTaker ? 'taker' : 'maker',
      projectedFundingCostPerInterval,
      estimatedLiquidationPrice: Math.max(0, estimatedLiquidationPrice),
      distanceToLiquidationPct: Math.max(0, distanceToLiquidationPct),
      accountHealthStatus,
      healthExplanation,
    };
  }

  /**
   * Evaluates unrealized PnL and health for an existing open position
   */
  public static evaluatePosition(
    contract: ContractDefinition,
    positionSide: 'buy' | 'sell',
    size: number,
    entryPrice: number,
    currentMarkPrice: number,
    marginAllocated: number,
    feedStatus: FeedHealthStatus
  ) {
    if (feedStatus !== 'live') {
      return {
        unrealizedPnl: 0,
        unrealizedPnlPct: 0,
        healthStatus: 'UNAVAILABLE' as const,
        healthRatio: 0,
        explanation: 'Oracle feed interrupted: Mark price cannot be trusted for liquidation or health calculation.',
      };
    }

    const priceDiff = positionSide === 'buy' ? currentMarkPrice - entryPrice : entryPrice - currentMarkPrice;
    const unrealizedPnl = priceDiff * size;
    const unrealizedPnlPct = marginAllocated > 0 ? (unrealizedPnl / marginAllocated) * 100 : 0;

    const notional = size * currentMarkPrice;
    const maintenanceMarginRequired = notional * contract.marginSettings.maintenanceMarginPct;
    const positionEquity = marginAllocated + unrealizedPnl;
    const healthRatio = maintenanceMarginRequired > 0 ? positionEquity / maintenanceMarginRequired : 10;

    let healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    let explanation = 'Position is healthy.';

    if (healthRatio <= 1.0) {
      healthStatus = 'CRITICAL';
      explanation = 'Position breached maintenance margin: Eligible for liquidation.';
    } else if (healthRatio < 1.4) {
      healthStatus = 'WARNING';
      explanation = 'Position approaching liquidation buffer threshold.';
    }

    return {
      unrealizedPnl,
      unrealizedPnlPct,
      healthStatus,
      healthRatio,
      explanation,
    };
  }
}
