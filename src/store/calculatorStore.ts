import { create } from 'zustand';
import type { CalculatorState, DepartmentInput } from '@/types';
import { calculateResults } from '@/utils/calculations';
import {
  COMPANY_SIZE_DEFAULTS,
  DEPARTMENT_LIST,
  DEPARTMENT_DEFAULT_CYCLE_DAYS,
} from '@/config/assumptions';

const defaultDepartments: DepartmentInput[] = DEPARTMENT_LIST.map((name) => ({
  name,
  cycleDays: DEPARTMENT_DEFAULT_CYCLE_DAYS[name] || 20,
  selected: ['Sales', 'Legal', 'HR'].includes(name),
}));

const defaultState = {
  currentStep: 0,
  companyProfile: {
    size: 'midmarket' as const,
    industry: '',
    currency: 'SEK' as const,
  },
  workforceInputs: { ...COMPANY_SIZE_DEFAULTS.midmarket },
  riskInputs: {
    revenueLeakagePct: 3,
    leakageBreakdown: {
      pricingErrors: 1,
      billingErrors: 0.5,
      executionFailures: 1,
      preventableChurn: 0.5,
    },
    breachRisk: 5,
    missedRenewalRisk: 8,
    disputeRisk: 4,
    auditRisk: 3,
  },
  departments: defaultDepartments,
  pricingConfig: {
    plan: 'business' as const,
    seats: 5,
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

    // Auto-populate workforce defaults when size changes
    let newWorkforce = state.workforceInputs;
    if (profile.size && profile.size !== state.companyProfile.size) {
      newWorkforce = { ...COMPANY_SIZE_DEFAULTS[profile.size] };
    }

    set({ companyProfile: newProfile, workforceInputs: newWorkforce });
    get().recalculate();
  },

  setWorkforceInputs: (inputs) => {
    const state = get();
    set({ workforceInputs: { ...state.workforceInputs, ...inputs } });
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
