export type CompanySize = 'small' | 'midmarket' | 'enterprise';
export type ScenarioType = 'conservative' | 'expected' | 'optimistic';
export type CurrencyCode = 'SEK' | 'NOK' | 'EUR' | 'USD' | 'GBP';
export type PlanType = 'business' | 'enterprise';

export interface CompanyProfile {
  size: CompanySize;
  industry: string;
  currency: CurrencyCode;
}

export interface WorkforceInputs {
  employeesHandlingContracts: number;
  avgEmployeeCost: number;
  contractsPerEmployee: number;
  hoursPerContract: number;
  avgContractValue: number;
  annualRevenueUnderContract: number;
}

export interface RiskInputs {
  revenueLeakagePct: number;
  leakageBreakdown: {
    pricingErrors: number;
    billingErrors: number;
    executionFailures: number;
    preventableChurn: number;
  };
  breachRisk: number;
  missedRenewalRisk: number;
  disputeRisk: number;
  auditRisk: number;
}

export interface DepartmentInput {
  name: string;
  cycleDays: number;
  selected: boolean;
}

export interface AddOnSelection {
  id: string;
  selected: boolean;
}

export interface PricingConfig {
  plan: PlanType;
  seats: number;
  selectedAddOns: string[];
  annualCostOverride: number | null;
}

export interface BrandingConfig {
  companyName: string;
  logoBase64: string | null;
  primaryColor: string;
  enabled: boolean;
}

export interface EfficiencyResults {
  annualHoursSaved: number;
  fteSaved: number;
  costSavings: number;
}

export interface RevenueResults {
  revenueRecovered: number;
  revenueAccelerated: number;
  renewalProtected: number;
  totalRevenueImpact: number;
}

export interface RiskResults {
  avoidedRiskCost: number;
}

export interface FinancialSummary {
  totalAnnualImpact: number;
  oneflowAnnualCost: number;
  netBenefit: number;
  roiPct: number;
  paybackMonths: number;
}

export interface DepartmentResult {
  name: string;
  hoursSaved: number;
  costSaved: number;
  revenueImpact: number;
}

export interface CalculationResults {
  efficiency: EfficiencyResults;
  revenue: RevenueResults;
  risk: RiskResults;
  financial: FinancialSummary;
  byDepartment: DepartmentResult[];
}

export interface CalculatorState {
  // Step tracking
  currentStep: number;

  // Inputs
  companyProfile: CompanyProfile;
  workforceInputs: WorkforceInputs;
  riskInputs: RiskInputs;
  departments: DepartmentInput[];
  pricingConfig: PricingConfig;
  scenarioType: ScenarioType;
  branding: BrandingConfig;

  // Computed
  results: CalculationResults;

  // Email gate
  emailSubmitted: boolean;
  contactInfo: { name: string; email: string } | null;

  // AI generated content
  businessCase: string | null;
  objectionHandlers: Record<string, string[]> | null;
  businessCaseLoading: boolean;
  objectionHandlersLoading: boolean;

  // Shared view
  isSharedView: boolean;

  // Actions
  setCurrentStep: (step: number) => void;
  setCompanyProfile: (profile: Partial<CompanyProfile>) => void;
  setWorkforceInputs: (inputs: Partial<WorkforceInputs>) => void;
  setRiskInputs: (inputs: Partial<RiskInputs>) => void;
  setDepartments: (departments: DepartmentInput[]) => void;
  toggleDepartment: (name: string) => void;
  setDepartmentCycleDays: (name: string, days: number) => void;
  setPricingConfig: (config: Partial<PricingConfig>) => void;
  setScenarioType: (scenario: ScenarioType) => void;
  setBranding: (branding: Partial<BrandingConfig>) => void;
  setEmailSubmitted: (submitted: boolean, info?: { name: string; email: string }) => void;
  setBusinessCase: (text: string | null) => void;
  setObjectionHandlers: (handlers: Record<string, string[]> | null) => void;
  setBusinessCaseLoading: (loading: boolean) => void;
  setObjectionHandlersLoading: (loading: boolean) => void;
  setIsSharedView: (shared: boolean) => void;
  resetToDefaults: () => void;
  recalculate: () => void;
}
