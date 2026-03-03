import CursorGlow from '@/components/CursorGlow';
import DashboardBackground from '@/components/DashboardBackground';
import FeedbackWidget from '@/components/FeedbackWidget';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <DashboardBackground />
      <CursorGlow />
      <div className="relative z-10">
        {children}
      </div>
      <FeedbackWidget />
    </div>
  );
}
