// Explicit direct imports for all 20 curated template pictures
// This guarantees 100% build reliability on all platforms (Windows, Linux, Vercel, PWA)
import imgAfghaniChaap from '../template-pics/Cartoon Afghani Chaap Platter.webp';
import imgBurger from '../template-pics/Cartoon Burger Sticker Icon.webp';
import imgCholeBhature from '../template-pics/Cartoon Chole Bhature Plate.webp';
import imgDosa from '../template-pics/Cartoon Dosa Thali with Chutneys.webp';
import imgChowMein from '../template-pics/Chopsticks Lifting Savory Chow Mein.webp';
import imgVadaPav from '../template-pics/Classic Vada Pav Plate.webp';
import imgSoda from '../template-pics/Colorful Soda Can and Glass Collection.webp';
import imgMalaiChaap from '../template-pics/Creamy Malai Chaap Platter.webp';
import imgRumaliRoti from '../template-pics/Flaky Romali Roti with Onion Garnish.webp';
import imgFreeFire from '../template-pics/Free Fire Battle Emblem.webp';
import imgAdult18 from '../template-pics/Glossy 18+ Restriction Badge.webp';
import imgChilliPotato from '../template-pics/Glossy Chilli Potato Plate.webp';
import imgChocolateCake from '../template-pics/Glossy Chocolate Cake Slice on Plate.webp';
import imgSpermSwarm from '../template-pics/Glossy Sperm Swarm Illustration.webp';
import imgMcPuff from '../template-pics/Golden McPuff with Savory Filling.webp';
import imgSamosa from '../template-pics/Golden Samosas with Green Chutney.webp';
import imgNoLust from '../template-pics/No Lust Lips Sticker.webp';
import imgPaneerWrap from '../template-pics/Paneer Wraps with Green Chutney.webp';
import imgSteamedMomos from '../template-pics/Steamed Momos with Spicy Chutney.webp';
import imgTandooriMomos from '../template-pics/Tandoori Momos with Chutneys and Paneer.webp';
import imgLavaCake from '../template-pics/Molten Chocolate Lava Cake Delight.webp';
import imgRoti from '../template-pics/Stacked Rotis with Cilantro Garnish.webp';
import imgChai from '../template-pics/Steaming Chai with Spices and Ginger.webp';
import imgCoffee from '../template-pics/Steaming Latte with Coffee Beans.webp';

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
  'Molten Chocolate Lava Cake Delight': 'Choco Lava Cake',
  'Stacked Rotis with Cilantro Garnish': 'Roti / Chapati',
  'Steaming Chai with Spices and Ginger': 'Chai / Tea',
  'Steaming Latte with Coffee Beans': 'Coffee / Latte',
};

/**
 * Static baseline of the 20 pictures
 */
const STATIC_TEMPLATE_PICS: TemplatePic[] = [
  {
    id: 'Creamy Malai Chaap Platter.webp',
    filename: 'Creamy Malai Chaap Platter.webp',
    fullName: 'Creamy Malai Chaap Platter',
    name: 'Malai Chaap',
    url: imgMalaiChaap,
  },
  {
    id: 'Cartoon Afghani Chaap Platter.webp',
    filename: 'Cartoon Afghani Chaap Platter.webp',
    fullName: 'Cartoon Afghani Chaap Platter',
    name: 'Afghani Chaap',
    url: imgAfghaniChaap,
  },
  {
    id: 'Cartoon Burger Sticker Icon.webp',
    filename: 'Cartoon Burger Sticker Icon.webp',
    fullName: 'Cartoon Burger Sticker Icon',
    name: 'Burger',
    url: imgBurger,
  },
  {
    id: 'Cartoon Chole Bhature Plate.webp',
    filename: 'Cartoon Chole Bhature Plate.webp',
    fullName: 'Cartoon Chole Bhature Plate',
    name: 'Chole Bhature',
    url: imgCholeBhature,
  },
  {
    id: 'Cartoon Dosa Thali with Chutneys.webp',
    filename: 'Cartoon Dosa Thali with Chutneys.webp',
    fullName: 'Cartoon Dosa Thali with Chutneys',
    name: 'Dosa',
    url: imgDosa,
  },
  {
    id: 'Chopsticks Lifting Savory Chow Mein.webp',
    filename: 'Chopsticks Lifting Savory Chow Mein.webp',
    fullName: 'Chopsticks Lifting Savory Chow Mein',
    name: 'Chow Mein',
    url: imgChowMein,
  },
  {
    id: 'Classic Vada Pav Plate.webp',
    filename: 'Classic Vada Pav Plate.webp',
    fullName: 'Classic Vada Pav Plate',
    name: 'Vada Pav',
    url: imgVadaPav,
  },
  {
    id: 'Colorful Soda Can and Glass Collection.webp',
    filename: 'Colorful Soda Can and Glass Collection.webp',
    fullName: 'Colorful Soda Can and Glass Collection',
    name: 'Soda & Cold Drinks',
    url: imgSoda,
  },
  {
    id: 'Flaky Romali Roti with Onion Garnish.webp',
    filename: 'Flaky Romali Roti with Onion Garnish.webp',
    fullName: 'Flaky Romali Roti with Onion Garnish',
    name: 'Rumali Roti',
    url: imgRumaliRoti,
  },
  {
    id: 'Free Fire Battle Emblem.webp',
    filename: 'Free Fire Battle Emblem.webp',
    fullName: 'Free Fire Battle Emblem',
    name: 'Free Fire',
    url: imgFreeFire,
  },
  {
    id: 'Glossy 18+ Restriction Badge.webp',
    filename: 'Glossy 18+ Restriction Badge.webp',
    fullName: 'Glossy 18+ Restriction Badge',
    name: '18+ Adult Content',
    url: imgAdult18,
  },
  {
    id: 'Glossy Chilli Potato Plate.webp',
    filename: 'Glossy Chilli Potato Plate.webp',
    fullName: 'Glossy Chilli Potato Plate',
    name: 'Chilli Potato',
    url: imgChilliPotato,
  },
  {
    id: 'Glossy Chocolate Cake Slice on Plate.webp',
    filename: 'Glossy Chocolate Cake Slice on Plate.webp',
    fullName: 'Glossy Chocolate Cake Slice on Plate',
    name: 'Pastry & Cake',
    url: imgChocolateCake,
  },
  {
    id: 'Glossy Sperm Swarm Illustration.webp',
    filename: 'Glossy Sperm Swarm Illustration.webp',
    fullName: 'Glossy Sperm Swarm Illustration',
    name: 'NoFap / Masturbation',
    url: imgSpermSwarm,
  },
  {
    id: 'Golden McPuff with Savory Filling.webp',
    filename: 'Golden McPuff with Savory Filling.webp',
    fullName: 'Golden McPuff with Savory Filling',
    name: 'Pizza McPuff',
    url: imgMcPuff,
  },
  {
    id: 'Golden Samosas with Green Chutney.webp',
    filename: 'Golden Samosas with Green Chutney.webp',
    fullName: 'Golden Samosas with Green Chutney',
    name: 'Samosa',
    url: imgSamosa,
  },
  {
    id: 'No Lust Lips Sticker.webp',
    filename: 'No Lust Lips Sticker.webp',
    fullName: 'No Lust Lips Sticker',
    name: 'No Lust / Control',
    url: imgNoLust,
  },
  {
    id: 'Paneer Wraps with Green Chutney.webp',
    filename: 'Paneer Wraps with Green Chutney.webp',
    fullName: 'Paneer Wraps with Green Chutney',
    name: 'Paneer Wrap',
    url: imgPaneerWrap,
  },
  {
    id: 'Steamed Momos with Spicy Chutney.webp',
    filename: 'Steamed Momos with Spicy Chutney.webp',
    fullName: 'Steamed Momos with Spicy Chutney',
    name: 'Steamed Momos',
    url: imgSteamedMomos,
  },
  {
    id: 'Tandoori Momos with Chutneys and Paneer.webp',
    filename: 'Tandoori Momos with Chutneys and Paneer.webp',
    fullName: 'Tandoori Momos with Chutneys and Paneer',
    name: 'Tandoori Momos',
    url: imgTandooriMomos,
  },
  {
    id: 'Molten Chocolate Lava Cake Delight.webp',
    filename: 'Molten Chocolate Lava Cake Delight.webp',
    fullName: 'Molten Chocolate Lava Cake Delight',
    name: 'Choco Lava Cake',
    url: imgLavaCake,
  },
  {
    id: 'Stacked Rotis with Cilantro Garnish.webp',
    filename: 'Stacked Rotis with Cilantro Garnish.webp',
    fullName: 'Stacked Rotis with Cilantro Garnish',
    name: 'Roti / Chapati',
    url: imgRoti,
  },
  {
    id: 'Steaming Chai with Spices and Ginger.webp',
    filename: 'Steaming Chai with Spices and Ginger.webp',
    fullName: 'Steaming Chai with Spices and Ginger',
    name: 'Chai / Tea',
    url: imgChai,
  },
  {
    id: 'Steaming Latte with Coffee Beans.webp',
    filename: 'Steaming Latte with Coffee Beans.webp',
    fullName: 'Steaming Latte with Coffee Beans',
    name: 'Coffee / Latte',
    url: imgCoffee,
  },
];

/**
 * Returns a short, clean, human-friendly title for any template image.
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
// This ensures any newly added images dropped into the folder are automatically loaded.
const dynamicImageModules = import.meta.glob<{ default: string }>(
  '../template-pics/*.{png,jpg,jpeg,webp,svg,PNG,JPG,JPEG,WEBP,SVG}',
  { eager: true }
);

export function getTemplatePicList(): TemplatePic[] {
  // Start with static baseline
  const list: TemplatePic[] = [...STATIC_TEMPLATE_PICS];
  const seenIds = new Set<string>(STATIC_TEMPLATE_PICS.map((item) => item.id.toLowerCase()));

  // Dynamically merge any new images dropped into src/template-pics/
  for (const [path, mod] of Object.entries(dynamicImageModules)) {
    const filename = path.split('/').pop() || '';
    if (!filename || seenIds.has(filename.toLowerCase())) continue;
    seenIds.add(filename.toLowerCase());

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
      item.id.toLowerCase() === lower ||
      item.filename.toLowerCase() === lower ||
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
