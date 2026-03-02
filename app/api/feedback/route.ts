import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware';
import { dbFeedback } from '@/lib/db-feedback';

export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Neautorizovaný přístup' }, { status: 401 });
    }

    const body = await request.json();
    const { teamId, featureRequest, emojiRating } = body;

    if (!teamId) {
      return NextResponse.json({ error: 'Chybí teamId' }, { status: 400 });
    }

    if (user.type === 'team' && user.id !== teamId) {
      return NextResponse.json({ error: 'Nemáte oprávnění' }, { status: 403 });
    }

    if (!featureRequest?.trim() && !emojiRating) {
      return NextResponse.json({ error: 'Vyplňte alespoň jednu položku' }, { status: 400 });
    }

    if (emojiRating !== undefined && emojiRating !== null) {
      const rating = Number(emojiRating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return NextResponse.json({ error: 'Hodnocení musí být 1–5' }, { status: 400 });
      }
    }

    await dbFeedback.submit(
      teamId,
      featureRequest?.trim() || null,
      emojiRating ? Number(emojiRating) : null
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chyba serveru';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
