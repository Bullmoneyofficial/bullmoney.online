import { AdminProductUpload } from '@/components/shop/admin/AdminProductUpload';

// Force dynamic rendering to reduce Vercel build time
export const dynamic = 'force-dynamic';


// ============================================================================
// ADMIN NEW PRODUCT PAGE
// ============================================================================

export default function NewProductPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-light">New Product</h1>
        <p className="text-white/40 mt-1">Add a new product to your store</p>
      </div>
      <AdminProductUpload />
    </div>
  );
}
