import { useCalculatorStore } from '@/store/calculatorStore';
import { DEPARTMENT_LIST, DEPARTMENT_DEFAULT_CYCLE_DAYS } from '@/config/assumptions';
import { ShieldAlert, RefreshCw, FileWarning, ClipboardCheck } from 'lucide-react';

function SliderField({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  icon: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className="text-sm font-bold text-[var(--brand-primary)]">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--brand-primary)]"
      />
    </div>
  );
}

export function RiskInputsStep() {
  const { riskInputs, setRiskInputs, departments, toggleDepartment, setDepartmentCycleDays } =
    useCalculatorStore();

  const handleLeakageChange = (field: string, value: number) => {
    setRiskInputs({
      leakageBreakdown: { ...riskInputs.leakageBreakdown, [field]: value },
    });
  };

  const totalLeakage =
    riskInputs.leakageBreakdown.pricingErrors +
    riskInputs.leakageBreakdown.billingErrors +
    riskInputs.leakageBreakdown.executionFailures +
    riskInputs.leakageBreakdown.preventableChurn;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Revenue & Risk Assessment</h2>
        <p className="text-gray-500">Estimate your risk exposure and department involvement.</p>
      </div>

      {/* Revenue Leakage */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">
          Revenue Leakage:{' '}
          <span className="text-[var(--brand-primary)]">{totalLeakage.toFixed(1)}%</span>
        </h3>
        <p className="text-sm text-gray-500">
          Breakdown of revenue lost due to contract-related issues.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'pricingErrors', label: 'Pricing errors' },
            { key: 'billingErrors', label: 'Billing errors' },
            { key: 'executionFailures', label: 'Execution failures' },
            { key: 'preventableChurn', label: 'Preventable churn' },
          ].map((item) => (
            <div key={item.key} className="space-y-1">
              <label className="text-sm text-gray-600">{item.label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={25}
                  step={0.1}
                  value={riskInputs.leakageBreakdown[item.key as keyof typeof riskInputs.leakageBreakdown]}
                  onChange={(e) => handleLeakageChange(item.key, Number(e.target.value) || 0)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Sliders */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h3 className="font-semibold text-gray-900">Risk Assessment</h3>
        <SliderField
          label="Data & Compliance Breach"
          value={riskInputs.breachRisk}
          onChange={(v) => setRiskInputs({ breachRisk: v })}
          icon={<ShieldAlert className="w-4 h-4 text-red-500" />}
        />
        <SliderField
          label="Missed Renewals"
          value={riskInputs.missedRenewalRisk}
          onChange={(v) => setRiskInputs({ missedRenewalRisk: v })}
          icon={<RefreshCw className="w-4 h-4 text-orange-500" />}
        />
        <SliderField
          label="Material Contract Disputes"
          value={riskInputs.disputeRisk}
          onChange={(v) => setRiskInputs({ disputeRisk: v })}
          icon={<FileWarning className="w-4 h-4 text-yellow-600" />}
        />
        <SliderField
          label="Audit Correction"
          value={riskInputs.auditRisk}
          onChange={(v) => setRiskInputs({ auditRisk: v })}
          icon={<ClipboardCheck className="w-4 h-4 text-blue-500" />}
        />
      </div>

      {/* Departments */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Departments Using Contracts</h3>
        <p className="text-sm text-gray-500">Select departments and set their average contract cycle time.</p>
        <div className="space-y-3">
          {DEPARTMENT_LIST.map((deptName) => {
            const dept = departments.find((d) => d.name === deptName);
            const isSelected = dept?.selected ?? false;
            const cycleDays = dept?.cycleDays ?? DEPARTMENT_DEFAULT_CYCLE_DAYS[deptName] ?? 20;

            return (
              <div key={deptName} className="flex items-center gap-4">
                <label className="flex items-center gap-3 min-w-[140px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleDepartment(deptName)}
                    className="w-4 h-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                  />
                  <span className={`text-sm ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                    {deptName}
                  </span>
                </label>
                {isSelected && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={cycleDays}
                      onChange={(e) => setDepartmentCycleDays(deptName, Number(e.target.value) || 1)}
                      className="w-20 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-sm text-gray-500">days avg. cycle</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
