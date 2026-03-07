import type { MortgageInputs, MortgagePayment, CompoundInterestResult, ComparisonResult, ComparisonTimeline } from '@/types';

export function calculateMortgagePayment(inputs: MortgageInputs): MortgagePayment {
  const principal = inputs.loanAmount;
  const monthlyRate = inputs.interestRate / 100 / 12;
  const numPayments = inputs.loanTerm * 12;

  if (principal <= 0 || numPayments <= 0) {
    return {
      monthlyPayment: 0,
      principal: 0,
      interest: 0,
      totalPaid: 0,
      totalInterest: 0,
      amortizationSchedule: [],
    };
  }

  let monthlyPayment: number;
  if (monthlyRate === 0) {
    monthlyPayment = principal / numPayments;
  } else {
    monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  }

  if (!isFinite(monthlyPayment) || isNaN(monthlyPayment)) {
    return { monthlyPayment: 0, principal: 0, interest: 0, totalPaid: 0, totalInterest: 0, amortizationSchedule: [] };
  }

  const schedule: MortgagePayment['amortizationSchedule'] = [];
  let balance = principal;
  let totalInterest = 0;

  for (let i = 1; i <= numPayments; i++) {
    const interestPortion = balance * monthlyRate;
    const principalPortion = monthlyPayment - interestPortion;
    balance = Math.max(0, balance - principalPortion);
    totalInterest += interestPortion;

    schedule.push({
      month: i,
      payment: monthlyPayment,
      principal: principalPortion,
      interest: interestPortion,
      balance,
    });
  }

  const totalPaid = monthlyPayment * numPayments;

  return {
    monthlyPayment,
    principal,
    interest: totalInterest,
    totalPaid,
    totalInterest,
    amortizationSchedule: schedule,
  };
}

export function calculateCompoundInterest(
  initialInvestment: number,
  monthlyContribution: number,
  annualReturn: number,
  years: number
): CompoundInterestResult {
  const monthlyRate = annualReturn / 100 / 12;
  const totalMonths = Math.max(0, years * 12);
  let value = initialInvestment || 0;
  const timeline: CompoundInterestResult['timeline'] = [];

  for (let month = 1; month <= totalMonths; month++) {
    value = value * (1 + monthlyRate) + monthlyContribution;

    if (month % 12 === 0) {
      const year = month / 12;
      const invested = initialInvestment + monthlyContribution * month;
      timeline.push({
        year,
        value,
        invested,
        earnings: value - invested,
      });
    }
  }

  const totalInvested = initialInvestment + monthlyContribution * totalMonths;
  const totalEarnings = value - totalInvested;
  const roi = totalInvested > 0 ? (totalEarnings / totalInvested) * 100 : 0;

  return { finalValue: value, totalInvested, totalEarnings, roi, timeline };
}

export function calculateComparison(
  mortgage: MortgageInputs,
  etfReturn: number,
  comparisonYears: number
): { result: ComparisonResult; timeline: ComparisonTimeline[] } {
  const mortgagePayment = calculateMortgagePayment(mortgage);
  const effectiveRent = mortgage.monthlyRent * (1 - mortgage.vacancyRate / 100);
  const monthlyCashFlow = effectiveRent - mortgage.monthlyExpenses - mortgagePayment.monthlyPayment;

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
}
