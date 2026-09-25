# STEP 0: Currency & Number Reconciliation Report

## Executive Summary
The current app uses **USD** with **international benchmarks**. The Round 1 deck uses **INR** with **India-specific numbers**. There are **13 critical mismatches** that need reconciliation.

---

## CURRENCY & EXCHANGE RATE

| Item | Current (App) | Round 1 Deck | Status |
|------|---------------|--------------|---------|
| **Currency** | USD | INR | ❌ MISMATCH |
| **Exchange Rate** | Not explicitly set | Need to define (assume ~₹83-86/USD) | ⚠️ MISSING |

---

## PRICING / FEES

| Item | Current (App) | Round 1 Deck | Status |
|------|---------------|--------------|---------|
| **Taker Fee (Recommended)** | 5 bps (0.05%) | 0.02% (2 bps) | ❌ **MAJOR MISMATCH** |
| **Taker Fee (Baseline)** | 10 bps (0.10%) | Not specified | ⚠️ NEEDS CLARIFICATION |
| **Discount Floor** | Not mentioned | 0.0104% | ⚠️ MISSING |
| **FX Spread** | 0.25% | Not mentioned in deck | ✅ (keep current) |
| **Rebate Structure** | Generic maker rebate | Own 0.02% fee, capped at first 3 trades | ❌ MISMATCH |

**Critical Note:** Current app uses **5 bps (0.05%)** but deck says **0.02% (which is 2 bps)**. This is a **2.5x difference** in the recommended fee!

---

## CUSTOMER ACQUISITION COSTS (CAC)

| Channel | Current (App) | Round 1 Deck | Conversion | Status |
|---------|---------------|--------------|------------|---------|
| **Paid CAC** | $28.00 | Rs 500-2,200 | Rs 500-2200 = $6-26 @ ₹83/USD | ✅ ROUGHLY ALIGNED |
| **Crew/Referral CAC** | Derived: ~$2.40-$6 | Rs 148-302 | Rs 148-302 = $1.78-3.64 @ ₹83/USD | ✅ ROUGHLY ALIGNED |

---

## LIFETIME VALUE (LTV)

| Item | Current (App) | Round 1 Deck | Conversion | Status |
|------|---------------|--------------|------------|---------|
| **LTV per trader** | Dynamically calculated from ARPU & retention | Rs 475 | Rs 475 = $5.72 @ ₹83/USD | ⚠️ NEEDS VERIFICATION |

**Critical Note:** Deck LTV of Rs 475 (~$5.72) seems **very low** compared to current model outputs. Need to verify:
- Is this **Year 1 LTV** only, or steady-state LTV?
- Current model calculates LTV = ARPU / (1 - retention) which typically yields higher numbers

---

## YEAR 1 TARGETS

| Item | Current (App) | Round 1 Deck | Status |
|------|---------------|--------------|---------|
| **Active Traders Target** | Not explicitly set | 605 active traders | ⚠️ MISSING |
| **Market Pool Size** | Not mentioned | 78.6 lakh (7.86M) | ⚠️ MISSING |
| **Market Penetration** | Not mentioned | 0.008% of pool | ⚠️ MISSING |

---

## OPERATING COSTS (ANNUAL)

| Item | Current (App) | Round 1 Deck | Conversion | Status |
|------|---------------|--------------|------------|---------|
| **Reserve/Compliance** | Not mentioned | Rs 54,000-60,000/yr | Rs 54k-60k = $650-723/yr @ ₹83/USD | ⚠️ MISSING |
| **Trader Review** | Not mentioned | Rs 13,935/yr | Rs 13,935 = $168/yr @ ₹83/USD | ⚠️ MISSING |
| **Trading Circles** | Not mentioned | Rs 11,336/yr | Rs 11,336 = $137/yr @ ₹83/USD | ⚠️ MISSING |
| **Support Cost per Ticket** | $4.00 | Not in deck, but stated "~₹300-400" in code comments | Rs 300-400 = $3.61-4.82 @ ₹83/USD | ✅ ALIGNED |
| **Event Cost** | $58/event | Not in deck, but stated "~₹5000" in code comments | Rs 5000 = $60 @ ₹83/USD | ✅ ALIGNED |

---

## PROVENANCE INCONSISTENCY (64.1% Crew Join Rate)

| Location | Label | Issue |
|----------|-------|-------|
| **README.md line 26** | `MEASURED` | Claims 64.1% is "Measured from simulated Market Night run" |
| **scenarios.ts line 62** | `SIMULATED — repo: 41/64 qualification rate` | Correctly labeled as SIMULATED |
| **model.ts line 164** | `SIMULATED` | Correctly labeled as SIMULATED |

**Fix Required:** Change README.md to say `SIMULATED` instead of `MEASURED`.

---

## SUMMARY OF MISMATCHES

### 🔴 CRITICAL (Must Fix)
1. **Currency:** USD → INR throughout entire app
2. **Taker Fee:** 5 bps (0.05%) → **2 bps (0.02%)**  — **2.5x difference!**
3. **Baseline Fee:** 10 bps → needs deck clarification
4. **Rebate Structure:** Generic maker rebate → "Own 0.02% fee, first 3 trades only"

### 🟡 IMPORTANT (Should Add)
5. **Year 1 Target:** Add 605 active traders goal
6. **Reserve Cost:** Add Rs 54k-60k/yr
7. **Trader Review Cost:** Add Rs 13,935/yr  
8. **Trading Circles Cost:** Add Rs 11,336/yr
9. **Discount Floor:** Add 0.0104% minimum fee

### 🟢 DOCUMENTATION
10. **Provenance:** Fix README "MEASURED" → "SIMULATED" for 64.1%
11. **Exchange Rate:** Define INR/USD rate explicitly (recommend ₹83-86/USD)
12. **LTV Clarification:** Verify if deck Rs 475 is Year-1 only or steady-state

---

## PROPOSED CONFIG FILE STRUCTURE

```typescript
// src/config/deckNumbers.ts
export const DECK_NUMBERS = {
  currency: 'INR' as const,
  exchangeRate: 83, // INR per USD (adjust based on current rate)
  
  pricing: {
    takerFeeRecommendedBps: 2,      // 0.02% per deck
    takerFeeBaselineBps: 10,        // clarify with deck
    discountFloorBps: 1.04,         // 0.0104% per deck
    fxSpreadPct: 0.25,              // keep current
    rebateStructure: {
      amount: 2,                     // bps
      capAtFirstNTrades: 3,
    },
  },
  
  cac: {
    paidMin: 500,                    // Rs
    paidMax: 2200,                   // Rs
    referralMin: 148,                // Rs
    referralMax: 302,                // Rs
  },
  
  ltv: {
    year1Target: 475,                // Rs (verify if year-1 only)
  },
  
  year1Goals: {
    activeTraders: 605,
    marketPoolSize: 7860000,         // 78.6 lakh
    penetrationRate: 0.00008,        // 0.008%
  },
  
  annualCosts: {
    reserveMin: 54000,               // Rs/yr
    reserveMax: 60000,               // Rs/yr
    traderReview: 13935,             // Rs/yr
    tradingCircles: 11336,           // Rs/yr
  },
};
```

---

## NEXT STEPS (DO NOT EXECUTE YET - AWAITING CONFIRMATION)

1. ✅ Create `src/config/deckNumbers.ts` with all deck values
2. ✅ Create currency conversion utilities (`src/lib/currency.ts`)
3. ✅ Update all model interfaces to use INR
4. ✅ Update scenarios.ts with deck numbers
5. ✅ Update all display logic to show INR (₹) instead of USD ($)
6. ✅ Fix README provenance label
7. ✅ Update tests to reflect new currency/values
8. ✅ Create before/after comparison table

---

## QUESTIONS FOR CLARIFICATION

1. **Baseline taker fee:** Deck doesn't specify. Keep 10 bps or use a different value?
2. **LTV Rs 475:** Is this Year-1 LTV only, or steady-state lifetime value?
3. **Exchange rate:** Use current rate (~₹83/USD) or different assumption?
4. **Trader Review & Trading Circles:** Are these per-user or total company costs?

**AWAITING GO-AHEAD TO PROCEED WITH CHANGES.**
