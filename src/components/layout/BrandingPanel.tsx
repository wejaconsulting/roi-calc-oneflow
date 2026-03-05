import { useState } from 'react';
import { Palette, Upload, X, Globe, Loader2 } from 'lucide-react';
import { useCalculatorStore } from '@/store/calculatorStore';

/**
 * Extract dominant non-white/non-black color from an already-loaded canvas context.
 */
function extractDominantColorFromImageData(data: Uint8ClampedArray): string | null {
  const colorCounts: Record<string, number> = {};
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 128) continue;
    const brightness = (r + g + b) / 3;
    if (brightness > 240 || brightness < 15) continue;
    const qr = Math.round(r / 32) * 32;
    const qg = Math.round(g / 32) * 32;
    const qb = Math.round(b / 32) * 32;
    const key = `${qr},${qg},${qb}`;
    colorCounts[key] = (colorCounts[key] || 0) + 1;
  }

  let maxCount = 0;
  let dominant = '';
  for (const [key, count] of Object.entries(colorCounts)) {
    if (count > maxCount) { maxCount = count; dominant = key; }
  }

  if (dominant) {
    const [r, g, b] = dominant.split(',').map(Number);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  return null;
}

/**
 * Extract dominant color from a base64 data URL (synchronous since base64 loads instantly).
 */
function extractColorFromBase64(base64: string): string | null {
  try {
    const img = new Image();
    img.src = base64;
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, 32, 32);
    const data = ctx.getImageData(0, 0, 32, 32).data;
    return extractDominantColorFromImageData(data);
  } catch {
    return null;
  }
}

/**
 * Extract dominant color from an image URL (async, waits for load).
 */
function extractDominantColor(imageUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0, 32, 32);
        const data = ctx.getImageData(0, 0, 32, 32).data;
        resolve(extractDominantColorFromImageData(data));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

/**
 * Generate a simple SVG letter avatar as a data URI fallback.
 */
function generateLetterAvatar(domain: string, color: string): string {
  const letter = domain.replace(/^www\./, '').charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="24" fill="${color}"/>
    <text x="64" y="64" dy=".35em" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="64" font-weight="bold">${letter}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Try loading an image URL with a timeout. Returns true if the image loads
 * and is larger than 1x1 (to filter out tracking pixels / empty favicons).
 */
function tryLoadImage(src: string, timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => { img.src = ''; resolve(false); }, timeoutMs);
    img.onload = () => { clearTimeout(timer); resolve(img.naturalWidth > 1); };
    img.onerror = () => { clearTimeout(timer); resolve(false); };
    img.src = src;
  });
}

/**
 * Fetch company logo URL from publicly accessible APIs.
 * Returns a displayable URL — no base64 conversion needed.
 * Color extraction requires CORS so it may return null.
 */
async function fetchBrandLogo(domain: string): Promise<{ logoUrl: string; color: string | null }> {
  // Sources ordered by reliability (most reliable first).
  const sources = [
    `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    `https://logo.clearbit.com/${domain}`,
    `https://${domain}/favicon.ico`,
  ];

  for (const src of sources) {
    try {
      const loaded = await tryLoadImage(src);
      if (loaded) {
        const color = await extractDominantColor(src);
        return { logoUrl: src, color };
      }
    } catch {
      // Skip failed source
    }
  }

  // Fallback: generate a letter avatar
  const fallbackColor = '#5033FF';
  return { logoUrl: generateLetterAvatar(domain, fallbackColor), color: fallbackColor };
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
      const base64 = ev.target?.result as string;
      setBranding({ logoBase64: base64 });
      const color = extractColorFromBase64(base64);
      if (color) {
        setBranding({ primaryColor: color });
        document.documentElement.style.setProperty('--brand-primary', color);
      }
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
      const domain = websiteUrl.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
      if (!domain) throw new Error('Invalid URL');

      const { logoUrl, color } = await fetchBrandLogo(domain);

      // Store the URL directly — it works as an <img src>
      setBranding({ logoBase64: logoUrl });

      if (color) {
        handleColorChange(color);
      }

      // Extract company name from domain
      const cleanDomain = domain.replace(/^www\./, '');
      const name = cleanDomain.split('.')[0];
      if (name && name.length > 1) {
        setBranding({ companyName: name.charAt(0).toUpperCase() + name.slice(1) });
      }
    } catch {
      setFetchError('Could not fetch branding. Try uploading a logo manually.');
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
                aria-label="Remove logo"
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
