import { NextRequest, NextResponse } from 'next/server';
import { dbWebsite } from '@/lib/db-website';
import { dbFanVotes } from '@/lib/db-fan-votes';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const teamId = await dbWebsite.slug.getTeamIdBySlug(params.slug);
    if (!teamId) {
      return NextResponse.json({ error: 'Tým nenalezen' }, { status: 404 });
    }

    const { matchId, playerId, voterIdentifier } = await request.json();
    if (!matchId || !playerId || !voterIdentifier) {
      return NextResponse.json({ error: 'Chybí povinné parametry' }, { status: 400 });
    }

    if (typeof voterIdentifier !== 'string' || voterIdentifier.length < 8 || voterIdentifier.length > 128) {
      return NextResponse.json({ error: 'Neplatný identifikátor' }, { status: 400 });
    }

    await dbFanVotes.submit(matchId, playerId, voterIdentifier);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chyba serveru';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const teamId = await dbWebsite.slug.getTeamIdBySlug(params.slug);
    if (!teamId) {
      return NextResponse.json({ error: 'Tým nenalezen' }, { status: 404 });
    }

    const matchId = request.nextUrl.searchParams.get('matchId');
    if (!matchId) {
      return NextResponse.json({ error: 'matchId je povinné' }, { status: 400 });
    }

    const voterIdentifier = request.nextUrl.searchParams.get('voterId') || '';
    const results = await dbFanVotes.getResults(matchId);
    const votedFor = voterIdentifier
      ? await dbFanVotes.hasVoted(matchId, voterIdentifier)
      : null;

    return NextResponse.json({ results, votedFor }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chyba serveru';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
