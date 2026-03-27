// Curated display fonts for specimen text — only "Aa" glyphs are downloaded (~1-2KB each)

export const SPECIMEN_FONTS = [
  'Playfair Display',
  'DM Serif Display',
  'Instrument Serif',
  'Fraunces',
  'Crimson Pro',
  'Source Serif 4',
  'Literata',
  'Lora',
  'Space Mono',
  'JetBrains Mono',
  'Syne',
  'Bricolage Grotesque',
  'Outfit',
  'Familjen Grotesk',
  'Space Grotesk',
  'Hanken Grotesk',
  'Libre Baskerville',
  'Cormorant Garamond',
  'Bodoni Moda',
  'Sorts Mill Goudy',
];

// Build the Google Fonts URL — text=Aa limits to just those 2 glyphs
export function getGoogleFontsUrl(): string {
  const families = SPECIMEN_FONTS.map(f => `family=${f.replace(/ /g, '+')}`).join('&');
  return `https://fonts.googleapis.com/css2?${families}&text=Aa&display=swap`;
}

// Get a deterministic font for a photo based on its id
export function getFontForPhoto(photoId: string): string {
  let hash = 0;
  for (let i = 0; i < photoId.length; i++) {
    hash = ((hash << 5) - hash) + photoId.charCodeAt(i);
    hash |= 0;
  }
  return SPECIMEN_FONTS[Math.abs(hash) % SPECIMEN_FONTS.length];
}
