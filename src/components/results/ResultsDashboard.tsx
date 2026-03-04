import { Clock, DollarSign, TrendingUp, Percent } from 'lucide-react';
import { useCalculatorStore } from '@/store/calculatorStore';
import { useCountUp } from '@/hooks/useCountUp';
import { formatCurrency, formatNumber, formatPercent, formatMonths } from '@/utils/formatters';

function KPICard({
  label,
  value,
  formatted,
  icon,
  color,
}: {
  label: string;
  value: number;
  formatted: string;
  icon: React.ReactNode;
  color: string;
}) {
  const animated = useCountUp(value);
  // Use the animated value to derive display but show the formatted target for clarity
  const _animProgress = animated; // trigger re-renders
  void _animProgress;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{formatted}</p>
    </div>
  );
}

function BreakdownCard({ title, items }: { title: string; items: { label: string; value: string }[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{item.label}</span>
            <span className="text-sm font-semibold text-gray-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResultsDashboard() {
  const { results, companyProfile } = useCalculatorStore();
  const currency = companyProfile.currency;

  return (
    <div className="space-y-6" id="results-dashboard">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Annual Hours Saved"
          value={results.efficiency.annualHoursSaved}
          formatted={formatNumber(results.efficiency.annualHoursSaved, 0) + ' hrs'}
          icon={<Clock className="w-5 h-5 text-blue-600" />}
          color="bg-blue-100"
        />
        <KPICard
          label="Total Cost Savings"
          value={results.efficiency.costSavings}
          formatted={formatCurrency(results.efficiency.costSavings, currency)}
          icon={<DollarSign className="w-5 h-5 text-green-600" />}
          color="bg-green-100"
        />
        <KPICard
          label="Total Revenue Impact"
          value={results.revenue.totalRevenueImpact}
          formatted={formatCurrency(results.revenue.totalRevenueImpact, currency)}
          icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
          color="bg-purple-100"
        />
        <KPICard
          label="ROI"
          value={results.financial.roiPct}
          formatted={formatPercent(results.financial.roiPct, 0)}
          icon={<Percent className="w-5 h-5 text-orange-600" />}
          color="bg-orange-100"
        />
      </div>

      {/* Breakdown Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BreakdownCard
          title="Efficiency Breakdown"
          items={[
            { label: 'Annual Hours Saved', value: formatNumber(results.efficiency.annualHoursSaved) + ' hrs' },
            { label: 'FTE Equivalent', value: formatNumber(results.efficiency.fteSaved, 1) },
            { label: 'Cost Savings', value: formatCurrency(results.efficiency.costSavings, currency) },
          ]}
        />
        <BreakdownCard
          title="Revenue Breakdown"
          items={[
            { label: 'Revenue Recovered', value: formatCurrency(results.revenue.revenueRecovered, currency) },
            { label: 'Revenue Accelerated', value: formatCurrency(results.revenue.revenueAccelerated, currency) },
            { label: 'Renewal Protected', value: formatCurrency(results.revenue.renewalProtected, currency) },
          ]}
        />
        <BreakdownCard
          title="Risk Reduction"
          items={[
            { label: 'Avoided Risk Cost', value: formatCurrency(results.risk.avoidedRiskCost, currency) },
          ]}
        />
      </div>

      {/* Financial Summary */}
      <div className="bg-gradient-to-r from-[var(--brand-primary)] to-purple-700 rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Annual Impact', value: formatCurrency(results.financial.totalAnnualImpact, currency) },
            { label: 'Oneflow Cost', value: formatCurrency(results.financial.oneflowAnnualCost, currency) },
            { label: 'Net Benefit', value: formatCurrency(results.financial.netBenefit, currency) },
            { label: 'ROI', value: formatPercent(results.financial.roiPct) },
            { label: 'Payback Period', value: formatMonths(results.financial.paybackMonths) },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-purple-200 text-sm">{item.label}</p>
              <p className="text-xl font-bold mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
