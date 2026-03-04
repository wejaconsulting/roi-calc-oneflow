import { useState } from 'react';
import { FileText, Copy, Check, Loader2 } from 'lucide-react';
import { useCalculatorStore } from '@/store/calculatorStore';
import { formatCurrency, formatPercent, formatMonths } from '@/utils/formatters';

export function BusinessCaseGenerator() {
  const {
    results,
    companyProfile,
    scenarioType,
    departments,
    businessCase,
    setBusinessCase,
    businessCaseLoading,
    setBusinessCaseLoading,
    branding,
  } = useCalculatorStore();
  const [copied, setCopied] = useState(false);

  const currency = companyProfile.currency;
  const companyName = branding.companyName || 'Your Company';

  const generateBusinessCase = async () => {
    setBusinessCaseLoading(true);
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) {
        setBusinessCase(generateFallbackBusinessCase());
        return;
      }

      const selectedDepts = departments.filter((d) => d.selected).map((d) => d.name);
      const prompt = `Write an executive business case for ${companyName} to adopt Oneflow contract lifecycle management.

Company Profile: ${companyProfile.size} company, ${companyProfile.industry || 'B2B'} industry
Scenario: ${scenarioType}
Departments: ${selectedDepts.join(', ')}

Key Financial Results:
- Total Annual Impact: ${formatCurrency(results.financial.totalAnnualImpact, currency)}
- Net Benefit (after Oneflow cost): ${formatCurrency(results.financial.netBenefit, currency)}
- ROI: ${formatPercent(results.financial.roiPct)}
- Payback Period: ${formatMonths(results.financial.paybackMonths)}
- Annual Hours Saved: ${results.efficiency.annualHoursSaved.toFixed(0)} hours (${results.efficiency.fteSaved.toFixed(1)} FTE)
- Cost Savings: ${formatCurrency(results.efficiency.costSavings, currency)}
- Revenue Recovered: ${formatCurrency(results.revenue.revenueRecovered, currency)}
- Revenue Accelerated: ${formatCurrency(results.revenue.revenueAccelerated, currency)}
- Renewal Protected: ${formatCurrency(results.revenue.renewalProtected, currency)}
- Risk Cost Avoided: ${formatCurrency(results.risk.avoidedRiskCost, currency)}

Write exactly 4 paragraphs:
1. Strategic context - why contract management matters now
2. Financial justification - use specific numbers from above
3. Risk mitigation argument
4. Call to action

Tone: executive, data-driven, concise. No bullet points. No headers.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          system:
            'You are an executive business case writer. Write persuasive, data-driven business cases. Be concise and impactful. Always reference specific financial figures provided.',
        }),
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || generateFallbackBusinessCase();
      setBusinessCase(text);
    } catch {
      setBusinessCase(generateFallbackBusinessCase());
    } finally {
      setBusinessCaseLoading(false);
    }
  };

  const generateFallbackBusinessCase = () => {
    const selectedDepts = departments.filter((d) => d.selected).map((d) => d.name);
    return `In today's competitive landscape, ${companyName}'s ability to manage contracts efficiently across ${selectedDepts.join(', ')} departments directly impacts bottom-line performance. Manual contract processes create bottlenecks, increase risk exposure, and allow revenue leakage that compounds over time. Implementing a modern contract lifecycle management solution is no longer optional - it's a strategic imperative.

The financial case for Oneflow is compelling. Based on ${scenarioType} projections, ${companyName} stands to realize ${formatCurrency(results.financial.totalAnnualImpact, currency)} in total annual impact. This breaks down to ${formatCurrency(results.efficiency.costSavings, currency)} in efficiency savings from ${results.efficiency.annualHoursSaved.toFixed(0)} hours saved annually (equivalent to ${results.efficiency.fteSaved.toFixed(1)} FTEs), ${formatCurrency(results.revenue.totalRevenueImpact, currency)} in revenue impact through recovered leakage and accelerated deal cycles, and ${formatCurrency(results.risk.avoidedRiskCost, currency)} in avoided risk costs. After accounting for the Oneflow investment, the net benefit is ${formatCurrency(results.financial.netBenefit, currency)} with an ROI of ${formatPercent(results.financial.roiPct)}.

Beyond direct financial returns, Oneflow significantly reduces organizational risk. Centralized contract management eliminates compliance gaps, ensures renewal capture, and creates an auditable trail for all contract activities. The platform's automated workflows reduce human error in contract execution, protecting ${companyName} from costly disputes and regulatory penalties.

We recommend proceeding with Oneflow implementation immediately. With a payback period of just ${formatMonths(results.financial.paybackMonths)}, every month of delay represents unrealized value. The ${scenarioType} scenario used here reflects achievable outcomes based on industry benchmarks for ${companyProfile.size}-sized organizations. We propose a phased rollout starting with the highest-impact departments to demonstrate quick wins while building toward full organizational adoption.`;
  };

  const handleCopy = async () => {
    if (businessCase) {
      await navigator.clipboard.writeText(businessCase);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6" id="business-case">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-[var(--brand-primary)]" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Executive Business Case</h3>
            <p className="text-sm text-gray-500">AI-generated based on your results</p>
          </div>
        </div>
        {businessCase && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>

      {!businessCase && (
        <button
          onClick={generateBusinessCase}
          disabled={businessCaseLoading}
          className="w-full py-3 bg-[var(--brand-primary)] text-white rounded-lg font-medium hover:bg-[var(--brand-primary-dark)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {businessCaseLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Executive Business Case'
          )}
        </button>
      )}

      {businessCase && (
        <div className="mt-4 bg-gray-50 rounded-lg p-5 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {businessCase}
        </div>
      )}
    </div>
  );
}
