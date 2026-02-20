import { supabaseAdmin } from './supabase-server';
import { supabase } from './supabase';

const client = supabaseAdmin ?? supabase;
if (!client) {
  console.warn('Supabase není nakonfigurován. Nastavte NEXT_PUBLIC_SUPABASE_URL a (NEXT_PUBLIC_SUPABASE_ANON_KEY nebo SUPABASE_SERVICE_ROLE_KEY) v .env.local nebo v proměnných prostředí Vercelu.');
}

export type EventType = 'training' | 'friendly_match' | 'competitive_match';

export interface Event {
  id: string;
  teamId: string;
  date: string;
  eventType: EventType;
  location?: string;
  opponent?: string;
  startTime?: string;
  note?: string;
  createdAt: string;
  shareToken?: string;
  attendanceFinalizedAt?: string;
}

export interface EventWithAttendance extends Event {
  attendance: { playerId: string; attended: boolean }[];
}

/** Odpovědi se uzavírají den před událostí do půlnoci. Vrací true, pokud už nelze měnit účast. (Pro veřejný odkaz.) */
export function isAttendanceClosed(eventDateStr: string): boolean {
  const eventDate = new Date(eventDateStr + 'T12:00:00');
  const deadline = new Date(eventDate);
  deadline.setDate(deadline.getDate() - 1);
  deadline.setHours(0, 0, 0, 0);
  return new Date() >= deadline;
}

/** Dashboard docházka: lze měnit jen od 15 min před začátkem události. Vrací false, pokud je příliš brzy. */
export function canEditDashboardAttendance(event: { date: string; startTime?: string }): boolean {
  const now = new Date();
  let eventStart: Date;
  if (event.startTime && /^\d{1,2}:\d{2}$/.test(event.startTime.trim())) {
    eventStart = new Date(event.date + 'T' + event.startTime.trim() + ':00');
  } else {
    eventStart = new Date(event.date + 'T00:00:00');
  }
  const editFrom = new Date(eventStart.getTime() - 15 * 60 * 1000);
  return now >= editFrom;
}

/** Dashboard docházka: je odeslána finálně a nelze ji měnit. */
export function isAttendanceFinalized(event: { attendanceFinalizedAt?: string | null }): boolean {
  return !!event.attendanceFinalizedAt;
}

const mapEvent = (row: Record<string, unknown>): Event => ({
  id: row.id as string,
  teamId: row.team_id as string,
  date: row.date as string,
  eventType: row.event_type as EventType,
  location: (row.location as string) || undefined,
  opponent: (row.opponent as string) || undefined,
  startTime: (row.start_time as string) || undefined,
  note: (row.note as string) || undefined,
  createdAt: row.created_at as string,
  shareToken: (row.share_token as string) || undefined,
  attendanceFinalizedAt: (row.attendance_finalized_at as string) || undefined,
});

export const dbEvents = {
  events: {
    getByTeamId: async (teamId: string): Promise<Event[]> => {
      const { data, error } = await client!
        .from('events')
        .select('*')
        .eq('team_id', teamId)
        .order('date', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map((r) => mapEvent(r));
    },

    add: async (
      teamId: string,
      date: string,
      eventType: EventType,
      location?: string,
      opponent?: string,
      startTime?: string,
      note?: string
    ): Promise<Event> => {
      const baseRow = {
        team_id: teamId,
        date,
        event_type: eventType,
        location: location?.trim() || null,
        opponent: opponent?.trim() || null,
        start_time: (startTime?.trim() && /^\d{1,2}:\d{2}$/.test(startTime.trim())) ? startTime.trim() : null,
        note: note?.trim() || null,
      };
      let { data, error } = await client!
        .from('events')
        .insert({ ...baseRow, share_token: crypto.randomUUID() })
        .select()
        .single();
      if (error?.message?.includes('share_token') || error?.message?.includes('does not exist')) {
        const fallback = await client!.from('events').insert(baseRow).select().single();
        if (fallback.error) throw new Error(fallback.error.message);
        data = fallback.data;
      } else if (error) {
        throw new Error(error.message);
      }
      return mapEvent(data);
    },

    getById: async (eventId: string, teamId: string): Promise<Event | null> => {
      const { data, error } = await client!
        .from('events')
        .select('*')
        .eq('id', eventId)
        .eq('team_id', teamId)
        .single();
      if (error || !data) return null;
      return mapEvent(data);
    },

    getByShareToken: async (shareToken: string): Promise<Event | null> => {
      const { data, error } = await client!
        .from('events')
        .select('*')
        .eq('share_token', shareToken)
        .single();
      if (error || !data) return null;
      return mapEvent(data);
    },

    delete: async (eventId: string, teamId: string): Promise<boolean> => {
      const { error } = await client!
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('team_id', teamId);
      if (error) throw new Error(error.message);
      return true;
    },

    finalizeAttendance: async (eventId: string, teamId: string): Promise<void> => {
      const { error } = await client!
        .from('events')
        .update({ attendance_finalized_at: new Date().toISOString() })
        .eq('id', eventId)
        .eq('team_id', teamId);
      if (error) throw new Error(error.message);
    },
  },

  attendance: {
    getByEventId: async (eventId: string): Promise<{ playerId: string; attended: boolean; absenceReason?: string }[]> => {
      const { data, error } = await client!
        .from('event_attendance')
        .select('player_id, attended, absence_reason')
        .eq('event_id', eventId);
      if (error) throw new Error(error.message);
      return (data || []).map((r: { player_id: string; attended: boolean; absence_reason?: string }) => ({
        playerId: r.player_id,
        attended: r.attended,
        absenceReason: r.absence_reason || undefined,
      }));
    },

    getSummaryForEvents: async (
      teamId: string,
      eventIds: string[]
    ): Promise<Record<string, { attended: number; notAttended: number; noResponse: number }>> => {
      if (eventIds.length === 0) return {};
      const [playersRes, attendanceRes] = await Promise.all([
        client!.from('players').select('id').eq('team_id', teamId),
        client!
          .from('event_attendance')
          .select('event_id, attended')
          .in('event_id', eventIds),
      ]);
      const playerCount = (playersRes.data || []).length;
      const attendance = (attendanceRes.data || []) as { event_id: string; attended: boolean }[];
      const byEvent: Record<string, { attended: number; notAttended: number }> = {};
      for (const eid of eventIds) byEvent[eid] = { attended: 0, notAttended: 0 };
      for (const a of attendance) {
        if (a.attended) byEvent[a.event_id].attended += 1;
        else byEvent[a.event_id].notAttended += 1;
      }
      const result: Record<string, { attended: number; notAttended: number; noResponse: number }> = {};
      for (const eid of eventIds) {
        const { attended, notAttended } = byEvent[eid];
        result[eid] = {
          attended,
          notAttended,
          noResponse: Math.max(0, playerCount - attended - notAttended),
        };
      }
      return result;
    },

    setAttendance: async (
      eventId: string,
      playerId: string,
      attended: boolean
    ): Promise<void> => {
      const { error } = await client!
        .from('event_attendance')
        .upsert(
          { event_id: eventId, player_id: playerId, attended, absence_reason: attended ? null : undefined },
          { onConflict: 'event_id,player_id' }
        );
      if (error) throw new Error(error.message);
    },

    setAttendanceWithReason: async (
      eventId: string,
      playerId: string,
      attended: boolean,
      absenceReason?: string
    ): Promise<void> => {
      const row: Record<string, unknown> = {
        event_id: eventId,
        player_id: playerId,
        attended,
      };
      if (!attended) {
        row.absence_reason = (absenceReason || '').trim() || null;
      } else {
        row.absence_reason = null;
      }
      const { error } = await client!
        .from('event_attendance')
        .upsert(row, { onConflict: 'event_id,player_id' });
      if (error) throw new Error(error.message);
    },

    setBulk: async (
      eventId: string,
      playerIds: string[]
    ): Promise<void> => {
      if (playerIds.length === 0) return;
      const rows = playerIds.map((playerId) => ({
        event_id: eventId,
        player_id: playerId,
        attended: true,
      }));
      const { error } = await client!
        .from('event_attendance')
        .upsert(rows, { onConflict: 'event_id,player_id' });
      if (error) throw new Error(error.message);
    },

    setBulkExact: async (
      eventId: string,
      attendance: { playerId: string; attended: boolean; absenceReason?: string }[]
    ): Promise<void> => {
      if (attendance.length === 0) return;
      await client!.from('event_attendance').delete().eq('event_id', eventId);
      const rows = attendance.map((a) => ({
        event_id: eventId,
        player_id: a.playerId,
        attended: a.attended,
        absence_reason: a.attended ? null : (a.absenceReason || '').trim() || null,
      }));
      const { error } = await client!.from('event_attendance').insert(rows);
      if (error) throw new Error(error.message);
    },
  },

  /** Statistika účasti na tréninzích a výkonnosti na zápasech pro graf */
  getAttendanceVsPerformance: async (
    teamId: string
  ): Promise<
    { playerId: string; playerName: string; attendancePct: number; avgMatchScore: number; trainingCount: number; matchCount: number }[]
  > => {
    const [eventsRes, playersRes, attendanceRes, matchesRes] = await Promise.all([
      client!.from('events').select('id, event_type').eq('team_id', teamId),
      client!.from('players').select('id, name').eq('team_id', teamId),
      client!.from('event_attendance').select('event_id, player_id, attended'),
      client!.from('matches').select('id').eq('team_id', teamId),
    ]);

    const events = eventsRes.data || [];
    const players = playersRes.data || [];
    const attendanceData = attendanceRes.data || [];
    const matchIds = (matchesRes.data || []).map((m) => m.id);

    const trainingEvents = events.filter((e) => e.event_type === 'training');
    const trainingEventIds = new Set(trainingEvents.map((e) => e.id));
    const trainingAttendance = attendanceData.filter((a) =>
      trainingEventIds.has(a.event_id)
    );

    const byPlayer: Record<
      string,
      { trainingAttended: number; trainingTotal: number; matchScores: number[] }
    > = {};
    for (const p of players) {
      byPlayer[p.id] = { trainingAttended: 0, trainingTotal: 0, matchScores: [] };
    }

    for (const t of trainingEvents) {
      const attendedPlayers = new Set(
        trainingAttendance
          .filter((a) => a.event_id === t.id && (a as { attended: boolean }).attended !== false)
          .map((a) => a.player_id)
      );
      for (const p of players) {
        byPlayer[p.id].trainingTotal += 1;
        if (attendedPlayers.has(p.id)) byPlayer[p.id].trainingAttended += 1;
      }
    }

    if (matchIds.length > 0) {
      const { data: ratingsData } = await client!
        .from('ratings')
        .select('rated_player_id, percentage')
        .in('match_id', matchIds);
      for (const r of ratingsData || []) {
        const row = r as { rated_player_id: string; percentage: number };
        if (byPlayer[row.rated_player_id] && row.percentage > 0) {
          // 0 = nebyl nasazen, nepočítá do průměru
          byPlayer[row.rated_player_id].matchScores.push(row.percentage);
        }
      }
    }

    return players.map((p) => {
      const d = byPlayer[p.id];
      const attendancePct =
        d.trainingTotal > 0 ? Math.round((d.trainingAttended / d.trainingTotal) * 100) : 0;
      const avgMatchScore =
        d.matchScores.length > 0
          ? Math.round((d.matchScores.reduce((a, b) => a + b, 0) / d.matchScores.length) * 10) / 10
          : 0;
      return {
        playerId: p.id,
        playerName: p.name,
        attendancePct,
        avgMatchScore,
        trainingCount: d.trainingTotal,
        matchCount: d.matchScores.length,
      };
    });
  },
};
