import type { ScenarioType } from '@/types';

export const SCENARIO_MULTIPLIERS: Record<ScenarioType, {
  timeReduction: number;
  revenueLeakageReduction: number;
  renewalCaptureImprovement: number;
  riskReductionImpact: number;
}> = {
  conservative: {
    timeReduction: 0.20,
    revenueLeakageReduction: 0.20,
    renewalCaptureImprovement: 0.15,
    riskReductionImpact: 0.15,
  },
  expected: {
    timeReduction: 0.35,
    revenueLeakageReduction: 0.35,
    renewalCaptureImprovement: 0.25,
    riskReductionImpact: 0.25,
  },
  optimistic: {
    timeReduction: 0.55,
    revenueLeakageReduction: 0.55,
    renewalCaptureImprovement: 0.45,
    riskReductionImpact: 0.45,
  },
};

export type CompanySizeKey = 'small' | 'midmarket' | 'enterprise';

export const COMPANY_SIZE_DEFAULTS: Record<CompanySizeKey, {
  avgEmployeeCost: number;
  contractsPerEmployee: number;
  hoursPerContract: number;
  employeesHandlingContracts: number;
  avgContractValue: number;
  annualRevenueUnderContract: number;
}> = {
  small: {
    avgEmployeeCost: 550000,
    contractsPerEmployee: 25,
    hoursPerContract: 2,
    employeesHandlingContracts: 3,
    avgContractValue: 80000,
    annualRevenueUnderContract: 5000000,
  },
  midmarket: {
    avgEmployeeCost: 650000,
    contractsPerEmployee: 40,
    hoursPerContract: 3,
    employeesHandlingContracts: 10,
    avgContractValue: 150000,
    annualRevenueUnderContract: 40000000,
  },
  enterprise: {
    avgEmployeeCost: 800000,
    contractsPerEmployee: 60,
    hoursPerContract: 4,
    employeesHandlingContracts: 30,
    avgContractValue: 300000,
    annualRevenueUnderContract: 250000000,
  },
};

export const ONEFLOW_PRICING = {
  plans: {
    business: {
      name: 'Business',
      annualFee: 32000,
      includedSeats: 5,
      additionalSeatCost: 4800,
    },
    enterprise: {
      name: 'Enterprise',
      annualFee: 90000,
      includedSeats: 10,
      additionalSeatCost: 7200,
    },
  },
  addOns: {
    integrations: [
      { id: 'salesforce', name: 'Salesforce Integration', pricePerSeat: 1200, type: 'per-seat' as const },
      { id: 'hubspot', name: 'HubSpot Integration', pricePerSeat: 960, type: 'per-seat' as const },
      { id: 'dynamics', name: 'Microsoft Dynamics Integration', pricePerSeat: 1200, type: 'per-seat' as const },
      { id: 'sap', name: 'SAP Integration', pricePerSeat: 1440, type: 'per-seat' as const },
    ],
    create: [
      { id: 'templates', name: 'Advanced Templates', pricePerSeat: 600, type: 'per-seat' as const },
      { id: 'docgen', name: 'Document Generation', pricePerSeat: 720, type: 'per-seat' as const },
    ],
    manage: [
      { id: 'lifecycle', name: 'Contract Lifecycle Management', pricePerSeat: 960, type: 'per-seat' as const },
      { id: 'renewals', name: 'Renewal Management', pricePerSeat: 720, type: 'per-seat' as const },
    ],
    collaborate: [
      { id: 'comments', name: 'Advanced Collaboration', pricePerSeat: 480, type: 'per-seat' as const },
      { id: 'approvals', name: 'Approval Workflows', pricePerSeat: 600, type: 'per-seat' as const },
    ],
    security: [
      { id: 'sso', name: 'SSO / SAML', fixedPrice: 12000, type: 'fixed' as const },
      { id: 'audit', name: 'Audit Trail', pricePerSeat: 360, type: 'per-seat' as const },
    ],
    ai: [
      { id: 'ai-review', name: 'AI Contract Review', pricePerSeat: 1200, type: 'per-seat' as const },
      { id: 'ai-extract', name: 'AI Data Extraction', pricePerSeat: 960, type: 'per-seat' as const },
    ],
    support: [
      { id: 'priority', name: 'Priority Support', fixedPrice: 24000, type: 'fixed' as const },
      { id: 'csm', name: 'Dedicated CSM', fixedPrice: 48000, type: 'fixed' as const },
    ],
    api: [
      { id: 'api-access', name: 'API Access', fixedPrice: 18000, type: 'fixed' as const },
      { id: 'webhooks', name: 'Webhooks', fixedPrice: 6000, type: 'fixed' as const },
    ],
    valueAddedServices: [
      { id: 'implementation', name: 'Implementation Package', fixedPrice: 36000, type: 'fixed' as const },
      { id: 'training', name: 'Custom Training', fixedPrice: 18000, type: 'fixed' as const },
      { id: 'migration', name: 'Data Migration', fixedPrice: 24000, type: 'fixed' as const },
    ],
  },
} as const;

export const CURRENCY_RATES: Record<string, { rate: number; symbol: string; locale: string }> = {
  SEK: { rate: 1, symbol: 'kr', locale: 'sv-SE' },
  NOK: { rate: 1.02, symbol: 'kr', locale: 'nb-NO' },
  EUR: { rate: 0.088, symbol: '\u20AC', locale: 'de-DE' },
  USD: { rate: 0.094, symbol: '$', locale: 'en-US' },
  GBP: { rate: 0.075, symbol: '\u00A3', locale: 'en-GB' },
};

export const CURRENCY_FLAGS: Record<string, string> = {
  SEK: '\uD83C\uDDF8\uD83C\uDDEA',
  NOK: '\uD83C\uDDF3\uD83C\uDDF4',
  EUR: '\uD83C\uDDEA\uD83C\uDDFA',
  USD: '\uD83C\uDDFA\uD83C\uDDF8',
  GBP: '\uD83C\uDDEC\uD83C\uDDE7',
};

export const DEPARTMENT_LIST = [
  'HR',
  'Sales',
  'Finance',
  'Legal',
  'Procurement',
  'IT',
  'Operations',
] as const;

export const DEPARTMENT_DEFAULT_CYCLE_DAYS: Record<string, number> = {
  HR: 14,
  Sales: 21,
  Finance: 18,
  Legal: 30,
  Procurement: 25,
  IT: 12,
  Operations: 16,
};

export const INDUSTRY_LIST = [
  'Technology / SaaS',
  'Financial Services',
  'Healthcare',
  'Manufacturing',
  'Professional Services',
  'Retail / E-commerce',
  'Real Estate',
  'Media & Entertainment',
  'Energy & Utilities',
  'Telecommunications',
] as const;
