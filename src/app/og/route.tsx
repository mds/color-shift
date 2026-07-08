import { ImageResponse } from 'next/og';

// Dynamic Open Graph image: renders the exact Color Shift combo from a shared
// URL — the color panel (bg + "Aa"/specimen text in fg, Instrument Serif) on
// the left, the linked photo on the right — so a shared link previews as that
// specific pairing. Params mirror the share URL: bg, fg, text, photo.

export const runtime = 'nodejs';

const WIDTH = 1200;
const HEIGHT = 630;

function normHex(value: string | null, fallback: string): string {
  if (!value) return fallback;
  const h = value.replace('#', '');
  return /^[0-9a-fA-F]{6}$/.test(h) ? `#${h}` : fallback;
}

// Fetch just the glyphs we need for Instrument Serif from Google Fonts.
async function loadFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Instrument+Serif&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(cssUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
    const match = css.match(/src:\s*url\((.+?)\)\s*format\(['"]?(?:opentype|truetype)['"]?\)/);
    if (!match) return null;
    return await (await fetch(match[1])).arrayBuffer();
  } catch {
    return null;
  }
}

// Resolve an Unsplash photo id to a cropped image URL sized for the OG half.
async function resolvePhoto(id: string): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://api.unsplash.com/photos/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Client-ID ${key}` },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { urls?: { raw?: string; regular?: string } };
    const raw = data.urls?.raw;
    if (!raw) return data.urls?.regular ?? null;
    return raw.includes('?')
      ? `${raw}&w=700&h=630&fit=crop&q=70`
      : `${raw}?w=700&h=630&fit=crop&q=70`;
  } catch {
    return null;
  }
}

function fontSizeFor(text: string): number {
  const len = text.length;
  if (len <= 3) return 200;
  if (len <= 8) return 150;
  if (len <= 16) return 108;
  if (len <= 30) return 72;
  return 48;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bg = normHex(searchParams.get('bg'), '#4B3B8F');
  const fg = normHex(searchParams.get('fg'), '#E0A94A');
  const text = (searchParams.get('text') || 'Aa').slice(0, 80);
  const photoId = searchParams.get('photo')?.trim();

  const [photoUrl, font] = await Promise.all([
    photoId ? resolvePhoto(photoId) : Promise.resolve(null),
    loadFont(text),
  ]);

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        <div
          style={{
            display: 'flex',
            width: photoUrl ? '50%' : '100%',
            height: '100%',
            background: bg,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 48,
          }}
        >
          <div
            style={{
              color: fg,
              fontFamily: 'Instrument Serif',
              fontSize: fontSizeFor(text),
              lineHeight: 1.05,
              textAlign: 'center',
              maxWidth: '100%',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
            }}
          >
            {text}
          </div>
        </div>
        {photoUrl && (
          <div style={{ display: 'flex', width: '50%', height: '100%' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt=""
              width={600}
              height={HEIGHT}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: font
        ? [{ name: 'Instrument Serif', data: font, style: 'normal', weight: 400 }]
        : [],
    },
  );
}
