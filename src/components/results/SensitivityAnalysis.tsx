import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useCalculatorStore } from '@/store/calculatorStore';
import { calculateResults } from '@/utils/calculations';
import { formatCurrency, formatROI } from '@/utils/formatters';

interface SensitivityParam {
  key: string;
  label: string;
  field: 'hoursPerContract' | 'avgContractValue' | 'annualRevenueUnderContract' | 'employeesHandlingContracts';
}

const PARAMS: SensitivityParam[] = [
  { key: 'hours', label: 'Hours per Contract', field: 'hoursPerContract' },
  { key: 'value', label: 'Avg Contract Value', field: 'avgContractValue' },
  { key: 'revenue', label: 'Revenue Under Contract', field: 'annualRevenueUnderContract' },
  { key: 'employees', label: 'Employees Handling Contracts', field: 'employeesHandlingContracts' },
];

export function SensitivityAnalysis() {
  const { workforceInputs, riskInputs, departments, pricingConfig, scenarioType, companyProfile, results } =
    useCalculatorStore();
  const currency = companyProfile.currency;
  const [adjustments, setAdjustments] = useState<Record<string, number>>({
    hours: 0,
    value: 0,
    revenue: 0,
    employees: 0,
  });

  const hasChanges = Object.values(adjustments).some((v) => v !== 0);

  // Calculate adjusted results
  const adjustedWorkforce = { ...workforceInputs };
  for (const param of PARAMS) {
    const pct = adjustments[param.key];
    if (pct !== 0) {
      adjustedWorkforce[param.field] = Math.round(workforceInputs[param.field] * (1 + pct / 100));
    }
  }

  const adjustedResults = hasChanges
    ? calculateResults(adjustedWorkforce, riskInputs, departments, pricingConfig, scenarioType, currency)
    : results;

  const netDelta = adjustedResults.financial.netBenefit - results.financial.netBenefit;
  const roiDelta = adjustedResults.financial.roiPct - results.financial.roiPct;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Sensitivity Analysis</h3>
            <p className="text-sm text-gray-500">What if your inputs change?</p>
          </div>
        </div>
        {hasChanges && (
          <button
            onClick={() => setAdjustments({ hours: 0, value: 0, revenue: 0, employees: 0 })}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Reset
          </button>
        )}
      </div>

      <div className="space-y-4">
        {PARAMS.map((param) => {
          const pct = adjustments[param.key];
          return (
            <div key={param.key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-gray-600">{param.label}</span>
                <span className={`text-sm font-mono font-semibold ${
                  pct > 0 ? 'text-green-600' : pct < 0 ? 'text-red-600' : 'text-gray-400'
                }`}>
                  {pct > 0 ? '+' : ''}{pct}%
                </span>
              </div>
              <input
                type="range"
                min={-50}
                max={50}
                step={5}
                value={pct}
                onChange={(e) => setAdjustments((prev) => ({ ...prev, [param.key]: Number(e.target.value) }))}
                className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[var(--brand-primary)]"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>-50%</span>
                <span>baseline</span>
                <span>+50%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Impact summary */}
      {hasChanges && (
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Adjusted Net Benefit</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(adjustedResults.financial.netBenefit, currency)}
              </p>
              <p className={`text-xs font-medium ${netDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netDelta >= 0 ? '+' : ''}{formatCurrency(netDelta, currency)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Adjusted ROI</p>
              <p className="text-lg font-bold text-gray-900">
                {formatROI(adjustedResults.financial.roiPct)}
              </p>
              <p className={`text-xs font-medium ${roiDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {roiDelta >= 0 ? '+' : ''}{roiDelta.toFixed(0)}pp
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
