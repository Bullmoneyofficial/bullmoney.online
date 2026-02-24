import { AdminOrdersTable } from '@/components/shop/admin/AdminOrdersTable';

// Force dynamic rendering to reduce Vercel build time
export const dynamic = 'force-dynamic';


// ============================================================================
// ADMIN ORDERS PAGE
// ============================================================================

export default function AdminOrdersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-light">Orders</h1>
        <p className="text-white/40 mt-1">Manage and track customer orders</p>
      </div>
      <AdminOrdersTable />
    </div>
  );
}
