# Prompt 3: 12-Month Rollout Planner - Integration Complete ✅

## Summary

Successfully integrated all three Prompt 3 components (RolloutPlanner, BaselineComparison, MonthlyProjectionsChart) into the main Decision Cockpit (`src/app/page.tsx`).

---

## What Was Integrated

### 1. **Imports Added**
```typescript
import RolloutPlanner, { Intervention, MarketNightEvent } from '../components/RolloutPlanner';
import BaselineComparison from '../components/BaselineComparison';
import MonthlyProjectionsChart from '../components/MonthlyProjectionsChart';
import { Calendar } from 'lucide-react';
```

### 2. **State Management**
Added comprehensive state for rollout functionality:

```typescript
// Rollout Planner State
const [selectedMonth, setSelectedMonth] = useState(1);
const [showRolloutView, setShowRolloutView] = useState(false);
const [rolloutMetric, setRolloutMetric] = useState<'volume' | 'revenue' | 'traders' | 'contribution'>('revenue');

// Default interventions (3 trust features with different launch schedules)
const [interventions, setInterventions] = useState<Intervention[]>([...]);

// Market Night events (12 months of events)
const [marketNightEvents, setMarketNightEvents] = useState<MarketNightEvent[]>([...]);
```

**Default Interventions:**
1. **Funding/Withdrawal Clarity** - Launch Month 1, 100% coverage (baseline trust feature)
2. **Fee/Exposure Preview** - Launch Month 1, 100% coverage (baseline trust feature)
3. **Transaction Recovery** - Launch Month 3, 80% coverage, 2-month ramp (new intervention with costs)

**Market Night Events:**
- 4 events per month across all 12 months
- 48 capacity per event, 75% attendance
- 85% new prospect share
- ₹3,500 cost per event

### 3. **Event Handlers**
```typescript
const handleInterventionUpdate = useCallback((id: string, updates: Partial<Intervention>) => {
  setInterventions(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
}, []);

const handleMarketNightUpdate = useCallback((month: number, updates: Partial<MarketNightEvent>) => {
  setMarketNightEvents(prev => prev.map(e => e.month === month ? { ...e, ...updates } : e));
}, []);

const handleInterventionClick = useCallback((id: string) => {
  console.log('Intervention clicked:', id);
  // TODO: Open intervention editing drawer
}, []);
```

### 4. **UI Toggle Button**
Added "Show/Hide 12-Month Rollout" button in scenario tabs bar:

```typescript
<button
  onClick={() => setShowRolloutView(!showRolloutView)}
  className={`px-3 py-2 text-[10px] font-semibold rounded mr-3 flex items-center gap-1.5 transition-colors ${
    showRolloutView ? 'bg-[var(--brand)] text-black' : '...'
  }`}>
  <Calendar className="w-3 h-3" />
  {showRolloutView ? 'Hide' : 'Show'} 12-Month Rollout
</button>
```

### 5. **Rollout View Section**
Added expandable section with AnimatePresence that displays when `showRolloutView` is true:

**Components Rendered:**
1. **RolloutPlanner** - 12-month timeline with intervention launches and Market Night events
2. **MonthlyProjectionsChart** - Visual chart of selected metric (volume/revenue/traders/contribution)
3. **BaselineComparison** - Side-by-side comparison showing what differs and monthly impact
4. **Founder Decision Panel** - Analysis of rollout decisions with conditional statements

**Features:**
- Metric selector (4 chart types: volume, revenue, traders, contribution)
- Budget constraint tracking (₹200,000 monthly limit)
- Shared month selection across all components
- Conditional rendering (only shows when comparing baseline vs proposal)

---

## Component Integration Details

### RolloutPlanner Component
**Props Connected:**
- `selectedMonth` - Synced with main state, updates across all components
- `onMonthSelect` - Sets selected month in parent
- `interventions` - Array of trust features with launch schedules
- `onInterventionUpdate` - Updates intervention properties (launch month, coverage, etc.)
- `onInterventionClick` - Opens intervention drawer (placeholder for future)
- `marketNightEvents` - 12 months of event planning
- `onMarketNightUpdate` - Updates event details
- `budgetConstraint` - ₹200,000 monthly budget

**What It Shows:**
- 12-column timeline (Month 1-12)
- Market Night events row (planned vs funded, capacity, signups)
- Intervention rows with launch markers and coverage ramps
- Budget warnings (red border on over-budget months)

### MonthlyProjectionsChart Component
**Props Connected:**
- `baselineResult` - Model output from compare scenario
- `proposalResult` - Model output from active scenario
- `selectedMonth` - Highlights selected month
- `onMonthSelect` - Updates selected month on click
- `metric` - Chart type selector (volume/revenue/traders/contribution)

**What It Shows:**
- Side-by-side bars (baseline gray vs proposal brand color)
- Month selection highlights
- Hover tooltips with exact values
- Selected month details panel with delta

### BaselineComparison Component
**Props Connected:**
- `baselineInputs` - Model inputs from compare scenario
- `proposalInputs` - Model inputs from active scenario
- `baselineResult` - Model output from compare scenario
- `proposalResult` - Model output from active scenario
- `selectedMonth` - Shows snapshot for this month

**What It Shows:**
- Expandable "What differs?" list (pricing, channels, trust, behavior)
- Monthly comparison (traders, volume, revenue, costs, contribution)
- Cumulative metrics through selected month
- Visual indicators (green/red deltas)

---

## Founder Decision Panel

Added analysis panel showing:
1. **Intervention Impact**: "Launching N interventions changes year-one contribution by X"
2. **Cost Breakdown**: Total setup + recurring costs
3. **Selected Month Details**: Active traders and contribution for selected month
4. **Test Scenarios**: 
   - Launch timing experiments
   - Zero behavioral effect testing
   - Intervention prioritization
   - Budget constraint checks

---

## TypeScript Fixes

### Fixed Errors:
1. ✅ Added `Calendar` import from `lucide-react`
2. ✅ Added explicit type annotations for `trustItems` and `behaviorItems` in BaselineComparison:
   ```typescript
   const trustItems: { label: string; baseline: string; proposal: string; changed: boolean }[] = [];
   ```

### Build Status: ✅ SUCCESS
```
✓ Finished TypeScript in 3.7s
✓ Collecting page data using 7 workers in 1599ms
✓ Generating static pages using 7 workers
✓ Finalizing page optimization
```

---

## What Still Needs Implementation

### 1. **Intervention Edit Drawers** (TODO)
Currently `handleInterventionClick` just logs to console. Need to implement:
- Modal/drawer component for editing intervention details
- Launch month slider (1-12)
- Coverage percentage slider (0-100%)
- Ramp duration input
- Setup cost and monthly cost inputs
- Beta coefficient sliders (for advanced users)

### 2. **Intervention Effects on Model** (TODO)
Currently interventions are displayed but don't affect the model calculations. Need to:
- Wire intervention `beta*` values to affect `trustLevers` in model inputs
- Apply coverage ramps to beta effects (e.g., 50% coverage = 50% of full beta effect)
- Add intervention costs to model's cost calculations
- Implement monthly cost accumulation based on launch month

### 3. **Sequential Waterfall Comparison** (TODO)
Per spec: Show incremental impact of adding interventions one by one:
- Define intervention order
- Compute intermediate scenarios
- Show how each intervention adds to the total change
- Disclose order dependence

### 4. **Break-Even Threshold Search** (TODO)
Per spec: Find the minimum intervention effect needed to break even:
- Search within valid assumption bounds
- Hold other assumptions fixed
- Show "No break-even threshold found" when appropriate
- Don't assume solution exists

### 5. **Zero Behavioral Effect Toggle** (TODO)
Per spec: Allow setting all beta coefficients to zero to test:
- "Delivered, but zero behavioural benefit" scenario
- Compare to "Not implemented" scenario
- Show cost vs benefit tradeoff

### 6. **Save/Export Functionality** (TODO)
- Save scenarios to localStorage with versioning
- Export assumptions as JSON (versioned schema)
- Export monthly projections as CSV
- Handle schema migration for old saved data

### 7. **3D Strategy Map Integration** (TODO)
Per spec: "If the repository already contains a working 3D map, connect it"
- Currently no 3D map exists
- Spec says "do not implement a fake or decorative substitute"
- Report as separate missing feature (correctly handled)

---

## Demo Sequence for Founders

### Step 1: View Baseline vs Recommended
1. Ensure "Recommended" scenario is active
2. Compare vs "Baseline" is selected
3. View the one-screen story showing improvement

### Step 2: Open Rollout View
1. Click "Show 12-Month Rollout" button in scenario tabs
2. View expandable rollout section with:
   - 12-month timeline
   - Market Night events
   - Intervention launch schedule

### Step 3: Explore Monthly Projections
1. Switch chart metric (Volume → Revenue → Traders → Contribution)
2. Click different months to see snapshots
3. Observe baseline vs proposal bars

### Step 4: Review Baseline Comparison
1. Expand "What differs?" to see all changed assumptions
2. Review monthly impact for selected month
3. Check cumulative metrics

### Step 5: Read Decision Panel
1. View intervention impact statement
2. Review total costs
3. Read suggested test scenarios

### Step 6: Test Scenarios (Manual)
1. Try changing intervention launch months in state (future: use drawer UI)
2. Observe budget warnings (red months)
3. Switch to different scenarios (Honest Stress)

---

## File Changes

### Modified Files:
1. ✅ `src/app/page.tsx` - Main Decision Cockpit (added ~200 lines)
   - Imports for rollout components
   - State management for rollout planner
   - Event handlers
   - Rollout view toggle button
   - Rollout view section with all 3 components
   - Founder decision panel

2. ✅ `src/components/BaselineComparison.tsx` - Type fixes
   - Added explicit type annotations for `trustItems` and `behaviorItems`

### Created Files (Previous Work):
- `src/components/RolloutPlanner.tsx` (~350 lines)
- `src/components/BaselineComparison.tsx` (~250 lines)
- `src/components/MonthlyProjectionsChart.tsx` (~200 lines)
- `PROMPT3_IMPLEMENTATION.md` (implementation guide)

---

## Next Steps Priority

### Critical (for functional rollout):
1. **Wire interventions to model** - Make intervention changes actually affect calculations
2. **Intervention edit UI** - Add drawer/modal for editing intervention details
3. **Cost integration** - Add intervention costs to model's cost calculations

### Important (for complete spec compliance):
4. **Sequential waterfall** - Show incremental impact of each intervention
5. **Break-even search** - Find minimum effect needed for profitability
6. **Zero effect toggle** - Test "implemented but doesn't work" scenario

### Nice to have (polish):
7. **Save/Export** - Persist scenarios and export data
8. **Better mobile layout** - Optimize rollout view for small screens
9. **Animation polish** - Smooth transitions for intervention ramps

---

## Spec Compliance Checklist

### ✅ Completed:
- [x] 12-column rollout timeline (Month 1-12)
- [x] Market Night events row with capacity/attendance
- [x] Intervention rows with launch markers
- [x] Coverage ramp visualization
- [x] Setup cost and recurring cost display
- [x] Budget constraint tracking with warnings
- [x] Clickable month selection (shared across components)
- [x] Baseline comparison with "What differs?" list
- [x] Monthly projections chart (4 metric types)
- [x] Side-by-side baseline vs proposal
- [x] Founder decision panel with conditional statements
- [x] Correctly avoided fake 3D map implementation

### 🚧 In Progress / TODO:
- [ ] Intervention drawer UI for editing
- [ ] Model integration (intervention effects on calculations)
- [ ] Cost integration (add to model's cost calculations)
- [ ] Sequential waterfall comparison
- [ ] Break-even threshold search
- [ ] Zero behavioral effect toggle
- [ ] Save/Export functionality (JSON/CSV)
- [ ] Schema versioning and migration

### ❌ Not Implemented (Correctly):
- [ ] 3D Strategy Map - Not present in repo, correctly not faked per spec

---

## Technical Notes

### State Management Approach:
- Using React `useState` for all rollout state
- `useCallback` for memoized handlers to prevent re-renders
- State lifted to parent (page.tsx) to enable cross-component communication

### Styling:
- Consistent with existing Decision Cockpit design system
- Uses CSS custom properties (`var(--brand)`, `var(--bg-surface)`, etc.)
- Framer Motion for expand/collapse animations
- Mobile-first responsive grid layout

### Performance:
- Components only render when `showRolloutView` is true
- Chart data computed on-demand using `useMemo`
- Month selection updates all components synchronously

---

## User Experience Flow

1. **Discovery**: User sees "Show 12-Month Rollout" button in scenario tabs
2. **Activation**: Click button to expand rollout section
3. **Exploration**: 
   - View 12-month timeline with interventions
   - Switch chart metrics to see different projections
   - Click months to see snapshots
   - Expand "What differs?" to understand changes
4. **Analysis**: Read founder decision panel for guidance
5. **Iteration**: Change intervention timing (future: via drawer UI)
6. **Comparison**: Toggle back to main view, switch scenarios

---

## Build Verification

```bash
npm run build
```

**Result**: ✅ Success
- TypeScript compilation: ✅ 3.7s
- Static page generation: ✅ All routes
- No errors or warnings

---

## Summary of Achievement

We successfully:
1. ✅ Integrated 3 orphaned components into main Decision Cockpit
2. ✅ Added state management and event handlers
3. ✅ Created expandable rollout view with toggle button
4. ✅ Connected components to share selected month
5. ✅ Added founder decision panel with analysis
6. ✅ Fixed all TypeScript errors
7. ✅ Built successfully with no warnings

**The rollout planner is now accessible in the UI!** Users can click "Show 12-Month Rollout" to view the timeline, projections, and comparisons.

**What remains:** Intervention editing UI, model integration, and advanced features (waterfall, break-even search, zero effect toggle, save/export).
