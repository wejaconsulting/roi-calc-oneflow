import { useState, useEffect } from 'react';
import { Share2, Download, Check, Palette, Building2, Users, ShieldAlert, CreditCard } from 'lucide-react';
import { useCalculatorStore } from '@/store/calculatorStore';
import { ScenarioToggle } from '@/components/ScenarioToggle';
import { CompanyProfileStep } from '@/components/steps/CompanyProfile';
import { WorkforceInputsStep } from '@/components/steps/WorkforceInputs';
import { RiskInputsStep } from '@/components/steps/RiskInputs';
import { PricingConfigStep } from '@/components/steps/PricingConfig';
import { ResultsDashboard } from '@/components/results/ResultsDashboard';
import { Charts } from '@/components/results/Charts';
import { BusinessCaseGenerator } from '@/components/ai/BusinessCaseGenerator';
import { ObjectionHandlers } from '@/components/ai/ObjectionHandlers';
import { CompetitorComparison } from '@/components/CompetitorComparison';
import { BrandingPanel } from '@/components/layout/BrandingPanel';
import { EmailGate } from '@/components/export/EmailGate';
import { generatePDF } from '@/components/export/PDFExport';
import { copyShareableLink, decodeStateFromURL } from '@/utils/shareableLink';
import { SharedViewLayout } from '@/components/layout/SharedViewLayout';

const steps = [
  { label: 'Company', icon: <Building2 className="w-4 h-4" /> },
  { label: 'Workforce', icon: <Users className="w-4 h-4" /> },
  { label: 'Risk', icon: <ShieldAlert className="w-4 h-4" /> },
  { label: 'Pricing', icon: <CreditCard className="w-4 h-4" /> },
];

export function AppLayout() {
  const { currentStep, setCurrentStep, branding, setBranding, emailSubmitted, isSharedView } =
    useCalculatorStore();
  const [shareCopied, setShareCopied] = useState(false);
  const [showEmailGate, setShowEmailGate] = useState(false);

  useEffect(() => {
    decodeStateFromURL();
  }, []);

  // Render locked presentation view when opened via shared link
  if (isSharedView) {
    return <SharedViewLayout />;
  }

  const handleShare = async () => {
    const success = await copyShareableLink();
    if (success) {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (emailSubmitted) {
      generatePDF();
    } else {
      setShowEmailGate(true);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <CompanyProfileStep />;
      case 1:
        return <WorkforceInputsStep />;
      case 2:
        return <RiskInputsStep />;
      case 3:
        return <PricingConfigStep />;
      default:
        return <CompanyProfileStep />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {branding.logoBase64 ? (
                <img src={branding.logoBase64} alt="Logo" className="h-8 object-contain" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[var(--brand-primary)] rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">O</span>
                  </div>
                  <span className="font-bold text-gray-900 hidden sm:block">Oneflow ROI Calculator</span>
                </div>
              )}
            </div>

            {/* Scenario Toggle (center) */}
            <div className="hidden md:block w-72">
              <ScenarioToggle />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBranding({ enabled: !branding.enabled })}
                className={`p-2 rounded-lg transition-colors ${
                  branding.enabled ? 'bg-purple-100 text-[var(--brand-primary)]' : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Customize Branding"
              >
                <Palette className="w-5 h-5" />
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {shareCopied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{shareCopied ? 'Link Copied!' : 'Share'}</span>
              </button>
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

        {/* Mobile scenario toggle */}
        <div className="md:hidden px-4 pb-3">
          <ScenarioToggle />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel: Steps */}
          <div className="lg:w-[420px] shrink-0 space-y-6">
            {/* Step Navigation */}
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {steps.map((step, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    currentStep === i
                      ? 'bg-[var(--brand-primary)] text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                      currentStep === i
                        ? 'bg-white/20 text-white'
                        : currentStep > i
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {currentStep > i ? (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                  {step.label}
                </button>
              ))}
            </div>

            {/* Branding Panel */}
            <BrandingPanel />

            {/* Active Step Content */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">{renderStep()}</div>

            {/* Step Navigation Buttons */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
              )}
              {currentStep < 3 && (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="flex-1 py-3 bg-[var(--brand-primary)] text-white rounded-lg font-medium hover:bg-[var(--brand-primary-dark)] transition-colors"
                >
                  Next Step
                </button>
              )}
            </div>
          </div>

          {/* Right Panel: Results */}
          <div className="flex-1 space-y-6 min-w-0">
            <ResultsDashboard />
            <Charts />
            <CompetitorComparison />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BusinessCaseGenerator />
              <ObjectionHandlers />
            </div>
          </div>
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
