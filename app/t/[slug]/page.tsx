'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { PublicWebsiteData } from '@/lib/db-website';
import { TeamWebsite } from '@/components/team-website/TeamWebsite';

export default function PublicTeamWebPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<PublicWebsiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/t/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Web nenalezen');
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-slate-200 mb-4">404</h1>
          <p className="text-slate-500 mb-6">Tento týmový web neexistuje nebo není publikovaný.</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            ← Zpět na MyPitch
          </a>
        </div>
      </div>
    );
  }

  return <TeamWebsite data={data} slug={slug} />;
}
