/**
 * Unified Risk Policy
 * Single source of truth for margin buffer thresholds, staleness limits, and health classification.
 * Addresses PRD §2.2 B9 and Foundation Requirement FND-1.
 */

export const RISK_POLICY = {
  // Feed staleness threshold (ms)
  FEED_STALE_THRESHOLD_MS: 3000,
  
  // Health buffer thresholds based on bufferRatio = (equity - maintenanceMargin) / initialMargin
  THRESHOLDS: {
    COMFORTABLE_BUFFER: 0.40, // > 40%
    REDUCED_BUFFER: 0.15,     // 15% <= ratio <= 40%
    // < 15% is NEAR_LIQUIDATION
  },

  // Health labels
  STATUS_LABELS: {
    COMFORTABLE_BUFFER: 'Comfortable Buffer',
    REDUCED_BUFFER: 'Reduced Buffer',
    NEAR_LIQUIDATION: 'Near Liquidation',
    DATA_STALE: 'Price Data Unavailable',
  } as const,
} as const;

export type RiskHealthStatus = keyof typeof RISK_POLICY.STATUS_LABELS;

export function evaluateRiskHealth(
  bufferRatio: number,
  isFeedStale: boolean
): { status: RiskHealthStatus; label: string } {
  if (isFeedStale) {
    return {
      status: 'DATA_STALE',
      label: RISK_POLICY.STATUS_LABELS.DATA_STALE,
    };
  }
  if (bufferRatio > RISK_POLICY.THRESHOLDS.COMFORTABLE_BUFFER) {
    return {
      status: 'COMFORTABLE_BUFFER',
      label: RISK_POLICY.STATUS_LABELS.COMFORTABLE_BUFFER,
    };
  }
  if (bufferRatio > RISK_POLICY.THRESHOLDS.REDUCED_BUFFER) {
    return {
      status: 'REDUCED_BUFFER',
      label: RISK_POLICY.STATUS_LABELS.REDUCED_BUFFER,
    };
  }
  return {
    status: 'NEAR_LIQUIDATION',
    label: RISK_POLICY.STATUS_LABELS.NEAR_LIQUIDATION,
  };
}
