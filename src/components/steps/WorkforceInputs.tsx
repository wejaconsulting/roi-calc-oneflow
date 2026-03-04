import { Info } from 'lucide-react';
import { useCalculatorStore } from '@/store/calculatorStore';
import { formatCurrency } from '@/utils/formatters';
import { useState } from 'react';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  tooltip: string;
  isCurrency?: boolean;
  min?: number;
  step?: number;
}

function NumberField({ label, value, onChange, tooltip, isCurrency, min = 0, step = 1 }: NumberFieldProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const currency = useCalculatorStore((s) => s.companyProfile.currency);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="relative">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <Info className="w-4 h-4" />
          </button>
          {showTooltip && (
            <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
              {tooltip}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45" />
            </div>
          )}
        </div>
      </div>
      <div className="relative">
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          min={min}
          step={step}
          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {isCurrency && value > 0 && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            {formatCurrency(value, currency)}
          </span>
        )}
      </div>
    </div>
  );
}

export function WorkforceInputsStep() {
  const { workforceInputs, setWorkforceInputs, companyProfile } = useCalculatorStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Contract Volume & Workforce</h2>
        <p className="text-gray-500">
          Enter your contract handling details. Values are pre-filled based on your company size.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NumberField
          label="Employees handling contracts"
          value={workforceInputs.employeesHandlingContracts}
          onChange={(v) => setWorkforceInputs({ employeesHandlingContracts: v })}
          tooltip="Number of employees who regularly create, review, or manage contracts."
        />
        <NumberField
          label="Avg. fully loaded employee cost"
          value={workforceInputs.avgEmployeeCost}
          onChange={(v) => setWorkforceInputs({ avgEmployeeCost: v })}
          tooltip="Annual fully loaded cost per employee (salary + benefits + overhead). Used to calculate cost of time saved."
          isCurrency
          step={10000}
        />
        <NumberField
          label="Contracts per employee per year"
          value={workforceInputs.contractsPerEmployee}
          onChange={(v) => setWorkforceInputs({ contractsPerEmployee: v })}
          tooltip="Average number of contracts each employee handles annually (creation through signing)."
        />
        <NumberField
          label="Avg. hours per contract"
          value={workforceInputs.hoursPerContract}
          onChange={(v) => setWorkforceInputs({ hoursPerContract: v })}
          tooltip="Average time spent on each contract from creation to fully executed (hours). Includes drafting, review, negotiation, and signing."
          step={0.5}
        />
        <NumberField
          label="Avg. contract value"
          value={workforceInputs.avgContractValue}
          onChange={(v) => setWorkforceInputs({ avgContractValue: v })}
          tooltip="Average monetary value of a single contract. Used to calculate revenue acceleration impact."
          isCurrency
          step={10000}
        />
        <NumberField
          label="Annual revenue under contract"
          value={workforceInputs.annualRevenueUnderContract}
          onChange={(v) => setWorkforceInputs({ annualRevenueUnderContract: v })}
          tooltip="Total annual revenue managed through contracts. Used to calculate revenue leakage recovery and risk reduction."
          isCurrency
          step={1000000}
        />
      </div>

      <div className="bg-purple-50 rounded-lg p-4 text-sm text-gray-600">
        <span className="font-medium text-[var(--brand-primary)]">Tip:</span> Values are pre-filled based on your{' '}
        <span className="font-medium">{companyProfile.size}</span> company profile. Adjust them to match your actual numbers for more accurate results.
      </div>
    </div>
  );
}
