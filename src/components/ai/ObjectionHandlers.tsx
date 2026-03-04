import { useState } from 'react';
import { MessageSquare, ChevronDown, ChevronUp, Loader2, BarChart3, Scale, Monitor, ShoppingCart, Target, Sparkles } from 'lucide-react';
import { useCalculatorStore } from '@/store/calculatorStore';
import { formatCurrency, formatPercent, formatMonths } from '@/utils/formatters';

const stakeholderIcons: Record<string, React.ReactNode> = {
  cfo: <BarChart3 className="w-4 h-4" />,
  legal: <Scale className="w-4 h-4" />,
  it: <Monitor className="w-4 h-4" />,
  procurement: <ShoppingCart className="w-4 h-4" />,
  competitiveDifferentiation: <Target className="w-4 h-4" />,
  valueBullets: <Sparkles className="w-4 h-4" />,
};

const stakeholderLabels: Record<string, string> = {
  cfo: 'CFO / Finance',
  legal: 'Legal / Compliance',
  it: 'IT / Security',
  procurement: 'Procurement',
  competitiveDifferentiation: 'Competitive Differentiation',
  valueBullets: 'Value Proposition Bullets',
};

export function ObjectionHandlers() {
  const {
    results,
    companyProfile,
    scenarioType,
    objectionHandlers,
    setObjectionHandlers,
    aiLoading,
    setAiLoading,
  } = useCalculatorStore();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const currency = companyProfile.currency;

  const toggleSection = (key: string) => {
    setExpandedSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const generateHandlers = async () => {
    setAiLoading(true);
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) {
        setObjectionHandlers(generateFallbackHandlers());
        setExpandedSections(['cfo']);
        return;
      }

      const prompt = `Based on these ROI results for a contract management platform, generate objection handlers and talking points.

Results (${scenarioType} scenario):
- ROI: ${formatPercent(results.financial.roiPct)}
- Net Benefit: ${formatCurrency(results.financial.netBenefit, currency)}
- Payback: ${formatMonths(results.financial.paybackMonths)}
- Hours Saved: ${results.efficiency.annualHoursSaved.toFixed(0)}
- Cost Savings: ${formatCurrency(results.efficiency.costSavings, currency)}

Respond ONLY with valid JSON (no markdown code blocks) in this format:
{
  "cfo": ["objection: response", "objection: response", "objection: response"],
  "legal": ["objection: response", "objection: response"],
  "it": ["objection: response", "objection: response"],
  "procurement": ["objection: response", "objection: response"],
  "competitiveDifferentiation": ["point 1", "point 2", "point 3"],
  "valueBullets": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"]
}`;

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
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }],
          system: 'You are a B2B sales enablement expert. Generate practical objection handlers. Respond only with valid JSON, no markdown formatting.',
        }),
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      const parsed = JSON.parse(text);
      setObjectionHandlers(parsed);
      setExpandedSections(['cfo']);
    } catch {
      setObjectionHandlers(generateFallbackHandlers());
      setExpandedSections(['cfo']);
    } finally {
      setAiLoading(false);
    }
  };

  const generateFallbackHandlers = (): Record<string, string[]> => ({
    cfo: [
      `"The cost seems high." → With an ROI of ${formatPercent(results.financial.roiPct)} and payback in ${formatMonths(results.financial.paybackMonths)}, Oneflow pays for itself quickly. The net annual benefit is ${formatCurrency(results.financial.netBenefit, currency)}.`,
      `"Can we justify this expense?" → The ${formatCurrency(results.efficiency.costSavings, currency)} in efficiency savings alone covers the investment. Additional revenue impact adds ${formatCurrency(results.revenue.totalRevenueImpact, currency)}.`,
      `"What if we don't see these results?" → Even the conservative scenario shows positive ROI. We recommend a phased approach to validate results before full rollout.`,
    ],
    legal: [
      `"Our current process works fine." → Manual processes leave gaps in compliance tracking. Oneflow provides full audit trails and version control for every contract.`,
      `"How does this affect our compliance?" → Oneflow strengthens compliance with automated retention policies, access controls, and GDPR-compliant data handling.`,
    ],
    it: [
      `"Integration complexity concerns." → Oneflow offers pre-built integrations with major CRM, HRIS, and ERP systems. Typical deployment takes 2-4 weeks.`,
      `"Security concerns." → Oneflow is SOC 2 Type II certified with end-to-end encryption, SSO support, and granular access controls.`,
    ],
    procurement: [
      `"We're already using an e-sign tool." → Basic e-sign captures only 20% of Oneflow's value. CLM addresses the full contract lifecycle from creation through renewal management.`,
      `"Can we negotiate the price?" → Focus on the value: every month without Oneflow costs approximately ${formatCurrency(results.financial.totalAnnualImpact / 12, currency)} in unrealized benefits.`,
    ],
    competitiveDifferentiation: [
      'Only truly end-to-end contract platform (create, sign, manage, renew in one place)',
      'Native HTML contracts vs. PDF-based competitors - enabling real-time collaboration',
      'Built-in AI for contract review and data extraction at no additional core cost',
    ],
    valueBullets: [
      `${formatCurrency(results.financial.netBenefit, currency)} net annual benefit after platform costs`,
      `${results.efficiency.annualHoursSaved.toFixed(0)} hours freed up for strategic work annually`,
      `${formatPercent(results.financial.roiPct)} return on investment within the first year`,
      `Payback period of just ${formatMonths(results.financial.paybackMonths)}`,
    ],
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Objection Handlers & Talking Points</h3>
          <p className="text-sm text-gray-500">Stakeholder-specific responses</p>
        </div>
      </div>

      {!objectionHandlers && (
        <button
          onClick={generateHandlers}
          disabled={aiLoading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {aiLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Objection Handlers & Talking Points'
          )}
        </button>
      )}

      {objectionHandlers && (
        <div className="space-y-2 mt-4">
          {Object.entries(objectionHandlers).map(([key, items]) => (
            <div key={key} className="border border-gray-100 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(key)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-[var(--brand-primary)]">{stakeholderIcons[key]}</div>
                  <span className="font-medium text-gray-900">{stakeholderLabels[key] || key}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {items.length} items
                  </span>
                </div>
                {expandedSections.includes(key) ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {expandedSections.includes(key) && (
                <div className="px-4 pb-4 space-y-3">
                  {items.map((item, i) => (
                    <div key={i} className="text-sm text-gray-600 pl-7 py-2 border-l-2 border-purple-200">
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
