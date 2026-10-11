// Color and contrast utilities for HabitsSeen

export function boostVibrancy(hex?: string): string {
  if (!hex || hex === '#EDEDE9' || hex === '#ffffff' || hex === '#FFFFFF') {
    return '#2563EB'; // Solid electric blue default
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

  const upper = hex.toUpperCase();
  if (paleMap[upper]) {
    return paleMap[upper];
  }

  // Check if hex is too light / low-saturation
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    // If color is very washed out / near white, replace with a vivid fallback
    if (luminance > 0.85) {
      return '#2563EB';
    }
  }

  return hex;
}

export function getContrastIconColor(bgColor?: string): string {
  if (!bgColor) return '#FFFFFF';
  const clean = bgColor.replace('#', '');
  if (clean.length < 6) return '#FFFFFF';

  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // If background is light (luminance > 0.6), return dark charcoal ink for 100% visibility
  // Otherwise return crisp white
  return luminance > 0.6 ? '#18181B' : '#FFFFFF';
}
