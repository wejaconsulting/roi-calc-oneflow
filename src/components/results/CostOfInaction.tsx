import { AlertTriangle, TrendingDown, Calendar } from 'lucide-react';
import { useCalculatorStore } from '@/store/calculatorStore';
import { formatCurrency } from '@/utils/formatters';

export function CostOfInaction() {
  const { results, companyProfile } = useCalculatorStore();
  const currency = companyProfile.currency;

  const monthlyLoss = results.financial.totalAnnualImpact / 12;
  const weeklyLoss = results.financial.totalAnnualImpact / 52;
  const dailyLoss = results.financial.totalAnnualImpact / 365;

  const threeYearLoss = results.financial.totalAnnualImpact * 3;

  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-200 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Cost of Inaction</h3>
          <p className="text-sm text-red-600">Every delay costs your organization</p>
        </div>
      </div>

      {/* Ticker-style loss counter */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 text-center border border-red-100">
          <p className="text-xs text-gray-500 mb-1">Per Day</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(dailyLoss, currency)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 text-center border border-red-100">
          <p className="text-xs text-gray-500 mb-1">Per Week</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(weeklyLoss, currency)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 text-center border border-red-100">
          <p className="text-xs text-gray-500 mb-1">Per Month</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(monthlyLoss, currency)}</p>
        </div>
      </div>

      {/* 3-year impact */}
      <div className="flex items-center gap-3 bg-white rounded-lg p-4 border border-red-100 mb-4">
        <Calendar className="w-5 h-5 text-red-500 shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-gray-600">
            Over 3 years, inaction costs your organization
          </p>
          <p className="text-xl font-bold text-red-700">{formatCurrency(threeYearLoss, currency)}</p>
        </div>
      </div>

      {/* Breakdown of what's lost */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-gray-600">
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            Revenue leaking monthly
          </span>
          <span className="font-semibold text-red-600">
            {formatCurrency(results.revenue.revenueRecovered / 12, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-gray-600">
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            Wasted hours monthly
          </span>
          <span className="font-semibold text-red-600">
            {Math.round(results.efficiency.annualHoursSaved / 12)} hrs
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-gray-600">
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            Risk exposure monthly
          </span>
          <span className="font-semibold text-red-600">
            {formatCurrency(results.risk.avoidedRiskCost / 12, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
