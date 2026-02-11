// Extract dominant colors from an image URL using offscreen canvas sampling

export interface ColorPalette {
  primary: string;    // most dominant non-neutral color
  secondary: string;  // second dominant
  accent: string;     // third, or fallback
}

const DEFAULT_PALETTE: ColorPalette = {
  primary: '#ffffff',
  secondary: '#ffffff',
  accent: '#ffffff',
};

// Cache extracted palettes by URL
const cache = new Map<string, ColorPalette>();

export async function extractColors(imageUrl: string): Promise<ColorPalette> {
  if (cache.has(imageUrl)) return cache.get(imageUrl)!;

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = imageUrl;
    });

    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, size, size);

    const data = ctx.getImageData(0, 0, size, size).data;
    const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Skip very dark (near black) and very light (near white)
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luminance < 30 || luminance > 225) continue;

      // Skip very desaturated (grays)
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max - min < 20) continue;

      // Quantize to reduce bucket count: round to nearest 32
      const qr = Math.round(r / 32) * 32;
      const qg = Math.round(g / 32) * 32;
      const qb = Math.round(b / 32) * 32;
      const key = `${qr},${qg},${qb}`;

      if (buckets.has(key)) {
        const entry = buckets.get(key)!;
        entry.r += r;
        entry.g += g;
        entry.b += b;
        entry.count++;
      } else {
        buckets.set(key, { r, g, b, count: 1 });
      }
    }

    // Sort by frequency
    const sorted = [...buckets.values()]
      .filter(b => b.count > 2)
      .sort((a, b) => b.count - a.count);

    if (sorted.length === 0) {
      cache.set(imageUrl, DEFAULT_PALETTE);
      return DEFAULT_PALETTE;
    }

    const toHex = (bucket: { r: number; g: number; b: number; count: number }) => {
      const r = Math.round(bucket.r / bucket.count);
      const g = Math.round(bucket.g / bucket.count);
      const b = Math.round(bucket.b / bucket.count);
      return `rgb(${r}, ${g}, ${b})`;
    };

    // Boost saturation for more vivid visualizer colors
    const toVivid = (bucket: { r: number; g: number; b: number; count: number }) => {
      let r = Math.round(bucket.r / bucket.count);
      let g = Math.round(bucket.g / bucket.count);
      let b = Math.round(bucket.b / bucket.count);

      // Convert to HSL, boost saturation, convert back
      const max = Math.max(r, g, b) / 255;
      const min = Math.min(r, g, b) / 255;
      const l = (max + min) / 2;
      let h = 0, s = 0;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        const rn = r / 255, gn = g / 255, bn = b / 255;
        if (rn === max) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        else if (gn === max) h = ((bn - rn) / d + 2) / 6;
        else h = ((rn - gn) / d + 4) / 6;
      }

      // Boost saturation, clamp lightness to mid range
      s = Math.min(1, s * 1.4);
      const vl = Math.max(0.35, Math.min(0.65, l));

      // HSL to RGB
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = vl < 0.5 ? vl * (1 + s) : vl + s - vl * s;
      const p = 2 * vl - q;
      r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
      g = Math.round(hue2rgb(p, q, h) * 255);
      b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

      return `rgb(${r}, ${g}, ${b})`;
    };

    const palette: ColorPalette = {
      primary: toVivid(sorted[0]),
      secondary: sorted.length > 1 ? toVivid(sorted[1]) : toVivid(sorted[0]),
      accent: sorted.length > 2 ? toVivid(sorted[2]) : toHex(sorted[0]),
    };

    cache.set(imageUrl, palette);
    return palette;
  } catch {
    cache.set(imageUrl, DEFAULT_PALETTE);
    return DEFAULT_PALETTE;
  }
}
