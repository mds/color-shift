import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    return NextResponse.json({ error: 'UNSPLASH_ACCESS_KEY not configured' }, { status: 500 });
  }

  try {
    const res = await fetch('https://api.unsplash.com/photos/random?orientation=landscape', {
      headers: { Authorization: `Client-ID ${key}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Unsplash API error' }, { status: res.status });
    }

    const photo = await res.json();

    return NextResponse.json({
      url: photo.urls.regular,
      thumbUrl: photo.urls.thumb,
      color: photo.color,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      photoUrl: photo.links.html,
      alt: photo.alt_description ?? 'Unsplash photo',
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 500 });
  }
}
