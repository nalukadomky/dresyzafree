import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { dbWebsite } from '@/lib/db-website';
import { db } from '@/lib/db-supabase';

// POST — toggle published state
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyToken(request);
  if (!user || (user.type === 'team' && user.id !== params.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const published = !!body.published;

    // If publishing, verify slug exists
    if (published) {
      const team = await db.teams.getById(params.id);
      if (!team?.websiteSlug) {
        return NextResponse.json(
          { error: 'Nejdřív nastavte URL adresu webu (slug)' },
          { status: 400 }
        );
      }
    }

    await dbWebsite.website.setPublished(params.id, published);
    return NextResponse.json({ published });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chyba serveru';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
