export default function DashboardBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Deep gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020515] via-[#040a1a] to-[#010208]" />

      {/* Radial depth layers */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 30% 40%, rgba(15,23,60,0.6) 0%, transparent 70%)' }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 50% 50% at 80% 70%, rgba(10,15,40,0.5) 0%, transparent 60%)' }}
      />

      {/* Fine 80×80 grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(59,130,246,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.4) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Diagonal thin lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" preserveAspectRatio="none">
        <line x1="0%" y1="100%" x2="60%" y2="0%" stroke="rgba(59,130,246,0.6)" strokeWidth="0.5" />
        <line x1="20%" y1="100%" x2="80%" y2="0%" stroke="rgba(59,130,246,0.4)" strokeWidth="0.5" />
        <line x1="40%" y1="100%" x2="100%" y2="0%" stroke="rgba(59,130,246,0.6)" strokeWidth="0.5" />
        <line x1="60%" y1="100%" x2="100%" y2="20%" stroke="rgba(59,130,246,0.3)" strokeWidth="0.5" />
        <line x1="0%" y1="80%" x2="40%" y2="0%" stroke="rgba(59,130,246,0.3)" strokeWidth="0.5" />
      </svg>

      {/* Horizontal accent lines */}
      <div className="absolute top-[30%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/[0.08] to-transparent" />
      <div className="absolute top-[60%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/[0.06] to-transparent" />
      <div className="absolute top-[85%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/[0.05] to-transparent" />

      {/* Vertical accent lines */}
      <div className="absolute top-0 bottom-0 left-[25%] w-px bg-gradient-to-b from-transparent via-blue-500/[0.06] to-transparent" />
      <div className="absolute top-0 bottom-0 left-[65%] w-px bg-gradient-to-b from-transparent via-blue-400/[0.04] to-transparent" />
    </div>
  );
}
