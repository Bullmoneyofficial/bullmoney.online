import { Suspense } from 'react';
import { AdminDashboard } from '@/components/shop/admin/AdminDashboard';

// ============================================================================
// ADMIN DASHBOARD HOME
// ============================================================================

export default function AdminPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AdminDashboard />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-48 bg-white/5 rounded-lg" />
      <div className="grid grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-white/5 rounded-2xl" />
        ))}
      </div>
      <div className="h-96 bg-white/5 rounded-2xl" />
    </div>
  );
}
