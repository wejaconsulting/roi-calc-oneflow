import { useState, useEffect, useCallback } from 'react';
import { Download, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { useCalculatorStore } from '@/store/calculatorStore';
import { formatCurrency, formatMonths, formatNumber, formatROI } from '@/utils/formatters';
import { Charts } from '@/components/results/Charts';
import { MultiYearProjection } from '@/components/results/MultiYearProjection';
import { EmailGate } from '@/components/export/EmailGate';
import { generatePDF } from '@/components/export/PDFExport';

function SlideWrapper({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center px-8 md:px-16 animate-fadeIn ${className}`}>
      {children}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
      <p className="text-gray-400 text-sm mb-2">{label}</p>
      <p className="text-3xl md:text-4xl font-bold text-white">{value}</p>
    </div>
  );
}

export function SharedViewLayout() {
  const { results, companyProfile, branding, scenarioType, emailSubmitted, businessCase } =
    useCalculatorStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showEmailGate, setShowEmailGate] = useState(false);
  const currency = companyProfile.currency;
  const companyName = branding.companyName || 'Your Company';
  const brandColor = branding.primaryColor || '#5033FF';

  const totalSlides = 7;

  const next = useCallback(() => setCurrentSlide((s) => Math.min(s + 1, totalSlides - 1)), [totalSlides]);
  const prev = useCallback(() => setCurrentSlide((s) => Math.max(s - 1, 0)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  useEffect(() => {
    document.documentElement.style.setProperty('--brand-primary', brandColor);
  }, [brandColor]);

  const handleDownload = () => {
    if (emailSubmitted) generatePDF();
    else setShowEmailGate(true);
  };

  const dailyLoss = results.financial.totalAnnualImpact / 365;
  const weeklyLoss = dailyLoss * 7;
  const monthlyLoss = results.financial.totalAnnualImpact / 12;

  const slides = [
    // Slide 0: Hero
    <SlideWrapper key="hero">
      <div className="text-center max-w-3xl">
        {branding.logoBase64 && (
          <img src={branding.logoBase64} alt="Logo" className="h-12 mx-auto mb-8 object-contain" />
        )}
        <p className="text-sm uppercase tracking-widest mb-4" style={{ color: brandColor }}>ROI Analysis Report</p>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{companyName}</h1>
        <p className="text-gray-400 text-lg mb-12">
          {scenarioType.charAt(0).toUpperCase() + scenarioType.slice(1)} Scenario
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Net Annual Benefit" value={formatCurrency(results.financial.netBenefit, currency)} />
          <MetricCard label="ROI" value={formatROI(results.financial.roiPct)} />
          <MetricCard label="Payback Period" value={formatMonths(results.financial.paybackMonths)} />
          <MetricCard label="Hours Saved / Year" value={formatNumber(results.efficiency.annualHoursSaved)} />
        </div>
        <p className="mt-10 text-white/20 text-xs">Use arrow keys or click to navigate</p>
      </div>
    </SlideWrapper>,

    // Slide 1: Cost of Inaction
    <SlideWrapper key="cost-of-inaction">
      <div className="max-w-3xl w-full text-center">
        <p className="text-red-400 text-sm uppercase tracking-widest mb-3">The Cost of Waiting</p>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">Every Day Without Oneflow Costs You</h2>
        <p className="text-gray-400 mb-10">Money left on the table while using manual contract processes</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Per Day', value: dailyLoss },
            { label: 'Per Week', value: weeklyLoss },
            { label: 'Per Month', value: monthlyLoss },
          ].map((item) => (
            <div key={item.label} className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
              <p className="text-red-400 text-sm mb-2">{item.label}</p>
              <p className="text-3xl font-bold text-red-400">{formatCurrency(item.value, currency)}</p>
            </div>
          ))}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <p className="text-gray-400 text-sm mb-2">3-Year Cumulative Impact</p>
          <p className="text-4xl font-bold text-white">{formatCurrency(results.financial.totalAnnualImpact * 3, currency)}</p>
        </div>
      </div>
    </SlideWrapper>,

    // Slide 2: Financial Summary
    <SlideWrapper key="financial">
      <div className="max-w-4xl w-full">
        <p className="text-sm uppercase tracking-widest mb-3 text-center" style={{ color: brandColor }}>Financial Impact</p>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-10 text-center">Where the Value Comes From</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-blue-400 font-semibold mb-4">Efficiency Gains</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-gray-400 text-sm">Hours Saved</span><span className="text-white font-semibold">{formatNumber(results.efficiency.annualHoursSaved)} hrs</span></div>
              <div className="flex justify-between"><span className="text-gray-400 text-sm">FTE Equivalent</span><span className="text-white font-semibold">{formatNumber(results.efficiency.fteSaved, 1)}</span></div>
              <div className="flex justify-between border-t border-white/10 pt-3"><span className="text-gray-400 text-sm">Cost Savings</span><span className="text-blue-400 font-bold">{formatCurrency(results.efficiency.costSavings, currency)}</span></div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-green-400 font-semibold mb-4">Revenue Impact</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-gray-400 text-sm">Recovered</span><span className="text-white font-semibold">{formatCurrency(results.revenue.revenueRecovered, currency)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400 text-sm">Accelerated</span><span className="text-white font-semibold">{formatCurrency(results.revenue.revenueAccelerated, currency)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400 text-sm">Renewal Protected</span><span className="text-white font-semibold">{formatCurrency(results.revenue.renewalProtected, currency)}</span></div>
              <div className="flex justify-between border-t border-white/10 pt-3"><span className="text-gray-400 text-sm">Total</span><span className="text-green-400 font-bold">{formatCurrency(results.revenue.totalRevenueImpact, currency)}</span></div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-orange-400 font-semibold mb-4">Risk Reduction</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-gray-400 text-sm">Avoided Risk Cost</span><span className="text-white font-semibold">{formatCurrency(results.risk.avoidedRiskCost, currency)}</span></div>
              <div className="flex justify-between border-t border-white/10 pt-3"><span className="text-gray-400 text-sm">Total</span><span className="text-orange-400 font-bold">{formatCurrency(results.risk.avoidedRiskCost, currency)}</span></div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-6" style={{ background: `linear-gradient(135deg, ${brandColor}33, ${brandColor}11)`, border: `1px solid ${brandColor}33` }}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            {[
              { label: 'Total Annual Impact', value: formatCurrency(results.financial.totalAnnualImpact, currency) },
              { label: 'Oneflow Cost', value: formatCurrency(results.financial.oneflowAnnualCost, currency) },
              { label: 'Net Benefit', value: formatCurrency(results.financial.netBenefit, currency) },
              { label: 'ROI', value: formatROI(results.financial.roiPct) },
              { label: 'Payback', value: formatMonths(results.financial.paybackMonths) },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-gray-400 text-xs mb-1">{item.label}</p>
                <p className="text-lg md:text-xl font-bold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideWrapper>,

    // Slide 3: Projection
    <SlideWrapper key="projection">
      <div className="max-w-4xl w-full">
        <p className="text-sm uppercase tracking-widest mb-3 text-center" style={{ color: brandColor }}>Long-Term Value</p>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 text-center">3-Year Projection</h2>
        <div className="bg-white rounded-2xl p-6 shadow-2xl"><MultiYearProjection /></div>
      </div>
    </SlideWrapper>,

    // Slide 4: Charts
    <SlideWrapper key="charts">
      <div className="max-w-4xl w-full">
        <p className="text-sm uppercase tracking-widest mb-3 text-center" style={{ color: brandColor }}>Visual Breakdown</p>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 text-center">Impact Analysis</h2>
        <div className="bg-white rounded-2xl p-6 shadow-2xl" id="results-charts"><Charts /></div>
      </div>
    </SlideWrapper>,

    // Slide 5: Departments
    <SlideWrapper key="departments">
      <div className="max-w-3xl w-full">
        <p className="text-sm uppercase tracking-widest mb-3 text-center" style={{ color: brandColor }}>By Department</p>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 text-center">Impact Across Teams</h2>
        {results.byDepartment.length > 0 ? (
          <div className="space-y-4">
            {results.byDepartment.map((dept) => {
              const maxVal = Math.max(...results.byDepartment.map((d) => d.costSaved + d.revenueImpact));
              const pct = maxVal > 0 ? ((dept.costSaved + dept.revenueImpact) / maxVal) * 100 : 0;
              return (
                <div key={dept.name} className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-semibold">{dept.name}</span>
                    <span className="font-bold" style={{ color: brandColor }}>{formatCurrency(dept.costSaved + dept.revenueImpact, currency)}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${brandColor}, ${brandColor}88)` }} />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>{formatNumber(dept.hoursSaved)} hrs saved</span>
                    <span>{formatCurrency(dept.costSaved, currency)} cost saved</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center">No departments selected</p>
        )}
      </div>
    </SlideWrapper>,

    // Slide 6: CTA
    <SlideWrapper key="business-case">
      <div className="max-w-3xl w-full text-center">
        <p className="text-sm uppercase tracking-widest mb-3" style={{ color: brandColor }}>Next Steps</p>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">Ready to Transform Your Contracts?</h2>
        {businessCase && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left">
            <h3 className="text-white font-semibold mb-3">Executive Summary</h3>
            <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{businessCase}</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { step: '1', title: 'Schedule Demo', desc: 'See Oneflow in action with your team' },
            { step: '2', title: 'Pilot Program', desc: 'Start with one department to prove value' },
            { step: '3', title: 'Full Rollout', desc: 'Expand across the organization' },
          ].map((item) => (
            <div key={item.step} className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="text-3xl mb-3" style={{ color: brandColor }}>{item.step}</div>
              <h4 className="text-white font-semibold mb-1">{item.title}</h4>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 px-8 py-3 text-white rounded-xl font-semibold transition-colors hover:opacity-90"
          style={{ backgroundColor: brandColor }}
        >
          <Download className="w-5 h-5" />
          Download Full Report (PDF)
        </button>
      </div>
    </SlideWrapper>,
  ];

  return (
    <div className="h-screen bg-gray-950 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 bg-gray-950 border-b border-white/5 z-50">
        <div className="flex items-center gap-3">
          {branding.logoBase64 ? (
            <img src={branding.logoBase64} alt="Logo" className="h-6 object-contain" />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                <span className="text-white font-bold text-xs">O</span>
              </div>
              <span className="text-white/60 text-sm font-medium hidden sm:block">Oneflow ROI</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-600 text-xs">{currentSlide + 1} / {totalSlides}</span>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-white/5 px-3 py-1.5 rounded-full">
            <Lock className="w-3 h-3" /><span>Shared</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div key={currentSlide} className="h-full">{slides[currentSlide]}</div>
      </div>

      <div className="flex items-center justify-center gap-4 px-6 py-4 bg-gray-950 border-t border-white/5">
        <button onClick={prev} disabled={currentSlide === 0} aria-label="Previous slide" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrentSlide(i)} aria-label={`Go to slide ${i + 1}`}
              className="h-2.5 rounded-full transition-all"
              style={{ width: i === currentSlide ? '2rem' : '0.625rem', backgroundColor: i === currentSlide ? brandColor : 'rgba(255,255,255,0.2)' }}
            />
          ))}
        </div>
        <button onClick={next} disabled={currentSlide === totalSlides - 1} aria-label="Next slide" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <EmailGate isOpen={showEmailGate} onClose={() => setShowEmailGate(false)} onSuccess={() => { setShowEmailGate(false); generatePDF(); }} />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}
