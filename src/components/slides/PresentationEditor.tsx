import { useState, useCallback, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Download,
  Share2,
  Check,
  Maximize2,
  Minimize2,
  Eye,
  Pencil,
  Plus,
  Copy,
  Trash2,
  GripVertical,
  X,
  EyeOff,
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
  title?: string;
  subtitle?: string;
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

const SLIDE_COLORS: Record<SlideType, string> = {
  hero: '#5033FF',
  'cost-of-inaction': '#EF4444',
  financial: '#3B82F6',
  projection: '#10B981',
  charts: '#F59E0B',
  departments: '#8B5CF6',
  cta: '#EC4899',
};

export function PresentationEditor() {
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
  const [isEditing, setIsEditing] = useState(true);
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [editingField, setEditingField] = useState<{ slideId: string; field: 'title' | 'subtitle' } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  useEffect(() => {
    if (editingField) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      else if (e.key === 'Escape' && isFullscreen) { setIsFullscreen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, isFullscreen, editingField]);

  useEffect(() => {
    if (currentSlide >= totalSlides) setCurrentSlide(Math.max(0, totalSlides - 1));
  }, [totalSlides, currentSlide]);

  const handleDownload = () => {
    if (emailSubmitted) generatePDF();
    else setShowEmailGate(true);
  };

  const handleShare = async () => {
    const success = await copyShareableLink();
    if (success) { setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }
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

  const duplicateSlide = (index: number) => {
    const newSlides = [...slides];
    const original = newSlides[index];
    const clone: SlideConfig = { ...original, id: `${original.id}-copy-${Date.now()}`, title: original.title, subtitle: original.subtitle };
    newSlides.splice(index + 1, 0, clone);
    setSlides(newSlides);
  };

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
  };

  const updateSlideText = (slideId: string, field: 'title' | 'subtitle', value: string) => {
    setSlides((prev) => prev.map((s) => (s.id === slideId ? { ...s, [field]: value || undefined } : s)));
  };

  // Drag and drop
  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); setDragOverIndex(index); };
  const handleDragEnd = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const newSlides = [...slides];
      const [removed] = newSlides.splice(dragIndex, 1);
      newSlides.splice(dragOverIndex, 0, removed);
      setSlides(newSlides);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const dailyLoss = results.financial.totalAnnualImpact / 365;
  const weeklyLoss = dailyLoss * 7;
  const monthlyLoss = results.financial.totalAnnualImpact / 12;

  // Editable text component
  const EditableText = ({
    slideId,
    field,
    defaultText,
    className,
    slide,
  }: {
    slideId: string;
    field: 'title' | 'subtitle';
    defaultText: string;
    className: string;
    slide: SlideConfig;
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
        className={`${className} ${isEditing ? 'cursor-text hover:bg-white/5 rounded px-2 transition-colors group/edit' : ''}`}
        onClick={() => isEditing && setEditingField({ slideId, field })}
      >
        {currentValue}
        {isEditing && <Pencil className="w-3 h-3 inline ml-2 opacity-0 group-hover/edit:opacity-40 transition-opacity" />}
      </div>
    );
  };

  const renderSlideContent = (slide: SlideConfig) => {
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
            <EditableText slideId={slide.id} field="title" defaultText={companyName}
              className="text-4xl md:text-6xl font-bold text-white mb-4" slide={slide} />
            <EditableText slideId={slide.id} field="subtitle"
              defaultText={`${scenarioType.charAt(0).toUpperCase() + scenarioType.slice(1)} Scenario`}
              className="text-gray-400 text-lg mb-12" slide={slide} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard label="Net Annual Benefit" value={formatCurrency(results.financial.netBenefit, currency)} />
              <MetricCard label="ROI" value={formatROI(results.financial.roiPct)} />
              <MetricCard label="Payback Period" value={formatMonths(results.financial.paybackMonths)} />
              <MetricCard label="Hours Saved / Year" value={formatNumber(results.efficiency.annualHoursSaved)} />
            </div>
          </div>
        );

      case 'cost-of-inaction':
        return (
          <div className="max-w-3xl w-full text-center mx-auto">
            <p className="text-red-400 text-sm uppercase tracking-widest mb-3">The Cost of Waiting</p>
            <EditableText slideId={slide.id} field="title" defaultText="Every Day Without Oneflow Costs You"
              className="text-3xl md:text-5xl font-bold text-white mb-3" slide={slide} />
            <EditableText slideId={slide.id} field="subtitle"
              defaultText="Money left on the table while using manual contract processes"
              className="text-gray-400 mb-10" slide={slide} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {[
                { label: 'Per Day', value: dailyLoss },
                { label: 'Per Week', value: weeklyLoss },
                { label: 'Per Month', value: monthlyLoss },
              ].map((item) => (
                <div key={item.label} className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                  <p className="text-red-400 text-sm mb-2">{item.label}</p>
                  <p className="text-2xl font-bold text-red-400 truncate">{formatCurrency(item.value, currency)}</p>
                </div>
              ))}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-gray-400 text-sm mb-2">3-Year Cumulative Impact</p>
              <p className="text-3xl font-bold text-white truncate">
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
            <EditableText slideId={slide.id} field="title" defaultText="Where the Value Comes From"
              className="text-3xl md:text-5xl font-bold text-white mb-10 text-center" slide={slide} />
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
                  <div key={item.label} className="min-w-0">
                    <p className="text-gray-400 text-xs mb-1 truncate">{item.label}</p>
                    <p className="text-base md:text-lg font-bold text-white truncate">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'projection':
        return (
          <div className="max-w-4xl w-full mx-auto">
            <p className="text-sm uppercase tracking-widest mb-3 text-center" style={{ color: brandColor }}>Long-Term Value</p>
            <EditableText slideId={slide.id} field="title" defaultText="3-Year Projection"
              className="text-3xl md:text-5xl font-bold text-white mb-8 text-center" slide={slide} />
            <div className="bg-white rounded-2xl p-6 shadow-2xl">
              <MultiYearProjection />
            </div>
          </div>
        );

      case 'charts':
        return (
          <div className="max-w-4xl w-full mx-auto">
            <p className="text-sm uppercase tracking-widest mb-3 text-center" style={{ color: brandColor }}>Visual Breakdown</p>
            <EditableText slideId={slide.id} field="title" defaultText="Impact Analysis"
              className="text-3xl md:text-5xl font-bold text-white mb-8 text-center" slide={slide} />
            <div className="bg-white rounded-2xl p-6 shadow-2xl" id="results-charts">
              <Charts />
            </div>
          </div>
        );

      case 'departments':
        return (
          <div className="max-w-3xl w-full mx-auto">
            <p className="text-sm uppercase tracking-widest mb-3 text-center" style={{ color: brandColor }}>By Department</p>
            <EditableText slideId={slide.id} field="title" defaultText="Impact Across Teams"
              className="text-3xl md:text-5xl font-bold text-white mb-8 text-center" slide={slide} />
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
                        <div className="h-2 rounded-full transition-all"
                          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${brandColor}, ${brandColor}88)` }} />
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
            <p className="text-sm uppercase tracking-widest mb-3" style={{ color: brandColor }}>Next Steps</p>
            <EditableText slideId={slide.id} field="title" defaultText="Ready to Transform Your Contracts?"
              className="text-3xl md:text-5xl font-bold text-white mb-8" slide={slide} />
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

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-gray-950 flex flex-col'
    : 'bg-gray-950 flex flex-col';
  const containerStyle = isFullscreen ? {} : { height: 'calc(100vh - 120px)' };

  return (
    <>
      <div className={containerClass} style={containerStyle}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            {branding.logoBase64 ? (
              <img src={branding.logoBase64} alt="Logo" className="h-5 object-contain" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                  <span className="text-white font-bold text-[10px]">O</span>
                </div>
              </div>
            )}
            <div className="h-4 w-px bg-white/10" />
            <span className="text-white/60 text-sm font-medium">Presentation Editor</span>
            <div className="h-4 w-px bg-white/10" />
            <span className="text-white/40 text-xs">
              {currentSlide + 1} / {totalSlides}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isEditing
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {isEditing ? <Pencil className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {isEditing ? 'Editing' : 'Preview'}
            </button>

            <div className="h-4 w-px bg-white/10 mx-1" />

            <button onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/50 hover:text-white/80 hover:bg-white/5 rounded-md transition-colors"
            >
              {shareCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
              {shareCopied ? 'Copied!' : 'Share'}
            </button>
            <button onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white rounded-md transition-colors hover:opacity-90"
              style={{ backgroundColor: brandColor }}
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>

            <div className="h-4 w-px bg-white/10 mx-1" />

            <button onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-white/40 hover:text-white/80 hover:bg-white/5 rounded-md transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 min-h-0">
          {/* Left sidebar - slide thumbnails (always visible) */}
          <div className="w-64 bg-gray-900/80 border-r border-white/10 flex flex-col shrink-0">
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-white/60 text-xs font-medium uppercase tracking-wider">Slides</span>
              <span className="text-white/40 text-xs">{visibleSlides.length} active</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {slides.map((slide, index) => {
                const visibleIndex = visibleSlides.findIndex((s) => s.id === slide.id);
                const isActive = slide.visible && visibleIndex === currentSlide;
                const isDragTarget = dragOverIndex === index && dragIndex !== index;

                return (
                  <div
                    key={slide.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`group rounded-lg transition-all cursor-pointer ${
                      isDragTarget ? 'border-t-2 border-blue-400' : ''
                    } ${
                      isActive
                        ? 'ring-2 bg-white/10'
                        : slide.visible
                          ? 'hover:bg-white/5'
                          : 'opacity-40 hover:opacity-60'
                    }`}
                    style={isActive ? { '--tw-ring-color': brandColor } as React.CSSProperties : undefined}
                    onClick={() => slide.visible && setCurrentSlide(visibleIndex)}
                  >
                    {/* Slide thumbnail */}
                    <div className="p-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <GripVertical className="w-3 h-3 text-white/20 shrink-0 cursor-grab active:cursor-grabbing" />
                        <span className="text-white/30 text-[10px] font-mono w-4">{index + 1}</span>
                        <span className="text-white text-xs font-medium truncate flex-1">
                          {slide.title || SLIDE_LABELS[slide.type]}
                        </span>
                      </div>

                      {/* Mini preview */}
                      <div
                        className={`w-full aspect-[16/9] rounded-md border overflow-hidden flex items-center justify-center relative ${
                          slide.visible ? 'border-white/10 bg-gray-800' : 'border-white/5 bg-gray-900'
                        }`}
                      >
                        <div
                          className="absolute inset-x-0 top-0 h-1"
                          style={{ backgroundColor: slide.visible ? SLIDE_COLORS[slide.type] : '#333' }}
                        />
                        {!slide.visible && (
                          <EyeOff className="w-4 h-4 text-white/20" />
                        )}
                        {slide.visible && (
                          <span className="text-white/30 text-[9px] uppercase tracking-wider">
                            {SLIDE_LABELS[slide.type]}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      {isEditing && (
                        <div className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); moveSlide(index, -1); }}
                            disabled={index === 0}
                            className="p-1 text-white/30 hover:text-white/70 disabled:opacity-20"
                            title="Move up">
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); moveSlide(index, 1); }}
                            disabled={index === slides.length - 1}
                            className="p-1 text-white/30 hover:text-white/70 disabled:opacity-20"
                            title="Move down">
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); duplicateSlide(index); }}
                            className="p-1 text-white/30 hover:text-blue-400"
                            title="Duplicate">
                            <Copy className="w-3 h-3" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); toggleSlideVisibility(slide.id); }}
                            className={`p-1 ${slide.visible ? 'text-white/30 hover:text-yellow-400' : 'text-green-400/60 hover:text-green-400'}`}
                            title={slide.visible ? 'Hide slide' : 'Show slide'}>
                            {slide.visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); deleteSlide(index); }}
                            disabled={slides.length <= 1}
                            className="p-1 text-white/30 hover:text-red-400 disabled:opacity-20 ml-auto"
                            title="Delete">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main canvas */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Slide content */}
            <div className="flex-1 overflow-y-auto">
              <div className="min-h-full flex items-center justify-center px-8 md:px-16 py-8">
                {visibleSlides[currentSlide] && renderSlideContent(visibleSlides[currentSlide])}
              </div>
            </div>

            {/* Bottom navigation */}
            <div className="flex items-center justify-center gap-4 px-6 py-3 bg-gray-900/50 border-t border-white/10 shrink-0">
              <button onClick={prev} disabled={currentSlide === 0}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                {visibleSlides.map((slide, i) => (
                  <button key={slide.id} onClick={() => setCurrentSlide(i)}
                    className="h-2.5 rounded-full transition-all"
                    style={{
                      width: i === currentSlide ? '2rem' : '0.625rem',
                      backgroundColor: i === currentSlide ? brandColor : 'rgba(255,255,255,0.2)',
                    }}
                  />
                ))}
              </div>
              <button onClick={next} disabled={currentSlide === totalSlides - 1}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <EmailGate
        isOpen={showEmailGate}
        onClose={() => setShowEmailGate(false)}
        onSuccess={() => { setShowEmailGate(false); generatePDF(); }}
      />
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center min-w-0">
      <p className="text-gray-400 text-xs mb-1.5 truncate">{label}</p>
      <p className="text-xl md:text-2xl font-bold text-white truncate">{value}</p>
    </div>
  );
}

function MetricRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between ${highlight ? 'border-t border-white/10 pt-3' : ''}`}>
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-semibold text-white truncate ml-2">{value}</span>
    </div>
  );
}
