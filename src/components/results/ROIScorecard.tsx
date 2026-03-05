import { useEffect, useState } from 'react';
import { useCalculatorStore } from '@/store/calculatorStore';
import { formatCurrency, formatMonths, formatROI } from '@/utils/formatters';

function AnimatedGauge({
  value,
  max,
  label,
  displayValue,
  color,
  thresholds,
}: {
  value: number;
  max: number;
  label: string;
  displayValue: string;
  color: string;
  thresholds: { low: number; mid: number };
}) {
  const [animatedPct, setAnimatedPct] = useState(0);
  const pct = Math.min((value / max) * 100, 100);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPct(pct), 100);
    return () => clearTimeout(timer);
  }, [pct]);

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedPct / 100) * circumference * 0.75; // 270 degree arc

  const getColor = () => {
    if (value < thresholds.low) return '#EF4444';
    if (value < thresholds.mid) return '#F59E0B';
    return '#10B981';
  };

  const gaugeColor = color || getColor();

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-[135deg]">
          {/* Background arc */}
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeLinecap="round" className="opacity-20" />
          {/* Value arc */}
          <circle cx="60" cy="60" r={radius} fill="none" stroke={gaugeColor} strokeWidth="10"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{displayValue}</span>
        </div>
      </div>
      <span className="text-sm font-medium text-gray-600 mt-1">{label}</span>
    </div>
  );
}

function ScoreBar({ label, score, maxScore = 10 }: { label: string; score: number; maxScore?: number }) {
  const [animated, setAnimated] = useState(0);
  const pct = Math.min((score / maxScore) * 100, 100);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(pct), 100);
    return () => clearTimeout(timer);
  }, [pct]);

  const getColor = () => {
    if (score < 3) return 'bg-red-500';
    if (score < 6) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getGrade = () => {
    if (score >= 9) return 'A+';
    if (score >= 8) return 'A';
    if (score >= 7) return 'B+';
    if (score >= 6) return 'B';
    if (score >= 5) return 'C';
    if (score >= 3) return 'D';
    return 'F';
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-32 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${getColor()}`}
          style={{ width: `${animated}%` }}
        />
      </div>
      <span className="text-sm font-bold text-gray-900 w-8 text-right">{getGrade()}</span>
    </div>
  );
}

export function ROIScorecard() {
  const { results, companyProfile } = useCalculatorStore();
  const currency = companyProfile.currency;

  const roiPct = results.financial.roiPct;
  const paybackMonths = results.financial.paybackMonths;
  const hoursSaved = results.efficiency.annualHoursSaved;

  // Calculate sub-scores (0-10)
  const roiScore = Math.min(10, roiPct / 100);
  const paybackScore = paybackMonths <= 1 ? 10 : paybackMonths <= 3 ? 9 : paybackMonths <= 6 ? 7 : paybackMonths <= 12 ? 5 : paybackMonths <= 24 ? 3 : 1;
  const efficiencyScore = Math.min(10, hoursSaved / 500 * 10);
  const revenueScore = results.revenue.totalRevenueImpact > 0 ? Math.min(10, results.revenue.totalRevenueImpact / (results.financial.oneflowAnnualCost * 3) * 10) : 0;
  const riskScore = results.risk.avoidedRiskCost > 0 ? Math.min(10, results.risk.avoidedRiskCost / (results.financial.oneflowAnnualCost) * 10) : 0;

  const overallScore = (roiScore + paybackScore + efficiencyScore + revenueScore + riskScore) / 5;
  const overallGrade = overallScore >= 9 ? 'A+' : overallScore >= 8 ? 'A' : overallScore >= 7 ? 'B+' : overallScore >= 6 ? 'B' : overallScore >= 5 ? 'C' : 'D';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">ROI Scorecard</h3>
          <p className="text-sm text-gray-500">Investment health at a glance</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{
          backgroundColor: overallScore >= 7 ? '#ECFDF5' : overallScore >= 5 ? '#FFFBEB' : '#FEF2F2',
          color: overallScore >= 7 ? '#065F46' : overallScore >= 5 ? '#92400E' : '#991B1B',
        }}>
          <span className="text-3xl font-black">{overallGrade}</span>
          <span className="text-xs font-medium">Overall<br />Grade</span>
        </div>
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <AnimatedGauge
          value={roiPct}
          max={1500}
          label="ROI"
          displayValue={formatROI(roiPct)}
          color="#5033FF"
          thresholds={{ low: 100, mid: 300 }}
        />
        <AnimatedGauge
          value={Math.max(0, 36 - paybackMonths)}
          max={36}
          label="Payback Speed"
          displayValue={formatMonths(paybackMonths)}
          color="#10B981"
          thresholds={{ low: 12, mid: 24 }}
        />
        <AnimatedGauge
          value={hoursSaved}
          max={5000}
          label="Hours Saved"
          displayValue={hoursSaved > 999 ? `${(hoursSaved / 1000).toFixed(1)}k` : String(Math.round(hoursSaved))}
          color="#F59E0B"
          thresholds={{ low: 100, mid: 500 }}
        />
      </div>

      {/* Score breakdown */}
      <div className="space-y-3">
        <ScoreBar label="ROI Return" score={roiScore} />
        <ScoreBar label="Payback Speed" score={paybackScore} />
        <ScoreBar label="Efficiency" score={efficiencyScore} />
        <ScoreBar label="Revenue Impact" score={revenueScore} />
        <ScoreBar label="Risk Reduction" score={riskScore} />
      </div>

      {/* Bottom insight */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Key insight:</span>{' '}
          {roiScore >= 7
            ? `With ${formatROI(roiPct)} ROI and ${formatMonths(paybackMonths)} payback, this is a strong investment case.`
            : paybackScore >= 7
              ? `Quick payback of ${formatMonths(paybackMonths)} makes this a low-risk investment.`
              : `Net benefit of ${formatCurrency(results.financial.netBenefit, currency)} annually improves your contract operations.`}
        </p>
      </div>
    </div>
  );
}
