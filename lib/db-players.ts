import { supabaseAdmin } from './supabase-server';
import { supabase } from './supabase';

const client = supabaseAdmin ?? supabase;
if (!client) {
  throw new Error('Supabase není nakonfigurován. Nastavte NEXT_PUBLIC_SUPABASE_URL a (NEXT_PUBLIC_SUPABASE_ANON_KEY nebo SUPABASE_SERVICE_ROLE_KEY) v .env.local');
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  createdAt: string;
}

export interface Match {
  id: string;
  teamId: string;
  date: string;
  opponent?: string;
  name?: string;
  result?: string;
  goalsFor?: number;
  goalsAgainst?: number;
  startTime?: string;
  createdAt: string;
}

export interface Rating {
  id: string;
  matchId: string;
  voterPlayerId: string;
  ratedPlayerId: string;
  percentage: number;
  createdAt: string;
}

const mapPlayer = (row: any): Player => ({
  id: row.id,
  teamId: row.team_id,
  name: row.name,
  createdAt: row.created_at,
});

const mapMatch = (row: any): Match => ({
  id: row.id,
  teamId: row.team_id,
  date: row.date,
  opponent: row.opponent,
  name: row.name,
  result: row.result,
  goalsFor: row.goals_for,
  goalsAgainst: row.goals_against,
  startTime: row.start_time || undefined,
  createdAt: row.created_at,
});

export const dbPlayers = {
  players: {
    getByTeamId: async (teamId: string): Promise<Player[]> => {
      const { data, error } = await client
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .order('name');
      if (error) throw new Error(error.message);
      return (data || []).map(mapPlayer);
    },
    add: async (teamId: string, name: string): Promise<Player> => {
      const { data, error } = await client
        .from('players')
        .insert({ team_id: teamId, name: name.trim() })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapPlayer(data);
    },
    delete: async (id: string, teamId: string): Promise<boolean> => {
      const { error } = await client
        .from('players')
        .delete()
        .eq('id', id)
        .eq('team_id', teamId);
      if (error) throw new Error(error.message);
      return true;
    },
  },
  matches: {
    getByTeamId: async (teamId: string): Promise<Match[]> => {
      const { data, error } = await client
        .from('matches')
        .select('*')
        .eq('team_id', teamId)
        .order('date', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(mapMatch);
    },
    add: async (
      teamId: string,
      date: string,
      opponent?: string,
      name?: string,
      result?: string,
      goalsFor?: number,
      goalsAgainst?: number,
      startTime?: string
    ): Promise<Match> => {
      const { data, error } = await client
        .from('matches')
        .insert({
          team_id: teamId,
          date,
          opponent: opponent?.trim() || null,
          name: name?.trim() || null,
          result: result?.trim() || null,
          goals_for: goalsFor ?? null,
          goals_against: goalsAgainst ?? null,
          start_time: (startTime?.trim() && /^\d{1,2}:\d{2}$/.test(startTime.trim())) ? startTime.trim() : null,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapMatch(data);
    },
    update: async (
      matchId: string,
      teamId: string,
      updates: { result?: string; goalsFor?: number; goalsAgainst?: number }
    ): Promise<Match | null> => {
      const toUpdate: Record<string, unknown> = {};
      if ('result' in updates) toUpdate.result = (updates.result ?? '').trim() || null;
      if ('goalsFor' in updates) toUpdate.goals_for = updates.goalsFor ?? null;
      if ('goalsAgainst' in updates) toUpdate.goals_against = updates.goalsAgainst ?? null;
      if (Object.keys(toUpdate).length === 0) return null;
      const { data, error } = await client
        .from('matches')
        .update(toUpdate)
        .eq('id', matchId)
        .eq('team_id', teamId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data ? mapMatch(data) : null;
    },
    delete: async (id: string, teamId: string): Promise<boolean> => {
      const { error } = await client
        .from('matches')
        .delete()
        .eq('id', id)
        .eq('team_id', teamId);
      if (error) throw new Error(error.message);
      return true;
    },
  },
  ratings: {
    submit: async (
      matchId: string,
      voterPlayerId: string,
      ratings: { ratedPlayerId: string; percentage: number }[]
    ): Promise<void> => {
      for (const r of ratings) {
        if (r.ratedPlayerId === voterPlayerId) throw new Error('Nelze hodnotit sám sebe');
        const score = Math.round(r.percentage);
        if (score < 0 || score > 10) throw new Error('Hodnocení musí být 0–10 (0 = nebyl nasazen)');
      }

      // Smazat stará hodnocení tohoto hráče pro tento zápas
      await client
        .from('ratings')
        .delete()
        .eq('match_id', matchId)
        .eq('voter_player_id', voterPlayerId);

      // Vložit nová (percentage sloupec ukládá skóre 0-10, 0 = nebyl nasazen)
      const rows = ratings.map((r) => ({
        match_id: matchId,
        voter_player_id: voterPlayerId,
        rated_player_id: r.ratedPlayerId,
        percentage: Math.round(Math.min(10, Math.max(0, r.percentage))),
      }));
      const { error } = await client.from('ratings').insert(rows);
      if (error) throw new Error(error.message);
    },
    getLeaderboard: async (teamId: string): Promise<{ playerId: string; playerName: string; avgScore: number; voteCount: number }[]> => {
      const matchesRes = await client.from('matches').select('id').eq('team_id', teamId);
      const matchIds = (matchesRes.data || []).map((m) => m.id);
      if (matchIds.length === 0) return [];

      const { data: ratings } = await client
        .from('ratings')
        .select('rated_player_id, percentage')
        .in('match_id', matchIds);
      const { data: players } = await client.from('players').select('id, name').eq('team_id', teamId);
      if (!ratings || !players) return [];

      const byPlayer: Record<string, { sum: number; count: number }> = {};
      for (const p of players) {
        byPlayer[p.id] = { sum: 0, count: 0 };
      }
      for (const r of ratings) {
        if (byPlayer[r.rated_player_id] && r.percentage > 0) {
          // 0 = nebyl nasazen, nepočítá do průměru
          byPlayer[r.rated_player_id].sum += r.percentage;
          byPlayer[r.rated_player_id].count += 1;
        }
      }
      return players
        .map((p) => ({
          playerId: p.id,
          playerName: p.name,
          avgScore: byPlayer[p.id]?.count
            ? Math.round((byPlayer[p.id].sum / byPlayer[p.id].count) * 10) / 10
            : 0,
          voteCount: byPlayer[p.id]?.count || 0,
        }))
        .filter((x) => x.voteCount > 0)
        .sort((a, b) => b.avgScore - a.avgScore);
    },
    hasVoted: async (matchId: string, voterPlayerId: string): Promise<boolean> => {
      const { data } = await client
        .from('ratings')
        .select('id')
        .eq('match_id', matchId)
        .eq('voter_player_id', voterPlayerId)
        .limit(1);
      return (data?.length || 0) > 0;
    },
  },
};
