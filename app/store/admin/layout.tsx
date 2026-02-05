import type { Metadata } from 'next';
import { AdminSidebar } from '@/components/shop/admin/AdminSidebar';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Bullmoney Store',
  description: 'Manage your store',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <AdminSidebar />
      {/* Mobile: Add top padding for header. Desktop: Add left margin for sidebar */}
      <main className="pt-20 md:pt-8 px-4 md:px-8 md:ml-64 pb-8">
        {children}
      </main>
    </div>
  );
}
