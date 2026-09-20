import { describe, it, expect } from 'vitest';
import { ContractCatalogueRegistry } from '../core/catalogue/registry';
import { VersionedRecordStore } from '../core/versioning/recordStore';
import { PerpetualCalculator } from '../core/calculations/perpetual';

describe('Versioned Records and Rule Evolution', () => {
  it('preserves historical receipts with original v1 rules when a new funding/fee rule version is published', () => {
    const registry = new ContractCatalogueRegistry();
    const recordStore = new VersionedRecordStore();

    // 1. Check existing historical receipt
    const receiptsBefore = recordStore.getReceipts();
    const historicalReceipt = receiptsBefore.find(r => r.receiptId === 'RCP-HIST-V1-001');
    expect(historicalReceipt).toBeDefined();
    expect(historicalReceipt?.ruleVersionSnapshot.fundingSchedule.ruleVersion).toBe('v1.0.0');
    expect(historicalReceipt?.ruleVersionSnapshot.fundingSchedule.currentRateBps).toBe(12);

    // 2. Publish new funding rule update v2.0.0 (e.g. increase current funding to 25 bps)
    const updateResult = registry.publishRuleUpdate('AERO-PERP', {
      fundingSchedule: {
        ruleVersion: 'v2.0.0',
        currentRateBps: 25,
      },
      feeSchedule: {
        ruleVersion: 'v2.0.0',
        takerFeeBps: 4, // 0.04% promotional fee
      },
    });

    expect(updateResult.success).toBe(true);

    // 3. Obtain updated contract
    const updatedContract = registry.getContract('AERO-PERP')!;
    expect(updatedContract.fundingSchedule.ruleVersion).toBe('v2.0.0');
    expect(updatedContract.fundingSchedule.currentRateBps).toBe(25);
    expect(updatedContract.feeSchedule.takerFeeBps).toBe(4);

    // 4. Calculate new preview under v2.0.0 rules
    const newPreview = PerpetualCalculator.calculateOrderPreview(
      updatedContract,
      {
        contractId: 'AERO-PERP',
        side: 'buy',
        type: 'market',
        size: 5.0,
        leverage: 10,
      },
      100,
      'live',
      { equity: 5000, availableBalance: 5000 }
    );

    expect(newPreview.ruleVersion.fundingVersion).toBe('v2.0.0');
    expect(newPreview.ruleVersion.feeVersion).toBe('v2.0.0');
    // 5.0 * 100 = 500 notional. Taker fee at 4 bps = 500 * 0.0004 = 0.20
    expect(newPreview.estimatedFee).toBeCloseTo(0.20, 4);

    // 5. Mint new receipt under v2.0.0 rules
    const v2Receipt = recordStore.createReceipt({
      contract: updatedContract,
      side: 'buy',
      size: 5.0,
      executionPrice: 100,
      leverage: 10,
      feedStatus: 'live',
    });

    expect(v2Receipt.ruleVersionSnapshot.fundingSchedule.ruleVersion).toBe('v2.0.0');
    expect(v2Receipt.ruleVersionSnapshot.feeSchedule.takerFeeBps).toBe(4);

    // 6. Verify historical receipt remains frozen with v1.0.0 data (not mutated!)
    const receiptsAfter = recordStore.getReceipts();
    const originalReceipt = receiptsAfter.find(r => r.receiptId === 'RCP-HIST-V1-001');
    expect(originalReceipt?.ruleVersionSnapshot.fundingSchedule.ruleVersion).toBe('v1.0.0');
    expect(originalReceipt?.ruleVersionSnapshot.fundingSchedule.currentRateBps).toBe(12);
    expect(originalReceipt?.ruleVersionSnapshot.feeSchedule.takerFeeBps).toBe(5);
  });
});
