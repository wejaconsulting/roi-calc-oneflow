import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useCalculatorStore } from '@/store/calculatorStore';
import { formatCurrency } from '@/utils/formatters';
import { CURRENCY_RATES } from '@/config/assumptions';

function compactNumber(value: number, currency: string): string {
  const symbol = CURRENCY_RATES[currency]?.symbol ?? '';
  if (Math.abs(value) >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${symbol}${(value / 1_000).toFixed(0)}K`;
  return `${symbol}${value.toFixed(0)}`;
}

export function MultiYearProjection() {
  const { results, companyProfile } = useCalculatorStore();
  const currency = companyProfile.currency;

  const annualBenefit = results.financial.totalAnnualImpact;
  const annualCost = results.financial.oneflowAnnualCost;

  // Build month-by-month data for 3 years
  const data = [];
  for (let month = 0; month <= 36; month++) {
    const cumulativeBenefit = (annualBenefit / 12) * month;
    const cumulativeCost = (annualCost / 12) * month;
    const netValue = cumulativeBenefit - cumulativeCost;

    data.push({
      month,
      label: month === 0 ? 'Start' : month % 12 === 0 ? `Year ${month / 12}` : `M${month}`,
      'Cumulative Benefits': Math.round(cumulativeBenefit),
      'Cumulative Cost': Math.round(cumulativeCost),
      'Net Value': Math.round(netValue),
    });
  }

  // Find break-even month
  const breakEvenMonth = results.financial.paybackMonths;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">3-Year Value Projection</h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 bg-[#5033FF] rounded-full inline-block" />
            Net Value
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 bg-emerald-400 rounded-full inline-block" />
            Benefits
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 bg-red-300 rounded-full inline-block" />
            Cost
          </span>
        </div>
      </div>

      {/* Summary cards above chart */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Year 1 Net</p>
          <p className="text-sm font-bold text-gray-900">
            {formatCurrency(results.financial.netBenefit, currency)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Year 2 Cumulative</p>
          <p className="text-sm font-bold text-gray-900">
            {formatCurrency(results.financial.netBenefit * 2, currency)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Year 3 Cumulative</p>
          <p className="text-sm font-bold text-emerald-700">
            {formatCurrency(results.financial.netBenefit * 3, currency)}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
          <defs>
            <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5033FF" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#5033FF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="benefitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10 }}
            tickFormatter={(m: number) =>
              m === 0 ? '' : m % 12 === 0 ? `Year ${m / 12}` : ''
            }
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            tickFormatter={(v: number) => compactNumber(v, currency)}
          />
          <Tooltip
            formatter={(value: number | undefined) =>
              formatCurrency(value ?? 0, currency)
            }
            labelFormatter={(m) => (m === 0 ? 'Start' : `Month ${m}`)}
          />
          {breakEvenMonth > 0 && breakEvenMonth <= 36 && (
            <ReferenceLine
              x={Math.round(breakEvenMonth)}
              stroke="#F59E0B"
              strokeDasharray="5 5"
              label={{
                value: 'Break-even',
                position: 'top',
                fill: '#D97706',
                fontSize: 11,
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="Cumulative Benefits"
            stroke="#10B981"
            strokeWidth={1.5}
            fill="url(#benefitGradient)"
          />
          <Area
            type="monotone"
            dataKey="Cumulative Cost"
            stroke="#EF4444"
            strokeWidth={1.5}
            fill="none"
            strokeDasharray="4 4"
          />
          <Area
            type="monotone"
            dataKey="Net Value"
            stroke="#5033FF"
            strokeWidth={2}
            fill="url(#netGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
