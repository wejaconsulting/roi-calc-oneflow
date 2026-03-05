import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCalculatorStore } from '@/store/calculatorStore';

interface EmailGateProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EmailGate({ isOpen, onClose, onSuccess }: EmailGateProps) {
  const { setEmailSubmitted } = useCalculatorStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const isWorkEmail = (e: string) => !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].some((d) => e.endsWith(d));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!isWorkEmail(email)) {
      setError('Please use a work email address');
      return;
    }
    if (!consent) {
      setError('Please accept the data processing terms');
      return;
    }

    setLoading(true);
    try {
      const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, timestamp: new Date().toISOString() }),
        }).catch(() => {});
      }
      setEmailSubmitted(true, { name, email });
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 relative">
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[var(--brand-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Download Your ROI Report</h2>
          <p className="text-sm text-gray-500 mt-1">Enter your details to get the full PDF report</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent"
            />
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
            />
            <span className="text-xs text-gray-500">
              I consent to Oneflow processing my personal data to provide this report and contact me about their services. You can withdraw consent at any time. See our Privacy Policy.
            </span>
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[var(--brand-primary)] text-white rounded-lg font-medium hover:bg-[var(--brand-primary-dark)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Download PDF Report'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
