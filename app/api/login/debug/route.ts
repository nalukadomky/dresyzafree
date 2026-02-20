import { NextResponse } from 'next/server';

/**
 * DEBUG: pouze pro vývoj. GET /api/login/debug
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Není k dispozici' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, message: 'Debug endpoint' });
}
