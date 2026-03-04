import { Check, Minus } from 'lucide-react';
import { useCalculatorStore } from '@/store/calculatorStore';
import { ONEFLOW_PRICING } from '@/config/assumptions';
import { formatCurrency } from '@/utils/formatters';
import { calculateOneflowAnnualCost } from '@/utils/calculations';
import type { PlanType } from '@/types';

const planFeatures: Record<string, { business: boolean; enterprise: boolean }> = {
  'E-signatures': { business: true, enterprise: true },
  'Templates': { business: true, enterprise: true },
  'Basic integrations': { business: true, enterprise: true },
  'Advanced workflows': { business: false, enterprise: true },
  'SSO / SAML': { business: false, enterprise: true },
  'Custom branding': { business: false, enterprise: true },
  'API access': { business: false, enterprise: true },
  'Priority support': { business: false, enterprise: true },
  'AI features': { business: false, enterprise: true },
};

const addOnCategories = [
  { key: 'integrations', label: 'Integrations' },
  { key: 'create', label: 'Create' },
  { key: 'manage', label: 'Manage' },
  { key: 'collaborate', label: 'Collaborate' },
  { key: 'security', label: 'Security' },
  { key: 'ai', label: 'AI' },
  { key: 'support', label: 'Support' },
  { key: 'api', label: 'API' },
  { key: 'valueAddedServices', label: 'Value Added Services' },
] as const;

export function PricingConfigStep() {
  const { pricingConfig, setPricingConfig, companyProfile } = useCalculatorStore();
  const currency = companyProfile.currency;

  const calculatedCost = calculateOneflowAnnualCost(pricingConfig, currency);
  const displayCost = pricingConfig.annualCostOverride ?? calculatedCost;

  const toggleAddOn = (id: string) => {
    const addOns = pricingConfig.selectedAddOns.includes(id)
      ? pricingConfig.selectedAddOns.filter((a) => a !== id)
      : [...pricingConfig.selectedAddOns, id];
    setPricingConfig({ selectedAddOns: addOns });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Oneflow Pricing Configuration</h2>
        <p className="text-gray-500">Configure your Oneflow plan to calculate accurate ROI.</p>
      </div>

      {/* Plan Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.entries(ONEFLOW_PRICING.plans) as [PlanType, typeof ONEFLOW_PRICING.plans.business][]).map(
          ([key, plan]) => (
            <button
              key={key}
              onClick={() => setPricingConfig({ plan: key })}
              className={`relative text-left p-6 rounded-xl border-2 transition-all ${
                pricingConfig.plan === key
                  ? 'border-[var(--brand-primary)] bg-purple-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {key === 'enterprise' && (
                <span className="absolute -top-3 right-4 bg-[var(--brand-primary)] text-white text-xs px-3 py-1 rounded-full font-medium">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              <p className="text-2xl font-bold text-[var(--brand-primary)] mt-2">
                {formatCurrency(plan.annualFee, 'SEK')}
                <span className="text-sm font-normal text-gray-500">/year</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">{plan.includedSeats} seats included</p>

              <div className="mt-4 space-y-2">
                {Object.entries(planFeatures).map(([feature, plans]) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    {plans[key as keyof typeof plans] ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Minus className="w-4 h-4 text-gray-300" />
                    )}
                    <span className={plans[key as keyof typeof plans] ? 'text-gray-700' : 'text-gray-400'}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </button>
          )
        )}
      </div>

      {/* Seat Count */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Number of Seats</h3>
        <div className="flex items-center gap-4">
          <input
            type="number"
            min={ONEFLOW_PRICING.plans[pricingConfig.plan].includedSeats}
            value={pricingConfig.seats}
            onChange={(e) =>
              setPricingConfig({
                seats: Math.max(
                  ONEFLOW_PRICING.plans[pricingConfig.plan].includedSeats,
                  Number(e.target.value) || 0
                ),
              })
            }
            className="w-24 bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-sm text-gray-500">
            {pricingConfig.seats > ONEFLOW_PRICING.plans[pricingConfig.plan].includedSeats && (
              <>
                +{pricingConfig.seats - ONEFLOW_PRICING.plans[pricingConfig.plan].includedSeats} additional seats ={' '}
                {formatCurrency(
                  (pricingConfig.seats - ONEFLOW_PRICING.plans[pricingConfig.plan].includedSeats) *
                    ONEFLOW_PRICING.plans[pricingConfig.plan].additionalSeatCost,
                  'SEK'
                )}
              </>
            )}
          </span>
        </div>
      </div>

      {/* Add-ons */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h3 className="font-semibold text-gray-900">Add-ons</h3>
        {addOnCategories.map(({ key, label }) => {
          const addOns = ONEFLOW_PRICING.addOns[key as keyof typeof ONEFLOW_PRICING.addOns] as ReadonlyArray<{ id: string; name: string; type: string; pricePerSeat?: number; fixedPrice?: number }>;
          if (!addOns || addOns.length === 0) return null;

          return (
            <div key={key}>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">{label}</h4>
              <div className="space-y-2">
                {addOns.map((addOn) => {
                  const isSelected = pricingConfig.selectedAddOns.includes(addOn.id);
                  const price =
                    addOn.type === 'per-seat'
                      ? `${formatCurrency((addOn as { pricePerSeat: number }).pricePerSeat, 'SEK')}/seat/year`
                      : `${formatCurrency((addOn as { fixedPrice: number }).fixedPrice, 'SEK')}/year`;

                  return (
                    <label
                      key={addOn.id}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleAddOn(addOn.id)}
                          className="w-4 h-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                        />
                        <span className="text-sm text-gray-700">{addOn.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">{price}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Cost */}
      <div className="bg-gradient-to-r from-[var(--brand-primary)] to-purple-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Total Annual Oneflow Cost</h3>
            <p className="text-purple-200 text-sm mt-1">Calculated based on your selections</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{formatCurrency(displayCost, currency)}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-purple-400/30">
          <label className="flex items-center gap-3 text-sm">
            <span className="text-purple-200">Override with custom amount:</span>
            <input
              type="number"
              placeholder="Leave blank to use calculated cost"
              value={pricingConfig.annualCostOverride ?? ''}
              onChange={(e) =>
                setPricingConfig({
                  annualCostOverride: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-white/30 w-48 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
