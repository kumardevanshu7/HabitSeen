export interface TemplateJunk {
  id: string; // filename identifier e.g. "Cartoon Chole Bhature Plate.webp"
  name: string; // clean display name e.g. "Cartoon Chole Bhature Plate"
  url: string; // resolved Vite asset URL
  filename: string;
}

// Vite's import.meta.glob dynamically imports all images from src/template-junks/
// As new images are dropped into that folder, Vite automatically detects and bundles them.
const imageModules = import.meta.glob<{ default: string }>(
  '../template-junks/*.{png,jpg,jpeg,webp,svg,PNG,JPG,JPEG,WEBP,SVG}',
  { eager: true }
);

export function getTemplateJunkList(): TemplateJunk[] {
  const list: TemplateJunk[] = [];

  for (const [path, mod] of Object.entries(imageModules)) {
    const filename = path.split('/').pop() || '';
    if (!filename) continue;

    // Remove file extension for friendly display name
    const name = filename.replace(/\.[^/.]+$/, '').trim();
    const url = mod?.default || (typeof mod === 'string' ? mod : '');

    list.push({
      id: filename,
      name,
      url,
      filename,
    });
  }

  // Sort alphabetically by name
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Returns the resolved asset URL for a given template image filename or id.
 */
export function getTemplateJunkUrl(imageIdentifier?: string): string | undefined {
  if (!imageIdentifier) return undefined;

  // 1. Direct match by filename or id
  const list = getTemplateJunkList();
  const match = list.find(
    (item) =>
      item.id === imageIdentifier ||
      item.filename === imageIdentifier ||
      item.name.toLowerCase() === imageIdentifier.toLowerCase()
  );
  if (match) return match.url;

  // 2. If it is already a full URL or blob
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
