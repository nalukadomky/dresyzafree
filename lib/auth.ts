import bcrypt from 'bcryptjs';
import { db } from './db-supabase';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function verifyTeam(identifier: string, password: string) {
  // Zkusíme najít tým podle username nebo email
  const team = await db.teams.getByUsernameOrEmail(identifier);
  if (!team) return null;
  
  const isValid = await verifyPassword(password, team.password);
  if (!isValid) return null;
  
  // Vrátíme tým bez hesla
  const { password: _, ...teamWithoutPassword } = team;
  return teamWithoutPassword;
}

export async function verifyAdmin(username: string, password: string) {
  const admin = await db.admin.get();
  if (admin.username !== username) return false;
  
  return verifyPassword(password, admin.password);
}

