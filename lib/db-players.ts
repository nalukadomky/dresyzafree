import { supabaseAdmin } from './supabase-server';
import { supabase } from './supabase';

const client = supabaseAdmin ?? supabase;
if (!client) {
  console.warn('Supabase není nakonfigurován. Nastavte NEXT_PUBLIC_SUPABASE_URL a (NEXT_PUBLIC_SUPABASE_ANON_KEY nebo SUPABASE_SERVICE_ROLE_KEY) v .env.local nebo v proměnných prostředí Vercelu.');
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  jerseyNumber?: number;
  photoUrl?: string;
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
  scoredAt?: string;
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
  jerseyNumber: row.jersey_number || undefined,
  photoUrl: row.photo_url || undefined,
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
  scoredAt: row.scored_at || undefined,
  createdAt: row.created_at,
});

export const dbPlayers = {
  players: {
    getByTeamId: async (teamId: string): Promise<Player[]> => {
      const { data, error } = await client!
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .order('name');
      if (error) throw new Error(error.message);
      return (data || []).map(mapPlayer);
    },
    getById: async (id: string, teamId: string): Promise<Player | null> => {
      const { data, error } = await client!
        .from('players')
        .select('*')
        .eq('id', id)
        .eq('team_id', teamId)
        .single();
      if (error || !data) return null;
      return mapPlayer(data);
    },
    add: async (teamId: string, name: string): Promise<Player> => {
      const { data, error } = await client!
        .from('players')
        .insert({ team_id: teamId, name: name.trim() })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapPlayer(data);
    },
    delete: async (id: string, teamId: string): Promise<boolean> => {
      const { error } = await client!
        .from('players')
        .delete()
        .eq('id', id)
        .eq('team_id', teamId);
      if (error) throw new Error(error.message);
      return true;
    },
    updatePhoto: async (id: string, teamId: string, photoUrl: string): Promise<Player | null> => {
      const { data, error } = await client!
        .from('players')
        .update({ photo_url: photoUrl })
        .eq('id', id)
        .eq('team_id', teamId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data ? mapPlayer(data) : null;
    },
    clearPhoto: async (id: string, teamId: string): Promise<Player | null> => {
      const { data, error } = await client!
        .from('players')
        .update({ photo_url: null })
        .eq('id', id)
        .eq('team_id', teamId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data ? mapPlayer(data) : null;
    },
    updateJerseyNumber: async (id: string, teamId: string, jerseyNumber: number | null): Promise<Player | null> => {
      const { data, error } = await client!
        .from('players')
        .update({ jersey_number: jerseyNumber })
        .eq('id', id)
        .eq('team_id', teamId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data ? mapPlayer(data) : null;
    },
  },
  matches: {
    getByTeamId: async (teamId: string): Promise<Match[]> => {
      const { data, error } = await client!
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
      const { data, error } = await client!
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
          scored_at: (goalsFor != null && goalsAgainst != null) ? new Date().toISOString() : null,
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
      if ('goalsFor' in updates || 'goalsAgainst' in updates) {
        toUpdate.scored_at = new Date().toISOString();
      }
      if (Object.keys(toUpdate).length === 0) return null;
      const { data, error } = await client!
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
      const { error } = await client!
        .from('matches')
        .delete()
        .eq('id', id)
        .eq('team_id', teamId);
      if (error) throw new Error(error.message);
      return true;
    },
  },
  matchScorers: {
    getScorers: async (matchId: string): Promise<{ goalOrder: number; playerId: string }[]> => {
      const { data, error } = await client!
        .from('match_goal_scorers')
        .select('goal_order, player_id')
        .eq('match_id', matchId)
        .order('goal_order');
      if (error) throw new Error(error.message);
      return (data || []).map((r: { goal_order: number; player_id: string }) => ({
        goalOrder: r.goal_order,
        playerId: r.player_id,
      }));
    },
    getAssists: async (matchId: string): Promise<{ assistOrder: number; playerId: string }[]> => {
      const { data, error } = await client!
        .from('match_assists')
        .select('assist_order, player_id')
        .eq('match_id', matchId)
        .order('assist_order');
      if (error) throw new Error(error.message);
      return (data || []).map((r: { assist_order: number; player_id: string }) => ({
        assistOrder: r.assist_order,
        playerId: r.player_id,
      }));
    },
    setScorersAndAssists: async (
      matchId: string,
      teamId: string,
      scorers: { goalOrder: number; playerId: string }[],
      assists: { assistOrder: number; playerId: string }[]
    ): Promise<void> => {
      const match = await client!.from('matches').select('team_id').eq('id', matchId).eq('team_id', teamId).single();
      if (match.error || !match.data) throw new Error('Zápas nenalezen');
      await client!.from('match_goal_scorers').delete().eq('match_id', matchId);
      await client!.from('match_assists').delete().eq('match_id', matchId);
      if (scorers.length > 0) {
        const rows = scorers.map((s) => ({ match_id: matchId, player_id: s.playerId, goal_order: s.goalOrder }));
        const { error: e1 } = await client!!.from('match_goal_scorers').insert(rows);
        if (e1) throw new Error(e1.message);
      }
      if (assists.length > 0) {
        const rows = assists.map((a) => ({ match_id: matchId, player_id: a.playerId, assist_order: a.assistOrder }));
        const { error: e2 } = await client!!.from('match_assists').insert(rows);
        if (e2) throw new Error(e2.message);
      }
    },
    getCards: async (matchId: string): Promise<{ playerId: string; cardType: string }[]> => {
      const { data, error } = await client!
        .from('match_cards')
        .select('player_id, card_type')
        .eq('match_id', matchId)
        .order('created_at');
      if (error) throw new Error(error.message);
      return (data || []).map((r: { player_id: string; card_type: string }) => ({
        playerId: r.player_id,
        cardType: r.card_type,
      }));
    },
    setCards: async (
      matchId: string,
      teamId: string,
      cards: { playerId: string; cardType: string }[]
    ): Promise<void> => {
      const match = await client!.from('matches').select('team_id').eq('id', matchId).eq('team_id', teamId).single();
      if (match.error || !match.data) throw new Error('Zápas nenalezen');
      await client!.from('match_cards').delete().eq('match_id', matchId);
      if (cards.length > 0) {
        const rows = cards.map((c) => ({ match_id: matchId, player_id: c.playerId, card_type: c.cardType }));
        const { error: e } = await client!.from('match_cards').insert(rows);
        if (e) throw new Error(e.message);
      }
    },
    /** Kanadské bodování: góly + asistence (1 asistence = 1b), seřazeno podle součtu */
    getCanadianScoring: async (
      teamId: string,
      options?: { season?: string }
    ): Promise<{ playerId: string; playerName: string; goals: number; assists: number; yellowCards: number; redCards: number; total: number }[]> => {
      const matchesRes = await client!.from('matches').select('id, date').eq('team_id', teamId);
      let matchIds = (matchesRes.data || []).map((m: { id: string }) => m.id);
      const matchesWithDate = (matchesRes.data || []) as { id: string; date: string }[];
      if (options?.season) {
        matchIds = matchesWithDate
          .filter((m) => {
            const d = new Date(m.date);
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            const s = month >= 7 ? `${year}/${String(year + 1).slice(-2)}` : `${year - 1}/${String(year).slice(-2)}`;
            return s === options.season;
          })
          .map((m) => m.id);
      }
      if (matchIds.length === 0) return [];
      const [scorersRes, assistsRes, cardsRes, playersRes] = await Promise.all([
        client!.from('match_goal_scorers').select('player_id').in('match_id', matchIds),
        client!.from('match_assists').select('player_id').in('match_id', matchIds),
        client!.from('match_cards').select('player_id, card_type').in('match_id', matchIds),
        client!.from('players').select('id, name').eq('team_id', teamId),
      ]);
      const players = (playersRes.data || []) as { id: string; name: string }[];
      const byPlayer: Record<string, { goals: number; assists: number; yellowCards: number; redCards: number }> = {};
      for (const p of players) byPlayer[p.id] = { goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
      for (const r of scorersRes.data || []) {
        const row = r as { player_id: string };
        if (byPlayer[row.player_id]) byPlayer[row.player_id].goals += 1;
      }
      for (const r of assistsRes.data || []) {
        const row = r as { player_id: string };
        if (byPlayer[row.player_id]) byPlayer[row.player_id].assists += 1;
      }
      for (const r of cardsRes.data || []) {
        const row = r as { player_id: string; card_type: string };
        if (byPlayer[row.player_id]) {
          if (row.card_type === 'yellow') byPlayer[row.player_id].yellowCards += 1;
          else if (row.card_type === 'red') byPlayer[row.player_id].redCards += 1;
        }
      }
      return players
        .map((p) => {
          const d = byPlayer[p.id];
          return {
            playerId: p.id,
            playerName: p.name,
            goals: d?.goals ?? 0,
            assists: d?.assists ?? 0,
            yellowCards: d?.yellowCards ?? 0,
            redCards: d?.redCards ?? 0,
            total: (d?.goals ?? 0) + (d?.assists ?? 0),
          };
        })
        .filter((x) => x.total > 0 || x.yellowCards > 0 || x.redCards > 0)
        .sort((a, b) => b.total - a.total || b.goals - a.goals || b.assists - a.assists);
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

      // Každý hráč může hlasovat jen jednou – po odeslání nelze měnit
      const alreadyVoted = await dbPlayers.ratings.hasVoted(matchId, voterPlayerId);
      if (alreadyVoted) {
        throw new Error('Už jste pro tento zápas hlasoval. Hodnocení nelze měnit.');
      }

      // Vložit (percentage sloupec ukládá skóre 0-10, 0 = nebyl nasazen)
      const rows = ratings.map((r) => ({
        match_id: matchId,
        voter_player_id: voterPlayerId,
        rated_player_id: r.ratedPlayerId,
        percentage: Math.round(Math.min(10, Math.max(0, r.percentage))),
      }));
      const { error } = await client!!.from('ratings').insert(rows);
      if (error) throw new Error(error.message);
    },
    getLeaderboard: async (
      teamId: string,
      coachPlayerId?: string | null,
      options?: { matchId?: string; season?: string }
    ): Promise<{ playerId: string; playerName: string; avgScore: number; voteCount: number }[]> => {
      const matchesRes = await client!.from('matches').select('id, date').eq('team_id', teamId);
      let matchIds = (matchesRes.data || []).map((m) => m.id);
      const matchesWithDate = (matchesRes.data || []) as { id: string; date: string }[];

      if (options?.matchId) {
        matchIds = matchIds.includes(options.matchId) ? [options.matchId] : [];
      } else if (options?.season) {
        matchIds = matchesWithDate
          .filter((m) => {
            const d = new Date(m.date);
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            const s = month >= 7 ? `${year}/${String(year + 1).slice(-2)}` : `${year - 1}/${String(year).slice(-2)}`;
            return s === options.season;
          })
          .map((m) => m.id);
      }
      if (matchIds.length === 0) return [];

      const { data: ratings } = await client!
        .from('ratings')
        .select('match_id, rated_player_id, voter_player_id, percentage')
        .in('match_id', matchIds);
      const { data: players } = await client!!.from('players').select('id, name').eq('team_id', teamId);
      if (!ratings || !players) return [];

      // Pro každé (match_id, rated_player_id) spočítat počet ne-trenérských hlasů
      const nonCoachCount: Record<string, number> = {};
      for (const r of ratings) {
        if (r.percentage <= 0) continue;
        const key = `${r.match_id}:${r.rated_player_id}`;
        const isCoach = coachPlayerId && r.voter_player_id === coachPlayerId;
        if (!nonCoachCount[key]) nonCoachCount[key] = 0;
        if (!isCoach) nonCoachCount[key] += 1;
      }

      const byPlayer: Record<string, { weightedSum: number; totalWeight: number }> = {};
      for (const p of players) {
        byPlayer[p.id] = { weightedSum: 0, totalWeight: 0 };
      }
      for (const r of ratings) {
        if (r.percentage <= 0 || !byPlayer[r.rated_player_id]) continue;
        const key = `${r.match_id}:${r.rated_player_id}`;
        const n = nonCoachCount[key] ?? 0;
        const isCoach = coachPlayerId && r.voter_player_id === coachPlayerId;
        const weight = isCoach ? 1.3 * n : 1;
        byPlayer[r.rated_player_id].weightedSum += r.percentage * weight;
        byPlayer[r.rated_player_id].totalWeight += weight;
      }
      return players
        .map((p) => {
          const d = byPlayer[p.id];
          const voteCount = d?.totalWeight ? Math.round(d.totalWeight) : 0;
          return {
            playerId: p.id,
            playerName: p.name,
            avgScore: d?.totalWeight
              ? Math.round((d.weightedSum / d.totalWeight) * 10) / 10
              : 0,
            voteCount,
          };
        })
        .filter((x) => x.voteCount > 0)
        .sort((a, b) => b.avgScore - a.avgScore);
    },
    /** Hráč utkání = hráč s nejvyšším průměrným hodnocením od spoluhráčů a trenéra */
    getPlayerOfMatchForMatches: async (
      teamId: string,
      coachPlayerId: string | null,
      matchIds: string[]
    ): Promise<Record<string, { playerId: string; playerName: string }>> => {
      const result: Record<string, { playerId: string; playerName: string }> = {};
      for (const matchId of matchIds) {
        const leaderboard = await dbPlayers.ratings.getLeaderboard(teamId, coachPlayerId ?? undefined, { matchId });
        const top = leaderboard[0];
        if (top) result[matchId] = { playerId: top.playerId, playerName: top.playerName };
      }
      return result;
    },
    hasVoted: async (matchId: string, voterPlayerId: string): Promise<boolean> => {
      const { data } = await client!!
        .from('ratings')
        .select('id')
        .eq('match_id', matchId)
        .eq('voter_player_id', voterPlayerId)
        .limit(1);
      return (data?.length || 0) > 0;
    },
    /** Per-match average ratings for a single player */
    getPlayerRatings: async (
      teamId: string,
      playerId: string,
      coachPlayerId?: string | null
    ): Promise<{ matchId: string; date: string; opponent: string; avgScore: number; voteCount: number }[]> => {
      const { data: matches } = await client!
        .from('matches')
        .select('id, date, opponent')
        .eq('team_id', teamId)
        .order('date', { ascending: false });
      if (!matches || matches.length === 0) return [];

      const matchIds = matches.map((m) => m.id);
      const { data: ratings } = await client!
        .from('ratings')
        .select('match_id, voter_player_id, percentage')
        .eq('rated_player_id', playerId)
        .in('match_id', matchIds);
      if (!ratings || ratings.length === 0) return [];

      const matchMap = new Map(matches.map((m) => [m.id, m]));
      const byMatch: Record<string, { weightedSum: number; totalWeight: number }> = {};

      // Count non-coach votes per match
      const nonCoachCount: Record<string, number> = {};
      for (const r of ratings) {
        if (r.percentage <= 0) continue;
        if (!nonCoachCount[r.match_id]) nonCoachCount[r.match_id] = 0;
        const isCoach = coachPlayerId && r.voter_player_id === coachPlayerId;
        if (!isCoach) nonCoachCount[r.match_id] += 1;
      }

      for (const r of ratings) {
        if (r.percentage <= 0) continue;
        if (!byMatch[r.match_id]) byMatch[r.match_id] = { weightedSum: 0, totalWeight: 0 };
        const isCoach = coachPlayerId && r.voter_player_id === coachPlayerId;
        const n = nonCoachCount[r.match_id] ?? 0;
        const weight = isCoach ? 1.3 * n : 1;
        byMatch[r.match_id].weightedSum += r.percentage * weight;
        byMatch[r.match_id].totalWeight += weight;
      }

      return Object.entries(byMatch)
        .map(([matchId, d]) => {
          const m = matchMap.get(matchId);
          return {
            matchId,
            date: m?.date ?? '',
            opponent: m?.opponent ?? '',
            avgScore: Math.round((d.weightedSum / d.totalWeight) * 10) / 10,
            voteCount: Math.round(d.totalWeight),
          };
        })
        .sort((a, b) => b.date.localeCompare(a.date));
    },
  },

  fanVotes: {
    submit: async (matchId: string, teamId: string, playerId: string, voterIp: string, voterName?: string): Promise<void> => {
      const { error } = await client!
        .from('match_fan_votes')
        .insert({
          match_id: matchId,
          team_id: teamId,
          player_id: playerId,
          voter_ip: voterIp,
          voter_name: voterName?.trim() || null,
        });
      if (error) {
        if (error.code === '23505') {
          throw new Error('Už jste pro tento zápas hlasoval/a.');
        }
        throw new Error(error.message);
      }
    },

    getVoteCounts: async (matchId: string): Promise<{ playerId: string; voteCount: number }[]> => {
      const { data, error } = await client!
        .from('match_fan_votes')
        .select('player_id')
        .eq('match_id', matchId);
      if (error) throw new Error(error.message);
      const counts: Record<string, number> = {};
      for (const row of (data || []) as { player_id: string }[]) {
        counts[row.player_id] = (counts[row.player_id] || 0) + 1;
      }
      return Object.entries(counts)
        .map(([playerId, voteCount]) => ({ playerId, voteCount }))
        .sort((a, b) => b.voteCount - a.voteCount);
    },

    hasVotedByIp: async (matchId: string, voterIp: string): Promise<boolean> => {
      const { data } = await client!
        .from('match_fan_votes')
        .select('id')
        .eq('match_id', matchId)
        .eq('voter_ip', voterIp)
        .limit(1);
      return (data?.length || 0) > 0;
    },
  },
};
