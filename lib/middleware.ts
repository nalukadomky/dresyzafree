import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/** V produkci nesmí chybět JWT_SECRET nebo být defaultní hodnota. */
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
    console.error('JWT_SECRET chybí nebo je nebezpečná defaultní hodnota! Nastavte ho v Environment Variables na Vercelu.');
  }
}

export interface AuthUser {
  id?: string;
  username: string;
  type: 'team' | 'admin';
}

export function verifyToken(request: NextRequest): AuthUser | null {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  return request.headers.get('authorization')?.replace('Bearer ', '') || null;
}

