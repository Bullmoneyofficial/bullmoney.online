'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Package
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { ProductWithDetails } from '@/types/store';

// ============================================================================
// ADMIN PRODUCTS LIST - PRODUCT MANAGEMENT TABLE
// ============================================================================

export function AdminProductsList() {
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const limit = 20;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const response = await fetch(`/api/store/admin/products?${params}`);
      const data = await response.json();

      setProducts(data.data || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await fetch(`/api/store/admin/products/${productId}`, {
        method: 'DELETE',
      });
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl
                     focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="h-11 px-4 bg-white/5 border border-white/10 rounded-xl
                   focus:outline-none focus:border-white/20 appearance-none cursor-pointer"
        >
          <option value="all" className="bg-black">All Status</option>
          <option value="active" className="bg-black">Active</option>
          <option value="inactive" className="bg-black">Inactive</option>
        </select>

        {/* Refresh */}
        <button
          onClick={fetchProducts}
          disabled={loading}
          className="h-11 w-11 flex items-center justify-center bg-white/5 border border-white/10
                   rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>

        {/* Add Product */}
        <Link
          href="/store/admin/products/new"
          className="h-11 px-6 flex items-center gap-2 bg-white text-black rounded-xl font-medium
                   hover:bg-white/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </Link>
      </div>

      {/* Products Grid */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Package className="w-12 h-12 text-white/20 mb-4" />
            <p className="text-white/40 mb-4">No products found</p>
            <Link
              href="/store/admin/products/new"
              className="h-10 px-6 flex items-center gap-2 bg-white text-black rounded-xl text-sm font-medium
                       hover:bg-white/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add your first product
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDelete={() => handleDelete(product.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-white/10">
                <p className="text-white/40 text-sm">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm px-3">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ProductCard({ 
  product, 
  onDelete 
}: { 
  product: ProductWithDetails; 
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const primaryImage = product.images?.find(img => img.is_primary)?.url || product.images?.[0]?.url;
  const totalInventory = product.variants?.reduce((sum, v) => sum + v.inventory_count, 0) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white/5 border border-white/10 rounded-xl overflow-hidden"
    >
      {/* Image */}
      <div className="aspect-square relative">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <Package className="w-12 h-12 text-white/20" />
          </div>
        )}

        {/* Status Badge */}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-medium
          ${product.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}
        `}>
          {product.status}
        </div>

        {/* Actions */}
        <div className="absolute top-2 right-2">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 bg-black/90 rounded-lg hover:bg-black transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-40 bg-black border border-white/10 rounded-xl shadow-xl z-20 py-1">
                <Link
                  href={`/store/product/${product.slug}`}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View
                </Link>
                <Link
                  href={`/store/admin/products/${product.id}/edit`}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-2 text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <h3 className="font-medium truncate">{product.name}</h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">${product.base_price.toFixed(2)}</span>
          <span className={`${totalInventory <= 5 ? 'text-red-400' : 'text-white/40'}`}>
            {totalInventory} in stock
          </span>
        </div>
        {product.variants && (
          <p className="text-xs text-white/40">
            {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </motion.div>
  );
}
