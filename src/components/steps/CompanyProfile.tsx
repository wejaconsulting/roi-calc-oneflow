import { Building2, Users, Landmark, ChevronDown } from 'lucide-react';
import { useCalculatorStore } from '@/store/calculatorStore';
import { INDUSTRY_LIST, CURRENCY_FLAGS } from '@/config/assumptions';
import type { CompanySize, CurrencyCode } from '@/types';

const sizes: { key: CompanySize; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: 'small', label: 'Small', desc: '1-50 employees', icon: <Building2 className="w-8 h-8" /> },
  { key: 'midmarket', label: 'Mid-Market', desc: '51-500 employees', icon: <Users className="w-8 h-8" /> },
  { key: 'enterprise', label: 'Enterprise', desc: '500+ employees', icon: <Landmark className="w-8 h-8" /> },
];

const currencies: CurrencyCode[] = ['SEK', 'NOK', 'EUR', 'USD', 'GBP'];

export function CompanyProfileStep() {
  const { companyProfile, setCompanyProfile } = useCalculatorStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Profile</h2>
        <p className="text-gray-500">Tell us about your organization to customize the analysis.</p>
      </div>

      {/* Company Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Company Size</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {sizes.map((s) => (
            <button
              key={s.key}
              onClick={() => setCompanyProfile({ size: s.key })}
              className={`relative flex flex-col items-center p-6 rounded-xl border-2 transition-all ${
                companyProfile.size === s.key
                  ? 'border-[var(--brand-primary)] bg-purple-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div
                className={`mb-3 ${
                  companyProfile.size === s.key ? 'text-[var(--brand-primary)]' : 'text-gray-400'
                }`}
              >
                {s.icon}
              </div>
              <span className="font-semibold text-gray-900">{s.label}</span>
              <span className="text-sm text-gray-500">{s.desc}</span>
              {companyProfile.size === s.key && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-[var(--brand-primary)] rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Industry */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Industry (Optional)</label>
        <div className="relative">
          <select
            value={companyProfile.industry}
            onChange={(e) => setCompanyProfile({ industry: e.target.value })}
            className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-4 py-3 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent"
          >
            <option value="">Select your industry...</option>
            {INDUSTRY_LIST.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Currency */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Currency</label>
        <div className="flex flex-wrap gap-3">
          {currencies.map((c) => (
            <button
              key={c}
              onClick={() => setCompanyProfile({ currency: c })}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                companyProfile.currency === c
                  ? 'border-[var(--brand-primary)] bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <span className="text-lg">{CURRENCY_FLAGS[c]}</span>
              <span className="font-medium text-gray-900">{c}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
