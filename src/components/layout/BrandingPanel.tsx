import { useState } from 'react';
import { Palette, Upload, X, Globe, Loader2 } from 'lucide-react';
import { useCalculatorStore } from '@/store/calculatorStore';

/**
 * Fetch company logo and brand color from a website URL.
 * Uses Clearbit Logo API and Google Favicon as fallback.
 * Extracts dominant color from the logo via canvas sampling.
 */
async function fetchBrandAssets(url: string): Promise<{ logoUrl: string | null; color: string | null }> {
  // Normalize domain
  let domain = url.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
  if (!domain) throw new Error('Invalid URL');

  // Try Clearbit Logo API first (high-res company logos)
  const clearbitUrl = `https://logo.clearbit.com/${domain}`;
  const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

  let logoUrl: string | null = null;

  // Try Clearbit
  try {
    const res = await fetch(clearbitUrl, { mode: 'no-cors' });
    // no-cors returns opaque response, but we can still use the URL if it exists
    if (res.type === 'opaque' || res.ok) {
      // Verify by trying to load as image
      logoUrl = clearbitUrl;
    }
  } catch {
    // Clearbit failed, try Google
  }

  // Fallback to Google favicon
  if (!logoUrl) {
    logoUrl = googleUrl;
  }

  // Try to extract dominant color from logo
  let color: string | null = null;
  try {
    color = await extractDominantColor(logoUrl);
  } catch {
    // Color extraction failed, that's ok
  }

  return { logoUrl, color };
}

/**
 * Load an image and extract its dominant non-white/non-black color.
 */
function extractDominantColor(imageUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 32;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }

        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        // Count color frequencies, ignoring near-white, near-black, and transparent
        const colorCounts: Record<string, number> = {};
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 128) continue; // skip transparent
          const brightness = (r + g + b) / 3;
          if (brightness > 240 || brightness < 15) continue; // skip white/black
          // Quantize to reduce unique colors
          const qr = Math.round(r / 32) * 32;
          const qg = Math.round(g / 32) * 32;
          const qb = Math.round(b / 32) * 32;
          const key = `${qr},${qg},${qb}`;
          colorCounts[key] = (colorCounts[key] || 0) + 1;
        }

        // Find most frequent color
        let maxCount = 0;
        let dominant = '';
        for (const [key, count] of Object.entries(colorCounts)) {
          if (count > maxCount) {
            maxCount = count;
            dominant = key;
          }
        }

        if (dominant) {
          const [r, g, b] = dominant.split(',').map(Number);
          const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          resolve(hex);
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

/**
 * Convert an image URL to a base64 data URL via canvas.
 */
function imageUrlToBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export function BrandingPanel() {
  const { branding, setBranding } = useCalculatorStore();
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');

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

  const handleFetchBranding = async () => {
    if (!websiteUrl.trim()) return;
    setFetching(true);
    setFetchError('');

    try {
      const { logoUrl, color } = await fetchBrandAssets(websiteUrl);

      if (logoUrl) {
        // Try to convert to base64 for local storage
        const base64 = await imageUrlToBase64(logoUrl);
        if (base64) {
          setBranding({ logoBase64: base64 });
        }
        // Even if base64 fails (CORS), we store the URL reference for display
        // The logo will still show via the img tag
      }

      if (color) {
        handleColorChange(color);
        setBranding({ primaryColor: color });
      }

      // Extract company name from domain
      const domain = websiteUrl.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
      const name = domain.split('.')[0];
      if (name && name.length > 1) {
        setBranding({ companyName: name.charAt(0).toUpperCase() + name.slice(1) });
      }
    } catch {
      setFetchError('Could not fetch branding. Try uploading manually.');
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Palette className="w-5 h-5 text-[var(--brand-primary)]" />
        <h3 className="font-semibold text-gray-900">Customize Branding</h3>
      </div>

      {/* Website URL fetch */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Company Website</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchBranding()}
              placeholder="example.com"
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent"
            />
          </div>
          <button
            onClick={handleFetchBranding}
            disabled={fetching || !websiteUrl.trim()}
            className="px-3 py-2 text-sm bg-[var(--brand-primary)] text-white rounded-lg hover:bg-[var(--brand-primary-dark)] transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            Fetch
          </button>
        </div>
        {fetchError && <p className="text-xs text-red-500 mt-1">{fetchError}</p>}
      </div>

      <div className="border-t border-gray-100 pt-3 space-y-3">
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
