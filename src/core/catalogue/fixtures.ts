import type { ContractDefinition } from '../types/contract';

export const CONTRACT_AERO_PERP: ContractDefinition = {
  identity: {
    id: 'AERO-PERP',
    symbol: 'AERO/USD-PERP',
    name: 'AeroTech High-Growth Perpetual',
    marketType: 'perpetual',
    baseAsset: 'AERO',
    quoteAsset: 'USD',
    description: 'High-volatility aerospace index perpetual contract with flexible leverage and high-frequency dynamic funding adjustments.',
  },
  priceSource: {
    providerId: 'mocha_pyth_oracle',
    feedSymbol: 'AERO/USD',
    maxHeartbeatSec: 15,
    fallbackPolicy: 'halt_trading',
  },
  precision: {
    priceDecimals: 2,
    sizeDecimals: 3,
    tickSize: 0.05,
    minOrderSize: 0.1,
    maxOrderSize: 50000,
  },
  feeSchedule: {
    ruleVersion: 'v1.0.0',
    makerFeeBps: 2,      // 0.02%
    takerFeeBps: 5,      // 0.05%
    settlementFeeBps: 0,
    rebateEligible: true,
  },
  fundingSchedule: {
    ruleVersion: 'v1.0.0',
    intervalHours: 8,
    capRateBps: 75,      // max 0.75%
    floorRateBps: -75,
    currentRateBps: 12,  // +0.012% per 8h
    nextFundingTimestamp: Date.now() + 1000 * 60 * 60 * 4.5,
  },
  marginSettings: {
    mode: 'isolated',
    initialMarginPct: 0.05,       // 20x max leverage
    maintenanceMarginPct: 0.025,  // 2.5% MM
    maxLeverage: 20,
  },
  supportedActions: {
    canOpenLong: true,
    canOpenShort: true,
    canMarket: true,
    canLimit: true,
    canStopLoss: true,
  },
  status: 'active',
  lastValidatedAt: new Date().toISOString(),
};

export const CONTRACT_NEXUS_PERP: ContractDefinition = {
  identity: {
    id: 'NEXUS-PERP',
    symbol: 'NEXUS/USD-PERP',
    name: 'Nexus Clean Energy Perpetual',
    marketType: 'perpetual',
    baseAsset: 'NEXUS',
    quoteAsset: 'USD',
    description: 'Regulated renewable transition perpetual featuring conservative margin guardrails and accelerated 4h funding intervals.',
  },
  priceSource: {
    providerId: 'mocha_chainlink_adapter',
    feedSymbol: 'NEXUS/USD',
    maxHeartbeatSec: 30,
    fallbackPolicy: 'use_twap',
  },
  precision: {
    priceDecimals: 3,
    sizeDecimals: 2,
    tickSize: 0.01,
    minOrderSize: 1.0,
    maxOrderSize: 25000,
  },
  feeSchedule: {
    ruleVersion: 'v1.0.0',
    makerFeeBps: 1,      // 0.01%
    takerFeeBps: 3,      // 0.03%
    settlementFeeBps: 0,
    rebateEligible: false,
  },
  fundingSchedule: {
    ruleVersion: 'v1.0.0',
    intervalHours: 4,
    capRateBps: 30,
    floorRateBps: -30,
    currentRateBps: -5,  // -0.005% per 4h
    nextFundingTimestamp: Date.now() + 1000 * 60 * 60 * 1.8,
  },
  marginSettings: {
    mode: 'isolated',
    initialMarginPct: 0.20,       // 5x max leverage
    maintenanceMarginPct: 0.10,  // 10% MM
    maxLeverage: 5,
  },
  supportedActions: {
    canOpenLong: true,
    canOpenShort: true,
    canMarket: true,
    canLimit: true,
    canStopLoss: false,
  },
  status: 'active',
  lastValidatedAt: new Date().toISOString(),
};

export const INVALID_CONTRACT_INVERTED_MARGIN = {
  identity: {
    id: 'BROKEN-PERP',
    symbol: 'BROKEN/USD-PERP',
    name: 'Broken Margin Specimen',
    marketType: 'perpetual',
    baseAsset: 'BROKEN',
    quoteAsset: 'USD',
    description: 'Defective contract definition where maintenance margin exceeds initial margin, which would cause immediate liquidation on fill.',
  },
  priceSource: {
    providerId: 'unverified_node',
    feedSymbol: 'BROKEN/USD',
    maxHeartbeatSec: 60,
    fallbackPolicy: 'halt_trading',
  },
  precision: {
    priceDecimals: 2,
    sizeDecimals: 2,
    tickSize: 0.01,
    minOrderSize: 1.0,
    maxOrderSize: 1000,
  },
  feeSchedule: {
    ruleVersion: 'v1.0.0',
    makerFeeBps: 10,
    takerFeeBps: 25,
    settlementFeeBps: 0,
    rebateEligible: false,
  },
  fundingSchedule: {
    ruleVersion: 'v1.0.0',
    intervalHours: 8,
    capRateBps: 50,
    floorRateBps: -50,
    currentRateBps: 10,
    nextFundingTimestamp: Date.now() + 10000,
  },
  marginSettings: {
    mode: 'isolated',
    initialMarginPct: 0.05,       // 5% Initial Margin
    maintenanceMarginPct: 0.15,  // INVALID: 15% Maintenance > 5% Initial!
    maxLeverage: 20,
  },
  supportedActions: {
    canOpenLong: true,
    canOpenShort: true,
    canMarket: true,
    canLimit: false,
    canStopLoss: false,
  },
  status: 'draft',
  lastValidatedAt: new Date().toISOString(),
};

export const INVALID_CONTRACT_MISSING_FIELDS = {
  identity: {
    id: 'MISSING-SPEC',
    symbol: 'MISSING/USD',
    // Missing name, marketType, baseAsset, quoteAsset
  },
  priceSource: {
    providerId: 'pyth',
    // Missing maxHeartbeatSec, fallbackPolicy
  },
  // Missing precision, feeSchedule, fundingSchedule entirely!
  marginSettings: {
    mode: 'isolated',
    initialMarginPct: 0.10,
    maintenanceMarginPct: 0.05,
    maxLeverage: 10,
  },
  status: 'draft',
};
