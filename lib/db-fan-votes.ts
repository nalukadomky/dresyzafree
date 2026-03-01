import { supabaseAdmin } from './supabase-server';
import { supabase } from './supabase';

const client = supabaseAdmin ?? supabase;

export interface FanVoteResult {
  playerId: string;
  playerName: string;
  voteCount: number;
}

export const dbFanVotes = {
  submit: async (matchId: string, playerId: string, voterIdentifier: string): Promise<void> => {
    const { error } = await client!
      .from('fan_votes')
      .upsert(
        { match_id: matchId, player_id: playerId, voter_identifier: voterIdentifier },
        { onConflict: 'match_id,voter_identifier' }
      );
    if (error) throw new Error(error.message);
  },

  hasVoted: async (matchId: string, voterIdentifier: string): Promise<string | null> => {
    const { data } = await client!
      .from('fan_votes')
      .select('player_id')
      .eq('match_id', matchId)
      .eq('voter_identifier', voterIdentifier)
      .single();
    return data?.player_id || null;
  },

  getResults: async (matchId: string): Promise<FanVoteResult[]> => {
    const { data: votes } = await client!
      .from('fan_votes')
      .select('player_id')
      .eq('match_id', matchId);
    if (!votes || votes.length === 0) return [];

    const counts: Record<string, number> = {};
    for (const v of votes) {
      counts[v.player_id] = (counts[v.player_id] || 0) + 1;
    }

    const playerIds = Object.keys(counts);
    const { data: players } = await client!
      .from('players')
      .select('id, name')
      .in('id', playerIds);

    return (players || [])
      .map(p => ({
        playerId: p.id as string,
        playerName: p.name as string,
        voteCount: counts[p.id] || 0,
      }))
      .sort((a, b) => b.voteCount - a.voteCount);
  },

  getResultsForTeam: async (teamId: string): Promise<{
    matchId: string;
    date: string;
    opponent: string;
    results: FanVoteResult[];
    totalVotes: number;
  }[]> => {
    const { data: matches } = await client!
      .from('matches')
      .select('id, date, opponent')
      .eq('team_id', teamId)
      .order('date', { ascending: false });
    if (!matches || matches.length === 0) return [];

    const matchIds = matches.map(m => m.id as string);
    const { data: votes } = await client!
      .from('fan_votes')
      .select('match_id, player_id')
      .in('match_id', matchIds);
    if (!votes || votes.length === 0) return [];

    const { data: players } = await client!
      .from('players')
      .select('id, name')
      .eq('team_id', teamId);
    const playerMap = new Map((players || []).map(p => [p.id as string, p.name as string]));

    const byMatch: Record<string, Record<string, number>> = {};
    for (const v of votes) {
      const mid = v.match_id as string;
      const pid = v.player_id as string;
      if (!byMatch[mid]) byMatch[mid] = {};
      byMatch[mid][pid] = (byMatch[mid][pid] || 0) + 1;
    }

    return matches
      .filter(m => byMatch[m.id as string])
      .map(m => {
        const voteCounts = byMatch[m.id as string];
        const results = Object.entries(voteCounts)
          .map(([playerId, voteCount]) => ({
            playerId,
            playerName: playerMap.get(playerId) || 'Neznámý',
            voteCount,
          }))
          .sort((a, b) => b.voteCount - a.voteCount);
        return {
          matchId: m.id as string,
          date: m.date as string,
          opponent: (m.opponent as string) || '',
          results,
          totalVotes: results.reduce((sum, r) => sum + r.voteCount, 0),
        };
      });
  },
};
