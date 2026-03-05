import { useMemo } from 'react';
import { useCalculatorStore } from '@/store/calculatorStore';
import { formatCurrency, formatMonths, formatROI, formatNumber } from '@/utils/formatters';
import { SCENARIO_MULTIPLIERS } from '@/config/assumptions';
import { calculateResults } from '@/utils/calculations';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function ScenarioComparison() {
  const store = useCalculatorStore();
  const { scenarioType, companyProfile } = store;
  const currency = companyProfile.currency;

  const { workforceInputs, riskInputs, departments, pricingConfig } = store;

  const scenarios = useMemo(() => {
    const types = ['conservative', 'expected', 'optimistic'] as const;
    return types.map((type) => {
      const results = calculateResults(workforceInputs, riskInputs, departments, pricingConfig, type, currency);
      return { type, results, multipliers: SCENARIO_MULTIPLIERS[type] };
    });
  }, [workforceInputs, riskInputs, departments, pricingConfig, currency]);

  const labels = { conservative: 'Conservative', expected: 'Expected', optimistic: 'Optimistic' };
  const colors = {
    conservative: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: '#3B82F6' },
    expected: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', accent: '#7C3AED' },
    optimistic: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', accent: '#10B981' },
  };

  const metrics = [
    { label: 'Net Annual Benefit', key: 'netBenefit' as const, format: (v: number) => formatCurrency(v, currency) },
    { label: 'ROI', key: 'roiPct' as const, format: (v: number) => formatROI(v) },
    { label: 'Payback Period', key: 'paybackMonths' as const, format: (v: number) => formatMonths(v) },
    { label: 'Total Impact', key: 'totalAnnualImpact' as const, format: (v: number) => formatCurrency(v, currency) },
    { label: 'Hours Saved', key: 'hoursSaved' as const, format: (v: number) => formatNumber(v) },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Scenario Comparison</h3>
      <p className="text-sm text-gray-500 mb-6">Side-by-side view across all scenarios</p>

      <div className="grid grid-cols-3 gap-3">
        {scenarios.map((s) => {
          const c = colors[s.type];
          const isActive = s.type === scenarioType;
          return (
            <div
              key={s.type}
              className={`rounded-xl border-2 p-4 transition-all ${
                isActive ? `${c.border} ${c.bg} shadow-md` : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-sm font-bold ${isActive ? c.text : 'text-gray-500'}`}>
                  {labels[s.type]}
                </span>
                {isActive && (
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${c.text} bg-white/80`}>
                    Active
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {/* Net Benefit - large */}
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Net Annual Benefit</p>
                  <p className={`text-lg font-bold truncate ${isActive ? c.text : 'text-gray-700'}`}>
                    {formatCurrency(s.results.financial.netBenefit, currency)}
                  </p>
                </div>

                {/* ROI */}
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">ROI</p>
                  <p className={`text-lg font-bold ${isActive ? c.text : 'text-gray-700'}`}>
                    {formatROI(s.results.financial.roiPct)}
                  </p>
                </div>

                {/* Payback */}
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Payback Period</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {formatMonths(s.results.financial.paybackMonths)}
                  </p>
                </div>

                {/* Hours Saved */}
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Hours Saved / Year</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {formatNumber(s.results.efficiency.annualHoursSaved)}
                  </p>
                </div>

                {/* Total Impact */}
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-0.5">Total Annual Impact</p>
                  <p className={`text-base font-bold truncate ${isActive ? c.text : 'text-gray-700'}`}>
                    {formatCurrency(s.results.financial.totalAnnualImpact, currency)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Range bar */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 mb-2">Expected range of net benefit</p>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600 truncate">
            {formatCurrency(scenarios[0].results.financial.netBenefit, currency)}
          </span>
          <div className="flex-1 h-3 bg-gradient-to-r from-blue-200 via-purple-300 to-green-300 rounded-full relative">
            {scenarios.map((s, i) => {
              const range = scenarios[2].results.financial.netBenefit - scenarios[0].results.financial.netBenefit;
              const offset = range > 0
                ? ((s.results.financial.netBenefit - scenarios[0].results.financial.netBenefit) / range) * 100
                : i * 50;
              return (
                <div
                  key={s.type}
                  className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md ${
                    s.type === scenarioType ? 'scale-125 z-10' : ''
                  }`}
                  style={{ left: `${offset}%`, backgroundColor: colors[s.type].accent, transform: `translateX(-50%) translateY(-50%) ${s.type === scenarioType ? 'scale(1.25)' : ''}` }}
                />
              );
            })}
          </div>
          <span className="text-sm font-medium text-gray-600 truncate">
            {formatCurrency(scenarios[2].results.financial.netBenefit, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
