import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { dbWebsite, type WebsiteSectionType } from '@/lib/db-website';

const VALID_TYPES: WebsiteSectionType[] = ['hero', 'team', 'events', 'contact', 'about', 'gallery', 'textblock'];

// GET — fetch a single section
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; sectionType: string } }
) {
  const user = verifyToken(request);
  if (!user || (user.type === 'team' && user.id !== params.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!VALID_TYPES.includes(params.sectionType as WebsiteSectionType)) {
    return NextResponse.json({ error: 'Neplatný typ sekce' }, { status: 400 });
  }

  try {
    const section = await dbWebsite.sections.getByType(params.id, params.sectionType as WebsiteSectionType);
    return NextResponse.json({ section });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chyba serveru';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT — create or update a section's content
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; sectionType: string } }
) {
  const user = verifyToken(request);
  if (!user || (user.type === 'team' && user.id !== params.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!VALID_TYPES.includes(params.sectionType as WebsiteSectionType)) {
    return NextResponse.json({ error: 'Neplatný typ sekce' }, { status: 400 });
  }

  try {
    const body = await request.json();
    if (!body.content || typeof body.content !== 'object') {
      return NextResponse.json({ error: 'Content je povinný' }, { status: 400 });
    }

    const section = await dbWebsite.sections.upsert(
      params.id,
      params.sectionType as WebsiteSectionType,
      body.content
    );
    return NextResponse.json({ section });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chyba serveru';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE — remove a section
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; sectionType: string } }
) {
  const user = verifyToken(request);
  if (!user || (user.type === 'team' && user.id !== params.id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!VALID_TYPES.includes(params.sectionType as WebsiteSectionType)) {
    return NextResponse.json({ error: 'Neplatný typ sekce' }, { status: 400 });
  }

  try {
    await dbWebsite.sections.delete(params.id, params.sectionType as WebsiteSectionType);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chyba serveru';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
