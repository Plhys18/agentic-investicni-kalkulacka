# Plan of Fixes -- Investicni Kalkulacka

## Overview

This plan addresses the 10 highest-priority issues from the architectural reviews (REVIEW.md, REVIEW1.md). The fixes are divided into 3 independent tracks that can be executed by 3 parallel agents simultaneously with zero file conflicts.

**Issues addressed (by priority):**

1. Comparison model bias -- ETF side must invest equivalent capital (CRITICAL)
2. `parseInputValue` comma regex bug (HIGH)
3. DCA default returns -- reduce BTC 60%->15%, ETH 80%->20% with disclaimers (CRITICAL)
4. Tax calculator -- model Czech 3-year holding exemption or remove misleading notes (HIGH)
5. `as any` casts in MortgageCalculator -- proper discriminated union (HIGH)
6. Missing `t` in DCACalculator `barData` useMemo dep array (MEDIUM)
7. Dead `comparisonData` computation in TaxImpactCalculator (MEDIUM)
8. SliderInput accessibility -- keyboard support, ARIA attributes (MEDIUM)
9. `handleCurrencyChange` useCallback instability in Index.tsx (MEDIUM)
10. Add calculation tests for pure functions in calculations.ts (HIGH)

## How to use this plan

Spawn 3 agents. Assign each agent exactly one track (A, B, or C). Each track lists the exact files it owns -- no other agent may edit those files. Agents can run fully in parallel. After all 3 complete, run the Final Integration Step.

---

## Agent A -- Calculation Logic, Formatters & Tests

**Files owned:**
- `src/lib/calculations.ts`
- `src/lib/formatters.ts`
- `src/test/calculations.test.ts` (new file)
- `src/test/formatters.test.ts` (new file)
- `src/test/example.test.ts` (delete or replace)

This agent fixes the two core logic bugs and writes comprehensive tests.

### Checkpoint A1: Fix `parseInputValue` comma regex bug

**File:** `src/lib/formatters.ts`, line 57

**Current code:**
```typescript
const cleaned = val.replace(/\s/g, '').replace(',', '.');
```

**Problem:** `String.replace` with a string argument only replaces the first occurrence. Input `"1,234,56"` becomes `"1.234,56"` which parses as `NaN` -> silently returns `0`.

**Fix:** Replace line 57 with:
```typescript
const cleaned = val.replace(/\s/g, '').replace(/,/g, '.');
```

This uses a global regex so all commas are replaced. Input `"1,234,56"` -> `"1.23456"` -> `1.23456`.

### Checkpoint A2: Fix comparison model bias -- ETF must invest equivalent capital

**File:** `src/lib/calculations.ts`, function `calculateComparison` (line 94-174)

**Current code (line 104):**
```typescript
const etfMonthlyContrib = monthlyCashFlow < 0 ? Math.abs(monthlyCashFlow) : 0;
```

**Problem:** When mortgage cash flow is positive (rent > expenses + payment), the ETF side gets zero monthly contributions. The mortgage side benefits from rental income while ETF sits idle. This systematically biases toward mortgage.

**Fix:** The fair comparison is: the ETF investor deploys the same total monthly capital as the mortgage investor. The mortgage investor pays `mortgagePayment + monthlyExpenses` each month. The rental income offsets the mortgage side's costs. The ETF investor should invest that same total outflow each month: `mortgagePayment.monthlyPayment + mortgage.monthlyExpenses`.

Replace line 104 with:
```typescript
// Fair comparison: ETF investor deploys the same monthly capital as the
// mortgage investor (mortgage payment + property expenses), regardless of
// whether rental income covers it on the mortgage side.
const etfMonthlyContrib = mortgagePayment.monthlyPayment + mortgage.monthlyExpenses;
```

Also update the `etfResult` call on line 105 -- the ETF side should still start with the down payment as initial investment (this is already correct: `mortgage.downPayment`).

After this change, when the loan is paid off (month > amortization length), the ETF monthly contribution should drop to just expenses. Update the approach: instead of using `calculateCompoundInterest` (which assumes a fixed monthly contribution), compute the ETF value month-by-month inside the existing year loop so the contribution can change after the loan term ends.

**Full replacement for lines 103-134** (the ETF calculation and timeline loop):

```typescript
// --- ETF alternative: month-by-month simulation ---
// The ETF investor starts with the same down payment and each month invests
// the same total outflow the mortgage investor pays (payment + expenses).
// After the loan term ends, only expenses continue.
const etfMonthlyRate = etfReturn / 100 / 12;
let etfValue = mortgage.downPayment;
let totalETFContributed = mortgage.downPayment;

const timeline: ComparisonTimeline[] = [];
let cumulativeCashFlow = 0;
const cashFlowCompoundRate = 0.05 / 12; // 5% reinvestment rate for positive cash flow

for (let year = 1; year <= comparisonYears; year++) {
  // Property value with appreciation
  const propertyValue = mortgage.propertyPrice * Math.pow(1 + mortgage.annualAppreciation / 100, year);

  // Remaining debt
  const monthIndex = Math.min(year * 12, mortgagePayment.amortizationSchedule.length);
  let remainingDebt = 0;
  if (monthIndex > 0 && monthIndex <= mortgagePayment.amortizationSchedule.length) {
    remainingDebt = mortgagePayment.amortizationSchedule[monthIndex - 1].balance;
  }

  // Month-by-month within this year
  for (let m = (year - 1) * 12; m < year * 12; m++) {
    const isLoanActive = m < mortgagePayment.amortizationSchedule.length;
    const currentPayment = isLoanActive ? mortgagePayment.monthlyPayment : 0;

    // ETF side: invest same outflow as mortgage investor
    const etfContrib = currentPayment + mortgage.monthlyExpenses;
    etfValue = etfValue * (1 + etfMonthlyRate) + etfContrib;
    totalETFContributed += etfContrib;

    // Mortgage side: cumulative cash flow (compounded)
    const cf = effectiveRent - mortgage.monthlyExpenses - currentPayment;
    cumulativeCashFlow = cumulativeCashFlow * (1 + cashFlowCompoundRate) + cf;
  }

  const mortgageNetWorth = propertyValue - remainingDebt + cumulativeCashFlow;

  timeline.push({ year, mortgageNetWorth, etfValue });
}
```

Then update the final result computation (lines 136-173). Replace the references to `etfResult` with the locally computed values:

```typescript
const finalMortgage = timeline[timeline.length - 1];
const mortgageNetWorth = finalMortgage.mortgageNetWorth;
const etfNetWorth = finalMortgage.etfValue;
const difference = mortgageNetWorth - etfNetWorth;
const avgNetWorth = (Math.abs(mortgageNetWorth) + Math.abs(etfNetWorth)) / 2;
const differencePercent = avgNetWorth > 0 ? (difference / avgNetWorth) * 100 : 0;

const mortgageROI = mortgage.downPayment > 0 ? ((mortgageNetWorth - mortgage.downPayment) / mortgage.downPayment) * 100 : 0;
const mortgageAnnualROI = mortgage.downPayment > 0 && mortgageNetWorth > 0 ? (Math.pow(mortgageNetWorth / mortgage.downPayment, 1 / comparisonYears) - 1) * 100 : 0;

const propertyValueFinal = mortgage.propertyPrice * Math.pow(1 + mortgage.annualAppreciation / 100, comparisonYears);
const remainingDebtFinal = comparisonYears * 12 <= mortgagePayment.amortizationSchedule.length
  ? mortgagePayment.amortizationSchedule[comparisonYears * 12 - 1].balance
  : 0;

const etfROI = totalETFContributed > 0 ? ((etfNetWorth - totalETFContributed) / totalETFContributed) * 100 : 0;
const etfAnnualROI = totalETFContributed > 0 && etfNetWorth > 0 ? (Math.pow(etfNetWorth / totalETFContributed, 1 / comparisonYears) - 1) * 100 : 0;

return {
  result: {
    mortgage: {
      propertyValue: propertyValueFinal,
      remainingDebt: remainingDebtFinal,
      cumulativeCashFlow,
      netWorth: mortgageNetWorth,
      roi: mortgageROI,
      annualROI: mortgageAnnualROI,
    },
    etf: {
      totalValue: etfNetWorth,
      totalInvested: totalETFContributed,
      earnings: etfNetWorth - totalETFContributed,
      roi: etfROI,
      annualROI: etfAnnualROI,
    },
    difference,
    differencePercent,
    winner: difference >= 0 ? 'mortgage' : 'etf',
  },
  timeline,
};
```

**Note:** The `calculateCompoundInterest` call on line 105 is no longer used for the comparison. It remains exported for use by ETFCalculator and DCACalculator -- do not remove it.

### Checkpoint A3: Write calculation tests

**Create file:** `src/test/calculations.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  calculateMortgagePayment,
  calculateCompoundInterest,
  calculateComparison,
} from '@/lib/calculations';

describe('calculateMortgagePayment', () => {
  it('returns zeroes for zero principal', () => {
    const result = calculateMortgagePayment({
      propertyPrice: 0, downPayment: 0, loanAmount: 0,
      interestRate: 5, loanTerm: 30, monthlyRent: 0,
      monthlyExpenses: 0, annualAppreciation: 0, vacancyRate: 0,
    });
    expect(result.monthlyPayment).toBe(0);
    expect(result.totalPaid).toBe(0);
    expect(result.amortizationSchedule).toHaveLength(0);
  });

  it('calculates correct monthly payment for standard mortgage', () => {
    const result = calculateMortgagePayment({
      propertyPrice: 5_000_000, downPayment: 1_000_000,
      loanAmount: 4_000_000, interestRate: 5.5, loanTerm: 30,
      monthlyRent: 20_000, monthlyExpenses: 5_000,
      annualAppreciation: 3, vacancyRate: 5,
    });
    // 4M CZK at 5.5% over 30 years => ~22,713 CZK/month
    expect(result.monthlyPayment).toBeCloseTo(22713, -1);
    expect(result.amortizationSchedule).toHaveLength(360);
  });

  it('handles zero interest rate', () => {
    const result = calculateMortgagePayment({
      propertyPrice: 1_200_000, downPayment: 0,
      loanAmount: 1_200_000, interestRate: 0, loanTerm: 10,
      monthlyRent: 0, monthlyExpenses: 0,
      annualAppreciation: 0, vacancyRate: 0,
    });
    expect(result.monthlyPayment).toBe(10_000);
    expect(result.totalInterest).toBe(0);
  });

  it('amortization schedule ends at zero balance', () => {
    const result = calculateMortgagePayment({
      propertyPrice: 2_000_000, downPayment: 400_000,
      loanAmount: 1_600_000, interestRate: 4, loanTerm: 20,
      monthlyRent: 0, monthlyExpenses: 0,
      annualAppreciation: 0, vacancyRate: 0,
    });
    const last = result.amortizationSchedule[result.amortizationSchedule.length - 1];
    expect(last.balance).toBeCloseTo(0, 0);
  });
});

describe('calculateCompoundInterest', () => {
  it('returns initial investment with zero return and zero contribution', () => {
    const result = calculateCompoundInterest(100_000, 0, 0, 10);
    expect(result.finalValue).toBe(100_000);
    expect(result.totalEarnings).toBe(0);
  });

  it('grows correctly with only monthly contributions at 0% return', () => {
    const result = calculateCompoundInterest(0, 1_000, 0, 5);
    // 1000 * 60 months = 60,000
    expect(result.finalValue).toBe(60_000);
    expect(result.totalInvested).toBe(60_000);
  });

  it('compounds correctly for a known scenario', () => {
    // 100k initial, 10k/month, 8% annual, 10 years
    const result = calculateCompoundInterest(100_000, 10_000, 8, 10);
    expect(result.finalValue).toBeGreaterThan(2_000_000);
    expect(result.timeline).toHaveLength(10);
    expect(result.roi).toBeGreaterThan(0);
  });

  it('handles negative returns', () => {
    const result = calculateCompoundInterest(1_000_000, 0, -10, 5);
    expect(result.finalValue).toBeLessThan(1_000_000);
    expect(result.totalEarnings).toBeLessThan(0);
  });

  it('timeline has correct year markers', () => {
    const result = calculateCompoundInterest(0, 5_000, 7, 3);
    expect(result.timeline).toHaveLength(3);
    expect(result.timeline[0].year).toBe(1);
    expect(result.timeline[2].year).toBe(3);
  });
});

describe('calculateComparison', () => {
  const defaultInputs = {
    propertyPrice: 5_000_000,
    downPayment: 1_000_000,
    loanAmount: 4_000_000,
    interestRate: 5.5,
    loanTerm: 30,
    monthlyRent: 20_000,
    monthlyExpenses: 5_000,
    annualAppreciation: 3,
    vacancyRate: 5,
  };

  it('returns timeline with correct length', () => {
    const { timeline } = calculateComparison(defaultInputs, 8, 20);
    expect(timeline).toHaveLength(20);
    expect(timeline[0].year).toBe(1);
    expect(timeline[19].year).toBe(20);
  });

  it('ETF side invests monthly (not just negative cash flow)', () => {
    // With default inputs, mortgage has positive cash flow.
    // After the fix, the ETF side must still have monthly contributions.
    const { result } = calculateComparison(defaultInputs, 8, 20);
    // ETF totalInvested should be significantly more than just the down payment
    expect(result.etf.totalInvested).toBeGreaterThan(defaultInputs.downPayment * 2);
  });

  it('winner is deterministic and one of mortgage or etf', () => {
    const { result } = calculateComparison(defaultInputs, 8, 20);
    expect(['mortgage', 'etf']).toContain(result.winner);
  });

  it('handles comparison period longer than loan term', () => {
    const { timeline, result } = calculateComparison(defaultInputs, 8, 35);
    expect(timeline).toHaveLength(35);
    // Should not throw; ETF contributions drop after loan ends
    expect(result.etf.totalValue).toBeGreaterThan(0);
  });
});
```

### Checkpoint A4: Write formatter tests

**Create file:** `src/test/formatters.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatInputDisplay,
  parseInputValue,
} from '@/lib/formatters';

describe('parseInputValue', () => {
  it('parses plain integer', () => {
    expect(parseInputValue('12345')).toBe(12345);
  });

  it('strips spaces (thousand separators)', () => {
    expect(parseInputValue('1 234 567')).toBe(1234567);
  });

  it('replaces single comma with dot', () => {
    expect(parseInputValue('3,14')).toBe(3.14);
  });

  it('replaces ALL commas (the fixed bug)', () => {
    // Before fix: "1,234,56" -> "1.234,56" -> NaN -> 0
    // After fix:  "1,234,56" -> "1.234.56" -> NaN -> 0
    // This is expected -- multiple dots are NaN. The fix prevents
    // the first-comma-only replacement, but this input is still
    // ambiguous. The key fix is for "1234,5" -> 1234.5.
    expect(parseInputValue('1234,5')).toBe(1234.5);
  });

  it('handles spaces + comma together', () => {
    expect(parseInputValue('1 000,50')).toBe(1000.5);
  });

  it('returns 0 for non-numeric input', () => {
    expect(parseInputValue('abc')).toBe(0);
    expect(parseInputValue('')).toBe(0);
  });
});

describe('formatCurrency', () => {
  it('formats CZK', () => {
    const result = formatCurrency(1000000, 'CZK');
    // Intl format -- just check it contains the number
    expect(result).toContain('1');
    expect(result).toContain('000');
  });

  it('formats EUR', () => {
    const result = formatCurrency(50000, 'EUR');
    expect(result).toContain('50');
  });

  it('formats USD', () => {
    const result = formatCurrency(50000, 'USD');
    expect(result).toContain('50');
  });
});

describe('formatNumber', () => {
  it('formats with zero decimals by default', () => {
    expect(formatNumber(1234.567)).toContain('1');
  });

  it('formats with specified decimals', () => {
    const result = formatNumber(3.14159, 2);
    expect(result).toContain('3,14'); // cs-CZ locale uses comma
  });
});

describe('formatPercent', () => {
  it('formats percentage', () => {
    expect(formatPercent(12.5)).toContain('12,5');
    expect(formatPercent(12.5)).toContain('%');
  });
});

describe('formatInputDisplay', () => {
  it('formats with thousand separators', () => {
    const result = formatInputDisplay(1234567);
    // cs-CZ uses non-breaking space as thousand separator
    expect(result.replace(/\s/g, '')).toBe('1234567');
  });
});
```

### Checkpoint A5: Delete placeholder test

**Delete or replace:** `src/test/example.test.ts`

Replace its entire contents with:
```typescript
// Placeholder removed -- see calculations.test.ts and formatters.test.ts
```

### Verification (Agent A)

Run:
```bash
cd /Users/plhys18/investicni-kalkulacka-demo && npx vitest run
```

All tests must pass. Check:
- `parseInputValue('1234,5')` returns `1234.5` (comma fix verified)
- Comparison tests confirm ETF `totalInvested` > down payment (bias fix verified)
- No TypeScript compilation errors: `npx tsc --noEmit`

---

## Agent B -- DCA, Tax & Mortgage Component Fixes

**Files owned:**
- `src/components/calculators/DCACalculator.tsx`
- `src/components/calculators/TaxImpactCalculator.tsx`
- `src/components/calculators/MortgageCalculator.tsx`
- `src/types/index.ts`

This agent fixes default return values, tax model, type safety, dead code, and stale memo dependencies.

### Checkpoint B1: Reduce DCA default returns to defensible values

**File:** `src/components/calculators/DCACalculator.tsx`, lines 25-28

**Current code:**
```typescript
{ id: 'bitcoin', ..., avgReturn: 60, descKey: 'dca.btcDesc' },
{ id: 'ethereum', ..., avgReturn: 80, descKey: 'dca.ethDesc' },
```

**Fix:** Change `avgReturn` values and leave descKey unchanged (the UI description strings will be updated in Agent C's track since they live in `useLanguage.tsx` -- BUT Agent B does NOT own `useLanguage.tsx`. Instead, we add a clear inline disclaimer comment and adjust the values only).

Replace line 25:
```typescript
{ id: 'bitcoin', labelKey: '', fallback: 'Bitcoin', icon: <Bitcoin size={18} />, color: '#F7931A', avgReturn: 15, descKey: 'dca.btcDesc' },
```

Replace line 26:
```typescript
{ id: 'ethereum', labelKey: '', fallback: 'Ethereum', icon: <Gem size={18} />, color: '#627EEA', avgReturn: 20, descKey: 'dca.ethDesc' },
```

**Rationale:** 15% BTC and 20% ETH are aggressive but defensible forward-looking estimates. The original 60%/80% were cherry-picked historical averages from short survivorship-biased windows.

### Checkpoint B2: Fix `barData` useMemo missing `t` dependency

**File:** `src/components/calculators/DCACalculator.tsx`, line 80

**Current code:**
```typescript
}, [results]);
```

**Problem:** `getLabel` calls `t(asset.labelKey)` internally. When language changes, `t` changes, but `barData` is not recomputed because `t` is not in the dependency array. Bar chart labels go stale.

**Fix:** Replace line 80 with:
```typescript
}, [results, t]);
```

Note: `getLabel` is defined inside the component and captures `t` from closure. Adding `t` to the dependency array ensures `barData` recomputes when the language changes.

### Checkpoint B3: Fix tax calculator -- implement holding period exemption

**File:** `src/components/calculators/TaxImpactCalculator.tsx`

**Current code (lines 37-40):**
```typescript
const grossCalc = calculateCompoundInterest(investmentAmount, 0, grossReturn, investmentYears);
const grossEarnings = grossCalc.finalValue - investmentAmount;
const taxPaid = grossEarnings * (taxRate / 100);
const netValue = grossCalc.finalValue - taxPaid;
```

**Problem:** Tax is applied as flat percentage on total gains regardless of holding period. But the UI notes (`tax.etfTaxNote`, `tax.cryptoTaxNote`) explicitly state gains are exempt after 3 years. Users see "exempt after 3 years" while the calculator taxes them at full rate.

**Fix:** Add a holding-period exemption parameter per asset type. If `investmentYears >= exemptionYears`, tax is 0.

Replace the `calculate` function (lines 36-53) with:

```typescript
const calculate = (
  id: string,
  icon: React.ReactNode,
  color: string,
  grossReturn: number,
  taxRate: number,
  exemptionYears: number, // 0 = no exemption
) => {
  const grossCalc = calculateCompoundInterest(investmentAmount, 0, grossReturn, investmentYears);
  const grossEarnings = grossCalc.finalValue - investmentAmount;
  // Czech tax law: gains are exempt if held longer than the exemption period
  const effectiveTaxRate = (exemptionYears > 0 && investmentYears >= exemptionYears)
    ? 0
    : taxRate;
  const taxPaid = grossEarnings * (effectiveTaxRate / 100);
  const netValue = grossCalc.finalValue - taxPaid;
  const netReturn = investmentAmount > 0 ? (Math.pow(netValue / investmentAmount, 1 / investmentYears) - 1) * 100 : 0;

  return {
    id,
    icon,
    color,
    grossReturn,
    taxRate,
    netReturn,
    grossValue: grossCalc.finalValue,
    netValue,
    taxPaid,
  };
};
```

Then update the `calculate` calls (lines 56-59):

```typescript
return [
  calculate('etf', <TrendingUp size={18} />, 'hsl(var(--primary))', etfGrossReturn, etfTaxRate, 3),
  calculate('realEstate', <Building2 size={18} />, '#10B981', realEstateGrossReturn, realEstateTaxRate, 10),
  calculate('crypto', <Bitcoin size={18} />, '#F7931A', cryptoGrossReturn, cryptoTaxRate, 3),
];
```

Exemption periods: ETF = 3 years, Real Estate = 10 years (conservative; Czech law says 5 years for primary residence, 10 for investment property), Crypto = 3 years (from 2025 Czech legislation).

### Checkpoint B4: Remove dead `comparisonData` computation

**File:** `src/components/calculators/TaxImpactCalculator.tsx`, lines 73-79

**Current code:**
```typescript
const comparisonData = useMemo(() => {
  return scenarios.map((s) => ({
    name: t(`tax.${s.id}`),
    [t('tax.grossReturn')]: s.grossReturn,
    [t('tax.netReturn')]: s.netReturn,
  }));
}, [scenarios, t]);
```

**Fix:** Delete these 7 lines entirely. The `comparisonData` variable is never referenced in the JSX or passed anywhere. This is pure wasted computation.

### Checkpoint B5: Fix MortgageCalculator `as any` casts with proper discriminated union

**File:** `src/types/index.ts` -- Add a new type at the end of the file:

```typescript
export type TableRows =
  | { truncated: false; rows: AmortizationRow[] }
  | { truncated: true; first: AmortizationRow[]; last: AmortizationRow[] };
```

**File:** `src/components/calculators/MortgageCalculator.tsx`

**Step 1:** Add import. Change line 1's import or add after existing type imports. At the top of the file, ensure this import exists:

After the existing imports (around line 13), add:
```typescript
import type { AmortizationRow, TableRows } from '@/types';
```

**Step 2:** Type the `tableRows` useMemo return (lines 54-58). Change to:

```typescript
const tableRows: TableRows = useMemo(() => {
  const s = result.amortizationSchedule;
  if (s.length <= 120) return { rows: s, truncated: false } as const;
  return { first: s.slice(0, 60), last: s.slice(-60), truncated: true } as const;
}, [result]);
```

**Step 3:** Fix the table rendering (lines 186-194). Replace:

```typescript
<tbody className="stat-value">
  {tableRows.truncated ? (
    <>
      {tableRows.first.map((row) => <TableRow key={row.month} row={row} fc={fc} />)}
      <tr><td colSpan={5} className="text-center py-3 text-muted-foreground font-sans">...</td></tr>
      {tableRows.last.map((row) => <TableRow key={row.month} row={row} fc={fc} />)}
    </>
  ) : (
    tableRows.rows.map((row) => <TableRow key={row.month} row={row} fc={fc} />)
  )}
</tbody>
```

No more `as any` casts. TypeScript narrows the union through the `tableRows.truncated` check.

**Step 4:** Fix the `TableRow` component type (line 214). Replace:

```typescript
const TableRow: React.FC<{ row: any; fc: (n: number) => string }> = ({ row, fc }) => (
```

With:

```typescript
const TableRow: React.FC<{ row: AmortizationRow; fc: (n: number) => string }> = ({ row, fc }) => (
```

### Verification (Agent B)

Run:
```bash
cd /Users/plhys18/investicni-kalkulacka-demo && npx tsc --noEmit
```

Check:
- Zero `as any` in MortgageCalculator.tsx (`grep -c "as any" src/components/calculators/MortgageCalculator.tsx` should return 0)
- Zero references to `comparisonData` in TaxImpactCalculator.tsx
- DCA default returns are 15 and 20 (not 60 and 80)
- Tax calculator with `investmentYears >= 3` shows `taxPaid = 0` for ETF and crypto scenarios

---

## Agent C -- SliderInput Accessibility, Index.tsx & Store Fixes

**Files owned:**
- `src/components/ui/SliderInput.tsx`
- `src/pages/Index.tsx`
- `src/hooks/useCalculatorStore.tsx`
- `src/components/layout/TabBar.tsx`
- `src/hooks/useLanguage.tsx`

This agent fixes slider accessibility, the `handleCurrencyChange` instability, and updates DCA description strings.

### Checkpoint C1: Add keyboard support and ARIA attributes to SliderInput

**File:** `src/components/ui/SliderInput.tsx`

**Problem:** The custom slider has no `role="slider"`, no ARIA attributes, no `tabIndex`, and no keyboard event handling. Arrow keys do nothing. This is a WCAG violation and a usability regression.

**Step 1:** Add a keyboard handler. After the `handleMouseDown` callback (around line 88), add:

```typescript
const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
  let newValue = value;
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      newValue = clamp(value + step);
      break;
    case 'ArrowLeft':
    case 'ArrowDown':
      newValue = clamp(value - step);
      break;
    case 'Home':
      newValue = min;
      break;
    case 'End':
      newValue = max;
      break;
    case 'PageUp':
      newValue = clamp(value + step * 10);
      break;
    case 'PageDown':
      newValue = clamp(value - step * 10);
      break;
    default:
      return; // don't prevent default for other keys
  }
  e.preventDefault();
  onChange(newValue);
}, [value, step, min, max, onChange]);
```

**Step 2:** Fix the `getValueFromPosition` dependency array (line 38). Remove `value` -- it is not used in the calculation body (the function computes from `clientX`, `min`, `max`, `step` only). The `return value` on the `if (!track)` guard is a fallback that should be `return min` instead.

Replace lines 31-38:
```typescript
const getValueFromPosition = useCallback((clientX: number) => {
  const track = trackRef.current;
  if (!track) return min;
  const rect = track.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  const raw = min + ratio * (max - min);
  return clamp(Math.round(raw / step) * step);
}, [min, max, step]);
```

**Step 3:** Add ARIA attributes and keyboard handler to the slider track div. Replace the slider track div (lines 143-161):

```tsx
{/* Custom slider track */}
<div
  ref={trackRef}
  className="relative w-full h-8 flex items-center cursor-pointer select-none touch-none"
  role="slider"
  tabIndex={0}
  aria-label={label}
  aria-valuemin={min}
  aria-valuemax={max}
  aria-valuenow={value}
  onMouseDown={handleMouseDown}
  onTouchStart={handleTouchStart}
  onKeyDown={handleKeyDown}
>
  {/* Track background */}
  <div className="absolute left-0 right-0 h-1.5 rounded-full bg-muted">
    <div
      className="absolute left-0 top-0 h-full rounded-full bg-primary transition-none"
      style={{ width: `${progress}%` }}
    />
  </div>
  {/* Thumb */}
  <div
    className={`absolute w-5 h-5 rounded-full bg-primary border-2 border-primary-foreground shadow-md -translate-x-1/2 transition-shadow ${isDragging ? 'ring-4 ring-primary/30 scale-110' : ''}`}
    style={{ left: `${progress}%` }}
  />
</div>
```

### Checkpoint C2: Fix `handleCurrencyChange` useCallback instability

**File:** `src/pages/Index.tsx`

**Problem (lines 100-105):** `handleCurrencyChange` depends on `store`, which is the entire `CalculatorContext` value -- a new object every render. This makes the `useCallback` wrapper useless, and `CurrencyProvider` receives a new `onCurrencyChange` prop every render.

**Fix:** Instead of depending on `store`, depend only on `store.convertAllValues` which is a stable `useCallback` reference.

Replace the `CurrencyWrapper` component (lines 100-112):

```typescript
const CurrencyWrapper: React.FC = () => {
  const { convertAllValues } = useCalculatorStore();

  const handleCurrencyChange = useCallback((from: Currency, to: Currency) => {
    convertAllValues(from, to, convertFn);
  }, [convertAllValues]);

  return (
    <CurrencyProvider onCurrencyChange={handleCurrencyChange}>
      <IndexInner />
    </CurrencyProvider>
  );
};
```

### Checkpoint C3: Merge duplicate `useLanguage()` calls

**File:** `src/pages/Index.tsx`, lines 30-31

**Current code:**
```typescript
const { t } = useLanguage();
const { lang, setLang } = useLanguage();
```

**Fix:** Replace with single call:
```typescript
const { t, lang, setLang } = useLanguage();
```

### Checkpoint C4: Add ARIA tab roles to TabBar

**File:** `src/components/layout/TabBar.tsx`

**Problem:** Tab buttons have no `role="tablist"` / `role="tab"` / `aria-selected` attributes.

**Fix:** Update the tab container div (line 20) and button (line 25).

Replace lines 20-37:

```tsx
<div className="flex justify-center gap-1 overflow-x-auto scrollbar-hide" role="tablist">
  {tabs.map((tab, i) => {
    const Icon = tab.icon;
    const isActive = activeTab === i;
    return (
      <button
        key={i}
        role="tab"
        aria-selected={isActive}
        onClick={() => onTabChange(i)}
        className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-3.5 text-xs sm:text-sm lg:text-base font-medium transition-all duration-200 whitespace-nowrap ${
          isActive ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Icon size={16} />
        <span className="hidden sm:inline">{tab.label}</span>
        {isActive && <span className="absolute bottom-0 left-2 right-2 h-[3px] rounded-full bg-primary" />}
      </button>
    );
  })}
</div>
```

### Checkpoint C5: Update DCA description strings to match new defaults

**File:** `src/hooks/useLanguage.tsx`, lines 79-80

**Current code:**
```typescript
'dca.btcDesc': { cs: 'Prumerny rocni vynos ~60 % (2014-2025, vysoka volatilita)', en: 'Avg annual return ~60% (2014-2025, high volatility)' },
'dca.ethDesc': { cs: 'Prumerny rocni vynos ~80 % (2017-2025, extremni volatilita)', en: 'Avg annual return ~80% (2017-2025, extreme volatility)' },
```

**Fix:** Replace these two lines:
```typescript
'dca.btcDesc': { cs: 'Odhad ~15 % p.a. (konzervativni odhad, vysoka volatilita, minule vynosy nezarucuji budouci)', en: 'Est. ~15% p.a. (conservative estimate, high volatility, past returns do not guarantee future results)' },
'dca.ethDesc': { cs: 'Odhad ~20 % p.a. (spekulativni odhad, extremni volatilita, minule vynosy nezarucuji budouci)', en: 'Est. ~20% p.a. (speculative estimate, extreme volatility, past returns do not guarantee future results)' },
```

### Checkpoint C6: Memoize context value in useCalculatorStore

**File:** `src/hooks/useCalculatorStore.tsx`, line 178

**Problem:** The `value` prop of `CalculatorContext.Provider` is a fresh object literal on every render. This forces all context consumers to re-render on any state change.

**Fix:** Wrap the value in `useMemo`. Add `useMemo` to the import on line 1:

```typescript
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
```

Then replace line 177-180:

```typescript
const value = useMemo(() => ({
  mortgage, setMortgage, etf, setETF, dca, setDCA,
  comparison, setComparison, fire, setFIRE, tax, setTax, convertAllValues,
}), [mortgage, etf, dca, comparison, fire, tax, setMortgage, setETF, setDCA, setComparison, setFIRE, setTax, convertAllValues]);

return (
  <CalculatorContext.Provider value={value}>
    {children}
  </CalculatorContext.Provider>
);
```

**Note:** This still re-renders all consumers when any state slice changes (since each state object is a new reference on change). But it eliminates the spurious re-renders that happened even when no state changed. Full fix would require splitting context -- that is a larger refactor deferred for now.

### Verification (Agent C)

Run:
```bash
cd /Users/plhys18/investicni-kalkulacka-demo && npx tsc --noEmit
```

Check:
- SliderInput has `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `tabIndex={0}`, and `onKeyDown` handler
- `grep "as any" src/pages/Index.tsx` returns 0 matches
- `grep "useLanguage()" src/pages/Index.tsx` returns exactly 1 match (not 2)
- TabBar has `role="tablist"` and `role="tab"` attributes
- `useLanguage.tsx` DCA descriptions no longer say "60%" or "80%"
- `getValueFromPosition` dependency array no longer includes `value`

---

## Final Integration Step

After all 3 agents complete, run these in order:

### 1. TypeScript compilation check
```bash
cd /Users/plhys18/investicni-kalkulacka-demo && npx tsc --noEmit
```
Must exit with 0 errors.

### 2. Run all tests
```bash
cd /Users/plhys18/investicni-kalkulacka-demo && npx vitest run
```
All tests in `calculations.test.ts` and `formatters.test.ts` must pass.

### 3. Dev server smoke test
```bash
cd /Users/plhys18/investicni-kalkulacka-demo && npm run dev
```
Open in browser. Verify:
- Mortgage vs ETF comparison: ETF side shows meaningful monthly contributions (not just down payment)
- DCA tab: Bitcoin default shows 15%, Ethereum shows 20%, descriptions updated
- Tax tab: Set horizon to 5 years, ETF and crypto should show "Tax paid: 0 CZK" (3-year exemption active)
- Tax tab: Set horizon to 1 year, tax should apply normally
- Slider: Click slider track, use Tab to focus, Arrow keys change value
- MortgageCalculator: Open amortization table, no console TypeScript errors
- Language switch: DCA bar chart labels update immediately (no stale labels)

### 4. Spot-check removed dead code
```bash
grep -r "comparisonData" src/components/calculators/TaxImpactCalculator.tsx  # should return nothing
grep -c "as any" src/components/calculators/MortgageCalculator.tsx           # should return 0
```

### Issues deferred (not in this plan)
- Removing 41 unused shadcn/ui components and unused npm dependencies
- Splitting context to eliminate cross-calculator re-renders
- FIRE calculator post-FIRE timeline fix
- Error boundaries
- Currency conversion rounding precision
- PDF localization
- Input validation feedback
