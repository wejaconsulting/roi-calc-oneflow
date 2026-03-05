import type {
  WorkforceInputs,
  RiskInputs,
  DepartmentInput,
  PricingConfig,
  CalculationResults,
  ScenarioType,
} from '@/types';
import { SCENARIO_MULTIPLIERS, ONEFLOW_PRICING, CURRENCY_RATES } from '@/config/assumptions';
import type { CurrencyCode } from '@/types';

function safe(val: number): number {
  if (!isFinite(val) || isNaN(val)) return 0;
  return val;
}

/**
 * Calculate Oneflow annual cost in SEK (base currency), then convert.
 * If annualCostOverride is set, use that directly (already in target currency).
 */
export function calculateOneflowAnnualCost(
  pricing: PricingConfig,
  currency: CurrencyCode
): number {
  if (pricing.annualCostOverride !== null && pricing.annualCostOverride > 0) {
    return pricing.annualCostOverride;
  }

  const plan = ONEFLOW_PRICING.plans[pricing.plan];
  const baseCost = plan.annualFee;
  const extraSeats = Math.max(0, pricing.seats - plan.includedSeats);
  const seatCost = extraSeats * plan.additionalSeatCost;

  let addOnCost = 0;
  const allAddOns = Object.values(ONEFLOW_PRICING.addOns).flat();
  for (const addOnId of pricing.selectedAddOns) {
    const addOn = allAddOns.find((a) => a.id === addOnId);
    if (addOn) {
      if (addOn.type === 'per-seat') {
        addOnCost += (addOn as { pricePerSeat: number }).pricePerSeat * pricing.seats;
      } else {
        addOnCost += (addOn as { fixedPrice: number }).fixedPrice;
      }
    }
  }

  const totalSEK = baseCost + seatCost + addOnCost;
  const rate = CURRENCY_RATES[currency]?.rate ?? 1;
  return safe(totalSEK * rate);
}

/**
 * All inputs are treated as being in the user's selected currency.
 * All outputs are in the user's selected currency.
 * Oneflow pricing is defined in SEK and converted to user currency.
 * No double-conversion.
 */
export function calculateResults(
  workforce: WorkforceInputs,
  risk: RiskInputs,
  departments: DepartmentInput[],
  pricing: PricingConfig,
  scenario: ScenarioType,
  currency: CurrencyCode
): CalculationResults {
  const mult = SCENARIO_MULTIPLIERS[scenario];

  // All workforce inputs are already in the user's currency

  // EFFICIENCY
  const annualHoursSaved = safe(
    workforce.employeesHandlingContracts *
    workforce.contractsPerEmployee *
    workforce.hoursPerContract *
    mult.timeReduction
  );
  const fteSaved = safe(annualHoursSaved / 1800);
  const costSavings = safe(fteSaved * workforce.avgEmployeeCost);

  // Calculate average cycle days from selected departments
  const selectedDepts = departments.filter((d) => d.selected);
  const cycleDaysAvg =
    selectedDepts.length > 0
      ? selectedDepts.reduce((sum, d) => sum + d.cycleDays, 0) / selectedDepts.length
      : 20;

  // REVENUE
  const revenueRecovered = safe(
    workforce.annualRevenueUnderContract *
    (risk.revenueLeakagePct / 100) *
    mult.revenueLeakageReduction
  );
  // Revenue from faster deal cycles: total contract pipeline value × fraction of year
  // spent in cycle × time reduction × 10% conversion factor (only a portion of
  // cycle-time savings translates directly into incremental closed revenue)
  const revenueAccelerated = safe(
    workforce.avgContractValue *
    workforce.contractsPerEmployee *
    workforce.employeesHandlingContracts *
    (cycleDaysAvg / 365) *
    mult.timeReduction *
    0.1
  );
  const renewalProtected = safe(
    workforce.annualRevenueUnderContract *
    (risk.missedRenewalRisk / 100) *
    mult.renewalCaptureImprovement
  );
  const totalRevenueImpact = revenueRecovered + revenueAccelerated + renewalProtected;

  // RISK — each risk score is 0-100; dividing by 300 = (sum/3)/100, i.e. the
  // average risk percentage across breach, dispute, and audit categories
  const avoidedRiskCost = safe(
    workforce.annualRevenueUnderContract *
    ((risk.breachRisk + risk.disputeRisk + risk.auditRisk) / 300) *
    mult.riskReductionImpact
  );

  // FINANCIAL SUMMARY — oneflow cost is converted from SEK to user currency
  const oneflowAnnualCost = calculateOneflowAnnualCost(pricing, currency);
  const totalAnnualImpact = costSavings + totalRevenueImpact + avoidedRiskCost;
  const netBenefit = totalAnnualImpact - oneflowAnnualCost;
  const roiPct = safe(oneflowAnnualCost > 0 ? (netBenefit / oneflowAnnualCost) * 100 : 0);
  const paybackMonths = safe(
    totalAnnualImpact > 0 ? (oneflowAnnualCost / totalAnnualImpact) * 12 : 0
  );

  // DEPARTMENT BREAKDOWN
  const totalCycleDays = selectedDepts.reduce((sum, d) => sum + d.cycleDays, 0);
  const byDepartment = selectedDepts.map((dept) => {
    const weight = totalCycleDays > 0 ? dept.cycleDays / totalCycleDays : 0;
    return {
      name: dept.name,
      hoursSaved: safe(annualHoursSaved * weight),
      costSaved: safe(costSavings * weight),
      revenueImpact: safe(totalRevenueImpact * weight),
    };
  });

  return {
    efficiency: {
      annualHoursSaved,
      fteSaved,
      costSavings,
    },
    revenue: {
      revenueRecovered,
      revenueAccelerated,
      renewalProtected,
      totalRevenueImpact,
    },
    risk: {
      avoidedRiskCost,
    },
    financial: {
      totalAnnualImpact,
      oneflowAnnualCost,
      netBenefit,
      roiPct,
      paybackMonths,
    },
    byDepartment,
  };
}
