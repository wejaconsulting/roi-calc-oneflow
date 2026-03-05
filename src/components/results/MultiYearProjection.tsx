import { useState } from 'react';
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

// Implementation ramp-up: gradual adoption over first 6 months
function rampUpFactor(month: number): number {
  if (month <= 0) return 0;
  if (month === 1) return 0.3;
  if (month === 2) return 0.5;
  if (month === 3) return 0.7;
  if (month === 4) return 0.85;
  if (month === 5) return 0.95;
  return 1.0;
}

function discountFactor(month: number, annualRate: number): number {
  if (annualRate <= 0) return 1;
  return 1 / Math.pow(1 + annualRate, month / 12);
}

export function MultiYearProjection() {
  const { results, companyProfile } = useCalculatorStore();
  const currency = companyProfile.currency;
  const [showRampUp, setShowRampUp] = useState(true);
  const [discountRate, setDiscountRate] = useState(8);

  const annualBenefit = results.financial.totalAnnualImpact;
  const annualCost = results.financial.oneflowAnnualCost;

  // Build month-by-month data for 3 years
  const data = [];
  let cumulativeBenefit = 0;
  let cumulativeCost = 0;
  let cumulativeNPVBenefit = 0;
  let cumulativeNPVCost = 0;

  for (let month = 0; month <= 36; month++) {
    if (month > 0) {
      const monthlyBenefit = (annualBenefit / 12) * (showRampUp ? rampUpFactor(month) : 1);
      const monthlyCost = annualCost / 12;
      const df = discountFactor(month, discountRate / 100);

      cumulativeBenefit += monthlyBenefit;
      cumulativeCost += monthlyCost;
      cumulativeNPVBenefit += monthlyBenefit * df;
      cumulativeNPVCost += monthlyCost * df;
    }

    data.push({
      month,
      label: month === 0 ? 'Start' : month % 12 === 0 ? `Year ${month / 12}` : `M${month}`,
      'Cumulative Benefits': Math.round(cumulativeBenefit),
      'Cumulative Cost': Math.round(cumulativeCost),
      'Net Value': Math.round(cumulativeBenefit - cumulativeCost),
    });
  }

  const year1Net = data[12] ? data[12]['Net Value'] : 0;
  const year2Net = data[24] ? data[24]['Net Value'] : 0;
  const year3Net = data[36] ? data[36]['Net Value'] : 0;
  const npv3Year = Math.round(cumulativeNPVBenefit - cumulativeNPVCost);

  // Find break-even month (first month where net > 0)
  const breakEvenMonth = data.findIndex((d) => d.month > 0 && d['Net Value'] > 0);
  const breakEvenDisplay = breakEvenMonth > 0 ? breakEvenMonth : results.financial.paybackMonths;

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

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-xs">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showRampUp}
            onChange={(e) => setShowRampUp(e.target.checked)}
            className="rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
          />
          <span className="text-gray-600">Implementation ramp-up (6-month)</span>
        </label>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Discount rate:</span>
          <input
            type="number"
            min={0}
            max={30}
            step={1}
            value={discountRate}
            onChange={(e) => setDiscountRate(Math.max(0, Math.min(30, Number(e.target.value))))}
            className="w-12 border border-gray-200 rounded px-1.5 py-0.5 text-center text-xs focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
          />
          <span className="text-gray-400">%</span>
        </div>
      </div>

      {/* Summary cards above chart */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Year 1 Net</p>
          <p className="text-sm font-bold text-gray-900">
            {formatCurrency(year1Net, currency)}
          </p>
          {showRampUp && (
            <p className="text-[10px] text-gray-400">with ramp-up</p>
          )}
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Year 2 Cumulative</p>
          <p className="text-sm font-bold text-gray-900">
            {formatCurrency(year2Net, currency)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Year 3 Cumulative</p>
          <p className="text-sm font-bold text-emerald-700">
            {formatCurrency(year3Net, currency)}
          </p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-3 text-center">
          <p className="text-xs text-indigo-600">3-Year NPV</p>
          <p className="text-sm font-bold text-indigo-700">
            {formatCurrency(npv3Year, currency)}
          </p>
          <p className="text-[10px] text-indigo-400">at {discountRate}%</p>
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
          {breakEvenDisplay > 0 && breakEvenDisplay <= 36 && (
            <ReferenceLine
              x={Math.round(breakEvenDisplay)}
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
