# MochaTrade: Decision Cockpit & Evidence Engine
### ACM MarketSphere 2026 — Round 2 Prototype

> **Internal Decision Tool** built for the MochaTrade executive and growth team to evaluate, price, and operationalize our **Round 1 Strategy**: shifting from high-friction, paid-ad-heavy customer acquisition to a **community-viral Crew Pass engine powered by transparent trust mechanisms**.

---

## 0. Executive Summary: What This Prototype Is

In Round 1, our recommendation proposed that MochaTrade compete not by outspending incumbents on paid marketing ($28+ retail CAC in India), but by turning trust into a customer acquisition and retention moat:
1. **Crew Pass (Mocha Market Night)**: A squad-based (4-trader) community on-ramp lowering CAC through organic viral invites ($K$-factor).
2. **Transparent Trust Architecture**: Explainable margin buffers, lost-ACK transaction reconciliation, and immutable versioned contract rules that reduce user churn and customer support overhead.
3. **Optimized Pricing**: Competitive taker fees (e.g. 5 bps) combined with FX spread monetization that maximize 12-month net contribution.

**This prototype is the internal tool MochaTrade leadership uses to model and stress-test that thesis.**

```
                               ┌───────────────────────────────────────────────────────────┐
                               │             MochaTrade Decision Cockpit (`/`)             │
                               │  Interactive 12-Mo Projections · Scenarios · Optimizers   │
                               └─────────────────────────────┬─────────────────────────────┘
                                                             │
                 ┌───────────────────────────────────────────┼───────────────────────────────────────────┐
                 ▼                                           ▼                                           ▼
  ┌──────────────────────────────┐            ┌──────────────────────────────┐            ┌──────────────────────────────┐
  │  Proof 1: Trust Terminal     │            │  Proof 2: Market Night       │            │  Proof 3: Contract Rules     │
  │     (`/proof/terminal`)      │            │   (`/proof/market-night`)    │            │     (`/proof/contracts`)     │
  ├──────────────────────────────┤            ├──────────────────────────────┤            ├──────────────────────────────┤
  │ Evidence for Trust Levers    │            │ Evidence for Non-Paid Mix    │            │ Evidence for Expansion Cost  │
  │ • Explainable Margin Buffer  │            │ • 4-Trader Crew Formation    │            │ • Zod-Validated Rule Engine  │
  │ • Lost-ACK State Machine     │            │ • Atomic 4th-Member Unlock   │            │ • Immutable Rule Snapshots   │
  │ • Idempotent Deposit Rails   │            │ • Measured 64.1% Qual. Rate  │            │ • Single-File Scalability    │
  └──────────────────────────────┘            └──────────────────────────────┘            └──────────────────────────────┘
```

---

## 1. Application Map & Features

### 1.1 Decision Cockpit (`/`) — Primary Tool
* **Interactive 12-Month Projection Engine**: Pure TypeScript, deterministic model recalculating in $<5\text{ ms}$ upon any parameter change.
* **Side-by-Side Scenario Comparison**:
  * **Recommended ✓**: Round 1 thesis (60% paid budget shifted to Crew Pass, 5 bps taker fee, all 5 trust levers active).
  * **Baseline**: Traditional status quo (paid-marketing heavy, opaque pricing at 10 bps, no trust levers).
  * **Honest Stress Test**: Negative shock where trust levers fail to alter customer behavior, demonstrating model intellectual honesty.
* **Trust Ladder ($T \in [0, 1]$)**: Adjust completeness across 5 live trust levers to see their causal impact on deposit conversion, retention, and support ticket rate.
* **Pricing Optimiser**: Sweeps taker fees ($1\text{ to }20\text{ bps}$) to determine the contribution-maximizing price point and visualizes how higher trust shifts optimal pricing.
* **Sensitivity Tornado**: Evaluates the top 8 risk factors impacting 12-month net contribution (retention, volume, elasticity, fee level, etc.).
* **Assumption Ledger**: Full visibility into all model drivers, labeled with provenance (`MEASURED`, `SIMULATED`, `ASSUMED`, `DERIVED`), confidence ratings, and citations.
* **Interactive Judge Mode**: A 5-step guided tour enabling a concise 6-minute live pitch.

### 1.2 "Proof as Evidence" Screens
* **`/proof/terminal`**: Interactive trading terminal featuring live explainable margin health cards, adverse price shock simulation, simulated lost-ACK order recovery, and idempotent payment deduplication.
* **`/proof/market-night`**: The viral 4-person Crew Pass squad lobby and multi-phase market shock simulation.
* **`/proof/contracts`**: Zod-based contract catalogue, versioned audit records, and oracle fault injection.

---

## 2. Model Methodology & Provenance (Audit of Claims)

Every metric in the prototype is clearly categorized to prevent unsubstantiated claims:

| Metric / Parameter | Value in Model | Provenance | Source / Derivation |
| :--- | :--- | :--- | :--- |
| **Crew Qualification Rate** | $64.1\%$ ($41/64$) | `SIMULATED` | Measured from simulated Market Night run (`marketNightEngine.ts`) |
| **Invite $\rightarrow$ Attendance** | $78.5\%$ | `SIMULATED` | Measured from mock squad formation logs |
| **FX Conversion Spread** | $0.25\%$ | `SIMULATED` | Contract rule parameter in `lib/contracts.ts` |
| **Taker Fee (Recommended)** | $5\text{ bps}$ ($0.05\%$) | `ASSUMED` | Benchmarked against retail Indian derivatives (Dhan/Zerodha) |
| **Traditional Paid CAC** | $\$28.00$ | `ASSUMED` | Benchmark from MoEngage India FinTech Acquisition Report |
| **Derived Crew CAC** | $\$2.40\text{--}\$6.00$ | `DERIVED` | $\text{CAC}_{\text{crew}} = \frac{\text{Events} \cdot \text{Cost} + \text{Perks}}{\text{Crew Signups}}$ |
| **Blended CAC** | Dynamic output | `DERIVED` | $\frac{\text{Total Channel Spend}}{\text{Total Signups across Paid, Crew, Organic, Referral}}$ |
| **LTV / CAC Ratio** | Dynamic output | `DERIVED` | $\text{LTV} = \frac{\text{ARPU}}{1 - r'}$; calculated against blended CAC |
| **Tick / Calc Latency** | $\sim 0.05\text{--}0.2\text{ ms}$ | `MEASURED` | In-browser `performance.now()` compute duration |

---

## 3. Getting Started

### Prerequisites
- Node.js $\ge 18.0.0$
- npm $\ge 9.0.0$

### 1. Installation
```bash
npm install
```

### 2. Run Test Suite
```bash
npm test
```
Runs 17 automated unit and invariant tests covering:
* **Growth Model Invariants**: Funnel monotonicity, determinism, referral $K$-factor limits, sensitivity ordering.
* **Perpetual Margin Calculations**: Maintenance buffer ratios, liquidation pricing, and stale feed masking.
* **Contract Validation Guardrails**: Zod schema rejection of inverted margins and incomplete definitions.
* **Versioned Records**: Immutability of historical receipts across rule bumps ($v1.0 \rightarrow v2.0$).

### 3. Start Local Development
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) for the Decision Cockpit.

### 4. Build for Production (Offline Verification)
```bash
npm run build
```
Generates an optimized, statically verified build for all routes (`/`, `/proof/terminal`, `/proof/market-night`, `/proof/contracts`).

---

## 4. Live Demo Walkthrough (6-Minute Judge Script)

| Time | Segment | What to Show | Key Point to Say |
| :--- | :--- | :--- | :--- |
| **0:00 - 0:30** | **The Thesis** | Open `/` Cockpit, highlight Thesis Banner atop the screen. | *"In Round 1, we argued that MochaTrade must win on trust and community virality, not paid ads. Today, we built the executive tool we use to prove it."* |
| **0:30 - 1:30** | **Baseline vs Recommended** | Toggle tabs between **Baseline** and **Recommended**. Point to KPI strip. | *"Our baseline paid-acquisition model burns capital at \$28 CAC. Shifting 60% of budget into weekly Crew Passes cuts blended CAC down while accelerating LTV:CAC."* |
| **1:30 - 2:45** | **Trust $\rightarrow$ Mathematical Mechanism** | Uncheck *Explainable Margin* or *Lost-ACK Recovery* on the Trust Ladder. Watch retention and support costs shift live. Click **See it work** $\rightarrow$ `/proof/terminal`. | *"Trust is not a decorative badge. Here in the code, our Explainable Margin card and Lost-ACK recovery state machine directly reduce trade disputes and user drop-off."* |
| **2:45 - 3:45** | **Pricing Optimization** | Expand the **Pricing Optimiser** card. Drag the taker fee slider. | *"Because trust reduces customer fee sensitivity, the optimal taker fee shifts from 4 bps to 6 bps, delivering an additional contribution cushion."* |
| **3:45 - 4:45** | **Honest Stress Test** | Select the **Honest Stress** scenario tab. Review the Sensitivity Tornado. | *"To remain intellectually honest: if trust levers fail to alter customer behavior, Baseline wins. The Tornado shows retention is our biggest assumption risk."* |
| **4:45 - 5:30** | **Executive Decision** | Read the auto-generated **Decision Panel** recommendation. | *"The tool synthesizes our call: set taker fee at 5 bps, run 4 Market Nights monthly, and invest in transaction recovery to hit breakeven by month 7."* |
