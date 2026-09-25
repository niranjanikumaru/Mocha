import { Position, MarginMetrics, MarginHealthStatus, AdverseScenarioResult, ContractSymbol } from '../types/trading';
import { CONTRACT_CATALOG } from './contracts';

import { RISK_POLICY, evaluateRiskHealth } from '../core/risk/riskPolicy';

// Version label for auditability
export const MARGIN_CALCULATOR_VERSION = 'v2.1-fictional-sample';

// ─── Health thresholds (imported from central riskPolicy) ───────────────────
export const HEALTH_THRESHOLDS = RISK_POLICY.THRESHOLDS;
export const DATA_STALE_MS = RISK_POLICY.FEED_STALE_THRESHOLD_MS;

export function calcMarginMetrics(
  position: Position,
  markPrice: number,
  feedTimestamp: number,
  previousMarkPrice?: number,
  inrRate = 86.85
): MarginMetrics {
  const contract = CONTRACT_CATALOG[position.symbol];
  const mmr = contract.maintenanceMarginRate;
  const { leverage, quantity, entryPrice, allocatedMargin } = position;

  // Notional value at current mark price
  const notionalValue = quantity * markPrice;

  // Unrealized PnL  (long: profit when price rises)
  const direction = position.side === 'LONG' ? 1 : -1;
  const unrealizedPnL = direction * quantity * (markPrice - entryPrice);
  const unrealizedPnLPercent = (unrealizedPnL / allocatedMargin) * 100;

  // Accrued funding (simplified: 1 full 8h funding period)
  const accruedFundingFee = notionalValue * contract.baseFundingRate8h;

  // Equity = allocated margin + unrealised PnL - accrued funding
  const equity = allocatedMargin + unrealizedPnL - accruedFundingFee;

  // Maintenance margin requirement
  const maintenanceMargin = quantity * markPrice * mmr;

  // Liquidation price (long)
  // Liq = entryPrice * (1 - 1/leverage + mmr)
  const liquidationPrice =
    position.side === 'LONG'
      ? entryPrice * (1 - 1 / leverage + mmr)
      : entryPrice * (1 + 1 / leverage - mmr);

  // Buffer ratio: (equity - MM) / initialMargin
  const initialMargin = allocatedMargin;
  const bufferRatio = (equity - maintenanceMargin) / initialMargin;
  const bufferPercentage = Math.max(0, bufferRatio * 100);

  // Distance to liquidation
  const distanceToLiquidationPercent =
    position.side === 'LONG'
      ? ((markPrice - liquidationPrice) / markPrice) * 100
      : ((liquidationPrice - markPrice) / markPrice) * 100;

  // Data staleness
  const now = Date.now();
  const isStale = now - feedTimestamp > DATA_STALE_MS;

  // Health status
  let status: MarginHealthStatus;
  if (isStale) {
    status = 'DATA_STALE';
  } else if (bufferRatio > HEALTH_THRESHOLDS.COMFORTABLE_BUFFER) {
    status = 'COMFORTABLE_BUFFER';
  } else if (bufferRatio > HEALTH_THRESHOLDS.REDUCED_BUFFER) {
    status = 'REDUCED_BUFFER';
  } else {
    status = 'NEAR_LIQUIDATION';
  }

  const statusLabels: Record<MarginHealthStatus, string> = {
    COMFORTABLE_BUFFER: 'Comfortable Buffer',
    REDUCED_BUFFER: 'Reduced Buffer',
    NEAR_LIQUIDATION: 'Near Liquidation',
    DATA_STALE: 'Price Data Unavailable',
  };

  // Human-readable change explanation
  const changeExplanation = buildChangeExplanation(
    position, markPrice, previousMarkPrice, unrealizedPnL, bufferRatio, accruedFundingFee, isStale
  );

  return {
    equity,
    allocatedMargin,
    maintenanceMargin,
    liquidationPrice,
    bufferRatio,
    bufferPercentage,
    status,
    statusLabel: statusLabels[status],
    unrealizedPnL,
    unrealizedPnLPercent,
    accruedFundingFee,
    notionalValue,
    leverage,
    changeExplanation,
    distanceToLiquidationPercent,
  };
}

function buildChangeExplanation(
  position: Position,
  markPrice: number,
  prevPrice: number | undefined,
  unrealizedPnL: number,
  bufferRatio: number,
  fundingFee: number,
  isStale: boolean
): string {
  if (isStale) {
    return 'Price feed is delayed. Health status cannot be confirmed — shown as unavailable until data resumes.';
  }
  if (!prevPrice) {
    return `Position opened at $${position.entryPrice.toFixed(2)}. Current mark price is $${markPrice.toFixed(2)}.`;
  }
  const priceDelta = markPrice - prevPrice;
  const pricePct = ((priceDelta / prevPrice) * 100).toFixed(2);
  const pnlDir = unrealizedPnL >= 0 ? 'profit' : 'loss';
  const direction = position.side === 'LONG'
    ? (priceDelta >= 0 ? 'increasing' : 'reducing')
    : (priceDelta <= 0 ? 'increasing' : 'reducing');

  const parts: string[] = [];
  if (Math.abs(priceDelta) > 0.001) {
    parts.push(
      `Mark price ${priceDelta >= 0 ? 'rose' : 'fell'} $${Math.abs(priceDelta).toFixed(2)} (${pricePct}%), ${direction} your equity buffer.`
    );
  }
  if (Math.abs(unrealizedPnL) > 0.01) {
    parts.push(`Unrealised ${pnlDir}: $${Math.abs(unrealizedPnL).toFixed(2)}.`);
  }
  if (fundingFee > 0.01) {
    parts.push(`Funding fee accrued: $${fundingFee.toFixed(4)} (8h rate on ${(position.quantity * markPrice).toFixed(0)} notional).`);
  }
  if (bufferRatio < HEALTH_THRESHOLDS.REDUCED_BUFFER) {
    parts.push('⚠ Consider reducing your position size to de-risk. Adding margin is not the only option.');
  }
  return parts.join(' ') || 'Position stable.';
}

export function calcAdverseScenarios(
  position: Position,
  currentMarkPrice: number,
  feedTimestamp: number,
  inrRate = 86.85
): AdverseScenarioResult[] {
  const drops = [0.05, 0.10, 0.20];
  return drops.map((drop) => {
    const simulatedMarkPrice =
      position.side === 'LONG'
        ? currentMarkPrice * (1 - drop)
        : currentMarkPrice * (1 + drop);

    const metrics = calcMarginMetrics(position, simulatedMarkPrice, feedTimestamp);
    const lossUsd = Math.abs(metrics.unrealizedPnL) - Math.abs(
      (position.side === 'LONG' ? 1 : -1) * position.quantity * (currentMarkPrice - position.entryPrice)
    );
    const additionalLoss = position.quantity * currentMarkPrice * drop;

    return {
      priceDropPercent: drop * 100,
      simulatedMarkPrice,
      projectedEquity: metrics.equity,
      projectedBufferRatio: metrics.bufferRatio,
      projectedStatus: metrics.status,
      lossUsd: additionalLoss,
      lossInr: additionalLoss * inrRate,
    };
  });
}

export function calcPreTradeSummary(
  symbol: ContractSymbol,
  entryPrice: number,
  quantityContracts: number,
  leverage: number,
  inrRate = 86.85
) {
  const contract = CONTRACT_CATALOG[symbol];
  const notional = quantityContracts * entryPrice;
  const initialMargin = notional / leverage;
  const takerFee = notional * contract.takerFeeRate;
  const conversionFee = initialMargin * contract.inrUsdConversionSpread;
  const fundingProjection8h = notional * contract.baseFundingRate8h;
  const liquidationPrice = entryPrice * (1 - 1 / leverage + contract.maintenanceMarginRate);

  return {
    notionalUsd: notional,
    notionalInr: notional * inrRate,
    initialMarginUsd: initialMargin,
    initialMarginInr: initialMargin * inrRate,
    takerFeeUsd: takerFee,
    conversionFeeUsd: conversionFee,
    totalCostUsd: initialMargin + takerFee + conversionFee,
    fundingPer8hUsd: fundingProjection8h,
    estimatedLiquidationPrice: liquidationPrice,
    leverage,
    maintenanceMarginRate: contract.maintenanceMarginRate,
    calculatorVersion: MARGIN_CALCULATOR_VERSION,
    disclaimer: '⚠ All figures use fictional sample prices and rates. This is a prototype for demonstration only.',
  };
}
