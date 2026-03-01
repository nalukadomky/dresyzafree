import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { dbWebsite } from '@/lib/db-website';

// GET — fetch website config + all sections
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyToken(request);
  if (!user || (user.type === 'team' && user.id !== params.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [website, sections] = await Promise.all([
      dbWebsite.website.getByTeamId(params.id),
      dbWebsite.sections.getAllByTeamId(params.id),
    ]);

    return NextResponse.json({ website, sections });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chyba serveru';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT — create or update website config
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyToken(request);
  if (!user || (user.type === 'team' && user.id !== params.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.published === 'boolean') updates.published = body.published;
    if (typeof body.primaryColor === 'string') updates.primaryColor = body.primaryColor;
    if (typeof body.secondaryColor === 'string') updates.secondaryColor = body.secondaryColor;
    if (Array.isArray(body.sectionOrder)) {
      const valid = ['hero', 'team', 'events', 'contact', 'about', 'gallery', 'textblock'];
      const filtered = body.sectionOrder.filter((s: string) => valid.includes(s));
      updates.sectionOrder = filtered;
    }

    const website = await dbWebsite.website.upsert(params.id, updates);
    return NextResponse.json({ website });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chyba serveru';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
