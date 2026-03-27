import { NextResponse } from 'next/server';

// Proxy Google Fonts CSS to get TTF URLs (opentype.js can't parse woff2)
// The server-side fetch uses a simple User-Agent that triggers TTF response

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const family = searchParams.get('family');
  if (!family) return NextResponse.json({ error: 'Missing family param' }, { status: 400 });

  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&display=swap`;
    const res = await fetch(cssUrl, {
      headers: {
        // This User-Agent triggers TTF response instead of woff2
        'User-Agent': 'Mozilla/4.0 (compatible; MSIE 8.0)',
      },
    });

    const css = await res.text();
    const match = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);

    if (!match) return NextResponse.json({ error: 'No font URL found' }, { status: 404 });

    return NextResponse.json({ url: match[1] });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch font CSS' }, { status: 500 });
  }
}
