import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { dbWebsite, isValidSlug } from '@/lib/db-website';

// PUT — set or update the team's website slug
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyToken(request);
  if (!user || (user.type === 'team' && user.id !== params.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const slug = (body.slug || '').trim().toLowerCase();

    if (!slug) {
      return NextResponse.json({ error: 'Slug je povinný' }, { status: 400 });
    }

    if (!isValidSlug(slug)) {
      return NextResponse.json(
        { error: 'Slug může obsahovat pouze malá písmena, čísla a pomlčky (3-50 znaků)' },
        { status: 400 }
      );
    }

    const available = await dbWebsite.slug.isSlugAvailable(slug, params.id);
    if (!available) {
      return NextResponse.json({ error: 'Tento slug je už obsazený' }, { status: 409 });
    }

    await dbWebsite.slug.setSlug(params.id, slug);
    return NextResponse.json({ slug });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chyba serveru';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
