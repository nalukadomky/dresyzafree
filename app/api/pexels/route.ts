import { NextRequest, NextResponse } from 'next/server';

const PEXELS_KEY = process.env.PEXELS_API_KEY || '';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query') || '';
  const perPage = req.nextUrl.searchParams.get('per_page') || '30';

  if (!PEXELS_KEY) {
    return NextResponse.json(
      { error: 'Pexels API key not configured' },
      { status: 500 }
    );
  }

  if (!query.trim()) {
    return NextResponse.json({ photos: [] });
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape&locale=cs-CZ`,
      {
        headers: { Authorization: PEXELS_KEY },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Pexels API error', status: res.status },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ photos: data.photos || [] });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch from Pexels' },
      { status: 500 }
    );
  }
}
