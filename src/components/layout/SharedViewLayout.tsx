import { useState } from 'react';
import { Download, Lock } from 'lucide-react';
import { useCalculatorStore } from '@/store/calculatorStore';
import { ScenarioToggle } from '@/components/ScenarioToggle';
import { ResultsDashboard } from '@/components/results/ResultsDashboard';
import { Charts } from '@/components/results/Charts';
import { CostOfInaction } from '@/components/results/CostOfInaction';
import { MultiYearProjection } from '@/components/results/MultiYearProjection';
import { InputSummary } from '@/components/results/InputSummary';
import { CompetitorComparison } from '@/components/CompetitorComparison';
import { BusinessCaseGenerator } from '@/components/ai/BusinessCaseGenerator';
import { ObjectionHandlers } from '@/components/ai/ObjectionHandlers';
import { EmailGate } from '@/components/export/EmailGate';
import { generatePDF } from '@/components/export/PDFExport';
import { formatCurrency, formatMonths, formatNumber, formatROI } from '@/utils/formatters';

export function SharedViewLayout() {
  const { results, companyProfile, branding, scenarioType, emailSubmitted } =
    useCalculatorStore();
  const [showEmailGate, setShowEmailGate] = useState(false);
  const currency = companyProfile.currency;
  const companyName = branding.companyName || 'Your Company';

  const handleDownload = () => {
    if (emailSubmitted) {
      generatePDF();
    } else {
      setShowEmailGate(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {branding.logoBase64 ? (
                <img src={branding.logoBase64} alt="Logo" className="h-8 object-contain" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[var(--brand-primary)] rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">O</span>
                  </div>
                  <span className="font-bold text-gray-900 hidden sm:block">
                    Oneflow ROI Calculator
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                <Lock className="w-3 h-3" />
                <span>Shared View</span>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--brand-primary)] text-white rounded-lg hover:bg-[var(--brand-primary-dark)] transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ROI Analysis Report</h1>
          <p className="text-lg text-gray-500">
            Prepared for <span className="font-semibold text-gray-700">{companyName}</span>
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {scenarioType.charAt(0).toUpperCase() + scenarioType.slice(1)} Scenario
          </p>
        </div>

        {/* Key Highlights Bar */}
        <div className="bg-gradient-to-r from-[var(--brand-primary)] to-purple-700 rounded-2xl p-8 mb-8 text-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-purple-200 text-sm mb-1">Net Annual Benefit</p>
              <p className="text-2xl md:text-3xl font-bold">
                {formatCurrency(results.financial.netBenefit, currency)}
              </p>
            </div>
            <div>
              <p className="text-purple-200 text-sm mb-1">ROI</p>
              <p className="text-2xl md:text-3xl font-bold">
                {formatROI(results.financial.roiPct)}
              </p>
            </div>
            <div>
              <p className="text-purple-200 text-sm mb-1">Payback Period</p>
              <p className="text-2xl md:text-3xl font-bold">
                {formatMonths(results.financial.paybackMonths)}
              </p>
            </div>
            <div>
              <p className="text-purple-200 text-sm mb-1">Hours Saved / Year</p>
              <p className="text-2xl md:text-3xl font-bold">
                {formatNumber(results.efficiency.annualHoursSaved)}
              </p>
            </div>
          </div>
        </div>

        {/* Scenario Toggle */}
        <div className="max-w-sm mx-auto mb-8">
          <ScenarioToggle />
        </div>

        {/* Results */}
        <div className="space-y-8">
          <CostOfInaction />
          <ResultsDashboard />
          <MultiYearProjection />
          <Charts />
          <InputSummary />
          <CompetitorComparison />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BusinessCaseGenerator />
            <ObjectionHandlers />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-gray-400 pb-8">
          <p>Generated by Oneflow ROI Calculator</p>
        </div>
      </div>

      {/* Email Gate Modal */}
      <EmailGate
        isOpen={showEmailGate}
        onClose={() => setShowEmailGate(false)}
        onSuccess={() => {
          setShowEmailGate(false);
          generatePDF();
        }}
      />
    </div>
  );
}
