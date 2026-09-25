/**
 * MochaTrade Round 1 Deck Numbers - Source of Truth
 * All values from ACM MarketSphere 2026 Round 1 submission
 * Currency: INR (Indian Rupees)
 */

export const DECK_NUMBERS = {
  currency: 'INR' as const,
  currencySymbol: '₹',
  exchangeRate: 83, // INR per USD (for legacy conversions if needed)
  
  pricing: {
    // Round 1 deck: "fee 0.02% per trade"
    takerFeeRecommendedBps: 2,      // 0.02% = 2 bps
    // Deck: "discount floor 0.0104%"
    discountFloorBps: 1.04,         // 0.0104% = 1.04 bps
    // Baseline: using 10 bps (0.10%) as higher opaque pricing (deck doesn't specify, keeping app's logic)
    takerFeeBaselineBps: 10,        // 0.10% = 10 bps
    // Maker fee (rebate) - negative means rebate
    makerFeeBps: -2,
    // FX spread (not in deck, keeping app's existing value)
    fxSpreadPct: 0.25,              // 0.25%
    // Rebate structure from deck: "rebate = our own 0.02% fee only, capped at a new user's first 3 trades"
    rebateStructure: {
      amountBps: 2,                 // Own 0.02% fee = 2 bps
      capAtFirstNTrades: 3,         // First 3 trades only
    },
  },
  
  cac: {
    // Round 1 deck: "paid CAC Rs 500-2,200"
    paidMin: 500,                    // ₹500
    paidMax: 2200,                   // ₹2,200
    paidMid: 1350,                   // Midpoint: ₹1,350
    // Round 1 deck: "referral cost per trader Rs 148-302"
    referralMin: 148,                // ₹148
    referralMax: 302,                // ₹302
    referralMid: 225,                // Midpoint: ₹225
  },
  
  ltv: {
    // Round 1 deck: "LTV about Rs 475"
    // NOTE: This seems to be Year-1 LTV based on low volume assumption
    year1Target: 475,                // ₹475 per trader in Year 1
  },
  
  year1Goals: {
    // Round 1 deck: "Year-1 goal 605 active traders"
    activeTraders: 605,
    // Round 1 deck: "0.008% of a 78.6 lakh pool"
    marketPoolSize: 7860000,         // 78.6 lakh = 7,860,000
    penetrationRate: 0.00008,        // 0.008% = 605 / 7,860,000
  },
  
  annualCosts: {
    // Round 1 deck: "reserve Rs 54-60k/yr"
    reserveMin: 54000,               // ₹54,000/year
    reserveMax: 60000,               // ₹60,000/year
    reserveMid: 57000,               // Midpoint: ₹57,000/year
    // Round 1 deck: "Trader Review costs Rs 13,935/yr"
    traderReview: 13935,             // ₹13,935/year (total company cost)
    // Round 1 deck: "Trading Circles cost Rs 11,336/yr"
    tradingCircles: 11336,           // ₹11,336/year (total company cost)
  },
  
  // Additional assumptions (not in deck, derived from app)
  estimatedDepositSize: 10000,       // ₹10,000 typical first deposit
  supportCostPerTicket: 350,         // ₹350 per ticket (~$4 USD equivalent)
  crewEventCost: 5000,               // ₹5,000 per Market Night event
} as const;

// Helper to format INR currency
export function formatINR(amount: number, decimals = 0): string {
  if (!isFinite(amount) || isNaN(amount)) return '—';
  const formatted = Math.abs(amount).toLocaleString('en-IN', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
  return amount < 0 ? `-₹${formatted}` : `₹${formatted}`;
}

// Helper to format INR in lakhs/crores for large numbers
export function formatINRCompact(amount: number): string {
  if (!isFinite(amount) || isNaN(amount)) return '—';
  const abs = Math.abs(amount);
  
  if (abs >= 10000000) { // 1 crore+
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  } else if (abs >= 100000) { // 1 lakh+
    return `₹${(amount / 100000).toFixed(2)}L`;
  } else if (abs >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return formatINR(amount, 0);
}

// Helper to format percentage
export function formatPct(n: number, decimals = 1): string {
  if (!isFinite(n) || isNaN(n)) return '—';
  return `${(n * 100).toFixed(decimals)}%`;
}

// Helper to format basis points
export function formatBps(bps: number): string {
  if (!isFinite(bps) || isNaN(bps)) return '—';
  return `${bps} bps`;
}

// Convert legacy USD values to INR (for migration purposes)
export function usdToInr(usdAmount: number): number {
  return usdAmount * DECK_NUMBERS.exchangeRate;
}

// Provenance labels
export type Provenance = 'MEASURED' | 'SIMULATED' | 'ASSUMED' | 'DERIVED';

export const PROVENANCE_COLORS: Record<Provenance, string> = {
  MEASURED: '#22c55e',   // Green
  SIMULATED: '#f59e0b',  // Amber
  ASSUMED: '#7e7e9a',    // Gray
  DERIVED: '#60a5fa',    // Blue
};
