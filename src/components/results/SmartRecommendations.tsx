import { useCalculatorStore } from '@/store/calculatorStore';
import { formatCurrency, formatMonths, formatNumber } from '@/utils/formatters';
import { Lightbulb, TrendingUp, Clock, Shield, Zap, Target } from 'lucide-react';

interface Recommendation {
  icon: React.ElementType;
  title: string;
  description: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
}

export function SmartRecommendations() {
  const { results, companyProfile, workforceInputs, riskInputs } = useCalculatorStore();
  const currency = companyProfile.currency;

  const recommendations: Recommendation[] = [];

  // Analyze and generate contextual recommendations
  const hoursPerContract = workforceInputs.hoursPerContract;
  const totalContracts = workforceInputs.employeesHandlingContracts * workforceInputs.contractsPerEmployee;
  const paybackMonths = results.financial.paybackMonths;
  const roi = results.financial.roiPct;

  // High hours per contract recommendation
  if (hoursPerContract >= 4) {
    recommendations.push({
      icon: Clock,
      title: 'Your contract cycle time is above average',
      description: `At ${hoursPerContract} hours per contract, you're spending ${formatNumber(hoursPerContract * totalContracts)} hours/year on contract processing. Industry best practice is 1-2 hours with CLM automation.`,
      impact: `Potential to save ${formatNumber(Math.round((hoursPerContract - 1.5) * totalContracts))} additional hours`,
      priority: 'high',
    });
  }

  // Revenue leakage insight
  if (riskInputs.revenueLeakagePct > 2) {
    const leakageAmount = workforceInputs.annualRevenueUnderContract * (riskInputs.revenueLeakagePct / 100);
    recommendations.push({
      icon: TrendingUp,
      title: 'Revenue leakage is a significant risk',
      description: `At ${riskInputs.revenueLeakagePct}% leakage rate, you're losing approximately ${formatCurrency(leakageAmount, currency)}/year to missed renewals, unenforced terms, and billing errors.`,
      impact: `Recovery potential: ${formatCurrency(results.revenue.revenueRecovered, currency)}/year`,
      priority: 'high',
    });
  }

  // Quick payback recommendation
  if (paybackMonths <= 3) {
    recommendations.push({
      icon: Zap,
      title: 'Exceptional payback period',
      description: `At ${formatMonths(paybackMonths)}, the investment pays for itself almost immediately. This is in the top 10% of CLM implementations.`,
      impact: `${formatCurrency(results.financial.netBenefit, currency)} net benefit from year 1`,
      priority: 'high',
    });
  }

  // Department-specific insight
  if (results.byDepartment.length > 0) {
    const topDept = [...results.byDepartment].sort((a, b) => (b.costSaved + b.revenueImpact) - (a.costSaved + a.revenueImpact))[0];
    if (topDept) {
      recommendations.push({
        icon: Target,
        title: `Start with ${topDept.name}`,
        description: `${topDept.name} shows the highest impact at ${formatCurrency(topDept.costSaved + topDept.revenueImpact, currency)}/year. A pilot here would demonstrate value fastest.`,
        impact: `${formatNumber(topDept.hoursSaved)} hours saved in this department alone`,
        priority: 'medium',
      });
    }
  }

  // Enterprise plan suggestion
  if (companyProfile.size === 'enterprise' || workforceInputs.employeesHandlingContracts > 50) {
    recommendations.push({
      icon: Shield,
      title: 'Enterprise security features recommended',
      description: `With ${workforceInputs.employeesHandlingContracts} employees handling contracts, advanced security, SSO, and audit trails become critical for compliance.`,
      impact: `Risk reduction: ${formatCurrency(results.risk.avoidedRiskCost, currency)}/year`,
      priority: 'medium',
    });
  }

  // ROI is exceptional
  if (roi > 500) {
    recommendations.push({
      icon: Lightbulb,
      title: 'ROI significantly exceeds benchmarks',
      description: `Your projected ${Math.round(roi / 100)}x return is well above the typical 3-5x CLM ROI. This creates a compelling business case for immediate adoption.`,
      impact: 'Strong executive sponsor material',
      priority: 'low',
    });
  }

  // Low contract volume - suggest scaling
  if (totalContracts < 200) {
    recommendations.push({
      icon: TrendingUp,
      title: 'Growth potential with increased adoption',
      description: `Currently processing ${formatNumber(totalContracts)} contracts/year. Expanding contract coverage to more teams could multiply benefits.`,
      impact: 'Consider phased rollout to additional departments',
      priority: 'low',
    });
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const priorityColors = {
    high: { bg: 'bg-red-50', border: 'border-red-100', badge: 'bg-red-100 text-red-700' },
    medium: { bg: 'bg-yellow-50', border: 'border-yellow-100', badge: 'bg-yellow-100 text-yellow-700' },
    low: { bg: 'bg-blue-50', border: 'border-blue-100', badge: 'bg-blue-100 text-blue-700' },
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb className="w-5 h-5 text-[var(--brand-primary)]" />
        <h3 className="text-lg font-bold text-gray-900">Smart Recommendations</h3>
      </div>
      <p className="text-sm text-gray-500 mb-6">Personalized insights based on your inputs</p>

      <div className="space-y-4">
        {recommendations.slice(0, 5).map((rec, i) => {
          const colors = priorityColors[rec.priority];
          const Icon = rec.icon;
          return (
            <div key={i} className={`${colors.bg} border ${colors.border} rounded-xl p-4`}>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                  <Icon className="w-4 h-4 text-gray-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-gray-900">{rec.title}</h4>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${colors.badge} uppercase`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{rec.description}</p>
                  <p className="text-xs font-medium text-gray-800">{rec.impact}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {recommendations.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">
          Complete all calculator steps to see personalized recommendations.
        </p>
      )}
    </div>
  );
}
