import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useCalculatorStore } from '@/store/calculatorStore';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/formatters';

export function InputSummary() {
  const [isOpen, setIsOpen] = useState(false);
  const { companyProfile, workforceInputs, riskInputs, departments, pricingConfig, scenarioType } =
    useCalculatorStore();
  const currency = companyProfile.currency;

  const selectedDepts = departments.filter((d) => d.selected).map((d) => d.name);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-gray-900">Assumptions & Inputs Used</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Company & Workforce */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Company & Workforce
            </h4>
            <div className="space-y-2 text-sm">
              <Row label="Company Size" value={companyProfile.size} />
              <Row label="Industry" value={companyProfile.industry || 'Not specified'} />
              <Row label="Employees on Contracts" value={formatNumber(workforceInputs.employeesHandlingContracts)} />
              <Row label="Avg Employee Cost" value={formatCurrency(workforceInputs.avgEmployeeCost, currency)} />
              <Row label="Contracts / Employee" value={formatNumber(workforceInputs.contractsPerEmployee)} />
              <Row label="Hours / Contract" value={formatNumber(workforceInputs.hoursPerContract, 1)} />
              <Row label="Avg Contract Value" value={formatCurrency(workforceInputs.avgContractValue, currency)} />
              <Row
                label="Annual Revenue Under Contract"
                value={formatCurrency(workforceInputs.annualRevenueUnderContract, currency)}
              />
            </div>
          </div>

          {/* Risk & Departments */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Risk & Departments
            </h4>
            <div className="space-y-2 text-sm">
              <Row label="Revenue Leakage" value={formatPercent(riskInputs.revenueLeakagePct)} />
              <Row label="Breach Risk" value={`${riskInputs.breachRisk}/100`} />
              <Row label="Missed Renewal Risk" value={`${riskInputs.missedRenewalRisk}/100`} />
              <Row label="Dispute Risk" value={`${riskInputs.disputeRisk}/100`} />
              <Row label="Audit Risk" value={`${riskInputs.auditRisk}/100`} />
              <Row label="Departments" value={selectedDepts.length > 0 ? selectedDepts.join(', ') : 'None selected'} />
            </div>
          </div>

          {/* Pricing & Scenario */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Pricing & Scenario
            </h4>
            <div className="space-y-2 text-sm">
              <Row label="Plan" value={pricingConfig.plan.charAt(0).toUpperCase() + pricingConfig.plan.slice(1)} />
              <Row label="Seats" value={formatNumber(pricingConfig.seats)} />
              <Row label="Add-ons" value={pricingConfig.selectedAddOns.length > 0 ? `${pricingConfig.selectedAddOns.length} selected` : 'None'} />
              {pricingConfig.annualCostOverride !== null && pricingConfig.annualCostOverride > 0 && (
                <Row label="Cost Override" value={formatCurrency(pricingConfig.annualCostOverride, currency)} />
              )}
              <Row label="Scenario" value={scenarioType.charAt(0).toUpperCase() + scenarioType.slice(1)} />
              <Row label="Currency" value={currency} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900 font-medium text-right">{value}</span>
    </div>
  );
}
