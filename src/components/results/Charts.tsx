import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useCalculatorStore } from '@/store/calculatorStore';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { calculateResults } from '@/utils/calculations';
import { CURRENCY_RATES } from '@/config/assumptions';
import type { ScenarioType } from '@/types';

const COLORS = ['#5033FF', '#00C48C', '#FF8C42', '#2196F3', '#FF4757', '#9C27B0', '#795548'];

function compactNumber(value: number, currency: string): string {
  const symbol = CURRENCY_RATES[currency]?.symbol ?? '';
  if (Math.abs(value) >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${symbol}${(value / 1_000).toFixed(0)}K`;
  return `${symbol}${value.toFixed(0)}`;
}

export function Charts() {
  const { results, companyProfile, workforceInputs, riskInputs, departments, pricingConfig, scenarioType } =
    useCalculatorStore();
  const currency = companyProfile.currency;

  // Department breakdown - use only cost saved for cleaner chart
  const deptData = results.byDepartment.map((d) => ({
    name: d.name,
    'Hours Saved': Math.round(d.hoursSaved),
    'Cost Saved': Math.round(d.costSaved),
  }));

  // Pie chart data - value distribution with short names
  const pieData = [
    { name: 'Efficiency', value: Math.round(results.efficiency.costSavings) },
    { name: 'Recovery', value: Math.round(results.revenue.revenueRecovered) },
    { name: 'Acceleration', value: Math.round(results.revenue.revenueAccelerated + results.revenue.renewalProtected) },
    { name: 'Risk', value: Math.round(results.risk.avoidedRiskCost) },
  ].filter((d) => d.value > 0);

  // Scenario comparison data
  const scenarioData = (['conservative', 'expected', 'optimistic'] as ScenarioType[]).map((sc) => {
    const r = calculateResults(workforceInputs, riskInputs, departments, pricingConfig, sc, currency);
    return {
      name: sc.charAt(0).toUpperCase() + sc.slice(1),
      'Total Impact': Math.round(r.financial.totalAnnualImpact),
      isActive: sc === scenarioType,
    };
  });

  const currencyTooltip = (value: number | undefined) => formatCurrency(value ?? 0, currency);

  return (
    <div className="space-y-6" id="results-charts">
      {/* Department Breakdown */}
      {deptData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Department Breakdown</h3>
          <ResponsiveContainer width="100%" height={Math.max(200, deptData.length * 60)}>
            <BarChart data={deptData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => compactNumber(v, currency)}
              />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} />
              <Tooltip
                formatter={(value: number | undefined, name?: string) =>
                  name === 'Hours Saved' ? `${formatNumber(value ?? 0)} hrs` : currencyTooltip(value)
                }
              />
              <Legend />
              <Bar dataKey="Hours Saved" fill="#5033FF" radius={[0, 4, 4, 0]} />
              <Bar dataKey="Cost Saved" fill="#00C48C" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Value Distribution Pie */}
        {pieData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Value Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={{ strokeWidth: 1 }}
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number | undefined) => currencyTooltip(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Scenario Comparison */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Scenario Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scenarioData} margin={{ bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => compactNumber(v, currency)}
              />
              <Tooltip formatter={(value: number | undefined) => currencyTooltip(value)} />
              <Bar dataKey="Total Impact" radius={[4, 4, 0, 0]}>
                {scenarioData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.isActive ? '#5033FF' : '#D1C4E9'}
                    stroke={entry.isActive ? '#3D24CC' : 'transparent'}
                    strokeWidth={entry.isActive ? 2 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
