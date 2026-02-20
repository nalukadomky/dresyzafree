import bcrypt from 'bcryptjs';
import { supabaseAdmin } from './supabase-server';
import { supabase } from './supabase';
import { db } from './db-supabase';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

async function fetchTeamRow(trimmed: string, client: any) {
  let row: Record<string, unknown> | null = null;
  let lastError: unknown = null;
  // Použijeme ilike pro shodu bez ohledu na velikost písmen (jako check-reset-team)
  const { data: byUsername, error: errU } = await client
    .from('teams')
    .select('*')
    .ilike('username', trimmed)
    .maybeSingle();
  if (!errU && byUsername) row = byUsername as Record<string, unknown>;
  if (!row) {
    lastError = errU;
    const { data: byEmail, error: errE } = await client
      .from('teams')
      .select('*')
      .ilike('email', trimmed)
      .maybeSingle();
    if (!errE && byEmail) row = byEmail as Record<string, unknown>;
    if (!row) lastError = errE || lastError;
  }
  return { row, error: lastError };
}

export async function verifyTeam(identifier: string, password: string) {
  const trimmed = (identifier || '').trim();
  if (!trimmed) return null;

  const client = supabaseAdmin ?? supabase;
  if (!client) {
    return db.teams.getByUsernameOrEmail(trimmed).then(async (team) => {
      if (!team?.password) return null;
      const ok = await verifyPassword(password, team.password);
      if (!ok) return null;
      const { password: _, ...rest } = team;
      return rest;
    });
  }

  let row: Record<string, unknown> | null = null;
  const { row: r, error } = await fetchTeamRow(trimmed, client);
  row = r;

  // Když admin klient selže (např. "fetch failed" – síť/proxy), zkus anon klienta
  if (!row && error && supabase && supabase !== client) {
    const res = await fetchTeamRow(trimmed, supabase);
    row = res.row;
  }

  if (!row?.password) return null;

  const ok = await verifyPassword(password, String(row.password));
  if (!ok) return null;

  const team = {
    id: row.id,
    teamName: row.teamname ?? row.teamName,
    contactPerson: row.contactperson ?? row.contactPerson,
    phone: row.phone,
    email: row.email,
    leagues: row.leagues ?? [],
    username: row.username,
    createdAt: row.createdat ?? row.createdAt,
    logo: row.logo,
    referrerId: row.referrerid ?? row.referrerId,
    status: row.status,
    numberOfJerseys: row.numberofjerseys ?? row.numberOfJerseys,
    numberOfTariffs: row.numberoftariffs ?? row.numberOfTariffs,
    deadline: row.deadline,
    tariffValidUntil: row.tariffvaliduntil ?? row.tariffValidUntil,
    jerseyUrl: row.jerseyurl ?? row.jerseyUrl,
    shortsUrl: row.shortsurl ?? row.shortsUrl,
    socksUrl: row.socksurl ?? row.socksUrl,
    deliveryAddress: row.deliveryaddress ?? row.deliveryAddress,
    ico: row.ico,
    meetingNote: row.meetingnote ?? row.meetingNote,
    jerseyType: row.jerseytype ?? row.jerseyType,
    backgroundColor: (row.background_color as string) || undefined,
  };
  return team;
}

export async function verifyAdmin(username: string, password: string) {
  const admin = await db.admin.get();
  if (admin.username.toLowerCase() !== username.trim().toLowerCase()) return false;
  return verifyPassword(password, admin.password);
}
