import { z } from 'zod';
import type { ContractDefinition } from '../types/contract';

export const InstrumentIdentitySchema = z.object({
  id: z.string().min(2, "Contract ID must be at least 2 characters").regex(/^[A-Z0-9_-]+$/, "ID must be alphanumeric uppercase with dashes/underscores"),
  symbol: z.string().min(3, "Symbol required"),
  name: z.string().min(3, "Descriptive name required"),
  marketType: z.enum(['perpetual', 'dated_futures', 'spot_margin']),
  baseAsset: z.string().min(1, "Base asset required"),
  quoteAsset: z.string().min(1, "Quote asset required"),
  description: z.string().min(5, "Meaningful description required"),
});

export const PriceSourceSchema = z.object({
  providerId: z.string().min(2, "Provider ID required"),
  feedSymbol: z.string().min(2, "Feed symbol required"),
  maxHeartbeatSec: z.number().positive("Heartbeat must be positive").max(120, "Heartbeat cannot exceed 120s"),
  fallbackPolicy: z.enum(['halt_trading', 'use_twap', 'manual_settlement']),
});

export const ContractPrecisionSchema = z.object({
  priceDecimals: z.number().int().min(0).max(8),
  sizeDecimals: z.number().int().min(0).max(8),
  tickSize: z.number().positive("Tick size must be greater than 0"),
  minOrderSize: z.number().positive("Min order size must be greater than 0"),
  maxOrderSize: z.number().positive("Max order size must be greater than 0"),
}).refine(data => data.minOrderSize <= data.maxOrderSize, {
  message: "minOrderSize cannot exceed maxOrderSize",
  path: ["minOrderSize"],
});

export const FeeScheduleSchema = z.object({
  ruleVersion: z.string().regex(/^v\d+\.\d+\.\d+$/, "Version must follow semantic format like v1.0.0"),
  makerFeeBps: z.number().min(0, "Maker fee must be non-negative").max(100, "Maker fee cannot exceed 100 bps (1%)"),
  takerFeeBps: z.number().min(0, "Taker fee must be non-negative").max(200, "Taker fee cannot exceed 200 bps (2%)"),
  settlementFeeBps: z.number().min(0),
  rebateEligible: z.boolean(),
});

export const FundingScheduleSchema = z.object({
  ruleVersion: z.string().regex(/^v\d+\.\d+\.\d+$/, "Version must follow semantic format like v1.0.0"),
  intervalHours: z.number().int().min(1).max(24),
  capRateBps: z.number().positive("Funding cap must be positive"),
  floorRateBps: z.number().negative("Funding floor must be negative"),
  currentRateBps: z.number(),
  nextFundingTimestamp: z.number().positive(),
}).refine(data => data.currentRateBps >= data.floorRateBps && data.currentRateBps <= data.capRateBps, {
  message: "currentRateBps must stay within floorRateBps and capRateBps boundaries",
  path: ["currentRateBps"],
});

export const MarginSettingsSchema = z.object({
  mode: z.enum(['isolated', 'cross']),
  initialMarginPct: z.number().positive("Initial margin must be > 0").max(1.0, "Initial margin cannot exceed 100%"),
  maintenanceMarginPct: z.number().positive("Maintenance margin must be > 0").max(1.0),
  maxLeverage: z.number().min(1).max(100),
}).refine(data => data.maintenanceMarginPct < data.initialMarginPct, {
  message: "Maintenance margin percentage MUST be strictly strictly less than initial margin percentage to avoid instant liquidation",
  path: ["maintenanceMarginPct"],
}).refine(data => Math.abs((1 / data.initialMarginPct) - data.maxLeverage) <= 1.0, {
  message: "Initial margin percentage must be mathematically consistent with max leverage (1 / initialMarginPct ~ maxLeverage)",
  path: ["maxLeverage"],
});

export const SupportedActionsSchema = z.object({
  canOpenLong: z.boolean(),
  canOpenShort: z.boolean(),
  canMarket: z.boolean(),
  canLimit: z.boolean(),
  canStopLoss: z.boolean(),
});

export const ContractDefinitionSchema = z.object({
  identity: InstrumentIdentitySchema,
  priceSource: PriceSourceSchema,
  precision: ContractPrecisionSchema,
  feeSchedule: FeeScheduleSchema,
  fundingSchedule: FundingScheduleSchema,
  marginSettings: MarginSettingsSchema,
  supportedActions: SupportedActionsSchema,
  status: z.enum(['active', 'draft', 'deprecated']),
  lastValidatedAt: z.string(),
});

export interface ValidationResult {
  success: boolean;
  contract?: ContractDefinition;
  errors: { path: string; message: string }[];
}

export function validateContractDefinition(rawInput: unknown): ValidationResult {
  const parseResult = ContractDefinitionSchema.safeParse(rawInput);
  if (parseResult.success) {
    return {
      success: true,
      contract: parseResult.data as ContractDefinition,
      errors: [],
    };
  } else {
    return {
      success: false,
      errors: parseResult.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }
}
