import { NextResponse } from 'next/server';

// Diverse query pool — Unsplash /photos/random with no filters returns a
// narrow curated set, so we rotate through varied queries to force breadth.
const QUERIES = [
  'nature', 'architecture', 'abstract', 'texture', 'city', 'landscape',
  'portrait', 'street', 'minimal', 'ocean', 'mountain', 'forest',
  'desert', 'sky', 'neon', 'vintage', 'food', 'macro', 'wildlife',
  'interior', 'fashion', 'art', 'industrial', 'graffiti', 'flower',
  'space', 'night', 'rain', 'fog', 'sunset', 'snow', 'autumn',
  'reflection', 'shadow', 'bokeh', 'pattern', 'travel', 'coffee',
  'music', 'sport', 'vehicle', 'technology', 'plant', 'bird',
];

function pickQueries(count: number): string[] {
  // Shuffle and pick unique queries so each fetch gets different buckets
  const pool = [...QUERIES].sort(() => Math.random() - 0.5);
  return pool.slice(0, count);
}

function mapPhoto(photo: Record<string, unknown>) {
  const urls = photo.urls as Record<string, string>;
  const user = photo.user as Record<string, unknown>;
  const userLinks = user.links as Record<string, string>;
  const links = photo.links as Record<string, string>;

  const rawUrl = urls.raw as string;
  const tinyUrl = rawUrl.includes('?')
    ? `${rawUrl}&w=32&q=50`
    : `${rawUrl}?w=32&q=50`;

  return {
    id: photo.id as string,
    url: urls.regular,
    thumbUrl: urls.thumb,
    tinyUrl,
    color: photo.color as string,
    photographer: user.name as string,
    photographerUrl: userLinks.html,
    photoUrl: links.html,
    downloadLocation: links.download_location,
    alt: (photo.alt_description as string) ?? 'Unsplash photo',
  };
}

async function fetchById(id: string, key: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/${encodeURIComponent(id)}`,
      { headers: { Authorization: `Client-ID ${key}` }, cache: 'no-store' },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchOne(query: string, key: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?orientation=landscape&query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Client-ID ${key}` }, cache: 'no-store' },
    );
    if (!res.ok) return null;
    const data = await res.json();
    // With query param and no count, returns a single object
    return Array.isArray(data) ? data[0] : data;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    return NextResponse.json({ error: 'UNSPLASH_ACCESS_KEY not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id')?.trim();
  const query = searchParams.get('query')?.trim();
  const count = Math.min(parseInt(searchParams.get('count') ?? '1'), 30);

  try {
    if (id) {
      const photo = await fetchById(id, key);
      if (!photo) {
        return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
      }
      return NextResponse.json(mapPhoto(photo));
    }

    // Fire parallel requests with different query terms for maximum diversity.
    // iOS can pass query=<theme> to request a specific photo theme while still
    // keeping the Unsplash key server-side.
    const queries = query
      ? Array.from({ length: count }, () => query)
      : pickQueries(count);
    const results = await Promise.all(queries.map(q => fetchOne(q, key)));
    const photos = results.filter((p): p is Record<string, unknown> => p !== null);

    if (photos.length === 0) {
      return NextResponse.json({ error: 'No photos returned' }, { status: 502 });
    }

    return NextResponse.json(photos.map(mapPhoto));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}
