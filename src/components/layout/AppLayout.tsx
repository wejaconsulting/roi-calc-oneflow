import { useState, useEffect } from 'react';
import { Share2, Download, Check, Palette, Building2, Users, ShieldAlert, CreditCard, RotateCcw, Calculator, Presentation } from 'lucide-react';
import { useCalculatorStore } from '@/store/calculatorStore';
import { ScenarioToggle } from '@/components/ScenarioToggle';
import { CompanyProfileStep } from '@/components/steps/CompanyProfile';
import { WorkforceInputsStep } from '@/components/steps/WorkforceInputs';
import { RiskInputsStep } from '@/components/steps/RiskInputs';
import { PricingConfigStep } from '@/components/steps/PricingConfig';
import { ResultsDashboard } from '@/components/results/ResultsDashboard';
import { Charts } from '@/components/results/Charts';
import { CostOfInaction } from '@/components/results/CostOfInaction';
import { MultiYearProjection } from '@/components/results/MultiYearProjection';
import { InputSummary } from '@/components/results/InputSummary';
import { BusinessCaseGenerator } from '@/components/ai/BusinessCaseGenerator';
import { ObjectionHandlers } from '@/components/ai/ObjectionHandlers';
import { CompetitorComparison } from '@/components/CompetitorComparison';
import { BrandingPanel } from '@/components/layout/BrandingPanel';
import { EmailGate } from '@/components/export/EmailGate';
import { generatePDF } from '@/components/export/PDFExport';
import { copyShareableLink, decodeStateFromURL } from '@/utils/shareableLink';
import { SharedViewLayout } from '@/components/layout/SharedViewLayout';
import { PresentationEditor } from '@/components/slides/PresentationEditor';
import { SensitivityAnalysis } from '@/components/results/SensitivityAnalysis';
import { ROIScorecard } from '@/components/results/ROIScorecard';
import { SmartRecommendations } from '@/components/results/SmartRecommendations';
import { ScenarioComparison } from '@/components/results/ScenarioComparison';

const steps = [
  { label: 'Company', icon: Building2, description: 'Size & industry' },
  { label: 'Workforce', icon: Users, description: 'Team & contracts' },
  { label: 'Risk', icon: ShieldAlert, description: 'Revenue leakage' },
  { label: 'Pricing', icon: CreditCard, description: 'Oneflow plan' },
];

export function AppLayout() {
  const { currentStep, setCurrentStep, branding, setBranding, emailSubmitted, isSharedView, resetToDefaults } =
    useCalculatorStore();
  const [shareCopied, setShareCopied] = useState(false);
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [activeTab, setActiveTab] = useState<'calculator' | 'presentation'>('calculator');

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

  const progressPct = ((currentStep + 1) / steps.length) * 100;

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

            {/* Tab Navigation */}
            <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('calculator')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'calculator'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Calculator className="w-4 h-4" />
                Calculator
              </button>
              <button
                onClick={() => setActiveTab('presentation')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'presentation'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Presentation className="w-4 h-4" />
                Presentation
              </button>
            </div>

            {/* Scenario Toggle */}
            <div className="hidden md:block w-72">
              <ScenarioToggle />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={resetToDefaults}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                title="Reset to Defaults"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
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

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-[var(--brand-primary)] transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Mobile tab toggle + scenario toggle */}
        <div className="md:hidden px-4 pb-3 pt-2 space-y-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'calculator'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <Calculator className="w-4 h-4" />
              Calculator
            </button>
            <button
              onClick={() => setActiveTab('presentation')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'presentation'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <Presentation className="w-4 h-4" />
              Presentation
            </button>
          </div>
          <ScenarioToggle />
        </div>
      </nav>

      {activeTab === 'presentation' ? (
        <PresentationEditor />
      ) : (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Panel: Steps */}
            <div className="lg:w-[420px] shrink-0 space-y-6">
              {/* Step Navigation - Visual Stepper */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Progress</span>
                  <span className="text-xs font-semibold text-[var(--brand-primary)]">
                    Step {currentStep + 1} of {steps.length}
                  </span>
                </div>

                {/* Horizontal stepper with connecting lines */}
                <div className="flex items-start">
                  {steps.map((step, i) => {
                    const Icon = step.icon;
                    const isCompleted = currentStep > i;
                    const isActive = currentStep === i;

                    return (
                      <div key={i} className="flex items-start flex-1">
                        <button
                          onClick={() => setCurrentStep(i)}
                          className="flex flex-col items-center gap-1.5 w-full group"
                        >
                          {/* Circle */}
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              isActive
                                ? 'bg-[var(--brand-primary)] text-white shadow-md shadow-purple-200'
                                : isCompleted
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                            }`}
                          >
                            {isCompleted ? (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <Icon className="w-4 h-4" />
                            )}
                          </div>
                          {/* Label */}
                          <span
                            className={`text-xs font-medium text-center ${
                              isActive ? 'text-[var(--brand-primary)]' : isCompleted ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            {step.label}
                          </span>
                        </button>
                        {/* Connector line */}
                        {i < steps.length - 1 && (
                          <div className="flex-1 flex items-center pt-5 px-1">
                            <div
                              className={`h-0.5 w-full rounded ${
                                currentStep > i ? 'bg-green-400' : 'bg-gray-200'
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
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
              <ROIScorecard />
              <CostOfInaction />
              <ResultsDashboard />
              <ScenarioComparison />
              <SmartRecommendations />
              <SensitivityAnalysis />
              <MultiYearProjection />
              <Charts />
              <InputSummary />
              <CompetitorComparison />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BusinessCaseGenerator />
                <ObjectionHandlers />
              </div>
            </div>
          </div>
        </div>
      )}

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
