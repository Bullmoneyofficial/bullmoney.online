'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings,
  BarChart3,
  LogOut,
  Plus,
  Menu,
  X,
  ChevronLeft,
  Home,
  Store
} from 'lucide-react';

// ============================================================================
// ADMIN SIDEBAR - RESPONSIVE GLASS NAVIGATION
// Mobile: Bottom sheet / Full screen
// Desktop: Fixed sidebar
// ============================================================================

const NAV_ITEMS = [
  { href: '/store/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/store/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/store/admin/products', label: 'Products', icon: Package },
  { href: '/store/admin/customers', label: 'Customers', icon: Users },
  { href: '/store/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/store/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBack = () => {
    router.push('/store');
  };

  const handleHome = () => {
    router.push('/');
  };

  const NavContent = ({ onClose }: { onClose?: () => void }) => (
    <>
      {/* Logo */}
      <div className="p-4 md:p-6 border-b border-white/10">
        <Link href="/store/admin" className="flex items-center gap-3" onClick={onClose}>
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
            <span className="text-black font-bold text-lg">B</span>
          </div>
          <div>
            <span className="text-lg font-medium block">Bullmoney</span>
            <span className="text-xs text-white/40">Admin Dashboard</span>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-white/10">
        <Link
          href="/store/admin/products/new"
          onClick={onClose}
          className="w-full h-10 px-4 bg-white text-black rounded-xl font-medium text-sm
                   flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Product
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/store/admin' && pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 h-12 md:h-11 px-4 rounded-xl transition-colors text-sm touch-manipulation
                ${isActive 
                  ? 'bg-white/10 text-white' 
                  : 'text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <Link
          href="/store"
          onClick={onClose}
          className="flex items-center gap-3 h-12 md:h-11 px-4 rounded-xl text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors text-sm"
        >
          <Store className="w-5 h-5" />
          Back to Store
        </Link>
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-3 h-12 md:h-11 px-4 rounded-xl text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors text-sm"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 bg-black border-r border-white/10 flex-col z-[960]">
        <NavContent />
      </aside>

      {/* Mobile Header Bar */}
      {/* Mobile Header Bar - No blur, high z-index */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-black border-b border-white/10 z-[970] flex items-center justify-between px-4">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Title */}
        <Link href="/store/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <span className="text-black font-bold text-sm">B</span>
          </div>
          <span className="font-medium">Admin</span>
        </Link>

        {/* Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Menu - Rendered via Portal */}
      {mounted && createPortal(
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden fixed inset-0 bg-black/70"
                style={{ zIndex: 2147483648 }}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="md:hidden fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-black border-r border-white/10 flex flex-col"
                style={{ zIndex: 2147483649 }}
              >
              {/* Close Button */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <NavContent onClose={() => setMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>,
        document.body
      )}
    </>
  );
}
