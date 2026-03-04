import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useCalculatorStore } from '@/store/calculatorStore';
import { SCENARIO_MULTIPLIERS } from '@/config/assumptions';
import type { ScenarioType } from '@/types';

const scenarios: { key: ScenarioType; label: string }[] = [
  { key: 'conservative', label: 'Conservative' },
  { key: 'expected', label: 'Expected' },
  { key: 'optimistic', label: 'Optimistic' },
];

const multiplierLabels: Record<string, string> = {
  timeReduction: 'Time Reduction',
  revenueLeakageReduction: 'Revenue Leakage Reduction',
  renewalCaptureImprovement: 'Renewal Capture Improvement',
  riskReductionImpact: 'Risk Reduction Impact',
};

export function ScenarioToggle() {
  const { scenarioType, setScenarioType } = useCalculatorStore();
  const [showAssumptions, setShowAssumptions] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex bg-gray-100 rounded-lg p-1">
        {scenarios.map((s) => (
          <button
            key={s.key}
            onClick={() => setScenarioType(s.key)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              scenarioType === s.key
                ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowAssumptions(!showAssumptions)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors mx-auto"
      >
        Assumptions
        {showAssumptions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {showAssumptions && (
        <div className="bg-gray-50 rounded-lg p-3 text-xs">
          <table className="w-full">
            <tbody>
              {Object.entries(SCENARIO_MULTIPLIERS[scenarioType]).map(([key, val]) => (
                <tr key={key} className="border-b border-gray-100 last:border-0">
                  <td className="py-1 text-gray-600">{multiplierLabels[key] || key}</td>
                  <td className="py-1 text-right font-medium text-gray-900">{(val * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
