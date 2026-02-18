import bcrypt from 'bcryptjs';
import { supabaseAdmin } from './supabase-server';
import { db } from './db-supabase';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function verifyTeam(identifier: string, password: string) {
  const trimmed = (identifier || '').trim();
  if (!trimmed) return null;

  const client = supabaseAdmin;
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
  const { data: byUsername } = await client.from('teams').select('*').eq('username', trimmed).maybeSingle();
  if (byUsername) row = byUsername as Record<string, unknown>;
  if (!row) {
    const { data: byEmail } = await client.from('teams').select('*').eq('email', trimmed).maybeSingle();
    if (byEmail) row = byEmail as Record<string, unknown>;
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
  if (admin.username !== username) return false;
  return verifyPassword(password, admin.password);
}
