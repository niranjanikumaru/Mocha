import { ContractDefinition, ContractSymbol } from '../types/trading';

export const CONTRACT_CATALOG: Record<ContractSymbol, ContractDefinition> = {
  'NVDA-PERP': {
    symbol: 'NVDA-PERP',
    underlyingName: 'NVIDIA Corporation',
    underlyingTicker: 'NVDA',
    contractType: 'PERPETUAL_INVERSE_OR_LINEAR',
    description: 'Synthetic perpetual futures tracking NVDA/USD. No share ownership, physical delivery, or voting rights.',
    multiplier: 1.0,
    tickSize: 0.01,
    maxLeverage: 10,
    maintenanceMarginRate: 0.05, // 5% MM
    baseFundingRate8h: 0.00012, // +0.012% per 8h
    takerFeeRate: 0.0005, // 0.05%
    inrUsdConversionSpread: 0.0025, // 0.25%
  },
  'AAPL-PERP': {
    symbol: 'AAPL-PERP',
    underlyingName: 'Apple Inc.',
    underlyingTicker: 'AAPL',
    contractType: 'PERPETUAL_INVERSE_OR_LINEAR',
    description: 'Synthetic perpetual futures tracking AAPL/USD.',
    multiplier: 1.0,
    tickSize: 0.01,
    maxLeverage: 10,
    maintenanceMarginRate: 0.05,
    baseFundingRate8h: 0.00008,
    takerFeeRate: 0.0005,
    inrUsdConversionSpread: 0.0025,
  },
  'TSLA-PERP': {
    symbol: 'TSLA-PERP',
    underlyingName: 'Tesla, Inc.',
    underlyingTicker: 'TSLA',
    contractType: 'PERPETUAL_INVERSE_OR_LINEAR',
    description: 'Synthetic perpetual futures tracking TSLA/USD.',
    multiplier: 1.0,
    tickSize: 0.01,
    maxLeverage: 8,
    maintenanceMarginRate: 0.07, // 7% MM for higher volatility
    baseFundingRate8h: 0.00025,
    takerFeeRate: 0.0005,
    inrUsdConversionSpread: 0.0025,
  },
  'MSFT-PERP': {
    symbol: 'MSFT-PERP',
    underlyingName: 'Microsoft Corporation',
    underlyingTicker: 'MSFT',
    contractType: 'PERPETUAL_INVERSE_OR_LINEAR',
    description: 'Synthetic perpetual futures tracking MSFT/USD.',
    multiplier: 1.0,
    tickSize: 0.01,
    maxLeverage: 10,
    maintenanceMarginRate: 0.05,
    baseFundingRate8h: 0.00009,
    takerFeeRate: 0.0005,
    inrUsdConversionSpread: 0.0025,
  },
  'GOOGL-PERP': {
    symbol: 'GOOGL-PERP',
    underlyingName: 'Alphabet Inc.',
    underlyingTicker: 'GOOGL',
    contractType: 'PERPETUAL_INVERSE_OR_LINEAR',
    description: 'Synthetic perpetual futures tracking GOOGL/USD.',
    multiplier: 1.0,
    tickSize: 0.01,
    maxLeverage: 10,
    maintenanceMarginRate: 0.05,
    baseFundingRate8h: 0.00010,
    takerFeeRate: 0.0005,
    inrUsdConversionSpread: 0.0025,
  },
};

export const INITIAL_MARK_PRICES: Record<ContractSymbol, number> = {
  'NVDA-PERP': 124.50,
  'AAPL-PERP': 228.30,
  'TSLA-PERP': 245.80,
  'MSFT-PERP': 432.10,
  'GOOGL-PERP': 178.60,
};
