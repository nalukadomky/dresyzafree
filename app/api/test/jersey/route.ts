import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

const BUCKET = 'team-jersey-templates';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ url: null, exists: false });
    }

    const { data: files, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .list('', { limit: 10 });

    if (error || !files) {
      return NextResponse.json({ url: null, exists: false });
    }

    const jersey = files.find((f) => f.name.startsWith('default-jersey'));
    if (!jersey) {
      return NextResponse.json({ url: null, exists: false });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(jersey.name);

    return NextResponse.json({
      url: urlData.publicUrl,
      exists: true,
    });
  } catch {
    return NextResponse.json({ url: null, exists: false });
  }
}
