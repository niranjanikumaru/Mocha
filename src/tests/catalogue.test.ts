import { describe, it, expect } from 'vitest';
import { validateContractDefinition } from '../core/catalogue/schema';
import {
  CONTRACT_AERO_PERP,
  CONTRACT_NEXUS_PERP,
  INVALID_CONTRACT_INVERTED_MARGIN,
  INVALID_CONTRACT_MISSING_FIELDS,
} from '../core/catalogue/fixtures';
import { ContractCatalogueRegistry } from '../core/catalogue/registry';

describe('Contract Catalogue & Validation Rules', () => {
  it('should successfully validate and accept CONTRACT_AERO_PERP (AeroTech Volatility)', () => {
    const result = validateContractDefinition(CONTRACT_AERO_PERP);
    expect(result.success).toBe(true);
    expect(result.contract?.identity.id).toBe('AERO-PERP');
    expect(result.errors).toHaveLength(0);
  });

  it('should successfully validate and accept CONTRACT_NEXUS_PERP (Nexus Clean Energy)', () => {
    const result = validateContractDefinition(CONTRACT_NEXUS_PERP);
    expect(result.success).toBe(true);
    expect(result.contract?.identity.id).toBe('NEXUS-PERP');
    expect(result.contract?.marginSettings.maxLeverage).toBe(5);
  });

  it('should strictly reject a contract where maintenance margin exceeds initial margin', () => {
    const result = validateContractDefinition(INVALID_CONTRACT_INVERTED_MARGIN);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    const hasMarginError = result.errors.some(e => e.message.includes('strictly less than initial margin'));
    expect(hasMarginError).toBe(true);
  });

  it('should strictly reject an incomplete contract definition with missing required fields', () => {
    const result = validateContractDefinition(INVALID_CONTRACT_MISSING_FIELDS);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should block registry activation if contract is invalid', () => {
    const registry = new ContractCatalogueRegistry();
    const result = registry.registerContract(INVALID_CONTRACT_INVERTED_MARGIN);
    expect(result.success).toBe(false);
    expect(registry.getContract('BROKEN-PERP')).toBeUndefined();
  });
});
