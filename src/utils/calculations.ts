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

export function calculateOneflowAnnualCost(
  pricing: PricingConfig,
  currency: CurrencyCode
): number {
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

export function calculateResults(
  workforce: WorkforceInputs,
  risk: RiskInputs,
  departments: DepartmentInput[],
  pricing: PricingConfig,
  scenario: ScenarioType,
  currency: CurrencyCode
): CalculationResults {
  const mult = SCENARIO_MULTIPLIERS[scenario];
  const rate = CURRENCY_RATES[currency]?.rate ?? 1;

  // Convert workforce values from SEK to selected currency for display
  const empCost = workforce.avgEmployeeCost;

  // EFFICIENCY
  const annualHoursSaved = safe(
    workforce.employeesHandlingContracts *
    workforce.contractsPerEmployee *
    workforce.hoursPerContract *
    mult.timeReduction
  );
  const fteSaved = safe(annualHoursSaved / 1800);
  const costSavings = safe(fteSaved * empCost);

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

  // RISK
  const avoidedRiskCost = safe(
    workforce.annualRevenueUnderContract *
    ((risk.breachRisk + risk.disputeRisk + risk.auditRisk) / 300) *
    mult.riskReductionImpact
  );

  // FINANCIAL SUMMARY
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

  // Apply currency conversion for display values
  return {
    efficiency: {
      annualHoursSaved,
      fteSaved,
      costSavings: safe(costSavings * rate),
    },
    revenue: {
      revenueRecovered: safe(revenueRecovered * rate),
      revenueAccelerated: safe(revenueAccelerated * rate),
      renewalProtected: safe(renewalProtected * rate),
      totalRevenueImpact: safe(totalRevenueImpact * rate),
    },
    risk: {
      avoidedRiskCost: safe(avoidedRiskCost * rate),
    },
    financial: {
      totalAnnualImpact: safe(totalAnnualImpact * rate),
      oneflowAnnualCost,
      netBenefit: safe(totalAnnualImpact * rate - oneflowAnnualCost),
      roiPct: safe(oneflowAnnualCost > 0 ? ((totalAnnualImpact * rate - oneflowAnnualCost) / oneflowAnnualCost) * 100 : 0),
      paybackMonths: safe(totalAnnualImpact * rate > 0 ? (oneflowAnnualCost / (totalAnnualImpact * rate)) * 12 : 0),
    },
    byDepartment: byDepartment.map((d) => ({
      ...d,
      costSaved: safe(d.costSaved * rate),
      revenueImpact: safe(d.revenueImpact * rate),
    })),
  };
}
