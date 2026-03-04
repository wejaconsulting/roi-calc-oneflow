import { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUp } from 'lucide-react';
import { useCalculatorStore } from '@/store/calculatorStore';
import { formatCurrency, formatNumber } from '@/utils/formatters';

export function CompetitorComparison() {
  const [isOpen, setIsOpen] = useState(false);
  const { results, companyProfile } = useCalculatorStore();
  const currency = companyProfile.currency;

  const rows = [
    {
      label: 'Annual Hours Saved',
      statusQuo: '0 hrs',
      basicEsign: formatNumber(results.efficiency.annualHoursSaved * 0.2) + ' hrs',
      oneflow: formatNumber(results.efficiency.annualHoursSaved) + ' hrs',
    },
    {
      label: 'Cost Savings',
      statusQuo: formatCurrency(0, currency),
      basicEsign: formatCurrency(results.efficiency.costSavings * 0.2, currency),
      oneflow: formatCurrency(results.efficiency.costSavings, currency),
    },
    {
      label: 'Revenue Impact',
      statusQuo: formatCurrency(0, currency),
      basicEsign: formatCurrency(results.revenue.totalRevenueImpact * 0.2, currency),
      oneflow: formatCurrency(results.revenue.totalRevenueImpact, currency),
    },
    {
      label: 'Risk Reduction',
      statusQuo: formatCurrency(0, currency),
      basicEsign: formatCurrency(results.risk.avoidedRiskCost * 0.2, currency),
      oneflow: formatCurrency(results.risk.avoidedRiskCost, currency),
    },
    {
      label: 'Total Value',
      statusQuo: formatCurrency(0, currency),
      basicEsign: formatCurrency(results.financial.totalAnnualImpact * 0.2, currency),
      oneflow: formatCurrency(results.financial.totalAnnualImpact, currency),
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900">Competitor Comparison</span>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {isOpen && (
        <div className="px-5 pb-5">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-sm font-medium text-gray-500 py-3 pr-4"></th>
                  <th className="text-center text-sm font-medium text-gray-400 py-3 px-4">
                    Status Quo (Manual)
                  </th>
                  <th className="text-center text-sm font-medium text-gray-400 py-3 px-4">
                    Basic E-sign Tool
                  </th>
                  <th className="text-center text-sm font-medium py-3 px-4 text-green-700 bg-green-50 rounded-t-lg">
                    Oneflow CLM
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.label} className={i < rows.length - 1 ? 'border-b border-gray-50' : ''}>
                    <td className={`text-sm py-3 pr-4 ${i === rows.length - 1 ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                      {row.label}
                    </td>
                    <td className="text-center text-sm text-gray-400 py-3 px-4">{row.statusQuo}</td>
                    <td className="text-center text-sm text-gray-500 py-3 px-4">{row.basicEsign}</td>
                    <td className={`text-center text-sm py-3 px-4 bg-green-50 ${i === rows.length - 1 ? 'font-bold text-green-700' : 'text-green-700'}`}>
                      <div className="flex items-center justify-center gap-1">
                        {row.oneflow}
                        <ArrowUp className="w-3 h-3 text-green-500" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            * Basic e-sign tools capture approximately 20% of full CLM value. Oneflow delivers comprehensive contract lifecycle management.
          </p>
        </div>
      )}
    </div>
  );
}
