import { Palette, Upload, X } from 'lucide-react';
import { useCalculatorStore } from '@/store/calculatorStore';

export function BrandingPanel() {
  const { branding, setBranding } = useCalculatorStore();

  if (!branding.enabled) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setBranding({ logoBase64: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleColorChange = (color: string) => {
    setBranding({ primaryColor: color });
    document.documentElement.style.setProperty('--brand-primary', color);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Palette className="w-5 h-5 text-[var(--brand-primary)]" />
        <h3 className="font-semibold text-gray-900">Customize Branding</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Company Name</label>
          <input
            type="text"
            value={branding.companyName}
            onChange={(e) => setBranding({ companyName: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Logo</label>
          {branding.logoBase64 ? (
            <div className="flex items-center gap-3">
              <img src={branding.logoBase64} alt="Logo" className="h-10 object-contain" />
              <button
                onClick={() => setBranding({ logoBase64: null })}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm text-gray-500">
              <Upload className="w-4 h-4" />
              Upload logo
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Primary Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={branding.primaryColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              value={branding.primaryColor}
              onChange={(e) => {
                if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                  handleColorChange(e.target.value);
                }
              }}
              className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
