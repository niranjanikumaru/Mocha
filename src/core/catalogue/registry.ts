import type { ContractDefinition } from '../types/contract';
import { validateContractDefinition, type ValidationResult } from './schema';
import { CONTRACT_AERO_PERP, CONTRACT_NEXUS_PERP } from './fixtures';

export class ContractCatalogueRegistry {
  private contracts: Map<string, ContractDefinition> = new Map();
  private listeners: Array<() => void> = [];

  constructor() {
    this.registerContract(CONTRACT_AERO_PERP);
    this.registerContract(CONTRACT_NEXUS_PERP);
  }

  public registerContract(raw: unknown): ValidationResult {
    const result = validateContractDefinition(raw);
    if (!result.success || !result.contract) {
      return result;
    }

    this.contracts.set(result.contract.identity.id, result.contract);
    this.notifyListeners();
    return result;
  }

  public getContract(id: string): ContractDefinition | undefined {
    return this.contracts.get(id);
  }

  public getAllContracts(): ContractDefinition[] {
    return Array.from(this.contracts.values());
  }

  public publishRuleUpdate(
    contractId: string,
    updates: {
      feeSchedule?: Partial<ContractDefinition['feeSchedule']>;
      fundingSchedule?: Partial<ContractDefinition['fundingSchedule']>;
    }
  ): { success: boolean; newVersion?: string; error?: string } {
    const existing = this.contracts.get(contractId);
    if (!existing) {
      return { success: false, error: `Contract ${contractId} not found` };
    }

    const updatedContract: ContractDefinition = {
      ...existing,
      feeSchedule: updates.feeSchedule ? { ...existing.feeSchedule, ...updates.feeSchedule } : existing.feeSchedule,
      fundingSchedule: updates.fundingSchedule ? { ...existing.fundingSchedule, ...updates.fundingSchedule } : existing.fundingSchedule,
      lastValidatedAt: new Date().toISOString(),
    };

    const validation = validateContractDefinition(updatedContract);
    if (!validation.success) {
      return { success: false, error: validation.errors.map(e => e.message).join('; ') };
    }

    this.contracts.set(contractId, updatedContract);
    this.notifyListeners();
    return {
      success: true,
      newVersion: updatedContract.fundingSchedule.ruleVersion || updatedContract.feeSchedule.ruleVersion,
    };
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(fn => fn());
  }
}

export const globalCatalogue = new ContractCatalogueRegistry();
