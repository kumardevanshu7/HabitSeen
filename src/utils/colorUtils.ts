// Color and contrast utilities for HabitsSeen

function normalizeHex(hex?: string): string {
  if (!hex || typeof hex !== 'string') return '';
  let clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3 && /^[0-9a-fA-F]{3}$/.test(clean)) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  return /^[0-9a-fA-F]{6}$/.test(clean) ? clean : '';
}

export function boostVibrancy(hex?: string): string {
  if (!hex || typeof hex !== 'string') return '#2563EB';

  const clean = normalizeHex(hex);
  if (!clean) return '#2563EB';

  const fullHex = `#${clean.toUpperCase()}`;
  if (fullHex === '#EDEDE9' || fullHex === '#FFFFFF') {
    return '#2563EB';
  }

  // Map known pale pastels to ultra-vivid, punchy colors
  const paleMap: Record<string, string> = {
    '#EDEDE9': '#2563EB',
    '#D6CCC2': '#EA580C',
    '#F5EBE0': '#D97706',
    '#E3D5CA': '#059669',
    '#D5BDAF': '#0D9488',
    '#E2ECE9': '#0284C7',
    '#DFE7FD': '#2563EB',
    '#CDDAFD': '#4F46E5',
    '#F1E3D3': '#7C3AED',
    '#F8EDEB': '#DB2777',
    '#FDE2E4': '#E11D48',
    '#FAD2E1': '#C026D3',
    '#E2EAFC': '#2563EB',
    '#D8E2DC': '#059669',
    '#FFE5D9': '#EA580C',
    '#F0E6EF': '#9333EA',
  };

  if (paleMap[fullHex]) {
    return paleMap[fullHex];
  }

  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  if (luminance > 0.85) {
    return '#2563EB';
  }

  return fullHex;
}

export function getContrastIconColor(bgColor?: string): string {
  if (!bgColor || typeof bgColor !== 'string') return '#FFFFFF';
  const clean = normalizeHex(bgColor);
  if (!clean) return '#FFFFFF';

  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // If background is light (luminance > 0.6), return dark charcoal ink for 100% visibility
  // Otherwise return crisp white
  return luminance > 0.6 ? '#18181B' : '#FFFFFF';
}
