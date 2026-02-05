import { Metadata } from 'next';
import { AdminProductsList } from '@/components/shop/admin/AdminProductsList';

export const metadata: Metadata = {
  title: 'Products | Admin | Bullmoney Store',
  description: 'Manage your products',
};

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light">Products</h1>
          <p className="text-white/40 mt-1">Manage your product catalog</p>
        </div>
      </div>

      <AdminProductsList />
    </div>
  );
}
