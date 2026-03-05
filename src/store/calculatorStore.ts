import { create } from 'zustand';
import type { CalculatorState, DepartmentInput, CurrencyCode } from '@/types';
import { calculateResults } from '@/utils/calculations';
import {
  COMPANY_SIZE_DEFAULTS,
  DEPARTMENT_LIST,
  DEPARTMENT_DEFAULT_CYCLE_DAYS,
  CURRENCY_RATES,
} from '@/config/assumptions';
import type { CompanySizeKey } from '@/config/assumptions';

const defaultDepartments: DepartmentInput[] = DEPARTMENT_LIST.map((name) => ({
  name,
  cycleDays: DEPARTMENT_DEFAULT_CYCLE_DAYS[name] || 20,
  selected: ['Sales', 'Legal', 'HR'].includes(name),
}));

/**
 * COMPANY_SIZE_DEFAULTS are defined in SEK.
 * Convert monetary fields to target currency when populating defaults.
 */
function getConvertedDefaults(size: CompanySizeKey, currency: CurrencyCode) {
  const base = COMPANY_SIZE_DEFAULTS[size];
  const rate = CURRENCY_RATES[currency]?.rate ?? 1;
  return {
    employeesHandlingContracts: base.employeesHandlingContracts,
    contractsPerEmployee: base.contractsPerEmployee,
    hoursPerContract: base.hoursPerContract,
    // Convert monetary values from SEK to target currency
    avgEmployeeCost: Math.round(base.avgEmployeeCost * rate),
    avgContractValue: Math.round(base.avgContractValue * rate),
    annualRevenueUnderContract: Math.round(base.annualRevenueUnderContract * rate),
  };
}

const defaultState = {
  currentStep: 0,
  companyProfile: {
    size: 'midmarket' as const,
    industry: '',
    currency: 'SEK' as const,
  },
  workforceInputs: { ...COMPANY_SIZE_DEFAULTS.midmarket },
  riskInputs: {
    revenueLeakagePct: 2,
    leakageBreakdown: {
      pricingErrors: 0.5,
      billingErrors: 0.5,
      executionFailures: 0.5,
      preventableChurn: 0.5,
    },
    breachRisk: 3,
    missedRenewalRisk: 5,
    disputeRisk: 2,
    auditRisk: 2,
  },
  departments: defaultDepartments,
  pricingConfig: {
    plan: 'business' as const,
    seats: 10,
    selectedAddOns: [] as string[],
    annualCostOverride: null,
  },
  scenarioType: 'expected' as const,
  branding: {
    companyName: 'Your Company',
    logoBase64: null,
    primaryColor: '#5033FF',
    enabled: false,
  },
  emailSubmitted: false,
  contactInfo: null,
  businessCase: null,
  objectionHandlers: null,
  businessCaseLoading: false,
  objectionHandlersLoading: false,
  isSharedView: false,
};

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  ...defaultState,
  results: calculateResults(
    defaultState.workforceInputs,
    defaultState.riskInputs,
    defaultState.departments,
    defaultState.pricingConfig,
    defaultState.scenarioType,
    defaultState.companyProfile.currency
  ),

  setCurrentStep: (step) => set({ currentStep: step }),

  setCompanyProfile: (profile) => {
    const state = get();
    const newProfile = { ...state.companyProfile, ...profile };

    let newWorkforce = state.workforceInputs;
    let newPricing = state.pricingConfig;

    // When size changes, re-populate defaults (converted to current currency)
    if (profile.size && profile.size !== state.companyProfile.size) {
      newWorkforce = getConvertedDefaults(profile.size, newProfile.currency);
      // Auto-set seats to match employees
      newPricing = { ...state.pricingConfig, seats: newWorkforce.employeesHandlingContracts };
    }

    // When currency changes, re-convert existing defaults from SEK
    if (profile.currency && profile.currency !== state.companyProfile.currency) {
      newWorkforce = getConvertedDefaults(newProfile.size, profile.currency);
      // Clear cost override since currency changed
      newPricing = { ...state.pricingConfig, annualCostOverride: null };
    }

    set({ companyProfile: newProfile, workforceInputs: newWorkforce, pricingConfig: newPricing });
    get().recalculate();
  },

  setWorkforceInputs: (inputs) => {
    const state = get();
    const newWorkforce = { ...state.workforceInputs, ...inputs };
    const updates: Partial<CalculatorState> = { workforceInputs: newWorkforce };

    // Auto-sync seats when employees change
    if (inputs.employeesHandlingContracts !== undefined) {
      updates.pricingConfig = {
        ...state.pricingConfig,
        seats: inputs.employeesHandlingContracts,
      };
    }

    set(updates);
    get().recalculate();
  },

  setRiskInputs: (inputs) => {
    const state = get();
    const newRisk = { ...state.riskInputs, ...inputs };
    // Auto-sum leakage breakdown
    if (inputs.leakageBreakdown) {
      newRisk.leakageBreakdown = { ...state.riskInputs.leakageBreakdown, ...inputs.leakageBreakdown };
      newRisk.revenueLeakagePct =
        newRisk.leakageBreakdown.pricingErrors +
        newRisk.leakageBreakdown.billingErrors +
        newRisk.leakageBreakdown.executionFailures +
        newRisk.leakageBreakdown.preventableChurn;
    }
    set({ riskInputs: newRisk });
    get().recalculate();
  },

  setDepartments: (departments) => {
    set({ departments });
    get().recalculate();
  },

  toggleDepartment: (name) => {
    const state = get();
    const departments = state.departments.map((d) =>
      d.name === name ? { ...d, selected: !d.selected } : d
    );
    set({ departments });
    get().recalculate();
  },

  setDepartmentCycleDays: (name, days) => {
    const state = get();
    const departments = state.departments.map((d) =>
      d.name === name ? { ...d, cycleDays: days } : d
    );
    set({ departments });
    get().recalculate();
  },

  setPricingConfig: (config) => {
    const state = get();
    set({ pricingConfig: { ...state.pricingConfig, ...config } });
    get().recalculate();
  },

  setScenarioType: (scenario) => {
    set({ scenarioType: scenario });
    get().recalculate();
  },

  setBranding: (branding) => {
    const state = get();
    set({ branding: { ...state.branding, ...branding } });
  },

  setEmailSubmitted: (submitted, info) => {
    set({ emailSubmitted: submitted, contactInfo: info || null });
  },

  setBusinessCase: (text) => set({ businessCase: text }),
  setObjectionHandlers: (handlers) => set({ objectionHandlers: handlers }),
  setBusinessCaseLoading: (loading) => set({ businessCaseLoading: loading }),
  setObjectionHandlersLoading: (loading) => set({ objectionHandlersLoading: loading }),
  setIsSharedView: (shared) => set({ isSharedView: shared }),

  recalculate: () => {
    const state = get();
    const results = calculateResults(
      state.workforceInputs,
      state.riskInputs,
      state.departments,
      state.pricingConfig,
      state.scenarioType,
      state.companyProfile.currency
    );
    set({ results });
  },
}));
