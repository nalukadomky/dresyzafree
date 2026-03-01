import { NextRequest, NextResponse } from 'next/server';
import { dbWebsite } from '@/lib/db-website';

export const dynamic = 'force-dynamic';

// GET — public website data (no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const data = await dbWebsite.getPublicWebsite(params.slug);

    if (!data) {
      return NextResponse.json({ error: 'Web nenalezen' }, { status: 404 });
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chyba serveru';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
