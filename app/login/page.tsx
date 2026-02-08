'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Přesměrování na správnou stránku podle parametru
  useEffect(() => {
    if (searchParams.get('admin') === 'true') {
      router.replace('/login/admin');
    } else {
      router.replace('/login/team');
    }
  }, [searchParams, router]);
  return (
    <div className="min-h-screen animated-background flex items-center justify-center">
      <div className="text-white text-center">
        <p>Přesměrovávám...</p>
      </div>
    </div>
  );
}

