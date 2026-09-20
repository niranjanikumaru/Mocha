import { describe, it, expect } from 'vitest';
import { PerpetualCalculator } from '../core/calculations/perpetual';
import { CONTRACT_AERO_PERP, CONTRACT_NEXUS_PERP } from '../core/catalogue/fixtures';

describe('Perpetual Contract Calculation Module', () => {
  const account = { equity: 5000, availableBalance: 5000 };

  it('calculates accurate initial margin and fees for AERO-PERP at 10x leverage', () => {
    const preview = PerpetualCalculator.calculateOrderPreview(
      CONTRACT_AERO_PERP,
      {
        contractId: 'AERO-PERP',
        side: 'buy',
        type: 'market',
        size: 10,
        leverage: 10,
      },
      100, // mark price = $100 -> notional = $1000
      'live',
      account
    );

    expect(preview.notionalValue).toBe(1000);
    // 10x leverage = 10% Initial Margin = $100
    expect(preview.requiredInitialMargin).toBe(100);
    // Maintenance margin is 2.5% = $25
    expect(preview.requiredMaintenanceMargin).toBe(25);
    // Taker fee is 5 bps (0.05%) = $0.50
    expect(preview.estimatedFee).toBeCloseTo(0.50, 4);
    // Liquidation price for Long at 10x (10% IM, 2.5% MM) = 100 * (1 - 0.10 + 0.025) = 92.5
    expect(preview.estimatedLiquidationPrice).toBe(92.5);
    expect(preview.accountHealthStatus).toBe('HEALTHY');
  });

  it('calculates different margins and fees for NEXUS-PERP conforming to conservative constraints', () => {
    const preview = PerpetualCalculator.calculateOrderPreview(
      CONTRACT_NEXUS_PERP,
      {
        contractId: 'NEXUS-PERP',
        side: 'buy',
        type: 'market',
        size: 10,
        leverage: 5, // max allowed is 5x (20% IM)
      },
      100, // notional = $1000
      'live',
      account
    );

    expect(preview.notionalValue).toBe(1000);
    // 5x leverage = 20% Initial Margin = $200
    expect(preview.requiredInitialMargin).toBe(200);
    // NEXUS maintenance margin is 10% = $100
    expect(preview.requiredMaintenanceMargin).toBe(100);
    // Taker fee is 3 bps (0.03%) = $0.30
    expect(preview.estimatedFee).toBeCloseTo(0.30, 4);
    // Liquidation price: 100 * (1 - 0.20 + 0.10) = 90
    expect(preview.estimatedLiquidationPrice).toBe(90);
  });

  it('flags health as UNAVAILABLE when price feed is interrupted', () => {
    const preview = PerpetualCalculator.calculateOrderPreview(
      CONTRACT_AERO_PERP,
      {
        contractId: 'AERO-PERP',
        side: 'buy',
        type: 'market',
        size: 5,
        leverage: 10,
      },
      100,
      'interrupted', // Price feed fault injected
      account
    );

    expect(preview.accountHealthStatus).toBe('UNAVAILABLE');
    expect(preview.healthExplanation).toContain('Price feed interrupted');
  });

  it('calculates accurate position health and liquidation warning on market moves', () => {
    // Open position: 10 AERO at $100, allocated $100 margin
    const healthy = PerpetualCalculator.evaluatePosition(
      CONTRACT_AERO_PERP,
      'buy',
      10,
      100,
      105, // Mark went up to 105 -> PnL +$50
      100,
      'live'
    );
    expect(healthy.unrealizedPnl).toBe(50);
    expect(healthy.healthStatus).toBe('HEALTHY');

    const critical = PerpetualCalculator.evaluatePosition(
      CONTRACT_AERO_PERP,
      'buy',
      10,
      100,
      92, // Mark dropped below liquidation price (92.5) -> PnL -$80, Equity = $20
      100,
      'live'
    );
    expect(critical.unrealizedPnl).toBe(-80);
    expect(critical.healthStatus).toBe('CRITICAL');
  });
});
