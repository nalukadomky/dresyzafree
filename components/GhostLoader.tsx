'use client';

type GhostBlockProps = {
  className?: string;
};

export function GhostBlock({ className = '' }: GhostBlockProps) {
  return <div className={`ghost ${className}`.trim()} aria-hidden="true" />;
}

export function GhostAuthCard() {
  return (
    <div className="w-full max-w-md glass-card rounded-2xl p-8 md:p-12 space-y-5">
      <GhostBlock className="h-8 w-3/4 mx-auto rounded-xl" />
      <GhostBlock className="h-4 w-2/3 mx-auto rounded-lg" />
      <div className="pt-2 space-y-4">
        <GhostBlock className="h-12 w-full rounded-xl" />
        <GhostBlock className="h-12 w-full rounded-xl" />
        <GhostBlock className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function GhostDashboard() {
  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <GhostBlock className="h-10 w-1/2 rounded-xl mb-3" />
        <GhostBlock className="h-4 w-2/3 rounded-lg" />
      </div>
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <GhostBlock className="h-7 w-48 rounded-lg mb-4" />
        <GhostBlock className="h-4 w-full rounded-lg mb-2" />
        <GhostBlock className="h-4 w-5/6 rounded-lg mb-6" />
        <GhostBlock className="h-12 w-56 rounded-xl" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="glass-card rounded-2xl p-6">
          <GhostBlock className="h-6 w-32 rounded-lg mb-4" />
          <GhostBlock className="h-16 w-full rounded-xl" />
        </div>
        <div className="glass-card rounded-2xl p-6">
          <GhostBlock className="h-6 w-32 rounded-lg mb-4" />
          <GhostBlock className="h-16 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function GhostAdmin() {
  return (
    <div className="w-full max-w-7xl space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <GhostBlock className="h-10 w-64 rounded-xl mb-4" />
        <div className="grid gap-4 md:grid-cols-3">
          <GhostBlock className="h-11 w-full rounded-xl" />
          <GhostBlock className="h-11 w-full rounded-xl" />
          <GhostBlock className="h-11 w-full rounded-xl" />
        </div>
      </div>
      <div className="glass-card rounded-2xl p-6">
        <GhostBlock className="h-10 w-full rounded-xl mb-3" />
        <GhostBlock className="h-10 w-full rounded-xl mb-3" />
        <GhostBlock className="h-10 w-full rounded-xl mb-3" />
        <GhostBlock className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function GhostEvent() {
  return (
    <div className="w-full max-w-lg space-y-6">
      <div className="glass-card rounded-2xl p-6 space-y-3">
        <GhostBlock className="h-8 w-4/5 rounded-lg" />
        <GhostBlock className="h-5 w-3/4 rounded-lg" />
      </div>
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <GhostBlock className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          <GhostBlock className="h-11 w-full rounded-xl" />
          <GhostBlock className="h-11 w-full rounded-xl" />
        </div>
        <GhostBlock className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function GhostHodnoceni() {
  return (
    <div className="w-full max-w-7xl pt-12 sm:pt-14 space-y-6">
      <GhostBlock className="h-8 w-56 rounded-xl" />
      <div className="flex gap-2 overflow-hidden">
        <GhostBlock className="h-10 w-28 rounded-xl" />
        <GhostBlock className="h-10 w-28 rounded-xl" />
        <GhostBlock className="h-10 w-28 rounded-xl" />
        <GhostBlock className="h-10 w-28 rounded-xl" />
      </div>
      <div className="glass-card rounded-2xl p-6">
        <GhostBlock className="h-6 w-64 rounded-lg mb-4" />
        <GhostBlock className="h-11 w-full rounded-xl mb-3" />
        <GhostBlock className="h-11 w-full rounded-xl mb-3" />
        <GhostBlock className="h-40 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function GhostOverviewCards() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
      <div className="glass-card rounded-2xl p-4 sm:p-6 col-span-full">
        <GhostBlock className="h-7 w-64 rounded-lg mb-4" />
        <GhostBlock className="h-5 w-3/4 rounded-lg mb-3" />
        <GhostBlock className="h-6 w-1/2 rounded-lg mb-2" />
        <GhostBlock className="h-5 w-56 rounded-lg" />
      </div>

      <div className="glass-card rounded-2xl p-4 sm:p-6">
        <GhostBlock className="h-6 w-48 rounded-lg mb-4" />
        <GhostBlock className="h-12 w-full rounded-xl mb-3" />
        <GhostBlock className="h-12 w-full rounded-xl mb-3" />
        <GhostBlock className="h-12 w-5/6 rounded-xl" />
      </div>

      <div className="glass-card rounded-2xl p-4 sm:p-6 lg:col-span-2 xl:col-span-2">
        <GhostBlock className="h-6 w-56 rounded-lg mb-3" />
        <GhostBlock className="h-4 w-3/4 rounded-lg mb-5" />
        <GhostBlock className="h-3 w-full rounded-full mb-5" />
        <GhostBlock className="h-3 w-full rounded-full mb-3" />
        <GhostBlock className="h-3 w-11/12 rounded-full mb-3" />
        <GhostBlock className="h-3 w-10/12 rounded-full mb-3" />
        <GhostBlock className="h-3 w-9/12 rounded-full" />
      </div>
    </div>
  );
}
