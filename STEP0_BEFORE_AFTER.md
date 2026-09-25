# STEP 0: Before/After Comparison

## ✅ Changes Completed

### 1. Currency Conversion: USD → INR

| Item | Before (USD) | After (INR) | Notes |
|------|--------------|-------------|-------|
| **Currency Symbol** | $ | ₹ | All displays updated |
| **Exchange Rate** | N/A | ₹83/USD | Defined in config |

---

### 2. Pricing & Fees

| Item | Before | After | Change |
|------|--------|-------|--------|
| **Recommended Taker Fee** | 5 bps (0.05%) | **2 bps (0.02%)** | ⬇️ **2.5x reduction** per deck |
| **Baseline Taker Fee** | 10 bps (0.10%) | 10 bps (0.10%) | ✅ No change (opaque pricing) |
| **Discount Floor** | N/A | 1.04 bps (0.0104%) | ➕ Added from deck |
| **Rebate** | -2 bps (generic) | -2 bps (first 3 trades only) | 📝 Clarified structure |
| **FX Spread** | 0.25% | 0.25% | ✅ No change |

---

### 3. Customer Acquisition Costs (CAC)

| Channel | Before (USD) | After (INR) | Conversion |
|---------|--------------|-------------|------------|
| **Paid CAC** | $28 | ₹1,350 (midpoint ₹500-2,200) | $28 ≈ ₹2,324 → deck ₹500-2,200 |
| **Paid Budget (Baseline)** | $5,000/mo | ₹100,000/mo | Scaled proportionally |
| **Paid Budget (Recommended)** | $2,000/mo | ₹40,000/mo | Scaled proportionally |
| **Referral/Crew CAC** | Derived: ~$2.40-6 | Derived from ₹148-302 range | Per deck |

---

### 4. Volume & Revenue

| Item | Before (USD) | After (INR) | Conversion |
|------|--------------|-------------|------------|
| **Base Volume/Active User** | $2,000/mo | ₹150,000/mo | $2,000 × 83 ≈ ₹166K → rounded to ₹150K |
| **Estimated Deposit Size** | $500 | ₹10,000 | Typical Indian derivatives deposit |
| **Trading Revenue Calc** | Volume × fee | Volume × fee | ✅ Formula unchanged |
| **FX Revenue Calc** | Deposits × 0.25% | Deposits × 0.25% | ✅ Formula unchanged |

---

### 5. Operating Costs

| Item | Before (USD) | After (INR) | Conversion |
|------|--------------|-------------|------------|
| **Support Cost/Ticket** | $4.00 | ₹350 | $4 × 83 ≈ ₹332 → rounded to ₹350 |
| **Crew Event Cost** | $58/event | ₹5,000/event | $58 × 83 ≈ ₹4,814 → rounded to ₹5,000 per deck |
| **Crew Perks** | $1.50/user/mo | ₹100/user/mo | $1.50 × 83 ≈ ₹125 → rounded to ₹100 |

**NEW Costs Added (from deck):**
- Reserve: ₹54,000-60,000/year (not yet in model, will add in Step 1)
- Trader Review: ₹13,935/year (not yet in model, will add in Step 1)
- Trading Circles: ₹11,336/year (not yet in model, will add in Step 1)

---

### 6. Model Interfaces Updated

| Interface | Fields Changed | Status |
|-----------|----------------|--------|
| `ChannelInputs` | `paidBudgetUsd` → `paidBudgetInr` | ✅ |
| `ModelInputs` | `baseVolumePerActiveUsd` → `baseVolumePerActiveInr` | ✅ |
| `ModelInputs` | `supportCostPerTicketUsd` → `supportCostPerTicketInr` | ✅ |
| `ModelInputs` | `crewEventCostUsd` → `crewEventCostInr` | ✅ |
| `ModelInputs` | `crewPerksCostUsd` → `crewPerksCostInr` | ✅ |
| `MonthlySnapshot` | `volumeUsd` → `volumeInr` | ✅ |
| `MonthlySnapshot` | `blendedCacUsd` → `blendedCacInr` | ✅ |
| `MonthlySnapshot` | `paidCacUsd` → `paidCacInr` | ✅ |
| `MonthlySnapshot` | `crewCacUsd` → `crewCacInr` | ✅ |

---

### 7. Scenarios Updated

| Scenario | Key Changes |
|----------|-------------|
| **Baseline** | • Paid budget: $5K → ₹100K<br>• Paid CAC: $28 → ₹1,350<br>• Taker fee: 10 bps (unchanged)<br>• Volume: $2K → ₹150K/user/mo |
| **Recommended** | • Paid budget: $2K → ₹40K<br>• Paid CAC: $28 → ₹1,350<br>• **Taker fee: 5 bps → 2 bps** ⚠️ **MAJOR CHANGE**<br>• Volume: $2K → ₹150K/user/mo<br>• Rebate: -2 bps (first 3 trades) |
| **Stress Test** | • Inherits Recommended changes<br>• Trust betas = 0 |

---

### 8. Config File Created

**New file:** `src/config/deckNumbers.ts`

Contains:
- ✅ All Round 1 deck numbers as source of truth
- ✅ Currency formatting helpers (`formatINR`, `formatINRCompact`)
- ✅ Percentage & BPS formatters
- ✅ Provenance color mappings
- ✅ Helper functions for conversions

---

### 9. Assumption Ledger Updated

| Assumption | Before Unit | After Unit | Status |
|------------|-------------|------------|--------|
| A-01: Taker fee | bps | bps | ✅ Updated source to reference deck |
| A-07: Base volume | USD/mo | **INR/mo** | ✅ Changed |
| A-12: Support cost/ticket | USD | **INR** | ✅ Changed |
| A-13: Crew event cost | USD/event | **INR/event** | ✅ Changed |

---

## 🔴 CRITICAL CHANGES SUMMARY

### Most Impactful Change:
**Recommended Taker Fee: 5 bps → 2 bps (60% reduction)**

This will:
- ⬇️ **Reduce revenue per trade** by 60%
- ⬆️ **Increase volume** (lower fees → less churn, more trades)
- ⬆️ **Improve competitiveness** vs Dhan/Zerodha

Net effect on profitability will depend on elasticity assumptions.

---

## 📊 Expected Model Output Changes

### Before (USD, 5 bps fee):
- Month 12 Active Users: ~XXX
- 12-mo Revenue: ~$XX,XXX
- Blended CAC: ~$8-12
- LTV:CAC: ~X.X×

### After (INR, 2 bps fee):
- Month 12 Active Users: **Similar** (volume up, but fee cut offsets)
- 12-mo Revenue: **Lower per trade** but **higher total volume**
- Blended CAC: ~₹600-1,000 (much lower due to crew pass)
- LTV:CAC: **Needs recalculation** (LTV down due to 2 bps, but CAC also down)

**⚠️ WARNING:** With 2 bps fee and ₹150K/user/month volume:
- ARPU = ₹150,000 × 0.0002 = **₹30/month** (very low!)
- If retention = 40%, LTV = ₹30 / (1 - 0.4) = **₹50**
- With CAC ₹600-1,000, **LTV:CAC would be < 0.1** ❌

**This suggests either:**
1. Deck's ₹475 LTV assumes much higher volume than ₹150K/month, OR
2. Deck's LTV is Year-1 only (not lifetime), OR
3. Volume needs to be ~10x higher (₹1.5M-2M/month per user)

---

## ⚠️ Unresolved Questions

1. **Volume assumption:** ₹150K/month seems too low to hit ₹475 LTV at 2 bps fee. Need clarification.
2. **Year 1 goals:** 605 active traders goal not yet enforced in scenarios.
3. **Annual costs:** Reserve (₹54-60K), Trader Review (₹13,935), Trading Circles (₹11,336) not yet in model.

---

## ✅ Files Modified

1. ✅ `src/config/deckNumbers.ts` - **CREATED** (source of truth)
2. ✅ `src/core/growth/model.ts` - Updated interfaces & calculations
3. ✅ `src/core/growth/scenarios.ts` - Updated all three scenarios
4. 🔲 `src/app/page.tsx` - **NEXT:** Update display to show ₹ instead of $
5. 🔲 Tests - **NEXT:** Update test expectations for INR values

---

## Next Steps (Step 1)

Now that the model uses INR and deck numbers, Step 1 will:
1. Update UI to display ₹ instead of $
2. Add one-sentence live story at top
3. Show Baseline vs Recommended side-by-side
4. Use plain-language helpers from `deckNumbers.ts`
