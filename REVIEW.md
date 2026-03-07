# Code Review #2 -- Investicni Kalkulacka Demo

Reviewer: Principal Architect
Date: 2026-03-07
Previous review: `REVIEW1.md` (on `/Users/plhys18/investicni-kouzelnik/`)

---

## 0. Diff Summary vs REVIEW1

### Issues Fixed

None. The codebase is structurally identical to the version reviewed in REVIEW1. Every issue flagged in the original review remains present in this new repository.

### Issues Still Present (all 19 items from REVIEW1 Priority List)

| REVIEW1 # | Status | Notes |
|------------|--------|-------|
| 1 - Comparison model bias (ETF only invests negative CF) | STILL PRESENT | `calculations.ts` line 104 |
| 2 - `parseInputValue` comma replacement | STILL PRESENT | `formatters.ts` line 57 |
| 3 - No calculation tests | STILL PRESENT | `test/example.test.ts` is still a placeholder |
| 4 - Tax calculator ignores holding exemptions | STILL PRESENT | `TaxImpactCalculator.tsx` line 39 |
| 5 - DCA default returns (BTC 60%, ETH 80%) | STILL PRESENT | `DCACalculator.tsx` lines 25-28 |
| 6 - 41+ unused shadcn/ui components | STILL PRESENT | Same file listing |
| 7 - Unused dependencies (react-query, etc.) | STILL PRESENT | `App.tsx` lines 4, 9, 12 |
| 8 - `as any` casts in MortgageCalculator | STILL PRESENT | `MortgageCalculator.tsx` lines 186-193 |
| 9 - `loadFromURL` untyped params | STILL PRESENT | `useShareURL.ts` lines 54-55 |
| 10 - Dual toast system | STILL PRESENT | `App.tsx` lines 14-15 |
| 11 - Duplicated StatItem / tooltip styles | STILL PRESENT | 3x StatItem, 7+ tooltip objects |
| 12 - PDF export Czech-only headers | STILL PRESENT | `ExportButtons.tsx` lines 47, 71 |
| 13 - Duplicate RATES_TO_CZK | STILL PRESENT | `useCurrency.tsx` line 5, `Index.tsx` line 18 |
| 14 - FIRE monthlySavings not derived | STILL PRESENT | `useCalculatorStore.tsx` lines 107-113 |
| 15 - No error boundaries | STILL PRESENT | None in codebase |
| 16 - Dead `App.css` | STILL PRESENT | Vite boilerplate unchanged |
| 17 - Context causes cross-calculator re-renders | STILL PRESENT | `useCalculatorStore.tsx` line 178 |
| 18 - Slider bounds don't adapt to currency | PARTIALLY ADDRESSED | `constants.ts` adds `maxAmount(currency)` / `maxMonthly(currency)` |
| 19 - No accessibility attributes | STILL PRESENT | No ARIA roles on tabs |

### What Changed (New in This Version)

1. **`src/lib/constants.ts`** is new -- extracts `MORTGAGE_DEFAULTS`, `ETF_DEFAULTS`, `COMPARISON_DEFAULTS`, and currency-aware `maxAmount`/`maxMonthly` functions. This partially addresses REVIEW1 issues 4.6 (magic slider bounds) and 6.2 (slider bounds currency). However, the implementation is incomplete: `FIRECalculator.tsx` line 115 still hardcodes `max={50000000}` for `monthlySavings` without using `maxMonthly(currency)`.

2. **`src/types/index.ts`** is new -- centralizes type definitions for `MortgageInputs`, `ETFInputs`, `AmortizationRow`, `MortgagePayment`, `CompoundInterestResult`, `ComparisonResult`, `ComparisonTimeline`. Good structural improvement, but not used everywhere it should be.

3. **`src/components/layout/Header.tsx`** and **`src/components/layout/TabBar.tsx`** are new -- header and tab navigation extracted into separate components (previously inlined in `Index.tsx`). Clean separation.

4. **`SliderInput.tsx`** now has a custom slider implementation with touch/mouse drag handling, replacing the native HTML `<input type="range">`. More control, but introduces complexity and accessibility regression (see 7.6).

5. **`InputField.tsx`** now supports `readOnly` mode and `displayValue` prop.

6. **Development disclaimer banner** added in `Index.tsx` lines 44-51.

7. **Footer with social links** added in `Index.tsx` lines 73-94.

8. **Dark mode support** via `useDarkMode.ts` hook, with toggle in the header.

9. **Tooltip `contentStyle`** now includes `backgroundColor` and `color` CSS custom properties for dark mode compatibility -- a slight improvement over the previous version's hardcoded colors, but the object is still duplicated 7+ times.

---

## 1. Architecture Issues

### 1.1 Massive Unused Dependency Surface (CRITICAL -- UNCHANGED)

47 shadcn/ui component files remain in `src/components/ui/`. Only 5 custom UI components are used: `SliderInput`, `InputField`, `ResultCard`, `ExportButtons`, `sonner.tsx`, `tooltip.tsx`. The other 41+ files (accordion through toggle-group) are dead weight.

`NavLink.tsx` and `use-mobile.tsx` remain unused by application code.

### 1.2 Dual Toast Systems (UNCHANGED)

`App.tsx` lines 1-2, 14-15: Both Radix `<Toaster />` and Sonner `<Sonner />` are mounted. Only Sonner is used (in `useShareURL.ts`).

### 1.3 QueryClient With No Queries (UNCHANGED)

`App.tsx` lines 4, 9, 12: `QueryClientProvider` wraps the entire app with zero `useQuery`/`useMutation` calls anywhere.

### 1.4 Router With Two Routes (UNCHANGED)

`react-router-dom` used for `/` and `*` (404). The single-page app gains nothing from client-side routing.

### 1.5 Provider Nesting / CurrencyWrapper Bridge (UNCHANGED)

`Index.tsx` lines 100-120: The `CurrencyWrapper` intermediary component still exists solely to bridge `useCalculatorStore()` with `CurrencyProvider`'s `onCurrencyChange`. The `RATES_TO_CZK` duplication between `Index.tsx` line 18 and `useCurrency.tsx` line 5 persists.

### 1.6 All Calculators Rendered Simultaneously (UNCHANGED)

`Index.tsx` lines 66-71: All 6 calculator components render on mount, hidden via `display: none`. Every `useMemo` runs, every Recharts instance initializes.

### 1.7 Context Value Object Not Memoized (UNCHANGED)

`useCalculatorStore.tsx` line 178: The `value` prop passed to `CalculatorContext.Provider` is a fresh object literal on every render. While the setters are stable (wrapped in `useCallback`), the state objects are new references when any state changes, and the encompassing value is always new. This forces all consumers to re-render on any state change anywhere.

---

## 2. Bugs

### 2.1 FIRE Calculator: Post-FIRE Timeline Adds Savings After FIRE (HIGH -- UNCHANGED)

`FIRECalculator.tsx` lines 62-74: After the FIRE target is reached, the visualization extension loop continues to add `monthlySavings` (lines 64, 67). Once FIRE is achieved, a user would presumably stop contributing, but the code models continued contributions indefinitely. This inflates the post-FIRE portfolio visualization and the `totalInvested` / `totalReturn` figures shown in the summary (lines 57-58).

### 2.2 FIRE Calculator: Hardcoded Age 30 (MEDIUM -- UNCHANGED)

`FIRECalculator.tsx` lines 79-82: `fireAge = Math.round(30 + results.yearsToFIRE)`. This computed value is never displayed in the JSX (dead code), but if it were, it would be wrong for every user not aged 30.

### 2.3 Mortgage `tableRows` `as any` Casts (HIGH -- UNCHANGED)

`MortgageCalculator.tsx` lines 186-193: Six `as any` casts to access `.first`, `.last`, `.rows` on an improperly typed discriminated union. `TableRow` component (line 214) also types its `row` prop as `any`.

The fix is straightforward -- define a proper discriminated union:
```typescript
type TableRows =
  | { truncated: false; rows: AmortizationRow[] }
  | { truncated: true; first: AmortizationRow[]; last: AmortizationRow[] };
```
Then use `tableRows.truncated` as the type guard (which the code already does on line 186) and remove the casts.

### 2.4 Comparison ETF Model: Only Invests Negative Cash Flow (HIGH -- UNCHANGED)

`calculations.ts` line 104: `const etfMonthlyContrib = monthlyCashFlow < 0 ? Math.abs(monthlyCashFlow) : 0`. When the mortgage has positive cash flow (rent > expenses + payment), the ETF side gets zero monthly contributions. This systematically biases the comparison toward mortgage because the mortgage side benefits from rental income while the ETF side sits idle with just the initial lump sum.

A fair comparison should invest the equivalent total monthly outflow on the ETF side: the mortgage payment + expenses, regardless of whether rental income covers it.

### 2.5 Tax Calculator: Flat Tax on Terminal Gains, No Exemptions (MEDIUM -- UNCHANGED)

`TaxImpactCalculator.tsx` line 39: `const taxPaid = grossEarnings * (taxRate / 100)`. Tax is applied as a flat percentage on total gains at the end. The UI notes explicitly mention the Czech 3-year holding exemption for ETFs and crypto (`useLanguage.tsx` lines 138-140) but the calculator does not implement it. Users see "exempt after 3 years holding" in the description while the calculator taxes them anyway.

### 2.6 Currency Conversion Rounding Accumulates Error (MEDIUM -- UNCHANGED)

`useCalculatorStore.tsx` line 146: `const c = (v: number) => Math.round(convertFn(v, from, to))`. Each currency switch rounds every monetary value to the nearest integer. Round-tripping CZK -> USD -> CZK loses precision (e.g., 1,000,000 -> 43,478 -> 999,994).

### 2.7 `parseInputValue` Only Replaces First Comma (MEDIUM -- UNCHANGED)

`formatters.ts` line 57: `.replace(',', '.')` -- uses `String.replace` with a string argument, replacing only the first occurrence. Input `1,234,56` becomes `1.234,56` which `Number()` parses as `NaN`, silently returning `0`. Fix: `.replace(/,/g, '.')`.

### 2.8 FIRE: `monthlySavings` Not Derived From Income - Expenses (MEDIUM -- UNCHANGED)

`useCalculatorStore.tsx` lines 107-113: Defaults are income=80000, expenses=35000, savings=25000. But 80000-35000=45000, not 25000. All three are independently settable, allowing contradictory states (savings > income).

### 2.9 NEW: `barData` useMemo Missing `t` Dependency in DCACalculator

`DCACalculator.tsx` lines 74-80: The `barData` useMemo calls `getLabel(r.asset)` (line 76), which internally calls `t(asset.labelKey)` (line 48). But the dependency array on line 80 only lists `[results]`, omitting `t`. When the user switches languages, `barData` will be stale -- the bar chart labels will remain in the old language until another dependency (like `results`) forces recalculation.

### 2.10 NEW: `useLanguage()` Called Twice in IndexInner

`Index.tsx` lines 30-31:
```tsx
const { t } = useLanguage();
const { lang, setLang } = useLanguage();
```
Two separate hook calls on consecutive lines extracting different properties. Should be one call: `const { t, lang, setLang } = useLanguage()`. Not a runtime bug, but unnecessary overhead and a code smell.

### 2.11 NEW: `CurrencyWrapper` has Unstable `handleCurrencyChange` Reference

`Index.tsx` lines 103-105: `handleCurrencyChange` is wrapped in `useCallback` with `[store]` as the dependency. But `store` is the entire `CalculatorStore` context object, which is a new reference every render (see 1.7). Therefore `handleCurrencyChange` is recreated on every render, making the `useCallback` wrapper pointless. `CurrencyProvider` receives a new `onCurrencyChange` prop on every render.

### 2.12 NEW: `comparisonData` Computed but Never Used

`TaxImpactCalculator.tsx` lines 73-79: The `comparisonData` useMemo computes a mapped array from `scenarios` and `t`, but the result is never referenced in the JSX. This is dead computation -- CPU cycles wasted on every re-render.

---

## 3. Performance Problems

### 3.1 Context Value Object Created Every Render (UNCHANGED)

See 1.7 above. Every component using `useCalculatorStore()` re-renders on any state change across any calculator. With all 6 calculators mounted simultaneously (1.6), changing a single mortgage slider triggers re-renders in ETF, DCA, FIRE, Tax, and Comparison calculators.

### 3.2 All Calculators Rendered Simultaneously (UNCHANGED)

See 1.6 above.

### 3.3 Tooltip `contentStyle` Objects Recreated 7+ Times (UNCHANGED)

Identical tooltip `contentStyle` object literals are created inline in:
- `MortgageCalculator.tsx` line 158
- `ETFCalculator.tsx` line 91
- `DCACalculator.tsx` lines 182, 207
- `ComparisonView.tsx` line 140
- `FIRECalculator.tsx` line 167
- `TaxImpactCalculator.tsx` line 170

Seven separate object allocations per render, all identical. Now includes dark-mode CSS variable colors, but still copy-pasted.

### 3.4 YAxis Formatter Duplicated and Hardcoded to Millions (UNCHANGED)

`(v) => \`${(v / 1000000).toFixed(1)}M\`` appears in every chart component. Breaks for small EUR values (500K renders as `0.5M`).

### 3.5 NEW: Custom SliderInput Creates/Destroys Event Listeners on Every Drag Tick

`SliderInput.tsx` lines 61-107: The custom slider registers `touchmove`/`touchend` and `mousemove`/`mouseup` listeners on `document` via `useEffect` when `isDragging` is true. The `getValueFromPosition` callback (line 31) includes `value` in its dependency array, causing it to be recreated on every value change during a drag. Since the mouse/touch `useEffect` blocks (lines 61, 90) depend on `getValueFromPosition`, they clean up and re-subscribe on every single drag tick. Remove `value` from `getValueFromPosition`'s dependency array -- it is not used in the calculation (the function computes from `clientX`, `min`, `max`, `step`).

### 3.6 NEW: `useShareURL` `generateShareURL` Recreated Every Render

`useShareURL.ts` line 46: `generateShareURL` depends on `store` in its `useCallback` dependency array. Since `store` is a new object every render (1.7), `generateShareURL` is recreated on every render, defeating memoization.

---

## 4. Code Quality

### 4.1 StatItem Component Duplicated 3 Times (UNCHANGED)

Defined identically in:
- `MortgageCalculator.tsx` line 207
- `ETFCalculator.tsx` line 136
- `DCACalculator.tsx` line 223

Extract to `src/components/ui/StatItem.tsx`.

### 4.2 Duplicate RATES_TO_CZK (UNCHANGED)

`useCurrency.tsx` line 5 and `Index.tsx` line 18. Two sources of truth for the same exchange rates.

### 4.3 Dead CSS: `App.css` (UNCHANGED)

`App.css` lines 1-43 contain Vite scaffold boilerplate (`.logo`, `.logo-spin`, `.read-the-docs`, `.card`). None are used.

### 4.4 `formatCompact` and `safeNumber` Unused (UNCHANGED)

`formatters.ts` lines 29, 41: Exported but never imported anywhere in the codebase.

### 4.5 Hardcoded 5% Reinvestment Rate (UNCHANGED)

`calculations.ts` line 109: `const cashFlowCompoundRate = 0.05 / 12;` -- not user-configurable, not documented. This hidden assumption affects the mortgage vs ETF comparison outcome.

### 4.6 NEW: `FIRECalculator.tsx` monthlySavings Slider Max Hardcoded

`FIRECalculator.tsx` line 115: `max={50000000}` -- does not use `maxMonthly(currency)` like other calculators. Inconsistent with the new `constants.ts` pattern that was added precisely to solve this problem.

### 4.7 NEW: Dead Computation `comparisonData` in TaxImpactCalculator

`TaxImpactCalculator.tsx` lines 73-79: `comparisonData` is computed via `useMemo` but never referenced in the render output. Wasted computation.

### 4.8 NEW: PDF Title Inconsistencies

PDF titles are not consistently localized:
- `DCACalculator.tsx` line 83: `title: 'DCA'` (hardcoded English abbreviation)
- `FIRECalculator.tsx` line 85: `title: 'FIRE Calculator'` (hardcoded English)
- `ExportButtons.tsx` lines 47, 71: Section headers `'Vstupni parametry'` and `'Vysledky'` hardcoded in Czech

Other calculators correctly use `t('tab.mortgage')`, `t('tab.etf')`, `t('tab.comparison')`, `t('tax.title')`.

---

## 5. Type Safety

### 5.1 `any` Casts in MortgageCalculator (HIGH -- UNCHANGED)

`MortgageCalculator.tsx` lines 186-193: Six `as any` casts. `TableRow` component (line 214) types its `row` prop as `any`.

### 5.2 `any` Types in `loadFromURL` (UNCHANGED)

`useShareURL.ts` lines 54-55:
```typescript
setCurrency: (c: any) => void,
setLang: (l: any) => void,
```
Should be typed as `Currency` and `Lang` respectively. Line 65: `setCurrency(params.get('cur'))` passes `string | null` where `Currency` is expected. A corrupted URL can set currency to any arbitrary string.

### 5.3 `Record<string, any>` in DCACalculator Chart Data (UNCHANGED)

`DCACalculator.tsx` lines 62-64: `Record<string, any>[]` for chart data. No type safety for data flowing into Recharts.

### 5.4 No Input Validation on URL Parameters (UNCHANGED)

`useShareURL.ts` lines 68-92: `JSON.parse` on raw URL parameters with no schema validation. A tampered URL like `?m=[999999999999,NaN,"hello",null]` sets nonsensical values into the store. The `try/catch` on line 93 only catches parse errors, not invalid-but-parseable data.

---

## 6. Financial Model Accuracy

### 6.1 DCA Default Returns Remain Dangerously High (CRITICAL -- UNCHANGED)

`DCACalculator.tsx` lines 25-28: Bitcoin default 60% p.a., Ethereum 80% p.a. The UI descriptions (`useLanguage.tsx` lines 79-80) present these as "average annual returns" for cherry-picked survivorship-biased date ranges. With 5,000 CZK/month DCA at 60% p.a. over 10 years, the calculator projects astronomical returns that no serious financial analysis would endorse.

Forward-looking estimates of 15-20% for BTC and 20-25% for ETH would be more defensible, and even those are aggressive.

### 6.2 Comparison Model Bias (HIGH -- UNCHANGED)

See bug 2.4. The ETF alternative only receives monthly contributions when mortgage cash flow is negative. A fair comparison must model equivalent total capital deployment on both sides.

### 6.3 Tax Model Contradicts Its Own UI Notes (MEDIUM -- UNCHANGED)

See bug 2.5. The 3-year holding exemption is mentioned in the UI text but not modeled in the calculation. Users see "exempt after 3 years" while the calculator taxes them at the full rate regardless of holding period.

### 6.4 No Inflation Adjustment (UNCHANGED)

None of the calculators account for inflation. The FIRE calculator is most affected -- showing a "FIRE target" in nominal terms over 20+ years without inflation adjustment gives false confidence. The 4% withdrawal rule itself was derived from inflation-adjusted returns.

### 6.5 Hardcoded Exchange Rates (UNCHANGED)

`RATES_TO_CZK` uses fixed rates (EUR=25, USD=23). No API fetching, no staleness indicator, no disclosure that these are approximate. These rates will diverge from reality.

---

## 7. Missing / Incomplete Features

### 7.1 No Tests (UNCHANGED)

`src/test/example.test.ts` contains a single placeholder test (`expect(true).toBe(true)`). Zero tests for:
- Calculation functions (`calculations.ts`) -- the core business logic, pure functions, easiest to test
- Currency conversion
- Input parsing (`parseInputValue`, `formatInputDisplay`)
- URL sharing/loading
- Component rendering

### 7.2 No Input Validation Feedback (UNCHANGED)

`parseInputValue` silently returns 0 for invalid input. `SliderInput` clamps values silently. Users receive no error message or visual feedback when their input is rejected or clamped.

### 7.3 No Accessibility (UNCHANGED)

- `TabBar.tsx`: Uses `<button>` elements without `role="tablist"` / `role="tab"` / `aria-selected`
- `SliderInput.tsx`: No `aria-label`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, no `role="slider"`
- Charts have no text alternatives for screen readers
- Color alone distinguishes profit/loss (red/green) -- problematic for color-blind users

### 7.4 NotFound Page English-Only (UNCHANGED)

`NotFound.tsx` lines 15-17: Hardcoded English text ("Oops! Page not found", "Return to Home"), not using `t()` translations.

### 7.5 No Error Boundaries (UNCHANGED)

No React error boundaries exist. A rendering error in one calculator (e.g., division by zero in a chart formatter) crashes the entire application.

### 7.6 NEW: Custom `SliderInput` Has No Keyboard Support

The custom slider in `SliderInput.tsx` handles mouse and touch events but provides no keyboard interaction. Arrow keys do not increment/decrement the value. The slider track is not focusable (`tabIndex` is not set) and has no `role="slider"`. The text input still accepts typed values, but the slider itself is inaccessible via keyboard. This is both an accessibility violation and a usability regression from the native `<input type="range">` that was presumably used before.

---

## 8. Prioritized Fix List

Ordered by severity and production impact:

| # | Issue | Severity | Effort | Section |
|---|-------|----------|--------|---------|
| 1 | **Fix comparison model bias** -- ETF side should invest equivalent total outflow, not just negative cash flow | Critical | Medium | 2.4, 6.2 |
| 2 | **Reduce DCA default returns** to defensible values (BTC ~15-20%, ETH ~20-25%) | Critical | Trivial | 6.1 |
| 3 | **Fix `parseInputValue` comma replacement** -- use `/,/g` regex | High | Trivial | 2.7 |
| 4 | **Add calculation tests** -- pure functions in `calculations.ts`, highest ROI testing target | High | Medium | 7.1 |
| 5 | **Fix tax calculator** -- implement holding exemptions or remove misleading notes from UI | High | Medium | 2.5, 6.3 |
| 6 | **Fix MortgageCalculator `tableRows` type safety** -- proper discriminated union, eliminate all `as any` | High | Low | 2.3, 5.1 |
| 7 | **Remove dead `comparisonData` computation** in TaxImpactCalculator | Medium | Trivial | 2.12, 4.7 |
| 8 | **Fix `barData` useMemo missing `t` dependency** in DCACalculator | Medium | Trivial | 2.9 |
| 9 | **Remove 41+ unused shadcn/ui components** and their Radix dependencies | Medium | Low | 1.1 |
| 10 | **Remove unused dependencies** (react-query, react-router-dom if possible, react-hook-form, zod, date-fns, etc.) | Medium | Low | 1.3, 1.4 |
| 11 | **Type `loadFromURL` parameters** as `Currency` / `Lang` and validate URL input | Medium | Low | 5.2, 5.4 |
| 12 | **Memoize context value** in `useCalculatorStore` (`useMemo` on the value object) | Medium | Low | 1.7, 3.1 |
| 13 | **Deduplicate StatItem component** -- extract to `src/components/ui/StatItem.tsx` | Low | Trivial | 4.1 |
| 14 | **Extract shared tooltip `contentStyle`** to a constant in `lib/constants.ts` | Low | Trivial | 3.3 |
| 15 | **Remove dual toast system** -- keep Sonner, remove Radix toast | Low | Trivial | 1.2 |
| 16 | **Deduplicate `RATES_TO_CZK`** -- single source of truth in `useCurrency.tsx` | Low | Trivial | 4.2 |
| 17 | **Fix FIRE post-FIRE timeline** to stop adding `monthlySavings` after target reached | Low | Low | 2.1 |
| 18 | **Fix FIRE `monthlySavings`** -- derive from income minus expenses, or validate consistency | Low | Low | 2.8 |
| 19 | **Use `maxMonthly(currency)` for FIRE monthlySavings slider** | Low | Trivial | 4.6 |
| 20 | **Localize PDF section headers and titles** via `t()` | Low | Trivial | 4.8 |
| 21 | **Add accessibility** -- ARIA roles on tabs, `role="slider"` + keyboard handlers, color-blind palette | Low | Medium | 7.3, 7.6 |
| 22 | **Remove dead code** -- `App.css`, `formatCompact`, `safeNumber`, `fireAge`, `NavLink.tsx`, `use-mobile.tsx` | Low | Trivial | 4.3, 4.4, 2.2 |
| 23 | **Add error boundaries** around each calculator tab | Low | Low | 7.5 |
| 24 | **Fix `SliderInput` `getValueFromPosition` deps** -- remove `value` from dependency array | Low | Trivial | 3.5 |
| 25 | **Merge duplicate `useLanguage()` calls** in `IndexInner` | Low | Trivial | 2.10 |

---

## Summary

This codebase is a lightly restructured copy of the version reviewed in REVIEW1. The improvements are real but cosmetic:
- Extraction of `Header` and `TabBar` into layout components
- Introduction of `src/types/index.ts` for centralized type definitions
- Introduction of `src/lib/constants.ts` with currency-aware slider bounds
- Custom `SliderInput` with touch drag support
- Dark mode via `useDarkMode` hook
- Development disclaimer banner

**None of the 19 issues from REVIEW1 have been fixed.** The 5 critical/high items (comparison model bias, comma parsing bug, missing tests, tax model mismatch, irresponsible DCA defaults) all remain unchanged. The new version also introduces new issues: a stale `barData` memo dependency (2.9), dead `comparisonData` computation (2.12), inconsistent `maxMonthly` usage (4.6), a keyboard-inaccessible custom slider (7.6), and several `useCallback` wrappers defeated by unstable context references (2.11, 3.6).

**Before any public release:** items 1-6 on the priority list are non-negotiable. Items 7-8 are trivial one-line fixes that should be done immediately. The unused component/dependency cleanup (items 9-10) is the highest-value maintenance win for long-term health.
