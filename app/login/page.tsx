'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen animated-background flex items-center justify-center">
        <div className="text-white text-center">
          <p>Načítání...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
