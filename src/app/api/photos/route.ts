import { NextResponse } from 'next/server';

function mapPhoto(photo: Record<string, unknown>) {
  const urls = photo.urls as Record<string, string>;
  const user = photo.user as Record<string, unknown>;
  const userLinks = user.links as Record<string, string>;
  const links = photo.links as Record<string, string>;

  // Build a tiny 32px URL for pixelated mosaic placeholder
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
    alt: (photo.alt_description as string) ?? 'Unsplash photo',
  };
}

export async function GET(request: Request) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    return NextResponse.json({ error: 'UNSPLASH_ACCESS_KEY not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const count = Math.min(parseInt(searchParams.get('count') ?? '1'), 30);

  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?orientation=landscape&count=${count}`,
      { headers: { Authorization: `Client-ID ${key}` } },
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Unsplash API error' }, { status: res.status });
    }

    const data = await res.json();

    // count=1 still returns an array when using count param
    const photos = Array.isArray(data) ? data : [data];
    return NextResponse.json(photos.map(mapPhoto));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}
