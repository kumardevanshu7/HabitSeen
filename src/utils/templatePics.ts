export interface TemplatePic {
  id: string; // filename identifier e.g. "Creamy Malai Chaap Platter.webp"
  name: string; // short clean display name e.g. "Malai Chaap"
  fullName: string; // full original filename without extension
  url: string; // resolved Vite asset URL
  filename: string;
}

// User-curated short, clean names for template pictures
const SHORT_NAME_MAP: Record<string, string> = {
  'Creamy Malai Chaap Platter': 'Malai Chaap',
  'Cartoon Afghani Chaap Platter': 'Afghani Chaap',
  'Cartoon Burger Sticker Icon': 'Burger',
  'Cartoon Chole Bhature Plate': 'Chole Bhature',
  'Cartoon Dosa Thali with Chutneys': 'Dosa',
  'Chopsticks Lifting Savory Chow Mein': 'Chow Mein',
  'Classic Vada Pav Plate': 'Vada Pav',
  'Colorful Soda Can and Glass Collection': 'Soda & Cold Drinks',
  'Flaky Romali Roti with Onion Garnish': 'Rumali Roti',
  'Free Fire Battle Emblem': 'Free Fire',
  'Glossy 18+ Restriction Badge': '18+ Adult Content',
  'Glossy Chilli Potato Plate': 'Chilli Potato',
  'Glossy Chocolate Cake Slice on Plate': 'Pastry & Cake',
  'Glossy Sperm Swarm Illustration': 'NoFap / Masturbation',
  'Golden McPuff with Savory Filling': 'Pizza McPuff',
  'Golden Samosas with Green Chutney': 'Samosa',
  'No Lust Lips Sticker': 'No Lust / Control',
  'Paneer Wraps with Green Chutney': 'Paneer Wrap',
  'Steamed Momos with Spicy Chutney': 'Steamed Momos',
  'Tandoori Momos with Chutneys and Paneer': 'Tandoori Momos',
};

/**
 * Returns a short, clean, human-friendly title for any template image.
 * Falls back to a smart heuristic stripping AI prompt prefixes if not in explicit dictionary.
 */
export function getShortTemplateName(rawName: string): string {
  const trimmed = rawName.trim();
  if (SHORT_NAME_MAP[trimmed]) {
    return SHORT_NAME_MAP[trimmed];
  }

  // Case-insensitive lookup
  const lower = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(SHORT_NAME_MAP)) {
    if (key.toLowerCase() === lower) return val;
  }

  // Fallback: Smart heuristic stripping of common AI image prompt prefixes & suffixes
  const clean = trimmed
    .replace(/^(Cartoon|Glossy|Golden|Classic|Flaky|Creamy|Steamed|Crispy)\s+/i, '')
    .replace(/\s+(Platter|Plate|Sticker Icon|Sticker|Collection|Illustration|Badge|Emblem|with [^,]+)$/i, '')
    .trim();

  return clean || trimmed;
}

// Vite's import.meta.glob dynamically imports all images from src/template-pics/
// Also matches src/template-junks/ for seamless backward compatibility.
const imageModules = import.meta.glob<{ default: string }>(
  [
    '../template-pics/*.{png,jpg,jpeg,webp,svg,PNG,JPG,JPEG,WEBP,SVG}',
    '../template-junks/*.{png,jpg,jpeg,webp,svg,PNG,JPG,JPEG,WEBP,SVG}',
  ],
  { eager: true }
);

export function getTemplatePicList(): TemplatePic[] {
  const list: TemplatePic[] = [];
  const seenIds = new Set<string>();

  for (const [path, mod] of Object.entries(imageModules)) {
    const filename = path.split('/').pop() || '';
    if (!filename || seenIds.has(filename)) continue;
    seenIds.add(filename);

    const fullName = filename.replace(/\.[^/.]+$/, '').trim();
    const shortName = getShortTemplateName(fullName);
    const url = mod?.default || (typeof mod === 'string' ? mod : '');

    list.push({
      id: filename,
      name: shortName,
      fullName,
      url,
      filename,
    });
  }

  // Sort alphabetically by short name
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Returns the resolved asset URL for a given template picture filename or id.
 */
export function getTemplatePicUrl(imageIdentifier?: string): string | undefined {
  if (!imageIdentifier) return undefined;

  const list = getTemplatePicList();
  const lower = imageIdentifier.toLowerCase();

  const match = list.find(
    (item) =>
      item.id === imageIdentifier ||
      item.filename === imageIdentifier ||
      item.name.toLowerCase() === lower ||
      item.fullName.toLowerCase() === lower
  );
  if (match) return match.url;

  // If already a full URL or blob
  if (
    imageIdentifier.startsWith('http://') ||
    imageIdentifier.startsWith('https://') ||
    imageIdentifier.startsWith('data:') ||
    imageIdentifier.startsWith('/')
  ) {
    return imageIdentifier;
  }

  return undefined;
}

// Backward-compatibility aliases for templateJunks
export type TemplateJunk = TemplatePic;
export const getTemplateJunkList = getTemplatePicList;
export const getTemplateJunkUrl = getTemplatePicUrl;
