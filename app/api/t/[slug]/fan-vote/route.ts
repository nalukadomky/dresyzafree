import { NextRequest, NextResponse } from 'next/server';
import { dbWebsite } from '@/lib/db-website';
import { dbFanVotes } from '@/lib/db-fan-votes';
import { supabaseAdmin } from '@/lib/supabase-server';
import { supabase } from '@/lib/supabase';

const VOTING_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

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

    // Server-side 48h voting window validation
    const client = supabaseAdmin ?? supabase;
    const { data: match } = await client!
      .from('matches')
      .select('date, start_time')
      .eq('id', matchId)
      .single();

    if (match) {
      const base = match.start_time
        ? new Date(`${match.date}T${match.start_time}:00`)
        : new Date(`${match.date}T23:59:59`);
      const deadline = new Date(base.getTime() + VOTING_WINDOW_MS);
      if (Date.now() > deadline.getTime()) {
        return NextResponse.json(
          { error: 'Hlasování pro tento zápas již skončilo' },
          { status: 403 }
        );
      }
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
