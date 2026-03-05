import { useState, useCallback, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Check,
  Maximize2,
  Minimize2,
  Eye,
  Pencil,
  Plus,
  Trash2,
  GripVertical,
  Type,
  X,
} from 'lucide-react';
import { useCalculatorStore } from '@/store/calculatorStore';
import { formatCurrency, formatMonths, formatNumber, formatROI } from '@/utils/formatters';
import { Charts } from '@/components/results/Charts';
import { MultiYearProjection } from '@/components/results/MultiYearProjection';
import { EmailGate } from '@/components/export/EmailGate';
import { generatePDF } from '@/components/export/PDFExport';
import { copyShareableLink } from '@/utils/shareableLink';

type SlideType = 'hero' | 'cost-of-inaction' | 'financial' | 'projection' | 'charts' | 'departments' | 'cta';

interface SlideConfig {
  id: string;
  type: SlideType;
  visible: boolean;
  title?: string; // optional custom title override
  subtitle?: string; // optional custom subtitle override
}

const DEFAULT_SLIDES: SlideConfig[] = [
  { id: 'hero', type: 'hero', visible: true },
  { id: 'cost-of-inaction', type: 'cost-of-inaction', visible: true },
  { id: 'financial', type: 'financial', visible: true },
  { id: 'projection', type: 'projection', visible: true },
  { id: 'charts', type: 'charts', visible: true },
  { id: 'departments', type: 'departments', visible: true },
  { id: 'cta', type: 'cta', visible: true },
];

const SLIDE_LABELS: Record<SlideType, string> = {
  hero: 'Title Slide',
  'cost-of-inaction': 'Cost of Inaction',
  financial: 'Financial Impact',
  projection: '3-Year Projection',
  charts: 'Charts & Analysis',
  departments: 'Department Breakdown',
  cta: 'Next Steps & CTA',
};

export function SlidePreview() {
  const {
    results,
    companyProfile,
    branding,
    scenarioType,
    emailSubmitted,
    businessCase,
  } = useCalculatorStore();
  const [slides, setSlides] = useState<SlideConfig[]>(DEFAULT_SLIDES);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [editingField, setEditingField] = useState<{ slideId: string; field: 'title' | 'subtitle' } | null>(null);

  const currency = companyProfile.currency;
  const companyName = branding.companyName || 'Your Company';
  const brandColor = branding.primaryColor || '#5033FF';

  const visibleSlides = slides.filter((s) => s.visible);
  const totalSlides = visibleSlides.length;

  const next = useCallback(
    () => setCurrentSlide((s) => Math.min(s + 1, totalSlides - 1)),
    [totalSlides]
  );
  const prev = useCallback(() => setCurrentSlide((s) => Math.max(s - 1, 0)), []);

  // Keyboard navigation
  useEffect(() => {
    if (editingField) return; // don't navigate while editing text
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, isFullscreen, editingField]);

  // Clamp current slide if slides removed
  useEffect(() => {
    if (currentSlide >= totalSlides) setCurrentSlide(Math.max(0, totalSlides - 1));
  }, [totalSlides, currentSlide]);

  const handleDownload = () => {
    if (emailSubmitted) {
      generatePDF();
    } else {
      setShowEmailGate(true);
    }
  };

  const handleShare = async () => {
    const success = await copyShareableLink();
    if (success) {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const toggleSlideVisibility = (id: string) => {
    setSlides((prev) => prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)));
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    const newSlides = [...slides];
    const target = index + direction;
    if (target < 0 || target >= newSlides.length) return;
    [newSlides[index], newSlides[target]] = [newSlides[target], newSlides[index]];
    setSlides(newSlides);
  };

  const updateSlideText = (slideId: string, field: 'title' | 'subtitle', value: string) => {
    setSlides((prev) => prev.map((s) => (s.id === slideId ? { ...s, [field]: value || undefined } : s)));
  };

  // Cost of inaction calcs
  const dailyLoss = results.financial.totalAnnualImpact / 365;
  const weeklyLoss = dailyLoss * 7;
  const monthlyLoss = results.financial.totalAnnualImpact / 12;

  const renderSlideContent = (slide: SlideConfig) => {
    // Inline-editable text helper
    const EditableText = ({
      slideId,
      field,
      defaultText,
      className,
    }: {
      slideId: string;
      field: 'title' | 'subtitle';
      defaultText: string;
      className: string;
    }) => {
      const isEditingThis = editingField?.slideId === slideId && editingField?.field === field;
      const currentValue = slide[field] || defaultText;

      if (isEditing && isEditingThis) {
        return (
          <input
            autoFocus
            className={`${className} bg-transparent border-b-2 border-dashed border-white/40 outline-none w-full text-center`}
            value={currentValue}
            onChange={(e) => updateSlideText(slideId, field, e.target.value)}
            onBlur={() => setEditingField(null)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
          />
        );
      }

      return (
        <div
          className={`${className} ${isEditing ? 'cursor-text hover:bg-white/5 rounded px-2 transition-colors' : ''}`}
          onClick={() => isEditing && setEditingField({ slideId, field })}
        >
          {currentValue}
          {isEditing && <Pencil className="w-3 h-3 inline ml-2 opacity-40" />}
        </div>
      );
    };

    switch (slide.type) {
      case 'hero':
        return (
          <div className="text-center max-w-3xl mx-auto">
            {branding.logoBase64 && (
              <img src={branding.logoBase64} alt="Logo" className="h-12 mx-auto mb-8 object-contain" />
            )}
            <p className="text-sm uppercase tracking-widest mb-4" style={{ color: brandColor }}>
              ROI Analysis Report
            </p>
            <EditableText
              slideId={slide.id}
              field="title"
              defaultText={companyName}
              className="text-4xl md:text-6xl font-bold text-white mb-4"
            />
            <EditableText
              slideId={slide.id}
              field="subtitle"
              defaultText={`${scenarioType.charAt(0).toUpperCase() + scenarioType.slice(1)} Scenario`}
              className="text-gray-400 text-lg mb-12"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Net Annual Benefit" value={formatCurrency(results.financial.netBenefit, currency)} color={brandColor} />
              <MetricCard label="ROI" value={formatROI(results.financial.roiPct)} color={brandColor} />
              <MetricCard label="Payback Period" value={formatMonths(results.financial.paybackMonths)} color={brandColor} />
              <MetricCard label="Hours Saved / Year" value={formatNumber(results.efficiency.annualHoursSaved)} color={brandColor} />
            </div>
          </div>
        );

      case 'cost-of-inaction':
        return (
          <div className="max-w-3xl w-full text-center mx-auto">
            <p className="text-red-400 text-sm uppercase tracking-widest mb-3">The Cost of Waiting</p>
            <EditableText
              slideId={slide.id}
              field="title"
              defaultText="Every Day Without Oneflow Costs You"
              className="text-3xl md:text-5xl font-bold text-white mb-3"
            />
            <EditableText
              slideId={slide.id}
              field="subtitle"
              defaultText="Money left on the table while using manual contract processes"
              className="text-gray-400 mb-10"
            />
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
              <p className="text-4xl font-bold text-white">
                {formatCurrency(results.financial.totalAnnualImpact * 3, currency)}
              </p>
            </div>
          </div>
        );

      case 'financial':
        return (
          <div className="max-w-4xl w-full mx-auto">
            <p className="text-sm uppercase tracking-widest mb-3 text-center" style={{ color: brandColor }}>
              Financial Impact
            </p>
            <EditableText
              slideId={slide.id}
              field="title"
              defaultText="Where the Value Comes From"
              className="text-3xl md:text-5xl font-bold text-white mb-10 text-center"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-blue-400 font-semibold mb-4">Efficiency Gains</h3>
                <div className="space-y-3">
                  <MetricRow label="Hours Saved" value={`${formatNumber(results.efficiency.annualHoursSaved)} hrs`} />
                  <MetricRow label="FTE Equivalent" value={formatNumber(results.efficiency.fteSaved, 1)} />
                  <MetricRow label="Cost Savings" value={formatCurrency(results.efficiency.costSavings, currency)} highlight />
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-green-400 font-semibold mb-4">Revenue Impact</h3>
                <div className="space-y-3">
                  <MetricRow label="Recovered" value={formatCurrency(results.revenue.revenueRecovered, currency)} />
                  <MetricRow label="Accelerated" value={formatCurrency(results.revenue.revenueAccelerated, currency)} />
                  <MetricRow label="Renewal Protected" value={formatCurrency(results.revenue.renewalProtected, currency)} />
                  <MetricRow label="Total" value={formatCurrency(results.revenue.totalRevenueImpact, currency)} highlight />
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-orange-400 font-semibold mb-4">Risk Reduction</h3>
                <div className="space-y-3">
                  <MetricRow label="Avoided Risk Cost" value={formatCurrency(results.risk.avoidedRiskCost, currency)} />
                  <MetricRow label="Total" value={formatCurrency(results.risk.avoidedRiskCost, currency)} highlight />
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
        );

      case 'projection':
        return (
          <div className="max-w-4xl w-full mx-auto">
            <p className="text-sm uppercase tracking-widest mb-3 text-center" style={{ color: brandColor }}>
              Long-Term Value
            </p>
            <EditableText
              slideId={slide.id}
              field="title"
              defaultText="3-Year Projection"
              className="text-3xl md:text-5xl font-bold text-white mb-8 text-center"
            />
            <div className="bg-white rounded-2xl p-6 shadow-2xl">
              <MultiYearProjection />
            </div>
          </div>
        );

      case 'charts':
        return (
          <div className="max-w-4xl w-full mx-auto">
            <p className="text-sm uppercase tracking-widest mb-3 text-center" style={{ color: brandColor }}>
              Visual Breakdown
            </p>
            <EditableText
              slideId={slide.id}
              field="title"
              defaultText="Impact Analysis"
              className="text-3xl md:text-5xl font-bold text-white mb-8 text-center"
            />
            <div className="bg-white rounded-2xl p-6 shadow-2xl" id="results-charts">
              <Charts />
            </div>
          </div>
        );

      case 'departments':
        return (
          <div className="max-w-3xl w-full mx-auto">
            <p className="text-sm uppercase tracking-widest mb-3 text-center" style={{ color: brandColor }}>
              By Department
            </p>
            <EditableText
              slideId={slide.id}
              field="title"
              defaultText="Impact Across Teams"
              className="text-3xl md:text-5xl font-bold text-white mb-8 text-center"
            />
            {results.byDepartment.length > 0 ? (
              <div className="space-y-4">
                {results.byDepartment.map((dept) => {
                  const maxVal = Math.max(...results.byDepartment.map((d) => d.costSaved + d.revenueImpact));
                  const pct = maxVal > 0 ? ((dept.costSaved + dept.revenueImpact) / maxVal) * 100 : 0;
                  return (
                    <div key={dept.name} className="bg-white/5 border border-white/10 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-semibold">{dept.name}</span>
                        <span className="font-bold" style={{ color: brandColor }}>
                          {formatCurrency(dept.costSaved + dept.revenueImpact, currency)}
                        </span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${brandColor}, ${brandColor}88)` }}
                        />
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
        );

      case 'cta':
        return (
          <div className="max-w-3xl w-full text-center mx-auto">
            <p className="text-sm uppercase tracking-widest mb-3" style={{ color: brandColor }}>
              Next Steps
            </p>
            <EditableText
              slideId={slide.id}
              field="title"
              defaultText="Ready to Transform Your Contracts?"
              className="text-3xl md:text-5xl font-bold text-white mb-8"
            />
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
        );
    }
  };

  // Slide panel (left sidebar in edit mode)
  const renderSlideThumbnails = () => (
    <div className="w-56 bg-gray-900 border-r border-white/10 overflow-y-auto shrink-0">
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <span className="text-white/60 text-xs font-medium uppercase tracking-wider">Slides</span>
        <span className="text-white/40 text-xs">{visibleSlides.length} active</span>
      </div>
      <div className="p-2 space-y-1">
        {slides.map((slide, index) => {
          const visibleIndex = visibleSlides.findIndex((s) => s.id === slide.id);
          const isActive = visibleIndex === currentSlide;
          return (
            <div
              key={slide.id}
              className={`group rounded-lg p-2 cursor-pointer transition-all ${
                isActive
                  ? 'ring-2 bg-white/10'
                  : slide.visible
                    ? 'hover:bg-white/5'
                    : 'opacity-40 hover:opacity-60'
              }`}
              style={isActive ? { '--tw-ring-color': brandColor } as React.CSSProperties : undefined}
              onClick={() => {
                if (slide.visible) {
                  setCurrentSlide(visibleIndex);
                }
              }}
            >
              <div className="flex items-center gap-2">
                <GripVertical className="w-3 h-3 text-white/20 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white/40 text-[10px] font-mono">{index + 1}</span>
                    <span className="text-white text-xs font-medium truncate">
                      {slide.title || SLIDE_LABELS[slide.type]}
                    </span>
                  </div>
                  {/* Mini preview bar */}
                  <div
                    className="w-full h-1 rounded-full mt-1.5"
                    style={{ backgroundColor: slide.visible ? brandColor + '44' : '#333' }}
                  >
                    {slide.visible && (
                      <div className="h-full rounded-full" style={{ width: '60%', backgroundColor: brandColor }} />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {index > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); moveSlide(index, -1); }}
                      className="p-0.5 text-white/30 hover:text-white/70"
                      aria-label="Move slide up"
                    >
                      <ChevronLeft className="w-3 h-3 rotate-90" />
                    </button>
                  )}
                  {index < slides.length - 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); moveSlide(index, 1); }}
                      className="p-0.5 text-white/30 hover:text-white/70"
                      aria-label="Move slide down"
                    >
                      <ChevronRight className="w-3 h-3 rotate-90" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSlideVisibility(slide.id); }}
                    className={`p-0.5 ${slide.visible ? 'text-white/30 hover:text-red-400' : 'text-green-400/60 hover:text-green-400'}`}
                    aria-label={slide.visible ? 'Hide slide' : 'Show slide'}
                  >
                    {slide.visible ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-gray-950 flex flex-col'
    : 'bg-gray-950 rounded-2xl border border-white/10 overflow-hidden flex flex-col';

  const containerStyle = isFullscreen ? {} : { height: '680px' };

  return (
    <>
      <div className={containerClass} style={containerStyle}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900/80 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            {branding.logoBase64 ? (
              <img src={branding.logoBase64} alt="Logo" className="h-5 object-contain" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                  <span className="text-white font-bold text-[10px]">O</span>
                </div>
                <span className="text-white/60 text-xs font-medium hidden sm:block">Presentation</span>
              </div>
            )}
            <div className="h-4 w-px bg-white/10" />
            <span className="text-white/40 text-xs">
              {currentSlide + 1} / {totalSlides}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Edit / Preview toggle */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                isEditing
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {isEditing ? <Pencil className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {isEditing ? 'Editing' : 'Preview'}
            </button>

            <div className="h-4 w-px bg-white/10 mx-1" />

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-white/50 hover:text-white/80 hover:bg-white/5 rounded-md transition-colors"
            >
              {shareCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
              {shareCopied ? 'Copied!' : 'Share'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-white rounded-md transition-colors hover:opacity-90"
              style={{ backgroundColor: brandColor }}
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>

            <div className="h-4 w-px bg-white/10 mx-1" />

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-white/40 hover:text-white/80 hover:bg-white/5 rounded-md transition-colors"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Main area */}
        <div className="flex flex-1 min-h-0">
          {/* Slide panel (edit mode only) */}
          {isEditing && renderSlideThumbnails()}

          {/* Slide content */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="flex-1 flex items-center justify-center px-8 md:px-16 py-8">
              {visibleSlides[currentSlide] && renderSlideContent(visibleSlides[currentSlide])}
            </div>

            {/* Keyboard hint (first slide only, non-edit) */}
            {currentSlide === 0 && !isEditing && (
              <div className="text-center pb-2">
                <span className="text-white/20 text-xs">
                  Use arrow keys or click to navigate
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="flex items-center justify-center gap-4 px-6 py-3 bg-gray-900/50 border-t border-white/10 shrink-0">
          <button
            onClick={prev}
            disabled={currentSlide === 0}
            aria-label="Previous slide"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            {visibleSlides.map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="h-2.5 rounded-full transition-all"
                style={{
                  width: i === currentSlide ? '2rem' : '0.625rem',
                  backgroundColor: i === currentSlide ? brandColor : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>

          <button
            onClick={next}
            disabled={currentSlide === totalSlides - 1}
            aria-label="Next slide"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
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
    </>
  );
}

// Helper components
function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
      <p className="text-gray-400 text-sm mb-2">{label}</p>
      <p className="text-3xl md:text-4xl font-bold text-white">{value}</p>
    </div>
  );
}

function MetricRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between ${highlight ? 'border-t border-white/10 pt-3' : ''}`}>
      <span className="text-gray-400 text-sm">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-white' : 'text-white'}`}>{value}</span>
    </div>
  );
}
